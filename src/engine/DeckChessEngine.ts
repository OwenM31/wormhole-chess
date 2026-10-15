import { Chess, Move, PieceSymbol, Color } from 'chess.js';
import {
  BoardModifier,
  CardDefinition,
  DeckChessCardAction,
  DeckChessMove,
  GameFinishReason,
  Graveyard,
  PieceAnchor,
  PieceColor,
  Square,
} from '../types/deckChess';
import { getCardById, STARTER_DECK } from './cardGraph';

export interface DeckChessEngineState {
  fen: string;
  turn: PieceColor;
  turnNumber: number;
  energy: number;
  cardPlayedThisTurn: boolean;
  whiteHand: string[];
  blackHand: string[];
  graveyard: {
    w: Graveyard;
    b: Graveyard;
  };
  activeModifiers: BoardModifier[];
  isGameOver: boolean;
  winner: PieceColor | 'draw' | null;
  finishReason: GameFinishReason | null;
  inCheck: boolean;
  lastMove?: Move;
}

export class DeckChessEngine {
  private chess: Chess;
  private energy: number;
  private cardPlayedThisTurn: boolean;
  private turnNumber: number;
  private whiteHand: string[];
  private blackHand: string[];
  private graveyard: { w: Graveyard; b: Graveyard };
  private activeModifiers: BoardModifier[];
  private winner: PieceColor | 'draw' | null = null;
  private finishReason: GameFinishReason | null = null;

