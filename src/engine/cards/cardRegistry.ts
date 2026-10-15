import { Chess, PieceSymbol, Square } from 'chess.js';
import {
  BoardModifier,
  CardDefinition,
  DeckChessCardAction,
  PieceColor,
  PieceAnchor,
} from '../../types/deckChess';
import { DeckChessEngine } from '../DeckChessEngine';
import { getCardById } from '../cardGraph';

export interface CardBehaviorHandler {
  cardId: string;
  // Specific condition evaluation beyond generic primitives
  evaluateConditions?(engine: DeckChessEngine, anchorSquare: string): boolean;
  // Get primary target squares for card activation
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[];
  // Get secondary target squares (e.g. knight leap for knight_escort)
  getSecondaryTargets?(engine: DeckChessEngine, anchorSquare: string, targetSquare: string): string[];
  // Execute card mutation on board and modifiers
  execute(
    engine: DeckChessEngine,
    anchorSquare: string,
    targetSquare?: string,
    extraSquare?: string
  ): { success: boolean; error?: string };
}

/**
 * Coordinate and board helper utilities for card handlers
 */
export const CardUtils = {
  isValidPawnSquare(square: string): boolean {
    const rank = parseInt(square[1], 10);
    return rank >= 2 && rank <= 7;
  },

  getCoords(square: string): { file: number; rank: number } {
    return DeckChessEngine.squareToCoords(square);
  },

  getSquare(file: number, rank: number): Square | null {
    return DeckChessEngine.coordsToSquare(file, rank);
  },

  getAdjacentSquares(square: string, includeDiagonals: boolean = true): string[] {
    const coords = DeckChessEngine.squareToCoords(square);
    const squares: string[] = [];
    for (let df = -1; df <= 1; df++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (df === 0 && dr === 0) continue;
        if (!includeDiagonals && Math.abs(df) + Math.abs(dr) !== 1) continue;
        const sq = DeckChessEngine.coordsToSquare(coords.file + df, coords.rank + dr);
        if (sq) squares.push(sq);
      }
    }
    return squares;
  },
};

/**
 * Registry of card behavior handlers
 */
const HANDLER_REGISTRY = new Map<string, CardBehaviorHandler>();

export function registerCardHandler(handler: CardBehaviorHandler): void {
  HANDLER_REGISTRY.set(handler.cardId, handler);
}

export function getCardHandler(cardId: string): CardBehaviorHandler | undefined {
  return HANDLER_REGISTRY.get(cardId);
}

