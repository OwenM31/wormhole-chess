import type {
  PieceColor,
  Square,
  EmpoweredMove,
  AiDifficulty,
  PositionEvaluation,
  BestTurnResult,
  AiSearchOptions,
} from '../types/deckChess';
import { DeckChessEngine } from './DeckChessEngine';
import { Move, PieceSymbol } from 'chess.js';
import { getCardById } from './cardGraph';
import { getCardHandler, FriendlyPieceSummary } from './cards/cardRegistry';

export type { BestTurnResult, AiSearchOptions };

/**
 * 32-bit deterministic seeded pseudo-random number generator (Mulberry32).
 * Returns floats in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Base piece values in centipawns
export const MATERIAL_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

/**
 * Parameterized Evaluation Weights (Tunable via Self-Play SPSA / Evolutionary Optimization)
 */
export interface EvalParams {
  retentionByClass: {
    pawn: number;
    knight: number;
    bishop: number;
    rook: number;
    queen: number;
    king: number;
  };
  /** Bonus fraction on each Knight/Bishop/Rook card when 2+ anchors are alive (lost when dropping 2 -> 1) */
  spareAnchorBonusPct: number;
  /** Standard chess Bishop Pair bonus (in centipawns) */
  bishopPairBonus: number;
  /** Controls hyperbolic non-linear scarcity curve for Pawns (8 -> 1) */
  pawnScarcityAlpha: number;
  /** Fraction of an orphaned card's value retained if revivable via Rank-7 pawn promotion or K2 in hand */
  revivalRank7Factor: number;
  /** Fraction of an orphaned card's value retained if revivable via Rank-6 pawn promotion */
  revivalRank6Factor: number;
  /** Bonus when a card in hand is legally playable right now */
  primedCardBonus: number;
  /** Bonus when a card in hand threatens a legal capture right now */
  primedCaptureBonus: number;
  /** Multiplier on modular card-handler evaluateSetup() heuristics */
  setupWeight: number;
  /** Centipawn penalty for repeating a previously visited board position */
  repetitionContempt: number;
}

export const DEFAULT_EVAL_PARAMS: EvalParams = {
  retentionByClass: {
    pawn: 55,
    knight: 70,
    bishop: 70,
    rook: 85,
    queen: 100,
    king: 100,
  },
  spareAnchorBonusPct: 0.30,
  bishopPairBonus: 30,
  pawnScarcityAlpha: 0.90,
  revivalRank7Factor: 0.55,
  revivalRank6Factor: 0.25,
  primedCardBonus: 22,
  primedCaptureBonus: 35,
  setupWeight: 1.0,
  repetitionContempt: 45,
};

// Piece-Square Tables (PST) from Tomasz Michniewski
// Row 0 = Rank 8 (opponent back rank from White's POV), Row 7 = Rank 1 (White's home back rank)
const PAWN_PST = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_PST = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_PST = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_PST = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];

const QUEEN_PST = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

export const KING_MIDGAME_PST = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

export const KING_ENDGAME_PST = [
  [-50, -40, -30, -20, -20, -30, -40, -50],
  [-30, -20, -10, 0, 0, -10, -20, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -30, 0, 0, 0, 0, -30, -30],
  [-50, -30, -30, -30, -30, -30, -30, -50],
];

export const PST_MAP: Record<string, number[][]> = {
  p: PAWN_PST,
  n: KNIGHT_PST,
  b: BISHOP_PST,
  r: ROOK_PST,
  q: QUEEN_PST,
  k: KING_MIDGAME_PST,
};

/**
 * Class-weighted intrinsic retention value per unspent card in hand.
 */
export function getCardRetentionValue(
  cardId: string,
  params: EvalParams = DEFAULT_EVAL_PARAMS
): number {
  const card = getCardById(cardId);
  if (!card) return 60;
  return params.retentionByClass[card.anchor] ?? 60;
}

function anchorToPieceSymbol(anchor: string): PieceSymbol {
  switch (anchor) {
    case 'pawn':
      return 'p';
    case 'knight':
      return 'n';
    case 'bishop':
      return 'b';
    case 'rook':
      return 'r';
    case 'queen':
      return 'q';
    default:
      return 'k';
  }
}

/**
 * Evaluates Non-Linear Piece Scarcity, Card Orphaning, and Promotion/Spawn Revival.
 *
 * Key properties:
 * 1. If anchor count < handler.minAnchorsRequired (e.g. 0 Queens for a Queen card, or 1 Rook for R4),
 *    the card is ORPHANED: its value collapses to 0cp unless revivable via a Rank 6/7 pawn promotion
 *    or a spawn/promotion card in hand (such as K2 Royal Knighting).
 * 2. For 1-of-2 piece classes (Knight, Bishop, Rook), having 2 alive grants a spare-anchor flexibility
 *    bonus (+30%), so losing 2 -> 1 costs a moderate penalty while losing 1 -> 0 loses the entire card value.
 * 3. For Pawns (up to 8), scarcity follows a hyperbolic curve: losing 8 -> 7 costs ~1cp per Pawn card,
 *    while losing down to the last 1-2 pawns costs the bulk of the card's value.
 */
