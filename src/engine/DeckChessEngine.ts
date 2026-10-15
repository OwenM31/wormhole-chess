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
import { getCardHandler } from './cards/cardRegistry';

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

    const handler = getCardHandler(card.id);
    if (handler?.evaluateConditions) {
      if (!handler.evaluateConditions(this, anchorSquare)) return false;
    }

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
    const handler = getCardHandler(cardId);
    if (handler) {
      return handler.getTargets(this, anchorSquare);
    }
    return [];
  }

  public getSecondaryTargetsForCard(cardId: string, anchorSquare: string, targetSquare: string): string[] {
    const handler = getCardHandler(cardId);
    if (handler?.getSecondaryTargets) {
      return handler.getSecondaryTargets(this, anchorSquare, targetSquare);
    }
    return [];
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

    // Invariant Simulation (No-Direct-Mate / FEN Integrity / King Protection)
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

    // Verify FEN validity (e.g. no pawns on edge rows)
    try {
      new Chess(simulation.getFen());
    } catch (e: any) {
      return {
        success: false,
        error: `FEN Invariant Violation: ${e?.message || 'Invalid board position'}`,
      };
    }

    // Verify Active Player has at least 1 legal chess move to complete their turn
    if (simulation.getLegalMoves().length === 0) {
      return {
        success: false,
        error: 'Illegal Card State: Playing this card leaves you with no legal chess moves',
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
    const handler = getCardHandler(cardId);
    if (!handler) {
      return { success: false, error: `No handler registered for card ${cardId}` };
    }
    return handler.execute(this, anchorSquare, targetSquare, extraSquare);
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

  public getInternalChess(): Chess {
    return this.chess;
  }

  public addToPlayerGraveyard(color: PieceColor, pieceType: PieceSymbol): void {
    if (pieceType === 'p' || pieceType === 'n' || pieceType === 'b' || pieceType === 'r' || pieceType === 'q') {
      this.graveyard[color][pieceType] += 1;
    }
  }

  public decrementPlayerGraveyard(color: PieceColor, pieceType: PieceSymbol): void {
    if (pieceType === 'p' || pieceType === 'n' || pieceType === 'b' || pieceType === 'r' || pieceType === 'q') {
      if (this.graveyard[color][pieceType] > 0) {
        this.graveyard[color][pieceType] -= 1;
      }
    }
  }

  public addModifier(modifier: BoardModifier): void {
    this.activeModifiers.push(modifier);
  }

  private addToGraveyard(color: PieceColor, pieceType: PieceSymbol): void {
    this.addToPlayerGraveyard(color, pieceType);
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

      const cFrom = DeckChessEngine.squareToCoords(m.from);
      const cTo = DeckChessEngine.squareToCoords(m.to);

      // 3. Sliding piece ray cannot pass through barrier
      if (m.piece === 'r' || m.piece === 'b' || m.piece === 'q') {
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

      // 4. Pawn double-step cannot pass through barrier
      if (m.piece === 'p' && Math.abs(cTo.rank - cFrom.rank) === 2) {
        const intermediateRank = (cFrom.rank + cTo.rank) / 2;
        const intermediateSq = DeckChessEngine.coordsToSquare(cFrom.file, intermediateRank);
        if (intermediateSq && this.isSquareBlockedByBarrier(intermediateSq)) {
          return false;
        }
      }

      // 5. Castling king transit cannot pass through barrier
      if (m.piece === 'k' && Math.abs(cTo.file - cFrom.file) === 2) {
        const transitFile = cTo.file > cFrom.file ? cFrom.file + 1 : cFrom.file - 1;
        const transitSq = DeckChessEngine.coordsToSquare(transitFile, cFrom.rank);
        if (transitSq && this.isSquareBlockedByBarrier(transitSq)) {
          return false;
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

    // If moved piece had an active shield, move shield with the piece
    this.activeModifiers = this.activeModifiers.map((mod) => {
      if (mod.type === 'shield' && mod.square === move.from && mod.ownerColor === previousTurn) {
        return { ...mod, square: move.to };
      }
      return mod;
    });

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
