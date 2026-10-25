import type {
  PieceColor,
  DeckChessCardAction,
  DeckChessMove,
  Square,
  EmpoweredMove,
  AiDifficulty,
  PositionEvaluation,
  BestTurnResult,
} from '../types/deckChess';
import { DeckChessEngine } from './DeckChessEngine';
import { Move, PieceSymbol } from 'chess.js';
import { getCardById } from './cardGraph';
import { getCardHandler } from './cards/cardRegistry';

export type { BestTurnResult };

// Base piece values in centipawns
export const MATERIAL_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Simplified Piece-Square Tables (PST) from Tomasz Michniewski
// Indexed by [rank 0..7][file 0..7] from white's perspective (rank 0 = rank 1, rank 7 = rank 8)
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

const KING_PST = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

const PST_MAP: Record<string, number[][]> = {
  p: PAWN_PST,
  n: KNIGHT_PST,
  b: BISHOP_PST,
  r: ROOK_PST,
  q: QUEEN_PST,
  k: KING_PST,
};

/**
 * Class-weighted intrinsic retention value per unspent card in hand.
 * Prevents AI from burning cards on trivial 0cp moves.
 */
export function getCardRetentionValue(cardId: string): number {
  const card = getCardById(cardId);
  if (!card) return 60;
  switch (card.anchor) {
    case 'pawn':
      return 55;
    case 'knight':
    case 'bishop':
      return 70;
    case 'rook':
      return 85;
    case 'queen':
    case 'king':
      return 100;
    default:
      return 60;
  }
}

/**
 * Evaluates tactical hand synergy & pre-condition geometric setup.
 * Rewards AI for maneuvering pieces into configurations that unlock its own unspent cards.
 */
