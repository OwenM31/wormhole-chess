import React, { useState, useEffect } from 'react';
import { CardDefinition, PieceAnchor } from '../types/deckChess';
import {
  EXPANDED_LIBRARY,
  PIECE_COLOR_THEMES,
  STARTER_DECK,
  validateDeckLoadout,
  getCardById,
} from '../engine/cardGraph';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export interface DeckBuilderViewProps {
  initialDeck?: string[];
  onSaveDeck: (deckIds: string[]) => void;
  onBackToBattle?: () => void;
}

const STORAGE_KEY = 'deck_builder_loadout_v1';

export const DeckBuilderView: React.FC<DeckBuilderViewProps> = ({
  initialDeck,
  onSaveDeck,
  onBackToBattle,
}) => {
  const { user } = useAuth();

  // Load saved deck or fallback to starter deck
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (initialDeck && initialDeck.length === 8) return initialDeck;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 8) {
          return parsed;
        }
      } catch (e) {
        // Fallback
      }
    }
    return STARTER_DECK.map((c) => c.id);
  });

  const [filterAnchor, setFilterAnchor] = useState<PieceAnchor | 'all'>('all');
  const [activePreviewCard, setActivePreviewCard] = useState<CardDefinition | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Sync from cloud on mount if authenticated
  useEffect(() => {
    let isMounted = true;
    async function fetchCloudDecks() {
      if (!user || user.isGuest) return;
      try {
        const res = await api.getCustomDecks();
        if (isMounted && res.success && res.decks && res.decks.length > 0) {
          const activeDeck = res.decks.find((d) => d.isActive) || res.decks[0];
          if (activeDeck && activeDeck.cardIds && activeDeck.cardIds.length === 8) {
            setSelectedIds(activeDeck.cardIds);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(activeDeck.cardIds));
            onSaveDeck(activeDeck.cardIds);
            setSaveMessage('☁️ Loaded active loadout from cloud');
            setTimeout(() => setSaveMessage(null), 3000);
          }
        }
      } catch (err) {
        // Fallback to localStorage load
      }
    }
    fetchCloudDecks();
    return () => {
      isMounted = false;
    };
  }, [user, onSaveDeck]);

  // Selected cards converted to CardDefinition array
  const selectedCards = selectedIds
    .map((id) => getCardById(id))
    .filter((c): c is CardDefinition => !!c);

  const validation = validateDeckLoadout(selectedCards);

  const toggleCard = (cardId: string) => {
    setSaveMessage(null);
    if (selectedIds.includes(cardId)) {
      setSelectedIds(selectedIds.filter((id) => id !== cardId));
    } else {
      if (selectedIds.length >= 8) {
        setSaveMessage('Deck is already full (maximum 8 cards). Remove a card first.');
        return;
      }
      setSelectedIds([...selectedIds, cardId]);
    }
  };

  const handleResetStarter = () => {
    const starterIds = STARTER_DECK.map((c) => c.id);
    setSelectedIds(starterIds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(starterIds));
    onSaveDeck(starterIds);
    setSaveMessage('Reset to balanced Starter Deck!');
  };

  const handleSave = async () => {
    if (!validation.isValid) {
      setSaveMessage(validation.error || 'Invalid deck loadout');
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    onSaveDeck(selectedIds);

    if (user && !user.isGuest) {
      try {
        setSaveMessage('Syncing to cloud...');
        const res = await api.saveCustomDeck({
          deckName: 'Active Loadout',
          cardIds: selectedIds,
          isActive: true,
        });
        if (res.success) {
          setSaveMessage('☁️ Deck synced to cloud & activated!');
        } else {
          setSaveMessage('💾 Saved locally');
        }
      } catch (err) {
        setSaveMessage('💾 Saved locally (cloud sync offline)');
      }
    } else {
      setSaveMessage('💾 Saved locally (Guest mode)');
    }
  };

  // Filter available library
  const filteredLibrary = EXPANDED_LIBRARY.filter((card) => {
    if (filterAnchor === 'all') return true;
    return card.anchor === filterAnchor;
  });

  const anchors: (PieceAnchor | 'all')[] = [
    'all',
    'pawn',
    'knight',
    'bishop',
    'rook',
    'queen',
    'king',
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex flex-col gap-6 text-slate-100">
      {/* Top Banner & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-700/80 shadow-xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-purple-300 to-sky-400 bg-clip-text text-transparent">
            Tactical Deck Forge
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Curate your 8-card battle loadout. Cards can be activated during your pre-move window.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onBackToBattle && (
            <button
              onClick={onBackToBattle}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition-all cursor-pointer border border-slate-700"
            >
              ← Back to Battle
            </button>
          )}
          <button
            onClick={handleResetStarter}
            className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-amber-300 rounded-xl text-sm font-semibold transition-all cursor-pointer border border-amber-500/30"
          >
            Reset to Starter
          </button>
          <button
            onClick={handleSave}
            disabled={!validation.isValid}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg cursor-pointer ${
              validation.isValid
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-900/40'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            Save & Activate Deck
          </button>
        </div>
      </div>

      {/* Validation / Save Alert */}
      {saveMessage && (
        <div
          className={`p-3 rounded-xl border text-sm font-medium ${
            saveMessage.includes('cloud') ||
            saveMessage.includes('locally') ||
            saveMessage.includes('successfully') ||
            saveMessage.includes('Reset')
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
          }`}
        >
          {saveMessage}
        </div>
      )}

      {/* Loadout Status Bar */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-300">Active Loadout:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
              selectedIds.length === 8
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-900/60 text-amber-300 border border-amber-500/40'
            }`}
          >
            {selectedIds.length} / 8 Cards Selected
          </span>
        </div>

        {!validation.isValid && (
          <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
            ⚠️ {validation.error}
          </span>
        )}
      </div>

      {/* Active 8-Card Rack */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Currently Equipped (Click to remove)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, idx) => {
            const card = selectedCards[idx];
            if (!card) {
              return (
                <div
                  key={`empty_${idx}`}
                  className="h-28 rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/40 flex flex-col items-center justify-center p-2 text-center text-slate-600"
                >
                  <span className="text-xl">+</span>
                  <span className="text-[10px] font-mono mt-1">Empty Slot</span>
                </div>
              );
            }

            const theme = PIECE_COLOR_THEMES[card.anchor];

            return (
              <div
                key={card.id}
                onClick={() => toggleCard(card.id)}
                style={{ borderColor: theme.hex }}
                className="group relative h-28 p-2 rounded-xl border-2 bg-slate-900/90 hover:bg-rose-950/40 hover:border-rose-500 transition-all cursor-pointer flex flex-col justify-between shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: theme.hex }} className="text-base font-bold">
                    {theme.badgeIcon}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    ⚡{card.energyCost}
                  </span>
                </div>

                <div className="text-center my-1">
                  <p
                    style={{ color: theme.hex }}
                    className="text-[11px] font-bold leading-tight group-hover:hidden line-clamp-2"
                  >
                    {card.name}
                  </p>
                  <p className="text-[11px] font-bold text-rose-400 hidden group-hover:block">
                    Click to Remove
                  </p>
                </div>

                <div className="text-center">
                  <span className="text-[9px] font-mono text-slate-400 capitalize">
                    {card.anchor}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Library Filter Tabs */}
      <div className="flex flex-col gap-3 mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Card Catalog Library
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {anchors.map((anchor) => (
              <button
                key={anchor}
                onClick={() => setFilterAnchor(anchor)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  filterAnchor === anchor
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {anchor}
              </button>
            ))}
          </div>
        </div>

        {/* Library Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {filteredLibrary.map((card) => {
            const isEquipped = selectedIds.includes(card.id);
            const theme = PIECE_COLOR_THEMES[card.anchor];

            return (
              <div
                key={card.id}
                style={{ borderColor: isEquipped ? theme.hex : '#334155' }}
                className={`flex flex-col justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                  isEquipped
                    ? 'bg-slate-900/90 shadow-lg'
                    : 'bg-slate-950/60 hover:bg-slate-900/70 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      style={{ color: theme.hex }}
                      className="text-lg font-bold flex items-center gap-1.5"
                    >
                      <span>{theme.badgeIcon}</span>
                      <span className="text-xs uppercase font-mono tracking-wider">
                        {card.anchor}
                      </span>
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                      ⚡ {card.energyCost} Energy
                    </span>
                  </div>

                  <h4
                    style={{ color: theme.hex }}
                    className="text-base font-bold mt-2 leading-snug"
                  >
                    {card.name}
                  </h4>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500">
                    {card.tradeoff ? `Tradeoff: ${card.tradeoff}` : 'No tradeoff'}
                  </span>
                  <button
                    onClick={() => toggleCard(card.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isEquipped
                        ? 'bg-rose-900/70 hover:bg-rose-800 text-rose-200 border border-rose-700/50'
                        : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md'
                    }`}
                  >
                    {isEquipped ? 'Remove' : 'Equip Card'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
