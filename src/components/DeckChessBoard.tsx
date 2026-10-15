import React from 'react';
import { BoardModifier, PieceColor, Square } from '../types/deckChess';

export interface DeckChessBoardProps {
  fen: string;
  orientation?: PieceColor;
  selectedSquare?: string | null;
  legalMoves?: string[];
  validAnchorSquares?: string[];
  validTargetSquares?: string[];
  activeModifiers?: BoardModifier[];
  inCheck?: boolean;
  onSquareClick: (square: string) => void;
}

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
  const accent = isWhite ? '#D4AF37' : '#D4AF37';

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
  validAnchorSquares = [],
  validTargetSquares = [],
  activeModifiers = [],
  inCheck = false,
  onSquareClick,
}) => {
  // Parse FEN board pieces
  const fenParts = fen.split(' ');
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

  return (
    <div className="relative inline-block select-none p-2 sm:p-2.5 bg-[#191B1D] rounded-md border border-[rgba(139,126,116,0.25)] shadow-2xl backdrop-blur-md w-full max-w-[470px]">
      {/* 8x8 Grid */}
      <div className="grid grid-cols-8 grid-rows-8 w-full aspect-square rounded overflow-hidden border border-[rgba(139,126,116,0.2)] shadow-inner">
        {displayRanks.map((rankStr, rankDisplayIndex) => {
          return displayFiles.map((fileStr, fileDisplayIndex) => {
            const squareName = `${fileStr}${rankStr}` as Square;
            const rankActual = parseInt(rankStr, 10); // 1 to 8
            const rankIndex = 8 - rankActual; // 0 for rank 8, 7 for rank 1
            const fileIndex = fileStr.charCodeAt(0) - 'a'.charCodeAt(0);

            const piece = pieceGrid[rankIndex]?.[fileIndex] || null;

            // Checkerboard coloring (Smokey Taupe #8B7E74 vs Loden Green Dark #3C493F)
            const isLight = (fileIndex + rankActual) % 2 !== 0;
            const squareBg = isLight ? '#8B7E74' : '#3C493F';

            // Active highlights
            const isSelected = selectedSquare === squareName;
            const isLegalMove = legalMoves.includes(squareName);
            const isValidAnchor = validAnchorSquares.includes(squareName);
            const isValidTarget = validTargetSquares.includes(squareName);

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
                className="relative flex items-center justify-center transition-[filter,background-color] duration-150 cursor-pointer hover:brightness-110 aspect-square"
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

                {/* Card Anchor Highlight (Warm Gold) */}
                {isValidAnchor && (
                  <div className="absolute inset-0 border-2 border-[#D4AF37] bg-[#D4AF37]/30 animate-pulse rounded-sm pointer-events-none z-10" />
                )}

                {/* Card Target Destination Highlight (Tactical Purple) */}
                {isValidTarget && (
                  <div className="absolute inset-0 border-2 border-[#A855F7] bg-[#A855F7]/35 animate-pulse rounded-sm pointer-events-none z-10" />
                )}

                {/* Legal Move Indicator */}
                {isLegalMove && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    {piece ? (
                      // Capture ring
                      <div className="w-4/5 h-4/5 rounded-full border-4 border-[#AA4A44]/85 animate-pulse" />
                    ) : (
                      // Empty move dot
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#D4AF37]/90 shadow-[0_0_8px_#D4AF37]" />
                    )}
                  </div>
                )}

                {/* Piece Visual */}
                {piece && (
                  <div className="relative z-10 flex items-center justify-center w-full h-full">
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
    </div>
  );
};
