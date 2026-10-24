import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { WormholeLogo } from '../components/WormholeLogo';
import { WormholeSpacetimeIllustration } from '../components/WormholeSpacetimeIllustration';
import { PlayingCard } from '../components/PlayingCard';
import { CANONICAL_36_CARDS } from '../engine/cards/releaseRoster36';
import { CardDefinition } from '../types/deckChess';

type VariantTab = 'deck-builder' | 'wormhole';

const SHOWCASE_CARD_IDS = [
  'p2_head_on',
  'n1_adrenaline_jump',
  'b1_let_me_through',
  'r1_make_way',
  'q2_the_queens_gambit',
  'k2_royal_knighting',
];

export const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VariantTab>('deck-builder');

  const showcaseCards = React.useMemo(() => {
    return SHOWCASE_CARD_IDS.map((id) =>
      CANONICAL_36_CARDS.find((c) => c.id === id)
    ).filter(Boolean) as CardDefinition[];
  }, []);

  return (
    <div style={containerStyle}>
      {/* Medieval Village Atmospheric Backdrop Art */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'url(/assets/backgrounds/village-backdrop.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          opacity: 0.16,
          filter: 'saturate(0.9) brightness(0.65)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 30%, rgba(26, 28, 30, 0.4) 0%, rgba(26, 28, 30, 0.85) 60%, #1A1C1E 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <style>{`
        .home-tab-btn {
          outline: none;
        }
        .home-tab-btn:hover {
          color: #FAF9F6 !important;
        }
        .home-tab-btn:focus-visible,
        .home-btn-primary:focus-visible,
        .home-btn-secondary:focus-visible {
          outline: 2px solid rgba(212, 175, 55, 0.85) !important;
          outline-offset: 2px !important;
        }
        .home-card-item {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .home-card-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.5);
        }
        .home-btn-primary {
          transition: background-color 0.15s ease, transform 0.15s ease;
        }
        .home-btn-primary:hover {
          background-color: #6aa269 !important;
          transform: translateY(-1px);
        }
        .home-btn-secondary {
          transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .home-btn-secondary:hover {
          border-color: rgba(140, 109, 83, 0.6) !important;
          background-color: #2D3033 !important;
          color: #FAF9F6 !important;
        }

        @media (max-width: 640px) {
          .home-main {
            padding: 1.5rem 1rem 3rem !important;
            gap: 1.5rem !important;
          }
          .home-hero-title {
            font-size: 2.15rem !important;
          }
          .home-hero-subtitle {
            font-size: 0.95rem !important;
          }
          .home-stage-content {
            padding: 1.25rem 1rem !important;
            gap: 1.25rem !important;
          }
          .home-stage-header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
          .home-stage-actions {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.65rem !important;
          }
          .home-stage-actions a {
            width: 100% !important;
            box-sizing: border-box !important;
            text-align: center !important;
          }
          .home-stage-actions span {
            margin-left: 0 !important;
            text-align: center !important;
            margin-top: 0.25rem !important;
          }
          .home-wormhole-visual {
            flex-direction: column !important;
            padding: 1.25rem 0.75rem !important;
            gap: 1rem !important;
          }
          .home-portal-beam {
            width: 2px !important;
            height: 32px !important;
            background: linear-gradient(180deg, #D4AF37, #FAF9F6) !important;
          }
          .home-hero-lockup {
            flex-direction: column !important;
            text-align: center !important;
            gap: 1rem !important;
          }
          .home-hero-art {
            width: 120px !important;
            height: 90px !important;
          }
          .home-hero-title {
            font-size: 2.2rem !important;
          }
        }
      `}</style>
      <Navigation />

      <main style={mainContentStyle} className="home-main">
        {/* Fuller Hero Section with 3D Wormhole Spacetime Illustration */}
        <section style={heroSectionStyle} className="home-hero">
          <div style={heroLockupStyle} className="home-hero-lockup">
            <WormholeSpacetimeIllustration width={135} height={101} className="home-hero-art" />
            <div style={heroTextGroupStyle} className="home-hero-text">
              <h1 style={heroTitleStyle} className="home-hero-title">WormholeChess</h1>
              <p style={heroSubtitleStyle} className="home-hero-subtitle">Home to your favorite chess variants</p>
            </div>
          </div>
        </section>

        {/* Unified Variant Stage */}
        <section style={stageCardStyle}>
          {/* Variant Selector Tabs */}
          <div style={stageNavBarStyle} role="tablist" aria-label="Game Variants">
            <button
              type="button"
              role="tab"
              id="tab-deck-builder"
              aria-selected={activeTab === 'deck-builder'}
              aria-controls="panel-deck-builder"
              className="home-tab-btn"
              onClick={() => setActiveTab('deck-builder')}
              style={activeTab === 'deck-builder' ? activeTabBtnStyle : tabBtnStyle}
            >
              <span>🃏 Deck Builder Chess</span>
              {activeTab === 'deck-builder' && (
                <span style={activeStatusPillStyle}>Active</span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              id="tab-wormhole"
              aria-selected={activeTab === 'wormhole'}
              aria-controls="panel-wormhole"
              className="home-tab-btn"
              onClick={() => setActiveTab('wormhole')}
              style={activeTab === 'wormhole' ? activeTabBtnStyle : tabBtnStyle}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                <WormholeLogo size={16} badged={true} />
                <span>Wormhole Chess</span>
              </span>
              {activeTab === 'wormhole' && (
                <span style={activeStatusPillStyle}>Active</span>
              )}
            </button>
          </div>

          {/* Active Tab: Deck Builder Chess */}
          {activeTab === 'deck-builder' && (
            <div
              style={stageContentStyle}
              role="tabpanel"
              id="panel-deck-builder"
              aria-labelledby="tab-deck-builder"
              className="home-stage-content"
            >
              <div style={stageHeaderRowStyle} className="home-stage-header-row">
                <div>
                  <h2 style={stageTitleStyle}>Deck Builder Chess</h2>
                  <p style={stageDescStyle}>
                    Standard chess rules empowered by bespoke tactical cards — 1 card per turn, zero energy clutter, infinite tactical depth.
                  </p>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.35rem 0.75rem',
                    backgroundColor: 'rgba(91, 140, 90, 0.15)',
                    border: '1px solid rgba(91, 140, 90, 0.4)',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#FAF9F6',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  <span style={{ color: '#5B8C5A' }}>●</span>
                  <span>36-CARD PLAYBOOK</span>
                </div>
              </div>

              {/* Authentic Live 36-Card Playbook Showcase */}
              <div
                data-testid="home-showcase-roster"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.85rem',
                  margin: '0.5rem 0 1rem',
                  alignItems: 'start',
                }}
              >
                {showcaseCards.map((card) => (
                  <div
                    key={card.id}
                    className="home-card-item"
                    style={{
                      width: '100%',
                      maxWidth: '148px',
                      margin: '0 auto',
                    }}
                  >
                    <PlayingCard
                      card={card}
                      size="equipped"
                      dataTestId={`showcase-card-${card.code}`}
                    />
                  </div>
                ))}
              </div>

              {/* Action Buttons Row */}
              <div style={stageActionsRowStyle} className="home-stage-actions">
                <Link to="/deck-builder" style={primaryActionBtnStyle} className="home-btn-primary">
                  Enter Deck Builder Matchmaking →
                </Link>
                <Link to="/deck-builder" style={secondaryActionBtnStyle} className="home-btn-secondary">
                  Solo Practice
                </Link>
              </div>
            </div>
          )}

          {/* Active Tab: Wormhole Chess */}
          {activeTab === 'wormhole' && (
            <div
              style={stageContentStyle}
              role="tabpanel"
              id="panel-wormhole"
              aria-labelledby="tab-wormhole"
              className="home-stage-content"
            >
              <div style={stageHeaderRowStyle} className="home-stage-header-row">
                <div>
                  <h2 style={stageTitleStyle}>Wormhole Chess</h2>
                  <p style={stageDescStyle}>
                    Two 8x8 boards linked by a hole in the middle, for up to 4 players.
                  </p>
                </div>
              </div>

              {/* 3D Visual Schematic */}
              <div style={wormholeVisualBoxStyle} className="home-wormhole-visual">
                <div style={boardIsometricStyle}>
                  <div style={sqDarkStyle} /><div style={sqLightStyle} /><div style={sqDarkStyle} /><div style={sqLightStyle} />
                  <div style={sqLightStyle} /><div style={sqDarkStyle} /><div style={sqLightStyle} /><div style={sqDarkStyle} />
                  <div style={sqDarkStyle} /><div style={sqLightStyle} /><div style={sqDarkStyle} /><div style={sqLightStyle} />
                  <div style={sqLightStyle} /><div style={sqDarkStyle} /><div style={sqLightStyle} /><div style={sqDarkStyle} />
                </div>
                <div style={portalLinkStyle}>
                  <div style={portalLabelStyle}>BOARD 1 ⇄ BOARD 2</div>
                  <div style={portalBeamStyle} className="home-portal-beam" />
                </div>
                <div style={boardIsometricStyle}>
                  <div style={sqLightStyle} /><div style={sqDarkStyle} /><div style={sqLightStyle} /><div style={sqDarkStyle} />
                  <div style={sqDarkStyle} /><div style={sqLightStyle} /><div style={sqDarkStyle} /><div style={sqLightStyle} />
                  <div style={sqLightStyle} /><div style={sqDarkStyle} /><div style={sqLightStyle} /><div style={sqDarkStyle} />
                  <div style={sqDarkStyle} /><div style={sqLightStyle} /><div style={sqDarkStyle} /><div style={sqLightStyle} />
                </div>
              </div>

              {/* Action Buttons Row */}
              <div style={stageActionsRowStyle} className="home-stage-actions">
                <Link to="/wormhole" style={primaryActionBtnStyle} className="home-btn-primary">
                  Launch 3D Wormhole →
                </Link>
                <Link to="/wormhole" style={secondaryActionBtnStyle} className="home-btn-secondary">
                  Solo Practice
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

// Styles following Medieval Village & Wormhole Chess Design System Tokens
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  width: '100%',
  maxWidth: '100vw',
  overflowX: 'hidden',
  boxSizing: 'border-box',
  backgroundColor: '#1A1C1E',
  color: '#FAF9F6',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
};

const mainContentStyle: React.CSSProperties = {
  maxWidth: '980px',
  width: '100%',
  margin: '0 auto',
  padding: '3rem 1.5rem 4rem',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '2.25rem',
  position: 'relative',
  zIndex: 1,
};

const heroSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '0.5rem',
};

const heroLockupStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.75rem',
  textAlign: 'left',
};

const heroTextGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: '2.75rem',
  fontWeight: 750,
  letterSpacing: '-0.035em',
  color: '#FAF9F6',
  margin: '0 0 0.4rem',
  lineHeight: 1.1,
};

const heroSubtitleStyle: React.CSSProperties = {
  fontSize: '1.05rem',
  color: '#D1CCC7',
  maxWidth: '520px',
  margin: 0,
  lineHeight: 1.4,
};

const stageCardStyle: React.CSSProperties = {
  backgroundColor: '#2D3033',
  border: '1px solid rgba(140, 109, 83, 0.35)',
  borderRadius: '6px',
  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
  overflow: 'hidden',
};

const stageNavBarStyle: React.CSSProperties = {
  backgroundColor: '#1C1E20',
  borderBottom: '1px solid rgba(140, 109, 83, 0.25)',
  display: 'flex',
  alignItems: 'center',
  padding: '0.4rem 0.75rem',
  gap: '0.5rem',
};

const tabBtnStyle: React.CSSProperties = {
  padding: '0.45rem 0.9rem',
  fontSize: '0.82rem',
  fontWeight: 600,
  borderRadius: '4px',
  border: '1px solid transparent',
  backgroundColor: 'transparent',
  color: '#D1CCC7',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.45rem',
  transition: 'all 0.15s ease',
};

const activeTabBtnStyle: React.CSSProperties = {
  ...tabBtnStyle,
  backgroundColor: '#24272A',
  color: '#FAF9F6',
  border: '1px solid rgba(140, 109, 83, 0.35)',
};

const activeStatusPillStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 700,
  color: '#5B8C5A',
  backgroundColor: 'rgba(91, 140, 90, 0.15)',
  border: '1px solid rgba(91, 140, 90, 0.3)',
  padding: '0.1rem 0.35rem',
  borderRadius: '2px',
};

const stageContentStyle: React.CSSProperties = {
  padding: '2.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.75rem',
};

const stageHeaderRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '1rem',
};

const stageTitleStyle: React.CSSProperties = {
  fontSize: '1.65rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: '#FAF9F6',
  margin: '0 0 0.35rem',
};

const stageDescStyle: React.CSSProperties = {
  fontSize: '0.92rem',
  color: '#D1CCC7',
  margin: 0,
};

const stageActionsRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem',
  paddingTop: '0.5rem',
  borderTop: '1px solid rgba(140, 109, 83, 0.25)',
  flexWrap: 'wrap',
};

const primaryActionBtnStyle: React.CSSProperties = {
  height: '42px',
  padding: '0 1.75rem',
  background: 'linear-gradient(135deg, #5B8C5A, #4D7C4D)',
  color: '#FAF9F6',
  fontSize: '0.88rem',
  fontWeight: 600,
  border: '1px solid rgba(91, 140, 90, 0.5)',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  textDecoration: 'none',
  transition: 'all 0.15s ease',
};

const secondaryActionBtnStyle: React.CSSProperties = {
  height: '42px',
  padding: '0 1.25rem',
  backgroundColor: '#1A1C1E',
  border: '1px solid rgba(140, 109, 83, 0.35)',
  color: '#FAF9F6',
  fontSize: '0.85rem',
  fontWeight: 600,
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
};

const wormholeVisualBoxStyle: React.CSSProperties = {
  backgroundColor: '#191B1D',
  border: '1px solid rgba(139, 126, 116, 0.25)',
  borderRadius: '5px',
  padding: '1.75rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  gap: '1.5rem',
  flexWrap: 'wrap',
};

const boardIsometricStyle: React.CSSProperties = {
  width: '120px',
  height: '120px',
  border: '1px solid rgba(139, 126, 116, 0.3)',
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gridTemplateRows: 'repeat(4, 1fr)',
  boxShadow: '-4px 8px 16px rgba(0,0,0,0.5)',
};

const sqDarkStyle: React.CSSProperties = { backgroundColor: '#3C493F' };
const sqLightStyle: React.CSSProperties = { backgroundColor: '#8B7E74' };

const portalLinkStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.4rem',
};

const portalLabelStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 700,
  color: '#D4AF37',
  letterSpacing: '0.05em',
  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
};

const portalBeamStyle: React.CSSProperties = {
  width: '80px',
  height: '2px',
  background: 'linear-gradient(90deg, #D4AF37, #FAF9F6, #D4AF37)',
  boxShadow: '0 0 10px rgba(212, 175, 55, 0.6)',
};

export default HomePage;
