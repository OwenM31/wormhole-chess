import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { WormholeLogo } from '../components/WormholeLogo';

type VariantTab = 'deck-builder' | 'wormhole';

export const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VariantTab>('deck-builder');

  return (
    <div style={containerStyle}>
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
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
          border-color: rgba(139, 126, 116, 0.45) !important;
        }
        .home-btn-primary {
          transition: background-color 0.15s ease, transform 0.15s ease;
        }
        .home-btn-primary:hover {
          background-color: #5d705d !important;
        }
        .home-btn-secondary {
          transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .home-btn-secondary:hover {
          border-color: rgba(139, 126, 116, 0.5) !important;
          background-color: #24272A !important;
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
          .home-cards-grid {
            grid-template-columns: 1fr !important;
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
            background: linear-gradient(180deg, #D4AF37, #A855F7) !important;
          }
        }
      `}</style>
      <Navigation />

      <main style={mainContentStyle} className="home-main">
        {/* Minimalist Hero */}
        <section style={heroSectionStyle} className="home-hero">
          <h1 style={heroTitleStyle} className="home-hero-title">Wormhole Chess</h1>
          <p style={heroSubtitleStyle} className="home-hero-subtitle">A collection of chess variants.</p>
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
                <span>3D Wormhole Chess</span>
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
                    Standard chess rules with an 8-card loadout and 3 energy per turn.
                  </p>
                </div>
                <div style={energyPillStyle}>
                  <span>⚡</span>
                  <span>ENERGY 3/3</span>
                </div>
              </div>

              {/* Tactical Card Asset Showcase */}
              <div style={cardsGridStyle} className="home-cards-grid">
                {/* Knight Escort */}
                <div
                  className="home-card-item"
                  style={{ ...cardItemStyle, borderTop: '3px solid #3fb950' }}
                >
                  <div style={cardTopStyle}>
                    <span style={{ fontSize: '1.25rem' }}>♞</span>
                    <span style={cardCostStyle}>2⚡</span>
                  </div>
                  <div>
                    <div style={cardNameStyle}>Knight Escort</div>
                    <div style={cardEffectStyle}>Transports adjacent pawn on jump.</div>
                  </div>
                </div>

                {/* Shield Wall */}
                <div
                  className="home-card-item"
                  style={{ ...cardItemStyle, borderTop: '3px solid #58a6ff' }}
                >
                  <div style={cardTopStyle}>
                    <span style={{ fontSize: '1.25rem' }}>🛡️</span>
                    <span style={cardCostStyle}>1⚡</span>
                  </div>
                  <div>
                    <div style={cardNameStyle}>Shield Wall</div>
                    <div style={cardEffectStyle}>Absorbs one capture attempt.</div>
                  </div>
                </div>

                {/* Spatial Warp */}
                <div
                  className="home-card-item"
                  style={{ ...cardItemStyle, borderTop: '3px solid #A855F7' }}
                >
                  <div style={cardTopStyle}>
                    <span style={{ fontSize: '1.25rem' }}>🌀</span>
                    <span style={cardCostStyle}>3⚡</span>
                  </div>
                  <div>
                    <div style={cardNameStyle}>Spatial Warp</div>
                    <div style={cardEffectStyle}>Swap two friendly non-king pieces.</div>
                  </div>
                </div>

                {/* King Decree */}
                <div
                  className="home-card-item"
                  style={{ ...cardItemStyle, borderTop: '3px solid #D4AF37' }}
                >
                  <div style={cardTopStyle}>
                    <span style={{ fontSize: '1.25rem' }}>👑</span>
                    <span style={cardCostStyle}>2⚡</span>
                  </div>
                  <div>
                    <div style={cardNameStyle}>King Decree</div>
                    <div style={cardEffectStyle}>Relocate king to safe anchor rank.</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div style={stageActionsRowStyle} className="home-stage-actions">
                <Link to="/deck-builder" style={primaryActionBtnStyle} className="home-btn-primary">
                  Play Deck Builder →
                </Link>
                <Link to="/deck-builder" style={secondaryActionBtnStyle} className="home-btn-secondary">
                  Solo Practice
                </Link>
              </div>
            </div>
          )}

          {/* Active Tab: 3D Wormhole Chess */}
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
                  <h2 style={stageTitleStyle}>3D Wormhole Chess</h2>
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

// Styles following Wormhole Chess Design System Tokens
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  width: '100%',
  maxWidth: '100vw',
  overflowX: 'hidden',
  boxSizing: 'border-box',
  backgroundColor: '#191B1D',
  color: '#FAF9F6',
  display: 'flex',
  flexDirection: 'column',
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
};

const heroSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '0.5rem',
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: '2.75rem',
  fontWeight: 750,
  letterSpacing: '-0.035em',
  color: '#FAF9F6',
  margin: '0 0 0.5rem',
};

const heroSubtitleStyle: React.CSSProperties = {
  fontSize: '1.05rem',
  color: '#8B7E74',
  maxWidth: '520px',
  margin: '0 auto',
};

const stageCardStyle: React.CSSProperties = {
  backgroundColor: '#24272A',
  border: '1px solid rgba(139, 126, 116, 0.22)',
  borderRadius: '6px',
  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
  overflow: 'hidden',
};

const stageNavBarStyle: React.CSSProperties = {
  backgroundColor: '#1C1E20',
  borderBottom: '1px solid rgba(139, 126, 116, 0.2)',
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
  color: '#8B7E74',
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
  border: '1px solid rgba(139, 126, 116, 0.25)',
};

const activeStatusPillStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 700,
  color: '#D4AF37',
  backgroundColor: 'rgba(212, 175, 55, 0.12)',
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
  color: '#8B7E74',
  margin: 0,
};

const energyPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.35rem 0.65rem',
  backgroundColor: '#191B1D',
  border: '1px solid rgba(212, 175, 55, 0.3)',
  borderRadius: '4px',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: '#D4AF37',
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
};

const cardsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
};

const cardItemStyle: React.CSSProperties = {
  backgroundColor: '#191B1D',
  border: '1px solid rgba(139, 126, 116, 0.25)',
  borderRadius: '5px',
  padding: '1rem 0.9rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: '140px',
  boxSizing: 'border-box',
};

const cardTopStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const cardCostStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 700,
  color: '#D4AF37',
  backgroundColor: 'rgba(212, 175, 55, 0.1)',
  padding: '0.15rem 0.4rem',
  borderRadius: '2px',
  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
};

const cardNameStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  fontWeight: 600,
  color: '#FAF9F6',
  margin: '0.5rem 0 0.2rem',
};

const cardEffectStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  lineHeight: 1.35,
  color: '#8B7E74',
};

const stageActionsRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem',
  paddingTop: '0.5rem',
  borderTop: '1px solid rgba(139, 126, 116, 0.15)',
  flexWrap: 'wrap',
};

const primaryActionBtnStyle: React.CSSProperties = {
  height: '42px',
  padding: '0 1.75rem',
  backgroundColor: '#4C5C4C',
  color: '#FAF9F6',
  fontSize: '0.88rem',
  fontWeight: 600,
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  textDecoration: 'none',
  transition: 'background-color 0.15s ease',
};

const secondaryActionBtnStyle: React.CSSProperties = {
  height: '42px',
  padding: '0 1.25rem',
  backgroundColor: '#191B1D',
  border: '1px solid rgba(139, 126, 116, 0.25)',
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
