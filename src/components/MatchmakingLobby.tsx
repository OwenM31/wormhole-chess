import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getQueueStats, createMatchmakingSocket, type MatchmakingClient } from '../services/matchmakingApi';
import type { QueueMetrics } from '../types/room';

export const MatchmakingLobby: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'quick' | 'private'>('quick');
  const [selectedVariant, setSelectedVariant] = useState<'deck_builder' | 'wormhole_3d'>('deck_builder');
  const [timeControl, setTimeControl] = useState<string>('5+0');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchElapsed, setSearchElapsed] = useState<number>(0);
  const [matchedRoom, setMatchedRoom] = useState<{ roomCode: string; opponent: string } | null>(null);

  const [customRoomCode, setCustomRoomCode] = useState<string>('');
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const [metrics, setMetrics] = useState<QueueMetrics>({
    inQueue: { deck_builder: 0, wormhole_3d: 0, total: 0 },
    activeMatches: 0,
    totalOnline: 0,
  });

  const clientRef = useRef<MatchmakingClient | null>(null);
  const searchTimerRef = useRef<any>(null);

  // Poll stats and listen for real-time matchmaking queue events
  useEffect(() => {
    getQueueStats().then(setMetrics);

    const client = createMatchmakingSocket((data) => {
      if (data.type === 'metrics' && data.stats) {
        setMetrics(data.stats);
      } else if (data.type === 'match_found') {
        setIsSearching(false);
        setMatchedRoom({ roomCode: data.roomCode, opponent: data.opponent });
        setTimeout(() => {
          navigate(`/play/${data.roomCode}`);
        }, 1200);
      }
    });

    clientRef.current = client;

    return () => {
      client.close();
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    };
  }, [navigate]);

  // Handle searching timer
  useEffect(() => {
    if (isSearching) {
      setSearchElapsed(0);
      searchTimerRef.current = setInterval(() => {
        setSearchElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    }
    return () => {
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    };
  }, [isSearching]);

  const handleStartSearch = () => {
    if (!clientRef.current) return;
    setIsSearching(true);
    setMatchedRoom(null);
    clientRef.current.joinQueue(selectedVariant, {
      id: user?.id || `guest_${Math.random().toString(36).substring(2, 8)}`,
      username: user?.username || 'Guest',
      isGuest: user?.isGuest,
    });
  };

  const handleCancelSearch = () => {
    if (clientRef.current) {
      clientRef.current.leaveQueue();
    }
    setIsSearching(false);
  };

  const handleCreatePrivateRoom = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newRoomCode = `WH-${code}`;
    setCreatedRoomCode(newRoomCode);
    setCopiedLink(false);
  };

  const handleCopyLink = () => {
    if (!createdRoomCode) return;
    const url = `${window.location.origin}/play/${createdRoomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleJoinPrivateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customRoomCode.trim().toUpperCase();
    if (clean) {
      navigate(`/play/${clean}`);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header with live metrics */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Multiplayer Battle Hub</h2>
          <p style={styles.subtitle}>Enter the queue or create a custom war room</p>
        </div>
        <div style={styles.metricBadge}>
          <span style={styles.pulseDot} />
          <span style={styles.metricText}>
            {metrics.inQueue.total} queuing • {metrics.activeMatches} active battles
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tabButton,
            ...(activeTab === 'quick' ? styles.tabButtonActive : {}),
          }}
          onClick={() => setActiveTab('quick')}
        >
          ⚡ Quick Match (Random Queue)
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(activeTab === 'private' ? styles.tabButtonActive : {}),
          }}
          onClick={() => setActiveTab('private')}
        >
          🔐 Private Room (Code / Link)
        </button>
      </div>

      {/* Tab 1: Quick Match */}
      {activeTab === 'quick' && (
        <div style={styles.tabContent}>
          <label style={styles.fieldLabel}>Select Combat Variant:</label>
          <div style={styles.variantGrid}>
            <div
              style={{
                ...styles.variantCard,
                ...(selectedVariant === 'deck_builder' ? styles.variantCardActive : {}),
              }}
              onClick={() => !isSearching && setSelectedVariant('deck_builder')}
            >
              <div style={styles.variantIcon}>🃏</div>
              <div style={styles.variantInfo}>
                <div style={styles.variantName}>Deck Builder Chess</div>
                <div style={styles.variantDesc}>2D board + card deck tactics</div>
                <div style={styles.variantQueueCount}>
                  {metrics.inQueue.deck_builder} players in queue
                </div>
              </div>
            </div>

            <div
              style={{
                ...styles.variantCard,
                ...(selectedVariant === 'wormhole_3d' ? styles.variantCardActive : {}),
              }}
              onClick={() => !isSearching && setSelectedVariant('wormhole_3d')}
            >
              <div style={styles.variantIcon}>🌀</div>
              <div style={styles.variantInfo}>
                <div style={styles.variantName}>3D Wormhole Chess</div>
                <div style={styles.variantDesc}>Three.js hyperbolic geometry</div>
                <div style={styles.variantQueueCount}>
                  {metrics.inQueue.wormhole_3d} players in queue
                </div>
              </div>
            </div>
          </div>

          {matchedRoom ? (
            <div style={styles.matchedBanner}>
              <div style={styles.matchedIcon}>⚔️</div>
              <div>
                <div style={styles.matchedTitle}>Match Found!</div>
                <div style={styles.matchedDesc}>
                  Engaging <strong>{matchedRoom.opponent}</strong> in room{' '}
                  <span style={styles.codeHighlight}>{matchedRoom.roomCode}</span>...
                </div>
              </div>
            </div>
          ) : isSearching ? (
            <div style={styles.searchingBox}>
              <div style={styles.radarRing} />
              <div style={styles.searchingText}>
                Finding challenger for{' '}
                {selectedVariant === 'deck_builder' ? 'Deck Builder' : 'Wormhole 3D'}...
              </div>
              <div style={styles.timerText}>
                Elapsed: {Math.floor(searchElapsed / 60)}:
                {String(searchElapsed % 60).padStart(2, '0')}
              </div>
              <button style={styles.cancelButton} onClick={handleCancelSearch}>
                Cancel Queue
              </button>
            </div>
          ) : (
            <button style={styles.actionButton} onClick={handleStartSearch}>
              Find Match Now
            </button>
          )}
        </div>
      )}

      {/* Tab 2: Private Room */}
      {activeTab === 'private' && (
        <div style={styles.tabContent}>
          <div style={styles.privateGrid}>
            {/* Create Room Box */}
            <div style={styles.privateCard}>
              <h3 style={styles.privateTitle}>Create Private Room</h3>
              <p style={styles.privateDesc}>Generate a private code to invite a friend</p>

              <div style={{ marginBottom: '1rem' }}>
                <label style={styles.fieldLabel}>Time Control:</label>
                <div style={styles.timeButtons}>
                  {['3+0', '5+0', '10+0', 'untimed'].map((tc) => (
                    <button
                      key={tc}
                      type="button"
                      style={{
                        ...styles.timeButton,
                        ...(timeControl === tc ? styles.timeButtonActive : {}),
                      }}
                      onClick={() => setTimeControl(tc)}
                    >
                      {tc === 'untimed' ? 'Untimed (Casual)' : tc}
                    </button>
                  ))}
                </div>
              </div>

              {createdRoomCode ? (
                <div style={styles.createdBox}>
                  <div style={styles.roomCodeDisplay}>{createdRoomCode}</div>
                  <div style={styles.buttonRow}>
                    <button style={styles.secondaryButton} onClick={handleCopyLink}>
                      {copiedLink ? '✓ Copied Link!' : '📋 Copy Invite Link'}
                    </button>
                    <button
                      style={styles.actionButtonSmall}
                      onClick={() => navigate(`/play/${createdRoomCode}?timeControl=${timeControl}`)}
                    >
                      Enter Room →
                    </button>
                  </div>
                </div>
              ) : (
                <button style={styles.actionButton} onClick={handleCreatePrivateRoom}>
                  Generate Private Room
                </button>
              )}
            </div>

            {/* Join Room Box */}
            <div style={styles.privateCard}>
              <h3 style={styles.privateTitle}>Join With Code</h3>
              <p style={styles.privateDesc}>Enter your friend's 6-character room code</p>

              <form onSubmit={handleJoinPrivateRoom} style={styles.joinForm}>
                <input
                  type="text"
                  placeholder="WH-XXXX"
                  maxLength={10}
                  value={customRoomCode}
                  onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
                  style={styles.input}
                />
                <button
                  type="submit"
                  disabled={!customRoomCode.trim()}
                  style={{
                    ...styles.actionButton,
                    opacity: customRoomCode.trim() ? 1 : 0.5,
                  }}
                >
                  Join Match
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: 'rgba(18, 21, 48, 0.85)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    borderRadius: '16px',
    padding: '1.75rem',
    color: '#ffffff',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    margin: '2rem 0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  title: {
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #ffffff, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.9rem',
    color: '#94a3b8',
  },
  metricBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '9999px',
    padding: '0.4rem 0.9rem',
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    boxShadow: '0 0 8px #10b981',
  },
  metricText: {
    fontSize: '0.85rem',
    color: '#34d399',
    fontWeight: 600,
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '0.75rem',
    marginBottom: '1.5rem',
  },
  tabButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    color: '#ffffff',
    border: '1px solid rgba(99, 102, 241, 0.5)',
  },
  tabContent: {
    paddingTop: '0.5rem',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#cbd5e1',
    marginBottom: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  variantGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  variantCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  variantCardActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderColor: '#6366f1',
    boxShadow: '0 0 16px rgba(99, 102, 241, 0.3)',
  },
  variantIcon: {
    fontSize: '2rem',
  },
  variantInfo: {
    flex: 1,
  },
  variantName: {
    fontWeight: 700,
    fontSize: '1rem',
  },
  variantDesc: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    marginTop: '0.2rem',
  },
  variantQueueCount: {
    fontSize: '0.75rem',
    color: '#38bdf8',
    marginTop: '0.3rem',
    fontWeight: 500,
  },
  actionButton: {
    width: '100%',
    padding: '0.9rem',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
    transition: 'transform 0.15s, opacity 0.15s',
  },
  actionButtonSmall: {
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  searchingBox: {
    textAlign: 'center',
    padding: '2rem',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '12px',
    border: '1px dashed #6366f1',
  },
  radarRing: {
    width: '48px',
    height: '48px',
    margin: '0 auto 1rem',
    borderRadius: '50%',
    border: '3px solid rgba(99, 102, 241, 0.3)',
    borderTopColor: '#6366f1',
    animation: 'spin 1s linear infinite',
  },
  searchingText: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#e2e8f0',
  },
  timerText: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    margin: '0.5rem 0 1.25rem',
  },
  cancelButton: {
    padding: '0.5rem 1.2rem',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#f87171',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  matchedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.25rem',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    border: '1px solid #10b981',
    borderRadius: '12px',
  },
  matchedIcon: {
    fontSize: '2rem',
  },
  matchedTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#34d399',
  },
  matchedDesc: {
    fontSize: '0.9rem',
    color: '#e2e8f0',
    marginTop: '0.2rem',
  },
  codeHighlight: {
    fontFamily: 'monospace',
    color: '#a7f3d0',
    fontWeight: 700,
  },
  privateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  privateCard: {
    padding: '1.5rem',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  privateTitle: {
    margin: '0 0 0.25rem 0',
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  privateDesc: {
    margin: '0 0 1.25rem 0',
    fontSize: '0.85rem',
    color: '#94a3b8',
  },
  timeButtons: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  timeButton: {
    padding: '0.4rem 0.8rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  timeButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    borderColor: '#6366f1',
    color: '#ffffff',
    fontWeight: 600,
  },
  createdBox: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '8px',
    textAlign: 'center',
  },
  roomCodeDisplay: {
    fontFamily: 'monospace',
    fontSize: '1.8rem',
    fontWeight: 800,
    letterSpacing: '0.15em',
    color: '#38bdf8',
    marginBottom: '1rem',
  },
  buttonRow: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  joinForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    width: '100%',
    padding: '0.8rem 1rem',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '1.1rem',
    fontFamily: 'monospace',
    letterSpacing: '0.1em',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
};