// ==========================================
// 1. Pawn Vanguard (Vanguard Advance)
// ==========================================
registerCardHandler({
  cardId: 'pawn_vanguard',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const coords = CardUtils.getCoords(anchorSquare);
    const turn = engine.getTurn();
    const dir = turn === 'w' ? 1 : -1;

    // Must be on unmoved starting rank (White rank 2 / index 1, Black rank 7 / index 6)
    const expectedRank = turn === 'w' ? 1 : 6;
    if (coords.rank !== expectedRank) return [];

    const step1 = CardUtils.getSquare(coords.file, coords.rank + dir);
    const step2 = CardUtils.getSquare(coords.file, coords.rank + dir * 2);
    const step3 = CardUtils.getSquare(coords.file, coords.rank + dir * 3);

    if (
      step1 &&
      step2 &&
      step3 &&
      !engine.getPiece(step1) &&
      !engine.getPiece(step2) &&
      !engine.getPiece(step3) &&
      !engine.isSquareBlockedByBarrier(step1) &&
      !engine.isSquareBlockedByBarrier(step2) &&
      !engine.isSquareBlockedByBarrier(step3)
    ) {
      return [step3];
    }
    return [];
  },

  execute(
    engine: DeckChessEngine,
    anchorSquare: string,
    targetSquare?: string
  ): { success: boolean; error?: string } {
    const validTargets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || validTargets[0];
    if (!dest || !validTargets.includes(dest)) {
      return { success: false, error: 'Path obstructed for Vanguard Advance' };
    }

    const currentTurn = engine.getTurn();
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.put({ type: 'p', color: currentTurn }, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 2. Pawn Scuttle (Abandon Ship)
// ==========================================
registerCardHandler({
  cardId: 'pawn_scuttle',
  getTargets(_engine: DeckChessEngine, _anchorSquare: string): string[] {
    // Scuttle acts directly on the anchor pawn; no destination target required
    return [];
  },

  execute(engine: DeckChessEngine, anchorSquare: string): { success: boolean; error?: string } {
    const piece = engine.getPiece(anchorSquare);
    const currentTurn = engine.getTurn();
    if (!piece || piece.type !== 'p' || piece.color !== currentTurn) {
      return { success: false, error: 'Invalid anchor pawn for Scuttle' };
    }

    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    engine.addToPlayerGraveyard(currentTurn, 'p');
    return { success: true };
  },
});

// ==========================================
// 3. Knight Escort (Cavalry Escort)
// ==========================================
registerCardHandler({
  cardId: 'knight_escort',
  // Primary target: friendly adjacent pawn
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const turn = engine.getTurn();
    return CardUtils.getAdjacentSquares(anchorSquare, true).filter((sq) => {
      const piece = engine.getPiece(sq);
      return piece && piece.color === turn && piece.type === 'p';
    });
  },

  // Secondary target: knight leap destination
  getSecondaryTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    return engine.getLegalMoves(anchorSquare).map((m) => m.to);
  },

  execute(
    engine: DeckChessEngine,
    anchorSquare: string,
    targetSquare?: string,
    extraSquare?: string
  ): { success: boolean; error?: string } {
    if (!targetSquare || !extraSquare) {
      return { success: false, error: 'Knight Escort requires passenger pawn and landing destination' };
    }

    const currentTurn = engine.getTurn();
    const oppColor = currentTurn === 'w' ? 'b' : 'w';
    const chess = engine.getInternalChess();

    const passenger = engine.getPiece(targetSquare);
    if (!passenger || passenger.type !== 'p' || passenger.color !== currentTurn) {
      return { success: false, error: 'Passenger must be a friendly pawn' };
    }

    // Determine safe landing square for passenger pawn:
    // Flank or adjacent to knight landing square, never on rank 1 or 8!
    const landingCoords = CardUtils.getCoords(extraSquare);
    const candidateSquares: string[] = [];

    // 1. Flank squares of landing
    const leftFlank = CardUtils.getSquare(landingCoords.file - 1, landingCoords.rank);
    const rightFlank = CardUtils.getSquare(landingCoords.file + 1, landingCoords.rank);
    if (leftFlank) candidateSquares.push(leftFlank);
    if (rightFlank) candidateSquares.push(rightFlank);

    // 2. Other adjacent squares to landing
    const adjSquares = CardUtils.getAdjacentSquares(extraSquare, true);
    for (const sq of adjSquares) {
      if (!candidateSquares.includes(sq)) candidateSquares.push(sq);
    }

    // 3. Vacated anchor square (if rank >= 2 and <= 7)
    if (CardUtils.isValidPawnSquare(anchorSquare) && !candidateSquares.includes(anchorSquare)) {
      candidateSquares.push(anchorSquare);
    }

    // Find first valid empty square for the passenger pawn
    let pawnDest: string | null = null;
    for (const sq of candidateSquares) {
      if (!CardUtils.isValidPawnSquare(sq)) continue;
      if (engine.isSquareBlockedByBarrier(sq)) continue;
      if (sq === extraSquare) continue;

      const pAtSq = engine.getPiece(sq);
      // Empty, or was passenger's own original square
      if (!pAtSq || sq === targetSquare) {
        pawnDest = sq;
        break;
      }
    }

    if (!pawnDest) {
      return { success: false, error: 'No safe flank or adjacent square available for passenger pawn' };
    }

    // If knight lands on an enemy piece, capture it
    const destPiece = engine.getPiece(extraSquare);
    if (destPiece && destPiece.color === oppColor && destPiece.type !== 'k') {
      engine.addToPlayerGraveyard(oppColor, destPiece.type);
    }

    // Move knight and passenger pawn
    chess.remove(anchorSquare as Square);
    chess.remove(targetSquare as Square);
    chess.remove(extraSquare as Square);

    chess.put({ type: 'n', color: currentTurn }, extraSquare as Square);
    chess.put({ type: 'p', color: currentTurn }, pawnDest as Square);

    return { success: true };
  },
});

// ==========================================
// 4. Knight Swap (Dislocation Swap)
// ==========================================
registerCardHandler({
  cardId: 'knight_swap',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const turn = engine.getTurn();
    const targets: string[] = [];
    const board = engine.getBoard();

    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = CardUtils.getSquare(f, r);
        if (sq && sq !== anchorSquare) {
          const piece = engine.getPiece(sq);
          // Friendly minor piece or pawn (p, n, b), strictly NOT king (k), queen (q), or rook (r)
          if (piece && piece.color === turn && (piece.type === 'p' || piece.type === 'n' || piece.type === 'b')) {
            // Rank safety: if piece is a pawn, swapping to anchorSquare must not land on rank 1 or 8!
            if (piece.type === 'p' && !CardUtils.isValidPawnSquare(anchorSquare)) {
              continue;
            }
            targets.push(sq);
          }
        }
      }
    }
    return targets;
  },

  execute(
    engine: DeckChessEngine,
    anchorSquare: string,
    targetSquare?: string
  ): { success: boolean; error?: string } {
    if (!targetSquare) {
      return { success: false, error: 'Knight Swap requires a target minor piece or pawn' };
    }

    const targets = this.getTargets(engine, anchorSquare);
    if (!targets.includes(targetSquare)) {
      return { success: false, error: 'Invalid target piece for Knight Swap' };
    }

    const knight = engine.getPiece(anchorSquare);
    const targetPiece = engine.getPiece(targetSquare);
    if (!knight || !targetPiece) {
      return { success: false, error: 'Pieces missing for swap' };
    }

    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.remove(targetSquare as Square);
    chess.put(targetPiece, anchorSquare as Square);
    chess.put(knight, targetSquare as Square);

    return { success: true };
  },
});