export function evaluateCardScarcityAndHand(
  friendlyPieces: FriendlyPieceSummary[],
  hand: string[],
  color: PieceColor,
  params: EvalParams = DEFAULT_EVAL_PARAMS,
  turnNumber: number = 1
): number {
  if (hand.length === 0) return 0;
  const decay = Math.max(0.25, 1 - (turnNumber - 1) / 42);

  const counts: Record<PieceSymbol, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
  let hasRank7Pawn = false;
  let hasRank6Pawn = false;

  for (const p of friendlyPieces) {
    counts[p.type]++;
    if (p.type === 'p') {
      const relRank = color === 'w' ? p.rank : 7 - p.rank;
      if (relRank === 6) hasRank7Pawn = true; // 0-indexed rank 6 = Rank 7 (1 step from promotion)
      else if (relRank === 5) hasRank6Pawn = true; // 0-indexed rank 5 = Rank 6
    }
  }

  // Detect if hand contains any playable card that spawns/promotes a piece type (e.g. K2 -> 'n')
  const revivableByCard = new Set<PieceSymbol>();
  for (const cid of hand) {
    const cDef = getCardById(cid);
    const h = getCardHandler(cid);
    if (cDef && h?.spawnsPieceType) {
      const spawnerAnchor = anchorToPieceSymbol(cDef.anchor);
      if (counts[spawnerAnchor] >= (h.minAnchorsRequired ?? 1)) {
        // K2 also needs at least 1 pawn on board to knight
        if (h.spawnsPieceType !== 'n' || counts.p > 0) {
          revivableByCard.add(h.spawnsPieceType);
        }
      }
    }
  }

  let totalHandValue = 0;

  for (const cardId of hand) {
    const card = getCardById(cardId);
    if (!card) continue;
    const handler = getCardHandler(cardId);
    let baseVal = getCardRetentionValue(cardId, params);

    // Per-card retention tuning: tempo, setup & situational response cards should not be hoarded
    if (cardId === 'p3_follow_me') {
      baseVal = Math.round(baseVal * 0.20);
    } else if (
      cardId === 'p1_sidestep' ||
      cardId === 'p5_get_behind_me' ||
      cardId === 'p6_tag_out' ||
      cardId === 'n5_get_to_the_king' ||
      cardId === 'n6_flanking_support' ||
      cardId === 'b4_change_color' ||
      cardId === 'b5_take_my_place' ||
      cardId === 'r2_ive_got_your_back' ||
      cardId === 'q1_royal_summons' ||
      cardId === 'q4_one_fell_swoop'
    ) {
      baseVal = Math.round(baseVal * 0.35);
    }

    const anchorType = anchorToPieceSymbol(card.anchor);
    const minReq = handler?.minAnchorsRequired ?? 1;
    const alive = counts[anchorType];

    let cardScore = 0;
    if (alive < minReq) {
      // Card is currently ORPHANED (missing required anchor piece(s))
      const deficit = minReq - alive;
      let revivalFactor = 0;

      if (deficit === 1) {
        if (revivableByCard.has(anchorType)) {
          revivalFactor = Math.max(revivalFactor, params.revivalRank7Factor);
        }
        if (anchorType === 'q' || anchorType === 'r' || anchorType === 'b' || anchorType === 'n') {
          if (hasRank7Pawn) {
            revivalFactor = Math.max(revivalFactor, params.revivalRank7Factor);
          } else if (hasRank6Pawn) {
            revivalFactor = Math.max(revivalFactor, params.revivalRank6Factor);
          }
        }
      }

      cardScore = Math.round(baseVal * revivalFactor);
    } else if (anchorType === 'p') {
      // Non-linear hyperbolic scarcity curve for Pawns (normalized so n = 8 - minReq + 1 is 1.0)
      const surplus = alive - minReq + 1; // 1..8
      const maxSurplus = 8 - minReq + 1;
      const rawUtility = 1 - params.pawnScarcityAlpha / Math.pow(surplus + 0.65, 1.8);
      const normUtility = 1 - params.pawnScarcityAlpha / Math.pow(maxSurplus + 0.65, 1.8);
      const ratio = Math.min(1, Math.max(0.25, rawUtility / normUtility));
      cardScore = Math.round(baseVal * ratio);
    } else if (anchorType === 'n' || anchorType === 'b' || anchorType === 'r') {
      if (minReq >= 2) {
        // Pair-dependent card (R4, N6) with 2+ pieces alive
        cardScore = Math.round(baseVal * (1 + params.spareAnchorBonusPct));
      } else if (alive >= 2) {
        // Single-anchor card with 2 pieces alive (spare anchor flexibility bonus)
        cardScore = Math.round(baseVal * (1 + params.spareAnchorBonusPct));
      } else {
        // Down to last surviving Knight/Bishop/Rook (1 -> 0 brink)
        cardScore = baseVal;
      }
    } else {
      // Queen or King (1-of-1 piece)
      cardScore = baseVal;
    }

    totalHandValue += Math.round(cardScore * decay);
  }

  return totalHandValue;
}

/**
 * Evaluates tactical hand synergy & modular handler pre-condition setup.
 * Zero hardcoded card IDs: delegates directly to each card's registered CardBehaviorHandler.
 */
