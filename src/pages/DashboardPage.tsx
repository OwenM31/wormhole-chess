import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { MatchmakingLobby } from '../components/MatchmakingLobby';
import { api, MatchRecord } from '../services/api';
import { HistoricalMatchViewer } from '../components/HistoricalMatchViewer';

export const DashboardPage: React.FC = () => {
  const { user, stats, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'pvp' | 'solo_local'>('all');
  const [selectedReplayMatch, setSelectedReplayMatch] = useState<MatchRecord | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchMatches() {
      if (!user) return;
      setIsLoadingMatches(true);
      try {
        const res = await api.getMatchHistory({ limit: 50 });
        if (isMounted && res.success && Array.isArray(res.matches)) {
          setMatches(res.matches);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setIsLoadingMatches(false);
      }
    }
    fetchMatches();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const filteredMatches = matches.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'pvp') {
      return (
        m.variant === 'deck_builder:pvp' ||
        m.variant.includes('pvp') ||
        (m.whiteUserId && m.blackUserId)
      );
    }
    if (filter === 'solo_local') {
      return (
        m.variant === 'deck_builder:ai' ||
        m.variant.includes('ai') ||
        m.variant.includes('local') ||
        m.variant === 'wormhole:local'
      );
    }
    return true;
  });

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
      navigate('/');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Today';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <Navigation />
        <main style={{ ...mainContentStyle, textAlign: 'center', paddingTop: '6rem' }}>
          <p style={{ color: '#8B7E74' }}>Loading profile...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={containerStyle}>
        <Navigation />
        <main style={{ ...mainContentStyle, textAlign: 'center', paddingTop: '5rem' }}>
          <div style={authPromptCardStyle}>
            <h1 style={titleStyle}>Sign In Required</h1>
            <p style={descriptionStyle}>
              Sign in or play as a guest to access match history, ratings, and custom decks.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.25rem' }}>
              <Link to="/login" style={primaryBtnStyle}>
                Sign In
              </Link>
              <Link to="/register" style={secondaryBtnStyle}>
                Play as Guest
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const eloRating = stats?.eloRating ?? 1200;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const draws = stats?.draws ?? 0;
  const totalGames = stats?.totalGames ?? (wins + losses + draws);
  const winRate = stats?.winRate ?? (totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0);
  const initials = (user.username || 'U').substring(0, 2).toUpperCase();

  const onlineMatchesCount = matches.filter(
    (m) => m.variant.includes('pvp') || (m.whiteUserId && m.blackUserId)
  ).length;
  const offlineMatchesCount = matches.length - onlineMatchesCount;

  return (
    <div style={containerStyle}>
      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 960px) {
          .dashboard-grid {
            grid-template-columns: 1fr 340px;
          }
        }

        .dashboard-play-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 600px) {
          .dashboard-play-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 640px) {
          .dashboard-grid {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            margin-top: 1rem !important;
          }
          .dashboard-match-row {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 0.6rem !important;
          }
          .dashboard-match-meta-right {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
      <Navigation />

      <main style={gridContainerStyle} className="dashboard-grid">
        {/* LEFT COLUMN: Main Action Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
          {/* Play Modes Grid */}
          <div style={playGridStyle} className="dashboard-play-grid">
            {/* Wormhole 3D */}
            <div style={playCardStyle}>
              <div>
                <div style={playCardHeaderStyle}>
                  <span style={modeTagStyle}>3D</span>
                </div>
                <h3 style={playTitleStyle}>Wormhole</h3>
                <p style={playDescStyle}>3D chess across connected boards and portals.</p>
              </div>
              <Link to="/wormhole" style={btnPlayPrimaryStyle}>
                Play Wormhole →
              </Link>
            </div>

            {/* Deck Builder 2D */}
            <div style={playCardStyle}>
              <div>
                <div style={playCardHeaderStyle}>
                  <span style={modeTagStyle}>2D</span>
                </div>
                <h3 style={playTitleStyle}>Deck Builder</h3>
                <p style={playDescStyle}>Chess with card actions and energy management.</p>
              </div>
              <Link to="/deck-builder" style={btnPlayPurpleStyle}>
                Play Deck Builder →
              </Link>
            </div>
          </div>

          {/* Real-Time Matchmaking Lobby */}
          <div style={panelStyle}>
            <MatchmakingLobby />
          </div>

          {/* Match Archive Panel */}
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <span style={panelTitleStyle}>Recent Matches</span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  onClick={() => setFilter('all')}
                  style={filter === 'all' ? activeFilterBtnStyle : filterBtnStyle}
                >
                  All ({matches.length})
                </button>
                <button
                  onClick={() => setFilter('pvp')}
                  style={filter === 'pvp' ? activeFilterBtnStyle : filterBtnStyle}
                >
                  Online ({onlineMatchesCount})
                </button>
                <button
                  onClick={() => setFilter('solo_local')}
                  style={filter === 'solo_local' ? activeFilterBtnStyle : filterBtnStyle}
                >
                  Offline ({offlineMatchesCount})
                </button>
              </div>
            </div>

            {isLoadingMatches ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                Loading matches...
              </div>
            ) : filteredMatches.length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#FAF9F6' }}>
                  No match records found.
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#8B7E74' }}>
                  Play a match in either mode to record move history and replay data.
                </p>
              </div>
            ) : (
              <div>
                {filteredMatches.map((m) => {
                  const isDeck = m.variant.includes('deck_builder');
                  const isPvp =
                    m.variant.includes('pvp') ||
                    (Boolean(m.whiteUserId) && Boolean(m.blackUserId));
                  const isWhite = user ? m.whiteUserId === user.id : true;
                  const isDraw = m.result === '1/2-1/2' || m.result === 'draw';
                  const isVictory =
                    !isDraw &&
                    (m.winnerId === user?.id ||
                      (isWhite && m.result === '1-0') ||
                      (!isWhite && m.result === '0-1'));
                  const turnsCount = Array.isArray(m.moves) ? m.moves.length : 0;
                  const opponent = isWhite
                    ? m.blackUsername || (isPvp ? 'Online Opponent' : 'Minimax AI')
                    : m.whiteUsername || 'Opponent';

                  return (
                    <div key={m.id} style={matchRowStyle} className="dashboard-match-row">
                      <div style={matchMetaLeftStyle}>
                        <span
                          style={
                            isDraw
                              ? badgeDrawStyle
                              : isVictory
                              ? badgeWinStyle
                              : badgeLossStyle
                          }
                        >
                          {isDraw ? 'Draw' : isVictory ? 'Win' : 'Loss'}
                        </span>
                        <div>
                          <div style={matchVariantStyle}>
                            {isDeck ? 'Deck Builder' : 'Wormhole 3D'}
                          </div>
                          <div style={matchOpponentStyle}>vs {opponent}</div>
                        </div>
                      </div>

                      <div style={matchMetaRightStyle} className="dashboard-match-meta-right">
                        <span style={matchTimeStyle}>
                          {turnsCount} moves · {formatDate(m.startedAt)}
                        </span>
                        <button
                          onClick={() => setSelectedReplayMatch(m)}
                          style={btnReplayStyle}
                        >
                          Replay
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Profile, Stats & Loadouts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Profile Card */}
          <div style={profileCardStyle}>
            <div style={profileAvatarRowStyle}>
              <div style={avatarCircleStyle}>{initials}</div>
              <div>
                <div style={profileNameStyle}>
                  {user.username}
                  <span style={user.isGuest ? guestBadgeStyle : memberBadgeStyle}>
                    {user.isGuest ? 'Guest' : 'Member'}
                  </span>
                </div>
                <div style={profileMetaStyle}>Joined {formatDate(user.createdAt)}</div>
              </div>
            </div>

            {user.isGuest && (
              <div style={guestNoticeBoxStyle}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#8B7E74', lineHeight: 1.4 }}>
                  Playing as guest. Create an account to sync stats across devices.
                </p>
                <Link to="/register" style={btnCreateAccountStyle}>
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Stats Grid (2x2) */}
          <div style={statsGridStyle}>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}>Rating</div>
              <div style={{ ...statNumberStyle, color: '#D4AF37' }}>{eloRating}</div>
            </div>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}>Matches</div>
              <div style={statNumberStyle}>{totalGames}</div>
            </div>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}>Win Rate</div>
              <div style={{ ...statNumberStyle, color: '#FAF9F6' }}>{winRate}%</div>
            </div>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}>Record</div>
              <div style={{ ...statNumberStyle, fontSize: '1.15rem' }}>
                {wins}-{losses}-{draws}
              </div>
            </div>
          </div>

          {/* Tactical Deck Loadout Box */}
          <div style={loadoutBoxStyle}>
            <div style={loadoutTitleStyle}>Tactical Deck</div>
            <div style={loadoutDescStyle}>Starter Loadout · 8 cards active</div>
            <Link to="/deck-builder" style={btnManageDeckStyle}>
              Edit Deck →
            </Link>
          </div>
        </div>
      </main>

      {/* Historical Match Replay Modal */}
      {selectedReplayMatch && (
        <HistoricalMatchViewer
          match={selectedReplayMatch}
          onClose={() => setSelectedReplayMatch(null)}
        />
      )}
    </div>
  );
};

