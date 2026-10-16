import React, { useState } from 'react';
import { CardDefinition, TargetingStage } from '../types/deckChess';
import { getCardById, PIECE_COLOR_THEMES, STARTER_DECK } from '../engine/cardGraph';

export interface TacticalHandBarProps {
  hand: string[]; // Active card IDs remaining in hand
  initialDeck?: string[]; // All 8 cards originally in deck to show consumed status
  energy: number;
  hasPlayedCardThisTurn: boolean;
  isMyTurn: boolean;
  selectedCard: CardDefinition | null;
  targetingStage: TargetingStage;
  activeCardIdsForPiece?: string[]; // Cards in hand currently usable for selected piece
  onSelectCard: (cardId: string) => void;
  onCancelTargeting: () => void;
}

export const TacticalHandBar: React.FC<TacticalHandBarProps> = ({
  hand,
  initialDeck = STARTER_DECK.map((c) => c.id),
  energy,
  hasPlayedCardThisTurn,
  isMyTurn,
  selectedCard,
  targetingStage,
  activeCardIdsForPiece = [],
  onSelectCard,
  onCancelTargeting,
}) => {
  const [showRulesTooltip, setShowRulesTooltip] = useState<boolean>(false);

  // Render guidance banner text depending on stage
  let stageGuidance = '';
  if (selectedCard) {
    if (targetingStage === 'pick_anchor') {
      stageGuidance = `Select friendly ${selectedCard.anchor.toUpperCase()}`;
    } else if (targetingStage === 'pick_target') {
      stageGuidance = `Select target square`;
    } else if (targetingStage === 'pick_secondary') {
      stageGuidance = `Select destination`;
    }
  }

  return (
    <div className="w-full max-w-[470px] flex flex-col gap-1.5 p-2 bg-[#24272A] border border-[rgba(139,126,116,0.25)] rounded-md shadow-xl select-none">
      {/* Top Header: Energy Meter & Targeting / Status Guidance */}
      <div className="flex items-center justify-between px-1 text-xs">
        {/* 3-cell Energy Counter */}
        <div className="flex items-center gap-2">
          <span className="text-[#D4AF37] font-bold text-xs font-mono tracking-wide flex items-center gap-1">
            ⚡ ENERGY
          </span>
          <div className="flex gap-1 items-center">
            {[1, 2, 3].map((cell) => {
              const isFilled = cell <= energy;
              return (
                <div
                  key={cell}
                  className={`w-5 h-3 rounded-sm transition-all duration-300 border ${
                    isFilled
                      ? 'bg-[#D4AF37] border-[#bf9b30] shadow-[0_0_8px_rgba(212,175,55,0.6)]'
                      : 'bg-[#191B1D] border-[rgba(139,126,116,0.2)]'
                  }`}
                />
              );
            })}
          </div>
          <span className="text-[11px] font-mono font-bold text-[#FAF9F6]">
            {energy}/3
          </span>
        </div>

        {/* Status / Guidance or Rules Help Trigger */}
        <div className="relative flex items-center gap-2">
          {selectedCard ? (
            <div className="flex items-center gap-1.5 bg-[#191B1D] border border-[#D4AF37]/60 px-2 py-0.5 rounded text-[11px] animate-pulse">
              <span className="text-[#D4AF37] font-medium">🎯 {stageGuidance}</span>
              <button
                onClick={onCancelTargeting}
                className="px-1.5 py-0.2 bg-[#AA4A44] hover:bg-[#883934] text-[#FAF9F6] rounded text-[9px] font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : hasPlayedCardThisTurn ? (
            <span className="text-[10px] font-mono text-[#D4AF37]">
              Card used · Make chess move
            </span>
          ) : (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowRulesTooltip(true)}
                onMouseLeave={() => setShowRulesTooltip(false)}
                onClick={() => setShowRulesTooltip(!showRulesTooltip)}
                className="w-5 h-5 rounded-full bg-[#191B1D] hover:bg-[#282B2E] border border-[rgba(139,126,116,0.3)] text-[#8B7E74] hover:text-[#FAF9F6] flex items-center justify-center text-[10px] font-mono font-bold transition-colors cursor-pointer"
                title="Pre-Move Rules"
              >
                ?
              </button>

              {showRulesTooltip && (
                <div className="absolute right-0 top-6 w-60 p-2 bg-[#141618] border border-[rgba(139,126,116,0.3)] rounded shadow-2xl text-[10px] leading-relaxed text-[#FAF9F6] z-30">
                  <span className="font-bold text-[#D4AF37] block mb-0.5">Pre-Move Window</span>
                  Play 1 tactical card per turn using your energy before moving a chess piece. Cards modify the board or piece behavior.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Accordion / Carousel Card Rack (flush within 470px) */}
      <div className="flex gap-1 h-[76px] w-full overflow-visible py-0.5">
        {initialDeck.map((cardId) => {
          const card = getCardById(cardId);
          if (!card) return null;

          const isAvailable = hand.includes(cardId);
          const isSelected = selectedCard?.id === cardId;
          const canAfford = energy >= card.energyCost;
          const isPlayable = isMyTurn && isAvailable && !hasPlayedCardThisTurn && canAfford;
          const isActiveForPiece = activeCardIdsForPiece.includes(cardId);
          const theme = PIECE_COLOR_THEMES[card.anchor] || PIECE_COLOR_THEMES.pawn;

          return (
            <div
              key={cardId}
              data-card-id={cardId}
              onClick={() => {
                if (isPlayable || isSelected) {
                  onSelectCard(cardId);
                }
              }}
              title={`${card.name} (${card.energyCost} Energy)\n${card.description}`}
              className={`group relative rounded p-1 flex flex-col justify-between items-center transition-all duration-200 select-none ${
                isSelected
                  ? 'flex-[2.6] bg-[#282B2E] border-2 border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.3)] -translate-y-1 z-20 cursor-pointer'
                  : isActiveForPiece
                  ? 'flex-1 min-w-[38px] hover:flex-[2.6] bg-[#282B2E] border-2 border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.6)] ring-1 ring-[#D4AF37] animate-pulse -translate-y-0.5 z-15 cursor-pointer'
                  : isPlayable
                  ? 'flex-1 min-w-[38px] hover:flex-[2.6] bg-[#1C1E20] hover:bg-[#282B2E] border border-[rgba(139,126,116,0.2)] hover:border-[#D4AF37] hover:-translate-y-1 hover:shadow-lg hover:z-20 cursor-pointer'
                  : !isAvailable
                  ? 'flex-1 min-w-[38px] bg-[#141618] opacity-25 border border-dashed border-[rgba(139,126,116,0.2)] cursor-not-allowed'
                  : 'flex-1 min-w-[38px] hover:flex-[2.6] bg-[#1C1E20] hover:bg-[#282B2E] opacity-60 border border-[rgba(139,126,116,0.15)] hover:border-[#8B7E74] hover:-translate-y-0.5 cursor-not-allowed'
              }`}
            >
              {/* Top: Piece Badge & Energy Cost */}
              <div className="w-full flex items-center justify-between px-0.5">
                <span style={{ color: theme.hex }} className="text-xs font-bold leading-none">
                  {theme.badgeIcon}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-1 rounded ${
                    canAfford
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                      : 'bg-[#191B1D] text-[#8B7E74]'
                  }`}
                >
                  ⚡{card.energyCost}
                </span>
              </div>

              {/* Middle: Title & Description on hover/select */}
              <div className="w-full my-auto text-center overflow-hidden">
                <p
                  style={{ color: isPlayable || isSelected ? theme.hex : '#8B7E74' }}
                  className={`text-[10px] font-bold leading-tight ${
                    isSelected ? 'line-clamp-1' : 'truncate group-hover:line-clamp-1'
                  }`}
                >
                  {card.name}
                </p>
                <div
                  className={`w-full overflow-hidden ${
                    isSelected ? 'block' : 'hidden group-hover:block'
                  }`}
                >
                  <p className="text-[8px] text-[#FAF9F6]/85 line-clamp-2 leading-tight mt-0.5 text-center">
                    {card.description}
                  </p>
                </div>
              </div>

              {/* Bottom Status Tag */}
              <div className="text-center w-full">
                {!isAvailable ? (
                  <span className="text-[8px] uppercase font-mono text-[#8B7E74] font-semibold">
                    USED
                  </span>
                ) : isSelected ? (
                  <span className="text-[8px] uppercase font-mono text-[#D4AF37] font-bold">
                    ACTIVE
                  </span>
                ) : (
                  <span className="text-[8px] font-mono text-[#8B7E74] group-hover:hidden">
                    {canAfford ? 'READY' : 'LOW ⚡'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
