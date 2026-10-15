import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navigation: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

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
        {isLoading ? (
          <span style={loadingTextStyle}>Connecting...</span>
        ) : user ? (
          <div style={userSectionStyle}>
            <Link to="/dashboard" style={userBadgeLinkStyle}>
              <span style={userAvatarStyle}>{user.isGuest ? '👾' : '👑'}</span>
              <span style={usernameTextStyle}>{user.username}</span>
              {user.isGuest && <span style={guestChipStyle}>Guest</span>}
            </Link>

            {user.isGuest ? (
              <Link to="/register" style={registerUpgradeBtnStyle}>
                Upgrade
              </Link>
            ) : null}

            <button onClick={handleLogout} style={signOutButtonStyle}>
              Sign Out
            </button>
          </div>
        ) : (
          <NavLink to="/login" style={loginButtonStyle}>
            Sign In
          </NavLink>
        )}
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

const loadingTextStyle: React.CSSProperties = {
  color: '#8b949e',
  fontSize: '0.85rem',
};

const userSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const userBadgeLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  textDecoration: 'none',
  color: '#c9d1d9',
  backgroundColor: '#161b22',
  border: '1px solid #30363d',
  padding: '0.35rem 0.75rem',
  borderRadius: '20px',
  fontSize: '0.85rem',
  fontWeight: 600,
  transition: 'border-color 0.15s ease',
};

const userAvatarStyle: React.CSSProperties = {
  fontSize: '1rem',
};

const usernameTextStyle: React.CSSProperties = {
  maxWidth: '120px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const guestChipStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  backgroundColor: 'rgba(210, 153, 34, 0.2)',
  color: '#d29922',
  border: '1px solid rgba(210, 153, 34, 0.4)',
  borderRadius: '10px',
  padding: '0.1rem 0.4rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const registerUpgradeBtnStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: '#f0f6fc',
  backgroundColor: '#8957e5',
  padding: '0.4rem 0.85rem',
  borderRadius: '6px',
  fontSize: '0.85rem',
  fontWeight: 600,
  transition: 'background-color 0.15s ease',
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

const signOutButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #30363d',
  color: '#8b949e',
  padding: '0.4rem 0.75rem',
  borderRadius: '6px',
  fontSize: '0.85rem',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

export default Navigation;