export function evaluateHandSynergy(
  engine: DeckChessEngine,
  color: PieceColor,
  params: EvalParams = DEFAULT_EVAL_PARAMS,
  precomputedPieces?: FriendlyPieceSummary[]
): number {
  const hand = engine.getHandForColor(color);
  if (hand.length === 0) return 0;
  const uniqueCards = Array.from(new Set(hand));
  let synergy = 0;

  let friendlyPieces = precomputedPieces;
  if (!friendlyPieces) {
    const board = engine.getBoard();
    friendlyPieces = [];
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = board[r][f];
        if (!p || p.color !== color) continue;
        const rankIdx = 7 - r;
        const sq = DeckChessEngine.coordsToSquare(f, rankIdx);
        if (sq) {
          friendlyPieces.push({ sq, type: p.type, file: f, rank: rankIdx });
        }
      }
    }
  }

  for (const cardId of uniqueCards) {
    const handler = getCardHandler(cardId);
    if (handler?.evaluateSetup) {
      // Scale setup synergy to prevent double-tax when cards are played
      const rawBonus = handler.evaluateSetup(friendlyPieces, color);
      synergy += Math.round(rawBonus * params.setupWeight * 0.35);
    }
  }

  return synergy;
}

/**
 * Static position evaluation for AI.
 * Returns score from perspective of `povColor` (positive = favorable for povColor).
 */
export function evaluateBoard(
  engine: DeckChessEngine,
  povColor: PieceColor,
  depthRemaining: number = 0,
  params: EvalParams = DEFAULT_EVAL_PARAMS,
  fastMode: boolean = false
): number {
  if (fastMode) {
    if (engine.inCheck() && engine.isCheckmate()) {
      const winner = engine.getTurn() === 'w' ? 'b' : 'w';
      return winner === povColor
        ? 100000 + depthRemaining * 100
        : -100000 - depthRemaining * 100;
    }
    if (
      engine.getPositionRepeatCount() >= 3 ||
      engine.getInternalChess().isInsufficientMaterial()
    ) {
      return 0;
    }
  } else {
    if (engine.isCheckmate()) {
      const winner = engine.getWinner();
      return winner === povColor
        ? 100000 + depthRemaining * 100
        : -100000 - depthRemaining * 100;
    }

    if (engine.isDraw() || engine.isStalemate()) {
      return 0;
    }
  }

  let whiteScore = 0;
  const board = engine.getBoard();

  const whitePieces: FriendlyPieceSummary[] = [];
  const blackPieces: FriendlyPieceSummary[] = [];
  let nonPawnMaterial = 0;
  let whiteBishops = 0;
  let blackBishops = 0;

  let wk_r = -1;
  let wk_f = -1;
  let bk_r = -1;
  let bk_f = -1;

  // Single-pass over all 64 squares: accumulate pieces, non-king material + PST, and king locations
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece) continue;
      const rankFrom1 = 7 - r;
      const sq = (piece.square as Square) || DeckChessEngine.coordsToSquare(f, rankFrom1);
      const type = piece.type;
      const isWhite = piece.color === 'w';

      if (sq) {
        if (isWhite) {
          whitePieces.push({ sq, type, file: f, rank: rankFrom1 });
          if (type === 'b') whiteBishops++;
        } else {
          blackPieces.push({ sq, type, file: f, rank: rankFrom1 });
          if (type === 'b') blackBishops++;
        }
      }

      if (type === 'k') {
        if (isWhite) {
          wk_r = r;
          wk_f = f;
        } else {
          bk_r = r;
          bk_f = f;
        }
      } else {
        const baseVal = MATERIAL_VALUES[type] || 0;
        if (type !== 'p') {
          nonPawnMaterial += baseVal;
        }
        const pstRow = isWhite ? r : 7 - r;
        const pstVal = PST_MAP[type]?.[pstRow]?.[f] || 0;
        const totalPieceVal = baseVal + pstVal;
        if (isWhite) {
          whiteScore += totalPieceVal;
        } else {
          whiteScore -= totalPieceVal;
        }
      }
    }
  }

  // King PST evaluation based on endgame detection
  const isEndgame = nonPawnMaterial <= 2600;
  const kingPst = isEndgame ? KING_ENDGAME_PST : KING_MIDGAME_PST;
  if (wk_r !== -1) {
    whiteScore += 20000 + (kingPst[wk_r]?.[wk_f] || 0);
  }
  if (bk_r !== -1) {
    whiteScore -= (20000 + (kingPst[7 - bk_r]?.[bk_f] || 0));
  }

  // Bishop pair bonus
  if (whiteBishops >= 2) whiteScore += params.bishopPairBonus;
  if (blackBishops >= 2) whiteScore -= params.bishopPairBonus;

  // Center pawn duo bonus (d4+e4 for White, d5+e5 for Black)
  const whiteHasD4 = board[4][3]?.type === 'p' && board[4][3]?.color === 'w';
  const whiteHasE4 = board[4][4]?.type === 'p' && board[4][4]?.color === 'w';
  if (whiteHasD4 && whiteHasE4) whiteScore += 28;

  const blackHasD5 = board[3][3]?.type === 'p' && board[3][3]?.color === 'b';
  const blackHasE5 = board[3][4]?.type === 'p' && board[3][4]?.color === 'b';
  if (blackHasD5 && blackHasE5) whiteScore -= 28;

  // 2. Active Shields
  for (const mod of engine.getActiveModifiers()) {
    if (mod.type === 'shield') {
      if (mod.ownerColor === 'w') whiteScore += 50;
      else whiteScore -= 50;
    }
  }

  // 3. Non-Linear Card Scarcity, Orphaning & Revival Valuation
  const turnNumber = engine.getTurnNumber();
  const whiteScarcityVal = evaluateCardScarcityAndHand(
    whitePieces,
    engine.getWhiteHand(),
    'w',
    params,
    turnNumber
  );
  const blackScarcityVal = evaluateCardScarcityAndHand(
    blackPieces,
    engine.getBlackHand(),
    'b',
    params,
    turnNumber
  );
  whiteScore += whiteScarcityVal - blackScarcityVal;

  // 4. Modular Hand Synergy & Pre-Condition Setup
  const whiteSynergy = evaluateHandSynergy(engine, 'w', params, whitePieces);
  const blackSynergy = evaluateHandSynergy(engine, 'b', params, blackPieces);
  whiteScore += whiteSynergy - blackSynergy;

  return povColor === 'w' ? whiteScore : -whiteScore;
}

