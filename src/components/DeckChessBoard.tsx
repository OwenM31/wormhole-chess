import React from 'react';
import { BoardModifier, PieceColor, Square, EmpoweredMove } from '../types/deckChess';
import { CANONICAL_36_CARDS, PIECE_COLOR_THEMES } from '../engine/cards/releaseRoster36';
import { getCardById } from '../engine/cardGraph';

export interface DeckChessBoardProps {
  fen: string;
  orientation?: PieceColor;
  selectedSquare?: string | null;
  legalMoves?: string[];
  empoweredMoves?: EmpoweredMove[];
  hoveredCardId?: string | null;
  selectedCardId?: string | null;
  disambiguationCandidates?: EmpoweredMove[] | null;
  pendingCardMove?: EmpoweredMove | null;
  onSquareClick: (square: string) => void;
  onConfirmCardMove?: () => void;
  onCancelCardMove?: () => void;
  validAnchorSquares?: string[];
  validTargetSquares?: string[];
  activeModifiers?: BoardModifier[];
  inCheck?: boolean;
  embedded?: boolean;
}

const CARD_MAP = new Map(CANONICAL_36_CARDS.map((c) => [c.id, c]));

// Crisp SVG piece renders with glowing dropshadows
function ChessPieceSvg({
  type,
  color,
}: {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
}) {
  const isWhite = color === 'w';
  const fill = isWhite ? '#FAF9F6' : '#191B1D';
  const stroke = isWhite ? '#191B1D' : '#8B7E74';
  const accent = '#D4AF37';

  switch (type) {
    case 'p':
      return (
        <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md" style={{ width: '80%', height: '80%', maxHeight: '100%' }}>
          <path
            d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'n':
      return (
        <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md" style={{ width: '80%', height: '80%', maxHeight: '100%' }}>
          <path
            d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,33.5 17,29 20,26 21,25 22,23 22,20 22,18 20,16 18,16 c -3,0 -4,2 -4,5 l -4,-1 c 0,-4 3,-7.5 8,-7.5 1.5,0 2.5,0.5 4,1.5 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="27" cy="18" r="1.5" fill={accent} />
        </svg>
      );

    case 'b':
      return (
        <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md" style={{ width: '80%', height: '80%', maxHeight: '100%' }}>
          <path
            d="m 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,1 -5.5,0 -14,-0.03 -27,0 -1.35,-0.01 -2.32,-0.03 -3,-1 1.35,-1.46 3,-2 3,-2 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="m 15,32 c 2.5,2.5 12.5,2.5 15,0 0.5,-1.5 0,-2 0,-2 0,-2.5 -2.5,-4 -2.5,-4 5.5,-1.5 6,-11.5 -5,-15.5 -11,4 -10.5,14 -5,15.5 0,0 -2.5,1.5 -2.5,4 0,0 -0.5,0.5 0,2 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <circle cx="22.5" cy="8.5" r="1.8" fill={accent} stroke={stroke} strokeWidth="1" />
        </svg>
      );

    case 'r':
      return (
        <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md" style={{ width: '80%', height: '80%', maxHeight: '100%' }}>
          <path
            d="m 9,39 27,0 c 0,-3 -2.5,-3.5 -2.5,-3.5 l -22,0 c 0,0 -2.5,0.5 -2.5,3.5 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="m 12,35.5 21,0 0,-15 -21,0 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="m 11,20.5 23,0 1.5,-6.5 -4.5,0 0,3 -3,0 0,-3 -4,0 0,3 -3,0 0,-3 -4.5,0 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
        </svg>
      );

    case 'q':
      return (
        <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md" style={{ width: '80%', height: '80%', maxHeight: '100%' }}>
          <path
            d="m 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,1 -5.5,0 -14,-0.03 -27,0 -1.35,-0.01 -2.32,-0.03 -3,-1 1.35,-1.46 3,-2 3,-2 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="m 12,33 c 2.5,2 18.5,2 21,0 -0.5,-3 -2,-4 -2,-4 -1.5,-1 -2.5,-1 -3.5,-3 -1,-2 -1,-5.5 -1,-5.5 2,-2 3.5,-5.5 3,-7.5 -2,0 -3.5,1.5 -4.5,3.5 -1,-2.5 -3,-4.5 -5,-4.5 -2,0 -4,2 -5,4.5 -1,-2 -2.5,-3.5 -4.5,-3.5 -0.5,2 1,5.5 3,7.5 0,0 0,3.5 -1,5.5 -1,2 -2,2 -3.5,3 0,0 -1.5,1 -2,4 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <circle cx="22.5" cy="11.5" r="2" fill={accent} />
        </svg>
      );

    case 'k':
      return (
        <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md" style={{ width: '80%', height: '80%', maxHeight: '100%' }}>
          <path
            d="m 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,1 -5.5,0 -14,-0.03 -27,0 -1.35,-0.01 -2.32,-0.03 -3,-1 1.35,-1.46 3,-2 3,-2 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="m 12.5,32 20,0 c 1,-4 -2,-8 -2,-8 -2.5,-2.5 -2.5,-4.5 -2.5,-7 2.5,-1 3.5,-4 3,-7 -2.5,0 -5,2 -5,2 -1,-1.5 -2,-2 -3.5,-2 -1.5,0 -2.5,0.5 -3.5,2 0,0 -2.5,-2 -5,-2 -0.5,3 0.5,6 3,7 0,2.5 0,4.5 -2.5,7 0,0 -3,4 -2,8 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path d="M 22.5,6 L 22.5,11 M 20,8.5 L 25,8.5" stroke={accent} strokeWidth="2" />
        </svg>
      );
  }
}

export const DeckChessBoard: React.FC<DeckChessBoardProps> = ({
  fen,
  orientation = 'w',
  selectedSquare,
  legalMoves = [],
  empoweredMoves = [],
  hoveredCardId,
  selectedCardId,
  disambiguationCandidates,
  pendingCardMove,
  onSquareClick,
  onConfirmCardMove,
  onCancelCardMove,
  validAnchorSquares = [],
  validTargetSquares = [],
  activeModifiers = [],
  inCheck = false,
  embedded = false,
}) => {
  // If pendingCardMove exists, render the resulting board state (previewFen)!
  const effectiveFen = pendingCardMove?.previewFen || fen;

  // Parse FEN board pieces
  const fenParts = effectiveFen.split(' ');
  const fenRows = fenParts[0].split('/');

  // 8x8 matrix from rank 8 (row 0) to rank 1 (row 7)
  const pieceGrid: ({ type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k'; color: 'w' | 'b' } | null)[][] = [];

  for (let r = 0; r < 8; r++) {
    const rowString = fenRows[r] || '8';
    const rowPieces: ({ type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k'; color: 'w' | 'b' } | null)[] = [];
    for (const char of rowString) {
      if (char >= '1' && char <= '8') {
        const emptyCount = parseInt(char, 10);
        for (let i = 0; i < emptyCount; i++) {
          rowPieces.push(null);
        }
      } else {
        const isUpper = char === char.toUpperCase();
        rowPieces.push({
          type: char.toLowerCase() as any,
          color: isUpper ? 'w' : 'b',
        });
      }
    }
    pieceGrid.push(rowPieces);
  }

  // Files: a-h, Ranks: 1-8
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = orientation === 'w' ? files : [...files].reverse();
  const displayRanks = orientation === 'w' ? ranks : [...ranks].reverse();

  // Card details for active preview
  const activeCardDef = pendingCardMove
    ? CARD_MAP.get(pendingCardMove.cardId) || getCardById(pendingCardMove.cardId)
    : null;

  // Hovered / Selected Card theme highlight
  const highlightedCardId = hoveredCardId || selectedCardId;
  const highlightedCardDef = highlightedCardId
    ? CARD_MAP.get(highlightedCardId) || getCardById(highlightedCardId)
    : null;
  const cardThemeHex = highlightedCardDef
    ? (highlightedCardDef.visualTheme?.hex || PIECE_COLOR_THEMES[highlightedCardDef.anchor]?.hex || '#D4AF37')
    : '#D4AF37';

  // Disambiguation candidates extraSquares
  const disambiguationSquares = disambiguationCandidates
    ? disambiguationCandidates.map((c) => c.extraSquare).filter((s): s is string => Boolean(s))
    : [];

  return (
    <div
      className={
        embedded
          ? 'relative flex flex-col select-none w-full h-full'
          : 'relative flex flex-col select-none p-2 sm:p-2.5 bg-[#191B1D] rounded-md border border-[rgba(139,126,116,0.25)] shadow-2xl backdrop-blur-md w-full max-w-[512px] gap-2'
      }
    >
      {/* Disambiguation Instruction Banner */}
      {disambiguationCandidates && disambiguationCandidates.length > 0 && (
        <div
          data-testid="disambiguation-banner"
          className={
            embedded
              ? 'absolute top-2 inset-x-2 z-30 py-1.5 px-3 bg-[#24272A]/95 border border-[#D4AF37] rounded flex items-center justify-between text-xs text-[#FAF9F6] shadow-xl backdrop-blur-sm animate-pulse'
              : 'w-full py-1.5 px-3 bg-[#24272A] border border-[#D4AF37] rounded flex items-center justify-between text-xs text-[#FAF9F6] animate-pulse'
          }
        >
          <span className="font-bold text-[#D4AF37]">
            🎯 {disambiguationCandidates[0]?.disambiguationPrompt || 'Select which participating square to target'}
          </span>
          <button
            type="button"
            onClick={onCancelCardMove}
            className="text-[10px] text-[#8B7E74] hover:text-[#FAF9F6] underline cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 8x8 Chess Grid */}
      <div
        data-testid="chessboard-grid"
        className={
          embedded
            ? 'grid grid-cols-8 grid-rows-8 w-full h-full aspect-square rounded-sm overflow-hidden border border-[rgba(44,32,22,0.8)] shadow-inner relative'
            : 'grid grid-cols-8 grid-rows-8 w-full aspect-square rounded overflow-hidden border border-[rgba(139,126,116,0.2)] shadow-inner relative'
        }
      >
        {displayRanks.map((rankStr, rankDisplayIndex) => {
          return displayFiles.map((fileStr, fileDisplayIndex) => {
            const squareName = `${fileStr}${rankStr}` as Square;
            const rankActual = parseInt(rankStr, 10); // 1 to 8
            const rankIndex = 8 - rankActual; // 0 for rank 8, 7 for rank 1
            const fileIndex = fileStr.charCodeAt(0) - 'a'.charCodeAt(0);

            const piece = pieceGrid[rankIndex]?.[fileIndex] || null;

            // Checkerboard coloring (Smokey Taupe #8B7E74 vs Loden Green Dark #3C493F)
            const isLight = (fileIndex + rankActual) % 2 !== 0;
            const squareBg = embedded
              ? (isLight ? 'rgba(139, 126, 116, 0.88)' : 'rgba(60, 73, 63, 0.92)')
              : (isLight ? '#8B7E74' : '#3C493F');

            // Active highlights
            const isSelected = selectedSquare === squareName;
            const isLegalMove = legalMoves.includes(squareName);
            const empoweredMove = empoweredMoves.find((m) => m.to === squareName);
            const isValidAnchor = validAnchorSquares.includes(squareName);
            const isValidTarget = validTargetSquares.includes(squareName);
            const isDisambiguationSquare = disambiguationSquares.includes(squareName);

            // Preview Highlights (when pendingCardMove is active)
            const isPreviewFrom = pendingCardMove && pendingCardMove.from === squareName;
            const isPreviewTo = pendingCardMove && pendingCardMove.to === squareName;
            const isPreviewExtra = pendingCardMove && pendingCardMove.extraSquare === squareName;

            // Modifiers on this square
            const barrier = activeModifiers.find((m) => m.type === 'barrier' && m.square === squareName);
            const shield = activeModifiers.find((m) => m.type === 'shield' && m.square === squareName);

            // Check highlight on king
            const isKingInCheck =
              inCheck &&
              piece &&
              piece.type === 'k' &&
              piece.color === (fenParts[1] || 'w');

            return (
              <div
                key={squareName}
                data-square={squareName}
                onClick={() => onSquareClick(squareName)}
                className="relative flex items-center justify-center transition-[filter,background-color] duration-150 cursor-pointer hover:brightness-110 aspect-square group"
                style={{ backgroundColor: squareBg, aspectRatio: '1 / 1' }}
              >
                {/* Coordinate labels */}
                {fileDisplayIndex === 0 && (
                  <span className="absolute top-0.5 left-1 text-[10px] font-mono text-[#FAF9F6] select-none pointer-events-none opacity-60">
                    {rankStr}
                  </span>
                )}
                {rankDisplayIndex === 7 && (
                  <span className="absolute bottom-0.5 right-1 text-[10px] font-mono text-[#FAF9F6] select-none pointer-events-none opacity-60">
                    {fileStr}
                  </span>
                )}

                {/* Selected Piece Highlight */}
                {isSelected && (
                  <div className="absolute inset-0 bg-[#D4AF37]/30 border-2 border-[#D4AF37] rounded-sm pointer-events-none z-10" />
                )}

                {/* King Check Glow */}
                {isKingInCheck && (
                  <div className="absolute inset-0 bg-[#AA4A44]/40 border-2 border-[#AA4A44] animate-pulse pointer-events-none z-10" />
                )}

                {/* Live Outcome Preview Origin (From) Highlight */}
                {isPreviewFrom && (
                  <div className="absolute inset-0 border-2 border-dashed border-[#8B7E74] bg-[#141618]/40 rounded-sm pointer-events-none z-15" />
                )}

                {/* Live Outcome Preview Destination (To) Highlight */}
                {isPreviewTo && (
                  <div className="absolute inset-0 border-2 border-[#3FB950] bg-[#3FB950]/30 shadow-[0_0_12px_#3FB950] animate-pulse rounded-sm pointer-events-none z-15" />
                )}

                {/* Live Outcome Preview Extra Square Highlight */}
                {isPreviewExtra && (
                  <div className="absolute inset-0 border-2 border-[#D4AF37] bg-[#D4AF37]/30 shadow-[0_0_10px_#D4AF37] animate-pulse rounded-sm pointer-events-none z-15" />
                )}

                {/* Disambiguation Candidate Pulse Ring (Step-Aside Tile) */}
                {isDisambiguationSquare && (
                  <div
                    data-testid={`disambiguation-${squareName}`}
                    className="absolute inset-0 border-2 border-[#3FB950] bg-[#3FB950]/30 shadow-[0_0_12px_#3FB950] animate-pulse rounded-sm pointer-events-none z-20 flex items-center justify-center"
                  >
                    <span className="text-[10px] font-mono font-bold text-[#3FB950] bg-[#191B1D]/90 px-1 rounded border border-[#3FB950]/50">
                      STEP ASIDE
                    </span>
                  </div>
                )}

                {/* Card Anchor Highlight (Warm Gold / Card Theme) */}
                {isValidAnchor && !pendingCardMove && (
                  <div
                    style={{ borderColor: cardThemeHex, backgroundColor: `${cardThemeHex}30` }}
                    className="absolute inset-0 border-2 animate-pulse rounded-sm pointer-events-none z-10"
                  />
                )}

                {/* Card Target Destination Highlight */}
                {isValidTarget && !pendingCardMove && (
                  <div className="absolute inset-0 border-2 border-[#A855F7] bg-[#A855F7]/35 animate-pulse rounded-sm pointer-events-none z-10" />
                )}

                {/* Standard Legal Move Indicator (Instant execution when no card is armed) */}
                {isLegalMove && !selectedCardId && !hoveredCardId && !pendingCardMove && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    {piece ? (
                      // Capture ring
                      <div className="w-4/5 h-4/5 rounded-full border-2 border-[#AA4A44] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#AA4A44]" />
                      </div>
                    ) : (
                      // Empty move subtle dot
                      <div className="w-3.5 h-3.5 rounded-full bg-[#FAF9F6]/60 shadow-sm flex items-center justify-center" />
                    )}
                  </div>
                )}

                {/* Empowered Card Move Indicator (Glowing Ring - only when card is armed or hovered) */}
                {empoweredMove && (selectedCardId || hoveredCardId) && !pendingCardMove && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-25">
                    <div
                      style={{ borderColor: cardThemeHex, backgroundColor: `${cardThemeHex}25` }}
                      className="w-4/5 h-4/5 rounded-full border-2 shadow-[0_0_12px_rgba(212,175,55,0.7)] animate-pulse flex items-center justify-center"
                    >
                      <span
                        style={{ color: cardThemeHex, borderColor: `${cardThemeHex}60` }}
                        className="text-[9px] font-mono font-bold px-1 py-0.2 bg-[#191B1D]/90 rounded border shadow-sm"
                      >
                        {empoweredMove.metadata?.cardName ? empoweredMove.metadata.cardName.split(' ')[0] : 'CARD'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Piece Visual */}
                {piece && (
                  <div className="relative z-10 flex items-center justify-center w-full h-full pointer-events-none">
                    <ChessPieceSvg type={piece.type} color={piece.color} />
                  </div>
                )}

                {/* Holographic Barrier Modifier */}
                {barrier && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#3C493F]/80 border border-[#D4AF37] backdrop-blur-[2px] animate-pulse">
                    <span className="text-xl sm:text-2xl drop-shadow-[0_0_8px_#D4AF37]">🛡️</span>
                    <span className="text-[9px] font-mono font-bold text-[#FAF9F6]">
                      {barrier.turnsRemaining}T
                    </span>
                  </div>
                )}

                {/* Kinetic Shield Modifier */}
                {shield && (
                  <div className="absolute inset-0 z-20 border-2 border-[#D4AF37] rounded-full shadow-[0_0_12px_#D4AF37] pointer-events-none animate-spin" />
                )}
              </div>
            );
          });
        })}
      </div>

      {/* Mandatory Board Outcome Confirmation Bar (✓ / ✕) */}
      {pendingCardMove && (
        <div
          data-testid="card-confirm-bar"
          className={
            embedded
              ? 'absolute bottom-2 inset-x-2 z-30 p-2.5 bg-[#1C1E20]/95 border-2 border-[#D4AF37] rounded-md flex items-center justify-between gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.7)] backdrop-blur-sm animate-fade-in'
              : 'relative z-30 w-full p-2.5 bg-[#24272A] border-2 border-[#D4AF37] rounded flex items-center justify-between gap-3 shadow-2xl animate-fade-in'
          }
        >
          {/* Left: Card Badge & Summary */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-[#D4AF37] flex-shrink-0">
              ⚡
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[#FAF9F6] truncate">
                {activeCardDef?.code ? `${activeCardDef.code} · ` : ''}
                {activeCardDef?.name || pendingCardMove.cardId}
              </span>
              <span className="text-[10px] text-[#8B7E74] truncate">
                Confirm outcome ({pendingCardMove.from} ➔ {pendingCardMove.to})?
              </span>
            </div>
          </div>

          {/* Right: Big Green Check ✓ and Big Red X ✕ Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Big Green Check Button (✓ Confirm) */}
            <button
              type="button"
              onClick={onConfirmCardMove}
              data-testid="confirm-card-move-btn"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3FB950] hover:bg-[#2EA043] text-[#FAF9F6] border border-[#2EA043] rounded text-xs font-bold transition-all shadow-[0_0_10px_rgba(63,185,80,0.5)] cursor-pointer"
            >
              <span>✓</span> Confirm
            </button>

            {/* Big Red X Button (✕ Cancel) */}
            <button
              type="button"
              onClick={onCancelCardMove}
              data-testid="cancel-card-move-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#AA4A44] hover:bg-[#883934] text-[#FAF9F6] border border-[#AA4A44]/60 rounded text-xs font-bold transition-all cursor-pointer"
            >
              <span>✕</span> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckChessBoard;
