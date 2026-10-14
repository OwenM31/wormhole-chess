import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const isLogin = mode === 'login';

  return (
    <div style={containerStyle}>
      <Navigation />

      <main style={mainContentStyle}>
        <div style={authCardStyle}>
          <div style={badgeStyle}>Roadmap Phase 2 Auth</div>
          <h1 style={titleStyle}>{isLogin ? 'Sign In' : 'Create Account'}</h1>
          <p style={descriptionStyle}>
            {isLogin
              ? 'Access your saved decks, match history, and rankings across devices.'
              : 'Join the Wormhole Chess platform to track stats and compete on leaderboards.'}
          </p>

          <form onSubmit={(e) => e.preventDefault()} style={formStyle}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Username</label>
              <input
                type="text"
                placeholder="Enter username"
                style={inputStyle}
                disabled
              />
            </div>

            {!isLogin && (
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Email (optional)</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  style={inputStyle}
                  disabled
                />
              </div>
            )}

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                style={inputStyle}
                disabled
              />
            </div>

            <button type="button" style={submitButtonStyle} disabled>
              {isLogin ? 'Sign In (Phase 2 Preview)' : 'Register (Phase 2 Preview)'}
            </button>
          </form>

          <div style={switchPromptStyle}>
            {isLogin ? (
              <span>
                Don't have an account?{' '}
                <Link to="/register" style={linkStyle}>
                  Sign Up
                </Link>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <Link to="/login" style={linkStyle}>
                  Sign In
                </Link>
              </span>
            )}
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link to="/" style={linkStyle}>
              ← Continue as Guest to Home
            </Link>
          </div>
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
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3rem 1.5rem',
};

const authCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '440px',
  backgroundColor: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '12px',
  padding: '2.5rem',
  boxSizing: 'border-box',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.3rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  backgroundColor: 'rgba(88, 166, 255, 0.12)',
  color: '#58a6ff',
  borderRadius: '20px',
  border: '1px solid rgba(88, 166, 255, 0.25)',
  marginBottom: '1rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  margin: '0 0 0.5rem',
  color: '#f0f6fc',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  lineHeight: 1.5,
  color: '#8b949e',
  margin: '0 0 2rem',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  textAlign: 'left',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  fontWeight: 600,
  color: '#c9d1d9',
};

const inputStyle: React.CSSProperties = {
  padding: '0.65rem 0.85rem',
  backgroundColor: '#0d1117',
  border: '1px solid #30363d',
  borderRadius: '6px',
  color: '#8b949e',
  fontSize: '0.95rem',
  outline: 'none',
};

const submitButtonStyle: React.CSSProperties = {
  marginTop: '0.5rem',
  padding: '0.75rem',
  backgroundColor: '#238636',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'not-allowed',
  opacity: 0.7,
};

const switchPromptStyle: React.CSSProperties = {
  marginTop: '1.5rem',
  fontSize: '0.9rem',
  color: '#8b949e',
  textAlign: 'center',
};

const linkStyle: React.CSSProperties = {
  color: '#58a6ff',
  textDecoration: 'none',
  fontSize: '0.9rem',
};

export default AuthPage;