// ==========================================
// 5. Bishop Pierce (Prism Ray)
// ==========================================
registerCardHandler({
  cardId: 'bishop_pierce',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const turn = engine.getTurn();
    const oppColor = turn === 'w' ? 'b' : 'w';
    const coords = CardUtils.getCoords(anchorSquare);
    const diagonals = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    const targets: string[] = [];

    for (const [df, dr] of diagonals) {
      let step = 1;
      while (true) {
        const sq = CardUtils.getSquare(coords.file + df * step, coords.rank + dr * step);
        if (!sq) break;
        if (engine.isSquareBlockedByBarrier(sq)) break;

        const piece = engine.getPiece(sq);
        if (piece) {
          if (piece.color === oppColor && piece.type !== 'k') {
            // Cannot target shielded piece
            if (!engine.isSquareShielded(sq, oppColor)) {
              targets.push(sq);
            }
          }
          break; // Line of sight ends at first piece
        }
        step++;
      }
    }

    return targets;
  },

  execute(
    engine: DeckChessEngine,
    anchorSquare: string,
    targetSquare?: string
  ): { success: boolean; error?: string } {
    if (!targetSquare) {
      return { success: false, error: 'Prism Ray requires a target enemy square' };
    }

    const targets = this.getTargets(engine, anchorSquare);
    if (!targets.includes(targetSquare)) {
      return { success: false, error: 'Target square is not a valid unobstructed enemy piece' };
    }

    const bishop = engine.getPiece(anchorSquare);
    const target1 = engine.getPiece(targetSquare);
    if (!bishop || !target1) {
      return { success: false, error: 'Invalid pieces for Prism Ray' };
    }

    const currentTurn = engine.getTurn();
    const oppColor = currentTurn === 'w' ? 'b' : 'w';
    const chess = engine.getInternalChess();

    // 1. Capture primary target
    engine.addToPlayerGraveyard(oppColor, target1.type);
    chess.remove(targetSquare as Square);

    // 2. Check piercing target directly behind target 1
    const cAnchor = CardUtils.getCoords(anchorSquare);
    const cTarget = CardUtils.getCoords(targetSquare);
    const df = Math.sign(cTarget.file - cAnchor.file);
    const dr = Math.sign(cTarget.rank - cAnchor.rank);
    const nextSq = CardUtils.getSquare(cTarget.file + df, cTarget.rank + dr);

    if (nextSq && !engine.isSquareBlockedByBarrier(nextSq)) {
      const target2 = engine.getPiece(nextSq);
      if (target2 && target2.color === oppColor && target2.type !== 'k' && !engine.isSquareShielded(nextSq, oppColor)) {
        engine.addToPlayerGraveyard(oppColor, target2.type);
        chess.remove(nextSq as Square);
      }
    }

    // 3. Advance bishop to target 1's square
    chess.remove(anchorSquare as Square);
    chess.put(bishop, targetSquare as Square);

    return { success: true };
  },
});

