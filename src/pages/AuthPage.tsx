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
      <Navigation />

      <main style={mainContentStyle}>
        <div style={authCardStyle}>
          {/* Guest Upgrade Alert */}
          {user?.isGuest && (
            <div style={guestNoticeBannerStyle}>
              <span style={{ fontSize: '1.25rem' }}>🎮</span>
              <div>
                <strong>Active Guest Session:</strong> You are currently playing as{' '}
                <span style={{ color: '#58a6ff' }}>{user.username}</span>. Registering will permanently link your stats and rating!
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div style={tabContainerStyle}>
            <button
              type="button"
              onClick={() => handleTabChange('login')}
              style={activeTab === 'login' ? activeTabStyle : tabStyle}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('register')}
              style={activeTab === 'register' ? activeTabStyle : tabStyle}
            >
              {user?.isGuest ? 'Upgrade Account' : 'Create Account'}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('guest')}
              style={activeTab === 'guest' ? activeTabStyle : tabStyle}
            >
              Play as Guest
            </button>
          </div>

          <h1 style={titleStyle}>
            {activeTab === 'login' && 'Sign In'}
            {activeTab === 'register' && (user?.isGuest ? 'Upgrade Guest Account' : 'Create Account')}
            {activeTab === 'guest' && 'Guest Onboarding'}
          </h1>

          <p style={descriptionStyle}>
            {activeTab === 'login' && 'Access your competitive rating, custom decks, and match history across all devices.'}
            {activeTab === 'register' && (user?.isGuest
              ? 'Choose a permanent username and password to secure your existing rating and match record.'
              : 'Join the Wormhole Chess arena to construct decks and climb the non-Euclidean leaderboard.')}
            {activeTab === 'guest' && 'Jump straight into the action immediately without entering an email or password.'}
          </p>

          {displayError && (
            <div style={errorAlertStyle}>
              <span>⚠️</span>
              <span>{displayError}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} style={formStyle}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={inputStyle}
                  required
                  autoFocus
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <button
                type="submit"
                style={submitButtonStyle}
                disabled={isSubmitting || authLoading}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} style={formStyle}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  placeholder="3-24 characters (letters, numbers, _)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={inputStyle}
                  required
                  autoFocus
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Email (optional)</label>
                <input
                  type="email"
                  placeholder="player@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <button
                type="submit"
                style={submitButtonStyle}
                disabled={isSubmitting || authLoading}
              >
                {isSubmitting
                  ? 'Saving Account...'
                  : user?.isGuest
                  ? 'Upgrade & Link Stats'
                  : 'Create Free Account'}
              </button>
            </form>
          )}

          {/* GUEST MODE */}
          {activeTab === 'guest' && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <div style={guestFeatureCardStyle}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚡</div>
                <h3 style={{ margin: '0 0 0.5rem', color: '#f0f6fc', fontSize: '1.15rem' }}>
                  Instant Anonymous Access
                </h3>
                <p style={{ margin: 0, color: '#8b949e', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Play both 3D Wormhole Chess and 2D Deck Builder Chess with full stats tracking. You can convert to a full registered account anytime!
                </p>
              </div>

              <button
                type="button"
                onClick={handleGuestSubmit}
                style={guestActionBtnStyle}
                disabled={isSubmitting || authLoading}
              >
                {isSubmitting ? 'Entering Arena...' : 'Launch Instant Guest Session 🚀'}
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
  maxWidth: '480px',
  backgroundColor: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '14px',
  padding: '2.5rem',
  boxSizing: 'border-box',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
};

const guestNoticeBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  backgroundColor: 'rgba(56, 139, 253, 0.1)',
  border: '1px solid rgba(56, 139, 253, 0.3)',
  borderRadius: '8px',
  padding: '0.75rem 1rem',
  marginBottom: '1.5rem',
  fontSize: '0.85rem',
  lineHeight: 1.4,
  color: '#c9d1d9',
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  backgroundColor: '#0d1117',
  padding: '4px',
  borderRadius: '8px',
  border: '1px solid #21262d',
  marginBottom: '1.75rem',
  gap: '4px',
};

const tabStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  color: '#8b949e',
  padding: '0.6rem 0.5rem',
  borderRadius: '6px',
  fontSize: '0.88rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  color: '#f0f6fc',
  backgroundColor: '#21262d',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.85rem',
  fontWeight: 700,
  margin: '0 0 0.5rem',
  color: '#f0f6fc',
  letterSpacing: '-0.02em',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '0.92rem',
  lineHeight: 1.5,
  color: '#8b949e',
  margin: '0 0 1.75rem',
};

const errorAlertStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  backgroundColor: 'rgba(248, 81, 73, 0.15)',
  border: '1px solid rgba(248, 81, 73, 0.4)',
  borderRadius: '6px',
  padding: '0.75rem 1rem',
  marginBottom: '1.25rem',
  fontSize: '0.88rem',
  color: '#f85149',
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
  padding: '0.75rem 0.9rem',
  backgroundColor: '#0d1117',
  border: '1px solid #30363d',
  borderRadius: '6px',
  color: '#f0f6fc',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color 0.15s ease',
};

const submitButtonStyle: React.CSSProperties = {
  marginTop: '0.5rem',
  padding: '0.85rem',
  backgroundColor: '#238636',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
};

const guestFeatureCardStyle: React.CSSProperties = {
  backgroundColor: '#0d1117',
  border: '1px solid #21262d',
  borderRadius: '10px',
  padding: '1.5rem',
  marginBottom: '1.5rem',
};

const guestActionBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.9rem',
  backgroundColor: '#1f6feb',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
};

export default AuthPage;
