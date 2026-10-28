import { Chess, PieceSymbol, Square } from 'chess.js';
import {
  CardBehaviorHandler,
  FriendlyPieceSummary,
  TargetOption,
  registerCardHandler,
  CardUtils,
} from './cardRegistry';
import { DeckChessEngine } from '../DeckChessEngine';
import { PieceColor } from '../../types/deckChess';

function hasPiecePawnAdjacency(friendlyPieces: FriendlyPieceSummary[]): boolean {
  const pawns = friendlyPieces.filter((p) => p.type === 'p');
  const pieces = friendlyPieces.filter((p) => p.type !== 'p' && p.type !== 'k');
  for (const pw of pawns) {
    for (const pc of pieces) {
      if (Math.max(Math.abs(pw.file - pc.file), Math.abs(pw.rank - pc.rank)) === 1) {
        return true;
      }
    }
  }
  return false;
}

function hasRookAllyAlignment(friendlyPieces: FriendlyPieceSummary[]): boolean {
  const rooks = friendlyPieces.filter((p) => p.type === 'r');
  const allies = friendlyPieces.filter((p) => p.type === 'p' || p.type === 'n' || p.type === 'b');
  for (const r of rooks) {
    for (const a of allies) {
      if (r.file === a.file || r.rank === a.rank) return true;
    }
  }
  return false;
}

function isPinnedToKing(engine: DeckChessEngine, square: string): boolean {
  return CardUtils.getPinRay(engine, square) !== null;
}

function isSquareDefendedByFriendly(engine: DeckChessEngine, square: string, turn: PieceColor): boolean {
  const coords = CardUtils.getCoords(square);
  const dir = turn === 'w' ? 1 : -1;
  // 1. Friendly Pawns: from (file ± 1, rank - dir)
  for (const df of [-1, 1]) {
    const pSq = CardUtils.getSquare(coords.file + df, coords.rank - dir);
    if (pSq) {
      const p = engine.getPiece(pSq);
      if (p && p.color === turn && p.type === 'p') return true;
    }
  }
  // 2. Friendly Knights
  const knightJumps = [
    [1, 2], [1, -2], [-1, 2], [-1, -2],
    [2, 1], [2, -1], [-2, 1], [-2, -1],
  ];
  for (const [df, dr] of knightJumps) {
    const nSq = CardUtils.getSquare(coords.file + df, coords.rank + dr);
    if (nSq) {
      const p = engine.getPiece(nSq);
      if (p && p.color === turn && p.type === 'n') return true;
    }
  }
  // 3. Friendly Kings (8 surrounding squares)
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const kSq = CardUtils.getSquare(coords.file + df, coords.rank + dr);
      if (kSq) {
        const p = engine.getPiece(kSq);
        if (p && p.color === turn && p.type === 'k') return true;
      }
    }
  }
  // 4. Friendly sliding pieces (B/Q diagonal, R/Q orthogonal)
  const rays = [
    { dirs: [[1, 1], [1, -1], [-1, 1], [-1, -1]], types: ['b', 'q'] },
    { dirs: [[1, 0], [-1, 0], [0, 1], [0, -1]], types: ['r', 'q'] },
  ];
  for (const rayGroup of rays) {
    for (const [df, dr] of rayGroup.dirs) {
      let step = 1;
      while (true) {
        const rSq = CardUtils.getSquare(coords.file + df * step, coords.rank + dr * step);
        if (!rSq || engine.isSquareBlockedByBarrier(rSq)) break;
        const p = engine.getPiece(rSq);
        if (p) {
          if (p.color === turn && rayGroup.types.includes(p.type)) return true;
          break;
        }
        step++;
      }
    }
  }
  return false;
}

function getRelativeRank(rank: number, color: PieceColor): number {
  return color === 'w' ? rank : 7 - rank;
}