/**
 * Computes live position evaluation and win percentage.
 * Sigmoid mapping: P_white(c) = clamp(50 + 50 * (2 / (1 + exp(-0.0035 * c)) - 1), 3, 97)
 */
export function evaluatePosition(
  engine: DeckChessEngine,
  params: EvalParams = DEFAULT_EVAL_PARAMS
): PositionEvaluation {
  if (engine.isGameOver()) {
    const winner = engine.getWinner();
    if (winner === 'w') {
      return { whiteCp: 100000, whiteWinPct: 100, displayLabel: '1-0', mateIn: 0 };
    } else if (winner === 'b') {
      return { whiteCp: -100000, whiteWinPct: 0, displayLabel: '0-1', mateIn: 0 };
    } else {
      return { whiteCp: 0, whiteWinPct: 50, displayLabel: '1/2-1/2' };
    }
  }

  const whiteCp = evaluateBoard(engine, 'w', 0, params, false);

  const expVal = Math.exp(-0.0035 * whiteCp);
  const rawWinPct = 50 + 50 * (2 / (1 + expVal) - 1);
  const whiteWinPct = Math.min(97, Math.max(3, Math.round(rawWinPct * 10) / 10));

  let displayLabel: string;
  if (whiteCp >= 90000) {
    displayLabel = '+M';
  } else if (whiteCp <= -90000) {
    displayLabel = '-M';
  } else {
    const cpInPawns = (whiteCp / 100).toFixed(1);
    if (whiteCp > 0) {
      displayLabel = `+${cpInPawns}`;
    } else if (cpInPawns === '-0.0' || cpInPawns === '0.0') {
      displayLabel = '0.0';
    } else {
      displayLabel = cpInPawns;
    }
  }

  return {
    whiteCp,
    whiteWinPct,
    displayLabel,
  };
}

interface CandidateAction {
  type: 'standard' | 'empowered';
  move?: Move;
  empoweredMove?: EmpoweredMove;
  orderScore: number;
}

function candidateKey(c: CandidateAction): string {
  if (c.type === 'empowered' && c.empoweredMove) {
    const em = c.empoweredMove;
    return `e:${em.cardId}:${em.from}-${em.to}:${em.extraSquare || ''}:${em.promotion || ''}`;
  }
  if (c.move) {
    return `s:${c.move.from}-${c.move.to}:${c.move.promotion || ''}`;
  }
  return '';
}

function getStandardCandidates(engine: DeckChessEngine): CandidateAction[] {
  const candidates: CandidateAction[] = [];
  const legalMoves = engine.getLegalMoves();
  for (const m of legalMoves) {
    let orderScore = 0;
    if (m.captured) {
      orderScore += 1000 + (MATERIAL_VALUES[m.captured] || 50) * 10 - (MATERIAL_VALUES[m.piece] || 10);
    }
    if (m.promotion) {
      orderScore += 900 + (MATERIAL_VALUES[m.promotion] || 300);
    }
    if (m.san.includes('+')) {
      orderScore += 350;
    }
    const toCoords = DeckChessEngine.squareToCoords(m.to);
    if (toCoords.file >= 2 && toCoords.file <= 5 && toCoords.rank >= 2 && toCoords.rank <= 5) {
      orderScore += 25;
    }
    candidates.push({ type: 'standard', move: m, orderScore });
  }
  candidates.sort((a, b) => b.orderScore - a.orderScore);
  return candidates;
}

function getEmpoweredCandidates(
  engine: DeckChessEngine,
  color: PieceColor,
  isRootNode: boolean = false
): CandidateAction[] {
  if (engine.hasPlayedCardThisTurn()) return [];
  const empMoves = engine.getEmpoweredMoves(undefined, true, isRootNode);
  const cardCandidates: CandidateAction[] = [];

  for (const em of empMoves) {
    const destPiece = engine.getPiece(em.to);
    let orderScore = 150;
    const isCapture = Boolean(destPiece && destPiece.color !== color) || em.actionType === 'ranged_capture';
    if (isCapture) {
      const victimVal = destPiece ? MATERIAL_VALUES[destPiece.type] || 100 : 250;
      orderScore = 1300 + victimVal * 10;
    }
    if (em.promotion) {
      orderScore += 850 + (MATERIAL_VALUES[em.promotion] || 300);
    }
    if (em.actionType === 'spawn' || em.cardId === 'k2_royal_knighting') {
      orderScore += 450;
    }
    const toCoords = DeckChessEngine.squareToCoords(em.to);
    const relRank = color === 'w' ? toCoords.rank : 7 - toCoords.rank;
    orderScore += relRank * 12;
    cardCandidates.push({ type: 'empowered', empoweredMove: em, orderScore });
  }

  cardCandidates.sort((a, b) => b.orderScore - a.orderScore);
  if (isRootNode) return cardCandidates;

  const filtered: CandidateAction[] = [];
  const limit = Math.min(cardCandidates.length, 5);
  for (let i = 0; i < cardCandidates.length; i++) {
    if (i < limit || cardCandidates[i].orderScore >= 400) {
      filtered.push(cardCandidates[i]);
    }
  }
  return filtered;
}

