import React from 'react';
import { CardDefinition, TargetingStage, EmpoweredMove } from '../types/deckChess';
import { getCardById } from '../engine/cardGraph';
import { CANONICAL_36_CARDS } from '../engine/cards/releaseRoster36';
import { PlayingCard } from './PlayingCard';
import { buildHandDisplay } from '../utils/handOrder';

export interface TacticalHandBarProps {
  hand: string[]; // Active card IDs remaining in hand
  initialDeck?: string[]; // All cards originally in hand to show consumed status
  energy?: number;
  hasPlayedCardThisTurn?: boolean;
  isMyTurn: boolean;
  selectedCard?: CardDefinition | null;
  selectedCardId?: string | null;
  hoveredCardId?: string | null;
  targetingStage?: TargetingStage;
  activeCardIdsForPiece?: string[]; // Cards in hand currently usable for selected piece
  onSelectCard: (cardId: string) => void;
  onHoverCard?: (cardId: string | null) => void;
  onCancelTargeting?: () => void;
  pendingCardMove?: EmpoweredMove | null;
  selectedSquare?: string | null;
}

const CARD_MAP = new Map(CANONICAL_36_CARDS.map((c) => [c.id, c]));

export const TacticalHandBar: React.FC<TacticalHandBarProps> = ({
  hand,
  initialDeck = [],
  hasPlayedCardThisTurn = false,
  selectedCard,
  selectedCardId,
  hoveredCardId,
  activeCardIdsForPiece = [],
  onSelectCard,
  onHoverCard,
  pendingCardMove,
  selectedSquare,
}) => {
  // If initialDeck is not provided, use current hand as baseline
  const deckCards = initialDeck.length > 0 ? initialDeck : hand;
  const handItems = buildHandDisplay(deckCards, hand);

  const desktopRows =
    handItems.length <= 4
      ? [handItems]
      : [handItems.slice(0, 4), handItems.slice(4, 8)];

  const activeCardId = selectedCardId || selectedCard?.id || null;

  return (
    <div
      data-testid="tactical-hand-bar"
      className="w-full h-full flex flex-col justify-between bg-[#1C1E20] border border-[rgba(139,126,116,0.2)] rounded-md p-3 shadow-xl select-none gap-3"
    >
      {/* 1. Tactical Header Bar (Zero Energy Pips) */}
      <div className="w-full flex items-center justify-between px-2.5 py-2 bg-[#24272A] border border-[rgba(139,126,116,0.2)] rounded">
        <div className="flex items-center gap-2">
          <span className="text-[#FAF9F6] font-bold text-xs font-mono tracking-wider flex items-center gap-1.5">
            <span style={{ color: '#D4AF37' }}>⚔️</span> TACTICAL HAND
          </span>
          <span className="text-[11px] font-mono font-bold text-[#D4AF37]">
            ({hand.length} CARDS)
          </span>
        </div>

        {/* Right Status (Cancel button removed; re-tapping selected card deselects) */}
        <div className="flex items-center gap-2">
          {pendingCardMove ? (
            <div className="flex items-center gap-1.5 bg-[#3C493F] border border-[#D4AF37] px-2 py-0.5 rounded text-[11px]">
              <span className="text-[#D4AF37] font-bold">✓ Outcome Preview Active</span>
            </div>
          ) : activeCardId ? (
            <div className="flex items-center gap-1.5 bg-[#191B1D] border border-[#D4AF37]/60 px-2 py-0.5 rounded text-[11px] animate-pulse">
              <span className="text-[#D4AF37] font-medium">🎯 Card Active</span>
            </div>
          ) : hasPlayedCardThisTurn ? (
            <span className="text-[10px] font-mono text-[#D4AF37] font-medium">
              Card played this turn
            </span>
          ) : null}
        </div>
      </div>

      {/* 2. Mobile Single Horizontal Swipeable Row (< lg) */}
      <div
        data-testid="tactical-hand-mobile-row"
        className="flex lg:hidden flex-nowrap overflow-x-auto snap-x snap-mandatory overscroll-x-contain [touch-action:pan-x] pt-6 pb-4 px-3 gap-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full items-center [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]"
      >
        {handItems.map((item) => {
          const card = CARD_MAP.get(item.cardId) || getCardById(item.cardId);
          if (!card) return null;

          const isAvailable = !item.spent;
          const isSelected = activeCardId === item.cardId;
          const isHovered = hoveredCardId === item.cardId;
          const isActiveForPiece = activeCardIdsForPiece.includes(item.cardId);
          const isPieceSelected = Boolean(selectedSquare);
          const isDimmed = isPieceSelected && !isActiveForPiece && !isSelected;

          return (
            <div
              key={item.slotKey}
              ref={(el) => {
                if (isSelected && el) {
                  el.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
                }
              }}
              className="flex-shrink-0 snap-start"
            >
              <PlayingCard
                card={card}
                size="hand"
                isAvailable={isAvailable}
                isSelected={isSelected}
                isHovered={isHovered}
                isActiveForPiece={isActiveForPiece}
                isDimmed={isDimmed}
                fanRotationClass="rotate-0"
                overlapClass=""
                dataTestId={`hand-card-${item.cardId}`}
                onClick={() => {
                  if (isAvailable || isSelected) {
                    onSelectCard(item.cardId);
                  }
                }}
                onMouseEnter={() => {
                  if (onHoverCard) onHoverCard(item.cardId);
                }}
                onMouseLeave={() => {
                  if (onHoverCard) onHoverCard(null);
                }}
              />
            </div>
          );
        })}
      </div>

      {/* 3. Desktop 2×4 Portrait TCG Ruffle Hand Spread (>= lg) */}
      <div
        data-testid="tactical-hand-desktop-grid"
        className="hidden lg:flex flex-col gap-3.5 my-auto w-full items-center justify-center py-1"
      >
        {desktopRows.map((rowCards, rowIdx) => (
          <div key={rowIdx} className="flex items-center justify-center w-full px-2">
            {rowCards.map((item, cardIdx) => {
              const card = CARD_MAP.get(item.cardId) || getCardById(item.cardId);
              if (!card) return null;

              const isAvailable = !item.spent;
              const isSelected = activeCardId === item.cardId;
              const isHovered = hoveredCardId === item.cardId;
              const isActiveForPiece = activeCardIdsForPiece.includes(item.cardId);
              const isPieceSelected = Boolean(selectedSquare);
              const isDimmed = isPieceSelected && !isActiveForPiece && !isSelected;

              // Fan rotation
              const fanRotation =
                cardIdx === 0
                  ? '-rotate-2'
                  : cardIdx === 1
                  ? '-rotate-1'
                  : cardIdx === 2
                  ? 'rotate-1'
                  : 'rotate-2';

              const overlapClass = cardIdx > 0 ? '-ml-3 sm:-ml-3.5' : 'ml-0';

              return (
                <PlayingCard
                  key={item.slotKey}
                  card={card}
                  size="hand"
                  isAvailable={isAvailable}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  isActiveForPiece={isActiveForPiece}
                  isDimmed={isDimmed}
                  fanRotationClass={fanRotation}
                  overlapClass={overlapClass}
                  dataTestId={`hand-card-${item.cardId}`}
                  onClick={() => {
                    if (isAvailable || isSelected) {
                      onSelectCard(item.cardId);
                    }
                  }}
                  onMouseEnter={() => {
                    if (onHoverCard) onHoverCard(item.cardId);
                  }}
                  onMouseLeave={() => {
                    if (onHoverCard) onHoverCard(null);
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TacticalHandBar;