// ==========================================
// 6. Bishop Invert (Color Inversion)
// ==========================================
registerCardHandler({
  cardId: 'bishop_invert',
  evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
    return this.getTargets(engine, anchorSquare).length > 0;
  },

  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const coords = CardUtils.getCoords(anchorSquare);
    const orthogonals = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    const targets: string[] = [];

    for (const [df, dr] of orthogonals) {
      const sq = CardUtils.getSquare(coords.file + df, coords.rank + dr);
      if (sq && !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq)) {
        targets.push(sq);
      }
    }
    return targets;
  },

  execute(
    engine: DeckChessEngine,
    anchorSquare: string,
    targetSquare?: string
  ): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'No empty orthogonal square available for Color Inversion' };
    }

    const bishop = engine.getPiece(anchorSquare);
    if (!bishop) return { success: false, error: 'No bishop at anchor square' };

    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.put(bishop, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 7. Rook Rampart (Rampart Deploy)
// ==========================================
registerCardHandler({
  cardId: 'rook_rampart',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const coords = CardUtils.getCoords(anchorSquare);
    const orthogonals = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    const targets: string[] = [];

    for (const [df, dr] of orthogonals) {
      let step = 1;
      while (true) {
        const sq = CardUtils.getSquare(coords.file + df * step, coords.rank + dr * step);
        if (!sq) break;
        if (engine.getPiece(sq) || engine.isSquareBlockedByBarrier(sq)) break;
        targets.push(sq);
        step++;
      }
    }
    return targets;
  },

  execute(
    engine: DeckChessEngine,
    anchorSquare: string,
    targetSquare?: string
  ): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Target square must be an unobstructed square along Rook line' };
    }

    engine.addModifier({
      id: `barrier_${Date.now()}_${dest}`,
      type: 'barrier',
      square: dest,
      ownerColor: engine.getTurn(),
      turnsRemaining: 2,
    });

    return { success: true };
  },
});

// ==========================================
// 8. King Decree (Royal Decree)
// ==========================================
registerCardHandler({
  cardId: 'king_decree',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const turn = engine.getTurn();
    const coords = CardUtils.getCoords(anchorSquare);
    const isBackRank = coords.rank === 0 || coords.rank === 7;

    return CardUtils.getAdjacentSquares(anchorSquare, true).filter((sq) => {
      const piece = engine.getPiece(sq);
      if (!piece || piece.color !== turn) return false;

      // Invariant: Pawns can NEVER be swapped onto rank 1 or rank 8!
      if (piece.type === 'p' && isBackRank) {
        return false;
      }

      // Check king safety simulation: king cannot swap into direct check
      const sim = engine.clone();
      const simChess = sim.getInternalChess();
      const kingPiece = sim.getPiece(anchorSquare);
      if (!kingPiece) return false;

      simChess.remove(anchorSquare as Square);
      simChess.remove(sq as Square);
      simChess.put(kingPiece, sq as Square);
      simChess.put(piece, anchorSquare as Square);

      if (sim.inCheck()) {
        return false;
      }

      return true;
    });
  },

  execute(
    engine: DeckChessEngine,
    anchorSquare: string,
    targetSquare?: string
  ): { success: boolean; error?: string } {
    if (!targetSquare) {
      return { success: false, error: 'Royal Decree requires an adjacent friendly piece' };
    }

    const targets = this.getTargets(engine, anchorSquare);
    if (!targets.includes(targetSquare)) {
      return { success: false, error: 'Invalid friendly piece for Royal Decree' };
    }

    const king = engine.getPiece(anchorSquare);
    const targetPiece = engine.getPiece(targetSquare);
    if (!king || !targetPiece) {
      return { success: false, error: 'Pieces missing for Royal Decree' };
    }

    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.remove(targetSquare as Square);
    chess.put(king, targetSquare as Square);
    chess.put(targetPiece, anchorSquare as Square);

    return { success: true };
  },
});

