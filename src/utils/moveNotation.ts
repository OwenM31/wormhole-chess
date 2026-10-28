import { PieceAnchor, PieceColor } from '../types/deckChess';
import { PieceSymbol } from 'chess.js';
import { getCardById } from '../engine/cardGraph';
import { DeckChessEngineState } from '../engine/DeckChessEngine';

export interface RecordedTurn {
  turnNumber: number;
  player: PieceColor;
  chessMove: {
    from: string;
    to: string;
    promotion?: string;
  };
  cardAction?: {
    cardId: string;
    anchorSquare: string;
    targetSquare?: string;
    extraSquare?: string;
  };
  cardCode?: string; // e.g. "N1", "P2", "Q2"
  cardPieceType?: string; // 'pawn' | 'knight' ... or 'p' | 'n' ...
  san?: string; // Standard Algebraic Notation e.g. "Nf3", "e4", "O-O"
  fenAfter: string;
  stateSnapshot: DeckChessEngineState;
  combatText?: string;
  timestamp: number;
}

export interface TurnRow {
  turnNumber: number;
  white?: RecordedTurn;
  whiteIndex?: number;
  black?: RecordedTurn;
  blackIndex?: number;
}

export const PIECE_CARD_COLORS: Record<string, string> = {
  p: '#8A9199', // Pawn - Gray
  pawn: '#8A9199',
  n: '#3FB950', // Knight - Green
  knight: '#3FB950',
  b: '#3B82F6', // Bishop - Blue
  bishop: '#3B82F6',
  r: '#A855F7', // Rook - Purple
  rook: '#A855F7',
  q: '#EF4444', // Queen - Red
  queen: '#EF4444',
  k: '#D4AF37', // King - Gold
  king: '#D4AF37',
};

/**
 * Extracts card short code (e.g. "N1", "P2") and piece theme color for UI card tags.
 */
export function getCardTag(cardId?: string): { code: string; color: string; pieceType: string } | null {
  if (!cardId) return null;
  const card = getCardById(cardId);
  const code = card?.code || cardId.split('_')[0].toUpperCase();
  const anchor = card?.anchor || 'pawn';
  const color = PIECE_CARD_COLORS[anchor] || '#8A9199';
  return { code, color, pieceType: anchor };
}

/**
 * Formats standard or empowered move into clean SAN notation string (e.g. "e4", "Nf3", "exd5", "Bxf7").
 */
export function formatEmpoweredMoveSan(
  movingPieceType: string | undefined,
  from: string,
  to: string,
  isCapture: boolean
): string {
  const p = movingPieceType?.toLowerCase() || 'p';
  if (p === 'p') {
    return isCapture ? `${from[0]}x${to}` : to;
  }
  const symbol = p.toUpperCase();
  return isCapture ? `${symbol}x${to}` : `${symbol}${to}`;
}

/**
 * Groups a flat array of recorded turns into 2-column chess turn rows for desktop display.
 */
export function groupTurnsIntoRows(turns: RecordedTurn[]): TurnRow[] {
  const rowMap = new Map<number, TurnRow>();
  const rows: TurnRow[] = [];

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    let row = rowMap.get(turn.turnNumber);
    if (!row) {
      row = { turnNumber: turn.turnNumber };
      rowMap.set(turn.turnNumber, row);
      rows.push(row);
    }
    if (turn.player === 'w') {
      row.white = turn;
      row.whiteIndex = i;
    } else {
      row.black = turn;
      row.blackIndex = i;
    }
  }

  return rows;
}
