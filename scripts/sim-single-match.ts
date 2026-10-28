import { DeckChessEngine } from '../src/engine/DeckChessEngine';
import {
  computeBestTurn,
  evaluatePosition,
  DEFAULT_EVAL_PARAMS,
  MATERIAL_VALUES,
} from '../src/engine/DeckChessAI';
import type { AiDifficulty, PieceColor, Square } from '../src/types/deckChess';
import { getCardById } from '../src/engine/cardGraph';
import { PST_MAP, KING_MIDGAME_PST, KING_ENDGAME_PST } from '../src/engine/DeckChessAI';

export interface MatchSpec {
  matchId: string;
  blockId: number;
  pairId: string;
  seed: number;
  whiteDeck: string[]; // 8 card IDs
  blackDeck: string[]; // 8 card IDs
  maxPlies?: number; // default 100
  difficulty?: AiDifficulty; // default 'medium'
}

export interface MatchCardTelemetry {
  cardId: string;
  color: PieceColor;
  turnsHeld: number;
  turnsConditionMet: number;
  timesPlayed: number;
  swingSum: number;
  liftSum: number;
}

export interface MatchRecord {
  matchId: string;
  blockId: number;
  pairId: string;
  seed: number;
  whiteDeck: string[];
  blackDeck: string[];
  winner: PieceColor | 'draw';
  finishReason: string;
  plies: number;
  durationMs: number;
  finalFen: string;
  openingMoves6: string[];
  cardTelemetry: Record<string, MatchCardTelemetry>;
}

/**
 * Pure board evaluation (Material + PSTs + Bishop Pair + Shields) WITHOUT unspent hand retention.
 * Used for objective end-of-game adjudication so hoarding cards is never rewarded.
 */
export function evaluateBoardPure(engine: DeckChessEngine): number {
  let whiteScore = 0;
  const board = engine.getBoard();
  let nonPawnMaterial = 0;
  let whiteBishops = 0;
  let blackBishops = 0;

  let wk_r = -1;
  let wk_f = -1;
  let bk_r = -1;
  let bk_f = -1;

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece) continue;
      const rankFrom1 = 7 - r;
      const sq = (piece.square as Square) || DeckChessEngine.coordsToSquare(f, rankFrom1);
      const type = piece.type;
      const isWhite = piece.color === 'w';

      if (sq) {
        if (isWhite && type === 'b') whiteBishops++;
        else if (!isWhite && type === 'b') blackBishops++;
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
        if (type !== 'p') nonPawnMaterial += baseVal;
        const pstRow = isWhite ? r : 7 - r;
        const pstVal = PST_MAP[type]?.[pstRow]?.[f] || 0;
        const totalVal = baseVal + pstVal;
        if (isWhite) whiteScore += totalVal;
        else whiteScore -= totalVal;
      }
    }
  }

  const isEndgame = nonPawnMaterial <= 2600;
  const kingPst = isEndgame ? KING_ENDGAME_PST : KING_MIDGAME_PST;
  if (wk_r !== -1) whiteScore += 20000 + (kingPst[wk_r]?.[wk_f] || 0);
  if (bk_r !== -1) whiteScore -= (20000 + (kingPst[7 - bk_r]?.[bk_f] || 0));

  if (whiteBishops >= 2) whiteScore += 30;
  if (blackBishops >= 2) whiteScore -= 30;

  for (const mod of engine.getActiveModifiers()) {
    if (mod.type === 'shield') {
      if (mod.ownerColor === 'w') whiteScore += 50;
      else whiteScore -= 50;
    }
  }

  return whiteScore;
}

