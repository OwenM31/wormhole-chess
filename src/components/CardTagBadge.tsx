import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CANONICAL_36_CARDS } from '../engine/cards/releaseRoster36';
import { PIECE_CARD_COLORS } from '../utils/moveNotation';
import { CardArt } from './CardArt';
import { CardDefinition } from '../types/deckChess';

export interface CardTagBadgeProps {
  cardCode: string;
  className?: string;
  title?: string;
}

export const CardTagBadge: React.FC<CardTagBadgeProps> = ({
  cardCode,
  className = '',
  title,
}) => {
  const badgeRef = useRef<HTMLSpanElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Lookup canonical card definition
  const card: CardDefinition | undefined = useMemo(() => {
    const clean = cardCode.trim().toUpperCase();
    return CANONICAL_36_CARDS.find(
      (c) => (c.code && c.code.toUpperCase() === clean) || c.id.toUpperCase() === clean
    );
  }, [cardCode]);

  // Determine piece theme color
  const themeColor = useMemo(() => {
    if (!card) return '#8A9199';
    return PIECE_CARD_COLORS[card.anchor] || card.visualTheme?.hex || '#8A9199';
  }, [card]);

  // Compute fixed positioning relative to viewport
  const updatePosition = useCallback(() => {
    if (!badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    const cardWidth = 270;
    const cardHeight = 250;

    // Horizontal centering with viewport clamping
    let left = rect.left + rect.width / 2 - cardWidth / 2;
    left = Math.max(12, Math.min(window.innerWidth - cardWidth - 12, left));

    // Vertical placement: prefer above badge, flip below if close to top
    let top = rect.top - cardHeight - 8;
    if (top < 12) {
      top = rect.bottom + 8;
    }
    setCoords({ top, left });
  }, []);

  const handleMouseEnter = () => {
    updatePosition();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleTogglePopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleClosePopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  // Close popover when tapping outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Card Content Card Template
  const renderCardContent = (isPopover: boolean) => {
    if (!card) return null;

    return (
      <div
        className="w-[270px] bg-[#161B22]/98 border rounded-xl shadow-2xl p-3 select-none flex flex-col gap-2 backdrop-blur-md"
        style={{
          borderColor: themeColor,
          boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 16px ${themeColor}33`,
        }}
      >
        {/* Header row: Anchor glyph + Card Code + Close Button */}
        <div className="flex items-center justify-between border-b border-[#30363D] pb-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                color: themeColor,
                backgroundColor: `${themeColor}20`,
              }}
            >
              {card.anchor}
            </span>
            <span className="text-[11px] font-mono font-bold text-[#FAF9F6]">
              [{card.code}]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#8A9199]">W{card.world}</span>
            {isPopover && (
              <button
                type="button"
                data-testid="close-popover-btn"
                aria-label="Close"
                onClick={handleClosePopover}
                className="w-5 h-5 flex items-center justify-center rounded text-[#8A9199] hover:text-[#FAF9F6] hover:bg-[#30363D] transition-colors cursor-pointer text-xs leading-none"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Card Name */}
        <div className="text-xs font-bold text-[#FAF9F6] truncate">
          {card.name}
        </div>

        {/* Vector Art illustration */}
        <div className="w-full h-20 bg-[#0D1117] rounded-lg border border-[#30363D]/60 p-1 flex items-center justify-center overflow-hidden">
          <CardArt
            anchor={card.anchor}
            artId={card.artId}
            cardName={card.name}
            className="h-full"
          />
        </div>

        {/* Rules text: Condition & Effect */}
        <div className="flex flex-col gap-1.5 text-[10.5px]">
          <div className="bg-[#21262D]/70 rounded p-1.5 border border-[#30363D]/40">
            <span className="font-bold text-[#8A9199] uppercase tracking-wider block text-[9px] mb-0.5">
              Condition
            </span>
            <span className="text-[#C9D1D9] leading-snug">
              {card.conditionText || card.description}
            </span>
          </div>

          <div className="bg-[#21262D]/70 rounded p-1.5 border border-[#30363D]/40">
            <span
              className="font-bold uppercase tracking-wider block text-[9px] mb-0.5"
              style={{ color: themeColor }}
            >
              Effect
            </span>
            <span className="text-[#FAF9F6] leading-snug">
              {card.effectText || card.description}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  return (
    <>
      <button
        ref={badgeRef as any}
        type="button"
        data-testid={`card-tag-badge-${cardCode}`}
        title={title || (card ? `${card.name} (${card.code})` : cardCode)}
        onClick={handleTogglePopover}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        style={{ color: themeColor }}
        className={`inline-flex items-center text-[10px] font-mono font-semibold tracking-tight cursor-pointer hover:underline focus:outline-none transition-transform hover:scale-105 ${className}`}
      >
        [{cardCode}]
      </button>

      {/* Desktop Hover Tooltip (rendered in portal, pointer-events-none) */}
      {portalTarget &&
        isHovered &&
        !isOpen &&
        card &&
        createPortal(
          <div
            data-testid="card-tag-tooltip"
            style={{
              top: coords.top,
              left: coords.left,
            }}
            className="fixed z-[200] pointer-events-none transition-opacity duration-150 animate-in fade-in"
          >
            {renderCardContent(false)}
          </div>,
          portalTarget
        )}

      {/* Mobile / Tap Popover (rendered in portal with backdrop) */}
      {portalTarget &&
        isOpen &&
        card &&
        createPortal(
          <div
            className="fixed inset-0 z-[190] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4"
            onClick={handleClosePopover}
          >
            <div
              data-testid="card-tag-popover"
              onClick={(e) => e.stopPropagation()}
              className="relative z-[200] animate-in zoom-in-95 duration-150"
            >
              {renderCardContent(true)}
            </div>
          </div>,
          portalTarget
        )}
    </>
  );
};
