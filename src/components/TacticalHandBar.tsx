import React from 'react';
import { CardDefinition, TargetingStage, EmpoweredMove } from '../types/deckChess';
import { getCardById } from '../engine/cardGraph';
import { CANONICAL_36_CARDS, PIECE_COLOR_THEMES } from '../engine/cards/releaseRoster36';
import CardArt from './CardArt';

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

const getMiniBoardTargets = (card: CardDefinition): { r: number; c: number }[] => {
  const effect = card.effect_type?.toLowerCase() || card.effectText?.toLowerCase() || '';
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
  initialDeck = [],
  energy = 0,
  hasPlayedCardThisTurn = false,
  isMyTurn,
  selectedCard,
  selectedCardId,
  hoveredCardId,
  targetingStage,
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

      {/* 2. 2×4 Portrait TCG Ruffle Hand Spread */}
      <div className="flex flex-col gap-3 my-auto w-full items-center justify-center py-1">
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

              const theme =
                card.visualTheme ||
                PIECE_COLOR_THEMES[card.anchor] ||
                PIECE_COLOR_THEMES.pawn;
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

              const conditionLabel = card.conditionText
                ? card.conditionText.split('.')[0]
                : card.condition_type || 'TACTICAL';
              const effectLabel = card.effectText
                ? card.effectText.split('.')[0]
                : card.effect_type || 'EFFECT';

              return (
                <div
                  key={`${cardId}-${cardIdx}`}
                  data-card-id={cardId}
                  data-testid={`hand-card-${cardId}`}
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
                  title={`${card.code ? `[${card.code}] ` : ''}${card.name}\n${card.description || card.effectText}`}
                  style={{
                    borderColor: isSelected
                      ? '#D4AF37'
                      : isActiveForPiece
                      ? '#D4AF37'
                      : theme.hex,
                  }}
                  className={`group relative tcg-card w-[78px] h-[116px] sm:w-[84px] sm:h-[122px] rounded-[7px] p-1.5 flex flex-col justify-between transition-all duration-200 select-none ${
                    cardIdx > 0 ? '-ml-3.5 sm:-ml-4' : 'ml-0'
                  } ${
                    isSelected
                      ? `z-30 -translate-y-3 scale-[1.18] rotate-0 bg-[#282B2E] border-2 shadow-[0_12px_24px_rgba(0,0,0,0.8),0_0_12px_rgba(212,175,55,0.6)] cursor-pointer`
                      : isActiveForPiece
                      ? `z-20 -translate-y-2 scale-[1.12] rotate-0 bg-[#282B2E] border-2 shadow-[0_10px_20px_rgba(0,0,0,0.7),0_0_12px_rgba(212,175,55,0.5)] cursor-pointer`
                      : isHovered
                      ? `z-25 -translate-y-2.5 scale-[1.14] rotate-0 bg-[#282B2E] border-2 shadow-[0_10px_20px_rgba(0,0,0,0.7)] cursor-pointer`
                      : isDimmed
                      ? `${fanRotation} bg-[#191B1D] opacity-40 border cursor-pointer`
                      : isAvailable
                      ? `${fanRotation} bg-[#24272A] border hover:border-[#D4AF37] hover:-translate-y-3.5 hover:scale-[1.18] hover:rotate-0 hover:z-30 hover:shadow-[0_12px_24px_rgba(0,0,0,0.8),0_0_10px_rgba(212,175,55,0.4)] cursor-pointer`
                      : `${fanRotation} bg-[#141618] opacity-25 border border-dashed border-[rgba(139,126,116,0.2)] cursor-not-allowed`
                  }`}
                >
                  {/* Top: Piece Glyphs + Name & Code */}
                  <div className="w-full flex items-center justify-between gap-1 leading-none">
                    <div className="flex items-center gap-1 min-w-0">
                      <span style={{ color: theme.hex }} className="text-[11px] font-bold flex-shrink-0">
                        {theme.badgeIcon}
                      </span>
                      <span
                        style={{ color: isAvailable || isSelected ? '#FAF9F6' : '#8B7E74' }}
                        className="text-[9px] font-bold truncate leading-none"
                      >
                        {card.name}
                      </span>
                    </div>
                    {card.code && (
                      <span
                        style={{ color: theme.hex, borderColor: `${theme.hex}60` }}
                        className="text-[8px] font-mono font-bold px-1 py-0.2 rounded border bg-[#141618] leading-none flex-shrink-0"
                      >
                        {card.code}
                      </span>
                    )}
                  </div>

                  {/* Center: Placeholder Art Window / Mini-Board Visual Explainer */}
                  <div className="w-full my-auto">
                    {/* Default Art View: Centered CardArt Illustration */}
                    <div
                      className={`w-full h-[40px] rounded-[4px] bg-[#141618] border border-[rgba(139,126,116,0.2)] flex items-center justify-center relative overflow-hidden ${
                        isSelected || isActiveForPiece ? 'hidden' : 'flex group-hover:hidden'
                      }`}
                    >
                      <CardArt anchor={card.anchor} artId={card.artId} cardName={card.name} />
                    </div>

                    {/* Hover/Active View: 5x4 Mini-Board Schematic */}
                    <div
                      data-testid="tcg-mini-board"
                      className={`w-full h-[40px] rounded-[4px] bg-[#141618] border border-[rgba(212,175,55,0.4)] flex items-center justify-center p-0.5 ${
                        isSelected || isActiveForPiece ? 'flex' : 'hidden group-hover:flex'
                      }`}
                    >
                      <div className="grid grid-cols-5 gap-0.5 w-[54px] h-[34px]">
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

                  {/* Bottom: Rules Box (Zero-Ellipsis Rule: completely wraps) */}
                  <div className="w-full flex flex-col justify-end">
                    <p
                      style={{ color: theme.hex }}
                      className="text-[6.5px] font-mono font-bold uppercase tracking-wider truncate text-center leading-none"
                    >
                      {conditionLabel}
                    </p>
                    <p className="text-[7.5px] text-[#FAF9F6]/90 leading-tight text-center mt-0.5">
                      {card.effectText || card.description}
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
