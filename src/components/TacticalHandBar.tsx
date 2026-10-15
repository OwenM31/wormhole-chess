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
  onSelectCard,
  onCancelTargeting,
}) => {
  // Render guidance banner text depending on stage
  let stageGuidance = '';
  if (selectedCard) {
    if (targetingStage === 'pick_anchor') {
      stageGuidance = `Select a friendly ${selectedCard.anchor.toUpperCase()} on the board to activate [${selectedCard.name}]`;
    } else if (targetingStage === 'pick_target') {
      stageGuidance = `Choose target square for [${selectedCard.name}]`;
    } else if (targetingStage === 'pick_secondary') {
      stageGuidance = `Choose secondary destination for [${selectedCard.name}]`;
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-2 p-3 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md">
      {/* Top Header: Energy Meter & Targeting Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        {/* 3-cell glowing energy counter */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
          <span className="text-amber-400 font-bold text-sm tracking-wide flex items-center gap-1">
            ⚡ ENERGY:
          </span>
          <div className="flex gap-1.5 items-center">
            {[1, 2, 3].map((cell) => {
              const isFilled = cell <= energy;
              return (
                <div
                  key={cell}
                  className={`w-7 h-4 rounded-md transition-all duration-300 border ${
                    isFilled
                      ? 'bg-amber-400 border-amber-300 shadow-[0_0_10px_#f59e0b]'
                      : 'bg-slate-700/40 border-slate-600/50'
                  }`}
                />
              );
            })}
          </div>
          <span className="text-xs font-mono font-bold text-slate-300 ml-1">
            {energy} / 3
          </span>
        </div>

        {/* Guidance / Status Bar */}
        <div className="flex-1 flex items-center justify-end gap-2 text-xs">
          {selectedCard ? (
            <div className="flex items-center gap-2 bg-purple-950/80 border border-purple-500/60 px-3 py-1 rounded-xl animate-pulse">
              <span className="text-purple-300 font-medium">🎯 {stageGuidance}</span>
              <button
                onClick={onCancelTargeting}
                className="px-2 py-0.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : hasPlayedCardThisTurn ? (
            <span className="text-amber-400/90 font-mono bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg">
              Card window used. Move a chess piece to finish your turn.
            </span>
          ) : !isMyTurn ? (
            <span className="text-slate-400 font-mono">Opponent's turn</span>
          ) : (
            <span className="text-slate-400 font-mono hidden sm:inline">
              Tactical Hand: 1 card play allowed in PRE_MOVE_WINDOW
            </span>
          )}
        </div>
      </div>

      {/* Card Rack: Displays 8 Tactical Cards */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-1">
        {initialDeck.map((cardId) => {
          const card = getCardById(cardId);
          if (!card) return null;

          const isAvailable = hand.includes(cardId);
          const isSelected = selectedCard?.id === cardId;
          const canAfford = energy >= card.energyCost;
          const isPlayable = isMyTurn && isAvailable && !hasPlayedCardThisTurn && canAfford;

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
              style={{
                borderColor: isSelected
                  ? '#a855f7'
                  : isPlayable
                  ? theme.hex
                  : '#334155',
              }}
              className={`group relative flex flex-col justify-between p-2 rounded-xl border-2 transition-all duration-200 select-none ${
                isSelected
                  ? 'bg-purple-900/60 shadow-[0_0_15px_#a855f7] scale-105 z-10 cursor-pointer'
                  : isPlayable
                  ? 'bg-slate-800/90 hover:bg-slate-700/90 hover:scale-102 hover:shadow-lg cursor-pointer'
                  : !isAvailable
                  ? 'bg-slate-950/70 opacity-35 cursor-not-allowed border-dashed'
                  : 'bg-slate-900/60 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Header: Cost and Badge */}
              <div className="flex items-center justify-between">
                <span
                  style={{ color: theme.hex }}
                  className="text-sm font-bold leading-none drop-shadow"
                >
                  {theme.badgeIcon}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    canAfford
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  ⚡{card.energyCost}
                </span>
              </div>

              {/* Title */}
              <div className="my-1.5 text-center">
                <p
                  style={{ color: isPlayable || isSelected ? theme.hex : '#94a3b8' }}
                  className="text-[11px] font-bold leading-tight line-clamp-1 group-hover:line-clamp-none transition-all"
                >
                  {card.name}
                </p>
                <p className="text-[9px] text-slate-400 capitalize">{card.anchor}</p>
              </div>

              {/* Status / Consumed Tag */}
              <div className="text-center">
                {!isAvailable ? (
                  <span className="text-[9px] uppercase font-mono text-slate-500 font-semibold">
                    USED
                  </span>
                ) : isSelected ? (
                  <span className="text-[9px] uppercase font-mono text-purple-300 font-bold">
                    ACTIVE
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-slate-400">
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