// ==========================================
// 9. Queen's Aegis (Regent's Aegis)
// ==========================================
registerCardHandler({
  cardId: 'queen_aegis',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const turn = engine.getTurn();
    return CardUtils.getAdjacentSquares(anchorSquare, true).filter((sq) => {
      const piece = engine.getPiece(sq);
      return piece && piece.color === turn;
    });
  },

  execute(
    engine: DeckChessEngine,
    anchorSquare: string,
    targetSquare?: string
  ): { success: boolean; error?: string } {
    if (!targetSquare) {
      return { success: false, error: 'Target friendly piece required for Aegis' };
    }

    const targets = this.getTargets(engine, anchorSquare);
    if (!targets.includes(targetSquare)) {
      return { success: false, error: 'Invalid friendly piece for Aegis' };
    }

    engine.addModifier({
      id: `shield_${Date.now()}_${targetSquare}`,
      type: 'shield',
      square: targetSquare,
      ownerColor: engine.getTurn(),
      turnsRemaining: 2,
    });

    return { success: true };
  },
});

// ==========================================
// 10. Pawn Reinforce (Conscription Call)
// ==========================================
registerCardHandler({
  cardId: 'pawn_reinforce',
  evaluateConditions(engine: DeckChessEngine): boolean {
    const turn = engine.getTurn();
    return engine.getGraveyard()[turn].p >= 1;
  },

  getTargets(engine: DeckChessEngine, _anchorSquare: string): string[] {
    const turn = engine.getTurn();
    const homeRank = turn === 'w' ? 1 : 6; // rank 2 for White, rank 7 for Black
    const targets: string[] = [];

    for (let f = 0; f < 8; f++) {
      const sq = CardUtils.getSquare(f, homeRank);
      if (sq && !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq)) {
        targets.push(sq);
      }
    }
    return targets;
  },

  execute(
    engine: DeckChessEngine,
    _anchorSquare: string,
    targetSquare?: string
  ): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, _anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Target must be an empty square on home 2nd rank' };
    }

    const turn = engine.getTurn();
    if (engine.getGraveyard()[turn].p < 1) {
      return { success: false, error: 'No pawns in graveyard to resurrect' };
    }

    engine.decrementPlayerGraveyard(turn, 'p');
    const chess = engine.getInternalChess();
    chess.put({ type: 'p', color: turn }, dest as Square);

    return { success: true };
  },
});

// ==========================================
// 11. Knight Outflank (Ghost Steed)
// ==========================================
registerCardHandler({
  cardId: 'knight_outflank',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const coords = CardUtils.getCoords(anchorSquare);
    if (coords.file !== 0 && coords.file !== 7) return [];

    const targetFile = coords.file === 0 ? 7 : 0;
    const targets: string[] = [];

    // Leap directly across the rim to same rank or rank +/- 1
    for (let dr = -1; dr <= 1; dr++) {
      const sq = CardUtils.getSquare(targetFile, coords.rank + dr);
      if (sq && !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq)) {
        targets.push(sq);
      }
    }
    return targets;
  },

  execute(
    engine: DeckChessEngine,
    anchorSquare: string,
    targetSquare?: string
  ): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Target must be an empty square on opposite rim' };
    }

    const knight = engine.getPiece(anchorSquare);
    if (!knight) return { success: false, error: 'No knight at anchor square' };

    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.put(knight, dest as Square);

    return { success: true };
  },
});

// ==========================================
// 12. Rook Ironclad (Ironclad Battery)
// ==========================================
registerCardHandler({
  cardId: 'rook_ironclad',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const turn = engine.getTurn();
    const coords = CardUtils.getCoords(anchorSquare);
    const orthogonals = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    const targets: string[] = [];

    for (const [df, dr] of orthogonals) {
      let step = 1;
      let foundBatteryPartner = false;

      while (true) {
        const sq = CardUtils.getSquare(coords.file + df * step, coords.rank + dr * step);
        if (!sq) break;
        if (engine.isSquareBlockedByBarrier(sq)) break;

        const piece = engine.getPiece(sq);
        if (!foundBatteryPartner) {
          if (piece) {
            if (piece.color === turn && (piece.type === 'r' || piece.type === 'q')) {
              foundBatteryPartner = true;
            } else {
              break; // Obstructed by non-battery piece
            }
          }
        } else {
          // After passing battery partner, candidate empty landing square
          if (piece) break;
          targets.push(sq);
        }
        step++;
      }
    }

    return targets;
  },

  execute(
    engine: DeckChessEngine,
    anchorSquare: string,
    targetSquare?: string
  ): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must target an empty square beyond friendly battery piece' };
    }

    const rook = engine.getPiece(anchorSquare);
    if (!rook) return { success: false, error: 'No rook at anchor square' };

    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.put(rook, dest as Square);

    return { success: true };
  },
});
