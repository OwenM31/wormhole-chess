import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';

export const DeckBuilderPage: React.FC = () => {
  return (
    <div style={containerStyle}>
      <Navigation />

      <main style={mainContentStyle}>
        <div style={badgeStyle}>Roadmap Phase 4</div>
        <h1 style={titleStyle}>Deck Builder Chess</h1>
        <p style={descriptionStyle}>
          Tactical card-infused 2D chess is currently under active development.
          In Phase 4, you will be able to customize 30-card battle decks, draft modifiers, and battle online or against our tactical AI.
        </p>

        <div style={cardPreviewBoxStyle}>
          <h3 style={{ margin: '0 0 1rem', color: '#f0f6fc' }}>Planned Mechanics</h3>
          <ul style={listStyle}>
            <li>Simultaneous turn loop: Play 1 tactical card + execute 1 chess move per turn</li>
            <li>Status-inflicting tiles (Barriers, Portals, Traps)</li>
            <li>Customizable card library with points-based deck building</li>
            <li>Pure 2D high-performance canvas / DOM board</li>
          </ul>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <Link to="/" style={backButtonStyle}>← Back to Home</Link>
        </div>
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
  maxWidth: '800px',
  margin: '4rem auto',
  padding: '0 2rem',
  textAlign: 'center',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.35rem 0.85rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  backgroundColor: 'rgba(210, 153, 34, 0.15)',
  color: '#d29922',
  borderRadius: '20px',
  border: '1px solid rgba(210, 153, 34, 0.3)',
  marginBottom: '1rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 700,
  margin: '0 0 1rem',
  color: '#f0f6fc',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  lineHeight: 1.6,
  color: '#8b949e',
  marginBottom: '2.5rem',
};

const cardPreviewBoxStyle: React.CSSProperties = {
  backgroundColor: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '12px',
  padding: '2rem',
  textAlign: 'left',
};

const listStyle: React.CSSProperties = {
  color: '#c9d1d9',
  lineHeight: 1.8,
  paddingLeft: '1.5rem',
  margin: 0,
};

const backButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.6rem 1.25rem',
  backgroundColor: '#21262d',
  color: '#c9d1d9',
  border: '1px solid #30363d',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 600,
};

export default DeckBuilderPage;
