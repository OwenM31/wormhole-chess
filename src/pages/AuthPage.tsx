import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  mode?: 'login' | 'register';
}

type TabMode = 'login' | 'register' | 'guest';

export const AuthPage: React.FC<AuthPageProps> = ({ mode = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, register, loginAsGuest, isLoading: authLoading, error: authError, clearError } = useAuth();

  const [activeTab, setActiveTab] = useState<TabMode>(
    location.pathname === '/register' || mode === 'register' ? 'register' : 'login'
  );

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (location.pathname === '/register') {
      setActiveTab('register');
    } else if (location.pathname === '/login') {
      setActiveTab('login');
    }
  }, [location.pathname]);

  // If already authenticated as a registered user, redirect to dashboard
  useEffect(() => {
    if (user && !user.isGuest) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleTabChange = (tab: TabMode) => {
    clearError();
    setFormError(null);
    setActiveTab(tab);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError(null);

    if (!username.trim() || !password) {
      setFormError('Please provide both username and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ username: username.trim(), password });
      navigate('/dashboard');
    } catch {
      // error is handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError(null);

    const trimmedUser = username.trim();
    if (!trimmedUser || trimmedUser.length < 3 || trimmedUser.length > 24) {
      setFormError('Username must be between 3 and 24 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUser)) {
      setFormError('Username may only contain letters, numbers, and underscores.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        username: trimmedUser,
        password,
        email: email.trim() || undefined,
      });
      navigate('/dashboard');
    } catch {
      // error is handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestSubmit = async () => {
    clearError();
    setFormError(null);
    try {
      setIsSubmitting(true);
      await loginAsGuest();
      navigate('/dashboard');
    } catch {
      // error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = formError || authError;

  return (
    <div style={containerStyle}>
      <style>{`
        .auth-tab-btn {
          outline: none;
        }
        .auth-tab-btn:hover {
          color: #FAF9F6 !important;
        }
        .auth-tab-btn:focus-visible,
        .auth-submit-btn:focus-visible {
          outline: 2px solid rgba(212, 175, 55, 0.85) !important;
          outline-offset: 2px !important;
        }
        .auth-input:focus {
          border-color: #D4AF37 !important;
          box-shadow: 0 0 0 1px rgba(212, 175, 55, 0.4) !important;
        }
        .auth-submit-btn {
          transition: background-color 0.15s ease, opacity 0.15s ease;
        }
        .auth-submit-btn:hover:not(:disabled) {
          background-color: #5d705d !important;
        }
        .auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .auth-main {
            padding: 1.5rem 1rem !important;
          }
          .auth-card {
            padding: 1.25rem 1rem !important;
          }
        }
      `}</style>
      <Navigation />

      <main style={mainContentStyle} className="auth-main">
        <div style={authCardStyle} className="auth-card">
          {/* Guest Upgrade Alert */}
          {user?.isGuest && (
            <div style={guestNoticeBannerStyle}>
              <span>🎮</span>
              <div>
                Playing as <strong style={{ color: '#D4AF37' }}>{user.username}</strong>. Registering links your stats.
              </div>
            </div>
          )}

          {/* Segmented Navigation Tabs */}
          <div style={tabContainerStyle} role="tablist" aria-label="Authentication Modes">
            <button
              type="button"
              role="tab"
              id="auth-tab-login"
              aria-selected={activeTab === 'login'}
              aria-controls="auth-panel-login"
              className="auth-tab-btn"
              onClick={() => handleTabChange('login')}
              style={activeTab === 'login' ? activeTabStyle : tabStyle}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              id="auth-tab-register"
              aria-selected={activeTab === 'register'}
              aria-controls="auth-panel-register"
              className="auth-tab-btn"
              onClick={() => handleTabChange('register')}
              style={activeTab === 'register' ? activeTabStyle : tabStyle}
            >
              {user?.isGuest ? 'Upgrade' : 'Register'}
            </button>
            <button
              type="button"
              role="tab"
              id="auth-tab-guest"
              aria-selected={activeTab === 'guest'}
              aria-controls="auth-panel-guest"
              className="auth-tab-btn"
              onClick={() => handleTabChange('guest')}
              style={activeTab === 'guest' ? activeTabStyle : tabStyle}
            >
              Guest
            </button>
          </div>

          {displayError && (
            <div style={errorAlertStyle} role="alert" className="auth-error-banner">
              <span>⚠️</span>
              <span>{displayError}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form
              onSubmit={handleLoginSubmit}
              noValidate
              style={formStyle}
              role="tabpanel"
              id="auth-panel-login"
              aria-labelledby="auth-tab-login"
            >
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={inputStyle}
                  className="auth-input"
                  required
                  autoFocus
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  className="auth-input"
                  required
                />
              </div>

              <button
                type="submit"
                style={submitButtonStyle}
                className="auth-submit-btn"
                disabled={isSubmitting || authLoading}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <form
              onSubmit={handleRegisterSubmit}
              noValidate
              style={formStyle}
              role="tabpanel"
              id="auth-panel-register"
              aria-labelledby="auth-tab-register"
            >
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  placeholder="3-24 characters"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={inputStyle}
                  className="auth-input"
                  required
                  autoFocus
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Email (optional)</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  className="auth-input"
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  className="auth-input"
                  required
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                  className="auth-input"
                  required
                />
              </div>

              <button
                type="submit"
                style={submitButtonStyle}
                className="auth-submit-btn"
                disabled={isSubmitting || authLoading}
              >
                {isSubmitting
                  ? 'Saving...'
                  : user?.isGuest
                  ? 'Upgrade Account'
                  : 'Create Account'}
              </button>
            </form>
          )}

          {/* GUEST MODE */}
          {activeTab === 'guest' && (
            <div
              style={{ textAlign: 'center' }}
              role="tabpanel"
              id="auth-panel-guest"
              aria-labelledby="auth-tab-guest"
            >
              <div style={guestFeatureCardStyle}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⚡</div>
                <div style={{ margin: '0 0 0.35rem', color: '#FAF9F6', fontSize: '1rem', fontWeight: 600 }}>
                  Instant Guest Play
                </div>
                <p style={{ margin: 0, color: '#8B7E74', fontSize: '0.82rem', lineHeight: 1.45 }}>
                  Play both 3D and 2D variants immediately. Convert to a permanent account anytime.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGuestSubmit}
                style={submitButtonStyle}
                className="auth-submit-btn"
                disabled={isSubmitting || authLoading}
              >
                {isSubmitting ? 'Entering...' : 'Play as Guest'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

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
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3rem 1.5rem',
};

const authCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '400px',
  backgroundColor: '#24272A',
  border: '1px solid rgba(139, 126, 116, 0.25)',
  borderRadius: '6px',
  padding: '1.75rem',
  boxSizing: 'border-box',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
};

const guestNoticeBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.65rem',
  backgroundColor: 'rgba(212, 175, 55, 0.08)',
  border: '1px solid rgba(212, 175, 55, 0.25)',
  borderRadius: '4px',
  padding: '0.6rem 0.75rem',
  marginBottom: '1.25rem',
  fontSize: '0.8rem',
  lineHeight: 1.4,
  color: '#FAF9F6',
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  backgroundColor: '#191B1D',
  padding: '3px',
  borderRadius: '4px',
  border: '1px solid rgba(139, 126, 116, 0.15)',
  marginBottom: '1.5rem',
};

const tabStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  color: '#8B7E74',
  padding: '0.45rem 0.25rem',
  borderRadius: '3px',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  textAlign: 'center',
};

const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  color: '#FAF9F6',
  backgroundColor: '#24272A',
  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
};

const errorAlertStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  backgroundColor: 'rgba(170, 74, 68, 0.15)',
  border: '1px solid rgba(170, 74, 68, 0.4)',
  borderRadius: '4px',
  padding: '0.6rem 0.75rem',
  marginBottom: '1rem',
  fontSize: '0.82rem',
  color: '#FAF9F6',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  textAlign: 'left',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#8B7E74',
};

const inputStyle: React.CSSProperties = {
  padding: '0.65rem 0.75rem',
  backgroundColor: '#191B1D',
  border: '1px solid rgba(139, 126, 116, 0.25)',
  borderRadius: '4px',
  color: '#FAF9F6',
  fontSize: '0.88rem',
  outline: 'none',
  transition: 'border-color 0.15s ease',
};

const submitButtonStyle: React.CSSProperties = {
  width: '100%',
  height: '38px',
  backgroundColor: '#4C5C4C',
  color: '#FAF9F6',
  border: 'none',
  borderRadius: '4px',
  fontWeight: 600,
  fontSize: '0.88rem',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  marginTop: '0.25rem',
};

const guestFeatureCardStyle: React.CSSProperties = {
  backgroundColor: '#191B1D',
  border: '1px solid rgba(139, 126, 116, 0.2)',
  borderRadius: '4px',
  padding: '1.25rem 1rem',
  marginBottom: '1.25rem',
};

export default AuthPage;