export function evaluateHandSynergy(engine: DeckChessEngine, color: PieceColor): number {
  const hand = engine.getHandForColor(color);
  if (hand.length === 0) return 0;
  const uniqueCards = Array.from(new Set(hand));
  let synergy = 0;

  // Cache pieces for color and opponent
  const board = engine.getBoard();
  const friendlyPieces: { sq: Square; type: PieceSymbol; file: number; rank: number }[] = [];

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p) continue;
      // In chess.js, row 0 is rank 8 (index 7), row 7 is rank 1 (index 0)
      const rankIdx = 7 - r;
      const sq = DeckChessEngine.coordsToSquare(f, rankIdx);
      if (!sq) continue;
      if (p.color === color) {
        friendlyPieces.push({ sq, type: p.type, file: f, rank: rankIdx });
      }
    }
  }

  for (const cardId of uniqueCards) {
    const card = getCardById(cardId);
    if (!card) continue;
    const handler = getCardHandler(cardId);

    // 1. Primed Threat Bonus (+22cp to +35cp)
    const anchorType =
      card.anchor === 'pawn'
        ? 'p'
        : card.anchor === 'knight'
        ? 'n'
        : card.anchor === 'bishop'
        ? 'b'
        : card.anchor === 'rook'
        ? 'r'
        : card.anchor === 'queen'
        ? 'q'
        : 'k';

    const anchorPieces = friendlyPieces.filter((p) => p.type === anchorType);
    let cardIsPrimed = false;
    let cardHasCapture = false;

    for (const p of anchorPieces) {
      if (!handler) continue;
      if (handler.evaluateConditions && !handler.evaluateConditions(engine, p.sq)) {
        continue;
      }
      const targets = handler.getTargets(engine, p.sq);
      if (targets.length > 0) {
        cardIsPrimed = true;
        for (const t of targets) {
          const dest = typeof t === 'string' ? t : t.to;
          const targetPiece = engine.getPiece(dest);
          if (targetPiece && targetPiece.color !== color) {
            cardHasCapture = true;
            break;
          }
        }
        if (cardHasCapture) break;
      }
    }

    if (cardHasCapture) {
      synergy += 35;
    } else if (cardIsPrimed) {
      synergy += 22;
    }

    // 2. Geometric Pre-Condition Shaping Bonuses (+12cp to +24cp)
    switch (cardId) {
      case 'b6_come_this_way': {
        // Bishop on d4, d5, e4, e5 (+20cp)
        const inCenter = friendlyPieces.some(
          (p) => p.type === 'b' && (p.sq === 'd4' || p.sq === 'd5' || p.sq === 'e4' || p.sq === 'e5')
        );
        if (inCenter) synergy += 20;
        break;
      }
      case 'r3_cut_across': {
        // Rook on main diagonal (a1-h8 or a8-h1) (+18cp)
        const onDiag = friendlyPieces.some(
          (p) => p.type === 'r' && (p.file === p.rank || p.file + p.rank === 7)
        );
        if (onDiag) synergy += 18;
        break;
      }
      case 'r4_move_in_unison': {
        // Two friendly Rooks sharing an unobstructed rank or file (+24cp)
        const rooks = friendlyPieces.filter((p) => p.type === 'r');
        if (rooks.length >= 2) {
          for (let i = 0; i < rooks.length; i++) {
            for (let j = i + 1; j < rooks.length; j++) {
              if (rooks[i].file === rooks[j].file || rooks[i].rank === rooks[j].rank) {
                synergy += 24;
                break;
              }
            }
          }
        }
        break;
      }
      case 'r1_make_way':
      case 'r2_ive_got_your_back':
      case 'r5_catapult': {
        // Rook aligned on rank/file with friendly Pawn or non-King ally (+15cp)
        const rooks = friendlyPieces.filter((p) => p.type === 'r');
        const allies = friendlyPieces.filter((p) => p.type === 'p' || p.type === 'n' || p.type === 'b');
        let aligned = false;
        for (const r of rooks) {
          for (const a of allies) {
            if (r.file === a.file || r.rank === a.rank) {
              aligned = true;
              break;
            }
          }
          if (aligned) break;
        }
        if (aligned) synergy += 15;
        break;
      }
      case 'r6_garrison': {
        // Rook orthogonally adjacent to friendly King (+18cp)
        const king = friendlyPieces.find((p) => p.type === 'k');
        const rooks = friendlyPieces.filter((p) => p.type === 'r');
        if (king && rooks.some((r) => Math.abs(r.file - king.file) + Math.abs(r.rank - king.rank) === 1)) {
          synergy += 18;
        }
        break;
      }
      case 'n6_flanking_support': {
        // Friendly Knight on file a or h with a second friendly Knight alive (+18cp)
        const knights = friendlyPieces.filter((p) => p.type === 'n');
        if (knights.length >= 2 && knights.some((k) => k.file === 0 || k.file === 7)) {
          synergy += 18;
        }
        break;
      }
      case 'n7_outpost_support':
      case 'p8_call_reserves': {
        // Knight/Pawn in enemy territory with friendly adjacency (+20cp)
        const isEnemyTerritory = (rank: number) => (color === 'w' ? rank >= 4 : rank <= 3);
        const forwardPieces = friendlyPieces.filter(
          (p) => (p.type === 'n' || p.type === 'p') && isEnemyTerritory(p.rank)
        );
        if (forwardPieces.length > 0) synergy += 20;
        break;
      }
      case 'p3_follow_me':
      case 'p5_get_behind_me':
      case 'p6_tag_out':
      case 'b1_let_me_through': {
        // Friendly piece-Pawn battery adjacency (+14cp)
        const pawns = friendlyPieces.filter((p) => p.type === 'p');
        const pieces = friendlyPieces.filter((p) => p.type !== 'p' && p.type !== 'k');
        let adjacent = false;
        for (const pw of pawns) {
          for (const pc of pieces) {
            if (Math.max(Math.abs(pw.file - pc.file), Math.abs(pw.rank - pc.rank)) === 1) {
              adjacent = true;
              break;
            }
          }
          if (adjacent) break;
        }
        if (adjacent) synergy += 14;
        break;
      }
      case 'q1_royal_summons':
      case 'q4_one_fell_swoop': {
        // Queen sharing rank/file/diagonal with friendly Rook/Bishop/Pawn (+18cp)
        const queen = friendlyPieces.find((p) => p.type === 'q');
        const allies = friendlyPieces.filter((p) => p.type !== 'q' && p.type !== 'k');
        if (
          queen &&
          allies.some(
            (a) =>
              a.file === queen.file ||
              a.rank === queen.rank ||
              Math.abs(a.file - queen.file) === Math.abs(a.rank - queen.rank)
          )
        ) {
          synergy += 18;
        }
        break;
      }
      case 'k1_conscription':
      case 'k2_royal_knighting':
      case 'k3_royal_execution': {
        // King corner proximity (k1) or adjacent to friendly pawn (k2) / ally (k3) (+15cp)
        const king = friendlyPieces.find((p) => p.type === 'k');
        if (king) {
          if (cardId === 'k1_conscription') {
            const homeRank = color === 'w' ? 0 : 7;
            if (king.rank === homeRank && (king.file <= 2 || king.file >= 5)) synergy += 15;
          } else {
            const allies = friendlyPieces.filter((p) => p.type !== 'k');
            if (allies.some((a) => Math.max(Math.abs(a.file - king.file), Math.abs(a.rank - king.rank)) === 1)) {
              synergy += 15;
            }
          }
        }
        break;
      }
    }
  }

  return synergy;
}

