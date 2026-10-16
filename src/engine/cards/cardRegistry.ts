import { Chess, PieceSymbol, Square } from 'chess.js';
import {
  BoardModifier,
  CardDefinition,
  DeckChessCardAction,
  PieceColor,
  PieceAnchor,
} from '../../types/deckChess';
import { DeckChessEngine } from '../DeckChessEngine';
import { getCardById, CANONICAL_180_CARDS } from '../cardGraph';

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

  getPinRay(engine: DeckChessEngine, square: string): string[] | null {
    const piece = engine.getPiece(square);
    if (!piece) return null;
    const turn = piece.color;
    const oppColor = (turn === 'w' ? 'b' : 'w') as 'w' | 'b';
    const chess = engine.getInternalChess();

    // Find friendly king
    let kingSquare: string | null = null;
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = DeckChessEngine.coordsToSquare(f, r);
        if (sq) {
          const p = engine.getPiece(sq);
          if (p && p.type === 'k' && p.color === turn) {
            kingSquare = sq;
            break;
          }
        }
      }
      if (kingSquare) break;
    }
    if (!kingSquare) return null;

    if (chess.isAttacked(kingSquare as Square, oppColor)) {
      return null;
    }

    // Remove piece temporarily
    chess.remove(square as Square);
    const kingAttacked = chess.isAttacked(kingSquare as Square, oppColor);
    chess.put(piece, square as Square);

    if (!kingAttacked) return null;

    const kCoords = DeckChessEngine.squareToCoords(kingSquare);
    const pCoords = DeckChessEngine.squareToCoords(square);
    const df = Math.sign(pCoords.file - kCoords.file);
    const dr = Math.sign(pCoords.rank - kCoords.rank);

    const ray: string[] = [];
    let step = 1;
    while (true) {
      const sq = DeckChessEngine.coordsToSquare(kCoords.file + df * step, kCoords.rank + dr * step);
      if (!sq) break;
      ray.push(sq);
      if (sq === square) {
        step++;
        continue;
      }
      const p = engine.getPiece(sq);
      if (p) {
        if (p.color === oppColor && (p.type === 'r' || p.type === 'b' || p.type === 'q')) {
          return ray;
        }
        break;
      }
      step++;
    }
    return null;
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

// ==========================================
// 13. Pawn Bayonet Charge
// ==========================================
registerCardHandler({
  cardId: 'pawn_bayonet_charge',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'p' || piece.color !== turn) return [];
    const dir = turn === 'w' ? 1 : -1;
    const coords = CardUtils.getCoords(anchorSquare);
    const targetSq = CardUtils.getSquare(coords.file, coords.rank + dir);
    if (!targetSq) return [];
    if (engine.isSquareBlockedByBarrier(targetSq)) return [];
    const targetPiece = engine.getPiece(targetSq);
    if (!targetPiece || targetPiece.color === turn) return [];
    if (engine.isSquareShielded(targetSq, targetPiece.color)) return [];
    return [targetSq];
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Target must be an enemy piece directly in front of the pawn' };
    }
    const piece = engine.getPiece(anchorSquare);
    if (!piece) return { success: false, error: 'No pawn at anchor' };
    const enemy = engine.getPiece(dest);
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    if (enemy) {
      chess.remove(dest as Square);
      engine.addToPlayerGraveyard(enemy.color, enemy.type);
    }
    const rank = parseInt(dest[1], 10);
    const isPromotion = (piece.color === 'w' && rank === 8) || (piece.color === 'b' && rank === 1);
    chess.put({ type: isPromotion ? 'q' : 'p', color: piece.color }, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 14. Pawn Hold the Line (In-Place Diagonal Capture)
// ==========================================
registerCardHandler({
  cardId: 'pawn_hold_the_line',
  evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
    const pinRay = CardUtils.getPinRay(engine, anchorSquare);
    return pinRay !== null;
  },
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'p' || piece.color !== turn) return [];
    const dir = turn === 'w' ? 1 : -1;
    const coords = CardUtils.getCoords(anchorSquare);
    const diagFiles = [coords.file - 1, coords.file + 1];
    const targets: string[] = [];
    for (const f of diagFiles) {
      const sq = CardUtils.getSquare(f, coords.rank + dir);
      if (!sq) continue;
      if (engine.isSquareBlockedByBarrier(sq)) continue;
      const targetPiece = engine.getPiece(sq);
      if (targetPiece && targetPiece.color !== turn && !engine.isSquareShielded(sq, targetPiece.color)) {
        targets.push(sq);
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Target must be an enemy piece on a forward-diagonal capture square' };
    }
    const enemy = engine.getPiece(dest);
    if (!enemy) return { success: false, error: 'No enemy piece at target square' };
    const chess = engine.getInternalChess();
    chess.remove(dest as Square);
    engine.addToPlayerGraveyard(enemy.color, enemy.type);
    return { success: true };
  },
});

