import React from 'react';
import { CardDefinition, TargetingStage, EmpoweredMove } from '../types/deckChess';
import { getCardById } from '../engine/cardGraph';
import { CANONICAL_36_CARDS } from '../engine/cards/releaseRoster36';
import { PlayingCard } from './PlayingCard';

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
  onCancelTargeting,
  pendingCardMove,
  selectedSquare,
}) => {
  // If initialDeck is not provided, use current hand as baseline
  const deckCards = initialDeck.length > 0 ? initialDeck : hand;

  const rows =
    deckCards.length <= 4
      ? [deckCards]
      : [deckCards.slice(0, 4), deckCards.slice(4, 8)];

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

        {/* Right Status / Cancel Button */}
        <div className="flex items-center gap-2">
          {pendingCardMove ? (
            <div className="flex items-center gap-1.5 bg-[#3C493F] border border-[#D4AF37] px-2 py-0.5 rounded text-[11px]">
              <span className="text-[#D4AF37] font-bold">✓ Outcome Preview Active</span>
            </div>
          ) : activeCardId ? (
            <div className="flex items-center gap-1.5 bg-[#191B1D] border border-[#D4AF37]/60 px-2 py-0.5 rounded text-[11px] animate-pulse">
              <span className="text-[#D4AF37] font-medium">🎯 Card Active</span>
              {onCancelTargeting && (
                <button
                  type="button"
                  onClick={onCancelTargeting}
                  className="px-1.5 py-0.5 bg-[#AA4A44] hover:bg-[#883934] text-[#FAF9F6] rounded text-[9px] font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          ) : hasPlayedCardThisTurn ? (
            <span className="text-[10px] font-mono text-[#D4AF37] font-medium">
              Card played this turn
            </span>
          ) : null}
        </div>
      </div>

      {/* 2. 2×4 Portrait TCG Ruffle Hand Spread (Variant A 5:7 Playing Cards) */}
      <div className="flex flex-col gap-3.5 my-auto w-full items-center justify-center py-1">
        {rows.map((rowCards, rowIdx) => (
          <div key={rowIdx} className="flex items-center justify-center w-full px-2">
            {rowCards.map((cardId, cardIdx) => {
              const card = CARD_MAP.get(cardId) || getCardById(cardId);
              if (!card) return null;

              const isAvailable = hand.includes(cardId);
              const isSelected = activeCardId === cardId;
              const isHovered = hoveredCardId === cardId;
              const isActiveForPiece = activeCardIdsForPiece.includes(cardId);
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
                  key={`${cardId}-${cardIdx}`}
                  card={card}
                  size="hand"
                  isAvailable={isAvailable}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  isActiveForPiece={isActiveForPiece}
                  isDimmed={isDimmed}
                  fanRotationClass={fanRotation}
                  overlapClass={overlapClass}
                  dataTestId={`hand-card-${cardId}`}
                  onClick={() => {
                    if (isAvailable || isSelected) {
                      onSelectCard(cardId);
                    }
                  }}
                  onMouseEnter={() => {
                    if (onHoverCard) onHoverCard(cardId);
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