export function playSingleMatch(spec: MatchSpec): MatchRecord {
  const startTime = Date.now();
  const maxPlies = spec.maxPlies ?? 100;
  const difficulty = spec.difficulty ?? 'medium';

  const engine = new DeckChessEngine(undefined, [...spec.whiteDeck], [...spec.blackDeck]);

  const cardTelemetry: Record<string, MatchCardTelemetry> = {};
  for (const cid of spec.whiteDeck) {
    cardTelemetry[cid] = {
      cardId: cid,
      color: 'w',
      turnsHeld: 0,
      turnsConditionMet: 0,
      timesPlayed: 0,
      swingSum: 0,
      liftSum: 0,
    };
  }
  for (const cid of spec.blackDeck) {
    cardTelemetry[cid] = {
      cardId: cid,
      color: 'b',
      turnsHeld: 0,
      turnsConditionMet: 0,
      timesPlayed: 0,
      swingSum: 0,
      liftSum: 0,
    };
  }

  const openingMoves6: string[] = [];
  let plies = 0;
  let consecutiveMercyPlies = 0;
  let winner: PieceColor | 'draw' = 'draw';
  let finishReason = 'ongoing';

  while (plies < maxPlies) {
    if (engine.isGameOver()) {
      winner = engine.getWinner() || 'draw';
      finishReason = engine.getFinishReason() || 'game_over';
      break;
    }

    const pureEvalCp = evaluateBoardPure(engine);

    // Quiescence-Backed Mercy Adjudication (>= 650cp pure material advantage for 4 plies after ply 30)
    if (plies >= 30 && Math.abs(pureEvalCp) >= 650) {
      consecutiveMercyPlies++;
      if (consecutiveMercyPlies >= 4) {
        winner = pureEvalCp > 0 ? 'w' : 'b';
        finishReason = 'mercy_adjudication';
        break;
      }
    } else {
      consecutiveMercyPlies = 0;
    }

    const currentTurn = engine.getTurn();
    const currentHand = engine.getHandForColor(currentTurn);

    // Track turns held and conditions met for cards currently in hand
    for (const cardId of currentHand) {
      const telem = cardTelemetry[cardId];
      if (telem) {
        telem.turnsHeld++;
        const cardDef = getCardById(cardId);
        if (cardDef) {
          // Check if any friendly piece on board meets this card's conditions
          let condMet = false;
          const board = engine.getBoard();
          for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
              const p = board[r][f];
              if (p && p.color === currentTurn) {
                const sq = DeckChessEngine.coordsToSquare(f, 7 - r);
                if (sq && engine.evaluateConditions(cardDef, sq)) {
                  condMet = true;
                  break;
                }
              }
            }
            if (condMet) break;
          }
          if (condMet) telem.turnsConditionMet++;
        }
      }
    }

    const plySeed = (spec.seed * 1664525 + plies * 1013904223) >>> 0;
    const evalBefore = evaluatePosition(engine).whiteCp;

    const decision = computeBestTurn(
      engine,
      currentTurn,
      difficulty,
      DEFAULT_EVAL_PARAMS,
      { seed: plySeed }
    );

    if (plies < 6) {
      openingMoves6.push(`${decision.move.from}-${decision.move.to}`);
    }

    if (decision.type === 'empowered' && decision.empoweredMove) {
      const cid = decision.empoweredMove.cardId;
      const res = engine.makeEmpoweredMove(decision.empoweredMove);
      if (res.success && cardTelemetry[cid]) {
        cardTelemetry[cid].timesPlayed++;
        const lift = decision.cardLiftCp ?? 0;
        cardTelemetry[cid].liftSum += lift;
        const evalAfter = evaluatePosition(engine).whiteCp;
        const swing = currentTurn === 'w' ? evalAfter - evalBefore : evalBefore - evalAfter;
        cardTelemetry[cid].swingSum += swing;
      } else {
        // Fallback to standard move if card failed
        engine.makeMove(decision.move);
      }
    } else {
      engine.makeMove(decision.move);
    }

    plies++;
  }

  // End of loop terminal / max plies adjudication
  if (finishReason === 'ongoing') {
    if (engine.isGameOver()) {
      winner = engine.getWinner() || 'draw';
      finishReason = engine.getFinishReason() || 'game_over';
    } else {
      const pureEval = evaluateBoardPure(engine);
      if (pureEval >= 140) {
        winner = 'w';
        finishReason = 'max_plies_adjudication';
      } else if (pureEval <= -140) {
        winner = 'b';
        finishReason = 'max_plies_adjudication';
      } else {
        winner = 'draw';
        finishReason = 'max_plies_adjudication';
      }
    }
  }

  return {
    matchId: spec.matchId,
    blockId: spec.blockId,
    pairId: spec.pairId,
    seed: spec.seed,
    whiteDeck: spec.whiteDeck,
    blackDeck: spec.blackDeck,
    winner,
    finishReason,
    plies,
    durationMs: Date.now() - startTime,
    finalFen: engine.getFen(),
    openingMoves6,
    cardTelemetry,
  };
}

// Standalone CLI runner
if (process.argv[1] && process.argv[1].includes('sim-single-match')) {
  const args = process.argv.slice(2);
  const getArg = (name: string, fallback: string) => {
    const found = args.find((a) => a.startsWith(`--${name}=`));
    return found ? found.split('=')[1] : fallback;
  };

  const seed = parseInt(getArg('seed', '42'), 10);
  const maxPlies = parseInt(getArg('maxPlies', '100'), 10);
  const difficulty = getArg('difficulty', 'medium') as AiDifficulty;

  const defaultWhite = [
    'p1_sidestep', 'p3_follow_me', 'n1_adrenaline_jump', 'n3_trample',
    'b1_let_me_through', 'r1_make_way', 'q1_regal_presence', 'k1_bunker_down',
  ];
  const defaultBlack = [
    'p2_attack_head_on', 'p4_attack_together', 'n2_skirmisher', 'n4_diagonal_leap',
    'b2_piercing_gaze', 'r3_cut_across', 'q2_the_queens_gambit', 'k2_royal_knighting',
  ];

  const whiteStr = getArg('white', '');
  const blackStr = getArg('black', '');
  const whiteDeck = whiteStr ? whiteStr.split(',') : defaultWhite;
  const blackDeck = blackStr ? blackStr.split(',') : defaultBlack;

  const spec: MatchSpec = {
    matchId: `cli_${seed}`,
    blockId: 0,
    pairId: 'cli_pair',
    seed,
    whiteDeck,
    blackDeck,
    maxPlies,
    difficulty,
  };

  const record = playSingleMatch(spec);
  console.log(JSON.stringify(record, null, 2));
}
