import React, { useEffect, useRef } from 'react';
import {
  RecordedTurn,
  TurnRow,
  PIECE_CARD_COLORS,
  groupTurnsIntoRows,
} from '../utils/moveNotation';

export interface MoveTableDesktopProps {
  recordedTurns: RecordedTurn[];
  activeMoveIndex: number;
  isViewingHistory: boolean;
  onSelectMove: (index: number | null) => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onJumpToLive: () => void;
  className?: string;
}

export const MoveTableDesktop: React.FC<MoveTableDesktopProps> = ({
  recordedTurns,
  activeMoveIndex,
  isViewingHistory,
  onSelectMove,
  onStepBackward,
  onStepForward,
  onJumpToLive,
  className = '',
}) => {
  const tableBodyRef = useRef<HTMLDivElement | null>(null);
  const activeCellRef = useRef<HTMLButtonElement | null>(null);

  // Group recorded turns into 2-column turns
  const rows: TurnRow[] = groupTurnsIntoRows(recordedTurns);

  // Auto-scroll active cell into view without window scrolling
  useEffect(() => {
    if (activeCellRef.current && tableBodyRef.current) {
      const container = tableBodyRef.current;
      const item = activeCellRef.current;
      const itemOffset = item.offsetTop - container.offsetTop;
      const scrollPos = itemOffset - container.clientHeight / 2 + item.clientHeight / 2;
      container.scrollTo({
        top: Math.max(0, scrollPos),
        behavior: 'smooth',
      });
    }
  }, [activeMoveIndex]);

  // Keyboard navigation for desktop: Left / Right arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable);
      if (isInput) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onStepBackward();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onStepForward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStepBackward, onStepForward]);

  return (
    <div
      data-testid="move-table-desktop"
      className={`flex flex-col h-full bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden select-none ${className}`}
    >
      {/* Table Header */}
      <div className="grid grid-cols-[54px_1fr_1fr] bg-[#21262D] px-3 py-2 text-[11px] font-semibold text-[#8A9199] border-b border-[#30363D] tracking-wider uppercase">
        <div>Turn</div>
        <div>White</div>
        <div>Black</div>
      </div>

      {/* Table Body (Scrollable) */}
      <div
        ref={tableBodyRef}
        className="flex-1 overflow-y-auto px-1 py-1 space-y-0.5 min-h-[140px]"
      >
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 text-[#8A9199] text-xs">
            <span>No moves played yet</span>
            <span className="text-[10px] text-[#8A9199]/70 mt-1">Make a standard or card move</span>
          </div>
        ) : (
          rows.map((row) => {
            const isWhiteActive =
              row.whiteIndex !== undefined && activeMoveIndex === row.whiteIndex;
            const isBlackActive =
              row.blackIndex !== undefined && activeMoveIndex === row.blackIndex;

            const whiteColor = row.white?.cardPieceType
              ? PIECE_CARD_COLORS[row.white.cardPieceType] || '#8A9199'
              : '#8A9199';
            const blackColor = row.black?.cardPieceType
              ? PIECE_CARD_COLORS[row.black.cardPieceType] || '#8A9199'
              : '#8A9199';

            return (
              <div
                key={`turn_row_${row.turnNumber}`}
                className="grid grid-cols-[54px_1fr_1fr] items-center text-xs px-2 py-0.5 rounded hover:bg-[#21262D]/40 transition-colors"
              >
                {/* Turn Number */}
                <div className="text-[#8A9199] font-mono text-[11px]">
                  {row.turnNumber}.
                </div>

                {/* White Move Cell */}
                <div className="pr-1">
                  {row.white ? (
                    <button
                      type="button"
                      ref={isWhiteActive ? activeCellRef : null}
                      onClick={() =>
                        onSelectMove(
                          row.whiteIndex === recordedTurns.length - 1
                            ? null
                            : row.whiteIndex!
                        )
                      }
                      className={`w-full text-left px-2 py-1 rounded flex items-center justify-between text-xs transition-all cursor-pointer ${
                        isWhiteActive
                          ? 'bg-[#3FB950]/20 border border-[#3FB950] text-[#FAF9F6] font-bold shadow-[0_0_8px_rgba(63,185,80,0.25)]'
                          : 'text-[#C9D1D9] hover:text-[#FAF9F6] hover:bg-[#21262D]'
                      }`}
                    >
                      <span className="truncate">
                        {row.white.san ||
                          `${row.white.chessMove.from}-${row.white.chessMove.to}`}
                      </span>
                      {row.white.cardCode && (
                        <span
                          style={{ color: whiteColor }}
                          className="text-[10px] font-mono font-semibold tracking-tight ml-1"
                        >
                          [{row.white.cardCode}]
                        </span>
                      )}
                    </button>
                  ) : (
                    <span className="text-[#8A9199]/40 px-2">—</span>
                  )}
                </div>

                {/* Black Move Cell */}
                <div className="pl-1">
                  {row.black ? (
                    <button
                      type="button"
                      ref={isBlackActive ? activeCellRef : null}
                      onClick={() =>
                        onSelectMove(
                          row.blackIndex === recordedTurns.length - 1
                            ? null
                            : row.blackIndex!
                        )
                      }
                      className={`w-full text-left px-2 py-1 rounded flex items-center justify-between text-xs transition-all cursor-pointer ${
                        isBlackActive
                          ? 'bg-[#3FB950]/20 border border-[#3FB950] text-[#FAF9F6] font-bold shadow-[0_0_8px_rgba(63,185,80,0.25)]'
                          : 'text-[#C9D1D9] hover:text-[#FAF9F6] hover:bg-[#21262D]'
                      }`}
                    >
                      <span className="truncate">
                        {row.black.san ||
                          `${row.black.chessMove.from}-${row.black.chessMove.to}`}
                      </span>
                      {row.black.cardCode && (
                        <span
                          style={{ color: blackColor }}
                          className="text-[10px] font-mono font-semibold tracking-tight ml-1"
                        >
                          [{row.black.cardCode}]
                        </span>
                      )}
                    </button>
                  ) : (
                    <span className="text-[#8A9199]/40 px-2">—</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Transport Controls Bar */}
      <div className="flex items-center justify-between bg-[#21262D] px-3 py-2 border-t border-[#30363D]">
        <button
          type="button"
          data-testid="table-prev-btn"
          aria-label="Step backward"
          disabled={activeMoveIndex <= -1}
          onClick={onStepBackward}
          className="px-3 py-1 bg-[#161B22] border border-[#30363D] hover:border-[#8A9199] rounded text-sm font-bold text-[#FAF9F6] disabled:opacity-30 disabled:border-[#30363D] disabled:text-[#8A9199] transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          ‹
        </button>

        {/* Live Indicator / Jump-to-Live button */}
        <button
          type="button"
          data-testid="table-live-btn"
          onClick={onJumpToLive}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
            !isViewingHistory
              ? 'bg-[#3FB950]/15 text-[#3FB950] border border-[#3FB950]/40'
              : 'bg-[#161B22] border border-[#30363D] text-[#8A9199] hover:text-[#FAF9F6] hover:border-[#3FB950]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              !isViewingHistory ? 'bg-[#3FB950] animate-pulse' : 'bg-[#8A9199]'
            }`}
          />
          <span>LIVE</span>
        </button>

        <button
          type="button"
          data-testid="table-next-btn"
          aria-label="Step forward"
          disabled={!isViewingHistory}
          onClick={onStepForward}
          className="px-3 py-1 bg-[#161B22] border border-[#30363D] hover:border-[#8A9199] rounded text-sm font-bold text-[#FAF9F6] disabled:opacity-30 disabled:border-[#30363D] disabled:text-[#8A9199] transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>
    </div>
  );
};
