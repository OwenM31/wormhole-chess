import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerProfiles } from '../hooks/usePlayerProfiles';
import { CANONICAL_36_CARDS, PIECE_COLOR_THEMES } from '../engine/cards/releaseRoster36';
import { CardDefinition, PieceAnchor, PieceColor } from '../types/deckChess';
import { PlayingCard } from './PlayingCard';

export interface OfflineMatchConfig {
  playerColor: PieceColor;
  aiDifficulty: 'easy' | 'medium' | 'tactical';
  handSize: number;
  aiDeckMode: 'random' | 'mirror' | 'towny';
}

export interface MultiplayerCharacterStageProps {
  onBackToMenu: () => void;
  onStartOfflineMatch?: (config: OfflineMatchConfig) => void;
  onSearchOpponent?: () => void;
  onOpenPrivateMatch?: () => void;
  onOpenAsyncMatches?: () => void;
  profilesHook?: ReturnType<typeof usePlayerProfiles>;
}

const CARD_LOOKUP = new Map(CANONICAL_36_CARDS.map((c) => [c.id, c]));

type SortOption = 'playbook' | 'piece' | 'world' | 'name';

export const MultiplayerCharacterStage: React.FC<MultiplayerCharacterStageProps> = ({
  onBackToMenu,
  onStartOfflineMatch,
  onSearchOpponent,
  onOpenPrivateMatch,
  onOpenAsyncMatches,
  profilesHook,
}) => {
  const navigate = useNavigate();
  const internalHook = usePlayerProfiles();
  const hook = profilesHook || internalHook;
  const {
    activeSlotId,
    activeProfile,
    setHandSize,
    getMaxCopiesForCard,
    getEquippedCopiesForCard,
    equipCard,
    unequipCardAtIndex,
    clearHand,
    autoFillHand,
    randomizeHand,
  } = hook;

  // Modals / Status overlays
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showMatchmakingStatus, setShowMatchmakingStatus] = useState(false);
  const [showPrivateModal, setShowPrivateModal] = useState(false);
  const [showAsyncModal, setShowAsyncModal] = useState(false);
  const [privateCodeInput, setPrivateCodeInput] = useState('');
  const [privateTimeControl, setPrivateTimeControl] = useState<'3+0' | '5+0' | '10+0' | 'untimed'>('5+0');

  // Offline Match Configuration state
  const [offlineColor, setOfflineColor] = useState<PieceColor>('w');
  const [offlineDifficulty, setOfflineDifficulty] = useState<'easy' | 'medium' | 'tactical'>('medium');
  const [offlineHandSize, setOfflineHandSize] = useState<number>(activeProfile.handSize || 8);
  const [offlineAiDeck, setOfflineAiDeck] = useState<'random' | 'mirror' | 'towny'>('random');

  // Filter & Sort state for the 36-card library
  const [filterAnchor, setFilterAnchor] = useState<PieceAnchor | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('playbook');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast / feedback message
  const [feedback, setFeedback] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  // Filter & Sort cards
  const displayedCards = useMemo(() => {
    let list = CANONICAL_36_CARDS.filter((card) => {
      if (filterAnchor !== 'all' && card.anchor !== filterAnchor) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = card.name.toLowerCase().includes(query);
        const matchesCode = (card.code || '').toLowerCase().includes(query);
        const matchesDesc = (card.description || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesDesc) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'world') {
        const wA = a.world ?? 1;
        const wB = b.world ?? 1;
        if (wA !== wB) return wA - wB;
        return (a.code || '').localeCompare(b.code || '');
      }
      if (sortBy === 'piece') {
        const order: Record<PieceAnchor, number> = { pawn: 1, knight: 2, bishop: 3, rook: 4, queen: 5, king: 6 };
        const diff = (order[a.anchor] || 0) - (order[b.anchor] || 0);
        if (diff !== 0) return diff;
        return (a.code || '').localeCompare(b.code || '');
      }
      // 'playbook' default
      return 0;
    });

    return list;
  }, [filterAnchor, sortBy, searchQuery]);

  // Handle Equipping card
  const handleCardClick = (card: CardDefinition) => {
    const maxCopies = getMaxCopiesForCard(card.id);
    const equippedCopies = getEquippedCopiesForCard(card.id);

    if (equippedCopies >= maxCopies) {
      showNotification(`Maximum copies reached for ${card.code} (${maxCopies} max)`);
      return;
    }
    if (activeProfile.equippedHand.length >= activeProfile.handSize) {
      showNotification(`Hand is full (${activeProfile.handSize}/${activeProfile.handSize})`);
      return;
    }

    const ok = equipCard(card.id);
    if (!ok) {
      showNotification(`Could not equip ${card.name}`);
    }
  };

  const handleLaunchOffline = () => {
    setShowOfflineModal(false);
    if (onStartOfflineMatch) {
      onStartOfflineMatch({
        playerColor: offlineColor,
        aiDifficulty: offlineDifficulty,
        handSize: offlineHandSize,
        aiDeckMode: offlineAiDeck,
      });
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 54px)',
        backgroundColor: '#191B1D',
        color: '#FAF9F6',
        display: 'flex',
        flexDirection: 'column',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
      }}
    >
      {/* Upper Atmospheric Castle Background Header */}
      <div
        style={{
          position: 'relative',
          backgroundColor: '#2D3033',
          borderBottom: '1px solid rgba(140, 109, 83, 0.35)',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          zIndex: 20,
        }}
      >
        {/* Left: Back to Main Menu Button & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={onBackToMenu}
            data-testid="stage-back-to-menu-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              backgroundColor: '#1A1C1E',
              color: '#FAF9F6',
              border: '1px solid rgba(140, 109, 83, 0.3)',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#D4AF37';
              e.currentTarget.style.backgroundColor = '#2C3034';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(140, 109, 83, 0.3)';
              e.currentTarget.style.backgroundColor = '#1A1C1E';
            }}
          >
            <span>←</span> Main Menu
          </button>

          {/* Matchmaking Lobby Title / Breadcrumb */}
          <div
            data-testid="matchmaking-lobby-title"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#FAF9F6',
              fontWeight: 700,
              fontSize: '0.95rem',
              letterSpacing: '-0.01em',
            }}
          >
            <span style={{ color: '#D4AF37' }}>⚔️</span>
            <span>Deck Builder Matchmaking</span>
          </div>

          {/* Active Profile Telemetry Capsule */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.75rem',
              backgroundColor: '#1A1C1E',
              border: '1px solid rgba(140, 109, 83, 0.25)',
              borderRadius: '4px',
              fontSize: '0.8rem',
            }}
          >
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '0.1rem 0.35rem',
                backgroundColor: '#4D7C4D',
                color: '#FAF9F6',
                borderRadius: '2px',
              }}
            >
              {activeSlotId.replace('_', ' ')}
            </span>
            <span style={{ fontWeight: 600 }}>{activeProfile.name}</span>
            <span style={{ color: '#8B7E74' }}>·</span>
            <span style={{ color: '#D4AF37' }}>🪙 {activeProfile.gold}</span>
          </div>
        </div>

        {/* Top-Right Play Action Cluster */}
        <div
          data-testid="stage-play-actions"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Offline Match */}
          <button
            type="button"
            onClick={() => setShowOfflineModal(true)}
            data-testid="stage-offline-match-btn"
            style={{
              padding: '0.55rem 0.95rem',
              backgroundColor: '#4C5C4C',
              color: '#FAF9F6',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5C6C5C';
              e.currentTarget.style.borderColor = '#D4AF37';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4C5C4C';
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
            }}
          >
            <span>🤖</span> Offline Match
          </button>

          {/* Search for Opponent */}
          <button
            type="button"
            onClick={() => {
              setShowMatchmakingStatus(true);
              if (onSearchOpponent) onSearchOpponent();
            }}
            data-testid="stage-search-opponent-btn"
            style={{
              padding: '0.55rem 0.95rem',
              backgroundColor: '#24272A',
              color: '#FAF9F6',
              border: '1px solid rgba(139, 126, 116, 0.25)',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>⚔️</span> Search Opponent
          </button>

          {/* Private Match */}
          <button
            type="button"
            onClick={() => {
              setShowPrivateModal(true);
              if (onOpenPrivateMatch) onOpenPrivateMatch();
            }}
            data-testid="stage-private-match-btn"
            style={{
              padding: '0.55rem 0.85rem',
              backgroundColor: '#1C1E20',
              color: '#FAF9F6',
              border: '1px solid rgba(139, 126, 116, 0.2)',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Private Match
          </button>

          {/* Async Matches */}
          <button
            type="button"
            onClick={() => {
              setShowAsyncModal(true);
              if (onOpenAsyncMatches) onOpenAsyncMatches();
            }}
            data-testid="stage-async-matches-btn"
            style={{
              padding: '0.55rem 0.85rem',
              backgroundColor: '#1C1E20',
              color: '#8B7E74',
              border: '1px solid rgba(139, 126, 116, 0.2)',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Async Matches
          </button>
        </div>
      </div>

      {/* Floating Feedback Toast */}
      {feedback && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            right: '24px',
            zIndex: 100,
            padding: '0.65rem 1rem',
            backgroundColor: '#24272A',
            border: '1px solid #D4AF37',
            color: '#FAF9F6',
            borderRadius: '4px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          {feedback}
        </div>
      )}

      {/* Character Focal Backdrop Stage (Compact Living Piece Room) */}
      <div
        data-testid="character-backdrop-stage"
        style={{
          position: 'relative',
          backgroundColor: '#1A1C1E',
          borderBottom: '1px solid rgba(140, 109, 83, 0.35)',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundImage:
            'linear-gradient(180deg, rgba(45, 48, 51, 0.78) 0%, rgba(26, 28, 30, 0.92) 100%), url(/assets/backgrounds/village-backdrop.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 50%',
        }}
      >
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0.25,
            pointerEvents: 'none',
          }}
          viewBox="0 0 1000 200"
          preserveAspectRatio="xMidYMid slice"
        >
          <g stroke="#4C5C4C" strokeWidth="1" strokeOpacity="0.4">
            <line x1="500" y1="20" x2="100" y2="200" />
            <line x1="500" y1="20" x2="300" y2="200" />
            <line x1="500" y1="20" x2="500" y2="200" />
            <line x1="500" y1="20" x2="700" y2="200" />
            <line x1="500" y1="20" x2="900" y2="200" />
            <line x1="200" y1="120" x2="800" y2="120" />
            <line x1="120" y1="160" x2="880" y2="160" />
          </g>
        </svg>

        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          {/* Mini Pedestal Silhouette */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#141618',
              border: '2px solid #D4AF37',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(212, 175, 55, 0.25)',
              overflow: 'hidden',
            }}
          >
            <img
              src="/assets/characters/wooden-pawn-portrait.png"
              alt="Hero Portrait"
              data-testid="stage-hero-portrait"
              style={{
                width: '92%',
                height: '92%',
                objectFit: 'contain',
              }}
            />
          </div>

          <div>
            <div
              style={{
                fontSize: '0.7rem',
                color: '#D1CCC7',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Living Hero · Matchmaking Room
            </div>
            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#FAF9F6',
              }}
            >
              {activeProfile.name}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#8B7E74',
                marginTop: '0.15rem',
              }}
            >
              Material: <span style={{ color: '#FAF9F6' }}>{activeProfile.gear.material}</span> · Headgear:{' '}
              <span style={{ color: '#FAF9F6' }}>{activeProfile.gear.headgear}</span> · Base:{' '}
              <span style={{ color: '#FAF9F6' }}>{activeProfile.gear.base}</span>
            </div>
          </div>
        </div>
      </div>

      {/* LOWER STAGE: Equipped Hand Row & Filterable/Sortable 36-Card Library */}
      <div
        style={{
          flex: 1,
          padding: '1rem clamp(1rem, 2vw, 2rem)',
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {/* 1. Equipped Hand Row */}
        <div
          data-testid="equipped-hand-stage"
          style={{
            backgroundColor: '#24272A',
            border: '1px solid rgba(139, 126, 116, 0.25)',
            borderRadius: '6px',
            padding: '0.85rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: '#FAF9F6',
                }}
              >
                EQUIPPED HAND
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'ui-monospace, monospace',
                  color: '#D4AF37',
                  fontWeight: 700,
                }}
              >
                ({activeProfile.equippedHand.length}/{activeProfile.handSize})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Hand Size Selector */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  color: '#8B7E74',
                }}
              >
                <span>Hand Size:</span>
                <select
                  value={activeProfile.handSize}
                  onChange={(e) => setHandSize(Number(e.target.value))}
                  data-testid="hand-size-select"
                  style={{
                    backgroundColor: '#191B1D',
                    color: '#FAF9F6',
                    border: '1px solid rgba(139, 126, 116, 0.3)',
                    borderRadius: '3px',
                    padding: '0.2rem 0.4rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sz) => (
                    <option key={sz} value={sz}>
                      {sz} Cards
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Hand */}
              <button
                type="button"
                onClick={clearHand}
                data-testid="clear-hand-btn"
                style={{
                  padding: '0.25rem 0.6rem',
                  backgroundColor: '#1C1E20',
                  color: '#8B7E74',
                  border: '1px solid rgba(139, 126, 116, 0.2)',
                  borderRadius: '3px',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
              >
                Clear Hand
              </button>

              {/* Randomize / Shuffle (1 copy per card) */}
              <button
                type="button"
                onClick={randomizeHand}
                data-testid="randomize-hand-btn"
                style={{
                  padding: '0.25rem 0.65rem',
                  backgroundColor: '#4C5C4C',
                  color: '#FAF9F6',
                  border: '1px solid #D4AF37',
                  borderRadius: '3px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  boxShadow: '0 0 8px rgba(212, 175, 55, 0.25)',
                }}
                title="Randomize hand with unique cards (1 copy per card)"
              >
                <span>🎲</span> Randomize
              </button>

              {/* Auto-Fill */}
              <button
                type="button"
                onClick={autoFillHand}
                data-testid="autofill-hand-btn"
                style={{
                  padding: '0.25rem 0.6rem',
                  backgroundColor: '#3C493F',
                  color: '#FAF9F6',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '3px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Auto-Fill
              </button>
            </div>
          </div>

          {/* Equipped Slots Grid (8 Miniature 5:7 Portrait Playing Cards) */}
          <div
            data-testid="equipped-slots-grid"
            style={{
              display: 'grid',
              gridAutoFlow: 'column',
              gridAutoColumns: 'minmax(5.75rem, 1fr)',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              overscrollBehaviorX: 'contain',
              touchAction: 'pan-x',
              gap: '0.6rem',
              paddingBottom: '0.5rem',
            }}
          >
            {Array.from({ length: activeProfile.handSize }).map((_, idx) => {
              const cardId = activeProfile.equippedHand[idx];
              const card = cardId ? CARD_LOOKUP.get(cardId) : null;
              if (card) {
                return (
                  <PlayingCard
                    key={`${card.id}-${idx}`}
                    card={card}
                    size="equipped"
                    dataTestId={`equipped-slot-${idx}`}
                    onClick={() => unequipCardAtIndex(idx)}
                    onRemove={(e) => {
                      e.stopPropagation();
                      unequipCardAtIndex(idx);
                    }}
                  />
                );
              }
              return (
                <div
                  key={`empty-${idx}`}
                  style={{
                    scrollSnapAlign: 'start',
                    aspectRatio: '5 / 7',
                    backgroundColor: '#1C1E20',
                    border: '1.5px dashed rgba(139, 126, 116, 0.3)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6E665E',
                    fontSize: '0.72rem',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  Slot {idx + 1}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Filterable & Sortable 36-Card Library Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          {/* Piece Class Filter Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#1C1E20',
              borderRadius: '4px',
              padding: '2px',
              gap: '2px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { id: 'all', label: 'All (36)' },
              { id: 'pawn', label: '♟ Pawn (8)' },
              { id: 'knight', label: '♞ Knight (7)' },
              { id: 'bishop', label: '♝ Bishop (7)' },
              { id: 'rook', label: '♜ Rook (6)' },
              { id: 'queen', label: '♛ Queen (4)' },
              { id: 'king', label: '♚ King (4)' },
            ].map((tab) => {
              const active = filterAnchor === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterAnchor(tab.id as PieceAnchor | 'all')}
                  data-testid={`filter-tab-${tab.id}`}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '3px',
                    fontSize: '0.75rem',
                    fontWeight: active ? 700 : 500,
                    backgroundColor: active ? '#24272A' : 'transparent',
                    color: active ? '#FAF9F6' : '#8B7E74',
                    border: active ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Sort & Search Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Search 36 cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '0.35rem 0.6rem',
                backgroundColor: '#191B1D',
                border: '1px solid rgba(139, 126, 116, 0.25)',
                borderRadius: '3px',
                color: '#FAF9F6',
                fontSize: '0.75rem',
                width: '140px',
              }}
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              data-testid="sort-cards-select"
              style={{
                backgroundColor: '#191B1D',
                color: '#FAF9F6',
                border: '1px solid rgba(139, 126, 116, 0.25)',
                borderRadius: '3px',
                padding: '0.35rem 0.5rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <option value="playbook">By Playbook (P1–K4)</option>
              <option value="piece">By Piece Class</option>
              <option value="world">By World (W1–W7)</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* 3. 36-Card Library Grid (5:7 Portrait Playing Cards + External Top-Right Copy Blips) */}
        <div
          data-testid="cards-library-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(212px, 1fr))',
            gap: '1.25rem 0.9rem',
            justifyItems: 'center',
          }}
        >
          {displayedCards.map((card) => {
            const maxCopies = getMaxCopiesForCard(card.id);
            const equippedCopies = getEquippedCopiesForCard(card.id);

            return (
              <PlayingCard
                key={card.id}
                card={card}
                size="library"
                showExternalBlips={true}
                maxCopies={maxCopies}
                equippedCopies={equippedCopies}
                dataTestId={`library-card-${card.id}`}
                onClick={() => handleCardClick(card)}
              />
            );
          })}
        </div>
      </div>

      {/* MODAL 1: Offline Match Configurator */}
      {showOfflineModal && (
        <div
          data-testid="offline-match-modal"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowOfflineModal(false)}
        >
          <div
            style={{
              backgroundColor: '#24272A',
              border: '1px solid rgba(139, 126, 116, 0.3)',
              borderRadius: '6px',
              width: '100%',
              maxWidth: '460px',
              padding: '1.5rem',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  Configure Offline Match
                </h2>
                <div style={{ fontSize: '0.75rem', color: '#8B7E74', marginTop: '0.15rem' }}>
                  Solo match vs Tactical Chess Engine AI
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOfflineModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8B7E74',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Config Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Color */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8B7E74', marginBottom: '0.35rem' }}>
                  PLAYER COLOR
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setOfflineColor('w')}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: offlineColor === 'w' ? '#3C493F' : '#1C1E20',
                      border: offlineColor === 'w' ? '1px solid #D4AF37' : '1px solid rgba(139, 126, 116, 0.2)',
                      borderRadius: '4px',
                      color: '#FAF9F6',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    ⚪ White (First)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfflineColor('b')}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: offlineColor === 'b' ? '#3C493F' : '#1C1E20',
                      border: offlineColor === 'b' ? '1px solid #D4AF37' : '1px solid rgba(139, 126, 116, 0.2)',
                      borderRadius: '4px',
                      color: '#FAF9F6',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    ⚫ Black (Second)
                  </button>
                </div>
              </div>

              {/* AI Difficulty */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8B7E74', marginBottom: '0.35rem' }}>
                  AI DIFFICULTY
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                  {(['easy', 'medium', 'tactical'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setOfflineDifficulty(diff)}
                      style={{
                        padding: '0.45rem',
                        textTransform: 'capitalize',
                        backgroundColor: offlineDifficulty === diff ? '#4C5C4C' : '#1C1E20',
                        border: offlineDifficulty === diff ? '1px solid #D4AF37' : '1px solid rgba(139, 126, 116, 0.2)',
                        borderRadius: '4px',
                        color: '#FAF9F6',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hand Size */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8B7E74', marginBottom: '0.35rem' }}>
                  HAND SIZE (1–8)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <select
                    value={offlineHandSize}
                    onChange={(e) => setOfflineHandSize(Number(e.target.value))}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      backgroundColor: '#191B1D',
                      border: '1px solid rgba(139, 126, 116, 0.3)',
                      borderRadius: '4px',
                      color: '#FAF9F6',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        {s} Cards Hand
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AI Deck Mode */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8B7E74', marginBottom: '0.35rem' }}>
                  AI DECK LOADOUT
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                  {[
                    { id: 'random', label: 'Random 8-Card' },
                    { id: 'mirror', label: 'Mirror My Hand' },
                    { id: 'towny', label: 'Towny (0-Card)' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setOfflineAiDeck(mode.id as any)}
                      style={{
                        padding: '0.45rem',
                        backgroundColor: offlineAiDeck === mode.id ? '#4C5C4C' : '#1C1E20',
                        border: offlineAiDeck === mode.id ? '1px solid #D4AF37' : '1px solid rgba(139, 126, 116, 0.2)',
                        borderRadius: '4px',
                        color: '#FAF9F6',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowOfflineModal(false)}
                style={{
                  padding: '0.6rem 1rem',
                  backgroundColor: '#191B1D',
                  color: '#8B7E74',
                  border: '1px solid rgba(139, 126, 116, 0.2)',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunchOffline}
                data-testid="start-offline-match-btn"
                style={{
                  padding: '0.6rem 1.25rem',
                  backgroundColor: '#4C5C4C',
                  color: '#FAF9F6',
                  border: '1px solid #D4AF37',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ⚔️ Start Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Search for Opponent Matchmaking Status */}
      {showMatchmakingStatus && (
        <div
          data-testid="matchmaking-status-modal"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowMatchmakingStatus(false)}
        >
          <div
            style={{
              backgroundColor: '#24272A',
              border: '1px solid rgba(139, 126, 116, 0.3)',
              borderRadius: '6px',
              width: '100%',
              maxWidth: '420px',
              padding: '1.5rem',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '1rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '3px solid #D4AF37',
                borderTopColor: 'transparent',
                animation: 'spin 1s linear infinite',
              }}
            />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                Searching for Opponent...
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#8B7E74', margin: '0.4rem 0 0 0' }}>
                Matching your {activeProfile.equippedHand.length}-card loadout with tactical players
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowMatchmakingStatus(false)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#191B1D',
                color: '#8B7E74',
                border: '1px solid rgba(139, 126, 116, 0.3)',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Cancel Search
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: Private Match */}
      {showPrivateModal && (
        <div
          data-testid="private-match-modal"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowPrivateModal(false)}
        >
          <div
            style={{
              backgroundColor: '#24272A',
              border: '1px solid rgba(139, 126, 116, 0.3)',
              borderRadius: '6px',
              width: '100%',
              maxWidth: '460px',
              padding: '1.5rem',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Private Room</h3>
                <p style={{ fontSize: '0.75rem', color: '#8B7E74', margin: '0.25rem 0 0' }}>
                  Play real-time Deck Builder chess with a friend over the internet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivateModal(false)}
                style={{ background: 'none', border: 'none', color: '#8B7E74', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Time Control Selection */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8B7E74', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Time Control
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                {[
                  { id: '3+0', label: '3 min' },
                  { id: '5+0', label: '5 min' },
                  { id: '10+0', label: '10 min' },
                  { id: 'untimed', label: 'Untimed' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPrivateTimeControl(id as any)}
                    style={{
                      padding: '0.45rem',
                      backgroundColor: privateTimeControl === id ? '#4C5C4C' : '#191B1D',
                      color: privateTimeControl === id ? '#FAF9F6' : '#8B7E74',
                      border: privateTimeControl === id ? '1px solid #D4AF37' : '1px solid rgba(139, 126, 116, 0.25)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <button
                type="button"
                onClick={() => {
                  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                  let code = '';
                  for (let i = 0; i < 4; i++) {
                    code += chars.charAt(Math.floor(Math.random() * chars.length));
                  }
                  const newRoomCode = `WH-${code}`;
                  setShowPrivateModal(false);
                  navigate(`/play/${newRoomCode}?variant=deck_builder&timeControl=${privateTimeControl}`);
                }}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#4C5C4C',
                  color: '#FAF9F6',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>⚔️</span> Create & Enter Room
              </button>

              <div style={{ position: 'relative', textAlign: 'center', margin: '0.25rem 0' }}>
                <div style={{ borderTop: '1px solid rgba(139, 126, 116, 0.2)', position: 'absolute', top: '50%', width: '100%' }} />
                <span style={{ position: 'relative', backgroundColor: '#24272A', padding: '0 0.5rem', fontSize: '0.7rem', color: '#8B7E74', textTransform: 'uppercase' }}>
                  or join with code
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Enter room code (e.g. WH-K7X2)..."
                  value={privateCodeInput}
                  onChange={(e) => setPrivateCodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const clean = privateCodeInput.trim().toUpperCase();
                      if (clean) {
                        setShowPrivateModal(false);
                        navigate(`/play/${clean}?variant=deck_builder`);
                      }
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.75rem',
                    backgroundColor: '#191B1D',
                    border: '1px solid rgba(139, 126, 116, 0.3)',
                    borderRadius: '4px',
                    color: '#FAF9F6',
                    fontSize: '0.8rem',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const clean = privateCodeInput.trim().toUpperCase();
                    if (clean) {
                      setShowPrivateModal(false);
                      navigate(`/play/${clean}?variant=deck_builder`);
                    }
                  }}
                  style={{
                    padding: '0.6rem 1rem',
                    backgroundColor: '#24272A',
                    color: '#FAF9F6',
                    border: '1px solid rgba(139, 126, 116, 0.3)',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Async Matches */}
      {showAsyncModal && (
        <div
          data-testid="async-matches-modal"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowAsyncModal(false)}
        >
          <div
            style={{
              backgroundColor: '#24272A',
              border: '1px solid rgba(139, 126, 116, 0.3)',
              borderRadius: '6px',
              width: '100%',
              maxWidth: '460px',
              padding: '1.5rem',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Active Async Matches</h3>
              <button
                type="button"
                onClick={() => setShowAsyncModal(false)}
                style={{ background: 'none', border: 'none', color: '#8B7E74', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#8B7E74', fontSize: '0.85rem' }}>
              No active asynchronous matches in progress.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowAsyncModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#191B1D',
                  color: '#FAF9F6',
                  border: '1px solid rgba(139, 126, 116, 0.3)',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
