import React from 'react';
import { NavLink } from 'react-router-dom';

export const Navigation: React.FC = () => {
  return (
    <header style={navContainerStyle}>
      <div style={brandContainerStyle}>
        <NavLink to="/" style={brandLinkStyle}>
          <span style={logoBadgeStyle}>🌀</span>
          <span style={brandTitleStyle}>Wormhole Chess</span>
        </NavLink>
      </div>

      <nav style={navLinksStyle}>
        <NavLink
          to="/"
          style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}
          end
        >
          Home
        </NavLink>
        <NavLink
          to="/wormhole"
          style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}
        >
          3D Wormhole
        </NavLink>
        <NavLink
          to="/deck-builder"
          style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}
        >
          Deck Builder
        </NavLink>
        <NavLink
          to="/dashboard"
          style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}
        >
          Dashboard
        </NavLink>
      </nav>

      <div style={authContainerStyle}>
        <NavLink
          to="/login"
          style={loginButtonStyle}
        >
          Sign In
        </NavLink>
      </div>
    </header>
  );
};

const navContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.85rem 2rem',
  backgroundColor: '#0d1117',
  borderBottom: '1px solid #21262d',
  color: '#c9d1d9',
  boxSizing: 'border-box',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const brandContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const brandLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  textDecoration: 'none',
  color: '#f0f6fc',
  fontWeight: 700,
  fontSize: '1.15rem',
  letterSpacing: '-0.02em',
};

const logoBadgeStyle: React.CSSProperties = {
  fontSize: '1.35rem',
};

const brandTitleStyle: React.CSSProperties = {
  fontWeight: 700,
};

const navLinksStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
};

const linkStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: '#8b949e',
  fontSize: '0.95rem',
  fontWeight: 500,
  padding: '0.4rem 0.6rem',
  borderRadius: '6px',
  transition: 'color 0.15s ease',
};

const activeLinkStyle: React.CSSProperties = {
  ...linkStyle,
  color: '#58a6ff',
  backgroundColor: 'rgba(56, 139, 253, 0.12)',
};

const authContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const loginButtonStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: '#f0f6fc',
  backgroundColor: '#238636',
  padding: '0.45rem 1rem',
  borderRadius: '6px',
  fontSize: '0.9rem',
  fontWeight: 600,
  transition: 'background-color 0.15s ease',
};

export default Navigation;