/* Styles adhering to locked tokens */
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#191B1D',
  color: '#FAF9F6',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
};

const mainContentStyle: React.CSSProperties = {
  maxWidth: '1240px',
  width: '100%',
  margin: '1.5rem auto 3rem',
  padding: '0 1.5rem',
  boxSizing: 'border-box',
};

const gridContainerStyle: React.CSSProperties = {
  maxWidth: '1240px',
  width: '100%',
  margin: '1.5rem auto 3rem',
  padding: '0 1.5rem',
  boxSizing: 'border-box',
  alignItems: 'start',
};

const panelStyle: React.CSSProperties = {
  backgroundColor: '#24272A',
  border: '1px solid rgba(139, 126, 116, 0.2)',
  borderRadius: '6px',
  overflow: 'hidden',
};

const panelHeaderStyle: React.CSSProperties = {
  padding: '0.85rem 1.15rem',
  backgroundColor: '#1C1E20',
  borderBottom: '1px solid rgba(139, 126, 116, 0.16)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '0.5rem',
};

const panelTitleStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#8B7E74',
};

const playGridStyle: React.CSSProperties = {
  width: '100%',
};

const playCardStyle: React.CSSProperties = {
  backgroundColor: '#24272A',
  border: '1px solid rgba(139, 126, 116, 0.2)',
  borderRadius: '6px',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: '1rem',
  transition: 'border-color 0.15s ease',
};

const playCardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

const modeTagStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  padding: '0.15rem 0.45rem',
  borderRadius: '3px',
  backgroundColor: '#1C1E20',
  color: '#8B7E74',
  border: '1px solid rgba(139, 126, 116, 0.2)',
};

const playTitleStyle: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 600,
  color: '#FAF9F6',
  margin: '0.35rem 0 0.35rem',
};

const playDescStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#8B7E74',
  lineHeight: 1.45,
  margin: 0,
};

const btnPlayPrimaryStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#4C5C4C',
  border: '1px solid rgba(76, 92, 76, 0.6)',
  color: '#FAF9F6',
  textDecoration: 'none',
  fontSize: '0.85rem',
  fontWeight: 500,
  padding: '0.55rem 1rem',
  borderRadius: '4px',
  transition: 'background-color 0.15s ease',
};

const btnPlayPurpleStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#282B2E',
  border: '1px solid rgba(212, 175, 55, 0.35)',
  color: '#FAF9F6',
  textDecoration: 'none',
  fontSize: '0.85rem',
  fontWeight: 500,
  padding: '0.55rem 1rem',
  borderRadius: '4px',
  transition: 'background-color 0.15s ease, border-color 0.15s ease',
};

const filterBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#8B7E74',
  fontSize: '0.75rem',
  fontWeight: 500,
  padding: '0.25rem 0.65rem',
  borderRadius: '3px',
  cursor: 'pointer',
};

const activeFilterBtnStyle: React.CSSProperties = {
  ...filterBtnStyle,
  background: '#1C1E20',
  color: '#FAF9F6',
  border: '1px solid rgba(212, 175, 55, 0.35)',
};

const matchRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 1.15rem',
  borderBottom: '1px solid rgba(139, 126, 116, 0.12)',
};

const matchMetaLeftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem',
};

const matchVariantStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#FAF9F6',
};

const matchOpponentStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#8B7E74',
};

const badgeWinStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  color: '#FAF9F6',
  backgroundColor: '#4C5C4C',
  border: '1px solid rgba(76, 92, 76, 0.6)',
  borderRadius: '3px',
  padding: '0.15rem 0.45rem',
};

const badgeLossStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  color: '#FAF9F6',
  backgroundColor: '#AA4A44',
  border: '1px solid rgba(170, 74, 68, 0.6)',
  borderRadius: '3px',
  padding: '0.15rem 0.45rem',
};

const badgeDrawStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  color: '#8B7E74',
  backgroundColor: 'rgba(139, 126, 116, 0.12)',
  border: '1px solid rgba(139, 126, 116, 0.2)',
  borderRadius: '3px',
  padding: '0.15rem 0.45rem',
};

const matchMetaRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const matchTimeStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#6E665E',
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  fontVariantNumeric: 'tabular-nums',
};