export function registerPlaybook36Handlers(): void {
  // ==========================================
  // P1: Sidestep (p1_sidestep)
  // ==========================================
  registerCardHandler({
    cardId: 'p1_sidestep',
    evaluateSetup(friendlyPieces, color) {
      const dir = color === 'w' ? 1 : -1;
      return friendlyPieces.some((p) => p.type === 'p') ? 12 : 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      const frontSq = CardUtils.getSquare(file, rank + dir);
      if (!frontSq) return [];
      const frontPiece = engine.getPiece(frontSq);
      if (!frontPiece) return []; // Must be blocked by any piece (enemy or friendly)

      const targets: string[] = [];
      for (const df of [-1, 1]) {
        const diagSq = CardUtils.getSquare(file + df, rank + dir);
        if (diagSq && !engine.getPiece(diagSq) && !engine.isSquareBlockedByBarrier(diagSq)) {
          targets.push(diagSq);
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid sidestep target' };

      const piece = engine.getPiece(anchorSquare);
      if (!piece) return { success: false, error: 'No pawn at anchor' };

      const chess = engine.getInternalChess();
      chess.remove(anchorSquare as Square);
      chess.put(piece, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // P2: Head On (p2_head_on)
  // ==========================================
  registerCardHandler({
    cardId: 'p2_head_on',
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      const frontSq = CardUtils.getSquare(file, rank + dir);
      if (!frontSq) return [];
      const frontPiece = engine.getPiece(frontSq);
      if (frontPiece && frontPiece.color !== turn && frontPiece.type === 'p') {
        return [frontSq];
      }
      return [];
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Head On target' };

      const piece = engine.getPiece(anchorSquare);
      const enemy = engine.getPiece(dest);
      if (!piece || !enemy) return { success: false, error: 'Missing pieces for Head On' };

      const chess = engine.getInternalChess();
      chess.remove(dest as Square);
      engine.addToPlayerGraveyard(enemy.color, enemy.type);
      chess.remove(anchorSquare as Square);
      chess.put(piece, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // P3: Follow Me / March Together (p3_follow_me)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'p3_follow_me',
    minAnchorsRequired: 2,
    evaluateSetup(friendlyPieces) {
      const pawns = friendlyPieces.filter((p) => p.type === 'p');
      for (let i = 0; i < pawns.length; i++) {
        for (let j = i + 1; j < pawns.length; j++) {
          if (pawns[i].rank === pawns[j].rank && Math.abs(pawns[i].file - pawns[j].file) === 1) {
            return 18;
          }
        }
      }
      return 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      const frontSq = CardUtils.getSquare(file, rank + dir);
      if (!frontSq || engine.getPiece(frontSq) || engine.isSquareBlockedByBarrier(frontSq)) return [];

      const targets: TargetOption[] = [];
      for (const df of [-1, 1]) {
        const partnerSq = CardUtils.getSquare(file + df, rank);
        if (partnerSq) {
          const partnerPiece = engine.getPiece(partnerSq);
          if (partnerPiece && partnerPiece.color === turn && partnerPiece.type === 'p') {
            const partnerFrontSq = CardUtils.getSquare(file + df, rank + dir);
            if (partnerFrontSq && !engine.getPiece(partnerFrontSq) && !engine.isSquareBlockedByBarrier(partnerFrontSq)) {
              targets.push({
                to: frontSq,
                extraSquare: partnerSq,
                disambiguationPrompt: 'Choose adjacent Pawn to march together',
              });
            }
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string, extraSquare?: string) {
      if (!targetSquare) return { success: false, error: 'Missing target square' };
      const rawTargets = this.getTargets(engine, anchorSquare);
      const match = rawTargets.find((t) => {
        if (typeof t === 'string') return t === targetSquare;
        return t.to === targetSquare && (!extraSquare || t.extraSquare === extraSquare);
      });
      if (!match) return { success: false, error: 'Invalid March Together target' };

      const chosenExtra = typeof match === 'string' ? extraSquare : (match.extraSquare || extraSquare);
      if (!chosenExtra) return { success: false, error: 'Missing partner pawn square' };

      const anchorPiece = engine.getPiece(anchorSquare);
      const partnerPiece = engine.getPiece(chosenExtra);
      if (!anchorPiece || !partnerPiece) return { success: false, error: 'Missing pawns for March Together' };

      const { file: partnerFile, rank: partnerRank } = CardUtils.getCoords(chosenExtra);
      const dir = engine.getTurn() === 'w' ? 1 : -1;
      const partnerDest = CardUtils.getSquare(partnerFile, partnerRank + dir);
      if (!partnerDest) return { success: false, error: 'Invalid partner destination' };

      const chess = engine.getInternalChess();
      chess.remove(anchorSquare as Square);
      chess.remove(chosenExtra as Square);
      chess.put(anchorPiece, targetSquare as Square);
      chess.put(partnerPiece, partnerDest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // P4: Attack Together (p4_attack_together)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'p4_attack_together',
    minAnchorsRequired: 2,
    evaluateSetup(friendlyPieces) {
      const pawns = friendlyPieces.filter((p) => p.type === 'p');
      for (let i = 0; i < pawns.length; i++) {
        for (let j = i + 1; j < pawns.length; j++) {
          if (
            Math.abs(pawns[i].file - pawns[j].file) <= 1 &&
            Math.abs(pawns[i].rank - pawns[j].rank) <= 1
          ) {
            return 22;
          }
        }
      }
      return 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      // Find adjacent friendly pawns in 8 surrounding squares
      const adjacentPawns: string[] = [];
      for (let df = -1; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (df === 0 && dr === 0) continue;
          const sq = CardUtils.getSquare(file + df, rank + dr);
          if (sq) {
            const p = engine.getPiece(sq);
            if (p && p.color === turn && p.type === 'p') {
              adjacentPawns.push(sq);
            }
          }
        }
      }
      if (adjacentPawns.length === 0) return [];

      // Forward diagonals with enemy non-King pieces
      const targets: TargetOption[] = [];
      for (const df of [-1, 1]) {
        const enemySq = CardUtils.getSquare(file + df, rank + dir);
        if (enemySq) {
          const ep = engine.getPiece(enemySq);
          if (ep && ep.color !== turn && ep.type !== 'k') {
            for (const adjPawnSq of adjacentPawns) {
              targets.push({
                to: enemySq,
                extraSquare: adjPawnSq,
                disambiguationPrompt: 'Choose adjacent Pawn to follow attack',
              });
            }
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string, extraSquare?: string) {
      if (!targetSquare) return { success: false, error: 'Missing target square' };
      const rawTargets = this.getTargets(engine, anchorSquare);
      const match = rawTargets.find((t) => {
        if (typeof t === 'string') return t === targetSquare;
        return t.to === targetSquare && (!extraSquare || t.extraSquare === extraSquare);
      });
      if (!match) return { success: false, error: 'Invalid Attack Together target' };

      const chosenExtra = typeof match === 'string' ? extraSquare : (match.extraSquare || extraSquare);
      if (!chosenExtra) return { success: false, error: 'Missing adjacent pawn square' };

      const piece = engine.getPiece(anchorSquare);
      const adjPawn = engine.getPiece(chosenExtra);
      const enemy = engine.getPiece(targetSquare);
      if (!piece || !adjPawn || !enemy) return { success: false, error: 'Missing piece for Attack Together' };

      const chess = engine.getInternalChess();
      chess.remove(targetSquare as Square);
      engine.addToPlayerGraveyard(enemy.color, enemy.type);
      chess.remove(anchorSquare as Square);
      chess.remove(chosenExtra as Square);
      chess.put(piece, targetSquare as Square);
      chess.put(adjPawn, anchorSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // P5: Get Behind Me (p5_get_behind_me)
  // ==========================================
  registerCardHandler({
    cardId: 'p5_get_behind_me',
    evaluateSetup(friendlyPieces) {
      return hasPiecePawnAdjacency(friendlyPieces) ? 14 : 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const oppColor = (turn === 'w' ? 'b' : 'w') as PieceColor;
      const dir = turn === 'w' ? 1 : -1;

      const targets: string[] = [];
      // Friendly non-pawn, non-king in the 3 forward squares under attack
      for (const df of [-1, 0, 1]) {
        const sq = CardUtils.getSquare(file + df, rank + dir);
        if (sq) {
          const ap = engine.getPiece(sq);
          if (ap && ap.color === turn && ap.type !== 'p' && ap.type !== 'k') {
            if (engine.getInternalChess().isAttacked(sq as Square, oppColor)) {
              targets.push(sq);
            }
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Get Behind Me move' };

      const pawn = engine.getPiece(anchorSquare);
      const ally = engine.getPiece(dest);
      if (!pawn || !ally) return { success: false, error: 'Missing pieces for swap' };

      const chess = engine.getInternalChess();
      chess.remove(anchorSquare as Square);
      chess.remove(dest as Square);
      chess.put(pawn, dest as Square);
      chess.put(ally, anchorSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // P6: Double Time (p6_tag_out)
  // ==========================================
  registerCardHandler({
    cardId: 'p6_tag_out',
    evaluateSetup(friendlyPieces, color) {
      const dir = color === 'w' ? 1 : -1;
      return friendlyPieces.some((p) => {
        if (p.type !== 'p') return false;
        const relR = getRelativeRank(p.rank, color);
        return relR >= 2 && relR <= 4;
      })
        ? 16
        : 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const relRank = getRelativeRank(rank, turn);
      // Valid strictly on relative Ranks 3, 4, 5 (relRank 2, 3, 4)
      if (relRank < 2 || relRank > 4) return [];

      const dir = turn === 'w' ? 1 : -1;
      const step1 = CardUtils.getSquare(file, rank + dir);
      const step2 = CardUtils.getSquare(file, rank + 2 * dir);
      if (
        step1 &&
        !engine.getPiece(step1) &&
        !engine.isSquareBlockedByBarrier(step1) &&
        step2 &&
        !engine.getPiece(step2) &&
        !engine.isSquareBlockedByBarrier(step2)
      ) {
        return [step2];
      }
      return [];
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Double Time target' };

      const p1 = engine.getPiece(anchorSquare);
      if (!p1) return { success: false, error: 'No pawn at anchor' };

      const chess = engine.getInternalChess();
      chess.remove(anchorSquare as Square);
      chess.put(p1, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // P7: Protect the King (p7_protect_the_king)
  // ==========================================
  registerCardHandler({
    cardId: 'p7_protect_the_king',
    evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      for (let df = -1; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (df === 0 && dr === 0) continue;
          const sq = CardUtils.getSquare(file + df, rank + dr);
          if (sq) {
            const p = engine.getPiece(sq);
            if (p && p.color === turn && p.type === 'k') return true;
          }
        }
      }
      return false;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      if (!this.evaluateConditions?.(engine, anchorSquare)) return [];
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();

      const diagonals = [
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ];
      const targets: string[] = [];
      for (const [df, dr] of diagonals) {
        let step = 1;
        while (true) {
          const sq = CardUtils.getSquare(file + df * step, rank + dr * step);
          if (!sq || engine.isSquareBlockedByBarrier(sq)) break;
          const p = engine.getPiece(sq);
          if (!p) {
            targets.push(sq);
          } else {
            if (p.color !== turn && p.type !== 'k') {
              targets.push(sq);
            }
            break;
          }
          step++;
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Protect the King target' };

      const pawn = engine.getPiece(anchorSquare);
      if (!pawn) return { success: false, error: 'No pawn at anchor' };

      const enemy = engine.getPiece(dest);
      const chess = engine.getInternalChess();
      if (enemy) {
        chess.remove(dest as Square);
        engine.addToPlayerGraveyard(enemy.color, enemy.type);
      }
      chess.remove(anchorSquare as Square);
      chess.put(pawn, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // P8: Call Reserves (p8_call_reserves)
  // ==========================================
  registerCardHandler({
    cardId: 'p8_call_reserves',
    spawnsPieceType: 'p',
    evaluateSetup(friendlyPieces, color) {
      const inEnemyHalf = friendlyPieces.some(
        (p) => p.type === 'p' && (color === 'w' ? p.rank >= 4 : p.rank <= 3)
      );
      return inEnemyHalf ? 20 : 0;
    },
    evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const relRank = getRelativeRank(rank, turn);
      // Ranks 5-7 relative (4, 5, 6)
      if (relRank < 4 || relRank > 6) return false;
      if (!engine.canSpawnPawn(turn)) return false;

      const dir = turn === 'w' ? 1 : -1;
      for (const df of [-1, 1]) {
        const rearSq = CardUtils.getSquare(file + df, rank - dir);
        if (rearSq && !engine.getPiece(rearSq) && !engine.isSquareBlockedByBarrier(rearSq)) {
          return true;
        }
      }
      return false;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      if (!this.evaluateConditions?.(engine, anchorSquare)) return [];
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      const targets: string[] = [];
      for (const df of [-1, 1]) {
        const rearSq = CardUtils.getSquare(file + df, rank - dir);
        if (rearSq && !engine.getPiece(rearSq) && !engine.isSquareBlockedByBarrier(rearSq)) {
          targets.push(rearSq);
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Call Reserves target' };

      const turn = engine.getTurn();
      const chess = engine.getInternalChess();
      chess.put({ type: 'p', color: turn }, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // N1: Adrenaline Jump (n1_adrenaline_jump)
  // ==========================================
  registerCardHandler({
    cardId: 'n1_adrenaline_jump',
    evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
      const oppColor = (engine.getTurn() === 'w' ? 'b' : 'w') as PieceColor;
      return engine.getInternalChess().isAttacked(anchorSquare as Square, oppColor);
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      if (!this.evaluateConditions?.(engine, anchorSquare)) return [];
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();

      const jumps = [
        [3, 1], [3, -1], [-3, 1], [-3, -1],
        [1, 3], [1, -3], [-1, 3], [-1, -3],
      ];
      const targets: string[] = [];
      for (const [df, dr] of jumps) {
        const sq = CardUtils.getSquare(file + df, rank + dr);
        if (sq && !engine.isSquareBlockedByBarrier(sq)) {
          const p = engine.getPiece(sq);
          if (!p || (p.color !== turn && p.type !== 'k')) {
            targets.push(sq);
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Adrenaline Jump target' };

      const knight = engine.getPiece(anchorSquare);
      if (!knight) return { success: false, error: 'No knight at anchor' };

      const enemy = engine.getPiece(dest);
      const chess = engine.getInternalChess();
      if (enemy) {
        chess.remove(dest as Square);
        engine.addToPlayerGraveyard(enemy.color, enemy.type);
      }
      chess.remove(anchorSquare as Square);
      chess.put(knight, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // N2: Swap With Me / Springboard (n2_swap_with_me)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'n2_swap_with_me',
    evaluateSetup(friendlyPieces) {
      const knights = friendlyPieces.filter((p) => p.type === 'n');
      return knights.length > 0 && friendlyPieces.length >= 3 ? 16 : 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();

      const jumps = [
        [1, 2], [1, -2], [-1, 2], [-1, -2],
        [2, 1], [2, -1], [-2, 1], [-2, -1],
      ];

      // Find all L-jump squares S1 occupied by a friendly piece
      const springboards: string[] = [];
      for (const [df, dr] of jumps) {
        const sq = CardUtils.getSquare(file + df, rank + dr);
        if (sq) {
          const p = engine.getPiece(sq);
          if (p && p.color === turn) {
            springboards.push(sq);
          }
        }
      }

      const targets: TargetOption[] = [];
      for (const s1 of springboards) {
        const { file: f1, rank: r1 } = CardUtils.getCoords(s1);
        for (const [df2, dr2] of jumps) {
          const s2 = CardUtils.getSquare(f1 + df2, r1 + dr2);
          if (!s2 || s2 === anchorSquare || engine.isSquareBlockedByBarrier(s2)) continue;
          const p2 = engine.getPiece(s2);
          if (!p2 || (p2.color !== turn && p2.type !== 'k')) {
            targets.push({
              to: s2,
              extraSquare: s1,
              disambiguationPrompt: 'Choose springboard ally',
              arrows: [{ points: [anchorSquare, s1, s2], color: 'green' }],
            });
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string, extraSquare?: string) {
      if (!targetSquare) return { success: false, error: 'Missing Springboard target' };
      const rawTargets = this.getTargets(engine, anchorSquare);
      const match = rawTargets.find((t) => {
        if (typeof t === 'string') return t === targetSquare;
        return t.to === targetSquare && (!extraSquare || t.extraSquare === extraSquare);
      });
      if (!match) return { success: false, error: 'Invalid Springboard target' };

      const knight = engine.getPiece(anchorSquare);
      if (!knight) return { success: false, error: 'No knight at anchor' };

      const enemy = engine.getPiece(targetSquare);
      const chess = engine.getInternalChess();
      if (enemy) {
        chess.remove(targetSquare as Square);
        engine.addToPlayerGraveyard(enemy.color, enemy.type);
      }
      chess.remove(anchorSquare as Square);
      chess.put(knight, targetSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // N3: Trample (n3_trample)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'n3_trample',
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();

      const jumps = [
        [1, 2], [1, -2], [-1, 2], [-1, -2],
        [2, 1], [2, -1], [-2, 1], [-2, -1],
      ];
      const targets: TargetOption[] = [];

      for (const [df, dr] of jumps) {
        const destSq = CardUtils.getSquare(file + df, rank + dr);
        if (!destSq || engine.isSquareBlockedByBarrier(destSq)) continue;
        const destPiece = engine.getPiece(destSq);
        if (destPiece && (destPiece.color === turn || destPiece.type === 'k')) continue;

        // Path A: 2-square straight leg first, then 1-square turn
        const isFileStraight = Math.abs(df) === 2;
        const sfA = isFileStraight ? Math.sign(df) : 0;
        const srA = isFileStraight ? 0 : Math.sign(dr);

        const sqA1 = CardUtils.getSquare(file + sfA, rank + srA);
        const sqA2 = CardUtils.getSquare(file + 2 * sfA, rank + 2 * srA); // elbow corner
        if (sqA1 && sqA2 && !engine.isSquareBlockedByBarrier(sqA1) && !engine.isSquareBlockedByBarrier(sqA2)) {
          const pA1 = engine.getPiece(sqA1);
          const pA2 = engine.getPiece(sqA2);
          const hasEnemyPawnA =
            (pA1 && pA1.color !== turn && pA1.type === 'p') ||
            (pA2 && pA2.color !== turn && pA2.type === 'p');

          if (hasEnemyPawnA) {
            targets.push({
              to: destSq,
              extraSquare: sqA2,
              disambiguationPrompt: 'Choose L-path to trample',
              arrows: [{ points: [anchorSquare, sqA2, destSq], color: 'green' }],
            });
          }
        }

        // Path B: 1-square turn first, then 2-square straight leg
        const tfB = isFileStraight ? 0 : Math.sign(df);
        const trB = isFileStraight ? Math.sign(dr) : 0;
        const sfB = isFileStraight ? Math.sign(df) : 0;
        const srB = isFileStraight ? 0 : Math.sign(dr);

        const cornerB = CardUtils.getSquare(file + tfB, rank + trB); // corner
        const sqB1 = CardUtils.getSquare(file + tfB + sfB, rank + trB + srB);
        if (cornerB && sqB1 && !engine.isSquareBlockedByBarrier(cornerB) && !engine.isSquareBlockedByBarrier(sqB1)) {
          const pB1 = engine.getPiece(cornerB);
          const pB2 = engine.getPiece(sqB1);
          const hasEnemyPawnB =
            (pB1 && pB1.color !== turn && pB1.type === 'p') ||
            (pB2 && pB2.color !== turn && pB2.type === 'p');

          if (hasEnemyPawnB) {
            targets.push({
              to: destSq,
              extraSquare: cornerB,
              disambiguationPrompt: 'Choose L-path to trample',
              arrows: [{ points: [anchorSquare, cornerB, destSq], color: 'gold' }],
            });
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string, extraSquare?: string) {
      if (!targetSquare) return { success: false, error: 'Missing Trample target' };
      const rawTargets = this.getTargets(engine, anchorSquare);
      const match = rawTargets.find((t) => {
        if (typeof t === 'string') return t === targetSquare;
        return t.to === targetSquare && (!extraSquare || t.extraSquare === extraSquare);
      });
      if (!match) return { success: false, error: 'Invalid Trample target' };

      const knight = engine.getPiece(anchorSquare);
      if (!knight) return { success: false, error: 'No knight at anchor' };

      const cFrom = CardUtils.getCoords(anchorSquare);
      const cTo = CardUtils.getCoords(targetSquare);
      const df = cTo.file - cFrom.file;
      const dr = cTo.rank - cFrom.rank;
      const turn = engine.getTurn();
      const chess = engine.getInternalChess();

      const chosenExtra = typeof match === 'string' ? extraSquare : (match.extraSquare || extraSquare);
      const isFileStraight = Math.abs(df) === 2;
      const elbowA = CardUtils.getSquare(
        cFrom.file + (isFileStraight ? 2 * Math.sign(df) : 0),
        cFrom.rank + (isFileStraight ? 0 : 2 * Math.sign(dr))
      );

      // Determine intermediate leg squares
      let legSquares: (string | null)[] = [];
      if (chosenExtra === elbowA) {
        // Path A
        const sfA = isFileStraight ? Math.sign(df) : 0;
        const srA = isFileStraight ? 0 : Math.sign(dr);
        legSquares = [
          CardUtils.getSquare(cFrom.file + sfA, cFrom.rank + srA),
          CardUtils.getSquare(cFrom.file + 2 * sfA, cFrom.rank + 2 * srA),
        ];
      } else {
        // Path B
        const tfB = isFileStraight ? 0 : Math.sign(df);
        const trB = isFileStraight ? Math.sign(dr) : 0;
        const sfB = isFileStraight ? Math.sign(df) : 0;
        const srB = isFileStraight ? 0 : Math.sign(dr);
        legSquares = [
          CardUtils.getSquare(cFrom.file + tfB, cFrom.rank + trB),
          CardUtils.getSquare(cFrom.file + tfB + sfB, cFrom.rank + trB + srB),
        ];
      }

      for (const sq of legSquares) {
        if (sq) {
          const p = engine.getPiece(sq);
          if (p && p.color !== turn && p.type === 'p') {
            chess.remove(sq as Square);
            engine.addToPlayerGraveyard(p.color, p.type);
          }
        }
      }

      const enemyAtDest = engine.getPiece(targetSquare);
      if (enemyAtDest) {
        chess.remove(targetSquare as Square);
        engine.addToPlayerGraveyard(enemyAtDest.color, enemyAtDest.type);
      }

      chess.remove(anchorSquare as Square);
      chess.put(knight, targetSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // N4: Pin Swap / Square Jump (n4_pin_swap)
  // ==========================================
  registerCardHandler({
    cardId: 'n4_pin_swap',
    evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
      return isSquareDefendedByFriendly(engine, anchorSquare, engine.getTurn());
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      if (!this.evaluateConditions?.(engine, anchorSquare)) return [];
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();

      const jumps = [
        [2, 2], [2, -2], [-2, 2], [-2, -2],
      ];
      const targets: string[] = [];
      for (const [df, dr] of jumps) {
        const sq = CardUtils.getSquare(file + df, rank + dr);
        if (sq && !engine.isSquareBlockedByBarrier(sq)) {
          const p = engine.getPiece(sq);
          if (!p || (p.color !== turn && p.type !== 'k')) {
            targets.push(sq);
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Square Jump target' };

      const knight = engine.getPiece(anchorSquare);
      if (!knight) return { success: false, error: 'No knight at anchor' };

      const enemy = engine.getPiece(dest);
      const chess = engine.getInternalChess();
      if (enemy) {
        chess.remove(dest as Square);
        engine.addToPlayerGraveyard(enemy.color, enemy.type);
      }
      chess.remove(anchorSquare as Square);
      chess.put(knight, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // N5: Get to the King (n5_get_to_the_king)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'n5_get_to_the_king',
    evaluateSetup(friendlyPieces) {
      const knights = friendlyPieces.filter((p) => p.type === 'n');
      return knights.length > 0 ? 15 : 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const turn = engine.getTurn();
      const oppColor = (turn === 'w' ? 'b' : 'w') as PieceColor;
      const { file, rank } = CardUtils.getCoords(anchorSquare);

      // Find enemy King
      let enemyKingSq: string | null = null;
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const s = CardUtils.getSquare(f, r);
          if (s) {
            const p = engine.getPiece(s);
            if (p && p.color === oppColor && p.type === 'k') {
              enemyKingSq = s;
              break;
            }
          }
        }
        if (enemyKingSq) break;
      }
      if (!enemyKingSq) return [];

      const jumps = [
        [1, 2], [1, -2], [-1, 2], [-1, -2],
        [2, 1], [2, -1], [-2, 1], [-2, -1],
      ];

      const targets: TargetOption[] = [];
      const cK = CardUtils.getCoords(enemyKingSq);

      for (const [df1, dr1] of jumps) {
        const s1 = CardUtils.getSquare(file + df1, rank + dr1);
        if (!s1 || engine.isSquareBlockedByBarrier(s1)) continue;
        const p1 = engine.getPiece(s1);
        if (p1 && (p1.color === turn || p1.type === 'k')) continue;

        // Condition 1: Check if S1 delivers check to enemy King
        const c1 = CardUtils.getCoords(s1);
        const kDf = Math.abs(c1.file - cK.file);
        const kDr = Math.abs(c1.rank - cK.rank);
        const attacksKing = (kDf === 1 && kDr === 2) || (kDf === 2 && kDr === 1);
        if (!attacksKing) continue;

        // Condition 2: Check if S1 attacks at least 1 other enemy non-King piece
        let hasOtherTarget = false;
        for (const [dfT, drT] of jumps) {
          const sqT = CardUtils.getSquare(c1.file + dfT, c1.rank + drT);
          if (sqT && sqT !== enemyKingSq && sqT !== anchorSquare) {
            const pt = engine.getPiece(sqT);
            if (pt && pt.color === oppColor && pt.type !== 'k') {
              hasOtherTarget = true;
              break;
            }
          }
        }
        if (!hasOtherTarget) continue;

        // Condition 3: Verify S1 is NOT threatened by any enemy piece after moving Knight to S1
        const sim = engine.clone();
        const simChess = sim.getInternalChess();
        const knightPiece = sim.getPiece(anchorSquare);
        if (!knightPiece) continue;
        if (p1) {
          simChess.remove(s1 as Square);
        }
        simChess.remove(anchorSquare as Square);
        simChess.put(knightPiece, s1 as Square);

        // Check if any standard enemy move attacks S1
        if (simChess.isAttacked(s1 as Square, oppColor)) {
          continue; // Threatened! Rejects S1.
        }

        // Fork square S1 is valid and safe! Generate second jumps S2
        for (const [df2, dr2] of jumps) {
          const s2 = CardUtils.getSquare(c1.file + df2, c1.rank + dr2);
          if (!s2 || s2 === anchorSquare || engine.isSquareBlockedByBarrier(s2)) continue;
          const p2 = engine.getPiece(s2);
          if (!p2 || (p2.color !== turn && p2.type !== 'k')) {
            targets.push({
              to: s2,
              extraSquare: s1,
              stageExtraSquareFirst: true,
              disambiguationPrompt: 'Click safe forking square first',
              arrows: [{ points: [anchorSquare, s1, s2], color: 'gold' }],
            });
          }
        }
      }

      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string, extraSquare?: string) {
      if (!targetSquare) return { success: false, error: 'Missing Get to the King target' };
      const rawTargets = this.getTargets(engine, anchorSquare);
      const match = rawTargets.find((t) => {
        if (typeof t === 'string') return t === targetSquare;
        return t.to === targetSquare && (!extraSquare || t.extraSquare === extraSquare);
      });
      if (!match) return { success: false, error: 'Invalid Get to the King target' };

      const chosenS1 = typeof match === 'string' ? extraSquare : (match.extraSquare || extraSquare);
      if (!chosenS1) return { success: false, error: 'Missing safe fork square S1' };

      const knight = engine.getPiece(anchorSquare);
      if (!knight) return { success: false, error: 'No knight at anchor' };

      const chess = engine.getInternalChess();

      // If an enemy piece was on S1, capture it
      const enemyS1 = engine.getPiece(chosenS1);
      if (enemyS1) {
        chess.remove(chosenS1 as Square);
        engine.addToPlayerGraveyard(enemyS1.color, enemyS1.type);
      }

      // If an enemy piece was on targetSquare (S2), capture it
      const enemyS2 = engine.getPiece(targetSquare);
      if (enemyS2) {
        chess.remove(targetSquare as Square);
        engine.addToPlayerGraveyard(enemyS2.color, enemyS2.type);
      }

      chess.remove(anchorSquare as Square);
      chess.put(knight, targetSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // N6: Flanking Support (n6_flanking_support)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'n6_flanking_support',
    minAnchorsRequired: 2,
    evaluateSetup(friendlyPieces) {
      const knights = friendlyPieces.filter((p) => p.type === 'n');
      return knights.length >= 2 && knights.some((k) => k.file <= 1 || k.file >= 6) ? 18 : 0;
    },
    evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
      const { file } = CardUtils.getCoords(anchorSquare);
      // a, b, g, or h files (0, 1, 6, 7)
      if (file > 1 && file < 6) return false;
      const turn = engine.getTurn();

      // Verify second friendly knight exists
      let otherKnights = 0;
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const s = CardUtils.getSquare(f, r);
          if (s && s !== anchorSquare) {
            const p = engine.getPiece(s);
            if (p && p.color === turn && p.type === 'n') otherKnights++;
          }
        }
      }
      return otherKnights > 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      if (!this.evaluateConditions?.(engine, anchorSquare)) return [];
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();

      // Find other friendly knights
      const otherKnights: string[] = [];
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const s = CardUtils.getSquare(f, r);
          if (s && s !== anchorSquare) {
            const p = engine.getPiece(s);
            if (p && p.color === turn && p.type === 'n') otherKnights.push(s);
          }
        }
      }

      const jumps = [
        [1, 2], [1, -2], [-1, 2], [-1, -2],
        [2, 1], [2, -1], [-2, 1], [-2, -1],
      ];
      const targets: TargetOption[] = [];
      for (const [df, dr] of jumps) {
        const destSq = CardUtils.getSquare(file + df, rank + dr);
        if (destSq && !engine.isSquareBlockedByBarrier(destSq)) {
          const p = engine.getPiece(destSq);
          if (!p || (p.color !== turn && p.type !== 'k')) {
            for (const otherK of otherKnights) {
              targets.push({
                to: destSq,
                extraSquare: otherK,
                disambiguationPrompt: 'Choose reinforcing Knight',
              });
            }
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string, extraSquare?: string) {
      if (!targetSquare) return { success: false, error: 'Missing target' };
      const rawTargets = this.getTargets(engine, anchorSquare);
      const match = rawTargets.find((t) => {
        if (typeof t === 'string') return t === targetSquare;
        return t.to === targetSquare && (!extraSquare || t.extraSquare === extraSquare);
      });
      if (!match) return { success: false, error: 'Invalid Flanking Support target' };

      const chosenOtherK = typeof match === 'string' ? extraSquare : (match.extraSquare || extraSquare);
      if (!chosenOtherK) return { success: false, error: 'Missing second knight square' };

      const k1 = engine.getPiece(anchorSquare);
      const k2 = engine.getPiece(chosenOtherK);
      if (!k1 || !k2) return { success: false, error: 'Missing knights for Flanking Support' };

      const enemy = engine.getPiece(targetSquare);
      const chess = engine.getInternalChess();
      if (enemy) {
        chess.remove(targetSquare as Square);
        engine.addToPlayerGraveyard(enemy.color, enemy.type);
      }
      chess.remove(anchorSquare as Square);
      chess.remove(chosenOtherK as Square);
      chess.put(k1, targetSquare as Square);
      chess.put(k2, anchorSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // N7: Outpost Support (n7_outpost_support)
  // ==========================================
  registerCardHandler({
    cardId: 'n7_outpost_support',
    spawnsPieceType: 'p',
    evaluateSetup(friendlyPieces, color) {
      const inEnemyHalf = friendlyPieces.some(
        (p) => p.type === 'n' && (color === 'w' ? p.rank >= 4 : p.rank <= 3)
      );
      return inEnemyHalf ? 20 : 0;
    },
    evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const relRank = getRelativeRank(rank, turn);
      // Ranks 5-8 relative (4..7)
      if (relRank < 4) return false;
      if (!engine.canSpawnPawn(turn)) return false;

      const dir = turn === 'w' ? 1 : -1;
      for (const df of [-1, 1]) {
        const sq = CardUtils.getSquare(file + df, rank - dir);
        if (sq && !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq)) {
          return true;
        }
      }
      return false;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      if (!this.evaluateConditions?.(engine, anchorSquare)) return [];
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      const targets: string[] = [];
      for (const df of [-1, 1]) {
        const sq = CardUtils.getSquare(file + df, rank - dir);
        if (sq && !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq)) {
          targets.push(sq);
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Outpost Support target' };

      const turn = engine.getTurn();
      const chess = engine.getInternalChess();
      chess.put({ type: 'p', color: turn }, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // B1: Let Me Through (b1_let_me_through)
  // ==========================================
  registerCardHandler({
    cardId: 'b1_let_me_through',
    evaluateSetup(friendlyPieces) {
      return hasPiecePawnAdjacency(friendlyPieces) ? 14 : 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      const targets: string[] = [];
      // Only forward diagonals
      for (const df of [-1, 1]) {
        let step = 1;
        let foundFriendlyPawn = false;
        while (true) {
          const sq = CardUtils.getSquare(file + df * step, rank + dir * step);
          if (!sq || engine.isSquareBlockedByBarrier(sq)) break;

          const p = engine.getPiece(sq);
          if (!foundFriendlyPawn) {
            if (p) {
              if (p.color === turn && p.type === 'p') {
                foundFriendlyPawn = true;
              } else {
                break; // blocked by non-pawn or enemy
              }
            }
          } else {
            // Beyond the friendly pawn
            if (!p) {
              targets.push(sq);
            } else {
              if (p.color !== turn && p.type !== 'k') {
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
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Let Me Through target' };

      const bishop = engine.getPiece(anchorSquare);
      if (!bishop) return { success: false, error: 'No bishop at anchor' };

      const enemy = engine.getPiece(dest);
      const chess = engine.getInternalChess();
      if (enemy) {
        chess.remove(dest as Square);
        engine.addToPlayerGraveyard(enemy.color, enemy.type);
      }
      chess.remove(anchorSquare as Square);
      chess.put(bishop, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // B2: Pierce (b2_pierce)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'b2_pierce',
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const diagonals = [
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ];

      const targets: TargetOption[] = [];
      for (const [df, dr] of diagonals) {
        let step = 1;
        let enemyPawnSq: string | null = null;
        while (true) {
          const sq = CardUtils.getSquare(file + df * step, rank + dr * step);
          if (!sq || engine.isSquareBlockedByBarrier(sq)) break;

          const p = engine.getPiece(sq);
          if (!enemyPawnSq) {
            if (p) {
              if (p.color !== turn && p.type === 'p') {
                enemyPawnSq = sq;
              } else {
                break; // blocked by friendly piece or non-pawn
              }
            }
          } else {
            // Beyond the enemy pawn: can land on empty OR capture enemy non-king
            if (!p) {
              targets.push({ to: sq, extraSquare: enemyPawnSq });
            } else {
              if (p.color !== turn && p.type !== 'k') {
                targets.push({ to: sq, extraSquare: enemyPawnSq });
              }
              break; // obstructed further
            }
          }
          step++;
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string, extraSquare?: string) {
      if (!targetSquare) return { success: false, error: 'Missing Pierce target' };
      const rawTargets = this.getTargets(engine, anchorSquare);
      const match = rawTargets.find((t) => {
        if (typeof t === 'string') return t === targetSquare;
        return t.to === targetSquare && (!extraSquare || t.extraSquare === extraSquare);
      });
      if (!match) return { success: false, error: 'Invalid Pierce target' };

      const chosenPawnSq = typeof match === 'string' ? extraSquare : (match.extraSquare || extraSquare);
      if (!chosenPawnSq) return { success: false, error: 'Missing pierced pawn square' };

      const piercedPawn = engine.getPiece(chosenPawnSq);
      const bishop = engine.getPiece(anchorSquare);
      if (!bishop || !piercedPawn) return { success: false, error: 'Missing piece for Pierce' };

      const enemy = engine.getPiece(targetSquare);
      const chess = engine.getInternalChess();

      // Destroy the pierced enemy pawn
      chess.remove(chosenPawnSq as Square);
      engine.addToPlayerGraveyard(piercedPawn.color, piercedPawn.type);

      // Capture destination enemy if present
      if (enemy) {
        chess.remove(targetSquare as Square);
        engine.addToPlayerGraveyard(enemy.color, enemy.type);
      }

      chess.remove(anchorSquare as Square);
      chess.put(bishop, targetSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // B3: Ricochet (b3_ricochet)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'b3_ricochet',
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const diagonals = [
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ];

      const targets: TargetOption[] = [];
      for (const [df, dr] of diagonals) {
        let step = 1;
        while (true) {
          const edgeF = file + df * step;
          const edgeR = rank + dr * step;
          const edgeSq = CardUtils.getSquare(edgeF, edgeR);
          if (!edgeSq || engine.isSquareBlockedByBarrier(edgeSq) || engine.getPiece(edgeSq)) break;

          // Check if edgeSq is on an outer file (a or h)
          if (edgeF === 0 || edgeF === 7) {
            // Bounce 90 degrees inward: reflected vector is (-df, dr)
            const bdf = -df;
            const bdr = dr;
            let bstep = 1;
            while (true) {
              const bsq = CardUtils.getSquare(edgeF + bdf * bstep, edgeR + bdr * bstep);
              if (!bsq || engine.isSquareBlockedByBarrier(bsq)) break;
              const bp = engine.getPiece(bsq);
              if (!bp) {
                targets.push({ to: bsq, extraSquare: edgeSq });
              } else {
                if (bp.color !== turn && bp.type !== 'k') {
                  targets.push({ to: bsq, extraSquare: edgeSq });
                }
                break;
              }
              bstep++;
            }
            break; // Ray reached rim
          }
          step++;
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string, extraSquare?: string) {
      if (!targetSquare) return { success: false, error: 'Missing Ricochet target' };
      const rawTargets = this.getTargets(engine, anchorSquare);
      const match = rawTargets.find((t) => {
        if (typeof t === 'string') return t === targetSquare;
        return t.to === targetSquare && (!extraSquare || t.extraSquare === extraSquare);
      });
      if (!match) return { success: false, error: 'Invalid Ricochet target' };

      const bishop = engine.getPiece(anchorSquare);
      if (!bishop) return { success: false, error: 'No bishop at anchor' };

      const enemy = engine.getPiece(targetSquare);
      const chess = engine.getInternalChess();
      if (enemy) {
        chess.remove(targetSquare as Square);
        engine.addToPlayerGraveyard(enemy.color, enemy.type);
      }
      chess.remove(anchorSquare as Square);
      chess.put(bishop, targetSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // B4: Change Color (b4_change_color)
  // ==========================================
  registerCardHandler({
    cardId: 'b4_change_color',
    evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
      const turn = engine.getTurn();
      const adjacent = CardUtils.getAdjacentSquares(anchorSquare, false);
      return adjacent.some((sq) => {
        const p = engine.getPiece(sq);
        return p && p.color !== turn;
      });
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      if (!this.evaluateConditions?.(engine, anchorSquare)) return [];
      const turn = engine.getTurn();
      const adjacent = CardUtils.getAdjacentSquares(anchorSquare, false);
      const targets: string[] = [];
      for (const sq of adjacent) {
        if (engine.isSquareBlockedByBarrier(sq)) continue;
        const p = engine.getPiece(sq);
        if (!p || (p.color !== turn && p.type !== 'k')) {
          targets.push(sq);
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Change Color target' };

      const bishop = engine.getPiece(anchorSquare);
      if (!bishop) return { success: false, error: 'No bishop at anchor' };

      const enemy = engine.getPiece(dest);
      const chess = engine.getInternalChess();
      if (enemy) {
        chess.remove(dest as Square);
        engine.addToPlayerGraveyard(enemy.color, enemy.type);
      }
      chess.remove(anchorSquare as Square);
      chess.put(bishop, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // B5: Take My Place (b5_take_my_place)
  // ==========================================
  registerCardHandler({
    cardId: 'b5_take_my_place',
    evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
      const oppColor = (engine.getTurn() === 'w' ? 'b' : 'w') as PieceColor;
      return engine.getInternalChess().isAttacked(anchorSquare as Square, oppColor);
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      if (!this.evaluateConditions?.(engine, anchorSquare)) return [];
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const diagonals = [
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ];

      const targets: string[] = [];
      for (const [df, dr] of diagonals) {
        let step = 1;
        while (true) {
          const sq = CardUtils.getSquare(file + df * step, rank + dr * step);
          if (!sq || engine.isSquareBlockedByBarrier(sq)) break;
          const p = engine.getPiece(sq);
          if (p) {
            if (p.color === turn && p.type !== 'k') {
              targets.push(sq);
            }
            break;
          }
          step++;
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Take My Place target' };

      const bishop = engine.getPiece(anchorSquare);
      const ally = engine.getPiece(dest);
      if (!bishop || !ally || ally.type === 'k') return { success: false, error: 'Missing or invalid pieces for swap' };

      const chess = engine.getInternalChess();
      chess.remove(anchorSquare as Square);
      chess.remove(dest as Square);
      chess.put(bishop, dest as Square);
      chess.put(ally, anchorSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // B6: Diagonal Launch (b6_come_this_way)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'b6_come_this_way',
    evaluateSetup(friendlyPieces) {
      return hasPiecePawnAdjacency(friendlyPieces) ? 14 : 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      const targets: TargetOption[] = [];
      // Friendly pawn on any of 3 squares in the rank ahead: (file - 1..file + 1, rank + dir)
      for (const df of [-1, 0, 1]) {
        const pawnSq = CardUtils.getSquare(file + df, rank + dir);
        if (pawnSq) {
          const p = engine.getPiece(pawnSq);
          if (p && p.color === turn && p.type === 'p') {
            const { file: pf, rank: pr } = CardUtils.getCoords(pawnSq);
            // Launch along pawn's forward diagonals
            for (const pdf of [-1, 1]) {
              let step = 1;
              while (true) {
                const sq = CardUtils.getSquare(pf + pdf * step, pr + dir * step);
                if (!sq || engine.isSquareBlockedByBarrier(sq)) break;
                const destPiece = engine.getPiece(sq);
                if (!destPiece) {
                  targets.push({
                    to: sq,
                    extraSquare: pawnSq,
                    disambiguationPrompt: 'Choose Pawn to launch',
                  });
                } else {
                  if (destPiece.color !== turn && destPiece.type !== 'k') {
                    targets.push({
                      to: sq,
                      extraSquare: pawnSq,
                      disambiguationPrompt: 'Choose Pawn to launch',
                    });
                  }
                  break;
                }
                step++;
              }
            }
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string, extraSquare?: string) {
      if (!targetSquare) return { success: false, error: 'Missing Diagonal Launch target' };
      const rawTargets = this.getTargets(engine, anchorSquare);
      const match = rawTargets.find((t) => {
        if (typeof t === 'string') return t === targetSquare;
        return t.to === targetSquare && (!extraSquare || t.extraSquare === extraSquare);
      });
      if (!match) return { success: false, error: 'Invalid Diagonal Launch target' };

      const chosenPawnSq = typeof match === 'string' ? extraSquare : (match.extraSquare || extraSquare);
      if (!chosenPawnSq) return { success: false, error: 'Missing launched pawn square' };

      const pawn = engine.getPiece(chosenPawnSq);
      if (!pawn) return { success: false, error: 'No friendly pawn at extraSquare' };

      const enemy = engine.getPiece(targetSquare);
      const chess = engine.getInternalChess();
      if (enemy) {
        chess.remove(targetSquare as Square);
        engine.addToPlayerGraveyard(enemy.color, enemy.type);
      }
      chess.remove(chosenPawnSq as Square);
      chess.put(pawn, targetSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // B7: Bishop's Blessing (b7_bishops_blessing)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'b7_bishops_blessing',
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();

      const targets: TargetOption[] = [];
      const diagonals = [
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ];

      // Any friendly non-bishop piece in 8 surrounding squares
      for (let df = -1; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (df === 0 && dr === 0) continue;
          const allySq = CardUtils.getSquare(file + df, rank + dr);
          if (allySq) {
            const ally = engine.getPiece(allySq);
            if (ally && ally.color === turn && ally.type !== 'b' && ally.type !== 'k') {
              const { file: af, rank: ar } = CardUtils.getCoords(allySq);
              for (const [ddf, ddr] of diagonals) {
                let step = 1;
                while (true) {
                  const sq = CardUtils.getSquare(af + ddf * step, ar + ddr * step);
                  if (!sq || sq === anchorSquare || engine.isSquareBlockedByBarrier(sq)) break;
                  const p = engine.getPiece(sq);
                  if (!p) {
                    targets.push({
                      to: sq,
                      extraSquare: allySq,
                      disambiguationPrompt: 'Choose blessed ally',
                    });
                  } else {
                    if (p.color !== turn && p.type !== 'k') {
                      targets.push({
                        to: sq,
                        extraSquare: allySq,
                        disambiguationPrompt: 'Choose blessed ally',
                      });
                    }
                    break;
                  }
                  step++;
                }
              }
            }
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string, extraSquare?: string) {
      if (!targetSquare) return { success: false, error: 'Missing Bishop\'s Blessing destination' };
      const rawTargets = this.getTargets(engine, anchorSquare);
      const match = rawTargets.find((t) => {
        if (typeof t === 'string') return t === targetSquare;
        return t.to === targetSquare && (!extraSquare || t.extraSquare === extraSquare);
      });
      if (!match) return { success: false, error: 'Invalid Bishop\'s Blessing destination' };

      const chosenAllySq = typeof match === 'string' ? extraSquare : (match.extraSquare || extraSquare);
      if (!chosenAllySq) return { success: false, error: 'Missing blessed ally square' };

      const ally = engine.getPiece(chosenAllySq);
      if (!ally) return { success: false, error: 'No ally at selected square' };

      const enemy = engine.getPiece(targetSquare);
      const chess = engine.getInternalChess();
      if (enemy) {
        chess.remove(targetSquare as Square);
        engine.addToPlayerGraveyard(enemy.color, enemy.type);
      }
      chess.remove(chosenAllySq as Square);
      chess.put(ally, targetSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // R1: Make Way (r1_make_way)
  // ==========================================
  registerCardHandler({
    cardId: 'r1_make_way',
    evaluateSetup(friendlyPieces) {
      return hasRookAllyAlignment(friendlyPieces) ? 15 : 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const orthogonals: [number, number][] = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
      ];

      const targets: TargetOption[] = [];
      for (const [df, dr] of orthogonals) {
        const pawnSq = CardUtils.getSquare(file + df, rank + dr);
        if (!pawnSq) continue;
        const p = engine.getPiece(pawnSq);
        if (!p || p.color !== turn || p.type !== 'p') continue;

        const pawnCoords = CardUtils.getCoords(pawnSq);
        const perpendiculars: [number, number][] = [
          [-dr, df],
          [dr, -df],
        ];

        const validPawnDests: string[] = [];
        for (const [pDf, pDr] of perpendiculars) {
          const pawnDest = CardUtils.getSquare(pawnCoords.file + pDf, pawnCoords.rank + pDr);
          if (pawnDest && !engine.getPiece(pawnDest) && !engine.isSquareBlockedByBarrier(pawnDest)) {
            validPawnDests.push(pawnDest);
          }
        }

        if (validPawnDests.length === 0) continue;

        const rookDestinations: string[] = [];
        let step = 1;
        while (true) {
          const rookDest = CardUtils.getSquare(file + df * step, rank + dr * step);
          if (!rookDest) break;
          if (engine.isSquareBlockedByBarrier(rookDest)) break;

          if (rookDest === pawnSq) {
            rookDestinations.push(rookDest);
          } else {
            const destPiece = engine.getPiece(rookDest);
            if (destPiece) {
              if (destPiece.color !== turn && destPiece.type !== 'k') {
                rookDestinations.push(rookDest);
              }
              break;
            } else {
              rookDestinations.push(rookDest);
            }
          }
          step++;
        }

        for (const rookDest of rookDestinations) {
          for (const pawnDest of validPawnDests) {
            targets.push({
              to: rookDest,
              extraSquare: pawnDest,
              disambiguationPrompt: 'Choose which square the pawn steps aside to',
            });
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string, extraSquare?: string) {
      if (!targetSquare) return { success: false, error: 'Missing target square for Make Way' };
      const rawTargets = this.getTargets(engine, anchorSquare);
      const match = rawTargets.find((t) => {
        if (typeof t === 'string') return t === targetSquare;
        return t.to === targetSquare && (!extraSquare || t.extraSquare === extraSquare);
      });
      if (!match) return { success: false, error: 'Invalid Make Way target' };

      const chosenPawnDest = typeof match === 'string' ? extraSquare : (match.extraSquare || extraSquare);
      if (!chosenPawnDest) return { success: false, error: 'Missing pawn destination square' };

      const rook = engine.getPiece(anchorSquare);
      if (!rook) return { success: false, error: 'Missing Rook for Make Way' };

      const cRook = CardUtils.getCoords(anchorSquare);
      const cTarget = CardUtils.getCoords(targetSquare);
      const diffF = cTarget.file - cRook.file;
      const diffR = cTarget.rank - cRook.rank;
      const df = Math.sign(diffF);
      const dr = Math.sign(diffR);
      if ((df === 0 && dr === 0) || (df !== 0 && dr !== 0)) {
        return { success: false, error: 'Target square must be along an orthogonal line from Rook' };
      }

      const pawnSq = CardUtils.getSquare(cRook.file + df, cRook.rank + dr);
      if (!pawnSq) return { success: false, error: 'Invalid pawn square' };
      const pawn = engine.getPiece(pawnSq);
      if (!pawn || pawn.color !== engine.getTurn() || pawn.type !== 'p') {
        return { success: false, error: 'Missing friendly pawn adjacent to Rook along movement line' };
      }

      const chess = engine.getInternalChess();

      if (targetSquare !== pawnSq) {
        const enemy = engine.getPiece(targetSquare);
        if (enemy) {
          if (enemy.color === engine.getTurn() || enemy.type === 'k') {
            return { success: false, error: 'Cannot capture friendly piece or king' };
          }
          engine.addToPlayerGraveyard(enemy.color, enemy.type);
          chess.remove(targetSquare as Square);
        }
      }

      chess.remove(pawnSq as Square);
      chess.put(pawn, chosenPawnDest as Square);

      chess.remove(anchorSquare as Square);
      chess.put(rook, targetSquare as Square);

      return { success: true };
    },
  });

  // ==========================================
  // R2: I've Got Your Back (r2_ive_got_your_back)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'r2_ive_got_your_back',
    evaluateSetup(friendlyPieces) {
      return hasRookAllyAlignment(friendlyPieces) ? 15 : 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      const targets: TargetOption[] = [];
      for (const df of [-1, 1]) {
        let step = 1;
        while (true) {
          const sq = CardUtils.getSquare(file + df * step, rank);
          if (!sq || engine.isSquareBlockedByBarrier(sq)) break;
          const p = engine.getPiece(sq);
          if (p) {
            if (p.color === turn && p.type !== 'k') {
              const forwardSq = CardUtils.getSquare(file + df * step, rank + dir);
              if (forwardSq && !engine.isSquareBlockedByBarrier(forwardSq)) {
                const fp = engine.getPiece(forwardSq);
                if (!fp || (fp.color !== turn && fp.type !== 'k')) {
                  targets.push({ to: sq, extraSquare: sq });
                }
              }
            }
            break;
          }
          step++;
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string, extraSquare?: string) {
      const rawTargets = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || (typeof rawTargets[0] === 'string' ? rawTargets[0] : rawTargets[0]?.to);
      if (!dest) return { success: false, error: 'Invalid I\'ve Got Your Back target' };

      const rook = engine.getPiece(anchorSquare);
      const ally = engine.getPiece(dest);
      if (!rook || !ally) return { success: false, error: 'Missing pieces' };

      const { file, rank } = CardUtils.getCoords(dest);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;
      const forwardSq = CardUtils.getSquare(file, rank + dir);
      if (!forwardSq) return { success: false, error: 'Invalid forward square' };

      const enemyAtFwd = engine.getPiece(forwardSq);
      const chess = engine.getInternalChess();
      if (enemyAtFwd) {
        chess.remove(forwardSq as Square);
        engine.addToPlayerGraveyard(enemyAtFwd.color, enemyAtFwd.type);
      }

      chess.remove(anchorSquare as Square);
      chess.remove(dest as Square);
      chess.put(ally, forwardSq as Square);
      chess.put(rook, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // R3: Cut Across (r3_cut_across)
  // ==========================================
  registerCardHandler({
    cardId: 'r3_cut_across',
    evaluateSetup(friendlyPieces) {
      return friendlyPieces.some((p) => p.type === 'r' && (p.file === p.rank || p.file + p.rank === 7))
        ? 18
        : 0;
    },
    evaluateConditions(_engine: DeckChessEngine, anchorSquare: string): boolean {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      return file === rank || file + rank === 7;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const isDiag1 = file === rank;
      const isDiag2 = file + rank === 7;
      if (!isDiag1 && !isDiag2) return [];

      const turn = engine.getTurn();
      const steps = [];
      if (isDiag1) {
        steps.push([1, 1], [-1, -1]);
      }
      if (isDiag2) {
        steps.push([1, -1], [-1, 1]);
      }

      const targets: string[] = [];
      for (const [df, dr] of steps) {
        const sq = CardUtils.getSquare(file + df, rank + dr);
        if (sq && !engine.isSquareBlockedByBarrier(sq)) {
          const p = engine.getPiece(sq);
          if (!p || (p.color !== turn && p.type !== 'k')) {
            targets.push(sq);
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Cut Across target' };

      const rook = engine.getPiece(anchorSquare);
      if (!rook) return { success: false, error: 'No rook at anchor' };

      const enemy = engine.getPiece(dest);
      const chess = engine.getInternalChess();
      if (enemy) {
        chess.remove(dest as Square);
        engine.addToPlayerGraveyard(enemy.color, enemy.type);
      }
      chess.remove(anchorSquare as Square);
      chess.put(rook, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // R4: Move in Unison (r4_move_in_unison)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'r4_move_in_unison',
    minAnchorsRequired: 2,
    evaluateSetup(friendlyPieces) {
      const rooks = friendlyPieces.filter((p) => p.type === 'r');
      for (let i = 0; i < rooks.length; i++) {
        for (let j = i + 1; j < rooks.length; j++) {
          if (rooks[i].file === rooks[j].file || rooks[i].rank === rooks[j].rank) return 24;
        }
      }
      return 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();

      // Find other friendly rook in unobstructed line of sight (same rank or file)
      let otherRookSq: string | null = null;
      const orthogonals: [number, number][] = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
      ];

      for (const [df, dr] of orthogonals) {
        let step = 1;
        while (true) {
          const sq = CardUtils.getSquare(file + df * step, rank + dr * step);
          if (!sq || engine.isSquareBlockedByBarrier(sq)) break;
          const p = engine.getPiece(sq);
          if (p) {
            if (p.color === turn && p.type === 'r') {
              otherRookSq = sq;
            }
            break;
          }
          step++;
        }
        if (otherRookSq) break;
      }

      if (!otherRookSq) return [];

      const targets: TargetOption[] = [];
      // This rook can slide any unobstructed distance along its rank or file
      for (const [df, dr] of orthogonals) {
        let step = 1;
        while (true) {
          const sq = CardUtils.getSquare(file + df * step, rank + dr * step);
          if (!sq || sq === otherRookSq || engine.isSquareBlockedByBarrier(sq)) break;
          const p = engine.getPiece(sq);
          if (!p) {
            targets.push({
              to: sq,
              extraSquare: otherRookSq,
              disambiguationPrompt: 'Move paired Rook into vacated square',
            });
          } else {
            if (p.color !== turn && p.type !== 'k') {
              targets.push({
                to: sq,
                extraSquare: otherRookSq,
                disambiguationPrompt: 'Move paired Rook into vacated square',
              });
            }
            break;
          }
          step++;
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string, extraSquare?: string) {
      if (!targetSquare) return { success: false, error: 'Missing Move in Unison target' };
      const rawTargets = this.getTargets(engine, anchorSquare);
      const match = rawTargets.find((t) => {
        if (typeof t === 'string') return t === targetSquare;
        return t.to === targetSquare && (!extraSquare || t.extraSquare === extraSquare);
      });
      if (!match) return { success: false, error: 'Invalid Move in Unison target' };

      const chosenExtra = typeof match === 'string' ? extraSquare : (match.extraSquare || extraSquare);
      if (!chosenExtra) return { success: false, error: 'Missing paired rook square' };

      const r1 = engine.getPiece(anchorSquare);
      const r2 = engine.getPiece(chosenExtra);
      if (!r1 || !r2) return { success: false, error: 'Missing rooks' };

      const enemy = engine.getPiece(targetSquare);
      const chess = engine.getInternalChess();
      if (enemy) {
        chess.remove(targetSquare as Square);
        engine.addToPlayerGraveyard(enemy.color, enemy.type);
      }
      chess.remove(anchorSquare as Square);
      chess.remove(chosenExtra as Square);
      chess.put(r1, targetSquare as Square);
      chess.put(r2, anchorSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // R5: Catapult (r5_catapult)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'r5_catapult',
    evaluateSetup(friendlyPieces) {
      return hasRookAllyAlignment(friendlyPieces) ? 15 : 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const orthogonals: [number, number][] = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
      ];

      const targets: TargetOption[] = [];
      for (const [df, dr] of orthogonals) {
        // Friendly non-King piece directly adjacent along ray: (file + df, rank + dr)
        const adjSq = CardUtils.getSquare(file + df, rank + dr);
        if (!adjSq) continue;
        const ally = engine.getPiece(adjSq);
        if (!ally || ally.color !== turn || ally.type === 'k') continue;

        // Scan along open ray beyond adjSq for the first piece: must be enemy non-King
        let step = 2;
        while (true) {
          const fwdSq = CardUtils.getSquare(file + df * step, rank + dr * step);
          if (!fwdSq || engine.isSquareBlockedByBarrier(fwdSq)) break;
          const p = engine.getPiece(fwdSq);
          if (p) {
            if (p.color !== turn && p.type !== 'k') {
              targets.push({
                to: fwdSq,
                extraSquare: adjSq,
                disambiguationPrompt: 'Choose adjacent ally to catapult',
              });
            }
            break;
          }
          step++;
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string, extraSquare?: string) {
      if (!targetSquare) return { success: false, error: 'Missing Catapult target' };
      const rawTargets = this.getTargets(engine, anchorSquare);
      const match = rawTargets.find((t) => {
        if (typeof t === 'string') return t === targetSquare;
        return t.to === targetSquare && (!extraSquare || t.extraSquare === extraSquare);
      });
      if (!match) return { success: false, error: 'Invalid Catapult target' };

      const chosenAllySq = typeof match === 'string' ? extraSquare : (match.extraSquare || extraSquare);
      if (!chosenAllySq) return { success: false, error: 'Missing catapulted ally square' };

      const ally = engine.getPiece(chosenAllySq);
      const enemy = engine.getPiece(targetSquare);
      if (!ally || !enemy) return { success: false, error: 'Missing pieces for Catapult' };

      const chess = engine.getInternalChess();
      chess.remove(targetSquare as Square);
      engine.addToPlayerGraveyard(enemy.color, enemy.type);
      chess.remove(chosenAllySq as Square);
      chess.put(ally, targetSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // R6: Garrison (r6_garrison)
  // ==========================================
  registerCardHandler({
    cardId: 'r6_garrison',
    spawnsPieceType: 'p',
    evaluateSetup(friendlyPieces) {
      const king = friendlyPieces.find((p) => p.type === 'k');
      const rooks = friendlyPieces.filter((p) => p.type === 'r');
      return king && rooks.some((r) => Math.abs(r.file - king.file) + Math.abs(r.rank - king.rank) === 1)
        ? 18
        : 0;
    },
    evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();

      // King orthogonally adjacent (N/S/E/W, manhattan === 1)
      const orthogonals: [number, number][] = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
      ];
      let kingAdjacent = false;
      for (const [df, dr] of orthogonals) {
        const adjSq = CardUtils.getSquare(file + df, rank + dr);
        if (adjSq) {
          const p = engine.getPiece(adjSq);
          if (p && p.color === turn && p.type === 'k') {
            kingAdjacent = true;
            break;
          }
        }
      }
      if (!kingAdjacent) return false;

      const dir = turn === 'w' ? 1 : -1;
      const frontSq = CardUtils.getSquare(file, rank + dir);
      if (!frontSq || engine.getPiece(frontSq) || engine.isSquareBlockedByBarrier(frontSq)) return false;

      return engine.canSpawnPawn(turn);
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      if (!this.evaluateConditions?.(engine, anchorSquare)) return [];
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;
      const frontSq = CardUtils.getSquare(file, rank + dir);
      return frontSq ? [frontSq] : [];
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Garrison target' };

      const turn = engine.getTurn();
      const chess = engine.getInternalChess();
      chess.put({ type: 'p', color: turn }, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // Q1: Royal Summons (q1_royal_summons)
  // ==========================================
  registerCardHandler({
    cardId: 'q1_royal_summons',
    evaluateSetup(friendlyPieces) {
      const queen = friendlyPieces.find((p) => p.type === 'q');
      const allies = friendlyPieces.filter((p) => p.type !== 'q' && p.type !== 'k');
      return queen &&
        allies.some(
          (a) =>
            a.file === queen.file ||
            a.rank === queen.rank ||
            Math.abs(a.file - queen.file) === Math.abs(a.rank - queen.rank)
        )
        ? 18
        : 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const orthogonals = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
      ];

      const targets: string[] = [];
      for (const [df, dr] of orthogonals) {
        let step = 1;
        while (true) {
          const sq = CardUtils.getSquare(file + df * step, rank + dr * step);
          if (!sq || engine.isSquareBlockedByBarrier(sq)) break;
          const p = engine.getPiece(sq);
          if (p) {
            if (p.color === turn && p.type === 'p' && step >= 2) {
              // Ensure square adjacent to queen is empty
              const adjSq = CardUtils.getSquare(file + df, rank + dr);
              if (adjSq && !engine.getPiece(adjSq) && !engine.isSquareBlockedByBarrier(adjSq)) {
                targets.push(sq);
              }
            }
            break;
          }
          step++;
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Royal Summons target' };

      const pawn = engine.getPiece(dest);
      if (!pawn) return { success: false, error: 'No friendly pawn at target' };

      const cQueen = CardUtils.getCoords(anchorSquare);
      const cPawn = CardUtils.getCoords(dest);
      const df = Math.sign(cPawn.file - cQueen.file);
      const dr = Math.sign(cPawn.rank - cQueen.rank);
      const adjSq = CardUtils.getSquare(cQueen.file + df, cQueen.rank + dr);
      if (!adjSq) return { success: false, error: 'Invalid adjacent square' };

      const chess = engine.getInternalChess();
      chess.remove(dest as Square);
      chess.put(pawn, adjSq as Square);
      return { success: true };
    },
  });

  // ==========================================
  // Q2: The Queen's Gambit (q2_the_queens_gambit)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'q2_the_queens_gambit',
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const oppColor = (turn === 'w' ? 'b' : 'w') as PieceColor;
      const dirs = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ];

      // Find friendly non-King pieces in Queen's line of sight
      const alliesInSight: string[] = [];
      for (const [df, dr] of dirs) {
        let step = 1;
        while (true) {
          const sq = CardUtils.getSquare(file + df * step, rank + dr * step);
          if (!sq || engine.isSquareBlockedByBarrier(sq)) break;
          const p = engine.getPiece(sq);
          if (p) {
            if (p.color === turn && p.type !== 'k') {
              alliesInSight.push(sq);
            }
            break;
          }
          step++;
        }
      }
      if (alliesInSight.length === 0) return [];

      const targets: TargetOption[] = [];
      const chess = engine.getInternalChess();

      for (const allySq of alliesInSight) {
        // Find which enemy non-King units attack this ally
        for (let r = 0; r < 8; r++) {
          for (let f = 0; f < 8; f++) {
            const enemySq = CardUtils.getSquare(f, r);
            if (enemySq) {
              const ep = engine.getPiece(enemySq);
              if (ep && ep.color === oppColor && ep.type !== 'k') {
                // Check if ep attacks allySq
                let attacks = false;
                const cE = CardUtils.getCoords(enemySq);
                const cA = CardUtils.getCoords(allySq);
                const edf = cA.file - cE.file;
                const edr = cA.rank - cE.rank;

                if (ep.type === 'p') {
                  const pdir = oppColor === 'w' ? 1 : -1;
                  if (edr === pdir && Math.abs(edf) === 1) attacks = true;
                } else if (ep.type === 'n') {
                  if ((Math.abs(edf) === 1 && Math.abs(edr) === 2) || (Math.abs(edf) === 2 && Math.abs(edr) === 1)) {
                    attacks = true;
                  }
                } else if (ep.type === 'b' || ep.type === 'r' || ep.type === 'q') {
                  const isDiag = Math.abs(edf) === Math.abs(edr) && edf !== 0;
                  const isOrth = (edf === 0 || edr === 0) && (edf !== 0 || edr !== 0);
                  if (
                    (ep.type === 'b' && isDiag) ||
                    (ep.type === 'r' && isOrth) ||
                    (ep.type === 'q' && (isDiag || isOrth))
                  ) {
                    const stepF = Math.sign(edf);
                    const stepR = Math.sign(edr);
                    let s = 1;
                    let clear = false;
                    while (true) {
                      const testSq = CardUtils.getSquare(cE.file + stepF * s, cE.rank + stepR * s);
                      if (!testSq || engine.isSquareBlockedByBarrier(testSq)) {
                        clear = false;
                        break;
                      }
                      if (testSq === allySq) {
                        clear = true;
                        break;
                      }
                      if (engine.getPiece(testSq)) {
                        clear = false;
                        break;
                      }
                      s++;
                    }
                    if (clear) attacks = true;
                  }
                }

                if (attacks) {
                  targets.push({
                    to: enemySq,
                    extraSquare: allySq,
                    disambiguationPrompt: 'Choose friendly piece to sacrifice',
                  });
                }
              }
            }
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string, extraSquare?: string) {
      if (!targetSquare) return { success: false, error: 'Missing Queen\'s Gambit target' };
      const rawTargets = this.getTargets(engine, anchorSquare);
      const match = rawTargets.find((t) => {
        if (typeof t === 'string') return t === targetSquare;
        return t.to === targetSquare && (!extraSquare || t.extraSquare === extraSquare);
      });
      if (!match) return { success: false, error: 'Invalid Queen\'s Gambit target' };

      const chosenAllySq = typeof match === 'string' ? extraSquare : (match.extraSquare || extraSquare);
      if (!chosenAllySq) return { success: false, error: 'Missing sacrificed ally square' };

      const queen = engine.getPiece(anchorSquare);
      const ally = engine.getPiece(chosenAllySq);
      const enemy = engine.getPiece(targetSquare);
      if (!queen || !ally || !enemy) return { success: false, error: 'Missing pieces for Queen\'s Gambit' };

      const chess = engine.getInternalChess();
      chess.remove(chosenAllySq as Square);
      engine.addToPlayerGraveyard(ally.color, ally.type);
      chess.remove(targetSquare as Square);
      engine.addToPlayerGraveyard(enemy.color, enemy.type);
      chess.remove(anchorSquare as Square);
      chess.put(queen, targetSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // Q3: All Rise (q3_all_rise)
  // ==========================================
  registerCardHandler({
    cardId: 'q3_all_rise',
    evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
      const { rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const queenRelRank = getRelativeRank(rank, turn);
      if (queenRelRank < 1) return false;

      const dir = turn === 'w' ? 1 : -1;
      let hasAdvanceablePawn = false;

      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const sq = CardUtils.getSquare(f, r);
          if (sq) {
            const p = engine.getPiece(sq);
            if (p && p.color === turn && p.type === 'p') {
              const pRelRank = getRelativeRank(r, turn);
              if (pRelRank < queenRelRank) {
                const frontSq = CardUtils.getSquare(f, r + dir);
                if (frontSq && !engine.getPiece(frontSq) && !engine.isSquareBlockedByBarrier(frontSq)) {
                  hasAdvanceablePawn = true;
                }
              }
            }
          }
        }
      }
      return hasAdvanceablePawn;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      return this.evaluateConditions?.(engine, anchorSquare) ? [anchorSquare] : [];
    },
    execute(engine: DeckChessEngine, anchorSquare: string) {
      const turn = engine.getTurn();
      const { rank } = CardUtils.getCoords(anchorSquare);
      const queenRelRank = getRelativeRank(rank, turn);
      const dir = turn === 'w' ? 1 : -1;

      // Collect friendly pawns on lower relative ranks
      const advanceablePawns: Array<{ sq: string; relRank: number; file: number; rank: number }> = [];
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const sq = CardUtils.getSquare(f, r);
          if (sq) {
            const p = engine.getPiece(sq);
            if (p && p.color === turn && p.type === 'p') {
              const pRel = getRelativeRank(r, turn);
              if (pRel < queenRelRank) {
                advanceablePawns.push({ sq, relRank: pRel, file: f, rank: r });
              }
            }
          }
        }
      }

      // Sort from highest relative rank down to lowest relative rank
      advanceablePawns.sort((a, b) => b.relRank - a.relRank);

      const chess = engine.getInternalChess();
      for (const item of advanceablePawns) {
        const nextSq = CardUtils.getSquare(item.file, item.rank + dir);
        if (nextSq && !engine.getPiece(nextSq) && !engine.isSquareBlockedByBarrier(nextSq)) {
          const p = engine.getPiece(item.sq);
          if (p) {
            chess.remove(item.sq as Square);
            chess.put(p, nextSq as Square);
          }
        }
      }
      return { success: true };
    },
  });

  // ==========================================
  // Q4: One Fell Swoop (q4_one_fell_swoop)
  // ==========================================
  registerCardHandler({
    cardId: 'q4_one_fell_swoop',
    evaluateSetup(friendlyPieces) {
      const queen = friendlyPieces.find((p) => p.type === 'q');
      const allies = friendlyPieces.filter((p) => p.type !== 'q' && p.type !== 'k');
      return queen &&
        allies.some(
          (a) =>
            a.file === queen.file ||
            a.rank === queen.rank ||
            Math.abs(a.file - queen.file) === Math.abs(a.rank - queen.rank)
        )
        ? 18
        : 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const oppColor = (turn === 'w' ? 'b' : 'w') as PieceColor;
      const dirs = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ];

      const targets: string[] = [];
      for (const [df, dr] of dirs) {
        const behindSq = CardUtils.getSquare(file - df, rank - dr);
        if (!behindSq) continue;
        const supporter = engine.getPiece(behindSq);
        if (!supporter || supporter.color !== turn) continue;

        // Check geometry compatibility
        const isOrth = df === 0 || dr === 0;
        const isDiag = Math.abs(df) === Math.abs(dr);
        if (isOrth && supporter.type !== 'r' && supporter.type !== 'q') continue;
        if (isDiag && supporter.type !== 'b' && supporter.type !== 'q') continue;

        // Scan forward ray
        let step = 1;
        let enemyCount = 0;
        let lastValidSq: string | null = null;
        let validRay = true;

        while (true) {
          const sq = CardUtils.getSquare(file + df * step, rank + dr * step);
          if (!sq || engine.isSquareBlockedByBarrier(sq)) break;

          const p = engine.getPiece(sq);
          if (p) {
            if (p.color === turn) {
              validRay = false;
              break;
            }
            if (p.type === 'k') {
              // Ray must terminate before enemy king
              break;
            }
            enemyCount++;
            lastValidSq = sq;
          } else {
            lastValidSq = sq;
          }
          step++;
        }

        if (validRay && enemyCount >= 1 && lastValidSq) {
          targets.push(lastValidSq);
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid One Fell Swoop destination' };

      const queen = engine.getPiece(anchorSquare);
      if (!queen) return { success: false, error: 'No queen at anchor' };

      const cQueen = CardUtils.getCoords(anchorSquare);
      const cDest = CardUtils.getCoords(dest);
      const df = Math.sign(cDest.file - cQueen.file);
      const dr = Math.sign(cDest.rank - cQueen.rank);
      const turn = engine.getTurn();
      const chess = engine.getInternalChess();

      // Sweep all enemies along the ray up to dest
      let step = 1;
      while (true) {
        const sq = CardUtils.getSquare(cQueen.file + df * step, cQueen.rank + dr * step);
        if (!sq) break;
        const p = engine.getPiece(sq);
        if (p && p.color !== turn && p.type !== 'k') {
          chess.remove(sq as Square);
          engine.addToPlayerGraveyard(p.color, p.type);
        }
        if (sq === dest) break;
        step++;
      }

      chess.remove(anchorSquare as Square);
      chess.put(queen, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // K1: Conscription (k1_conscription)
  // ==========================================
  registerCardHandler({
    cardId: 'k1_conscription',
    spawnsPieceType: 'p',
    evaluateSetup(friendlyPieces, color) {
      const king = friendlyPieces.find((p) => p.type === 'k');
      const homeRank = color === 'w' ? 0 : 7;
      return king && king.rank === homeRank && (king.file <= 2 || king.file >= 5) ? 15 : 0;
    },
    evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
      const turn = engine.getTurn();
      const corners = turn === 'w' ? ['a1', 'h1'] : ['a8', 'h8'];
      if (!corners.includes(anchorSquare)) return false;

      const adjacent = CardUtils.getAdjacentSquares(anchorSquare, false);
      const emptyAdjacent = adjacent.filter((sq) => !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq));
      return emptyAdjacent.length > 0 && engine.canSpawnPawn(turn);
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      return this.evaluateConditions?.(engine, anchorSquare) ? [anchorSquare] : [];
    },
    execute(engine: DeckChessEngine, anchorSquare: string) {
      const turn = engine.getTurn();
      const adjacent = CardUtils.getAdjacentSquares(anchorSquare, false);
      const emptyAdjacent = adjacent.filter((sq) => !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq));
      if (emptyAdjacent.length === 0) return { success: false, error: 'No empty adjacent squares' };

      const chess = engine.getInternalChess();
      for (const sq of emptyAdjacent) {
        if (engine.canSpawnPawn(turn)) {
          chess.put({ type: 'p', color: turn }, sq as Square);
        }
      }
      return { success: true };
    },
  });

  // ==========================================
  // K2: Royal Knighting (k2_royal_knighting)
  // ==========================================
  registerCardHandler({
    cardId: 'k2_royal_knighting',
    spawnsPieceType: 'n',
    evaluateSetup(friendlyPieces) {
      const king = friendlyPieces.find((p) => p.type === 'k');
      const pawns = friendlyPieces.filter((p) => p.type === 'p');
      return king && pawns.some((p) => Math.max(Math.abs(p.file - king.file), Math.abs(p.rank - king.rank)) === 1)
        ? 18
        : 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();

      const targets: string[] = [];
      for (const df of [-1, 1]) {
        const sq = CardUtils.getSquare(file + df, rank);
        if (sq) {
          const p = engine.getPiece(sq);
          if (p && p.color === turn && p.type === 'p') {
            targets.push(sq);
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Royal Knighting target' };

      const pawn = engine.getPiece(dest);
      if (!pawn) return { success: false, error: 'No friendly pawn at target' };

      const turn = engine.getTurn();
      const chess = engine.getInternalChess();
      chess.remove(dest as Square);
      engine.addToPlayerGraveyard(turn, 'p');
      chess.put({ type: 'n', color: turn }, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // K3: Royal Execution (k3_royal_execution)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'k3_royal_execution',
    evaluateSetup(friendlyPieces) {
      const king = friendlyPieces.find((p) => p.type === 'k');
      const allies = friendlyPieces.filter((p) => p.type !== 'k');
      return king && allies.some((a) => Math.max(Math.abs(a.file - king.file), Math.abs(a.rank - king.rank)) === 1)
        ? 15
        : 0;
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const oppColor = (turn === 'w' ? 'b' : 'w') as PieceColor;
      const orthogonals = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
      ];

      // Find orthogonally adjacent friendly units
      const allies: string[] = [];
      for (const [df, dr] of orthogonals) {
        const sq = CardUtils.getSquare(file + df, rank + dr);
        if (sq) {
          const p = engine.getPiece(sq);
          if (p && p.color === turn && p.type !== 'k') {
            allies.push(sq);
          }
        }
      }
      if (allies.length === 0) return [];

      const targets: TargetOption[] = [];
      for (const allySq of allies) {
        const ally = engine.getPiece(allySq)!;

        // Check which enemy non-King units ally could capture if standing at anchorSquare
        // Knight
        if (ally.type === 'n') {
          const jumps = [
            [1, 2], [1, -2], [-1, 2], [-1, -2],
            [2, 1], [2, -1], [-2, 1], [-2, -1],
          ];
          for (const [df, dr] of jumps) {
            const sq = CardUtils.getSquare(file + df, rank + dr);
            if (sq) {
              const ep = engine.getPiece(sq);
              if (ep && ep.color === oppColor && ep.type !== 'k') {
                targets.push({ to: sq, extraSquare: allySq, disambiguationPrompt: 'Select executing ally' });
              }
            }
          }
        }
        // Pawn
        else if (ally.type === 'p') {
          const pdir = turn === 'w' ? 1 : -1;
          for (const df of [-1, 1]) {
            const sq = CardUtils.getSquare(file + df, rank + pdir);
            if (sq) {
              const ep = engine.getPiece(sq);
              if (ep && ep.color === oppColor && ep.type !== 'k') {
                targets.push({ to: sq, extraSquare: allySq, disambiguationPrompt: 'Select executing ally' });
              }
            }
          }
        }
        // Bishop, Rook, Queen
        else if (ally.type === 'b' || ally.type === 'r' || ally.type === 'q') {
          const rayDirs = [];
          if (ally.type === 'r' || ally.type === 'q') {
            rayDirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
          }
          if (ally.type === 'b' || ally.type === 'q') {
            rayDirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
          }
          for (const [df, dr] of rayDirs) {
            let step = 1;
            while (true) {
              const sq = CardUtils.getSquare(file + df * step, rank + dr * step);
              if (!sq || engine.isSquareBlockedByBarrier(sq)) break;
              if (sq === allySq) {
                // Ignore ally's current square for line-of-sight from king!
                step++;
                continue;
              }
              const p = engine.getPiece(sq);
              if (p) {
                if (p.color === oppColor && p.type !== 'k') {
                  targets.push({ to: sq, extraSquare: allySq, disambiguationPrompt: 'Select executing ally' });
                }
                break;
              }
              step++;
            }
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string, extraSquare?: string) {
      if (!targetSquare) return { success: false, error: 'Missing Royal Execution target' };
      const rawTargets = this.getTargets(engine, anchorSquare);
      const match = rawTargets.find((t) => {
        if (typeof t === 'string') return t === targetSquare;
        return t.to === targetSquare && (!extraSquare || t.extraSquare === extraSquare);
      });
      if (!match) return { success: false, error: 'Invalid Royal Execution target' };

      const chosenAllySq = typeof match === 'string' ? extraSquare : (match.extraSquare || extraSquare);
      if (!chosenAllySq) return { success: false, error: 'Missing executing ally' };

      const ally = engine.getPiece(chosenAllySq);
      const enemy = engine.getPiece(targetSquare);
      if (!ally || !enemy) return { success: false, error: 'Missing pieces for Royal Execution' };

      const chess = engine.getInternalChess();
      chess.remove(targetSquare as Square);
      engine.addToPlayerGraveyard(enemy.color, enemy.type);
      chess.remove(chosenAllySq as Square);
      chess.put(ally, targetSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // K4: Banish (k4_banish)
  // ==========================================
  registerCardHandler({
    cardId: 'k4_banish',
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const oppColor = (turn === 'w' ? 'b' : 'w') as PieceColor;
      const dir = turn === 'w' ? 1 : -1;

      // Scan in front along same file
      let step = 1;
      let firstEnemySq: string | null = null;
      const stack: string[] = [];

      while (true) {
        const sq = CardUtils.getSquare(file, rank + dir * step);
        if (!sq || engine.isSquareBlockedByBarrier(sq)) break;
        const p = engine.getPiece(sq);
        if (!firstEnemySq) {
          if (p) {
            if (p.color === oppColor && p.type !== 'k') {
              const relRank = getRelativeRank(rank + dir * step, turn);
              if (relRank <= 3) { // Ranks 1-4 relative
                firstEnemySq = sq;
                stack.push(sq);
              } else {
                break;
              }
            } else {
              break;
            }
          }
        } else {
          // In stack: contiguous enemy non-King units
          if (p) {
            if (p.color === oppColor && p.type !== 'k') {
              const relRank = getRelativeRank(rank + dir * step, turn);
              if (relRank <= 3) {
                stack.push(sq);
              } else {
                break;
              }
            } else {
              break;
            }
          } else {
            // Square immediately behind stack is empty!
            break;
          }
        }
        step++;
      }

      if (!firstEnemySq || stack.length === 0) return [];

      // Check if square immediately behind the top of stack S is empty
      const topStackSq = stack[stack.length - 1];
      const cTop = CardUtils.getCoords(topStackSq);
      const behindTopSq = CardUtils.getSquare(file, cTop.rank + dir);
      if (!behindTopSq || engine.getPiece(behindTopSq) || engine.isSquareBlockedByBarrier(behindTopSq)) {
        return [];
      }

      return [firstEnemySq];
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Banish target' };

      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const oppColor = (turn === 'w' ? 'b' : 'w') as PieceColor;
      const dir = turn === 'w' ? 1 : -1;

      // Identify stack S
      let step = 1;
      const stackCoords: Array<{ file: number; rank: number; piece: any }> = [];
      let foundStart = false;

      while (true) {
        const r = rank + dir * step;
        const sq = CardUtils.getSquare(file, r);
        if (!sq) break;
        if (sq === dest) foundStart = true;
        if (foundStart) {
          const p = engine.getPiece(sq);
          if (p && p.color === oppColor && p.type !== 'k') {
            const rel = getRelativeRank(r, turn);
            if (rel <= 3) {
              stackCoords.push({ file, rank: r, piece: p });
            } else {
              break;
            }
          } else {
            break;
          }
        }
        step++;
      }

      if (stackCoords.length === 0) return { success: false, error: 'No banish stack found' };

      // Determine max push distance k
      const topP = stackCoords[stackCoords.length - 1];
      let k = 1;
      while (true) {
        const nextRank = topP.rank + dir * (k + 1);
        if (nextRank < 0 || nextRank > 7) break;
        const nextRel = getRelativeRank(nextRank, turn);
        if (nextRel > 7) break; // reached back rank
        const testSq = CardUtils.getSquare(file, nextRank);
        if (!testSq || engine.getPiece(testSq) || engine.isSquareBlockedByBarrier(testSq)) break;
        k++;
      }

      const chess = engine.getInternalChess();
      // Remove all pieces in stack from current positions
      for (const item of stackCoords) {
        const sq = CardUtils.getSquare(item.file, item.rank);
        if (sq) chess.remove(sq as Square);
      }

      // Re-place shifted by k in reverse order (top to bottom)
      for (let i = stackCoords.length - 1; i >= 0; i--) {
        const item = stackCoords[i];
        const newRank = item.rank + dir * k;
        const newSq = CardUtils.getSquare(item.file, newRank);
        if (newSq) {
          chess.put(item.piece, newSq as Square);
        }
      }

      return { success: true };
    },
  });
}
