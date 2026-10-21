import { Chess, PieceSymbol, Square } from 'chess.js';
import { CardBehaviorHandler, TargetOption, registerCardHandler, CardUtils } from './cardRegistry';
import { DeckChessEngine } from '../DeckChessEngine';
import { PieceColor } from '../../types/deckChess';

function isPinnedToKing(engine: DeckChessEngine, square: string): boolean {
  return CardUtils.getPinRay(engine, square) !== null;
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
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      const frontSq = CardUtils.getSquare(file, rank + dir);
      if (!frontSq) return [];
      const frontPiece = engine.getPiece(frontSq);
      if (!frontPiece || frontPiece.color === turn) return [];

      const targets: string[] = [];
      const leftSq = CardUtils.getSquare(file - 1, rank);
      if (leftSq && !engine.getPiece(leftSq) && !engine.isSquareBlockedByBarrier(leftSq)) {
        targets.push(leftSq);
      }
      const rightSq = CardUtils.getSquare(file + 1, rank);
      if (rightSq && !engine.getPiece(rightSq) && !engine.isSquareBlockedByBarrier(rightSq)) {
        targets.push(rightSq);
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
  // P3: Follow Me (p3_follow_me)
  // ==========================================
  registerCardHandler({
    cardId: 'p3_follow_me',
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      const behindSq = CardUtils.getSquare(file, rank - dir);
      if (!behindSq) return [];
      const behindPiece = engine.getPiece(behindSq);
      if (!behindPiece || behindPiece.color !== turn) return [];

      const frontSq = CardUtils.getSquare(file, rank + dir);
      if (!frontSq || engine.getPiece(frontSq) || engine.isSquareBlockedByBarrier(frontSq)) return [];

      return [frontSq];
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Follow Me target' };

      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;
      const behindSq = CardUtils.getSquare(file, rank - dir);
      if (!behindSq) return { success: false, error: 'No square behind' };

      const anchorPiece = engine.getPiece(anchorSquare);
      const behindPiece = engine.getPiece(behindSq);
      if (!anchorPiece || !behindPiece) return { success: false, error: 'Missing pieces' };

      const chess = engine.getInternalChess();
      chess.remove(behindSq as Square);
      chess.remove(anchorSquare as Square);
      chess.put(behindPiece, anchorSquare as Square);
      chess.put(anchorPiece, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // P4: Attack Together (p4_attack_together)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'p4_attack_together',
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      // Find defending friendly pawns on rear diagonals
      const rearPawns: string[] = [];
      for (const df of [-1, 1]) {
        const sq = CardUtils.getSquare(file + df, rank - dir);
        if (sq) {
          const p = engine.getPiece(sq);
          if (p && p.color === turn && p.type === 'p') {
            rearPawns.push(sq);
          }
        }
      }
      if (rearPawns.length === 0) return [];

      // Forward diagonals with enemy non-King pieces
      const targets: TargetOption[] = [];
      for (const df of [-1, 1]) {
        const enemySq = CardUtils.getSquare(file + df, rank + dir);
        if (enemySq) {
          const ep = engine.getPiece(enemySq);
          if (ep && ep.color !== turn && ep.type !== 'k') {
            for (const rearPawnSq of rearPawns) {
              targets.push({
                to: enemySq,
                extraSquare: rearPawnSq,
                disambiguationPrompt: 'Choose defending Pawn to advance',
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
      if (!chosenExtra) return { success: false, error: 'Missing defending pawn square' };

      const piece = engine.getPiece(anchorSquare);
      const defPawn = engine.getPiece(chosenExtra);
      const enemy = engine.getPiece(targetSquare);
      if (!piece || !defPawn || !enemy) return { success: false, error: 'Missing piece for Attack Together' };

      const chess = engine.getInternalChess();
      chess.remove(targetSquare as Square);
      engine.addToPlayerGraveyard(enemy.color, enemy.type);
      chess.remove(anchorSquare as Square);
      chess.remove(chosenExtra as Square);
      chess.put(piece, targetSquare as Square);
      chess.put(defPawn, anchorSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // P5: Get Behind Me (p5_get_behind_me)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'p5_get_behind_me',
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      const behindSq = CardUtils.getSquare(file, rank - dir);
      if (!behindSq || engine.getPiece(behindSq) || engine.isSquareBlockedByBarrier(behindSq)) return [];

      const targets: TargetOption[] = [];
      for (const df of [-1, 1]) {
        const allySq = CardUtils.getSquare(file + df, rank - dir);
        if (allySq) {
          const ap = engine.getPiece(allySq);
          if (ap && ap.color === turn) {
            targets.push({
              to: behindSq,
              extraSquare: allySq,
              disambiguationPrompt: 'Select friendly piece to tuck behind',
            });
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
      if (!match) return { success: false, error: 'Invalid Get Behind Me move' };

      const chosenAllySq = typeof match === 'string' ? extraSquare : (match.extraSquare || extraSquare);
      if (!chosenAllySq) return { success: false, error: 'Missing ally square' };

      const ally = engine.getPiece(chosenAllySq);
      if (!ally) return { success: false, error: 'No ally at selected square' };

      const chess = engine.getInternalChess();
      chess.remove(chosenAllySq as Square);
      chess.put(ally, targetSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // P6: Tag Out (p6_tag_out)
  // ==========================================
  registerCardHandler({
    cardId: 'p6_tag_out',
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      const frontSq = CardUtils.getSquare(file, rank + dir);
      if (!frontSq) return [];
      const frontPiece = engine.getPiece(frontSq);
      if (frontPiece && frontPiece.color === turn) {
        return [frontSq];
      }
      return [];
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Tag Out target' };

      const p1 = engine.getPiece(anchorSquare);
      const p2 = engine.getPiece(dest);
      if (!p1 || !p2) return { success: false, error: 'Missing pieces for Tag Out' };

      const chess = engine.getInternalChess();
      chess.remove(anchorSquare as Square);
      chess.remove(dest as Square);
      chess.put(p1, dest as Square);
      chess.put(p2, anchorSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // P7: Protect the King (p7_protect_the_king)
  // ==========================================
  registerCardHandler({
    cardId: 'p7_protect_the_king',
    evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
      return isPinnedToKing(engine, anchorSquare);
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      if (!isPinnedToKing(engine, anchorSquare)) return [];
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      const targets: string[] = [];
      for (const df of [-1, 1]) {
        const sq = CardUtils.getSquare(file + df, rank + dir);
        if (sq) {
          const p = engine.getPiece(sq);
          if (p && p.color !== turn && p.type !== 'k') {
            targets.push(sq);
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Protect the King target' };

      const enemy = engine.getPiece(dest);
      if (!enemy) return { success: false, error: 'No enemy piece at target' };

      const chess = engine.getInternalChess();
      chess.remove(dest as Square);
      engine.addToPlayerGraveyard(enemy.color, enemy.type);
      return { success: true };
    },
  });

  // ==========================================
  // P8: Call Reserves (p8_call_reserves)
  // ==========================================
  registerCardHandler({
    cardId: 'p8_call_reserves',
    evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const relRank = getRelativeRank(rank, turn);
      // Ranks 5-7 relative (4, 5, 6)
      if (relRank < 4 || relRank > 6) return false;

      // Has friendly piece horizontally adjacent
      let hasFlankAlly = false;
      for (const df of [-1, 1]) {
        const flankSq = CardUtils.getSquare(file + df, rank);
        if (flankSq) {
          const p = engine.getPiece(flankSq);
          if (p && p.color === turn) hasFlankAlly = true;
        }
      }
      if (!hasFlankAlly) return false;

      // Square directly behind empty
      const dir = turn === 'w' ? 1 : -1;
      const behindSq = CardUtils.getSquare(file, rank - dir);
      if (!behindSq || engine.getPiece(behindSq) || engine.isSquareBlockedByBarrier(behindSq)) return false;

      return engine.canSpawnPawn(turn);
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      if (!this.evaluateConditions?.(engine, anchorSquare)) return [];
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;
      const behindSq = CardUtils.getSquare(file, rank - dir);
      return behindSq ? [behindSq] : [];
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
  // N2: Swap With Me (n2_swap_with_me)
  // ==========================================
  registerCardHandler({
    cardId: 'n2_swap_with_me',
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();

      const jumps = [
        [1, 2], [1, -2], [-1, 2], [-1, -2],
        [2, 1], [2, -1], [-2, 1], [-2, -1],
      ];
      const targets: string[] = [];
      for (const [df, dr] of jumps) {
        const sq = CardUtils.getSquare(file + df, rank + dr);
        if (sq) {
          const p = engine.getPiece(sq);
          if (p && p.color === turn) {
            targets.push(sq);
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Swap With Me target' };

      const knight = engine.getPiece(anchorSquare);
      const ally = engine.getPiece(dest);
      if (!knight || !ally) return { success: false, error: 'Missing pieces for swap' };

      const chess = engine.getInternalChess();
      chess.remove(anchorSquare as Square);
      chess.remove(dest as Square);
      chess.put(knight, dest as Square);
      chess.put(ally, anchorSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // N3: Trample (n3_trample)
  // ==========================================
  registerCardHandler({
    cardId: 'n3_trample',
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();

      const jumps = [
        [1, 2], [1, -2], [-1, 2], [-1, -2],
        [2, 1], [2, -1], [-2, 1], [-2, -1],
      ];
      const targets: string[] = [];
      for (const [df, dr] of jumps) {
        const destSq = CardUtils.getSquare(file + df, rank + dr);
        if (!destSq || engine.getPiece(destSq) || engine.isSquareBlockedByBarrier(destSq)) continue;

        // Check straight leg for enemy pawns
        let hasEnemyPawn = false;
        if (Math.abs(df) === 2) {
          const step1 = CardUtils.getSquare(file + Math.sign(df) * 1, rank);
          const step2 = CardUtils.getSquare(file + Math.sign(df) * 2, rank);
          for (const s of [step1, step2]) {
            if (s) {
              const p = engine.getPiece(s);
              if (p && p.color !== turn && p.type === 'p') hasEnemyPawn = true;
            }
          }
        } else {
          const step1 = CardUtils.getSquare(file, rank + Math.sign(dr) * 1);
          const step2 = CardUtils.getSquare(file, rank + Math.sign(dr) * 2);
          for (const s of [step1, step2]) {
            if (s) {
              const p = engine.getPiece(s);
              if (p && p.color !== turn && p.type === 'p') hasEnemyPawn = true;
            }
          }
        }

        if (hasEnemyPawn) {
          targets.push(destSq);
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Trample target' };

      const knight = engine.getPiece(anchorSquare);
      if (!knight) return { success: false, error: 'No knight at anchor' };

      const cFrom = CardUtils.getCoords(anchorSquare);
      const cTo = CardUtils.getCoords(dest);
      const df = cTo.file - cFrom.file;
      const dr = cTo.rank - cFrom.rank;
      const turn = engine.getTurn();
      const chess = engine.getInternalChess();

      // Destroy enemy pawns on straight leg
      const legSquares =
        Math.abs(df) === 2
          ? [
              CardUtils.getSquare(cFrom.file + Math.sign(df) * 1, cFrom.rank),
              CardUtils.getSquare(cFrom.file + Math.sign(df) * 2, cFrom.rank),
            ]
          : [
              CardUtils.getSquare(cFrom.file, cFrom.rank + Math.sign(dr) * 1),
              CardUtils.getSquare(cFrom.file, cFrom.rank + Math.sign(dr) * 2),
            ];

      for (const sq of legSquares) {
        if (sq) {
          const p = engine.getPiece(sq);
          if (p && p.color !== turn && p.type === 'p') {
            chess.remove(sq as Square);
            engine.addToPlayerGraveyard(p.color, p.type);
          }
        }
      }

      chess.remove(anchorSquare as Square);
      chess.put(knight, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // N4: Pin Swap (n4_pin_swap)
  // ==========================================
  registerCardHandler({
    cardId: 'n4_pin_swap',
    evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
      return isPinnedToKing(engine, anchorSquare);
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      if (!isPinnedToKing(engine, anchorSquare)) return [];
      const turn = engine.getTurn();
      const adjacent = CardUtils.getAdjacentSquares(anchorSquare, true);
      const targets: string[] = [];
      for (const sq of adjacent) {
        const p = engine.getPiece(sq);
        if (p && p.color === turn) {
          targets.push(sq);
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Pin Swap target' };

      const knight = engine.getPiece(anchorSquare);
      const ally = engine.getPiece(dest);
      if (!knight || !ally) return { success: false, error: 'Missing pieces for Pin Swap' };

      const chess = engine.getInternalChess();
      chess.remove(anchorSquare as Square);
      chess.remove(dest as Square);
      chess.put(knight, dest as Square);
      chess.put(ally, anchorSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // N5: Get to the King (n5_get_to_the_king)
  // ==========================================
  registerCardHandler({
    cardId: 'n5_get_to_the_king',
    evaluateConditions(engine: DeckChessEngine): boolean {
      return engine.inCheck();
    },
    getTargets(engine: DeckChessEngine): string[] {
      if (!engine.inCheck()) return [];
      const turn = engine.getTurn();

      // Locate friendly king
      let kingSq: string | null = null;
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const s = CardUtils.getSquare(f, r);
          if (s) {
            const p = engine.getPiece(s);
            if (p && p.color === turn && p.type === 'k') {
              kingSq = s;
              break;
            }
          }
        }
        if (kingSq) break;
      }
      if (!kingSq) return [];

      const adjacent = CardUtils.getAdjacentSquares(kingSq, true);
      return adjacent.filter((sq) => !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq));
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Get to the King target' };

      const knight = engine.getPiece(anchorSquare);
      if (!knight) return { success: false, error: 'No knight at anchor' };

      const chess = engine.getInternalChess();
      chess.remove(anchorSquare as Square);
      chess.put(knight, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // N6: Flanking Support (n6_flanking_support)
  // ==========================================
  registerCardHandler<TargetOption>({
    cardId: 'n6_flanking_support',
    evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
      const { file } = CardUtils.getCoords(anchorSquare);
      if (file !== 0 && file !== 7) return false;
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
    evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const relRank = getRelativeRank(rank, turn);
      // Ranks 5-8 relative (4..7)
      if (relRank < 4) return false;

      const dir = turn === 'w' ? 1 : -1;
      let defendedCount = 0;
      let emptyCount = 0;
      for (const df of [-1, 1]) {
        const sq = CardUtils.getSquare(file + df, rank - dir);
        if (sq) {
          const p = engine.getPiece(sq);
          if (p && p.color === turn && p.type === 'p') defendedCount++;
          if (!p && !engine.isSquareBlockedByBarrier(sq)) emptyCount++;
        }
      }
      return defendedCount >= 1 && emptyCount >= 1 && engine.canSpawnPawn(turn);
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
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      const targets: string[] = [];
      for (const df of [-1, 1]) {
        const sq = CardUtils.getSquare(file + df, rank + dir);
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
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Let Me Through target' };

      const bishop = engine.getPiece(anchorSquare);
      const pawn = engine.getPiece(dest);
      if (!bishop || !pawn) return { success: false, error: 'Missing pieces for swap' };

      const chess = engine.getInternalChess();
      chess.remove(anchorSquare as Square);
      chess.remove(dest as Square);
      chess.put(bishop, dest as Square);
      chess.put(pawn, anchorSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // B2: Pierce (b2_pierce)
  // ==========================================
  registerCardHandler({
    cardId: 'b2_pierce',
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const diagonals = [
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ];

      const targets: string[] = [];
      for (const [df, dr] of diagonals) {
        let step = 1;
        let foundEnemyPawn = false;
        while (true) {
          const sq = CardUtils.getSquare(file + df * step, rank + dr * step);
          if (!sq || engine.isSquareBlockedByBarrier(sq)) break;

          const p = engine.getPiece(sq);
          if (!foundEnemyPawn) {
            if (p) {
              if (p.color !== turn && p.type === 'p') {
                foundEnemyPawn = true;
              } else {
                break; // friendly piece or non-pawn blocks
              }
            }
          } else {
            // After enemy pawn, must be empty square
            if (!p) {
              targets.push(sq);
            } else {
              break; // obstructed beyond
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
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Pierce target' };

      const cFrom = CardUtils.getCoords(anchorSquare);
      const cTo = CardUtils.getCoords(dest);
      const df = Math.sign(cTo.file - cFrom.file);
      const dr = Math.sign(cTo.rank - cFrom.rank);
      const turn = engine.getTurn();
      const chess = engine.getInternalChess();

      // Find and destroy the enemy pawn on the diagonal
      let step = 1;
      while (true) {
        const sq = CardUtils.getSquare(cFrom.file + df * step, cFrom.rank + dr * step);
        if (!sq || sq === dest) break;
        const p = engine.getPiece(sq);
        if (p && p.color !== turn && p.type === 'p') {
          chess.remove(sq as Square);
          engine.addToPlayerGraveyard(p.color, p.type);
          break;
        }
        step++;
      }

      const bishop = engine.getPiece(anchorSquare);
      if (!bishop) return { success: false, error: 'No bishop at anchor' };
      chess.remove(anchorSquare as Square);
      chess.put(bishop, dest as Square);
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
      const corners = turn === 'w' ? ['a1', 'h1'] : ['a8', 'h8'];
      return corners.includes(anchorSquare);
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      if (!this.evaluateConditions?.(engine, anchorSquare)) return [];
      const adjacent = CardUtils.getAdjacentSquares(anchorSquare, false);
      return adjacent.filter((sq) => !engine.getPiece(sq) && !engine.isSquareBlockedByBarrier(sq));
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Change Color target' };

      const bishop = engine.getPiece(anchorSquare);
      if (!bishop) return { success: false, error: 'No bishop at anchor' };

      const chess = engine.getInternalChess();
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
      return isPinnedToKing(engine, anchorSquare);
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      if (!isPinnedToKing(engine, anchorSquare)) return [];
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
            if (p.color === turn) {
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
      if (!bishop || !ally) return { success: false, error: 'Missing pieces for swap' };

      const chess = engine.getInternalChess();
      chess.remove(anchorSquare as Square);
      chess.remove(dest as Square);
      chess.put(bishop, dest as Square);
      chess.put(ally, anchorSquare as Square);
      return { success: true };
    },
  });

  // ==========================================
  // B6: Come This Way (b6_come_this_way)
  // ==========================================
  registerCardHandler({
    cardId: 'b6_come_this_way',
    evaluateConditions(_engine: DeckChessEngine, anchorSquare: string): boolean {
      return ['d4', 'd5', 'e4', 'e5'].includes(anchorSquare);
    },
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      if (!['d4', 'd5', 'e4', 'e5'].includes(anchorSquare)) return [];
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
            if (p.color === turn && p.type === 'p' && step >= 2) {
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
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Come This Way target' };

      const pawn = engine.getPiece(dest);
      if (!pawn) return { success: false, error: 'No friendly pawn at target' };

      const cBishop = CardUtils.getCoords(anchorSquare);
      const cPawn = CardUtils.getCoords(dest);
      const df = Math.sign(cPawn.file - cBishop.file);
      const dr = Math.sign(cPawn.rank - cBishop.rank);

      // Pull pawn to 1 tile diagonally adjacent to bishop
      const landingSq = CardUtils.getSquare(cBishop.file + df, cBishop.rank + dr);
      if (!landingSq) return { success: false, error: 'Invalid landing square' };

      const chess = engine.getInternalChess();
      chess.remove(dest as Square);
      chess.put(pawn, landingSq as Square);
      return { success: true };
    },
  });

  // ==========================================
  // B7: Bishop's Blessing (b7_bishops_blessing)
  // ==========================================
  registerCardHandler({
    cardId: 'b7_bishops_blessing',
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      const behindSq = CardUtils.getSquare(file, rank - dir);
      if (!behindSq) return [];
      const ally = engine.getPiece(behindSq);
      if (!ally || ally.color !== turn) return [];

      const behindCoords = CardUtils.getCoords(behindSq);
      const diagonals = [
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ];
      const targets: string[] = [];

      for (const [df, dr] of diagonals) {
        let step = 1;
        while (true) {
          const sq = CardUtils.getSquare(behindCoords.file + df * step, behindCoords.rank + dr * step);
          if (!sq || sq === anchorSquare || engine.isSquareBlockedByBarrier(sq)) break;
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
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Bishop\'s Blessing destination' };

      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;
      const behindSq = CardUtils.getSquare(file, rank - dir);
      if (!behindSq) return { success: false, error: 'No behind square' };

      const ally = engine.getPiece(behindSq);
      if (!ally) return { success: false, error: 'No ally behind bishop' };

      const enemy = engine.getPiece(dest);
      const chess = engine.getInternalChess();
      if (enemy) {
        chess.remove(dest as Square);
        engine.addToPlayerGraveyard(enemy.color, enemy.type);
      }
      chess.remove(behindSq as Square);
      chess.put(ally, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // R1: Make Way (r1_make_way)
  // ==========================================
  registerCardHandler({
    cardId: 'r1_make_way',
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const orthogonals = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
      ];

      const targets: string[] = [];
      for (const [df, dr] of orthogonals) {
        const pawnSq = CardUtils.getSquare(file + df, rank + dr);
        if (pawnSq) {
          const p = engine.getPiece(pawnSq);
          if (p && p.color === turn && p.type === 'p') {
            const beyondSq = CardUtils.getSquare(file + df * 2, rank + dr * 2);
            if (beyondSq && !engine.getPiece(beyondSq) && !engine.isSquareBlockedByBarrier(beyondSq)) {
              targets.push(pawnSq);
            }
          }
        }
      }
      return targets;
    },
    execute(engine: DeckChessEngine, anchorSquare: string, targetSquare?: string) {
      const valid = this.getTargets(engine, anchorSquare);
      const dest = targetSquare || valid[0];
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Make Way target' };

      const rook = engine.getPiece(anchorSquare);
      const pawn = engine.getPiece(dest);
      if (!rook || !pawn) return { success: false, error: 'Missing pieces for Make Way' };

      const cRook = CardUtils.getCoords(anchorSquare);
      const cPawn = CardUtils.getCoords(dest);
      const df = cPawn.file - cRook.file;
      const dr = cPawn.rank - cRook.rank;
      const beyondSq = CardUtils.getSquare(cPawn.file + df, cPawn.rank + dr);
      if (!beyondSq) return { success: false, error: 'No space beyond pawn' };

      const chess = engine.getInternalChess();
      chess.remove(anchorSquare as Square);
      chess.remove(dest as Square);
      chess.put(pawn, beyondSq as Square);
      chess.put(rook, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // R2: I've Got Your Back (r2_ive_got_your_back)
  // ==========================================
  registerCardHandler({
    cardId: 'r2_ive_got_your_back',
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      const targets: string[] = [];
      for (const df of [-1, 1]) {
        let step = 1;
        while (true) {
          const sq = CardUtils.getSquare(file + df * step, rank);
          if (!sq || engine.isSquareBlockedByBarrier(sq)) break;
          const p = engine.getPiece(sq);
          if (p) {
            if (p.color === turn) {
              const forwardSq = CardUtils.getSquare(file + df * step, rank + dir);
              if (forwardSq && !engine.getPiece(forwardSq) && !engine.isSquareBlockedByBarrier(forwardSq)) {
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
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid I\'ve Got Your Back target' };

      const rook = engine.getPiece(anchorSquare);
      const ally = engine.getPiece(dest);
      if (!rook || !ally) return { success: false, error: 'Missing pieces' };

      const { file, rank } = CardUtils.getCoords(dest);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;
      const forwardSq = CardUtils.getSquare(file, rank + dir);
      if (!forwardSq) return { success: false, error: 'Invalid forward square' };

      const chess = engine.getInternalChess();
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
    getTargets(engine: DeckChessEngine, anchorSquare: string): TargetOption[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();

      // Find other friendly rook on same rank or file with unobstructed line
      let otherRookSq: string | null = null;
      let sharedAxis: 'rank' | 'file' | null = null;

      // Check same file
      for (const dr of [-1, 1]) {
        let step = 1;
        while (true) {
          const sq = CardUtils.getSquare(file, rank + dr * step);
          if (!sq || engine.isSquareBlockedByBarrier(sq)) break;
          const p = engine.getPiece(sq);
          if (p) {
            if (p.color === turn && p.type === 'r') {
              otherRookSq = sq;
              sharedAxis = 'file';
            }
            break;
          }
          step++;
        }
        if (otherRookSq) break;
      }

      // Check same rank
      if (!otherRookSq) {
        for (const df of [-1, 1]) {
          let step = 1;
          while (true) {
            const sq = CardUtils.getSquare(file + df * step, rank);
            if (!sq || engine.isSquareBlockedByBarrier(sq)) break;
            const p = engine.getPiece(sq);
            if (p) {
              if (p.color === turn && p.type === 'r') {
                otherRookSq = sq;
                sharedAxis = 'rank';
              }
              break;
            }
            step++;
          }
          if (otherRookSq) break;
        }
      }

      if (!otherRookSq || !sharedAxis) return [];
      const cOther = CardUtils.getCoords(otherRookSq);

      const targets: TargetOption[] = [];
      const perpDirs = sharedAxis === 'file' ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];

      for (const [df, dr] of perpDirs) {
        let k = 1;
        while (true) {
          const sq1 = CardUtils.getSquare(file + df * k, rank + dr * k);
          const sq2 = CardUtils.getSquare(cOther.file + df * k, cOther.rank + dr * k);
          if (!sq1 || !sq2) break;
          if (engine.isSquareBlockedByBarrier(sq1) || engine.isSquareBlockedByBarrier(sq2)) break;

          const p1 = engine.getPiece(sq1);
          const p2 = engine.getPiece(sq2);
          const canLand1 = !p1 || (p1.color !== turn && p1.type !== 'k');
          const canLand2 = !p2 || (p2.color !== turn && p2.type !== 'k');

          if (canLand1 && canLand2) {
            targets.push({
              to: sq1,
              extraSquare: sq2,
              disambiguationPrompt: `Move paired Rook to ${sq2}`,
            });
          }
          // If either square was obstructed by any piece, cannot extend further in this direction
          if (p1 || p2) break;
          k++;
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
      if (!match) return { success: false, error: 'Invalid Move in Unison targets' };

      const chosenExtra = typeof match === 'string' ? extraSquare : (match.extraSquare || extraSquare);
      if (!chosenExtra) return { success: false, error: 'Missing paired rook target' };

      // Find the second rook
      const turn = engine.getTurn();
      let otherRookOrigin: string | null = null;
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const s = CardUtils.getSquare(f, r);
          if (s && s !== anchorSquare) {
            const p = engine.getPiece(s);
            if (p && p.color === turn && p.type === 'r') otherRookOrigin = s;
          }
        }
      }
      if (!otherRookOrigin) return { success: false, error: 'Second rook not found' };

      const r1 = engine.getPiece(anchorSquare);
      const r2 = engine.getPiece(otherRookOrigin);
      if (!r1 || !r2) return { success: false, error: 'Missing rooks' };

      const e1 = engine.getPiece(targetSquare);
      const e2 = engine.getPiece(chosenExtra);
      const chess = engine.getInternalChess();
      if (e1) {
        chess.remove(targetSquare as Square);
        engine.addToPlayerGraveyard(e1.color, e1.type);
      }
      if (e2) {
        chess.remove(chosenExtra as Square);
        engine.addToPlayerGraveyard(e2.color, e2.type);
      }
      chess.remove(anchorSquare as Square);
      chess.remove(otherRookOrigin as Square);
      chess.put(r1, targetSquare as Square);
      chess.put(r2, chosenExtra as Square);
      return { success: true };
    },
  });

  // ==========================================
  // R5: Catapult (r5_catapult)
  // ==========================================
  registerCardHandler({
    cardId: 'r5_catapult',
    getTargets(engine: DeckChessEngine, anchorSquare: string): string[] {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const orthogonals = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
      ];

      const targets: string[] = [];
      for (const [df, dr] of orthogonals) {
        const behindSq = CardUtils.getSquare(file - df, rank - dr);
        if (!behindSq) continue;
        const ally = engine.getPiece(behindSq);
        if (!ally || ally.color !== turn || ally.type === 'k') continue;

        // Scan along forward ray for first piece
        let step = 1;
        while (true) {
          const fwdSq = CardUtils.getSquare(file + df * step, rank + dr * step);
          if (!fwdSq || engine.isSquareBlockedByBarrier(fwdSq)) break;
          const p = engine.getPiece(fwdSq);
          if (p) {
            if (p.color !== turn && p.type !== 'k') {
              targets.push(fwdSq);
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
      if (!dest || !valid.includes(dest)) return { success: false, error: 'Invalid Catapult target' };

      const cRook = CardUtils.getCoords(anchorSquare);
      const cTarget = CardUtils.getCoords(dest);
      const df = Math.sign(cTarget.file - cRook.file);
      const dr = Math.sign(cTarget.rank - cRook.rank);

      const behindSq = CardUtils.getSquare(cRook.file - df, cRook.rank - dr);
      if (!behindSq) return { success: false, error: 'No behind square' };

      const ally = engine.getPiece(behindSq);
      const enemy = engine.getPiece(dest);
      if (!ally || !enemy) return { success: false, error: 'Missing pieces for Catapult' };

      const chess = engine.getInternalChess();
      chess.remove(dest as Square);
      engine.addToPlayerGraveyard(enemy.color, enemy.type);
      chess.remove(behindSq as Square);
      chess.put(ally, dest as Square);
      return { success: true };
    },
  });

  // ==========================================
  // R6: Garrison (r6_garrison)
  // ==========================================
  registerCardHandler({
    cardId: 'r6_garrison',
    evaluateConditions(engine: DeckChessEngine, anchorSquare: string): boolean {
      const { file, rank } = CardUtils.getCoords(anchorSquare);
      const turn = engine.getTurn();
      const dir = turn === 'w' ? 1 : -1;

      const behindSq = CardUtils.getSquare(file, rank - dir);
      if (!behindSq) return false;
      const king = engine.getPiece(behindSq);
      if (!king || king.color !== turn || king.type !== 'k') return false;

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
                  const isDiag = Math.abs(edf) === Math.abs(edr);
                  const isOrth = edf === 0 || edr === 0;
                  if ((ep.type === 'b' && isDiag) || (ep.type === 'r' && isOrth) || ep.type === 'q') {
                    const stepF = Math.sign(edf);
                    const stepR = Math.sign(edr);
                    let s = 1;
                    let clear = true;
                    while (true) {
                      const testSq = CardUtils.getSquare(cE.file + stepF * s, cE.rank + stepR * s);
                      if (!testSq || testSq === allySq) break;
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