const btnReplayStyle: React.CSSProperties = {
  background: '#1C1E20',
  border: '1px solid rgba(139, 126, 116, 0.25)',
  color: '#FAF9F6',
  fontSize: '0.75rem',
  padding: '0.25rem 0.65rem',
  borderRadius: '3px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

/* Right Column Styles */
const profileCardStyle: React.CSSProperties = {
  backgroundColor: '#24272A',
  border: '1px solid rgba(139, 126, 116, 0.2)',
  borderRadius: '6px',
  padding: '1.25rem',
};

const profileAvatarRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const avatarCircleStyle: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '6px',
  backgroundColor: '#1C1E20',
  border: '1px solid rgba(212, 175, 55, 0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  fontSize: '0.95rem',
  color: '#D4AF37',
};

const profileNameStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#FAF9F6',
};

const profileMetaStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#8B7E74',
  marginTop: '0.15rem',
};

const memberBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '0.65rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  color: '#D4AF37',
  backgroundColor: 'rgba(212, 175, 55, 0.14)',
  border: '1px solid rgba(212, 175, 55, 0.3)',
  borderRadius: '3px',
  padding: '0.1rem 0.4rem',
  marginLeft: '0.4rem',
};

const guestBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '0.65rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  color: '#8B7E74',
  backgroundColor: 'rgba(139, 126, 116, 0.14)',
  border: '1px solid rgba(139, 126, 116, 0.25)',
  borderRadius: '3px',
  padding: '0.1rem 0.4rem',
  marginLeft: '0.4rem',
};

const guestNoticeBoxStyle: React.CSSProperties = {
  marginTop: '1rem',
  padding: '0.75rem',
  backgroundColor: 'rgba(212, 175, 55, 0.08)',
  border: '1px solid rgba(212, 175, 55, 0.2)',
  borderRadius: '4px',
};

const btnCreateAccountStyle: React.CSSProperties = {
  display: 'inline-block',
  textDecoration: 'none',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#D4AF37',
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '0.75rem',
};

const statBoxStyle: React.CSSProperties = {
  backgroundColor: '#24272A',
  border: '1px solid rgba(139, 126, 116, 0.2)',
  borderRadius: '6px',
  padding: '0.85rem 1rem',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#8B7E74',
  marginBottom: '0.35rem',
};

const statNumberStyle: React.CSSProperties = {
  fontSize: '1.4rem',
  fontWeight: 700,
  color: '#FAF9F6',
  lineHeight: 1.1,
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  fontVariantNumeric: 'tabular-nums',
};

const loadoutBoxStyle: React.CSSProperties = {
  backgroundColor: '#1C1E20',
  border: '1px dashed rgba(139, 126, 116, 0.25)',
  borderRadius: '6px',
  padding: '1rem',
  textAlign: 'center',
};

const loadoutTitleStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#FAF9F6',
  marginBottom: '0.25rem',
};

const loadoutDescStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#8B7E74',
  marginBottom: '0.75rem',
};

const btnManageDeckStyle: React.CSSProperties = {
  display: 'inline-block',
  textDecoration: 'none',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: '#FAF9F6',
  backgroundColor: '#24272A',
  border: '1px solid rgba(212, 175, 55, 0.35)',
  padding: '0.35rem 0.75rem',
  borderRadius: '4px',
  transition: 'all 0.15s ease',
};

const authPromptCardStyle: React.CSSProperties = {
  backgroundColor: '#24272A',
  border: '1px solid rgba(139, 126, 116, 0.2)',
  borderRadius: '6px',
  padding: '3rem 2rem',
  maxWidth: '480px',
  margin: '0 auto',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  margin: '0 0 0.5rem',
  color: '#FAF9F6',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  lineHeight: 1.5,
  color: '#8B7E74',
  margin: '0 0 1.25rem',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-block',
  textDecoration: 'none',
  backgroundColor: '#4C5C4C',
  color: '#FAF9F6',
  border: '1px solid rgba(76, 92, 76, 0.6)',
  padding: '0.55rem 1.15rem',
  borderRadius: '4px',
  fontSize: '0.85rem',
  fontWeight: 600,
};

const secondaryBtnStyle: React.CSSProperties = {
  display: 'inline-block',
  textDecoration: 'none',
  backgroundColor: '#1C1E20',
  color: '#FAF9F6',
  border: '1px solid rgba(139, 126, 116, 0.25)',
  padding: '0.55rem 1.15rem',
  borderRadius: '4px',
  fontSize: '0.85rem',
  fontWeight: 500,
};

export default DashboardPage;
