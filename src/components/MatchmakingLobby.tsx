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
      <style>{`
        @keyframes mmSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes mmPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
        }
      `}</style>

      {/* Panel Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>Matchmaking</span>
        </div>
        <div style={styles.metricBadge}>
          <span style={styles.pulseDot} />
          <span style={styles.metricText}>
            {metrics.inQueue.total} queuing · {metrics.activeMatches} active matches
          </span>
        </div>
      </div>

      {/* Body Area */}
      <div style={styles.body}>
        {/* Segmented Tab Controls */}
        <div style={styles.tabBar}>
          <div style={styles.segmentedControl}>
            <button
              style={{
                ...styles.segmentedBtn,
                ...(activeTab === 'quick' ? styles.segmentedBtnActive : {}),
              }}
              onClick={() => setActiveTab('quick')}
            >
              Find Match
            </button>
            <button
              style={{
                ...styles.segmentedBtn,
                ...(activeTab === 'private' ? styles.segmentedBtnActive : {}),
              }}
              onClick={() => setActiveTab('private')}
            >
              Private Room
            </button>
          </div>
        </div>

        {/* Tab 1: Quick Match */}
        {activeTab === 'quick' && (
          <div>
            <div style={styles.sectionLabel}>Select Mode</div>
            <div style={styles.variantGrid}>
              <div
                style={{
                  ...styles.variantCard,
                  ...(selectedVariant === 'deck_builder' ? styles.variantCardActive : {}),
                }}
                onClick={() => !isSearching && setSelectedVariant('deck_builder')}
              >
                <div style={styles.variantHeaderRow}>
                  <span style={styles.variantName}>Deck Builder</span>
                  <span style={styles.variantTag}>2D</span>
                </div>
                <div style={styles.variantDesc}>Chess with card actions & energy</div>
                <div style={styles.variantQueueCount}>
                  {metrics.inQueue.deck_builder} queuing
                </div>
              </div>

              <div
                style={{
                  ...styles.variantCard,
                  ...(selectedVariant === 'wormhole_3d' ? styles.variantCardActive : {}),
                }}
                onClick={() => !isSearching && setSelectedVariant('wormhole_3d')}
              >
                <div style={styles.variantHeaderRow}>
                  <span style={styles.variantName}>Wormhole</span>
                  <span style={styles.variantTag}>3D</span>
                </div>
                <div style={styles.variantDesc}>Multi-board spatial geometry</div>
                <div style={styles.variantQueueCount}>
                  {metrics.inQueue.wormhole_3d} queuing
                </div>
              </div>
            </div>

            {matchedRoom ? (
              <div style={styles.matchedBanner}>
                <div style={styles.matchedPulseDot} />
                <div style={styles.matchedInfo}>
                  <div style={styles.matchedTitle}>Match Found</div>
                  <div style={styles.matchedDesc}>
                    Opponent: <strong style={{ color: '#FAF9F6' }}>{matchedRoom.opponent}</strong> · Room{' '}
                    <span style={styles.codeHighlight}>{matchedRoom.roomCode}</span>
                  </div>
                </div>
              </div>
            ) : isSearching ? (
              <div style={styles.searchingBox}>
                <div style={styles.spinnerRing} />
                <div style={styles.searchingText}>
                  Searching for {selectedVariant === 'deck_builder' ? 'Deck Builder' : 'Wormhole'} match...
                </div>
                <div style={styles.timerText}>
                  Elapsed: {Math.floor(searchElapsed / 60)}:
                  {String(searchElapsed % 60).padStart(2, '0')}
                </div>
                <button style={styles.cancelButton} onClick={handleCancelSearch}>
                  Cancel Search
                </button>
              </div>
            ) : (
              <button style={styles.primaryActionButton} onClick={handleStartSearch}>
                Find Match
              </button>
            )}
          </div>
        )}

        {/* Tab 2: Private Room */}
        {activeTab === 'private' && (
          <div style={styles.privateGrid}>
            {/* Create Room Box */}
            <div style={styles.privateCard}>
              <div>
                <div style={styles.privateCardTitle}>Create Room</div>
                <div style={styles.privateCardDesc}>Generate a private room code for a friend.</div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={styles.subFieldLabel}>Mode</div>
                  <div style={styles.modeMiniGrid}>
                    <button
                      type="button"
                      style={{
                        ...styles.miniModeBtn,
                        ...(selectedVariant === 'deck_builder' ? styles.miniModeBtnActive : {}),
                      }}
                      onClick={() => setSelectedVariant('deck_builder')}
                    >
                      Deck Builder
                    </button>
                    <button
                      type="button"
                      style={{
                        ...styles.miniModeBtn,
                        ...(selectedVariant === 'wormhole_3d' ? styles.miniModeBtnActive : {}),
                      }}
                      onClick={() => setSelectedVariant('wormhole_3d')}
                    >
                      Wormhole
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={styles.subFieldLabel}>Time Control</div>
                  <div style={styles.timeButtonsGrid}>
                    {[
                      { id: '3+0', label: '3 min' },
                      { id: '5+0', label: '5 min' },
                      { id: '10+0', label: '10 min' },
                      { id: 'untimed', label: 'Untimed' },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        style={{
                          ...styles.timeButton,
                          ...(timeControl === id ? styles.timeButtonActive : {}),
                        }}
                        onClick={() => setTimeControl(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {createdRoomCode ? (
                <div style={styles.createdBox}>
                  <div style={styles.roomCodeDisplay}>{createdRoomCode}</div>
                  <div style={styles.buttonRow}>
                    <button style={styles.secondaryButton} onClick={handleCopyLink}>
                      {copiedLink ? '✓ Copied' : 'Copy Invite Link'}
                    </button>
                    <button
                      style={styles.enterRoomButton}
                      onClick={() =>
                        navigate(
                          `/play/${createdRoomCode}?variant=${selectedVariant}&timeControl=${timeControl}`
                        )
                      }
                    >
                      Enter Room →
                    </button>
                  </div>
                </div>
              ) : (
                <button style={styles.createActionButton} onClick={handleCreatePrivateRoom}>
                  Create Room
                </button>
              )}
            </div>

            {/* Join Room Box */}
            <div style={styles.privateCard}>
              <div>
                <div style={styles.privateCardTitle}>Join with Code</div>
                <div style={styles.privateCardDesc}>Enter a private room code to join an existing game.</div>

                <form onSubmit={handleJoinPrivateRoom} style={styles.joinForm}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={styles.subFieldLabel}>Room Code</div>
                    <input
                      type="text"
                      placeholder="WH-XXXX"
                      maxLength={10}
                      value={customRoomCode}
                      onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
                      style={styles.input}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!customRoomCode.trim()}
                    style={{
                      ...styles.joinActionButton,
                      opacity: customRoomCode.trim() ? 1 : 0.4,
                      cursor: customRoomCode.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Join with Code
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#24272A',
    color: '#FAF9F6',
    margin: 0,
    width: '100%',
  },
  header: {
    padding: '0.85rem 1.15rem',
    backgroundColor: '#1C1E20',
    borderBottom: '1px solid rgba(139, 126, 116, 0.16)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  headerTitle: {
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#8B7E74',
  },
  metricBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    backgroundColor: 'rgba(76, 92, 76, 0.16)',
    border: '1px solid rgba(76, 92, 76, 0.35)',
    borderRadius: '4px',
    padding: '0.2rem 0.55rem',
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#D4AF37',
    animation: 'mmPulse 2s infinite ease-in-out',
  },
  metricText: {
    fontSize: '0.75rem',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontVariantNumeric: 'tabular-nums',
    color: '#FAF9F6',
    fontWeight: 500,
  },
  body: {
    padding: '1.15rem',
  },
  tabBar: {
    marginBottom: '1rem',
  },
  segmentedControl: {
    display: 'inline-flex',
    backgroundColor: '#1C1E20',
    border: '1px solid rgba(139, 126, 116, 0.2)',
    borderRadius: '4px',
    padding: '3px',
    gap: '3px',
  },
  segmentedBtn: {
    background: 'none',
    border: 'none',
    color: '#8B7E74',
    padding: '0.35rem 0.85rem',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 500,
    transition: 'all 0.15s ease',
  },
  segmentedBtnActive: {
    backgroundColor: '#24272A',
    color: '#FAF9F6',
    fontWeight: 600,
    border: '1px solid rgba(212, 175, 55, 0.35)',
  },
  sectionLabel: {
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#8B7E74',
    marginBottom: '0.5rem',
  },
  subFieldLabel: {
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#8B7E74',
    marginBottom: '0.4rem',
  },
  variantGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  variantCard: {
    backgroundColor: '#1C1E20',
    border: '1px solid rgba(139, 126, 116, 0.2)',
    borderRadius: '6px',
    padding: '0.85rem 1rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  variantCardActive: {
    backgroundColor: '#282B2E',
    borderColor: '#D4AF37',
    boxShadow: '0 0 0 1px rgba(212, 175, 55, 0.35)',
  },
  variantHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.3rem',
  },
  variantName: {
    fontWeight: 600,
    fontSize: '0.85rem',
    color: '#FAF9F6',
  },
  variantTag: {
    fontSize: '0.65rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '0.1rem 0.4rem',
    borderRadius: '3px',
    backgroundColor: 'rgba(139, 126, 116, 0.12)',
    color: '#8B7E74',
    border: '1px solid rgba(139, 126, 116, 0.2)',
  },
  variantDesc: {
    fontSize: '0.75rem',
    color: '#8B7E74',
    lineHeight: 1.4,
  },
  variantQueueCount: {
    fontSize: '0.75rem',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontVariantNumeric: 'tabular-nums',
    color: '#D4AF37',
    marginTop: '0.5rem',
    fontWeight: 500,
  },
  primaryActionButton: {
    width: '100%',
    padding: '0.65rem 1.25rem',
    borderRadius: '4px',
    border: '1px solid rgba(76, 92, 76, 0.6)',
    backgroundColor: '#4C5C4C',
    color: '#FAF9F6',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  createActionButton: {
    width: '100%',
    padding: '0.65rem 1.25rem',
    borderRadius: '4px',
    border: '1px solid rgba(76, 92, 76, 0.6)',
    backgroundColor: '#4C5C4C',
    color: '#FAF9F6',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  joinActionButton: {
    width: '100%',
    padding: '0.65rem 1.25rem',
    borderRadius: '4px',
    border: '1px solid rgba(212, 175, 55, 0.35)',
    backgroundColor: '#282B2E',
    color: '#FAF9F6',
    fontWeight: 600,
    fontSize: '0.85rem',
    transition: 'all 0.15s ease',
  },
  secondaryButton: {
    flex: 1,
    padding: '0.5rem 0.85rem',
    borderRadius: '4px',
    border: '1px solid rgba(139, 126, 116, 0.25)',
    backgroundColor: '#1C1E20',
    color: '#FAF9F6',
    fontWeight: 500,
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  enterRoomButton: {
    flex: 1,
    padding: '0.5rem 0.85rem',
    borderRadius: '4px',
    border: '1px solid rgba(76, 92, 76, 0.6)',
    backgroundColor: '#4C5C4C',
    color: '#FAF9F6',
    fontWeight: 600,
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  searchingBox: {
    textAlign: 'center',
    padding: '1.5rem 1rem',
    backgroundColor: '#1C1E20',
    borderRadius: '6px',
    border: '1px dashed rgba(212, 175, 55, 0.35)',
  },
  spinnerRing: {
    width: '28px',
    height: '28px',
    margin: '0 auto 0.75rem',
    borderRadius: '50%',
    border: '2px solid rgba(212, 175, 55, 0.2)',
    borderTopColor: '#D4AF37',
    animation: 'mmSpin 0.9s linear infinite',
  },
  searchingText: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: '#FAF9F6',
  },
  timerText: {
    fontSize: '0.8rem',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontVariantNumeric: 'tabular-nums',
    color: '#8B7E74',
    margin: '0.35rem 0 0.85rem',
  },
  cancelButton: {
    padding: '0.4rem 1rem',
    backgroundColor: 'rgba(170, 74, 68, 0.12)',
    border: '1px solid rgba(170, 74, 68, 0.35)',
    color: '#FAF9F6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  matchedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.85rem 1rem',
    backgroundColor: 'rgba(76, 92, 76, 0.15)',
    border: '1px solid rgba(76, 92, 76, 0.5)',
    borderRadius: '6px',
  },
  matchedPulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#4C5C4C',
    boxShadow: '0 0 8px rgba(76, 92, 76, 0.8)',
    flexShrink: 0,
  },
  matchedInfo: {
    flex: 1,
  },
  matchedTitle: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#FAF9F6',
  },
  matchedDesc: {
    fontSize: '0.75rem',
    color: '#8B7E74',
    marginTop: '0.15rem',
  },
  codeHighlight: {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    color: '#D4AF37',
    fontWeight: 600,
  },
  privateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1rem',
  },
  privateCard: {
    padding: '1rem',
    backgroundColor: '#1C1E20',
    border: '1px solid rgba(139, 126, 116, 0.2)',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '220px',
  },
  privateCardTitle: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#FAF9F6',
  },
  privateCardDesc: {
    fontSize: '0.75rem',
    color: '#8B7E74',
    margin: '0.2rem 0 0.85rem',
  },
  modeMiniGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.35rem',
  },
  miniModeBtn: {
    padding: '0.35rem 0.65rem',
    backgroundColor: 'transparent',
    border: '1px solid rgba(139, 126, 116, 0.2)',
    borderRadius: '4px',
    color: '#8B7E74',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  miniModeBtnActive: {
    backgroundColor: '#282B2E',
    borderColor: '#D4AF37',
    color: '#FAF9F6',
    fontWeight: 600,
  },
  timeButtonsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.35rem',
  },
  timeButton: {
    padding: '0.35rem 0.25rem',
    backgroundColor: 'transparent',
    border: '1px solid rgba(139, 126, 116, 0.2)',
    borderRadius: '4px',
    color: '#8B7E74',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'center',
    transition: 'all 0.15s ease',
  },
  timeButtonActive: {
    backgroundColor: '#282B2E',
    borderColor: '#D4AF37',
    color: '#FAF9F6',
    fontWeight: 600,
  },
  createdBox: {
    marginTop: '0.75rem',
    padding: '0.85rem',
    backgroundColor: '#1C1E20',
    border: '1px solid rgba(212, 175, 55, 0.35)',
    borderRadius: '4px',
    textAlign: 'center',
  },
  roomCodeDisplay: {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontSize: '1.4rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#D4AF37',
    marginBottom: '0.75rem',
  },
  buttonRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  joinForm: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    width: '100%',
    padding: '0.6rem 0.75rem',
    backgroundColor: '#191B1D',
    border: '1px solid rgba(139, 126, 116, 0.25)',
    borderRadius: '4px',
    color: '#FAF9F6',
    fontSize: '1rem',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    letterSpacing: '0.12em',
    textAlign: 'center',
    boxSizing: 'border-box',
    outline: 'none',
  },
};