/**
 * Static position evaluation for AI
 * Returns score from perspective of `povColor` (positive = favorable for povColor)
 */
export function evaluateBoard(
  engine: DeckChessEngine,
  povColor: PieceColor,
  depthRemaining: number = 0
): number {
  if (engine.isCheckmate()) {
    const winner = engine.getWinner();
    return winner === povColor
      ? 100000 + depthRemaining * 100
      : -100000 - depthRemaining * 100;
  }

  if (engine.isDraw() || engine.isStalemate()) {
    return 0;
  }

  let whiteScore = 0;
  const board = engine.getBoard();

  // 1. Material & Piece-Square Tables
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece) continue;

      const type = piece.type;
      const color = piece.color as PieceColor;
      const baseVal = MATERIAL_VALUES[type] || 0;

      // r=0 is rank 8 in board array, r=7 is rank 1
      const rankFrom1 = 7 - r;
      const rankIdx = color === 'w' ? rankFrom1 : 7 - rankFrom1;
      const fileIdx = f;

      const pstVal = PST_MAP[type]?.[rankIdx]?.[fileIdx] || 0;
      const totalPieceVal = baseVal + pstVal;

      if (color === 'w') {
        whiteScore += totalPieceVal;
      } else {
        whiteScore -= totalPieceVal;
      }
    }
  }

  // 2. Active Shields
  for (const mod of engine.getActiveModifiers()) {
    if (mod.type === 'shield') {
      if (mod.ownerColor === 'w') whiteScore += 50;
      else whiteScore -= 50;
    }
  }

  // 3. Hand Retention Value
  let whiteRetention = 0;
  for (const cardId of engine.getWhiteHand()) {
    whiteRetention += getCardRetentionValue(cardId);
  }
  let blackRetention = 0;
  for (const cardId of engine.getBlackHand()) {
    blackRetention += getCardRetentionValue(cardId);
  }
  whiteScore += (whiteRetention - blackRetention);

  // 4. Hand Synergy & Pre-Condition Shaping
  const whiteSynergy = evaluateHandSynergy(engine, 'w');
  const blackSynergy = evaluateHandSynergy(engine, 'b');
  whiteScore += (whiteSynergy - blackSynergy);

  return povColor === 'w' ? whiteScore : -whiteScore;
}

/**
 * Computes live position evaluation and win percentage.
 * Sigmoid mapping: P_white(c) = clamp(50 + 50 * (2 / (1 + exp(-0.0035 * c)) - 1), 3, 97)
 */