function getCandidateActions(
  engine: DeckChessEngine,
  includeCards: boolean,
  color: PieceColor,
  isRootNode: boolean = false
): CandidateAction[] {
  const candidates = getStandardCandidates(engine);
  if (includeCards) {
    candidates.push(...getEmpoweredCandidates(engine, color, isRootNode));
    candidates.sort((a, b) => b.orderScore - a.orderScore);
  }
  return candidates;
}

/**
 * Capture Quiescence Search to prevent horizon-effect blunders at depth 0.
 */
function quiescence(
  engine: DeckChessEngine,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  povColor: PieceColor,
  qDepth: number,
  params: EvalParams
): number {
  const standPat = evaluateBoard(engine, povColor, 0, params, true);
  if (Math.abs(standPat) >= 90000 || qDepth <= 0) {
    return standPat;
  }

  if (isMaximizing) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;

    const tacticalMoves = engine
      .getLegalMoves()
      .filter((m) => m.captured || m.promotion)
      .sort(
        (a, b) =>
          (MATERIAL_VALUES[b.captured || 'p'] || 100) * 10 -
          (MATERIAL_VALUES[b.piece] || 100) -
          ((MATERIAL_VALUES[a.captured || 'p'] || 100) * 10 - (MATERIAL_VALUES[a.piece] || 100))
      );

    for (const m of tacticalMoves) {
      // Delta pruning: if even capturing +200cp margin cannot raise standPat to alpha, skip
      const gain =
        (m.captured ? MATERIAL_VALUES[m.captured] || 100 : 0) +
        (m.promotion ? MATERIAL_VALUES[m.promotion] || 800 : 0) +
        220;
      if (standPat + gain < alpha) continue;

      const clone = engine.clone();
      const res = clone.makeMove({ from: m.from, to: m.to, promotion: m.promotion }, true);
      if (!res.success) continue;

      const score = quiescence(clone, alpha, beta, false, povColor, qDepth - 1, params);
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;

    const tacticalMoves = engine
      .getLegalMoves()
      .filter((m) => m.captured || m.promotion)
      .sort(
        (a, b) =>
          (MATERIAL_VALUES[b.captured || 'p'] || 100) * 10 -
          (MATERIAL_VALUES[b.piece] || 100) -
          ((MATERIAL_VALUES[a.captured || 'p'] || 100) * 10 - (MATERIAL_VALUES[a.piece] || 100))
      );

    for (const m of tacticalMoves) {
      const gain =
        (m.captured ? MATERIAL_VALUES[m.captured] || 100 : 0) +
        (m.promotion ? MATERIAL_VALUES[m.promotion] || 800 : 0) +
        220;
      if (standPat - gain > beta) continue;

      const clone = engine.clone();
      const res = clone.makeMove({ from: m.from, to: m.to, promotion: m.promotion }, true);
      if (!res.success) continue;

      const score = quiescence(clone, alpha, beta, true, povColor, qDepth - 1, params);
      if (score <= alpha) return alpha;
      if (score < beta) beta = score;
    }
    return beta;
  }
}

interface TTEntry {
  depth: number;
  score: number;
  flag: 'EXACT' | 'LOWERBOUND' | 'UPPERBOUND';
  bestMoveKey?: string;
}

/**
 * Minimax search with Alpha-Beta pruning, Multi-Ply Card Search, Repetition Contempt & Quiescence.
 */