// ==========================================
// 15. Pawn Close the Gap (Slide Along Pin Ray)
// ==========================================
registerCardHandler({
  cardId: 'pawn_close_the_gap',
  evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
    const pinRay = CardUtils.getPinRay(engine, anchorSquare);
    return pinRay !== null;
  },
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const pinRay = CardUtils.getPinRay(engine, anchorSquare);
    if (!pinRay) return [];
    const anchorIdx = pinRay.indexOf(anchorSquare);
    if (anchorIdx === -1) return [];
    const targets: string[] = [];
    for (let i = 1; i <= 2; i++) {
      const nextIdx = anchorIdx + i;
      if (nextIdx >= pinRay.length) break;
      const sq = pinRay[nextIdx];
      if (engine.isSquareBlockedByBarrier(sq)) break;
      if (engine.getPiece(sq)) break;
      targets.push(sq);
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must move along pin ray onto empty square' };
    }
    const piece = engine.getPiece(anchorSquare);
    if (!piece) return { success: false, error: 'No pawn at anchor' };
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.put(piece, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 16. Pawn Sidestep
// ==========================================
registerCardHandler({
  cardId: 'pawn_sidestep',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'p' || piece.color !== turn) return [];
    const dir = turn === 'w' ? 1 : -1;
    const coords = CardUtils.getCoords(anchorSquare);
    const forwardSq = CardUtils.getSquare(coords.file, coords.rank + dir);
    if (forwardSq && !engine.getPiece(forwardSq)) {
      return [];
    }
    const targets: string[] = [];
    for (const df of [-1, 1]) {
      const sq = CardUtils.getSquare(coords.file + df, coords.rank);
      if (sq && !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq)) {
        targets.push(sq);
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must sidestep to an empty adjacent square' };
    }
    const piece = engine.getPiece(anchorSquare);
    if (!piece) return { success: false, error: 'No pawn at anchor' };
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.put(piece, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 17. Knight Cavalry Charge ((3,1) Camel Leap)
// ==========================================
registerCardHandler({
  cardId: 'knight_cavalry_charge',
  evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
    const turn = engine.getTurn();
    const startSquares = turn === 'w' ? ['b1', 'g1'] : ['b8', 'g8'];
    return startSquares.includes(anchorSquare);
  },
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'n' || piece.color !== turn) return [];
    const dir = turn === 'w' ? 1 : -1;
    const coords = CardUtils.getCoords(anchorSquare);
    const targets: string[] = [];
    for (const df of [-1, 1]) {
      const sq = CardUtils.getSquare(coords.file + df, coords.rank + dir * 3);
      if (sq && !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq)) {
        targets.push(sq);
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Target must be an empty camel leap square' };
    }
    const piece = engine.getPiece(anchorSquare);
    if (!piece) return { success: false, error: 'No knight at anchor' };
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.put(piece, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 18. Knight Spring Vault ((3,2) Zebra Leap)
// ==========================================
registerCardHandler({
  cardId: 'knight_spring_vault',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'n' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const zebraDeltas = [
      [3, 2], [3, -2], [-3, 2], [-3, -2],
      [2, 3], [2, -3], [-2, 3], [-2, -3]
    ];
    const targets: string[] = [];
    for (const [df, dr] of zebraDeltas) {
      const sq = CardUtils.getSquare(coords.file + df, coords.rank + dr);
      if (!sq || engine.isSquareBlockedByBarrier(sq)) continue;
      const targetPiece = engine.getPiece(sq);
      if (!targetPiece || (targetPiece.color !== turn && !engine.isSquareShielded(sq, targetPiece.color))) {
        targets.push(sq);
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Target must be a valid zebra leap destination' };
    }
    const piece = engine.getPiece(anchorSquare);
    if (!piece) return { success: false, error: 'No knight at anchor' };
    const enemy = engine.getPiece(dest);
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    if (enemy) {
      chess.remove(dest as Square);
      engine.addToPlayerGraveyard(enemy.color, enemy.type);
    }
    chess.put(piece, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 19. Knight Straight Lance ((2,0) Orthogonal Lunge)
// ==========================================
registerCardHandler({
  cardId: 'knight_straight_lance',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'n' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const orthogonals = [
      [0, 2], [0, -2], [2, 0], [-2, 0]
    ];
    const targets: string[] = [];
    for (const [df, dr] of orthogonals) {
      const intermediateSq = CardUtils.getSquare(coords.file + df / 2, coords.rank + dr / 2);
      if (!intermediateSq || engine.getPiece(intermediateSq) || engine.isSquareBlockedByBarrier(intermediateSq)) {
        continue;
      }
      const sq = CardUtils.getSquare(coords.file + df, coords.rank + dr);
      if (!sq || engine.isSquareBlockedByBarrier(sq)) continue;
      const targetPiece = engine.getPiece(sq);
      if (!targetPiece || (targetPiece.color !== turn && !engine.isSquareShielded(sq, targetPiece.color))) {
        targets.push(sq);
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Target must be a valid 2-square straight lunge destination' };
    }
    const piece = engine.getPiece(anchorSquare);
    if (!piece) return { success: false, error: 'No knight at anchor' };
    const enemy = engine.getPiece(dest);
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    if (enemy) {
      chess.remove(dest as Square);
      engine.addToPlayerGraveyard(enemy.color, enemy.type);
    }
    chess.put(piece, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 20. Knight Ray Intercept
// ==========================================
registerCardHandler({
  cardId: 'knight_ray_intercept',
  evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
    const pinRay = CardUtils.getPinRay(engine, anchorSquare);
    return pinRay !== null;
  },
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const pinRay = CardUtils.getPinRay(engine, anchorSquare);
    if (!pinRay) return [];
    const anchorIdx = pinRay.indexOf(anchorSquare);
    if (anchorIdx === -1) return [];
    const targets: string[] = [];
    for (let i = 1; i <= 2; i++) {
      const nextIdx = anchorIdx + i;
      if (nextIdx >= pinRay.length) break;
      const sq = pinRay[nextIdx];
      if (engine.isSquareBlockedByBarrier(sq)) break;
      const p = engine.getPiece(sq);
      if (!p) {
        targets.push(sq);
      } else {
        if (p.color !== engine.getTurn() && !engine.isSquareShielded(sq, p.color)) {
          targets.push(sq);
        }
        break;
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must move along pin ray' };
    }
    const piece = engine.getPiece(anchorSquare);
    if (!piece) return { success: false, error: 'No knight at anchor' };
    const enemy = engine.getPiece(dest);
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    if (enemy) {
      chess.remove(dest as Square);
      engine.addToPlayerGraveyard(enemy.color, enemy.type);
    }
    chess.put(piece, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 21. Bishop Piercing Ray
// ==========================================
registerCardHandler({
  cardId: 'bishop_piercing_ray',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'b' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const diagonals = [
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];
    const targets: string[] = [];
    for (const [df, dr] of diagonals) {
      let step = 1;
      let firstEnemySq: string | null = null;
      while (true) {
        const sq = CardUtils.getSquare(coords.file + df * step, coords.rank + dr * step);
        if (!sq || engine.isSquareBlockedByBarrier(sq)) break;
        const p = engine.getPiece(sq);
        if (!firstEnemySq) {
          if (p) {
            if (p.color !== turn && !engine.isSquareShielded(sq, p.color)) {
              firstEnemySq = sq;
            } else {
              break;
            }
          }
        } else {
          if (p) {
            if (p.color !== turn && !engine.isSquareShielded(sq, p.color)) {
              targets.push(sq);
            }
            break;
          }
        }
        step++;
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must target an enemy piece lined up behind another enemy piece' };
    }
    const bishop = engine.getPiece(anchorSquare);
    if (!bishop) return { success: false, error: 'No bishop at anchor' };
    const cFrom = CardUtils.getCoords(anchorSquare);
    const cTo = CardUtils.getCoords(dest);
    const df = Math.sign(cTo.file - cFrom.file);
    const dr = Math.sign(cTo.rank - cFrom.rank);
    let step = 1;
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);

    while (true) {
      const sq = CardUtils.getSquare(cFrom.file + df * step, cFrom.rank + dr * step);
      if (!sq) break;
      const enemy = engine.getPiece(sq);
      if (enemy) {
        chess.remove(sq as Square);
        engine.addToPlayerGraveyard(enemy.color, enemy.type);
      }
      if (sq === dest) break;
      step++;
    }
    chess.put(bishop, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 22. Bishop Aisle Step
// ==========================================
registerCardHandler({
  cardId: 'bishop_aisle_step',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'b' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const orthogonals = [
      [1, 0], [-1, 0], [0, 1], [0, -1]
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
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must step 1 square orthogonally onto empty square' };
    }
    const piece = engine.getPiece(anchorSquare);
    if (!piece) return { success: false, error: 'No bishop at anchor' };
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.put(piece, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 23. Bishop Color Shift
// ==========================================
registerCardHandler({
  cardId: 'bishop_color_shift',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'b' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const targets: string[] = [];
    for (const df of [-1, 1]) {
      const stepSq = CardUtils.getSquare(coords.file + df, coords.rank);
      if (stepSq && !engine.getPiece(stepSq) && !engine.isSquareBlockedByBarrier(stepSq)) {
        targets.push(stepSq);
        const stepCoords = CardUtils.getCoords(stepSq);
        const diagonals = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [ddf, ddr] of diagonals) {
          const diagSq = CardUtils.getSquare(stepCoords.file + ddf, stepCoords.rank + ddr);
          if (diagSq && !engine.getPiece(diagSq) && !engine.isSquareBlockedByBarrier(diagSq)) {
            targets.push(diagSq);
          }
        }
      }
    }
    return [...new Set(targets)];
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Invalid color shift destination' };
    }
    const piece = engine.getPiece(anchorSquare);
    if (!piece) return { success: false, error: 'No bishop at anchor' };
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.put(piece, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 24. Bishop Heretic's Gambit (Knight Jump)
// ==========================================
registerCardHandler({
  cardId: 'bishop_heretic_s_gambit',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'b' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const knightMoves = [
      [2, 1], [2, -1], [-2, 1], [-2, -1],
      [1, 2], [1, -2], [-1, 2], [-1, -2]
    ];
    const targets: string[] = [];
    for (const [df, dr] of knightMoves) {
      const sq = CardUtils.getSquare(coords.file + df, coords.rank + dr);
      if (sq && !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq)) {
        targets.push(sq);
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must make a knight jump onto empty square' };
    }
    const piece = engine.getPiece(anchorSquare);
    if (!piece) return { success: false, error: 'No bishop at anchor' };
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.put(piece, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 25. Rook Railgun Bolt (rook_railgun_bolt)
// ==========================================
registerCardHandler({
  cardId: 'rook_railgun_bolt',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'r' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ];
    const targets: string[] = [];

    for (const [df, dr] of directions) {
      let step = 1;
      let blockers = 0;
      while (true) {
        const sq = CardUtils.getSquare(coords.file + df * step, coords.rank + dr * step);
        if (!sq) break;
        const p = engine.getPiece(sq);
        if (p) {
          if (blockers === 0) {
            blockers++;
          } else {
            // Second piece encountered
            if (p.color !== turn && p.type !== 'k' && !engine.isSquareShielded(sq, p.color)) {
              targets.push(sq);
            }
            break;
          }
        }
        step++;
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must target an enemy piece lined up behind 1 blocker' };
    }
    const enemy = engine.getPiece(dest);
    if (enemy && enemy.type !== 'k') {
      const chess = engine.getInternalChess();
      chess.remove(dest as Square);
      engine.addToPlayerGraveyard(enemy.color, enemy.type);
    }
    return { success: true };
  },
});

// ==========================================
// 26. Rook Counter Battery (rook_counter_battery)
// ==========================================
registerCardHandler({
  cardId: 'rook_counter_battery',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'r' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ];
    const targets: string[] = [];
    for (const [df, dr] of directions) {
      let step = 1;
      while (true) {
        const sq = CardUtils.getSquare(coords.file + df * step, coords.rank + dr * step);
        if (!sq) break;
        const p = engine.getPiece(sq);
        if (p) {
          if (p.color !== turn && p.type === 'r' && !engine.isSquareShielded(sq, p.color)) {
            targets.push(sq);
          }
          break;
        }
        step++;
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must target an aligned enemy Rook' };
    }
    const enemy = engine.getPiece(dest);
    if (enemy && enemy.type !== 'k') {
      const chess = engine.getInternalChess();
      chess.remove(dest as Square);
      engine.addToPlayerGraveyard(enemy.color, enemy.type);
    }
    return { success: true };
  },
});

// ==========================================
// 27. Rook Turret Traverse (rook_turret_traverse)
// ==========================================
registerCardHandler({
  cardId: 'rook_turret_traverse',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'r' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const diagonals = [
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];
    const targets: string[] = [];
    for (const [df, dr] of diagonals) {
      const sq = CardUtils.getSquare(coords.file + df, coords.rank + dr);
      if (sq && !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq)) {
        targets.push(sq);
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must step 1 diagonal square onto empty square' };
    }
    const piece = engine.getPiece(anchorSquare);
    if (!piece) return { success: false, error: 'No rook at anchor' };
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.put(piece, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 28. Rook Siege Hurdle (rook_siege_hurdle)
// ==========================================
registerCardHandler({
  cardId: 'rook_siege_hurdle',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'r' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ];
    const targets: string[] = [];
    for (const [df, dr] of directions) {
      let sawBlocker = false;
      for (let step = 1; step <= 4; step++) {
        const sq = CardUtils.getSquare(coords.file + df * step, coords.rank + dr * step);
        if (!sq) break;
        const p = engine.getPiece(sq);
        if (!sawBlocker) {
          if (p) sawBlocker = true;
        } else {
          if (!p && !engine.isSquareBlockedByBarrier(sq)) {
            targets.push(sq);
          } else {
            break;
          }
        }
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must leap over 1 blocker onto empty square' };
    }
    const piece = engine.getPiece(anchorSquare);
    if (!piece) return { success: false, error: 'No rook at anchor' };
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.put(piece, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 29. Rook Trench Shift (rook_trench_shift)
// ==========================================
registerCardHandler({
  cardId: 'rook_trench_shift',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'r' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const targets: string[] = [];
    for (const df of [-1, 1]) {
      const sq = CardUtils.getSquare(coords.file + df, coords.rank);
      if (sq) {
        const p = engine.getPiece(sq);
        if (p && p.color === turn && p.type === 'p') {
          targets.push(sq);
        }
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must target an adjacent friendly pawn' };
    }
    const rook = engine.getPiece(anchorSquare);
    const pawn = engine.getPiece(dest);
    if (!rook || !pawn) return { success: false, error: 'Pieces missing for Trench Shift' };
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.remove(dest as Square);
    chess.put(rook, dest as Square);
    chess.put(pawn, anchorSquare as Square);
    return { success: true };
  },
});

// ==========================================
// 30. Queen Counter Smite (queen_counter_smite)
// ==========================================
registerCardHandler({
  cardId: 'queen_counter_smite',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'q' || piece.color !== turn) return [];
    const targets: string[] = [];
    const coords = CardUtils.getCoords(anchorSquare);
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const dist = Math.max(Math.abs(f - coords.file), Math.abs(r - coords.rank));
        if (dist >= 1 && dist <= 4) {
          const sq = CardUtils.getSquare(f, r);
          if (sq) {
            const p = engine.getPiece(sq);
            if (p && p.color !== turn && (p.type === 'n' || p.type === 'b') && !engine.isSquareShielded(sq, p.color)) {
              targets.push(sq);
            }
          }
        }
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must target an enemy minor piece in range' };
    }
    const enemy = engine.getPiece(dest);
    if (enemy && enemy.type !== 'k') {
      const chess = engine.getInternalChess();
      chess.remove(dest as Square);
      engine.addToPlayerGraveyard(enemy.color, enemy.type);
    }
    return { success: true };
  },
});

// ==========================================
// 31. Queen Apex Skewer (queen_apex_skewer)
// ==========================================
registerCardHandler({
  cardId: 'queen_apex_skewer',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'q' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];
    const targets: string[] = [];
    for (const [df, dr] of directions) {
      let step = 1;
      let blockers = 0;
      while (true) {
        const sq = CardUtils.getSquare(coords.file + df * step, coords.rank + dr * step);
        if (!sq) break;
        const p = engine.getPiece(sq);
        if (p) {
          if (blockers === 0) {
            blockers++;
          } else {
            if (p.color !== turn && p.type !== 'k' && !engine.isSquareShielded(sq, p.color)) {
              targets.push(sq);
            }
            break;
          }
        }
        step++;
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must target lined-up enemy piece' };
    }
    const enemy = engine.getPiece(dest);
    if (enemy && enemy.type !== 'k') {
      const chess = engine.getInternalChess();
      chess.remove(dest as Square);
      engine.addToPlayerGraveyard(enemy.color, enemy.type);
    }
    return { success: true };
  },
});

// ==========================================
// 32. Queen Phase Evasion (queen_phase_evasion)
// ==========================================
registerCardHandler({
  cardId: 'queen_phase_evasion',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'q' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];
    const targets: string[] = [];
    for (const [df, dr] of directions) {
      let sawBlocker = false;
      for (let step = 1; step <= 3; step++) {
        const sq = CardUtils.getSquare(coords.file + df * step, coords.rank + dr * step);
        if (!sq) break;
        const p = engine.getPiece(sq);
        if (!sawBlocker) {
          if (p) sawBlocker = true;
        } else {
          if (!p && !engine.isSquareBlockedByBarrier(sq)) {
            targets.push(sq);
          } else {
            break;
          }
        }
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must phase-jump over 1 piece onto empty square' };
    }
    const piece = engine.getPiece(anchorSquare);
    if (!piece) return { success: false, error: 'No queen at anchor' };
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.put(piece, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 33. Queen Amazon Hop (queen_amazon_hop)
// ==========================================
registerCardHandler({
  cardId: 'queen_amazon_hop',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'q' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const knightMoves = [
      [2, 1], [2, -1], [-2, 1], [-2, -1],
      [1, 2], [1, -2], [-1, 2], [-1, -2]
    ];
    const targets: string[] = [];
    for (const [df, dr] of knightMoves) {
      const sq = CardUtils.getSquare(coords.file + df, coords.rank + dr);
      if (sq && !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq)) {
        targets.push(sq);
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must make a knight leap onto empty square' };
    }
    const piece = engine.getPiece(anchorSquare);
    if (!piece) return { success: false, error: 'No queen at anchor' };
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.put(piece, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 34. Queen Camel Stride (queen_camel_stride)
// ==========================================
registerCardHandler({
  cardId: 'queen_camel_stride',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'q' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const camelMoves = [
      [3, 1], [3, -1], [-3, 1], [-3, -1],
      [1, 3], [1, -3], [-1, 3], [-1, -3]
    ];
    const targets: string[] = [];
    for (const [df, dr] of camelMoves) {
      const sq = CardUtils.getSquare(coords.file + df, coords.rank + dr);
      if (sq && !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq)) {
        targets.push(sq);
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must make a camel leap onto empty square' };
    }
    const piece = engine.getPiece(anchorSquare);
    if (!piece) return { success: false, error: 'No queen at anchor' };
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.put(piece, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 35. King Keep Garrison (king_keep_garrison)
// ==========================================
registerCardHandler({
  cardId: 'king_keep_garrison',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'k' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const homeRank = turn === 'w' ? 0 : 7;
    const spawnRank = turn === 'w' ? 1 : 6;
    if (coords.rank !== homeRank) return [];

    const targets: string[] = [];
    for (const df of [-1, 0, 1]) {
      const sq = CardUtils.getSquare(coords.file + df, spawnRank);
      if (sq && !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq) && CardUtils.isValidPawnSquare(sq)) {
        targets.push(sq);
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must spawn on empty home 2nd rank square in front of King' };
    }
    const turn = engine.getTurn();
    const chess = engine.getInternalChess();
    chess.put({ type: 'p', color: turn }, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 36. King Sanctuary Hop (king_sanctuary_hop)
// ==========================================
registerCardHandler({
  cardId: 'king_sanctuary_hop',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'k' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const hops = [
      [2, 0], [-2, 0], [0, 2], [0, -2],
      [2, 2], [2, -2], [-2, 2], [-2, -2]
    ];
    const targets: string[] = [];
    for (const [df, dr] of hops) {
      const midSq = CardUtils.getSquare(coords.file + df / 2, coords.rank + dr / 2);
      const destSq = CardUtils.getSquare(coords.file + df, coords.rank + dr);
      if (midSq && destSq && engine.getPiece(midSq) && !engine.getPiece(destSq) && !engine.isSquareBlockedByBarrier(destSq)) {
        targets.push(destSq);
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must hop 2 squares over a piece to an empty square' };
    }
    const piece = engine.getPiece(anchorSquare);
    if (!piece) return { success: false, error: 'No king at anchor' };
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.put(piece, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 37. King Royal Stride (king_royal_stride)
// ==========================================
registerCardHandler({
  cardId: 'king_royal_stride',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'k' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const strides = [
      [2, 0], [-2, 0], [0, 2], [0, -2]
    ];
    const targets: string[] = [];
    for (const [df, dr] of strides) {
      const step1 = CardUtils.getSquare(coords.file + df / 2, coords.rank + dr / 2);
      const step2 = CardUtils.getSquare(coords.file + df, coords.rank + dr);
      if (step1 && step2 && !engine.getPiece(step1) && !engine.getPiece(step2) && !engine.isSquareBlockedByBarrier(step1) && !engine.isSquareBlockedByBarrier(step2)) {
        targets.push(step2);
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must step 2 squares orthogonally along open path' };
    }
    const piece = engine.getPiece(anchorSquare);
    if (!piece) return { success: false, error: 'No king at anchor' };
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.put(piece, dest as Square);
    return { success: true };
  },
});

// ==========================================
// 38. King Bodyguard Switch (king_bodyguard_switch)
// ==========================================
registerCardHandler({
  cardId: 'king_bodyguard_switch',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'k' || piece.color !== turn) return [];
    return CardUtils.getAdjacentSquares(anchorSquare, true).filter((sq) => {
      const p = engine.getPiece(sq);
      return p && p.color === turn && (p.type === 'r' || p.type === 'n' || p.type === 'b');
    });
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must switch with adjacent friendly officer' };
    }
    const king = engine.getPiece(anchorSquare);
    const officer = engine.getPiece(dest);
    if (!king || !officer) return { success: false, error: 'Missing pieces for bodyguard switch' };
    const chess = engine.getInternalChess();
    chess.remove(anchorSquare as Square);
    chess.remove(dest as Square);
    chess.put(king, dest as Square);
    chess.put(officer, anchorSquare as Square);
    return { success: true };
  },
});

// ==========================================
// 39. King Royal Judgement (king_royal_judgement)
// ==========================================
registerCardHandler({
  cardId: 'king_royal_judgement',
  getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
    const piece = engine.getPiece(anchorSquare);
    const turn = engine.getTurn();
    if (!piece || piece.type !== 'k' || piece.color !== turn) return [];
    const coords = CardUtils.getCoords(anchorSquare);
    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ];
    const targets: string[] = [];
    for (const [df, dr] of directions) {
      for (let step = 1; step <= 3; step++) {
        const sq = CardUtils.getSquare(coords.file + df * step, coords.rank + dr * step);
        if (!sq) break;
        const p = engine.getPiece(sq);
        if (p) {
          if (p.color !== turn && p.type !== 'k' && !engine.isSquareShielded(sq, p.color)) {
            targets.push(sq);
          }
          break;
        }
      }
    }
    return targets;
  },
  execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
    const targets = this.getTargets(engine, anchorSquare);
    const dest = targetSquare || targets[0];
    if (!dest || !targets.includes(dest)) {
      return { success: false, error: 'Must target enemy piece in range' };
    }
    const enemy = engine.getPiece(dest);
    if (enemy && enemy.type !== 'k') {
      const chess = engine.getInternalChess();
      chess.remove(dest as Square);
      engine.addToPlayerGraveyard(enemy.color, enemy.type);
    }
    return { success: true };
  },
});

// ==========================================
// 40. Generic Catalog Fallback Registry
// Ensures all 180 canonical cards have a valid registered handler
// ==========================================
function registerRemainingCatalogCards(): void {
  for (const card of CANONICAL_180_CARDS) {
    if (getCardHandler(card.id)) continue;

    registerCardHandler({
      cardId: card.id,
      getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
        const piece = engine.getPiece(anchorSquare);
        const turn = engine.getTurn();
        if (!piece || piece.color !== turn) return [];

        const coords = CardUtils.getCoords(anchorSquare);

        if (card.effect_type === 'Spawning') {
          // Pawn spawning strictly on rank 2-7
          const spawnRank = turn === 'w' ? 1 : 6;
          const targets: string[] = [];
          for (let df = -1; df <= 1; df++) {
            const sq = CardUtils.getSquare(coords.file + df, spawnRank);
            if (sq && !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq) && CardUtils.isValidPawnSquare(sq)) {
              targets.push(sq);
            }
          }
          return targets;
        }

        if (card.effect_type === 'Special Captures') {
          // Scan in all 8 directions for first enemy piece (never King!)
          const dirs = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
          ];
          const targets: string[] = [];
          for (const [df, dr] of dirs) {
            for (let step = 1; step <= 3; step++) {
              const sq = CardUtils.getSquare(coords.file + df * step, coords.rank + dr * step);
              if (!sq) break;
              const p = engine.getPiece(sq);
              if (p) {
                if (p.color !== turn && p.type !== 'k' && !engine.isSquareShielded(sq, p.color)) {
                  targets.push(sq);
                }
                break;
              }
            }
          }
          return targets;
        }

        if (card.effect_type === 'Move Others') {
          return CardUtils.getAdjacentSquares(anchorSquare, true).filter((sq) => {
            const p = engine.getPiece(sq);
            return p && p.color === turn && p.type !== 'k';
          });
        }

        if (card.effect_type === 'Walls & Shields') {
          return CardUtils.getAdjacentSquares(anchorSquare, true).filter((sq) => {
            const p = engine.getPiece(sq);
            return (p && p.color === turn) || (!p && !engine.isSquareBlockedByBarrier(sq));
          });
        }

        // Default New Moves / Jump & Leap
        const steps = [
          [1, 0], [-1, 0], [0, 1], [0, -1],
          [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];
        const targets: string[] = [];
        for (const [df, dr] of steps) {
          const sq = CardUtils.getSquare(coords.file + df, coords.rank + dr);
          if (sq && !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq)) {
            targets.push(sq);
          }
        }
        return targets;
      },
      execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string): { success: boolean; error?: string } {
        const targets = this.getTargets(engine, anchorSquare);
        const dest = targetSquare || targets[0];
        if (!dest || !targets.includes(dest)) {
          return { success: false, error: `Invalid target for ${card.name}` };
        }

        const chess = engine.getInternalChess();
        const piece = engine.getPiece(anchorSquare);
        if (!piece) return { success: false, error: 'No piece at anchor' };

        if (card.effect_type === 'Spawning') {
          if (!CardUtils.isValidPawnSquare(dest)) {
            return { success: false, error: 'Pawn cannot be spawned on rank 1 or 8' };
          }
          chess.put({ type: 'p', color: piece.color }, dest as Square);
          return { success: true };
        }

        if (card.effect_type === 'Special Captures') {
          const enemy = engine.getPiece(dest);
          if (enemy && enemy.type !== 'k') {
            chess.remove(dest as Square);
            engine.addToPlayerGraveyard(enemy.color, enemy.type);
            if (!card.effect_exact?.includes('In-Place') && !card.effect_exact?.includes('Ranged')) {
              chess.remove(anchorSquare as Square);
              chess.put(piece, dest as Square);
            }
          }
          return { success: true };
        }

        if (card.effect_type === 'Move Others') {
          const other = engine.getPiece(dest);
          if (other) {
            chess.remove(anchorSquare as Square);
            chess.remove(dest as Square);
            chess.put(piece, dest as Square);
            chess.put(other, anchorSquare as Square);
          }
          return { success: true };
        }

        if (card.effect_type === 'Walls & Shields') {
          const other = engine.getPiece(dest);
          if (other) {
            engine.addModifier({
              id: `shield_${Date.now()}_${Math.random()}`,
              type: 'shield',
              square: dest,
              ownerColor: piece.color,
              turnsRemaining: 2,
            });
          } else {
            engine.addModifier({
              id: `barrier_${Date.now()}_${Math.random()}`,
              type: 'barrier',
              square: dest,
              ownerColor: piece.color,
              turnsRemaining: 2,
            });
          }
          return { success: true };
        }

        // New Moves / Jump & Leap
        chess.remove(anchorSquare as Square);
        chess.put(piece, dest as Square);
        return { success: true };
      },
    });
  }
}

registerRemainingCatalogCards();
