import React from 'react';
import { CardDefinition, PieceAnchor } from '../types/deckChess';
import { PIECE_COLOR_THEMES } from '../engine/cards/releaseRoster36';
import { CardArt } from './CardArt';

export interface PlayingCardProps {
  card: CardDefinition;
  size?: 'library' | 'equipped' | 'hand';
  /** External top-right copy blips (for library view) */
  showExternalBlips?: boolean;
  maxCopies?: number;
  equippedCopies?: number;
  /** Hand / interactive states */
  isAvailable?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  isActiveForPiece?: boolean;
  isDimmed?: boolean;
  fanRotationClass?: string;
  overlapClass?: string;
  onClick?: () => void;
  onRemove?: (e: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  dataTestId?: string;
}

const PIECE_FRAME_GRADIENTS: Record<PieceAnchor, string> = {
  pawn: 'linear-gradient(135deg, #9CA3AF 0%, #5B626A 100%)',
  knight: 'linear-gradient(135deg, #4ADE80 0%, #1F7A34 100%)',
  bishop: 'linear-gradient(135deg, #60A5FA 0%, #1D4ED8 100%)',
  rook: 'linear-gradient(135deg, #C084FC 0%, #6B21A8 100%)',
  queen: 'linear-gradient(135deg, #F87171 0%, #B91C1C 100%)',
  king: 'linear-gradient(135deg, #F5D061 0%, #A67C14 100%)',
};

/**
 * Concise condition helper so the mid-card "IF:" strip stays scannable on a playing card
 * without ellipses.
 */
function getConciseCondition(card: CardDefinition, isCompact = false): string {
  if (isCompact && card.description && card.description.includes(': ')) {
    return card.description.split(': ')[0];
  }
  const raw = (card.conditionText || card.condition_type || 'Tactical move').replace(/\.$/, '');
  return raw
    .replace(/^This (Pawn|Knight|Bishop|Rook|Queen|King) is /i, '')
    .replace(/^Friendly /i, 'Ally ')
    .replace(/ onto an empty square/i, '');
}

/**
 * Concise effect helper for compact hand cards (zero ellipses).
 */
function getConciseEffect(card: CardDefinition, isCompact = false): string {
  if (isCompact && card.description && card.description.includes(': ')) {
    return card.description.split(': ').slice(1).join(': ');
  }
  const raw = card.effectText || card.description || '';
  return raw
    .replace(/\(left or right\) /i, '')
    .replace(/\(3x1 jump, move or capture\)/i, '(move or capture)')
    .replace(/\(2,1\) L-jump/i, 'L-jump');
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  size = 'library',
  showExternalBlips = false,
  maxCopies = 1,
  equippedCopies = 0,
  isAvailable = true,
  isSelected = false,
  isHovered = false,
  isActiveForPiece = false,
  isDimmed = false,
  fanRotationClass = '',
  overlapClass = '',
  onClick,
  onRemove,
  onMouseEnter,
  onMouseLeave,
  dataTestId,
}) => {
  const theme =
    card.visualTheme ||
    PIECE_COLOR_THEMES[card.anchor] ||
    PIECE_COLOR_THEMES.pawn;
  const frameGradient =
    PIECE_FRAME_GRADIENTS[card.anchor] || PIECE_FRAME_GRADIENTS.pawn;

  // ==========================================================================
  // 1. EQUIPPED MINIATURE 5:7 PLAYING CARD (For 8-Slot Equipped Hand Rack)
  // ==========================================================================
  if (size === 'equipped') {
    return (
      <div
        data-testid={dataTestId}
        onClick={onClick}
        style={{
          aspectRatio: '5 / 7',
          background: frameGradient,
          borderRadius: '8px',
          padding: '4px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(180deg, #24272A 0%, #191B1D 100%)',
            borderRadius: '5px',
            border: '1px solid rgba(0, 0, 0, 0.65)',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '3px',
          }}
        >
          {/* Mini Header: Icon + Code on left, Remove X on right */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#141618',
              borderRadius: '3px',
              padding: '2px 5px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: theme.hex,
                fontFamily: 'ui-monospace, monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <span>{theme.badgeIcon}</span>
              <span>{card.code || card.anchor.toUpperCase().slice(0, 1)}</span>
            </span>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                title={`Remove ${card.name}`}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8B7E74',
                  cursor: 'pointer',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  padding: '0 2px',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* 5x5 Isometric Board Art Window */}
          <div
            style={{
              flex: 1,
              background: 'radial-gradient(circle at 50% 45%, #262B30 0%, #121416 100%)',
              borderRadius: '3px',
              border: '1px solid rgba(212, 175, 55, 0.28)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '54px',
            }}
          >
            <CardArt anchor={card.anchor} artId={card.artId} cardName={card.name} />
          </div>

          {/* Bottom Nameplate (Zero Ellipsis) */}
          <div
            style={{
              backgroundColor: '#141618',
              borderRadius: '3px',
              padding: '3px 4px',
              textAlign: 'center',
              fontSize: '0.66rem',
              fontWeight: 700,
              color: '#FAF9F6',
              lineHeight: 1.15,
              border: '1px solid rgba(139, 126, 116, 0.18)',
            }}
          >
            {card.name}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 2. IN-MATCH TACTICAL HAND 5:7 PLAYING CARD (Resting & Pop-out Zoom)
  // ==========================================================================
  if (size === 'hand') {
    const isExpanded = isSelected || isHovered || isActiveForPiece;
    const goldRing = isSelected || isActiveForPiece;

    return (
      <div
        data-card-id={card.id}
        data-testid={dataTestId || `hand-card-${card.id}`}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        title={`${card.code ? `[${card.code}] ` : ''}${card.name}\nIF: ${card.conditionText}\nEFF: ${card.effectText || card.description}`}
        style={{
          background: isAvailable || isSelected ? frameGradient : '#24272A',
          boxShadow: goldRing
            ? '0 14px 28px rgba(0,0,0,0.85), 0 0 14px rgba(212,175,55,0.75)'
            : isExpanded
            ? '0 12px 24px rgba(0,0,0,0.8), 0 0 10px rgba(212,175,55,0.4)'
            : '0 6px 14px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.22)',
          outline: goldRing ? '2px solid #D4AF37' : 'none',
        }}
        className={`group relative tcg-card w-[92px] h-[142px] sm:w-[96px] sm:h-[148px] rounded-[8px] p-[4px] flex flex-col transition-all duration-200 select-none ${overlapClass} ${
          isSelected
            ? 'z-40 -translate-y-4 scale-[1.24] rotate-0 cursor-pointer'
            : isActiveForPiece
            ? 'z-30 -translate-y-3 scale-[1.16] rotate-0 cursor-pointer'
            : isHovered
            ? 'z-35 -translate-y-3.5 scale-[1.2] rotate-0 cursor-pointer'
            : isDimmed
            ? `${fanRotationClass} opacity-40 cursor-pointer`
            : isAvailable
            ? `${fanRotationClass} hover:-translate-y-4 hover:scale-[1.22] hover:rotate-0 hover:z-40 cursor-pointer`
            : `${fanRotationClass} opacity-25 cursor-not-allowed`
        }`}
      >
        <div className="flex-1 bg-gradient-to-b from-[#24272A] to-[#191B1D] rounded-[5px] border border-black/70 p-[4px] flex flex-col justify-between gap-[3px] overflow-hidden">
          {/* Header Bar: Full Card Name + Code Badge (Zero Ellipsis) */}
          <div className="w-full flex items-center justify-between gap-1 bg-[#141618] border border-white/10 rounded-[3px] px-1 py-0.5">
            <span className="text-[7.5px] font-extrabold text-[#FAF9F6] leading-tight">
              {card.name}
            </span>
            {card.code && (
              <span
                style={{ color: theme.hex }}
                className="text-[7px] font-mono font-extrabold flex-shrink-0 leading-none"
              >
                {card.code}
              </span>
            )}
          </div>

          {/* 5x5 Isometric Board Art Window */}
          <div
            data-testid="tcg-mini-board"
            className="w-full h-[50px] rounded-[3px] bg-[#121416] border border-[#D4AF37]/30 flex items-center justify-center overflow-hidden flex-shrink-0"
          >
            <CardArt anchor={card.anchor} artId={card.artId} cardName={card.name} />
          </div>

          {/* Condition Strip */}
          <div
            style={{ borderLeft: `2px solid ${theme.hex}` }}
            className="w-full bg-[#2C3034] rounded-[2px] px-1 py-[1.5px] text-[6px] font-bold text-[#FAF9F6] leading-[1.15]"
          >
            <span style={{ color: theme.hex }}>IF: </span>
            {getConciseCondition(card, true)}
          </div>

          {/* Rules Box */}
          <div className="flex-1 bg-[#141618] border border-[#8B7E74]/20 rounded-[3px] px-1 py-0.5 flex items-center">
            <p className="text-[6.2px] text-[#E6E4E0] leading-[1.16]">
              {getConciseEffect(card, true)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 3. LIBRARY 5:7 PORTRAIT PLAYING CARD + EXTERNAL TOP-RIGHT COPY BLIPS
  // ==========================================================================
  const isFullyEquipped = equippedCopies >= maxCopies;

  return (
    <div
      data-testid={dataTestId}
      style={{
        display: 'inline-flex',
        alignItems: 'flex-start',
        gap: '6px',
      }}
    >
      {/* Pure 5:7 Portrait Playing Card (No copy count inside) */}
      <div
        onClick={onClick}
        style={{
          width: '192px',
          height: '268px',
          borderRadius: '11px',
          padding: '6px',
          background: frameGradient,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          cursor: isFullyEquipped ? 'default' : 'pointer',
          boxShadow:
            '0 10px 24px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!isFullyEquipped) {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = `0 14px 28px rgba(0, 0, 0, 0.7), 0 0 12px ${theme.hex}55, inset 0 1px 0 rgba(255, 255, 255, 0.3)`;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow =
            '0 10px 24px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.25)';
        }}
      >
        {/* Inner Dark Bevel Surface */}
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(180deg, #24272A 0%, #191B1D 100%)',
            borderRadius: '6px',
            border: '1px solid rgba(0, 0, 0, 0.65)',
            padding: '7px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {/* Top Header Bar: Piece Glyph + Full Name + Playbook Code */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#141618',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              padding: '4px 6px',
              gap: '4px',
            }}
          >
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#FAF9F6',
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ color: theme.hex }}>{theme.badgeIcon}</span>
              <span>{card.name}</span>
            </div>
            {card.code && (
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'ui-monospace, monospace',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: theme.hex,
                  border: `1px solid ${theme.hex}60`,
                  flexShrink: 0,
                }}
              >
                {card.code}
              </span>
            )}
          </div>

          {/* Recessed 5x5 Isometric Board Art Window */}
          <div
            style={{
              width: '100%',
              height: '108px',
              background: 'radial-gradient(circle at 50% 45%, #262B30 0%, #121416 100%)',
              borderRadius: '4px',
              border: '1.5px solid rgba(212, 175, 55, 0.32)',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <CardArt anchor={card.anchor} artId={card.artId} cardName={card.name} />
          </div>

          {/* Mid-Card Condition Strip */}
          <div
            style={{
              backgroundColor: '#2C3034',
              borderTop: '1px solid rgba(255, 255, 255, 0.09)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.5)',
              borderLeft: `3px solid ${theme.hex}`,
              borderRadius: '3px',
              padding: '3.5px 6px',
              fontSize: '8.8px',
              fontWeight: 700,
              color: '#FAF9F6',
              lineHeight: 1.2,
            }}
          >
            <span style={{ color: theme.hex }}>IF: </span>
            {getConciseCondition(card)}
          </div>

          {/* Dark Rules Box (Zero Ellipsis, Zero Copy Count Inside) */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#141618',
              border: '1px solid rgba(139, 126, 116, 0.22)',
              borderRadius: '4px',
              padding: '5px 7px',
              fontSize: '9.6px',
              lineHeight: 1.3,
              color: '#E6E4E0',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {card.effectText || card.description}
          </div>
        </div>
      </div>

      {/* External Right-Edge Copy Blips (Top-Aligned, Only Showing Owned Copies) */}
      {showExternalBlips && (
        <div
          data-testid="copy-dot-stack"
          title={`${equippedCopies} equipped of ${maxCopies} available copies`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            paddingTop: '6px',
          }}
        >
          {Array.from({ length: Math.max(1, maxCopies) }).map((_, idx) => {
            const isEquipped = idx < equippedCopies;
            return (
              <span
                key={idx}
                data-blip-state={isEquipped ? 'equipped' : 'available'}
                style={{
                  width: '11px',
                  height: '11px',
                  borderRadius: '50%',
                  backgroundColor: isEquipped ? '#D4AF37' : '#191B1D',
                  border: isEquipped ? '2px solid #FFFDF7' : '2px solid #8B7E74',
                  boxShadow: isEquipped
                    ? '0 0 7px rgba(212, 175, 55, 0.85)'
                    : 'inset 0 1px 2px rgba(0, 0, 0, 0.8)',
                  transition: 'all 0.15s ease',
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlayingCard;
