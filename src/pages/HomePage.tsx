import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';

export const HomePage: React.FC = () => {
  return (
    <div style={containerStyle}>
      <Navigation />

      <main style={mainContentStyle}>
        {/* Hero Section */}
        <section style={heroSectionStyle}>
          <div style={badgeStyle}>Multi-Variant Chess Platform</div>
          <h1 style={heroHeadingStyle}>
            Redefining Chess in Higher Dimensions & Tactical Cards
          </h1>
          <p style={heroSubtextStyle}>
            Experience non-Euclidean 3D board topology where wormholes connect disconnected boards,
            or battle in 2D Deck Builder Chess where every move is fueled by custom card abilities.
          </p>
        </section>

        {/* Game Variants Grid */}
        <section style={variantsSectionStyle}>
          <h2 style={sectionTitleStyle}>Choose Your Variant</h2>
          <div style={cardsGridStyle}>
            {/* Wormhole 3D Card */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <span style={cardIconStyle}>🌀</span>
                <span style={statusTagLiveStyle}>Playable (3D)</span>
              </div>
              <h3 style={cardTitleStyle}>3D Wormhole Chess</h3>
              <p style={cardDescriptionStyle}>
                Navigate 8x8 boards connected through spatial wormhole tiles. Pieces travel through dimensional portals with custom lighting, camera controls, and non-Euclidean movement.
              </p>
              <div style={cardFooterStyle}>
                <Link to="/wormhole" style={primaryButtonActionStyle}>
                  Launch 3D Wormhole Chess →
                </Link>
              </div>
            </div>

            {/* Deck Builder Card */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <span style={cardIconStyle}>🃏</span>
                <span style={statusTagLiveStyle}>Playable (2D)</span>
              </div>
              <h3 style={cardTitleStyle}>Deck Builder Chess</h3>
              <p style={cardDescriptionStyle}>
                Draft tactical cards to modify piece movement, place barriers, create portal hazards, and execute game-changing combos in synchronous turn-based battles.
              </p>
              <div style={cardFooterStyle}>
                <Link to="/deck-builder" style={primaryButtonActionStyle}>
                  Play Deck Builder Chess →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Highlights */}
        <section style={featuresSectionStyle}>
          <h2 style={sectionTitleStyle}>Platform Highlights</h2>
          <div style={featuresGridStyle}>
            <div style={featureItemStyle}>
              <div style={featureIconStyle}>⚡</div>
              <h4 style={featureTitleStyle}>Edge-Powered Multiplayer</h4>
              <p style={featureDescriptionStyle}>
                Zero-cold-start turn coordination powered by Cloudflare Workers and Durable Objects.
              </p>
            </div>
            <div style={featureItemStyle}>
              <div style={featureIconStyle}>👤</div>
              <h4 style={featureTitleStyle}>Instant Guest Access</h4>
              <p style={featureDescriptionStyle}>
                Jump directly into games with 1-click anonymous guest sessions or create an account to save stats.
              </p>
            </div>
            <div style={featureItemStyle}>
              <div style={featureIconStyle}>🤖</div>
              <h4 style={featureTitleStyle}>AI Testing Opponent</h4>
              <p style={featureDescriptionStyle}>
                Hone your strategies against an integrated tactical AI opponent with zero matchmaking wait time.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#090d16',
  color: '#e6edf3',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const mainContentStyle: React.CSSProperties = {
  flex: 1,
  maxWidth: '1200px',
  width: '100%',
  margin: '0 auto',
  padding: '3rem 2rem 5rem',
  boxSizing: 'border-box',
};

const heroSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  maxWidth: '820px',
  margin: '2rem auto 4rem',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.35rem 0.85rem',
  fontSize: '0.82rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  backgroundColor: 'rgba(88, 166, 255, 0.12)',
  color: '#58a6ff',
  borderRadius: '20px',
  border: '1px solid rgba(88, 166, 255, 0.25)',
  marginBottom: '1.25rem',
};

const heroHeadingStyle: React.CSSProperties = {
  fontSize: '2.8rem',
  fontWeight: 800,
  lineHeight: 1.2,
  letterSpacing: '-0.03em',
  margin: '0 0 1.25rem',
  background: 'linear-gradient(180deg, #ffffff 0%, #8b949e 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const heroSubtextStyle: React.CSSProperties = {
  fontSize: '1.15rem',
  lineHeight: 1.6,
  color: '#8b949e',
  margin: '0 auto',
};

const variantsSectionStyle: React.CSSProperties = {
  marginBottom: '4.5rem',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.6rem',
  fontWeight: 700,
  color: '#f0f6fc',
  marginBottom: '1.75rem',
  textAlign: 'center',
};

const cardsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1.75rem',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '12px',
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  transition: 'border-color 0.2s ease, transform 0.2s ease',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '1rem',
};

const cardIconStyle: React.CSSProperties = {
  fontSize: '2rem',
};

const statusTagLiveStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  padding: '0.25rem 0.6rem',
  borderRadius: '12px',
  backgroundColor: 'rgba(46, 160, 67, 0.15)',
  color: '#3fb950',
  border: '1px solid rgba(63, 185, 80, 0.3)',
};

const statusTagRoadmapStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  padding: '0.25rem 0.6rem',
  borderRadius: '12px',
  backgroundColor: 'rgba(210, 153, 34, 0.15)',
  color: '#d29922',
  border: '1px solid rgba(210, 153, 34, 0.3)',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '1.35rem',
  fontWeight: 700,
  margin: '0 0 0.75rem',
  color: '#f0f6fc',
};

const cardDescriptionStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  lineHeight: 1.55,
  color: '#8b949e',
  margin: '0 0 1.75rem',
  flex: 1,
};

const cardFooterStyle: React.CSSProperties = {
  marginTop: 'auto',
};

const primaryButtonActionStyle: React.CSSProperties = {
  display: 'inline-block',
  width: '100%',
  textAlign: 'center',
  padding: '0.75rem 1.25rem',
  backgroundColor: '#1f6feb',
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: 600,
  borderRadius: '8px',
  boxSizing: 'border-box',
};

const secondaryButtonActionStyle: React.CSSProperties = {
  display: 'inline-block',
  width: '100%',
  textAlign: 'center',
  padding: '0.75rem 1.25rem',
  backgroundColor: '#21262d',
  color: '#c9d1d9',
  border: '1px solid #30363d',
  textDecoration: 'none',
  fontWeight: 600,
  borderRadius: '8px',
  boxSizing: 'border-box',
};

const featuresSectionStyle: React.CSSProperties = {
  borderTop: '1px solid #21262d',
  paddingTop: '3.5rem',
};

const featuresGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1.5rem',
};

const featureItemStyle: React.CSSProperties = {
  padding: '1.5rem',
  backgroundColor: 'rgba(22, 27, 34, 0.5)',
  borderRadius: '8px',
  border: '1px solid #21262d',
};

const featureIconStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  marginBottom: '0.75rem',
};

const featureTitleStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  margin: '0 0 0.5rem',
  color: '#f0f6fc',
};

const featureDescriptionStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  lineHeight: 1.5,
  color: '#8b949e',
  margin: 0,
};

export default HomePage;
