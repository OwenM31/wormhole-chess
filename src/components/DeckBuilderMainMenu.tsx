import React, { useState } from 'react';
import { usePlayerProfiles } from '../hooks/usePlayerProfiles';
import { CANONICAL_36_CARDS } from '../engine/cards/releaseRoster36';
import { PlayerProfile } from '../types/deckChess';

export interface DeckBuilderMainMenuProps {
  onOpenCampaign?: () => void;
  onOpenMultiplayer?: () => void;
  profilesHook?: ReturnType<typeof usePlayerProfiles>;
}

const CARD_LOOKUP = new Map(CANONICAL_36_CARDS.map((c) => [c.id, c]));

export const DeckBuilderMainMenu: React.FC<DeckBuilderMainMenuProps> = ({
  onOpenCampaign,
  onOpenMultiplayer,
  profilesHook,
}) => {
  const internalHook = usePlayerProfiles();
  const hook = profilesHook || internalHook;
  const {
    profiles,
    activeSlotId,
    activeProfile,
    switchProfile,
    updateProfileName,
    togglePlaytestMode,
    createOrResetProfile,
  } = hook;

  // Modal states
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingName, setEditingName] = useState(activeProfile.name);

  // Sync editing name when profile changes
  React.useEffect(() => {
    setEditingName(activeProfile.name);
  }, [activeProfile.name]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileName(editingName);
  };

  const equippedCards = activeProfile.equippedHand
    .map((id) => CARD_LOOKUP.get(id))
    .filter(Boolean);

  const equippedCodes = equippedCards.map((c) => c?.code || '??').join(' · ');

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 54px)',
        backgroundColor: '#191B1D',
        color: '#FAF9F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
      }}
    >
      {/* Responsive Grid Override for Mobile/Tablet */}
      <style>{`
        @media (max-width: 900px) {
          .deck-builder-main-menu-grid {
            grid-template-columns: 1fr !important;
          }
          .deck-builder-main-menu-grid > div {
            grid-column: 1 / -1 !important;
          }
        }
      `}</style>

      {/* 1. Fullscreen Atmospheric Castle Causeway & Perspective Floor SVG */}
      <svg
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: 0.85,
        }}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#191B1D" />
            <stop offset="45%" stopColor="#24272A" />
            <stop offset="70%" stopColor="#3C493F" />
            <stop offset="100%" stopColor="#191B1D" />
          </linearGradient>
          <linearGradient id="causewayGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#4C5C4C" stopOpacity="0.4" />
            <stop offset="40%" stopColor="#3C493F" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#191B1D" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="pillarGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B7E74" stopOpacity="0" />
            <stop offset="50%" stopColor="#8B7E74" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8B7E74" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Sky / Castle Depth */}
        <rect width="1440" height="900" fill="url(#skyGrad)" />

        {/* Distant Castle Arch & Gatehouse Silhouette */}
        <path
          d="M 520,320 L 520,240 Q 720,180 920,240 L 920,320 Z"
          fill="#1C1E20"
          opacity="0.85"
        />
        <path
          d="M 640,320 Q 720,220 800,320 Z"
          fill="#141618"
          opacity="0.9"
        />

        {/* Symmetrical Castle Turrets */}
        <rect x="430" y="220" width="70" height="150" fill="#202326" />
        <polygon points="415,220 465,160 515,220" fill="#1C1E20" />
        <rect x="940" y="220" width="70" height="150" fill="#202326" />
        <polygon points="925,220 975,160 1025,220" fill="#1C1E20" />

        {/* Left Causeway Pillars */}
        <polygon points="120,900 180,900 480,360 460,360" fill="url(#pillarGlow)" />
        <polygon points="260,900 310,900 530,360 515,360" fill="url(#pillarGlow)" />

        {/* Right Causeway Pillars */}
        <polygon points="1320,900 1260,900 960,360 980,360" fill="url(#pillarGlow)" />
        <polygon points="1180,900 1130,900 910,360 925,360" fill="url(#pillarGlow)" />

        {/* Perspective Causeway Floor Trapezoid */}
        <polygon
          points="620,360 820,360 1220,900 220,900"
          fill="url(#causewayGrad)"
          stroke="#4C5C4C"
          strokeWidth="1.5"
          strokeOpacity="0.4"
        />

        {/* Causeway Perspective Chess Grid Lines */}
        <g stroke="#8B7E74" strokeOpacity="0.25" strokeWidth="1">
          {/* Vertical converging rays */}
          <line x1="720" y1="360" x2="720" y2="900" />
          <line x1="680" y1="360" x2="520" y2="900" />
          <line x1="760" y1="360" x2="920" y2="900" />
          <line x1="650" y1="360" x2="360" y2="900" />
          <line x1="790" y1="360" x2="1080" y2="900" />

          {/* Horizontal distance rings */}
          <line x1="600" y1="390" x2="840" y2="390" />
          <line x1="565" y1="435" x2="875" y2="435" />
          <line x1="520" y1="500" x2="920" y2="500" />
          <line x1="455" y1="590" x2="985" y2="590" />
          <line x1="360" y1="715" x2="1080" y2="715" />
          <line x1="240" y1="875" x2="1200" y2="875" />
        </g>
      </svg>

      {/* 2. Fluid 11-Column Focal Grid */}
      <div
        className="deck-builder-main-menu-grid"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '1360px',
          margin: '0 auto',
          padding: 'clamp(1.25rem, 2.5vw, 2.5rem)',
          display: 'grid',
          gridTemplateColumns: 'repeat(11, minmax(0, 1fr))',
          gap: 'clamp(1rem, 1.8vw, 2rem)',
          alignItems: 'center',
        }}
      >
        {/* Left Primary Menu Stack (grid-column: 3 / span 4) */}
        <div
          style={{
            gridColumn: '3 / span 4',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Header */}
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#8B7E74',
                marginBottom: '0.35rem',
              }}
            >
              Tactical Deck Engine · v3.0
            </div>
            <h1
              style={{
                fontSize: 'clamp(1.75rem, 2.5vw, 2.25rem)',
                fontWeight: 700,
                lineHeight: 1.15,
                margin: 0,
                color: '#FAF9F6',
                letterSpacing: '-0.02em',
              }}
            >
              Deck Builder Chess
            </h1>
          </div>

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Campaign Button */}
            <button
              type="button"
              onClick={onOpenCampaign || (() => setShowCampaignModal(true))}
              data-testid="main-menu-campaign-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.15rem 1.35rem',
                backgroundColor: '#4C5C4C',
                color: '#FAF9F6',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5C6C5C';
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.7)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4C5C4C';
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.35)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    letterSpacing: '0.01em',
                    color: '#FAF9F6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>🏰</span> Campaign
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#FAF9F6',
                    opacity: 0.9,
                    marginTop: '0.2rem',
                  }}
                >
                  Parallel World Key Campaign · 7 Worlds
                </div>
              </div>
              <span style={{ fontSize: '1.25rem', color: '#D4AF37' }}>→</span>
            </button>

            {/* Multiplayer Button */}
            <button
              type="button"
              onClick={onOpenMultiplayer}
              data-testid="main-menu-multiplayer-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.15rem 1.35rem',
                backgroundColor: '#24272A',
                color: '#FAF9F6',
                border: '1px solid rgba(139, 126, 116, 0.25)',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2C3034';
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#24272A';
                e.currentTarget.style.borderColor = 'rgba(139, 126, 116, 0.25)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    letterSpacing: '0.01em',
                    color: '#FAF9F6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>⚔️</span> Multiplayer
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#8B7E74',
                    marginTop: '0.2rem',
                  }}
                >
                  Deck Builder Stage · Offline & Online
                </div>
              </div>
              <span style={{ fontSize: '1.25rem', color: '#8B7E74' }}>→</span>
            </button>
          </div>

          {/* Bottom Row: My Profile & Switch Profile */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '0.65rem',
            }}
          >
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              data-testid="main-menu-profile-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#1C1E20',
                color: '#FAF9F6',
                border: '1px solid rgba(139, 126, 116, 0.2)',
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                e.currentTarget.style.backgroundColor = '#222528';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 126, 116, 0.2)';
                e.currentTarget.style.backgroundColor = '#1C1E20';
              }}
            >
              <span>👤</span> My Profile
            </button>

            <button
              type="button"
              onClick={() => setShowSwitchModal(true)}
              data-testid="main-menu-switch-btn"
              title="Switch local profile slot"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#1C1E20',
                color: '#D4AF37',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#D4AF37';
                e.currentTarget.style.backgroundColor = '#222528';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                e.currentTarget.style.backgroundColor = '#1C1E20';
              }}
            >
              <span>⇄</span> Switch Profile
            </button>
          </div>
        </div>

        {/* Center Breathing Gutter: Column 7 natural 1fr gap automatically preserved */}

        {/* Right Companion Showcase Card (grid-column: 8 / span 3) */}
        <div
          data-testid="player-showcase-card"
          style={{
            gridColumn: '8 / span 3',
            backgroundColor: '#24272A',
            border: '1px solid rgba(139, 126, 116, 0.25)',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Top Telemetry Bar */}
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#1C1E20',
              borderBottom: '1px solid rgba(139, 126, 116, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  padding: '0.15rem 0.4rem',
                  backgroundColor: '#3C493F',
                  color: '#FAF9F6',
                  borderRadius: '3px',
                }}
              >
                {activeSlotId.replace('_', ' ')}
              </span>
              <span
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#FAF9F6',
                }}
              >
                {activeProfile.name}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                fontSize: '0.75rem',
                fontVariantNumeric: 'tabular-nums',
                color: '#8B7E74',
              }}
            >
              <span>LVL {activeProfile.level}</span>
              <span style={{ color: '#D4AF37' }}>🪙 {activeProfile.gold}</span>
            </div>
          </div>

          {/* Character Canvas with aspect-ratio: 4 / 3 (Zero hardcoded pixel height) */}
          <div
            data-testid="character-canvas"
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4 / 3',
              backgroundColor: '#191B1D',
              borderBottom: '1px solid rgba(139, 126, 116, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Living Pawn Pedestal SVG */}
            <svg
              style={{ width: '100%', height: '100%' }}
              viewBox="0 0 400 300"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <radialGradient id="pedestalSpot" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#4C5C4C" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#3C493F" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#191B1D" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="pawnWood" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A88B72" />
                  <stop offset="50%" stopColor="#7E634E" />
                  <stop offset="100%" stopColor="#4A3B2C" />
                </linearGradient>
                <linearGradient id="pedestalTier" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3A3E42" />
                  <stop offset="100%" stopColor="#1F2224" />
                </linearGradient>
              </defs>

              {/* Ambient Spotlight */}
              <ellipse cx="200" cy="220" rx="140" ry="60" fill="url(#pedestalSpot)" />

              {/* Pedestal Base Tiers */}
              <ellipse cx="200" cy="245" rx="90" ry="24" fill="#0E1012" />
              <ellipse cx="200" cy="240" rx="85" ry="20" fill="url(#pedestalTier)" stroke="#8B7E74" strokeWidth="1" strokeOpacity="0.4" />
              <ellipse cx="200" cy="230" rx="65" ry="16" fill="#282C30" stroke="#8B7E74" strokeWidth="1" strokeOpacity="0.5" />
              <ellipse cx="200" cy="222" rx="48" ry="12" fill="#D4AF37" fillOpacity="0.3" stroke="#D4AF37" strokeWidth="1" />

              {/* Living Pawn Silhouette */}
              {/* Plinth */}
              <ellipse cx="200" cy="216" rx="28" ry="8" fill="url(#pawnWood)" stroke="#2C2016" strokeWidth="1" />
              {/* Lower Body Flare */}
              <path
                d="M 178,214 C 182,192 188,172 191,150 L 209,150 C 212,172 218,192 222,214 Z"
                fill="url(#pawnWood)"
                stroke="#2C2016"
                strokeWidth="1"
              />
              {/* Collar Ring */}
              <ellipse cx="200" cy="148" rx="18" ry="5" fill="#C49B72" stroke="#2C2016" strokeWidth="1" />
              {/* Neck */}
              <path d="M 193,148 L 194,136 L 206,136 L 207,148 Z" fill="url(#pawnWood)" />
              {/* Head / Spherical Finial */}
              <circle cx="200" cy="116" r="20" fill="url(#pawnWood)" stroke="#2C2016" strokeWidth="1.2" />
              {/* Head Specular Highlight */}
              <circle cx="194" cy="110" r="5" fill="#FAF9F6" fillOpacity="0.25" />

              {/* Headgear cosmetic if equipped */}
              {activeProfile.gear.headgear && activeProfile.gear.headgear !== 'None' && (
                <path
                  d="M 182,106 Q 200,90 218,106 L 214,100 Q 200,82 186,100 Z"
                  fill="#D4AF37"
                  stroke="#141618"
                  strokeWidth="1"
                />
              )}

              {/* Playtest Mode Halo */}
              {activeProfile.playtestAll36 && (
                <ellipse
                  cx="200"
                  cy="90"
                  rx="26"
                  ry="7"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}
            </svg>

            {/* Playtest Active Badge Overlay */}
            {activeProfile.playtestAll36 && (
              <div
                style={{
                  position: 'absolute',
                  top: '0.6rem',
                  right: '0.6rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.5rem',
                  backgroundColor: 'rgba(212, 175, 55, 0.2)',
                  border: '1px solid #D4AF37',
                  color: '#D4AF37',
                  borderRadius: '3px',
                }}
              >
                ⚡ 36 CARDS UNLOCKED
              </div>
            )}
          </div>

          {/* Gear & Cosmetics Strip (3-column grid) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              padding: '0.65rem 0.75rem',
              backgroundColor: '#1E2124',
              borderBottom: '1px solid rgba(139, 126, 116, 0.15)',
              textAlign: 'center',
              gap: '0.5rem',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#8B7E74',
                }}
              >
                Material
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#FAF9F6',
                  marginTop: '0.15rem',
                }}
              >
                {activeProfile.gear.material || 'Carved Oak'}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#8B7E74',
                }}
              >
                Headgear
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#FAF9F6',
                  marginTop: '0.15rem',
                }}
              >
                {activeProfile.gear.headgear || 'None'}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#8B7E74',
                }}
              >
                Base
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#FAF9F6',
                  marginTop: '0.15rem',
                }}
              >
                {activeProfile.gear.base || 'Tavern Coin'}
              </div>
            </div>
          </div>

          {/* Equipped Hand Footer */}
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#1C1E20',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#8B7E74',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              <span>EQUIPPED HAND</span>
              <span
                style={{
                  fontFamily:
                    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                  fontVariantNumeric: 'tabular-nums',
                  color: '#D4AF37',
                }}
              >
                {activeProfile.equippedHand.length}/{activeProfile.handSize}
              </span>
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                color: '#FAF9F6',
                letterSpacing: '0.02em',
                lineHeight: 1.4,
              }}
            >
              {equippedCodes || 'No cards equipped'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Switch Profile Modal */}
      {showSwitchModal && (
        <div
          data-testid="switch-profile-modal"
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
          onClick={() => setShowSwitchModal(false)}
        >
          <div
            style={{
              backgroundColor: '#24272A',
              border: '1px solid rgba(139, 126, 116, 0.3)',
              borderRadius: '6px',
              width: '100%',
              maxWidth: '480px',
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
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                Select Profile Slot
              </h2>
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(['slot_1', 'slot_2', 'slot_3'] as const).map((slotId) => {
                const profile: PlayerProfile | undefined = profiles[slotId];
                const isActive = slotId === activeSlotId;
                return (
                  <div
                    key={slotId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      backgroundColor: isActive ? '#3C493F' : '#1C1E20',
                      border: isActive
                        ? '1px solid #D4AF37'
                        : '1px solid rgba(139, 126, 116, 0.2)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      switchProfile(slotId);
                      setShowSwitchModal(false);
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#FAF9F6',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <span>{profile?.name || slotId.replace('_', ' ')}</span>
                        {isActive && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '0.1rem 0.35rem',
                              backgroundColor: '#D4AF37',
                              color: '#141618',
                              borderRadius: '2px',
                              fontWeight: 700,
                            }}
                          >
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#8B7E74',
                          marginTop: '0.2rem',
                        }}
                      >
                        {profile?.playtestAll36 ? '⚡ Playtest (36 Cards)' : '🏰 Campaign Slot'} · LVL{' '}
                        {profile?.level || 1} · 🪙 {profile?.gold || 0}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        createOrResetProfile(slotId, profile?.name, !profile?.playtestAll36);
                      }}
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.7rem',
                        backgroundColor: '#191B1D',
                        color: '#8B7E74',
                        border: '1px solid rgba(139, 126, 116, 0.3)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      Reset Slot
                    </button>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                borderTop: '1px solid rgba(139, 126, 116, 0.15)',
                paddingTop: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Playtest Mode (All 36 Cards)
                </div>
                <div style={{ fontSize: '0.7rem', color: '#8B7E74' }}>
                  Unlocks all 36 cards and 5 copies per card
                </div>
              </div>
              <button
                type="button"
                onClick={togglePlaytestMode}
                data-testid="toggle-playtest-mode-btn"
                style={{
                  padding: '0.5rem 0.85rem',
                  backgroundColor: activeProfile.playtestAll36 ? '#4C5C4C' : '#1C1E20',
                  color: activeProfile.playtestAll36 ? '#FAF9F6' : '#8B7E74',
                  border: activeProfile.playtestAll36
                    ? '1px solid #D4AF37'
                    : '1px solid rgba(139, 126, 116, 0.25)',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {activeProfile.playtestAll36 ? '✓ ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. My Profile Modal */}
      {showProfileModal && (
        <div
          data-testid="my-profile-modal"
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
          onClick={() => setShowProfileModal(false)}
        >
          <div
            style={{
              backgroundColor: '#24272A',
              border: '1px solid rgba(139, 126, 116, 0.3)',
              borderRadius: '6px',
              width: '100%',
              maxWidth: '440px',
              padding: '1.5rem',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.15rem',
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
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                Player Profile
              </h2>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
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

            {/* Profile Name Form */}
            <form onSubmit={handleSaveName} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                maxLength={24}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.85rem',
                  backgroundColor: '#191B1D',
                  border: '1px solid rgba(139, 126, 116, 0.3)',
                  borderRadius: '4px',
                  color: '#FAF9F6',
                  fontSize: '0.85rem',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.6rem 1rem',
                  backgroundColor: '#4C5C4C',
                  color: '#FAF9F6',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </form>

            {/* Profile Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#1C1E20',
                borderRadius: '4px',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.65rem', color: '#8B7E74' }}>LEVEL</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FAF9F6' }}>
                  {activeProfile.level}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#8B7E74' }}>GOLD</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#D4AF37' }}>
                  🪙 {activeProfile.gold}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#8B7E74' }}>CARDS</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FAF9F6' }}>
                  {activeProfile.unlockedCards.length}/36
                </div>
              </div>
            </div>

            {/* Gear Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#8B7E74',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Equipped Living Gear
              </div>
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#1C1E20',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8B7E74' }}>Material:</span>
                  <span style={{ fontWeight: 600 }}>{activeProfile.gear.material}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8B7E74' }}>Headgear:</span>
                  <span style={{ fontWeight: 600 }}>{activeProfile.gear.headgear}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8B7E74' }}>Base:</span>
                  <span style={{ fontWeight: 600 }}>{activeProfile.gear.base}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Campaign Preview Modal */}
      {showCampaignModal && (
        <div
          data-testid="campaign-preview-modal"
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
          onClick={() => setShowCampaignModal(false)}
        >
          <div
            style={{
              backgroundColor: '#24272A',
              border: '1px solid rgba(139, 126, 116, 0.3)',
              borderRadius: '6px',
              width: '100%',
              maxWidth: '520px',
              padding: '1.5rem',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.15rem',
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
                <div
                  style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    color: '#8B7E74',
                    letterSpacing: '0.06em',
                  }}
                >
                  Campaign Map
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.2rem 0 0 0' }}>
                  Parallel World Key Campaign
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCampaignModal(false)}
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

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                fontSize: '0.8rem',
              }}
            >
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#3C493F',
                  borderRadius: '4px',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                <div style={{ fontWeight: 700, color: '#FAF9F6' }}>
                  World 1: The Causeway (7 Cards)
                </div>
                <div style={{ color: '#FAF9F6', opacity: 0.85, fontSize: '0.75rem' }}>
                  Linear Tutorial Causeway · Cards: P1, P2, P3, N1, B1, N2, R1 (Boss)
                </div>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#1C1E20',
                  borderRadius: '4px',
                  border: '1px solid rgba(139, 126, 116, 0.2)',
                }}
              >
                <div style={{ fontWeight: 700, color: '#FAF9F6' }}>
                  World 2: Outer Courtyard (4 Cards + 2 Wing Keys)
                </div>
                <div style={{ color: '#8B7E74', fontSize: '0.75rem' }}>
                  Unlock parallel wings to The Barracks, Chapel, Armory, or Royal Court
                </div>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#1C1E20',
                  borderRadius: '4px',
                  border: '1px solid rgba(139, 126, 116, 0.2)',
                }}
              >
                <div style={{ fontWeight: 700, color: '#FAF9F6' }}>
                  Worlds 3–6: Concurrent Castle Wings
                </div>
                <div style={{ color: '#8B7E74', fontSize: '0.75rem' }}>
                  The Barracks (W3), The Chapel (W4), The Armory (W5), The Royal Court (W6)
                </div>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#1C1E20',
                  borderRadius: '4px',
                  border: '1px solid rgba(139, 126, 116, 0.2)',
                }}
              >
                <div style={{ fontWeight: 700, color: '#FAF9F6' }}>
                  World 7: The Throne Room
                </div>
                <div style={{ color: '#8B7E74', fontSize: '0.75rem' }}>
                  The Iron King & Scheming Jester (Full 36-Card Playbook Duel)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowCampaignModal(false)}
                style={{
                  padding: '0.6rem 1.15rem',
                  backgroundColor: '#4C5C4C',
                  color: '#FAF9F6',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