export function evaluatePosition(engine: DeckChessEngine): PositionEvaluation {
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

  const whiteCp = evaluateBoard(engine, 'w');

  // Sigmoid win percentage calculation
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

function getCandidateActions(
  engine: DeckChessEngine,
  includeCards: boolean,
  color: PieceColor
): CandidateAction[] {
  const candidates: CandidateAction[] = [];

  // 1. Standard moves
  const legalMoves = engine.getLegalMoves();
  for (const m of legalMoves) {
    let orderScore = 0;
    if (m.captured) {
      orderScore = 1000 + (MATERIAL_VALUES[m.captured] || 50) * 10 - (MATERIAL_VALUES[m.piece] || 10);
    }
    candidates.push({ type: 'standard', move: m, orderScore });
  }

  // 2. Empowered card moves
  if (includeCards && !engine.hasPlayedCardThisTurn()) {
    const empMoves = engine.getEmpoweredMoves(undefined, true);
    for (const em of empMoves) {
      const destPiece = engine.getPiece(em.to);
      let orderScore = 100;
      if (destPiece && destPiece.color !== color) {
        orderScore = 1200 + (MATERIAL_VALUES[destPiece.type] || 50) * 10;
      }
      candidates.push({ type: 'empowered', empoweredMove: em, orderScore });
    }
  }

  // Sort descending by orderScore for Alpha-Beta cutoffs
  candidates.sort((a, b) => b.orderScore - a.orderScore);
  return candidates;
}

/**
 * Minimax search with Alpha-Beta pruning supporting unified actions
 */
export function minimax(
  engine: DeckChessEngine,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  povColor: PieceColor,
  includeCards: boolean = true
): { score: number; move?: Move; empoweredMove?: EmpoweredMove } {
  if (depth <= 0 || engine.isGameOver()) {
    return { score: evaluateBoard(engine, povColor, depth) };
  }

  const currentTurn = engine.getTurn();
  const candidates = getCandidateActions(engine, includeCards, currentTurn);

  if (candidates.length === 0) {
    return { score: evaluateBoard(engine, povColor, depth) };
  }

  if (isMaximizing) {
    let maxScore = -Infinity;
    let bestCand = candidates[0];

    for (const cand of candidates) {
      const clone = engine.clone();
      let success = false;
      if (cand.type === 'standard' && cand.move) {
        const res = clone.makeMove({
          from: cand.move.from,
          to: cand.move.to,
          promotion: cand.move.promotion,
        });
        success = res.success;
      } else if (cand.type === 'empowered' && cand.empoweredMove) {
        const res = clone.makeEmpoweredMove(cand.empoweredMove);
        success = res.success;
      }

      if (!success) continue;

      let score: number;
      if (clone.isCheckmate()) {
        score = 100000 + depth * 100;
      } else if (clone.isGameOver()) {
        score = 0;
      } else {
        const next = minimax(clone, depth - 1, alpha, beta, false, povColor, false);
        score = next.score;
      }

      if (score > maxScore) {
        maxScore = score;
        bestCand = cand;
      }

      alpha = Math.max(alpha, maxScore);
      if (beta <= alpha) {
        break; // Alpha-beta cutoff
      }
    }

    return { score: maxScore, move: bestCand.move, empoweredMove: bestCand.empoweredMove };
  } else {
    let minScore = Infinity;
    let bestCand = candidates[0];

    for (const cand of candidates) {
      const clone = engine.clone();
      let success = false;
      if (cand.type === 'standard' && cand.move) {
        const res = clone.makeMove({
          from: cand.move.from,
          to: cand.move.to,
          promotion: cand.move.promotion,
        });
        success = res.success;
      } else if (cand.type === 'empowered' && cand.empoweredMove) {
        const res = clone.makeEmpoweredMove(cand.empoweredMove);
        success = res.success;
      }

      if (!success) continue;

      let score: number;
      if (clone.isCheckmate()) {
        score = -100000 - depth * 100;
      } else if (clone.isGameOver()) {
        score = 0;
      } else {
        const next = minimax(clone, depth - 1, alpha, beta, true, povColor, false);
        score = next.score;
      }

      if (score < minScore) {
        minScore = score;
        bestCand = cand;
      }

      beta = Math.min(beta, minScore);
      if (beta <= alpha) {
        break; // Alpha-beta cutoff
      }
    }

    return { score: minScore, move: bestCand.move, empoweredMove: bestCand.empoweredMove };
  }
}

/**
 * Top-level tactical AI turn decision
 * Supports 'easy', 'medium', 'tactical', and 'grandmaster' difficulties.
 */
export function computeBestTurn(
  engine: DeckChessEngine,
  aiColor: PieceColor,
  difficulty: AiDifficulty = 'medium'
): BestTurnResult {
  const currentTurn = engine.getTurn();

  if (currentTurn !== aiColor) {
    throw new Error(`Engine turn (${currentTurn}) does not match AI color (${aiColor})`);
  }

  const maxDepth = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
  const includeCards = difficulty !== 'easy';

  const candidates = getCandidateActions(engine, includeCards, aiColor);
  if (candidates.length === 0) {
    throw new Error('No legal moves available for AI');
  }

  let bestScore = -Infinity;
  let bestCandidate = candidates[0];
  let alpha = -Infinity;
  const beta = Infinity;

  for (const candidate of candidates) {
    const clone = engine.clone();
    let success = false;

    if (candidate.type === 'standard' && candidate.move) {
      const res = clone.makeMove({
        from: candidate.move.from,
        to: candidate.move.to,
        promotion: candidate.move.promotion,
      });
      success = res.success;
    } else if (candidate.type === 'empowered' && candidate.empoweredMove) {
      const res = clone.makeEmpoweredMove(candidate.empoweredMove);
      success = res.success;
    }

    if (!success) continue;

    let score: number;
    if (clone.isCheckmate()) {
      score = 100000 + maxDepth * 100;
    } else if (clone.isGameOver()) {
      score = 0;
    } else {
      const next = minimax(
        clone,
        maxDepth - 1,
        alpha,
        beta,
        false,
        aiColor,
        includeCards && maxDepth > 2
      );
      score = next.score;
    }

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }

    alpha = Math.max(alpha, bestScore);
  }

  const whiteEvalCp = aiColor === 'w' ? bestScore : -bestScore;
  const scoreFormatted = (whiteEvalCp / 100).toFixed(1);
  const prefix = whiteEvalCp > 0 ? '+' : '';

  if (bestCandidate.type === 'empowered' && bestCandidate.empoweredMove) {
    const emp = bestCandidate.empoweredMove;
    const cardDef = getCardById(emp.cardId);
    const cardName = emp.metadata?.cardName || cardDef?.name || emp.cardId;
    const explanation =
      bestScore >= 90000
        ? `💡 Best Move: [${cardName}] ${emp.from} ➔ ${emp.to} (Checkmate in 1)`
        : `💡 Best Move: [${cardName}] ${emp.from} ➔ ${emp.to} (${prefix}${scoreFormatted})`;

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
      evalScore: bestScore,
      whiteEvalCp,
      mateIn: bestScore >= 90000 ? 1 : undefined,
      explanation,
    };
  }

  // Standard Move chosen
  const sm = bestCandidate.move || engine.getLegalMoves()[0];
  if (!sm) {
    throw new Error('No legal move available');
  }

  const explanation =
    bestScore >= 90000
      ? `💡 Best Move: ${sm.from} ➔ ${sm.to} (Checkmate in 1)`
      : `💡 Best Move: ${sm.from} ➔ ${sm.to} (${prefix}${scoreFormatted})`;

  return {
    type: 'standard',
    move: {
      from: sm.from,
      to: sm.to,
      promotion: sm.promotion,
    },
    evalScore: bestScore,
    whiteEvalCp,
    mateIn: bestScore >= 90000 ? 1 : undefined,
    explanation,
  };
}
