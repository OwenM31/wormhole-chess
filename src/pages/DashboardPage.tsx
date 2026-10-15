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
      } catch (err) {
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
    if (window.confirm('Are you sure you want to log out of your session?')) {
      await logout();
      navigate('/');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Today';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <Navigation />
        <main style={{ ...mainContentStyle, textAlign: 'center', paddingTop: '6rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🌀</div>
          <p style={{ color: '#8b949e' }}>Loading your player profile...</p>
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
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h1 style={{ ...titleStyle, fontSize: '2rem' }}>Sign In Required</h1>
            <p style={descriptionStyle}>
              You need an active session to access player statistics, custom deck builders, and competitive ratings.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
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

  return (
    <div style={containerStyle}>
      <Navigation />

      <main style={mainContentStyle}>
        {/* PROFILE HEADER BANNER */}
        <div style={profileHeaderStyle}>
          <div style={avatarContainerStyle}>
            <div style={avatarStyle}>{user.isGuest ? '👾' : '👑'}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={profileUsernameStyle}>{user.username}</h1>
                <span style={user.isGuest ? guestStatusBadgeStyle : registeredStatusBadgeStyle}>
                  {user.isGuest ? 'Guest Session' : 'Registered Player'}
                </span>
                <span style={ratingPillStyle}>{eloRating} ELO</span>
              </div>
              <p style={profileSubtextStyle}>
                {user.email ? `${user.email} • ` : ''}
                Joined {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={handleLogout} style={dangerBtnStyle}>
              Sign Out
            </button>
          </div>
        </div>

        {/* GUEST UPGRADE CALLOUT */}
        {user.isGuest && (
          <div style={guestUpgradeBannerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>🛡️</div>
              <div>
                <h3 style={{ margin: '0 0 0.25rem', color: '#f0f6fc', fontSize: '1.05rem' }}>
                  Upgrade to a Permanent Account
                </h3>
                <p style={{ margin: 0, color: '#c9d1d9', fontSize: '0.9rem', lineHeight: 1.4 }}>
                  Save your {eloRating} ELO rating and match stats permanently across devices before this guest session expires.
                </p>
              </div>
            </div>
            <Link to="/register" style={upgradeActionBtnStyle}>
              Upgrade Account Now
            </Link>
          </div>
        )}

        {/* STATS OVERVIEW GRID */}
        <h2 style={sectionHeaderStyle}>Combat Record & Statistics</h2>
        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <div style={statCardHeaderStyle}>
              <span style={statLabelStyle}>Competitive Rating</span>
              <span style={{ fontSize: '1.25rem' }}>⭐</span>
            </div>
            <span style={{ ...statValueStyle, color: '#58a6ff' }}>{eloRating}</span>
            <span style={statSubtextStyle}>Tier: Non-Euclidean Adept</span>
          </div>

          <div style={statCardStyle}>
            <div style={statCardHeaderStyle}>
              <span style={statLabelStyle}>Total Games</span>
              <span style={{ fontSize: '1.25rem' }}>⚔️</span>
            </div>
            <span style={statValueStyle}>{totalGames}</span>
            <span style={statSubtextStyle}>Recorded across all variants</span>
          </div>

          <div style={statCardStyle}>
            <div style={statCardHeaderStyle}>
              <span style={statLabelStyle}>Win Rate</span>
              <span style={{ fontSize: '1.25rem' }}>🏆</span>
            </div>
            <span style={{ ...statValueStyle, color: '#3fb950' }}>{winRate}%</span>
            <span style={statSubtextStyle}>Victory ratio</span>
          </div>

          <div style={statCardStyle}>
            <div style={statCardHeaderStyle}>
              <span style={statLabelStyle}>W / L / D</span>
              <span style={{ fontSize: '1.25rem' }}>📊</span>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'baseline', marginTop: '0.2rem' }}>
              <span style={{ ...statValueStyle, color: '#3fb950', fontSize: '1.4rem' }}>{wins}W</span>
              <span style={{ ...statValueStyle, color: '#f85149', fontSize: '1.4rem' }}>{losses}L</span>
              <span style={{ ...statValueStyle, color: '#8b949e', fontSize: '1.4rem' }}>{draws}D</span>
            </div>
            <span style={statSubtextStyle}>Match breakdown</span>
          </div>
        </div>

        {/* REAL-TIME MULTIPLAYER LOBBY */}
        <MatchmakingLobby />

        {/* QUICK GAME LAUNCHERS */}
        <h2 style={sectionHeaderStyle}>Launch Game Variant</h2>
        <div style={launchersGridStyle}>
          {/* 3D Wormhole */}
          <div style={launcherCardStyle}>
            <div style={launcherIconContainerStyle}>
              <span style={{ fontSize: '2.5rem' }}>🌀</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <h3 style={launcherTitleStyle}>3D Wormhole Chess</h3>
                <span style={modeBadgeStyle}>3D Engine</span>
              </div>
              <p style={launcherDescriptionStyle}>
                Battle across non-Euclidean space with spatial warping, high-fidelity Three.js rendering, and 3D portal navigation.
              </p>
              <Link to="/wormhole" style={primaryBtnStyle}>
                Launch 3D Game →
              </Link>
            </div>
          </div>

          {/* 2D Deck Builder */}
          <div style={launcherCardStyle}>
            <div style={launcherIconContainerStyle}>
              <span style={{ fontSize: '2.5rem' }}>🃏</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <h3 style={launcherTitleStyle}>Deck Builder Chess</h3>
                <span style={{ ...modeBadgeStyle, backgroundColor: 'rgba(163, 113, 247, 0.15)', color: '#d2a8ff', borderColor: 'rgba(163, 113, 247, 0.3)' }}>
                  Phase 3 & 4
                </span>
              </div>
              <p style={launcherDescriptionStyle}>
                Customize dynamic card decks, modify board squares, and trigger portal warps in strategic turn-based chess combat.
              </p>
              <Link to="/deck-builder" style={purpleBtnStyle}>
                Launch Deck Builder →
              </Link>
            </div>
          </div>
        </div>

        {/* MATCH HISTORY */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '3rem', marginBottom: '1.25rem' }}>
          <h2 style={{ ...sectionHeaderStyle, margin: 0 }}>Recent Match History</h2>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#161b22', padding: '0.25rem', borderRadius: '8px', border: '1px solid #30363d' }}>
            <button
              onClick={() => setFilter('all')}
              style={filter === 'all' ? activeFilterPillStyle : filterPillStyle}
            >
              All Matches ({matches.length})
            </button>
            <button
              onClick={() => setFilter('pvp')}
              style={filter === 'pvp' ? activeFilterPillStyle : filterPillStyle}
            >
              Ranked PvP
            </button>
            <button
              onClick={() => setFilter('solo_local')}
              style={filter === 'solo_local' ? activeFilterPillStyle : filterPillStyle}
            >
              Practice & Local
            </button>
          </div>
        </div>

        {isLoadingMatches ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#8b949e' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🌀</div>
            Loading match history...
          </div>
        ) : filteredMatches.length === 0 ? (
          <div style={emptyHistoryCardStyle}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📜</div>
            <h4 style={{ margin: '0 0 0.4rem', color: '#f0f6fc', fontSize: '1.1rem' }}>
              No {filter === 'all' ? '' : filter === 'pvp' ? 'Ranked PvP ' : 'Practice '}Matches Recorded Yet
            </h4>
            <p style={{ margin: '0 0 1.25rem', color: '#8b949e', fontSize: '0.9rem', maxWidth: '420px', marginInline: 'auto' }}>
              Launch a game variant above to commence your battle history. All wins, losses, and tactical replays will appear here.
            </p>
            <Link to="/deck-builder" style={secondaryBtnStyle}>
              Play Deck Builder
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredMatches.map((m) => {
              const isDeck = m.variant.includes('deck_builder');
              const isPvp = m.variant.includes('pvp') || (Boolean(m.whiteUserId) && Boolean(m.blackUserId));
              const isWhite = user ? m.whiteUserId === user.id : true;
              const isDraw = m.result === '1/2-1/2' || m.result === 'draw';
              const isVictory = !isDraw && (m.winnerId === user?.id || (isWhite && m.result === '1-0') || (!isWhite && m.result === '0-1'));
              const turnsCount = Array.isArray(m.moves) ? m.moves.length : 0;
              const opponent = isWhite
                ? m.blackUsername || (isPvp ? 'Online Opponent' : 'Minimax AI Bot')
                : m.whiteUsername || 'Opponent';

              return (
                <div key={m.id} style={matchCardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '220px' }}>
                    <div style={matchVariantIconStyle}>{isDeck ? '🃏' : '🌀'}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={matchVariantTitleStyle}>
                          {isDeck ? 'Deck Builder Chess' : '3D Wormhole Chess'}
                        </span>
                        <span style={isPvp ? pvpBadgeStyle : practiceBadgeStyle}>
                          {isPvp ? 'Ranked PvP' : 'Practice'}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#8b949e' }}>
                        vs <strong style={{ color: '#c9d1d9' }}>{opponent}</strong> • {formatDate(m.startedAt)}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <span
                      style={
                        isDraw
                          ? drawBadgeStyle
                          : isVictory
                          ? victoryBadgeStyle
                          : defeatBadgeStyle
                      }
                    >
                      {isDraw ? '🤝 Draw' : isVictory ? '🏆 Victory' : '💀 Defeat'}
                    </span>

                    <span style={{ fontSize: '0.85rem', color: '#8b949e', fontFamily: 'monospace' }}>
                      {turnsCount} Turns
                    </span>

                    <button
                      onClick={() => setSelectedReplayMatch(m)}
                      style={reviewBtnStyle}
                      title="Review interactive replay of this match"
                    >
                      Review Match 🔍
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* REPLAY MODAL VIEWER */}
        {selectedReplayMatch && (
          <HistoricalMatchViewer
            match={selectedReplayMatch}
            onClose={() => setSelectedReplayMatch(null)}
          />
        )}
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
  maxWidth: '1100px',
  width: '100%',
  margin: '2rem auto 4rem',
  padding: '0 1.5rem',
  boxSizing: 'border-box',
};

const profileHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '14px',
  padding: '1.75rem 2rem',
  marginBottom: '1.75rem',
  flexWrap: 'wrap',
  gap: '1.25rem',
};

const avatarContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
};

const avatarStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: '#21262d',
  border: '2px solid #388bfd',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '2rem',
};

const profileUsernameStyle: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 700,
  margin: 0,
  color: '#f0f6fc',
};

const profileSubtextStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#8b949e',
  margin: '0.35rem 0 0',
};

const ratingPillStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  backgroundColor: 'rgba(56, 139, 253, 0.15)',
  color: '#58a6ff',
  border: '1px solid rgba(56, 139, 253, 0.3)',
  borderRadius: '20px',
  padding: '0.2rem 0.6rem',
};

const registeredStatusBadgeStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: 'rgba(46, 160, 67, 0.15)',
  color: '#3fb950',
  border: '1px solid rgba(46, 160, 67, 0.3)',
  borderRadius: '20px',
  padding: '0.2rem 0.6rem',
};

const guestStatusBadgeStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: 'rgba(210, 153, 34, 0.15)',
  color: '#d29922',
  border: '1px solid rgba(210, 153, 34, 0.3)',
  borderRadius: '20px',
  padding: '0.2rem 0.6rem',
};

const guestUpgradeBannerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: 'rgba(137, 87, 229, 0.12)',
  border: '1px solid rgba(137, 87, 229, 0.35)',
  borderRadius: '12px',
  padding: '1.25rem 1.75rem',
  marginBottom: '2rem',
  flexWrap: 'wrap',
  gap: '1rem',
};

const upgradeActionBtnStyle: React.CSSProperties = {
  textDecoration: 'none',
  backgroundColor: '#8957e5',
  color: '#ffffff',
  padding: '0.65rem 1.25rem',
  borderRadius: '6px',
  fontSize: '0.9rem',
  fontWeight: 600,
  transition: 'background-color 0.15s ease',
  whiteSpace: 'nowrap',
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 700,
  color: '#f0f6fc',
  margin: '2rem 0 1rem',
  letterSpacing: '-0.01em',
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1.25rem',
  marginBottom: '1rem',
};

