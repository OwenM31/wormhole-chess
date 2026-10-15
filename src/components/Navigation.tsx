import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isMuted, toggleMuted } from '../utils/soundEffects';

export const Navigation: React.FC = () => {
  const { user, stats, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [muted, setMutedState] = useState<boolean>(() => isMuted());

  useEffect(() => {
    const handleMuteChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ muted: boolean }>;
      if (customEvent.detail) {
        setMutedState(customEvent.detail.muted);
      } else {
        setMutedState(isMuted());
      }
    };
    window.addEventListener('wormhole_sfx_mute_change', handleMuteChange);
    return () => window.removeEventListener('wormhole_sfx_mute_change', handleMuteChange);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const elo = stats?.eloRating ?? 1200;

  return (
    <header style={navContainerStyle}>
      <div style={brandGroupStyle}>
        <NavLink to="/" style={brandLinkStyle}>
          <span>Wormhole Chess</span>
          <span style={brandBadgeStyle}>v2.0</span>
        </NavLink>

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
            Wormhole
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
            Profile
          </NavLink>
        </nav>
      </div>

      <div style={authContainerStyle}>
        <button
          onClick={() => {
            const next = toggleMuted();
            setMutedState(next);
          }}
          style={soundToggleButtonStyle}
          title={muted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          aria-label={muted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        >
          {muted ? '🔇' : '🔊'}
        </button>

        {isLoading ? (
          <span style={loadingTextStyle}>Connecting...</span>
        ) : user ? (
          <div style={userSectionStyle}>
            <Link to="/dashboard" style={userPillLinkStyle}>
              <span style={monoTextStyle}>
                {user.username} · {elo} ELO
              </span>
              {user.isGuest && <span style={guestChipStyle}>Guest</span>}
            </Link>

            {user.isGuest ? (
              <Link to="/register" style={createAccountBtnStyle}>
                Create Account
              </Link>
            ) : null}

            <button onClick={handleLogout} style={signOutButtonStyle}>
              Sign Out
            </button>
          </div>
        ) : (
          <NavLink to="/login" style={signInButtonStyle}>
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
  padding: '0 1.5rem',
  height: '52px',
  backgroundColor: '#0c0e14',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  color: '#e2e8f0',
  boxSizing: 'border-box',
  position: 'sticky',
  top: 0,
  zIndex: 100,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
};

const brandGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '2rem',
};

const brandLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  textDecoration: 'none',
  color: '#f8fafc',
  fontWeight: 700,
  fontSize: '0.95rem',
  letterSpacing: '-0.01em',
};

const brandBadgeStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  backgroundColor: 'rgba(56, 189, 248, 0.12)',
  color: '#38bdf8',
  border: '1px solid rgba(56, 189, 248, 0.25)',
  borderRadius: '4px',
  padding: '0.1rem 0.4rem',
  letterSpacing: '0.02em',
};

const navLinksStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
};

const linkStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: '#94a3b8',
  fontSize: '0.85rem',
  fontWeight: 500,
  padding: '0.35rem 0.75rem',
  borderRadius: '4px',
  transition: 'all 0.15s ease',
};

const activeLinkStyle: React.CSSProperties = {
  ...linkStyle,
  color: '#f8fafc',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
};

const authContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const loadingTextStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '0.8rem',
};

const userSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const userPillLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  textDecoration: 'none',
  color: '#f1f5f9',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '0.35rem 0.75rem',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: 500,
  transition: 'border-color 0.15s ease',
};

const monoTextStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  fontVariantNumeric: 'tabular-nums',
};

const guestChipStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  backgroundColor: 'rgba(210, 153, 34, 0.15)',
  color: '#d29922',
  border: '1px solid rgba(210, 153, 34, 0.3)',
  borderRadius: '3px',
  padding: '0.05rem 0.35rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const createAccountBtnStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: '#f8fafc',
  backgroundColor: '#2563eb',
  padding: '0.35rem 0.75rem',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: 500,
  transition: 'background-color 0.15s ease',
};

const signInButtonStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: '#ffffff',
  backgroundColor: '#10b981',
  padding: '0.4rem 0.85rem',
  borderRadius: '4px',
  fontSize: '0.85rem',
  fontWeight: 600,
  transition: 'background-color 0.15s ease',
};

const signOutButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#94a3b8',
  padding: '0.35rem 0.5rem',
  borderRadius: '4px',
  fontSize: '0.8rem',
  cursor: 'pointer',
  transition: 'color 0.15s ease',
};

const soundToggleButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px',
  color: '#94a3b8',
  fontSize: '0.85rem',
  width: '32px',
  height: '32px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'border-color 0.15s ease, color 0.15s ease',
};

export default Navigation;
