import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { useGameRoom } from '../hooks/useGameRoom';
import { ChessClock } from '../components/ChessClock';

export const PlayRoomPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const timeControl = searchParams.get('timeControl') || undefined;
  const variant = searchParams.get('variant') || undefined;

  const [chatInput, setChatInput] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(true);

  const room = useGameRoom({
    roomCode: code || '',
    user: user
      ? { id: user.id, username: user.username, isGuest: user.isGuest }
      : null,
    timeControl,
    variant,
  });

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      room.sendChat(chatInput);
      setChatInput('');
    }
  };

  const isPlayer = room.yourRole === 'white' || room.yourRole === 'black';
  const isSpectator = room.yourRole === 'spectator';
  const state = room.roomState;

  return (
    <div style={styles.pageContainer}>
      <Navigation />

      <main style={styles.main}>
        {/* TOP STATUS BAR */}
        <div style={styles.topBar}>
          <div style={styles.roomMeta}>
            <div style={styles.roomCodePill}>
              <span style={styles.roomCodeLabel}>ROOM</span>
              <span style={styles.roomCodeValue}>{code}</span>
            </div>
            <button style={styles.copyButton} onClick={handleCopyLink}>
              {copiedLink ? '✓ Copied' : '🔗 Share Link'}
            </button>
            <span style={styles.variantBadge}>
              {state?.variant === 'deck_builder' ? '🃏 Deck Builder' : '🌀 3D Wormhole'}
            </span>
          </div>

          <div style={styles.connectionMeta}>
            <div style={styles.statusIndicator}>
              <span
                style={{
                  ...styles.statusDot,
                  backgroundColor:
                    room.connectionStatus === 'connected'
                      ? '#10b981'
                      : room.connectionStatus === 'reconnecting'
                      ? '#f59e0b'
                      : '#ef4444',
                }}
              />
              <span style={styles.statusText}>{room.connectionStatus}</span>
            </div>
            {room.latencyMs > 0 && (
              <span style={styles.latencyBadge}>{room.latencyMs}ms</span>
            )}
          </div>
        </div>

        {/* SPECTATOR BANNER */}
        {isSpectator && state?.status === 'in_progress' && (
          <div style={styles.spectatorBanner}>
            👁️ Spectator Mode — You are watching this match live
          </div>
        )}

        {/* DRAW OFFER BANNER */}
        {room.drawOfferedBy && room.drawOfferedBy !== room.yourRole && isPlayer && (
          <div style={styles.drawBanner}>
            <span>Opponent offered a draw. Accept?</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={styles.drawAcceptBtn} onClick={room.acceptDraw}>
                Accept Draw
              </button>
            </div>
          </div>
        )}

        {/* CHESS CLOCK COMPONENT */}
        <ChessClock
          whiteMs={room.interpolatedClocks.whiteMs}
          blackMs={room.interpolatedClocks.blackMs}
          activeTurn={state?.activeTurn || null}
          isUntimed={state?.clock.isUntimed ?? false}
          whitePlayer={state?.whitePlayer || null}
          blackPlayer={state?.blackPlayer || null}
          disconnectGraceExpiresAt={room.disconnectGraceExpiresAt}
        />

        {/* MAIN GAME LAYOUT */}
        <div style={styles.gameLayout}>
          {/* Game Arena Board Viewport */}
          <div style={styles.arenaContainer}>
            {state?.status === 'waiting' ? (
              <div style={styles.waitingOverlay}>
                <div style={styles.waitingSpinner} />
                <h3 style={styles.waitingTitle}>Waiting for Challenger</h3>
                <p style={styles.waitingSub}>
                  Share room code <strong>{code}</strong> or send the invite link to start.
                </p>
                <button style={styles.copyButtonLarge} onClick={handleCopyLink}>
                  {copiedLink ? '✓ Link Copied to Clipboard!' : 'Copy Invite Link'}
                </button>
              </div>
            ) : (
              <div style={styles.boardPlaceholder}>
                <div style={styles.boardHeader}>
                  <span style={styles.boardTitle}>
                    {state?.variant === 'deck_builder'
                      ? 'Deck Builder Chess Board'
                      : '3D Wormhole Hyperbolic Arena'}
                  </span>
                  <span style={styles.turnIndicator}>
                    Turn {state?.turnNumber} • {state?.activeTurn === 'white' ? '⚪ White' : '⚫ Black'} to Move
                  </span>
                </div>

                <div style={styles.arenaVisual}>
                  <div style={styles.boardGraphic}>
                    {state?.variant === 'deck_builder' ? '♟️ 🃏 ♟️' : '🌀 ♟️ 🌀'}
                  </div>
                  <p style={styles.arenaHint}>
                    {isPlayer
                      ? state?.activeTurn === room.yourRole
                        ? "It's your turn! Make your move."
                        : "Waiting for opponent's move..."
                      : 'Observing live game state.'}
                  </p>
                </div>

                {/* In-game HUD controls */}
                {isPlayer && state?.status === 'in_progress' && (
                  <div style={styles.hudBar}>
                    <button
                      style={styles.hudButtonDanger}
                      onClick={() => {
                        if (window.confirm('Are you sure you want to resign this match?')) {
                          room.resign();
                        }
                      }}
                    >
                      🏳️ Resign
                    </button>
                    <button style={styles.hudButton} onClick={room.offerDraw}>
                      🤝 Offer Draw
                    </button>
                    <button
                      style={styles.hudButton}
                      onClick={() => setShowChat((prev) => !prev)}
                    >
                      💬 {showChat ? 'Hide Chat' : 'Show Chat'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat & Moves Sidebar */}
          {showChat && (
            <div style={styles.sidebar}>
              <div style={styles.sidebarTabs}>
                <span style={styles.sidebarTabActive}>Match Chat</span>
              </div>

              <div style={styles.chatMessageList}>
                {room.messages.length === 0 ? (
                  <div style={styles.emptyChat}>No messages yet. Say hello!</div>
                ) : (
                  room.messages.map((m, idx) => (
                    <div key={idx} style={styles.chatMessage}>
                      <span style={styles.chatSender}>
                        {m.sender} ({m.role}):
                      </span>
                      <span style={styles.chatText}>{m.text}</span>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendChat} style={styles.chatForm}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  style={styles.chatInput}
                />
                <button type="submit" style={styles.chatSendBtn}>
                  Send
                </button>
              </form>
            </div>
          )}
        </div>

        {/* GAME OVER MODAL */}
        {state?.status === 'finished' && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
              <div style={styles.modalTrophy}>
                {state.winner === 'draw' ? '🤝' : state.winner === room.yourRole ? '🏆' : '💀'}
              </div>
              <h2 style={styles.modalTitle}>
                {state.winner === 'draw'
                  ? 'Game Drawn'
                  : state.winner === room.yourRole
                  ? 'Victory!'
                  : `${state.winner === 'white' ? 'White' : 'Black'} Won`}
              </h2>
              <p style={styles.modalReason}>
                Conclusion by {state.finishReason?.replace('_', ' ') || 'game over'}
              </p>
              <div style={styles.modalActions}>
                <button style={styles.primaryActionBtn} onClick={() => navigate('/dashboard')}>
                  Return to Dashboard
                </button>
                <button
                  style={styles.secondaryActionBtn}
                  onClick={() => window.location.reload()}
                >
                  Play Again
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#0a0b1e',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
  },
  main: {
    flex: 1,
    padding: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1.25rem',
    padding: '0.75rem 1.25rem',
    backgroundColor: 'rgba(18, 21, 48, 0.7)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  roomMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  roomCodePill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '8px',
    padding: '0.3rem 0.6rem',
  },
  roomCodeLabel: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#818cf8',
  },
  roomCodeValue: {
    fontFamily: 'monospace',
    fontWeight: 800,
    fontSize: '0.95rem',
    color: '#ffffff',
    letterSpacing: '0.05em',
  },
  copyButton: {
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#e2e8f0',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  copyButtonLarge: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '1rem',
  },
  variantBadge: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '0.3rem 0.6rem',
    borderRadius: '6px',
  },
  connectionMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
    textTransform: 'capitalize',
  },
  latencyBadge: {
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    color: '#64748b',
  },
  spectatorBanner: {
    textAlign: 'center',
    padding: '0.6rem',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    borderRadius: '8px',
    color: '#38bdf8',
    fontSize: '0.9rem',
    fontWeight: 600,
    marginBottom: '1rem',
  },
  drawBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1.25rem',
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    border: '1px solid #eab308',
    borderRadius: '10px',
    color: '#fef08a',
    fontSize: '0.9rem',
    fontWeight: 600,
    marginBottom: '1rem',
  },
  drawAcceptBtn: {
    padding: '0.4rem 0.8rem',
    backgroundColor: '#eab308',
    color: '#000000',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  gameLayout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 300px',
    gap: '1.25rem',
    alignItems: 'start',
  },
  arenaContainer: {
    minHeight: '480px',
    backgroundColor: 'rgba(18, 21, 48, 0.6)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  waitingOverlay: {
    margin: 'auto',
    textAlign: 'center',
    padding: '3rem 1.5rem',
  },
  waitingSpinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid rgba(99, 102, 241, 0.3)',
    borderTopColor: '#6366f1',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1.5rem',
  },
  waitingTitle: {
    margin: '0 0 0.5rem',
    fontSize: '1.3rem',
    fontWeight: 700,
  },
  waitingSub: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '0.95rem',
  },
  boardPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '1.5rem',
  },
  boardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '0.75rem',
    marginBottom: '1.5rem',
  },
  boardTitle: {
    fontWeight: 700,
    fontSize: '1.05rem',
    color: '#e2e8f0',
  },
  turnIndicator: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#818cf8',
  },
  arenaVisual: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '260px',
    backgroundColor: 'rgba(10, 11, 30, 0.5)',
    borderRadius: '12px',
    border: '1px dashed rgba(255, 255, 255, 0.1)',
  },
  boardGraphic: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  arenaHint: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    margin: 0,
  },
  hudBar: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  hudButton: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  hudButtonDanger: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  sidebar: {
    backgroundColor: 'rgba(18, 21, 48, 0.7)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    height: '480px',
  },
  sidebarTabs: {
    padding: '1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  sidebarTabActive: {
    fontWeight: 700,
    fontSize: '0.9rem',
    color: '#e2e8f0',
  },
  chatMessageList: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  emptyChat: {
    color: '#64748b',
    fontSize: '0.85rem',
    textAlign: 'center',
    margin: 'auto',
  },
  chatMessage: {
    fontSize: '0.85rem',
    lineHeight: 1.4,
  },
  chatSender: {
    fontWeight: 700,
    color: '#818cf8',
    marginRight: '0.4rem',
  },
  chatText: {
    color: '#f1f5f9',
  },
  chatForm: {
    display: 'flex',
    padding: '0.75rem',
    gap: '0.5rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  chatInput: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    backgroundColor: 'rgba(10, 11, 30, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '0.85rem',
  },
  chatSendBtn: {
    padding: '0.5rem 0.75rem',
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: '#121530',
    border: '1px solid rgba(99, 102, 241, 0.4)',
    borderRadius: '20px',
    padding: '2.5rem',
    textAlign: 'center',
    maxWidth: '420px',
    width: '90%',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
  },
  modalTrophy: {
    fontSize: '3.5rem',
    marginBottom: '1rem',
  },
  modalTitle: {
    margin: '0 0 0.5rem',
    fontSize: '1.8rem',
    fontWeight: 800,
  },
  modalReason: {
    margin: '0 0 1.75rem',
    color: '#94a3b8',
    fontSize: '1rem',
    textTransform: 'capitalize',
  },
  modalActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  primaryActionBtn: {
    padding: '0.8rem 1.5rem',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
  },
  secondaryActionBtn: {
    padding: '0.8rem 1.5rem',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
};