const statCardStyle: React.CSSProperties = {
  backgroundColor: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '12px',
  padding: '1.5rem',
  textAlign: 'left',
};

const statCardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.5rem',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#8b949e',
};

const statValueStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '1.75rem',
  fontWeight: 700,
  color: '#f0f6fc',
};

const statSubtextStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  color: '#8b949e',
  marginTop: '0.35rem',
};

const launchersGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1.25rem',
  marginBottom: '1.5rem',
};

const launcherCardStyle: React.CSSProperties = {
  backgroundColor: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '12px',
  padding: '1.75rem',
  display: 'flex',
  gap: '1.25rem',
  alignItems: 'flex-start',
};

const launcherIconContainerStyle: React.CSSProperties = {
  backgroundColor: '#0d1117',
  border: '1px solid #30363d',
  borderRadius: '10px',
  width: '64px',
  height: '64px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const launcherTitleStyle: React.CSSProperties = {
  fontSize: '1.15rem',
  fontWeight: 700,
  margin: 0,
  color: '#f0f6fc',
};

const modeBadgeStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  backgroundColor: 'rgba(56, 139, 253, 0.15)',
  color: '#58a6ff',
  border: '1px solid rgba(56, 139, 253, 0.3)',
  borderRadius: '12px',
  padding: '0.15rem 0.5rem',
  textTransform: 'uppercase',
};

const launcherDescriptionStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#8b949e',
  lineHeight: 1.5,
  margin: '0 0 1.25rem',
};

const emptyHistoryCardStyle: React.CSSProperties = {
  backgroundColor: '#161b22',
  border: '1px dashed #30363d',
  borderRadius: '12px',
  padding: '3rem 2rem',
  textAlign: 'center',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-block',
  textDecoration: 'none',
  backgroundColor: '#238636',
  color: '#ffffff',
  padding: '0.6rem 1.15rem',
  borderRadius: '6px',
  fontSize: '0.9rem',
  fontWeight: 600,
  transition: 'background-color 0.15s ease',
};

const secondaryBtnStyle: React.CSSProperties = {
  display: 'inline-block',
  textDecoration: 'none',
  backgroundColor: '#21262d',
  color: '#c9d1d9',
  border: '1px solid #30363d',
  padding: '0.6rem 1.15rem',
  borderRadius: '6px',
  fontSize: '0.9rem',
  fontWeight: 600,
  transition: 'background-color 0.15s ease',
};

const purpleBtnStyle: React.CSSProperties = {
  display: 'inline-block',
  textDecoration: 'none',
  backgroundColor: '#8957e5',
  color: '#ffffff',
  padding: '0.6rem 1.15rem',
  borderRadius: '6px',
  fontSize: '0.9rem',
  fontWeight: 600,
  transition: 'background-color 0.15s ease',
};

const dangerBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(248, 81, 73, 0.4)',
  color: '#f85149',
  padding: '0.5rem 0.9rem',
  borderRadius: '6px',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const authPromptCardStyle: React.CSSProperties = {
  backgroundColor: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '14px',
  padding: '3.5rem 2rem',
  maxWidth: '520px',
  margin: '0 auto',
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
  margin: '0 0 1.5rem',
};

const filterPillStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#8b949e',
  fontSize: '0.8rem',
  fontWeight: 600,
  padding: '0.35rem 0.75rem',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const activeFilterPillStyle: React.CSSProperties = {
  ...filterPillStyle,
  background: '#21262d',
  color: '#58a6ff',
};

const matchCardStyle: React.CSSProperties = {
  backgroundColor: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '12px',
  padding: '1rem 1.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '1rem',
  transition: 'border-color 0.15s ease',
};

const matchVariantIconStyle: React.CSSProperties = {
  fontSize: '1.75rem',
  width: '42px',
  height: '42px',
  borderRadius: '10px',
  backgroundColor: '#0d1117',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #30363d',
};

const matchVariantTitleStyle: React.CSSProperties = {
  color: '#f0f6fc',
  fontWeight: 700,
  fontSize: '0.95rem',
};

const pvpBadgeStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  padding: '0.15rem 0.45rem',
  borderRadius: '4px',
  backgroundColor: 'rgba(56, 139, 253, 0.15)',
  color: '#58a6ff',
  border: '1px solid rgba(56, 139, 253, 0.3)',
};

const practiceBadgeStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  padding: '0.15rem 0.45rem',
  borderRadius: '4px',
  backgroundColor: 'rgba(110, 118, 129, 0.15)',
  color: '#8b949e',
  border: '1px solid rgba(110, 118, 129, 0.3)',
};

const victoryBadgeStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  padding: '0.25rem 0.6rem',
  borderRadius: '6px',
  backgroundColor: 'rgba(46, 160, 67, 0.15)',
  color: '#3fb950',
  border: '1px solid rgba(46, 160, 67, 0.3)',
};

const defeatBadgeStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  padding: '0.25rem 0.6rem',
  borderRadius: '6px',
  backgroundColor: 'rgba(248, 81, 73, 0.15)',
  color: '#f85149',
  border: '1px solid rgba(248, 81, 73, 0.3)',
};

const drawBadgeStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  padding: '0.25rem 0.6rem',
  borderRadius: '6px',
  backgroundColor: 'rgba(110, 118, 129, 0.15)',
  color: '#8b949e',
  border: '1px solid rgba(110, 118, 129, 0.3)',
};

const reviewBtnStyle: React.CSSProperties = {
  backgroundColor: '#21262d',
  border: '1px solid #30363d',
  color: '#c9d1d9',
  padding: '0.45rem 0.85rem',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

export default DashboardPage;
