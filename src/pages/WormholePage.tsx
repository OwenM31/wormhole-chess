import React from 'react';
import { Link } from 'react-router-dom';
import ChessboardScene from '../components/ChessboardScene';

export const WormholePage: React.FC = () => {
  return (
    <div style={containerStyle}>
      {/* Floating navigation overlay */}
      <div style={overlayNavStyle}>
        <Link to="/" style={homeLinkStyle} title="Return to Home">
          ← Home
        </Link>
        <span style={titleBadgeStyle}>3D Wormhole Chess</span>
      </div>

      {/* Full-viewport Three.js Canvas Container */}
      <div style={canvasContainerStyle}>
        <ChessboardScene />
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  backgroundColor: '#000000',
};

const overlayNavStyle: React.CSSProperties = {
  position: 'absolute',
  top: '1rem',
  left: '1rem',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const homeLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.5rem 1rem',
  backgroundColor: 'rgba(13, 17, 23, 0.85)',
  backdropFilter: 'blur(8px)',
  color: '#f0f6fc',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: 600,
  borderRadius: '8px',
  border: '1px solid rgba(48, 54, 61, 0.8)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  transition: 'background-color 0.2s ease, border-color 0.2s ease',
};

const titleBadgeStyle: React.CSSProperties = {
  padding: '0.5rem 0.85rem',
  backgroundColor: 'rgba(22, 27, 34, 0.75)',
  backdropFilter: 'blur(8px)',
  color: '#8b949e',
  fontSize: '0.85rem',
  fontWeight: 500,
  borderRadius: '8px',
  border: '1px solid rgba(48, 54, 61, 0.5)',
};

const canvasContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
};

export default WormholePage;