  constructor(initialFen?: string, whiteDeck?: string[], blackDeck?: string[]) {
    this.chess = initialFen ? new Chess(initialFen) : new Chess();
    this.energy = 3;
    this.cardPlayedThisTurn = false;
    this.turnNumber = 1;
    this.whiteHand = whiteDeck ? [...whiteDeck] : STARTER_DECK.map((c) => c.id);
    this.blackHand = blackDeck ? [...blackDeck] : STARTER_DECK.map((c) => c.id);
    this.graveyard = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    };
    this.activeModifiers = [];
  }

  // --- Board & Turn State Getters ---

  public getFen(): string {
    return this.chess.fen();
  }

  public getTurn(): PieceColor {
    return this.chess.turn() as PieceColor;
  }

  public getTurnNumber(): number {
    return this.turnNumber;
  }

  public getEnergy(): number {
    return this.energy;
  }

  public hasPlayedCardThisTurn(): boolean {
    return this.cardPlayedThisTurn;
  }

  public getWhiteHand(): string[] {
    return [...this.whiteHand];
  }

  public getBlackHand(): string[] {
    return [...this.blackHand];
  }

  public getHandForColor(color: PieceColor): string[] {
    return color === 'w' ? this.getWhiteHand() : this.getBlackHand();
  }

  public getGraveyard(): { w: Graveyard; b: Graveyard } {
    return {
      w: { ...this.graveyard.w },
      b: { ...this.graveyard.b },
    };
  }

  public getActiveModifiers(): BoardModifier[] {
    return [...this.activeModifiers];
  }

  public inCheck(): boolean {
    return this.chess.inCheck();
  }

  public isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  public isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  public isDraw(): boolean {
    return this.chess.isDraw();
  }

  public isGameOver(): boolean {
    if (this.winner !== null) return true;
    return this.chess.isGameOver();
  }

  public getWinner(): PieceColor | 'draw' | null {
    if (this.winner) return this.winner;
    if (this.chess.isCheckmate()) {
      return this.chess.turn() === 'w' ? 'b' : 'w';
    }
    if (this.chess.isDraw() || this.chess.isStalemate()) {
      return 'draw';
    }
    return null;
  }

  public getFinishReason(): GameFinishReason | null {
    if (this.finishReason) return this.finishReason;
    if (this.chess.isCheckmate()) return 'checkmate';
    if (this.chess.isStalemate()) return 'stalemate';
    if (this.chess.isDraw()) return 'draw';
    return null;
  }

  public getPiece(square: Square | string) {
    return this.chess.get(square as Square);
  }

  public getBoard() {
    return this.chess.board();
  }

  public getState(): DeckChessEngineState {
    return {
      fen: this.getFen(),
      turn: this.getTurn(),
      turnNumber: this.turnNumber,
      energy: this.energy,
      cardPlayedThisTurn: this.cardPlayedThisTurn,
      whiteHand: this.getWhiteHand(),
      blackHand: this.getBlackHand(),
      graveyard: this.getGraveyard(),
      activeModifiers: this.getActiveModifiers(),
      isGameOver: this.isGameOver(),
      winner: this.getWinner(),
      finishReason: this.getFinishReason(),
      inCheck: this.inCheck(),
    };
  }

  public clone(): DeckChessEngine {
    const cloned = new DeckChessEngine(this.getFen(), this.whiteHand, this.blackHand);
    cloned.energy = this.energy;
    cloned.cardPlayedThisTurn = this.cardPlayedThisTurn;
    cloned.turnNumber = this.turnNumber;
    cloned.graveyard = {
      w: { ...this.graveyard.w },
      b: { ...this.graveyard.b },
    };
    cloned.activeModifiers = this.activeModifiers.map((m) => ({ ...m }));
    cloned.winner = this.winner;
    cloned.finishReason = this.finishReason;
    return cloned;
  }

  // --- Coordinate & Distance Helpers ---

  public static squareToCoords(square: string): { file: number; rank: number } {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(square[1], 10) - 1;
    return { file, rank };
  }

  public static coordsToSquare(file: number, rank: number): Square | null {
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
    const f = String.fromCharCode('a'.charCodeAt(0) + file);
    const r = (rank + 1).toString();
    return `${f}${r}` as Square;
  }

  private static chebyshevDistance(sq1: string, sq2: string): number {
    const c1 = DeckChessEngine.squareToCoords(sq1);
    const c2 = DeckChessEngine.squareToCoords(sq2);
    return Math.max(Math.abs(c1.file - c2.file), Math.abs(c1.rank - c2.rank));
  }

  private static manhattanDistance(sq1: string, sq2: string): number {
    const c1 = DeckChessEngine.squareToCoords(sq1);
    const c2 = DeckChessEngine.squareToCoords(sq2);
    return Math.abs(c1.file - c2.file) + Math.abs(c1.rank - c2.rank);
  }

  // --- Condition Evaluator ---

  public evaluateConditions(card: CardDefinition, anchorSquare: string): boolean {
    const piece = this.chess.get(anchorSquare as Square);
    if (!piece) return false;

    // Piece anchor matching
    const anchorTypeMap: Record<PieceAnchor, PieceSymbol> = {
      pawn: 'p',
      knight: 'n',
      bishop: 'b',
      rook: 'r',
      queen: 'q',
      king: 'k',
    };
    if (piece.type !== anchorTypeMap[card.anchor]) return false;
    if (piece.color !== this.getTurn()) return false;

    const coords = DeckChessEngine.squareToCoords(anchorSquare);
    const currentTurn = this.getTurn();
    const opponentColor = (currentTurn === 'w' ? 'b' : 'w') as Color;

    for (const cond of card.conditions) {
      switch (cond.type) {
        case 'UNMOVED': {
          if (piece.type === 'p') {
            const expectedRank = currentTurn === 'w' ? 1 : 6; // rank 2 (index 1) for White, rank 7 (index 6) for Black
            if (coords.rank !== expectedRank) return false;
          }
          break;
        }

        case 'UNDER_FIRE': {
          const isAttacked = this.chess.isAttacked(anchorSquare as Square, opponentColor);
          if (!isAttacked) return false;
          break;
        }

        case 'FRIENDLY_ADJACENCY': {
          let hasFriendly = false;
          for (let df = -1; df <= 1; df++) {
            for (let dr = -1; dr <= 1; dr++) {
              if (df === 0 && dr === 0) continue;
              const neighborSq = DeckChessEngine.coordsToSquare(coords.file + df, coords.rank + dr);
              if (neighborSq) {
                const neighbor = this.chess.get(neighborSq);
                if (neighbor && neighbor.color === currentTurn) {
                  hasFriendly = true;
                  break;
                }
              }
            }
            if (hasFriendly) break;
          }
          if (!hasFriendly) return false;
          break;
        }

        case 'IN_TERRITORY': {
          if (cond.param === 'ENEMY_HALF') {
            const isEnemyHalf = currentTurn === 'w' ? coords.rank >= 4 : coords.rank <= 3;
            if (!isEnemyHalf) return false;
          }
          break;
        }

        case 'OPEN_LINE': {
          // Checks if there is at least one unobstructed square in a primary direction
          const directions =
            card.anchor === 'bishop'
              ? [
                  [1, 1],
                  [1, -1],
                  [-1, 1],
                  [-1, -1],
                ]
              : [
                  [1, 0],
                  [-1, 0],
                  [0, 1],
                  [0, -1],
                ];
          let open = false;
          for (const [df, dr] of directions) {
            const nextSq = DeckChessEngine.coordsToSquare(coords.file + df, coords.rank + dr);
            if (nextSq && !this.chess.get(nextSq) && !this.isSquareBlockedByBarrier(nextSq)) {
              open = true;
              break;
            }
          }
          if (!open) return false;
          break;
        }

        case 'LINE_OF_SIGHT_ALIGNMENT': {
          // Used by Prism Ray (Bishop): checks if there is an enemy piece on diagonal
          const diagonals = [
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
          ];
          let hasEnemyTarget = false;
          for (const [df, dr] of diagonals) {
            let step = 1;
            while (true) {
              const sq = DeckChessEngine.coordsToSquare(coords.file + df * step, coords.rank + dr * step);
              if (!sq) break;
              if (this.isSquareBlockedByBarrier(sq)) break;
              const p = this.chess.get(sq);
              if (p) {
                if (p.color !== currentTurn) {
                  hasEnemyTarget = true;
                }
                break;
              }
              step++;
            }
            if (hasEnemyTarget) break;
          }
          if (!hasEnemyTarget) return false;
          break;
        }

        case 'BATTERY_ALIGNMENT': {
          const orthogonals = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ];
          let batteryFound = false;
          for (const [df, dr] of orthogonals) {
            let step = 1;
            while (true) {
              const sq = DeckChessEngine.coordsToSquare(coords.file + df * step, coords.rank + dr * step);
              if (!sq) break;
              const p = this.chess.get(sq);
              if (p) {
                if (p.color === currentTurn && (p.type === 'r' || p.type === 'q')) {
                  batteryFound = true;
                }
                break;
              }
              step++;
            }
            if (batteryFound) break;
          }
          if (!batteryFound) return false;
          break;
        }

        case 'GRAVEYARD_COUNT': {
          const reqCount = typeof cond.param === 'number' ? cond.param : 1;
          const gy = this.graveyard[currentTurn];
          const totalPieces = gy.p + gy.n + gy.b + gy.r + gy.q;
          if (totalPieces < reqCount) return false;
          break;
        }

        case 'ON_RIM': {
          const onRim = coords.file === 0 || coords.file === 7;
          if (!onRim) return false;
          break;
        }

        default:
          break;
      }
    }

    return true;
  }

  public canPlayCard(cardId: string, anchorSquare?: string): boolean {
    if (this.cardPlayedThisTurn) return false;
    const card = getCardById(cardId);
    if (!card) return false;
    if (this.energy < card.energyCost) return false;

    const hand = this.getHandForColor(this.getTurn());
    if (!hand.includes(cardId)) return false;

    if (anchorSquare) {
      return this.evaluateConditions(card, anchorSquare);
    }

    // If anchor not provided, check if any square on the board qualifies
    const anchors = this.getValidAnchorsForCard(cardId);
    return anchors.length > 0;
  }

  public getValidAnchorsForCard(cardId: string): string[] {
    const card = getCardById(cardId);
    if (!card) return [];
    if (this.cardPlayedThisTurn || this.energy < card.energyCost) return [];

    const anchors: string[] = [];
    const board = this.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = DeckChessEngine.coordsToSquare(f, r);
        if (sq && this.evaluateConditions(card, sq)) {
          anchors.push(sq);
        }
      }
    }
    return anchors;
  }

  public getValidTargetsForCard(cardId: string, anchorSquare: string): string[] {
    const card = getCardById(cardId);
    if (!card) return [];
    const targets: string[] = [];
    const coords = DeckChessEngine.squareToCoords(anchorSquare);
    const turn = this.getTurn();

    switch (cardId) {
      case 'pawn_vanguard': {
        const dir = turn === 'w' ? 1 : -1;
        const step1 = DeckChessEngine.coordsToSquare(coords.file, coords.rank + dir);
        const step2 = DeckChessEngine.coordsToSquare(coords.file, coords.rank + dir * 2);
        const step3 = DeckChessEngine.coordsToSquare(coords.file, coords.rank + dir * 3);
        if (
          step1 &&
          step2 &&
          step3 &&
          !this.chess.get(step1) &&
          !this.chess.get(step2) &&
          !this.chess.get(step3) &&
          !this.isSquareBlockedByBarrier(step1) &&
          !this.isSquareBlockedByBarrier(step2) &&
          !this.isSquareBlockedByBarrier(step3)
        ) {
          targets.push(step3);
        }
        break;
      }

      case 'knight_escort': {
        // Target is an adjacent friendly pawn
        for (let df = -1; df <= 1; df++) {
          for (let dr = -1; dr <= 1; dr++) {
            if (df === 0 && dr === 0) continue;
            const sq = DeckChessEngine.coordsToSquare(coords.file + df, coords.rank + dr);
            if (sq) {
              const p = this.chess.get(sq);
              if (p && p.color === turn && p.type === 'p') {
                targets.push(sq);
              }
            }
          }
        }
        break;
      }

      case 'knight_swap': {
        // Any friendly piece on board (other than the knight itself)
        const board = this.chess.board();
        for (let r = 0; r < 8; r++) {
          for (let f = 0; f < 8; f++) {
            const sq = DeckChessEngine.coordsToSquare(f, r);
            if (sq && sq !== anchorSquare) {
              const p = this.chess.get(sq);
              if (p && p.color === turn && p.type !== 'k') {
                targets.push(sq);
              }
            }
          }
        }
        break;
      }

      case 'bishop_invert': {
        // Target is adjacent orthogonal empty square
        const orthogonals = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ];
        for (const [df, dr] of orthogonals) {
          const sq = DeckChessEngine.coordsToSquare(coords.file + df, coords.rank + dr);
          if (sq && !this.chess.get(sq) && !this.isSquareBlockedByBarrier(sq)) {
            targets.push(sq);
          }
        }
        break;
      }

      case 'rook_rampart': {
        // Empty squares along rook's open line
        const orthogonals = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ];
        for (const [df, dr] of orthogonals) {
          let step = 1;
          while (true) {
            const sq = DeckChessEngine.coordsToSquare(coords.file + df * step, coords.rank + dr * step);
            if (!sq) break;
            if (this.chess.get(sq) || this.isSquareBlockedByBarrier(sq)) break;
            targets.push(sq);
            step++;
          }
        }
        break;
      }

      case 'king_decree': {
        // Adjacent friendly piece to swap/tandem step with
        for (let df = -1; df <= 1; df++) {
          for (let dr = -1; dr <= 1; dr++) {
            if (df === 0 && dr === 0) continue;
            const sq = DeckChessEngine.coordsToSquare(coords.file + df, coords.rank + dr);
            if (sq) {
              const p = this.chess.get(sq);
              if (p && p.color === turn) {
                targets.push(sq);
              }
            }
          }
        }
        break;
      }

      case 'bishop_pierce': {
        // First enemy target along bishop's diagonal
        const diagonals = [
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
        ];
        for (const [df, dr] of diagonals) {
          let step = 1;
          while (true) {
            const sq = DeckChessEngine.coordsToSquare(coords.file + df * step, coords.rank + dr * step);
            if (!sq) break;
            if (this.isSquareBlockedByBarrier(sq)) break;
            const p = this.chess.get(sq);
            if (p) {
              if (p.color !== turn && p.type !== 'k') {
                targets.push(sq);
              }
              break;
            }
            step++;
          }
        }
        break;
      }

      case 'queen_aegis': {
        // Adjacent friendly piece
        for (let df = -1; df <= 1; df++) {
          for (let dr = -1; dr <= 1; dr++) {
            if (df === 0 && dr === 0) continue;
            const sq = DeckChessEngine.coordsToSquare(coords.file + df, coords.rank + dr);
            if (sq) {
              const p = this.chess.get(sq);
              if (p && p.color === turn) {
                targets.push(sq);
              }
            }
          }
        }
        break;
      }

      default:
        break;
    }

    return targets;
  }

  // --- Card Activation & Mutation ---

  public activateCard(
    cardId: string,
    anchorSquare: string,
    targetSquare?: string,
    extraSquare?: string
  ): { success: boolean; error?: string } {
    if (this.cardPlayedThisTurn) {
      return { success: false, error: 'PRE_MOVE_WINDOW: Only 1 card may be played per turn' };
    }

    const card = getCardById(cardId);
    if (!card) {
      return { success: false, error: `Card ${cardId} not found` };
    }

    if (this.energy < card.energyCost) {
      return { success: false, error: `Insufficient energy (need ${card.energyCost}, have ${this.energy})` };
    }

    const currentTurn = this.getTurn();
    const hand = currentTurn === 'w' ? this.whiteHand : this.blackHand;
    const cardIndex = hand.indexOf(cardId);
    if (cardIndex === -1) {
      return { success: false, error: 'Card not in hand' };
    }

    if (!this.evaluateConditions(card, anchorSquare)) {
      return { success: false, error: 'Card conditions not met on anchor piece' };
    }

    // Invariant Simulation (No-Direct-Mate / King Protection)
    const simulation = this.clone();
    const simResult = simulation.executeCardMutation(cardId, anchorSquare, targetSquare, extraSquare);
    if (!simResult.success) {
      return simResult;
    }

    // Verify No-Direct-Mate: Opponent king cannot be put into unavoidable checkmate purely by card effect
    if (simulation.isCheckmate()) {
      return {
        success: false,
        error: 'No-Direct-Mate Invariant: Cards cannot deliver direct checkmate prior to normal chess move',
      };
    }

    // Execute on live engine
    const execution = this.executeCardMutation(cardId, anchorSquare, targetSquare, extraSquare);
    if (!execution.success) {
      return execution;
    }

    // Deduct energy and mark card window closed
    this.energy -= card.energyCost;
    this.cardPlayedThisTurn = true;

    // Remove single-use card from hand
    if (currentTurn === 'w') {
      this.whiteHand.splice(cardIndex, 1);
    } else {
      this.blackHand.splice(cardIndex, 1);
    }

    return { success: true };
  }

  private executeCardMutation(
    cardId: string,
    anchorSquare: string,
    targetSquare?: string,
    extraSquare?: string
  ): { success: boolean; error?: string } {
    const piece = this.chess.get(anchorSquare as Square);
    if (!piece) return { success: false, error: 'No piece at anchor square' };
    const currentTurn = this.getTurn();

    switch (cardId) {
      case 'pawn_vanguard': {
        const dest = targetSquare || this.getValidTargetsForCard(cardId, anchorSquare)[0];
        if (!dest) return { success: false, error: 'Invalid vanguard destination' };
        this.chess.remove(anchorSquare as Square);
        this.chess.put({ type: 'p', color: currentTurn }, dest as Square);
        break;
      }

      case 'pawn_scuttle': {
        this.chess.remove(anchorSquare as Square);
        this.graveyard[currentTurn].p += 1;
        break;
      }

      case 'knight_escort': {
        // Escort passenger pawn
        if (!targetSquare || !extraSquare) {
          return { success: false, error: 'Knight Escort requires target passenger and landing destination' };
        }
        const passenger = this.chess.get(targetSquare as Square);
        if (!passenger || passenger.type !== 'p') {
          return { success: false, error: 'Passenger must be a pawn' };
        }

        // Knight leaps to extraSquare, passenger shifts to anchorSquare
        this.chess.remove(anchorSquare as Square);
        this.chess.remove(targetSquare as Square);
        this.chess.put({ type: 'n', color: currentTurn }, extraSquare as Square);
        this.chess.put({ type: 'p', color: currentTurn }, anchorSquare as Square);
        break;
      }

      case 'knight_swap': {
        if (!targetSquare) {
          return { success: false, error: 'Knight Swap requires a target piece square' };
        }
        const targetPiece = this.chess.get(targetSquare as Square);
        if (!targetPiece || targetPiece.type === 'k') {
          return { success: false, error: 'Cannot swap with King or empty square' };
        }
        this.chess.remove(anchorSquare as Square);
        this.chess.remove(targetSquare as Square);
        this.chess.put(targetPiece, anchorSquare as Square);
        this.chess.put(piece, targetSquare as Square);
        break;
      }

      case 'bishop_invert': {
        const dest = targetSquare || this.getValidTargetsForCard(cardId, anchorSquare)[0];
        if (!dest) return { success: false, error: 'No valid orthogonal square' };
        this.chess.remove(anchorSquare as Square);
        this.chess.put(piece, dest as Square);
        break;
      }

      case 'rook_rampart': {
        const dest = targetSquare || this.getValidTargetsForCard(cardId, anchorSquare)[0];
        if (!dest) return { success: false, error: 'No valid square for rampart' };
        this.activeModifiers.push({
          id: `barrier_${Date.now()}_${dest}`,
          type: 'barrier',
          square: dest,
          ownerColor: currentTurn,
          turnsRemaining: 2,
        });
        break;
      }

      case 'king_decree': {
        if (!targetSquare) {
          return { success: false, error: 'Royal Decree requires adjacent target piece' };
        }
        const friendlyPiece = this.chess.get(targetSquare as Square);
        if (!friendlyPiece) return { success: false, error: 'No piece at target' };

        // King steps to an adjacent empty square or swaps with friendly piece
        const dest = extraSquare || targetSquare;
        if (dest === targetSquare) {
          // Tandem shift: King takes target's square, target shifts to King's vacated square
          this.chess.remove(anchorSquare as Square);
          this.chess.remove(targetSquare as Square);
          this.chess.put(piece, targetSquare as Square);
          this.chess.put(friendlyPiece, anchorSquare as Square);
        }
        break;
      }

      case 'bishop_pierce': {
        if (!targetSquare) {
          return { success: false, error: 'Prism Ray requires a target square' };
        }
        const target1 = this.chess.get(targetSquare as Square);
        if (!target1 || target1.type === 'k') {
          return { success: false, error: 'Invalid target piece' };
        }

        // Add target1 to opponent graveyard
        const oppColor = currentTurn === 'w' ? 'b' : 'w';
        this.addToGraveyard(oppColor, target1.type);
        this.chess.remove(targetSquare as Square);

        // Check for piercing target 2 directly behind target 1
        const cAnchor = DeckChessEngine.squareToCoords(anchorSquare);
        const cTarget = DeckChessEngine.squareToCoords(targetSquare);
        const df = Math.sign(cTarget.file - cAnchor.file);
        const dr = Math.sign(cTarget.rank - cAnchor.rank);
        const nextSq = DeckChessEngine.coordsToSquare(cTarget.file + df, cTarget.rank + dr);
        if (nextSq) {
          const target2 = this.chess.get(nextSq);
          if (target2 && target2.color !== currentTurn && target2.type !== 'k') {
            this.addToGraveyard(oppColor, target2.type);
            this.chess.remove(nextSq);
          }
        }

        // Bishop advances to target 1's square
        this.chess.remove(anchorSquare as Square);
        this.chess.put(piece, targetSquare as Square);
        break;
      }

      case 'queen_aegis': {
        if (!targetSquare) return { success: false, error: 'Target piece required for Aegis' };
        this.activeModifiers.push({
          id: `shield_${Date.now()}_${targetSquare}`,
          type: 'shield',
          square: targetSquare,
          ownerColor: currentTurn,
          turnsRemaining: 2,
        });
        break;
      }

      default:
        break;
    }

    return { success: true };
  }

  // --- Barrier & Shield Modifiers ---

  public isSquareBlockedByBarrier(square: string): boolean {
    return this.activeModifiers.some((m) => m.type === 'barrier' && m.square === square);
  }

  public isSquareShielded(square: string, ownerColor: PieceColor): boolean {
    return this.activeModifiers.some(
      (m) => m.type === 'shield' && m.square === square && m.ownerColor === ownerColor
    );
  }

  private addToGraveyard(color: PieceColor, pieceType: PieceSymbol): void {
    if (pieceType === 'p' || pieceType === 'n' || pieceType === 'b' || pieceType === 'r' || pieceType === 'q') {
      this.graveyard[color][pieceType] += 1;
    }
  }

  // --- Chess Move Execution ---

  public getLegalMoves(square?: string): Move[] {
    const rawMoves = this.chess.moves({
      square: square as Square | undefined,
      verbose: true,
    }) as Move[];

    const defenderColor = this.getTurn() === 'w' ? 'b' : 'w';

    return rawMoves.filter((m) => {
      // 1. Destination blocked by barrier
      if (this.isSquareBlockedByBarrier(m.to)) return false;

      // 2. Destination protected by active shield
      if (this.isSquareShielded(m.to, defenderColor)) return false;

      // 3. Sliding piece ray cannot pass through barrier
      if (m.piece === 'r' || m.piece === 'b' || m.piece === 'q') {
        const cFrom = DeckChessEngine.squareToCoords(m.from);
        const cTo = DeckChessEngine.squareToCoords(m.to);
        const df = Math.sign(cTo.file - cFrom.file);
        const dr = Math.sign(cTo.rank - cFrom.rank);
        let step = 1;
        while (true) {
          const intermediateSq = DeckChessEngine.coordsToSquare(cFrom.file + df * step, cFrom.rank + dr * step);
          if (!intermediateSq || intermediateSq === m.to) break;
          if (this.isSquareBlockedByBarrier(intermediateSq)) return false;
          step++;
        }
      }

      return true;
    });
  }

  public makeMove(move: DeckChessMove): { success: boolean; move?: Move; error?: string } {
    const legalMoves = this.getLegalMoves(move.from);
    const matchingMove = legalMoves.find((m) => {
      if (m.to !== move.to) return false;
      if (m.promotion) {
        return m.promotion === (move.promotion || 'q');
      }
      return true;
    });

    if (!matchingMove) {
      return { success: false, error: 'Illegal chess move' };
    }

    const previousTurn = this.getTurn();

    // Execute standard chess move
    let executedMove: Move;
    try {
      executedMove = this.chess.move({
        from: move.from as Square,
        to: move.to as Square,
        promotion: matchingMove.promotion,
      });
    } catch (e: any) {
      return { success: false, error: e?.message || 'Move failed' };
    }

    // Graveyard tracking on capture
    if (executedMove.captured) {
      const oppColor = previousTurn === 'w' ? 'b' : 'w';
      this.addToGraveyard(oppColor, executedMove.captured);
    }

    // Decrement and expire active modifiers owned by previous player
    this.activeModifiers = this.activeModifiers
      .map((m) => {
        if (m.ownerColor === previousTurn) {
          return { ...m, turnsRemaining: m.turnsRemaining - 1 };
        }
        return m;
      })
      .filter((m) => m.turnsRemaining > 0);

    // End-of-turn reset: 3 energy restored, card window reopened
    this.energy = 3;
    this.cardPlayedThisTurn = false;

    if (previousTurn === 'b') {
      this.turnNumber += 1;
    }

    // Check game termination
    if (this.chess.isCheckmate()) {
      this.winner = previousTurn;
      this.finishReason = 'checkmate';
    } else if (this.chess.isStalemate()) {
      this.winner = 'draw';
      this.finishReason = 'stalemate';
    } else if (this.chess.isDraw()) {
      this.winner = 'draw';
      this.finishReason = 'draw';
    }

    return { success: true, move: executedMove };
  }

  public resign(color: PieceColor): void {
    this.winner = color === 'w' ? 'b' : 'w';
    this.finishReason = 'resignation';
  }
}
