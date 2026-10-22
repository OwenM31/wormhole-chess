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

export interface PieceColorPalette {
  borderGrad: string;
  cardBg: string;
  headerBg: string;
  headerBorder: string;
  artBg: string;
  artBorder: string;
  condBg: string;
  condBorder: string;
  rulesBg: string;
  rulesBorder: string;
  textColor: string;
  accentColor: string;
  codeBg: string;
}

export const PIECE_PALETTES: Record<PieceAnchor, PieceColorPalette> = {
  pawn: {
    borderGrad: 'linear-gradient(135deg, #9CA3AF 0%, #4B5563 100%)',
    cardBg: 'linear-gradient(180deg, #F3F4F6 0%, #E5E7EB 100%)',
    headerBg: '#E5E7EB',
    headerBorder: '#D1D5DB',
    artBg: 'radial-gradient(circle at 50% 45%, #3B424C 0%, #1F2429 100%)',
    artBorder: 'rgba(75, 85, 99, 0.45)',
    condBg: '#E5E7EB',
    condBorder: '#6B7280',
    rulesBg: '#FFFFFF',
    rulesBorder: '#D1D5DB',
    textColor: '#1F2937',
    accentColor: '#4B5563',
    codeBg: 'rgba(255, 255, 255, 0.9)',
  },
  knight: {
    borderGrad: 'linear-gradient(135deg, #4ADE80 0%, #15803D 100%)',
    cardBg: 'linear-gradient(180deg, #F0FDF4 0%, #DCFCE7 100%)',
    headerBg: '#DCFCE7',
    headerBorder: '#BBF7D0',
    artBg: 'radial-gradient(circle at 50% 45%, #244B30 0%, #122C1B 100%)',
    artBorder: 'rgba(22, 163, 74, 0.45)',
    condBg: '#DCFCE7',
    condBorder: '#16A34A',
    rulesBg: '#FFFFFF',
    rulesBorder: '#BBF7D0',
    textColor: '#14532D',
    accentColor: '#16A34A',
    codeBg: 'rgba(255, 255, 255, 0.9)',
  },
  bishop: {
    borderGrad: 'linear-gradient(135deg, #60A5FA 0%, #1D4ED8 100%)',
    cardBg: 'linear-gradient(180deg, #EFF6FF 0%, #DBEAFE 100%)',
    headerBg: '#DBEAFE',
    headerBorder: '#BFDBFE',
    artBg: 'radial-gradient(circle at 50% 45%, #24416B 0%, #122440 100%)',
    artBorder: 'rgba(37, 99, 235, 0.45)',
    condBg: '#DBEAFE',
    condBorder: '#2563EB',
    rulesBg: '#FFFFFF',
    rulesBorder: '#BFDBFE',
    textColor: '#1E3A8A',
    accentColor: '#2563EB',
    codeBg: 'rgba(255, 255, 255, 0.9)',
  },
  rook: {
    borderGrad: 'linear-gradient(135deg, #C084FC 0%, #7E22CE 100%)',
    cardBg: 'linear-gradient(180deg, #FAF5FF 0%, #F3E8FF 100%)',
    headerBg: '#F3E8FF',
    headerBorder: '#E9D5FF',
    artBg: 'radial-gradient(circle at 50% 45%, #462568 0%, #251239 100%)',
    artBorder: 'rgba(147, 51, 234, 0.45)',
    condBg: '#F3E8FF',
    condBorder: '#9333EA',
    rulesBg: '#FFFFFF',
    rulesBorder: '#E9D5FF',
    textColor: '#3B0764',
    accentColor: '#9333EA',
    codeBg: 'rgba(255, 255, 255, 0.9)',
  },
  queen: {
    borderGrad: 'linear-gradient(135deg, #F87171 0%, #B91C1C 100%)',
    cardBg: 'linear-gradient(180deg, #FEF2F2 0%, #FEE2E2 100%)',
    headerBg: '#FEE2E2',
    headerBorder: '#FECACA',
    artBg: 'radial-gradient(circle at 50% 45%, #572528 0%, #301012 100%)',
    artBorder: 'rgba(220, 38, 38, 0.45)',
    condBg: '#FEE2E2',
    condBorder: '#DC2626',
    rulesBg: '#FFFFFF',
    rulesBorder: '#FECACA',
    textColor: '#450A0A',
    accentColor: '#DC2626',
    codeBg: 'rgba(255, 255, 255, 0.9)',
  },
  king: {
    borderGrad: 'linear-gradient(135deg, #FACC15 0%, #A16207 100%)',
    cardBg: 'linear-gradient(180deg, #FEFCE8 0%, #FEF9C3 100%)',
    headerBg: '#FEF9C3',
    headerBorder: '#FEF08A',
    artBg: 'radial-gradient(circle at 50% 45%, #52401C 0%, #2E220C 100%)',
    artBorder: 'rgba(202, 138, 4, 0.45)',
    condBg: '#FEF9C3',
    condBorder: '#CA8A04',
    rulesBg: '#FFFFFF',
    rulesBorder: '#FEF08A',
    textColor: '#422006',
    accentColor: '#CA8A04',
    codeBg: 'rgba(255, 255, 255, 0.9)',
  },
};

