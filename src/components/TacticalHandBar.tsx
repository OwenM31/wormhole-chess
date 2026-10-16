import React from 'react';
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

const getMiniBoardTargets = (card: CardDefinition): { r: number; c: number }[] => {
  const effect = card.effect_type?.toLowerCase() || '';
  const anchor = card.anchor;

  if (effect.includes('jump') || anchor === 'knight') {
    return [{ r: 1, c: 1 }, { r: 1, c: 3 }];
  }
  if (anchor === 'pawn') {
    return [{ r: 2, c: 2 }, { r: 1, c: 2 }];
  }
  if (anchor === 'bishop') {
    return [{ r: 1, c: 0 }, { r: 2, c: 1 }, { r: 2, c: 3 }, { r: 1, c: 4 }];
  }
  if (anchor === 'rook') {
    return [{ r: 1, c: 2 }, { r: 2, c: 2 }, { r: 3, c: 0 }, { r: 3, c: 4 }];
  }
  if (anchor === 'queen') {
    return [{ r: 1, c: 2 }, { r: 2, c: 1 }, { r: 2, c: 3 }];
  }
  return [{ r: 2, c: 1 }, { r: 2, c: 2 }, { r: 2, c: 3 }];
};

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
  // Render guidance banner text depending on stage
  let stageGuidance = '';
  if (selectedCard) {
    if (targetingStage === 'pick_anchor') {
      stageGuidance = `Select ${selectedCard.anchor.toUpperCase()}`;
    } else if (targetingStage === 'pick_target') {
      stageGuidance = `Select Target`;
    } else if (targetingStage === 'pick_secondary') {
      stageGuidance = `Select Destination`;
    }
  }

  const rows =
    initialDeck.length <= 5
      ? [initialDeck]
      : [initialDeck.slice(0, 4), initialDeck.slice(4, 8)];

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#1C1E20] border border-[rgba(139,126,116,0.2)] rounded-md p-3 shadow-xl select-none gap-3">
      {/* 1. Pure Top Energy Header Bar */}
      <div className="w-full flex items-center justify-between px-2.5 py-2 bg-[#24272A] border border-[rgba(139,126,116,0.2)] rounded">
        {/* 3-Cell Energy Meter */}
        <div className="flex items-center gap-2.5">
          <span className="text-[#D4AF37] font-bold text-xs font-mono tracking-wider flex items-center gap-1">
            ⚡ ENERGY
          </span>
          <div className="flex gap-1.5 items-center">
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
          <span className="text-xs font-mono font-bold text-[#FAF9F6] tabular-nums">
            {energy}/3
          </span>
        </div>

        {/* Right Status / Cancel Button */}
        <div className="flex items-center gap-2">
          {selectedCard ? (
            <div className="flex items-center gap-1.5 bg-[#191B1D] border border-[#D4AF37]/60 px-2 py-0.5 rounded text-[11px] animate-pulse">
              <span className="text-[#D4AF37] font-medium">🎯 {stageGuidance}</span>
              <button
                onClick={onCancelTargeting}
                className="px-1.5 py-0.5 bg-[#AA4A44] hover:bg-[#883934] text-[#FAF9F6] rounded text-[9px] font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : hasPlayedCardThisTurn ? (
            <span className="text-[10px] font-mono text-[#D4AF37] font-medium">
              Card used · Make move
            </span>
          ) : null}
        </div>
      </div>

      {/* 2. 2×4 Portrait TCG Ruffle Hand Spread */}
      <div className="flex flex-col gap-3 my-auto w-full items-center justify-center py-1">
        {rows.map((rowCards, rowIdx) => (
          <div key={rowIdx} className="flex items-center justify-center w-full px-2">
            {rowCards.map((cardId, cardIdx) => {
              const card = getCardById(cardId);
              if (!card) return null;

              const isAvailable = hand.includes(cardId);
              const isSelected = selectedCard?.id === cardId;
              const canAfford = energy >= card.energyCost;
              const isPlayable = isMyTurn && isAvailable && !hasPlayedCardThisTurn && canAfford;
              const isActiveForPiece = activeCardIdsForPiece.includes(cardId);
              const theme = PIECE_COLOR_THEMES[card.anchor] || PIECE_COLOR_THEMES.pawn;
              const targets = getMiniBoardTargets(card);

              // Fan rotation
              const fanRotation =
                cardIdx === 0
                  ? '-rotate-2'
                  : cardIdx === 1
                  ? '-rotate-1'
                  : cardIdx === 2
                  ? 'rotate-1'
                  : 'rotate-2';

              const conditionLabel = card.condition_type || 'TACTICAL';
              const effectLabel = card.effect_type || 'MOVE';

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
                  className={`group relative tcg-card w-[78px] h-[112px] sm:w-[82px] sm:h-[118px] rounded-[7px] p-1.5 flex flex-col justify-between transition-all duration-200 select-none ${
                    cardIdx > 0 ? '-ml-3.5 sm:-ml-4' : 'ml-0'
                  } ${
                    isSelected
                      ? `z-30 -translate-y-3 scale-[1.18] rotate-0 bg-[#282B2E] border-2 border-[#D4AF37] shadow-[0_12px_24px_rgba(0,0,0,0.8),0_0_12px_rgba(212,175,55,0.5)] cursor-pointer`
                      : isActiveForPiece
                      ? `z-20 -translate-y-1.5 scale-[1.08] rotate-0 bg-[#282B2E] border-2 border-[#D4AF37] shadow-[0_8px_16px_rgba(0,0,0,0.7),0_0_10px_rgba(212,175,55,0.5)] animate-pulse cursor-pointer`
                      : isPlayable
                      ? `${fanRotation} bg-[#24272A] border border-[rgba(139,126,116,0.25)] hover:border-[#D4AF37] hover:-translate-y-3.5 hover:scale-[1.18] hover:rotate-0 hover:z-30 hover:shadow-[0_12px_24px_rgba(0,0,0,0.8),0_0_10px_rgba(212,175,55,0.4)] cursor-pointer`
                      : !isAvailable
                      ? `${fanRotation} bg-[#141618] opacity-25 border border-dashed border-[rgba(139,126,116,0.2)] cursor-not-allowed`
                      : `${fanRotation} bg-[#24272A] opacity-60 border border-[rgba(139,126,116,0.18)] hover:opacity-100 hover:-translate-y-2 hover:scale-[1.06] hover:rotate-0 hover:z-20 cursor-not-allowed`
                  }`}
                >
                  {/* Top: Piece Glyphs + Name & Energy Cost Badge */}
                  <div className="w-full flex items-center justify-between gap-1 leading-none">
                    <div className="flex items-center gap-1 min-w-0">
                      <span style={{ color: theme.hex }} className="text-[11px] font-bold flex-shrink-0">
                        {theme.badgeIcon}
                      </span>
                      <span
                        style={{ color: isPlayable || isSelected ? '#FAF9F6' : '#8B7E74' }}
                        className="text-[9px] font-bold truncate leading-none"
                      >
                        {card.name}
                      </span>
                    </div>
                    <span
                      className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded leading-none flex-shrink-0 ${
                        !isAvailable
                          ? 'bg-[#191B1D] text-[#8B7E74]'
                          : canAfford
                          ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                          : 'bg-[#191B1D] text-[#8B7E74]'
                      }`}
                    >
                      {!isAvailable ? 'USED' : `⚡${card.energyCost}`}
                    </span>
                  </div>

                  {/* Center: Art Window / 5x4 Mini-Board Visual Explainer */}
                  <div className="w-full my-auto">
                    {/* Default Art View: Centered Glyph */}
                    <div
                      className={`w-full h-[38px] rounded-[4px] bg-[#141618] border border-[rgba(139,126,116,0.2)] flex items-center justify-center relative overflow-hidden ${
                        isSelected || isActiveForPiece ? 'hidden' : 'flex group-hover:hidden'
                      }`}
                    >
                      <span
                        style={{ color: theme.hex }}
                        className="text-lg font-bold opacity-80 drop-shadow-[0_0_6px_rgba(212,175,55,0.25)]"
                      >
                        {theme.badgeIcon}
                      </span>
                    </div>

                    {/* Hover/Active View: 5x4 Mini-Board Schematic */}
                    <div
                      className={`w-full h-[38px] rounded-[4px] bg-[#141618] border border-[rgba(212,175,55,0.4)] flex items-center justify-center p-0.5 ${
                        isSelected || isActiveForPiece ? 'flex' : 'hidden group-hover:flex'
                      }`}
                    >
                      <div className="grid grid-cols-5 gap-0.5 w-[54px] h-[32px]">
                        {[0, 1, 2, 3].map((r) =>
                          [0, 1, 2, 3, 4].map((c) => {
                            const isAnchor = r === 3 && c === 2;
                            const isTarget = targets.some((t) => t.r === r && t.c === c);
                            return (
                              <div
                                key={`${r}-${c}`}
                                className={`flex items-center justify-center rounded-[1px] ${
                                  isAnchor
                                    ? 'bg-[#D4AF37]/25 border border-[#D4AF37]'
                                    : isTarget
                                    ? 'bg-[#D4AF37]/45 border border-[#D4AF37] animate-pulse shadow-[0_0_4px_rgba(212,175,55,0.8)]'
                                    : (r + c) % 2 === 0
                                    ? 'bg-[#191B1D]'
                                    : 'bg-[#222528]'
                                }`}
                              >
                                {isAnchor && (
                                  <span style={{ color: theme.hex }} className="text-[6px] leading-none">
                                    {theme.badgeIcon}
                                  </span>
                                )}
                                {isTarget && <span className="w-1 h-1 rounded-full bg-[#D4AF37]" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Taxonomy Header & Concise Rule */}
                  <div className="w-full flex flex-col justify-end">
                    <p className="text-[7px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider truncate text-center leading-none">
                      {conditionLabel} ➔ {effectLabel}
                    </p>
                    <p className="text-[7.5px] text-[#FAF9F6]/85 line-clamp-2 leading-tight text-center mt-0.5">
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TacticalHandBar;