export function minimax(
  engine: DeckChessEngine,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  povColor: PieceColor,
  includeCards: boolean = true,
  params: EvalParams = DEFAULT_EVAL_PARAMS,
  tt?: Map<string, TTEntry>,
  lastMoveTarget?: Square,
  wasTactical?: boolean
): { score: number; move?: Move; empoweredMove?: EmpoweredMove } {
  if (
    engine.getPositionRepeatCount() >= 3 ||
    engine.getInternalChess().isInsufficientMaterial()
  ) {
    return { score: 0 };
  }

  if (depth <= 0) {
    const sideToMove = engine.getTurn();
    const targetUnderFire =
      lastMoveTarget && engine.getInternalChess().isAttacked(lastMoveTarget, sideToMove);
    if (wasTactical || targetUnderFire) {
      return { score: quiescence(engine, alpha, beta, isMaximizing, povColor, 1, params) };
    }
    return { score: evaluateBoard(engine, povColor, 0, params, true) };
  }

  const ttKey = tt
    ? `${engine.getPositionKey()}|${engine.getWhiteHand().join(',')}|${engine.getBlackHand().join(',')}|${isMaximizing ? 1 : 0}`
    : '';
  let ttCachedBestMoveKey: string | undefined;
  if (tt && ttKey) {
    const cached = tt.get(ttKey);
    if (cached) {
      ttCachedBestMoveKey = cached.bestMoveKey;
      if (cached.depth >= depth) {
        if (cached.flag === 'EXACT') return { score: cached.score };
        if (cached.flag === 'LOWERBOUND') alpha = Math.max(alpha, cached.score);
        else if (cached.flag === 'UPPERBOUND') beta = Math.min(beta, cached.score);
        if (alpha >= beta) return { score: cached.score };
      }
    }
  }

  const origAlpha = alpha;
  const origBeta = beta;
  const currentTurn = engine.getTurn();
  const stdCandidates = getStandardCandidates(engine);

  // TT Move Ordering: Prioritize the previously best candidate to accelerate alpha-beta cutoffs
  if (ttCachedBestMoveKey) {
    for (const c of stdCandidates) {
      if (candidateKey(c) === ttCachedBestMoveKey) {
        c.orderScore += 10000;
        break;
      }
    }
    stdCandidates.sort((a, b) => b.orderScore - a.orderScore);
  }

  if (stdCandidates.length === 0) {
    const empCheckSaves = includeCards ? getEmpoweredCandidates(engine, currentTurn, false) : [];
    if (empCheckSaves.length === 0) {
      if (engine.inCheck()) {
        const winner = currentTurn === 'w' ? 'b' : 'w';
        return {
          score: winner === povColor ? 100000 + depth * 100 : -100000 - depth * 100,
        };
      }
      return { score: 0 };
    }
    stdCandidates.push(...empCheckSaves);
  }

  if (isMaximizing) {
    let maxScore = -Infinity;
    let bestCand = stdCandidates[0];

    const evalCand = (cand: CandidateAction): boolean => {
      const clone = engine.clone();
      let success = false;
      if (cand.type === 'standard' && cand.move) {
        const res = clone.makeMove({
          from: cand.move.from,
          to: cand.move.to,
          promotion: cand.move.promotion,
        }, true);
        success = res.success;
      } else if (cand.type === 'empowered' && cand.empoweredMove) {
        const res = clone.makeEmpoweredMove(cand.empoweredMove, true);
        success = res.success;
      }

      if (!success) return false;

      let score: number;
      if (clone.inCheck() && clone.isCheckmate()) {
        score = 100000 + depth * 100;
      } else {
        const destSq = (cand.move?.to || cand.empoweredMove?.to) as Square | undefined;
        const isTact = Boolean(cand.move?.captured || cand.move?.promotion);
        const next = minimax(
          clone,
          depth - 1,
          alpha,
          beta,
          false,
          povColor,
          includeCards,
          params,
          tt,
          destSq,
          isTact
        );
        score = next.score;
        if (clone.getPositionRepeatCount() >= 2 && score > -150) {
          score -= params.repetitionContempt;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestCand = cand;
      }

      alpha = Math.max(alpha, maxScore);
      return beta <= alpha;
    };

    let cutOff = false;
    for (const cand of stdCandidates) {
      if (evalCand(cand)) {
        cutOff = true;
        break;
      }
    }

    if (!cutOff && includeCards) {
      const empCandidates = getEmpoweredCandidates(engine, currentTurn, false);
      if (ttCachedBestMoveKey) {
        for (const c of empCandidates) {
          if (candidateKey(c) === ttCachedBestMoveKey) {
            c.orderScore += 10000;
            break;
          }
        }
        empCandidates.sort((a, b) => b.orderScore - a.orderScore);
      }
      for (const cand of empCandidates) {
        if (evalCand(cand)) {
          break;
        }
      }
    }

    if (tt && ttKey) {
      const flag =
        maxScore <= origAlpha ? 'UPPERBOUND' : maxScore >= origBeta ? 'LOWERBOUND' : 'EXACT';
      tt.set(ttKey, {
        depth,
        score: maxScore,
        flag,
        bestMoveKey: bestCand ? candidateKey(bestCand) : undefined,
      });
    }

    return { score: maxScore, move: bestCand.move, empoweredMove: bestCand.empoweredMove };
  } else {
    let minScore = Infinity;
    let bestCand = stdCandidates[0];
    let moveIdx = 0;

    const evalCand = (cand: CandidateAction): boolean => {
      moveIdx++;
      const clone = engine.clone();
      let success = false;
      if (cand.type === 'standard' && cand.move) {
        const res = clone.makeMove({
          from: cand.move.from,
          to: cand.move.to,
          promotion: cand.move.promotion,
        }, true);
        success = res.success;
      } else if (cand.type === 'empowered' && cand.empoweredMove) {
        const res = clone.makeEmpoweredMove(cand.empoweredMove, true);
        success = res.success;
      }

      if (!success) return false;

      let score: number;
      if (clone.inCheck() && clone.isCheckmate()) {
        score = -100000 - depth * 100;
      } else {
        const destSq = (cand.move?.to || cand.empoweredMove?.to) as Square | undefined;
        const isTact = Boolean(cand.move?.captured || cand.move?.promotion);
        const childCards =
          includeCards && (moveIdx < 6 || cand.orderScore >= 300 || cand.type === 'empowered');
        const next = minimax(
          clone,
          depth - 1,
          alpha,
          beta,
          true,
          povColor,
          childCards,
          params,
          tt,
          destSq,
          isTact
        );
        score = next.score;
        if (clone.getPositionRepeatCount() >= 2 && score < 150) {
          score += params.repetitionContempt;
        }
      }

      if (score < minScore) {
        minScore = score;
        bestCand = cand;
      }

      beta = Math.min(beta, minScore);
      return beta <= alpha;
    };

    let cutOff = false;
    for (const cand of stdCandidates) {
      if (evalCand(cand)) {
        cutOff = true;
        break;
      }
    }

    if (!cutOff && includeCards) {
      const empCandidates = getEmpoweredCandidates(engine, currentTurn, false);
      if (ttCachedBestMoveKey) {
        for (const c of empCandidates) {
          if (candidateKey(c) === ttCachedBestMoveKey) {
            c.orderScore += 10000;
            break;
          }
        }
        empCandidates.sort((a, b) => b.orderScore - a.orderScore);
      }
      for (const cand of empCandidates) {
        if (evalCand(cand)) {
          break;
        }
      }
    }

    if (tt && ttKey) {
      const flag =
        minScore >= origBeta ? 'LOWERBOUND' : minScore <= origAlpha ? 'UPPERBOUND' : 'EXACT';
      tt.set(ttKey, {
        depth,
        score: minScore,
        flag,
        bestMoveKey: bestCand ? candidateKey(bestCand) : undefined,
      });
    }

    return { score: minScore, move: bestCand.move, empoweredMove: bestCand.empoweredMove };
  }
}

/**
 * Top-level tactical AI turn decision.
 * Supports 'easy', 'medium', 'tactical', and 'grandmaster' difficulties.
 * Implements Iterative Deepening + Top-K Windowed Verification + Seeded Clipped Softmax.
 */
export function computeBestTurn(
  engine: DeckChessEngine,
  aiColor: PieceColor,
  difficulty: AiDifficulty = 'medium',
  params: EvalParams = DEFAULT_EVAL_PARAMS,
  options?: AiSearchOptions
): BestTurnResult {
  const currentTurn = engine.getTurn();

  if (currentTurn !== aiColor) {
    throw new Error(`Engine turn (${currentTurn}) does not match AI color (${aiColor})`);
  }

  const maxDepth = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
  const includeCards = difficulty !== 'easy';

  const defaultMargins: Record<AiDifficulty, number> = {
    grandmaster: 15,
    tactical: 22,
    medium: 32,
    easy: 60,
  };
  const defaultTemps: Record<AiDifficulty, number> = {
    grandmaster: 10,
    tactical: 14,
    medium: 20,
    easy: 35,
  };

  const marginCp = options?.contenderMarginCp ?? defaultMargins[difficulty];
  const temperature = options?.temperature ?? defaultTemps[difficulty];
  const isDeterministic = options?.deterministic ?? (options?.seed === undefined);

  const candidates = getCandidateActions(engine, includeCards, aiColor, true);
  if (candidates.length === 0) {
    throw new Error('No legal moves available for AI');
  }

  const tt = new Map<string, TTEntry>();

  // Iterative Deepening: Run shallow passes d = 1..maxDepth-1 to populate TT & order root moves
  if (maxDepth > 1) {
    for (let d = 1; d < maxDepth; d++) {
      for (const candidate of candidates) {
        const clone = engine.clone();
        let success = false;
        if (candidate.type === 'standard' && candidate.move) {
          const res = clone.makeMove({
            from: candidate.move.from,
            to: candidate.move.to,
            promotion: candidate.move.promotion,
          }, true);
          success = res.success;
        } else if (candidate.type === 'empowered' && candidate.empoweredMove) {
          const res = clone.makeEmpoweredMove(candidate.empoweredMove, true);
          success = res.success;
        }
        if (!success) continue;

        if (clone.inCheck() && clone.isCheckmate()) {
          candidate.orderScore = 100000;
        } else {
          const next = minimax(
            clone,
            d - 1,
            -Infinity,
            Infinity,
            false,
            aiColor,
            includeCards,
            params,
            tt
          );
          candidate.orderScore = next.score;
        }
      }
      candidates.sort((a, b) => b.orderScore - a.orderScore);
    }
  }

  let bestScore = -Infinity;
  let bestCandidate = candidates[0];
  let alpha = -Infinity;
  const beta = Infinity;

  let bestStandardScore: number | undefined;
  let bestEmpoweredScore: number | undefined;

  const candidateScores: { candidate: CandidateAction; score: number; failedLow: boolean }[] = [];

  let rootIdx = 0;
  for (const candidate of candidates) {
    rootIdx++;
    const clone = engine.clone();
    let success = false;

    if (candidate.type === 'standard' && candidate.move) {
      const res = clone.makeMove({
        from: candidate.move.from,
        to: candidate.move.to,
        promotion: candidate.move.promotion,
      }, true);
      success = res.success;
    } else if (candidate.type === 'empowered' && candidate.empoweredMove) {
      const res = clone.makeEmpoweredMove(candidate.empoweredMove, true);
      success = res.success;
    }

    if (!success) continue;

    let score: number;
    let failedLow = false;
    if (clone.inCheck() && clone.isCheckmate()) {
      score = 100000 + maxDepth * 100;
    } else {
      const destSq = (candidate.move?.to || candidate.empoweredMove?.to) as Square | undefined;
      const isTact = Boolean(candidate.move?.captured || candidate.move?.promotion);

      // When low-determinism is enabled, keep alpha relaxed to bestScore - marginCp
      // so all moves in the contender window receive exact minimax scores.
      const searchAlpha = isDeterministic
        ? alpha
        : Math.max(-Infinity, bestScore - marginCp);

      const canReduce =
        maxDepth >= 3 &&
        rootIdx > 10 &&
        !isTact &&
        candidate.orderScore < 350 &&
        searchAlpha > -50000;

      if (canReduce) {
        const reduced = minimax(
          clone,
          1,
          searchAlpha,
          beta,
          false,
          aiColor,
          includeCards,
          params,
          tt,
          destSq,
          isTact
        );
        score = reduced.score;
        if (score > searchAlpha) {
          const full = minimax(
            clone,
            maxDepth - 1,
            searchAlpha,
            beta,
            false,
            aiColor,
            includeCards,
            params,
            tt,
            destSq,
            isTact
          );
          score = full.score;
        } else {
          failedLow = !isDeterministic && bestScore > -50000;
        }
      } else {
        const next = minimax(
          clone,
          maxDepth - 1,
          searchAlpha,
          beta,
          false,
          aiColor,
          includeCards,
          params,
          tt,
          destSq,
          isTact
        );
        score = next.score;
        if (score <= searchAlpha && !isDeterministic && bestScore > -50000) {
          failedLow = true;
        }
      }
      // Repetition contempt at Root: never shuffle Ra8-b8-a8-b8 when not losing
      if (clone.getPositionRepeatCount() >= 2 && score > -150) {
        score -= params.repetitionContempt;
      }
    }

    candidateScores.push({ candidate, score, failedLow });

    if (candidate.type === 'standard') {
      if (bestStandardScore === undefined || score > bestStandardScore) {
        bestStandardScore = score;
      }
    } else if (candidate.type === 'empowered') {
      if (bestEmpoweredScore === undefined || score > bestEmpoweredScore) {
        bestEmpoweredScore = score;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }

    if (isDeterministic) {
      alpha = Math.max(alpha, bestScore);
    }
  }

  // Calculate Search-Backed Card Lift
  const cardLiftCp =
    bestEmpoweredScore !== undefined && bestStandardScore !== undefined
      ? bestEmpoweredScore - bestStandardScore
      : undefined;

  // Filter root contenders within marginCp of bestScore (excluding moves that failed low)
  const threshold = bestScore - marginCp;
  let contenders = candidateScores
    .filter((cs) => !cs.failedLow && cs.score >= threshold)
    .sort((a, b) => b.score - a.score);

  // Tactical Lock: forced checkmate locks contenders to top-1 mate move
  if (bestScore >= 80000 || contenders.length === 0) {
    contenders = [{ candidate: bestCandidate, score: bestScore, failedLow: false }];
  }
  const contenderCount = contenders.length;

  // Tactical Lock Guardrails:
  // 1. Forced deterministic mode (e.g. player Hint, EvalBar, Replay)
  // 2. Clear forced checkmate found (bestScore >= 80000)
  // 3. Only 1 legal contender in the window
  let chosenCandidate = bestCandidate;
  let chosenScore = bestScore;

  if (isDeterministic || bestScore >= 80000 || contenders.length <= 1) {
    chosenCandidate = contenders[0]?.candidate || bestCandidate;
    chosenScore = contenders[0]?.score ?? bestScore;
  } else {
    // Seeded Clipped Softmax (Boltzmann Sampling) over Contenders
    const rng = options?.seed !== undefined ? mulberry32(options.seed) : Math.random;
    const weights = contenders.map((c) => Math.exp((c.score - bestScore) / temperature));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    let pick = rng() * totalWeight;
    for (let i = 0; i < contenders.length; i++) {
      pick -= weights[i];
      if (pick <= 0 || i === contenders.length - 1) {
        chosenCandidate = contenders[i].candidate;
        chosenScore = contenders[i].score;
        break;
      }
    }
  }

  const whiteEvalCp = aiColor === 'w' ? chosenScore : -chosenScore;
  const scoreFormatted = (whiteEvalCp / 100).toFixed(1);
  const prefix = whiteEvalCp > 0 ? '+' : '';

  if (chosenCandidate.type === 'empowered' && chosenCandidate.empoweredMove) {
    const emp = chosenCandidate.empoweredMove;
    const cardDef = getCardById(emp.cardId);
    const cardName = emp.metadata?.cardName || cardDef?.name || emp.cardId;
    const promoSuffix = emp.promotion ? `=${emp.promotion.toUpperCase()}` : '';
    const explanation =
      chosenScore >= 90000
        ? `💡 Best Move: [${cardName}] ${emp.from} ➔ ${emp.to}${promoSuffix} (Checkmate)`
        : `💡 Best Move: [${cardName}] ${emp.from} ➔ ${emp.to}${promoSuffix} (${prefix}${scoreFormatted})`;

    return {
      type: 'empowered',
      move: {
        from: emp.from,
        to: emp.to,
        promotion: emp.promotion,
      },
      empoweredMove: emp,
      cardToPlay: {
        cardId: emp.cardId,
        anchorSquare: emp.from,
        targetSquare: emp.to,
        extraSquare: emp.extraSquare,
      },
      evalScore: chosenScore,
      whiteEvalCp,
      mateIn: chosenScore >= 90000 ? 1 : undefined,
      explanation,
      bestStandardScore,
      bestEmpoweredScore,
      cardLiftCp,
      contenderCount,
    };
  }

  // Standard Move chosen
  const sm = chosenCandidate.move || engine.getLegalMoves()[0];
  if (!sm) {
    throw new Error('No legal move available');
  }

  const promoSuffix = sm.promotion ? `=${sm.promotion.toUpperCase()}` : '';
  const explanation =
    chosenScore >= 90000
      ? `💡 Best Move: ${sm.from} ➔ ${sm.to}${promoSuffix} (Checkmate)`
      : `💡 Best Move: ${sm.from} ➔ ${sm.to}${promoSuffix} (${prefix}${scoreFormatted})`;

  return {
    type: 'standard',
    move: {
      from: sm.from,
      to: sm.to,
      promotion: sm.promotion,
    },
    evalScore: chosenScore,
    whiteEvalCp,
    mateIn: chosenScore >= 90000 ? 1 : undefined,
    explanation,
    bestStandardScore,
    bestEmpoweredScore,
    cardLiftCp,
    contenderCount,
  };
}