const PIECE_FRAME_GRADIENTS: Record<PieceAnchor, string> = {
  pawn: PIECE_PALETTES.pawn.borderGrad,
  knight: PIECE_PALETTES.knight.borderGrad,
  bishop: PIECE_PALETTES.bishop.borderGrad,
  rook: PIECE_PALETTES.rook.borderGrad,
  queen: PIECE_PALETTES.queen.borderGrad,
  king: PIECE_PALETTES.king.borderGrad,
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
  const pal = PIECE_PALETTES[card.anchor] || PIECE_PALETTES.pawn;
  const theme =
    card.visualTheme ||
    PIECE_COLOR_THEMES[card.anchor] ||
    PIECE_COLOR_THEMES.pawn;
  const frameGradient = pal.borderGrad;

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
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
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
            background: pal.cardBg,
            borderRadius: '5px',
            border: '1px solid rgba(0, 0, 0, 0.18)',
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
              backgroundColor: pal.headerBg,
              borderRadius: '3px',
              padding: '2px 5px',
              border: `1px solid ${pal.headerBorder}`,
            }}
          >
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: pal.accentColor,
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
                  color: pal.textColor,
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

          {/* 5x5 Isometric Board Art Window (Duller shade of border color) */}
          <div
            style={{
              flex: 1,
              background: pal.artBg,
              borderRadius: '3px',
              border: `1px solid ${pal.artBorder}`,
              boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.5)',
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
              backgroundColor: pal.rulesBg,
              borderRadius: '3px',
              padding: '3px 4px',
              textAlign: 'center',
              fontSize: '0.66rem',
              fontWeight: 700,
              color: pal.textColor,
              lineHeight: 1.15,
              border: `1px solid ${pal.rulesBorder}`,
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
          background: isAvailable || isSelected ? pal.borderGrad : '#24272A',
          boxShadow: goldRing
            ? '0 14px 28px rgba(0,0,0,0.85), 0 0 14px rgba(212,175,55,0.75)'
            : isExpanded
            ? '0 12px 24px rgba(0,0,0,0.8), 0 0 10px rgba(212,175,55,0.4)'
            : '0 6px 14px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
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
        <div
          style={{
            background: pal.cardBg,
            border: '1px solid rgba(0, 0, 0, 0.18)',
          }}
          className="flex-1 rounded-[5px] p-[4px] flex flex-col justify-between gap-[3px] overflow-hidden"
        >
          {/* Header Bar: Full Card Name + Code Badge (Zero Ellipsis) */}
          <div
            style={{
              backgroundColor: pal.headerBg,
              border: `1px solid ${pal.headerBorder}`,
            }}
            className="w-full flex items-center justify-between gap-1 rounded-[3px] px-1 py-0.5"
          >
            <span
              style={{ color: pal.textColor }}
              className="text-[7.5px] font-extrabold leading-tight"
            >
              {card.name}
            </span>
            {card.code && (
              <span
                style={{ color: pal.accentColor }}
                className="text-[7px] font-mono font-extrabold flex-shrink-0 leading-none"
              >
                {card.code}
              </span>
            )}
          </div>

          {/* 5x5 Isometric Board Art Window (Duller shade of border color) */}
          <div
            data-testid="tcg-mini-board"
            style={{
              background: pal.artBg,
              border: `1px solid ${pal.artBorder}`,
              boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.5)',
            }}
            className="w-full h-[50px] rounded-[3px] flex items-center justify-center overflow-hidden flex-shrink-0"
          >
            <CardArt anchor={card.anchor} artId={card.artId} cardName={card.name} />
          </div>

          {/* Condition Strip */}
          <div
            style={{
              backgroundColor: pal.condBg,
              borderLeft: `2px solid ${pal.condBorder}`,
              color: pal.textColor,
            }}
            className="w-full rounded-[2px] px-1 py-[1.5px] text-[6px] font-bold leading-[1.15]"
          >
            <span style={{ color: pal.accentColor, fontWeight: 900 }}>IF: </span>
            {getConciseCondition(card, true)}
          </div>

          {/* Rules Box */}
          <div
            style={{
              backgroundColor: pal.rulesBg,
              border: `1px solid ${pal.rulesBorder}`,
            }}
            className="flex-1 rounded-[3px] px-1 py-0.5 flex items-center"
          >
            <p
              style={{ color: pal.textColor }}
              className="text-[6.2px] font-semibold leading-[1.16]"
            >
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
            '0 10px 24px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!isFullyEquipped) {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = `0 14px 28px rgba(0, 0, 0, 0.7), 0 0 12px ${pal.accentColor}55, inset 0 1px 0 rgba(255, 255, 255, 0.4)`;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow =
            '0 10px 24px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.35)';
        }}
      >
        {/* Inner Card Surface */}
        <div
          style={{
            flex: 1,
            background: pal.cardBg,
            borderRadius: '6px',
            border: '1px solid rgba(0, 0, 0, 0.18)',
            padding: '7px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.7)',
          }}
        >
          {/* Top Header Bar: Piece Glyph + Full Name + Playbook Code */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: pal.headerBg,
              border: `1px solid ${pal.headerBorder}`,
              borderRadius: '4px',
              padding: '4px 6px',
              gap: '4px',
            }}
          >
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: pal.textColor,
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ color: pal.accentColor, fontSize: '13px' }}>{theme.badgeIcon}</span>
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
                  backgroundColor: pal.codeBg,
                  color: pal.accentColor,
                  border: `1px solid ${pal.accentColor}`,
                  flexShrink: 0,
                }}
              >
                {card.code}
              </span>
            )}
          </div>

          {/* Recessed 5x5 Isometric Board Art Window (Duller shade of border color) */}
          <div
            style={{
              width: '100%',
              height: '108px',
              background: pal.artBg,
              borderRadius: '4px',
              border: `1.5px solid ${pal.artBorder}`,
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.6)',
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
              backgroundColor: pal.condBg,
              borderTop: '1px solid rgba(255, 255, 255, 0.8)',
              borderBottom: `1px solid ${pal.headerBorder}`,
              borderLeft: `3px solid ${pal.condBorder}`,
              borderRadius: '3px',
              padding: '3.5px 6px',
              fontSize: '8.8px',
              fontWeight: 700,
              color: pal.textColor,
              lineHeight: 1.2,
            }}
          >
            <span style={{ color: pal.accentColor, fontWeight: 900 }}>IF: </span>
            {getConciseCondition(card)}
          </div>

          {/* Rules Box with Dark Text on Light Surface */}
          <div
            style={{
              flex: 1,
              backgroundColor: pal.rulesBg,
              border: `1px solid ${pal.rulesBorder}`,
              borderRadius: '4px',
              padding: '5px 7px',
              fontSize: '9.6px',
              lineHeight: 1.3,
              color: pal.textColor,
              fontWeight: 600,
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
