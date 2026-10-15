import { PieceColor, DeckChessCardAction, DeckChessMove, Square } from '../types/deckChess';
import { DeckChessEngine } from './DeckChessEngine';
import { Move } from 'chess.js';

// Base piece values in centipawns
const MATERIAL_VALUES: Record<string, number> = {
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
 * Static position evaluation for AI
 * Returns score from perspective of `povColor` (positive = favorable for povColor)
 */
export function evaluateBoard(engine: DeckChessEngine, povColor: PieceColor): number {
  if (engine.isCheckmate()) {
    const winner = engine.getWinner();
    return winner === povColor ? 100000 : -100000;
  }

  if (engine.isDraw() || engine.isStalemate()) {
    return 0;
  }

  let score = 0;
  const board = engine.getBoard();

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece) continue;

      const type = piece.type;
      const color = piece.color as PieceColor;
      const baseVal = MATERIAL_VALUES[type] || 0;

      // Calculate rank index from white's perspective
      // r=0 is rank 8 in board array, r=7 is rank 1
      const rankFrom1 = 7 - r;
      const rankIdx = color === 'w' ? rankFrom1 : 7 - rankFrom1;
      const fileIdx = f;

      const pstVal = PST_MAP[type]?.[rankIdx]?.[fileIdx] || 0;
      const totalPieceVal = baseVal + pstVal;

      if (color === povColor) {
        score += totalPieceVal;
      } else {
        score -= totalPieceVal;
      }
    }
  }

  // Bonus for active shields defending AI pieces
  for (const mod of engine.getActiveModifiers()) {
    if (mod.type === 'shield' && mod.ownerColor === povColor) {
      score += 50;
    }
  }

  return score;
}

/**
 * Minimax search with Alpha-Beta pruning
 */
export function minimax(
  engine: DeckChessEngine,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  povColor: PieceColor
): { score: number; move?: Move } {
  if (depth <= 0 || engine.isGameOver()) {
    return { score: evaluateBoard(engine, povColor) };
  }

  const legalMoves = engine.getLegalMoves();
  if (legalMoves.length === 0) {
    return { score: evaluateBoard(engine, povColor) };
  }

  // Move ordering: prioritize captures
  legalMoves.sort((a, b) => {
    const aVal = a.captured ? MATERIAL_VALUES[a.captured] || 50 : 0;
    const bVal = b.captured ? MATERIAL_VALUES[b.captured] || 50 : 0;
    return bVal - aVal;
  });

  if (isMaximizing) {
    let maxScore = -Infinity;
    let bestMove: Move = legalMoves[0];

    for (const move of legalMoves) {
      const clone = engine.clone();
      const res = clone.makeMove({ from: move.from, to: move.to, promotion: move.promotion });
      if (!res.success) continue;

      const next = minimax(clone, depth - 1, alpha, beta, false, povColor);
      if (next.score > maxScore) {
        maxScore = next.score;
        bestMove = move;
      }

      alpha = Math.max(alpha, maxScore);
      if (beta <= alpha) {
        break; // Alpha-beta cutoff
      }
    }

    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    let bestMove: Move = legalMoves[0];

    for (const move of legalMoves) {
      const clone = engine.clone();
      const res = clone.makeMove({ from: move.from, to: move.to, promotion: move.promotion });
      if (!res.success) continue;

      const next = minimax(clone, depth - 1, alpha, beta, true, povColor);
      if (next.score < minScore) {
        minScore = next.score;
        bestMove = move;
      }

      beta = Math.min(beta, minScore);
      if (beta <= alpha) {
        break; // Alpha-beta cutoff
      }
    }

    return { score: minScore, move: bestMove };
  }
}

export interface BestTurnResult {
  cardToPlay?: DeckChessCardAction;
  move: DeckChessMove;
  evalScore: number;
}

/**
 * Top-level tactical AI turn decision
 * Operates in <50ms synchronously
 */
export function computeBestTurn(
  engine: DeckChessEngine,
  aiColor: PieceColor,
  difficulty: 'easy' | 'medium' | 'tactical' = 'medium'
): BestTurnResult {
  const depth = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
  const currentTurn = engine.getTurn();

  if (currentTurn !== aiColor) {
    throw new Error(`Engine turn (${currentTurn}) does not match AI color (${aiColor})`);
  }

  const baselineEval = evaluateBoard(engine, aiColor);
  let bestCardAction: DeckChessCardAction | undefined = undefined;
  let bestEngineForMove = engine;
  let highestCardGain = 0;

  // 1. Evaluate tactical card opportunities if in PRE_MOVE_WINDOW
  if (!engine.hasPlayedCardThisTurn() && difficulty !== 'easy') {
    const hand = engine.getHandForColor(aiColor);

    for (const cardId of hand) {
      if (!engine.canPlayCard(cardId)) continue;

      const anchors = engine.getValidAnchorsForCard(cardId);
      for (const anchor of anchors) {
        const targets = engine.getValidTargetsForCard(cardId, anchor);

        // Cards that need no target (e.g. pawn_scuttle)
        const targetList = targets.length > 0 ? targets : [undefined];

        for (const target of targetList) {
          const sim = engine.clone();
          const activation = sim.activateCard(cardId, anchor, target);
          if (activation.success && !sim.isCheckmate()) {
            const cardEval = evaluateBoard(sim, aiColor);
            const gain = cardEval - baselineEval;

            // Favorable card play threshold:
            // E.g. scuttles a piece about to be captured, or pierces enemy pieces, or deploys barrier
            if (gain > highestCardGain && gain >= 40) {
              highestCardGain = gain;
              bestCardAction = {
                cardId,
                anchorSquare: anchor,
                targetSquare: target,
              };
              bestEngineForMove = sim;
            }
          }
        }
      }
    }
  }

  // 2. Compute best chess move via alpha-beta minimax
  const searchResult = minimax(bestEngineForMove, depth, -Infinity, Infinity, true, aiColor);

  const fallbackMove = bestEngineForMove.getLegalMoves()[0];
  const chosenMove = searchResult.move || fallbackMove;

  if (!chosenMove) {
    throw new Error('No legal moves available for AI');
  }

  return {
    cardToPlay: bestCardAction,
    move: {
      from: chosenMove.from,
      to: chosenMove.to,
      promotion: chosenMove.promotion,
    },
    evalScore: searchResult.score,
  };
}
