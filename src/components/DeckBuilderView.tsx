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
    <div className="w-full max-w-6xl mx-auto p-3 sm:p-5 flex flex-col gap-5 text-[#FAF9F6]">
      {/* Top Banner & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#24272A] p-4 rounded-md border border-[rgba(139,126,116,0.25)] shadow-xl">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#FAF9F6]">
            Deck Loadout
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          {onBackToBattle && (
            <button
              onClick={onBackToBattle}
              className="px-3 py-1.5 bg-[#191B1D] hover:bg-[#282B2E] text-[#FAF9F6] rounded text-xs font-medium transition-colors cursor-pointer border border-[rgba(139,126,116,0.3)]"
            >
              Back to Arena
            </button>
          )}
          <button
            onClick={handleResetStarter}
            className="px-3 py-1.5 bg-[#191B1D] hover:bg-[#282B2E] text-[#D4AF37] rounded text-xs font-medium transition-colors cursor-pointer border border-[#D4AF37]/40"
          >
            Reset Starter
          </button>
          <button
            onClick={handleSave}
            disabled={!validation.isValid}
            className={`px-4 py-1.5 rounded text-xs font-bold transition-colors shadow cursor-pointer ${
              validation.isValid
                ? 'bg-[#4C5C4C] hover:bg-[#5C6C5C] text-[#FAF9F6]'
                : 'bg-[#191B1D] text-[#8B7E74] cursor-not-allowed border border-[rgba(139,126,116,0.2)]'
            }`}
          >
            Save Loadout
          </button>
        </div>
      </div>

      {/* Validation / Save Alert */}
      {saveMessage && (
        <div
          className={`p-2.5 rounded-md border text-xs font-medium ${
            saveMessage.includes('cloud') ||
            saveMessage.includes('locally') ||
            saveMessage.includes('successfully') ||
            saveMessage.includes('Reset')
              ? 'bg-[#4C5C4C]/30 border-[#4C5C4C] text-[#FAF9F6]'
              : 'bg-[#AA4A44]/30 border-[#AA4A44] text-[#FAF9F6]'
          }`}
        >
          {saveMessage}
        </div>
      )}

      {/* Equipped Loadout Rack */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B7E74]">
            Equipped Loadout (Click to remove)
          </h3>
          <div className="flex items-center gap-2">
            {!validation.isValid && (
              <span className="text-xs font-medium text-[#AA4A44] flex items-center gap-1">
                ⚠️ {validation.error}
              </span>
            )}
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                selectedIds.length === 8
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50'
                  : 'bg-[#AA4A44]/20 text-[#AA4A44] border border-[#AA4A44]/50'
              }`}
            >
              {selectedIds.length} / 8 Cards Equipped
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
          {Array.from({ length: 8 }).map((_, idx) => {
            const card = selectedCards[idx];
            if (!card) {
              return (
                <div
                  key={`empty_${idx}`}
                  className="h-28 rounded-md border-2 border-dashed border-[rgba(139,126,116,0.2)] bg-[#141618] flex flex-col items-center justify-center p-2 text-center text-[#8B7E74]"
                >
                  <span className="text-xl opacity-60">+</span>
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
                className="group relative h-28 p-2 rounded-md border-2 bg-[#1C1E20] hover:bg-[#AA4A44]/20 hover:border-[#AA4A44] transition-all cursor-pointer flex flex-col justify-between shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: theme.hex }} className="text-base font-bold">
                    {theme.badgeIcon}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
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
                  <p className="text-[11px] font-bold text-[#AA4A44] hidden group-hover:block">
                    Click to Remove
                  </p>
                </div>

                <div className="text-center">
                  <span className="text-[9px] font-mono text-[#8B7E74] capitalize">
                    {card.anchor}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Library Filter Tabs */}
      <div className="flex flex-col gap-3 mt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(139,126,116,0.2)] pb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B7E74]">
            Card Library
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {anchors.map((anchor) => (
              <button
                key={anchor}
                onClick={() => setFilterAnchor(anchor)}
                className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  filterAnchor === anchor
                    ? 'bg-[#D4AF37] text-[#141618] font-bold'
                    : 'bg-[#24272A] text-[#8B7E74] hover:text-[#FAF9F6] border border-[rgba(139,126,116,0.2)]'
                }`}
              >
                {anchor}
              </button>
            ))}
          </div>
        </div>

        {/* Library Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-1">
          {filteredLibrary.map((card) => {
            const isEquipped = selectedIds.includes(card.id);
            const theme = PIECE_COLOR_THEMES[card.anchor];

            return (
              <div
                key={card.id}
                style={{ borderColor: isEquipped ? theme.hex : 'rgba(139, 126, 116, 0.25)' }}
                className={`flex flex-col justify-between p-3.5 rounded-md border transition-all duration-200 ${
                  isEquipped
                    ? 'bg-[#24272A] shadow-lg'
                    : 'bg-[#191B1D] hover:bg-[#24272A] border-[rgba(139,126,116,0.2)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      style={{ color: theme.hex }}
                      className="text-base font-bold flex items-center gap-1.5"
                    >
                      <span>{theme.badgeIcon}</span>
                      <span className="text-xs uppercase font-mono tracking-wider">
                        {card.anchor}
                      </span>
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                      ⚡ {card.energyCost} Energy
                    </span>
                  </div>

                  <h4
                    style={{ color: theme.hex }}
                    className="text-sm font-bold mt-2 leading-snug"
                  >
                    {card.name}
                  </h4>

                  <p className="text-xs text-[#FAF9F6]/90 mt-1.5 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[rgba(139,126,116,0.2)] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#8B7E74]">
                    {card.tradeoff ? `Tradeoff: ${card.tradeoff}` : 'No tradeoff'}
                  </span>
                  <button
                    onClick={() => toggleCard(card.id)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                      isEquipped
                        ? 'bg-[#AA4A44]/20 hover:bg-[#AA4A44]/40 text-[#AA4A44] border border-[#AA4A44]/50'
                        : 'bg-[#4C5C4C] hover:bg-[#5C6C5C] text-[#FAF9F6]'
                    }`}
                  >
                    {isEquipped ? 'Remove' : 'Equip'}
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
