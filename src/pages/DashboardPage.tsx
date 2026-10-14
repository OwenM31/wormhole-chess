import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';

export const DashboardPage: React.FC = () => {
  return (
    <div style={containerStyle}>
      <Navigation />

      <main style={mainContentStyle}>
        <div style={badgeStyle}>Roadmap Phase 2</div>
        <h1 style={titleStyle}>User Dashboard & Match History</h1>
        <p style={descriptionStyle}>
          Profile overview, match history, ELO rating progression, and deck customization hubs are scheduled for delivery in Phase 2.
        </p>

        <div style={gridStyle}>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>Status</span>
            <span style={statValueStyle}>Guest Mode</span>
          </div>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>Games Played</span>
            <span style={statValueStyle}>0</span>
          </div>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>Deck Slots</span>
            <span style={statValueStyle}>3 Available</span>
          </div>
        </div>

        <div style={{ marginTop: '2.5rem' }}>
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
  maxWidth: '850px',
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
  backgroundColor: 'rgba(88, 166, 255, 0.15)',
  color: '#58a6ff',
  borderRadius: '20px',
  border: '1px solid rgba(88, 166, 255, 0.3)',
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

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1.5rem',
};

const statCardStyle: React.CSSProperties = {
  backgroundColor: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '12px',
  padding: '1.75rem',
  textAlign: 'left',
};

const statLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  color: '#8b949e',
  marginBottom: '0.5rem',
};

const statValueStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '1.35rem',
  fontWeight: 700,
  color: '#f0f6fc',
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

export default DashboardPage;
