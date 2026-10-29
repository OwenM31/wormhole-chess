import React, { useEffect, useRef } from 'react';
import { RecordedTurn, PIECE_CARD_COLORS } from '../utils/moveNotation';
import { CardTagBadge } from './CardTagBadge';

export interface MoveStreamMobileProps {
  recordedTurns: RecordedTurn[];
  activeMoveIndex: number; // -1 = start, 0..N-1
  isViewingHistory: boolean;
  onSelectMove: (index: number | null) => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  className?: string;
}

export const MoveStreamMobile: React.FC<MoveStreamMobileProps> = ({
  recordedTurns,
  activeMoveIndex,
  isViewingHistory,
  onSelectMove,
  onStepBackward,
  onStepForward,
  className = '',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  // Auto-scroll active pill into horizontal center on move change without affecting window scroll
  useEffect(() => {
    if (activeItemRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const item = activeItemRef.current;
      const itemOffset = item.offsetLeft - container.offsetLeft;
      const scrollPos = itemOffset - container.clientWidth / 2 + item.clientWidth / 2;
      container.scrollTo({
        left: Math.max(0, scrollPos),
        behavior: 'smooth',
      });
    }
  }, [activeMoveIndex]);

  return (
    <div
      data-testid="move-stream-mobile"
      className={`flex items-center w-full bg-[#161B22]/95 border border-[#30363D] rounded-lg px-1.5 py-1 text-xs select-none relative shadow-md ${className}`}
    >
      {/* Left Step Button (‹) */}
      <button
        type="button"
        data-testid="stream-prev-btn"
        aria-label="Previous move"
        disabled={activeMoveIndex <= -1}
        onClick={onStepBackward}
        className="w-7 h-7 flex items-center justify-center rounded text-base font-bold text-[#8A9199] hover:text-[#FAF9F6] hover:bg-[#21262D] disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-[#8A9199] transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed"
      >
        ‹
      </button>

      {/* Horizontally scrolling tape with edge fade gradient */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-center overflow-x-auto no-scrollbar scroll-smooth px-2 py-0.5 space-x-1.5"
        style={{
          maskImage:
            'linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)',
        }}
      >
        {/* Starting position node */}
        <button
          type="button"
          ref={activeMoveIndex === -1 ? activeItemRef : null}
          onClick={() => onSelectMove(-1)}
          className={`px-2 py-1 rounded text-[11px] whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
            activeMoveIndex === -1
              ? 'bg-[#3FB950]/20 border border-[#3FB950] text-[#FAF9F6] font-bold shadow-[0_0_8px_rgba(63,185,80,0.3)]'
              : 'text-[#8A9199] hover:text-[#C9D1D9] hover:bg-[#21262D]'
          }`}
        >
          Start
        </button>

        {recordedTurns.map((turn, idx) => {
          const isActive = activeMoveIndex === idx;
          const isWhite = turn.player === 'w';
          const prefix = isWhite ? `${turn.turnNumber}. ` : '';
          const cardColor = turn.cardPieceType
            ? PIECE_CARD_COLORS[turn.cardPieceType] || '#8A9199'
            : '#8A9199';

          return (
            <button
              key={`stream_move_${idx}_${turn.timestamp}`}
              type="button"
              ref={isActive ? activeItemRef : null}
              onClick={() => onSelectMove(idx === recordedTurns.length - 1 ? null : idx)}
              className={`px-2 py-1 rounded text-[11px] whitespace-nowrap flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#3FB950]/20 border border-[#3FB950] text-[#FAF9F6] font-bold shadow-[0_0_8px_rgba(63,185,80,0.3)]'
                  : 'text-[#C9D1D9] hover:text-[#FAF9F6] hover:bg-[#21262D]'
              }`}
            >
              <span>
                {prefix}
                {turn.san || `${turn.chessMove.from}-${turn.chessMove.to}`}
              </span>
              {turn.cardCode && (
                <CardTagBadge cardCode={turn.cardCode} className="ml-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right Step Button (›) */}
      <button
        type="button"
        data-testid="stream-next-btn"
        aria-label="Next move"
        disabled={!isViewingHistory}
        onClick={onStepForward}
        className="w-7 h-7 flex items-center justify-center rounded text-base font-bold text-[#8A9199] hover:text-[#FAF9F6] hover:bg-[#21262D] disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-[#8A9199] transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed"
      >
        ›
      </button>
    </div>
  );
};
