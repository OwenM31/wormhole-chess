import React, { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { useGameRoom } from '../hooks/useGameRoom';
import { ChessClock } from '../components/ChessClock';
import { WormholeLogo } from '../components/WormholeLogo';
import { DeckChessBoard } from '../components/DeckChessBoard';
import { TabletopArena } from '../components/TabletopArena';
import { TacticalHandBar } from '../components/TacticalHandBar';
import { useDeckChessGame } from '../hooks/useDeckChessGame';
import { usePlayerProfiles } from '../hooks/usePlayerProfiles';

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
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(true);

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

  const profilesHook = usePlayerProfiles();
  const { activeProfile } = profilesHook;
  const isDeckBuilder = (state?.variant || variant || 'deck_builder').includes('deck_builder');
  const playerColor = room.yourRole === 'black' ? 'b' : 'w';

  const deckGame = useDeckChessGame({
    mode: 'multiplayer',
    playerColor,
    whiteDeck: activeProfile.equippedHand,
    blackDeck: activeProfile.equippedHand,
    onTurnComplete: (payload) => {
      room.sendTurn(payload);
    },
  });

  // Track applied remote moves from roomState
  const lastProcessedTurnRef = useRef<number>(0);

  useEffect(() => {
    if (!state || !state.moveHistory || state.moveHistory.length === 0) return;
    const latestMove = state.moveHistory[state.moveHistory.length - 1];
    if (latestMove && latestMove.turnNumber > lastProcessedTurnRef.current) {
      lastProcessedTurnRef.current = latestMove.turnNumber;
      if (latestMove.player !== room.yourRole && latestMove.payload) {
        deckGame.applyRemoteTurn(latestMove.payload as any);
      }
    }
  }, [state?.moveHistory, room.yourRole, deckGame.applyRemoteTurn]);

  // When match begins or syncs existing state, align if needed
  useEffect(() => {
    if (state?.status === 'in_progress' && state.moveHistory && state.moveHistory.length > 0) {
      const latestMove = state.moveHistory[state.moveHistory.length - 1];
      if (latestMove && latestMove.turnNumber > lastProcessedTurnRef.current) {
        lastProcessedTurnRef.current = latestMove.turnNumber;
        if (latestMove.player !== room.yourRole && latestMove.payload) {
          deckGame.applyRemoteTurn(latestMove.payload as any);
        }
      }
    }
  }, [state?.status]);

  return (
    <div style={styles.pageContainer}>
      <style>{`
        @media (max-width: 860px) {
          .playroom-layout {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .playroom-main {
            padding: 0.75rem !important;
          }
          .chess-clock-row {
            grid-template-columns: 1fr !important;
            gap: 0.5rem !important;
          }
          .chess-clock-vs {
            display: none !important;
          }
          .chess-clock-box {
            padding: 0.6rem 0.85rem !important;
          }
          .chess-clock-time {
            font-size: 1.35rem !important;
          }
        }
      `}</style>
      <Navigation />

      <main style={styles.main} className="playroom-main">
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
              {state?.variant === 'deck_builder' ? (
                '🃏 Deck Builder'
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <WormholeLogo size={14} badged={true} /> 3D Wormhole
                </span>
              )}
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
        <div style={styles.gameLayout} className="playroom-layout">
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
                      ? 'Deck Builder'
                      : '3D Wormhole'}
                  </span>
                  <span style={styles.turnIndicator}>
                    Turn {state?.turnNumber} • {state?.activeTurn === 'white' ? '⚪ White' : '⚫ Black'} to Move
                  </span>
                </div>

                {isDeckBuilder ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%', padding: '0.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '100%', maxWidth: '820px' }}>
                        <TabletopArena>
                          <DeckChessBoard
                            embedded
                            fen={deckGame.fen}
                            orientation={playerColor}
                            selectedSquare={deckGame.selectedSquare}
                            legalMoves={deckGame.legalMovesForSelected}
                            empoweredMoves={deckGame.empoweredMoves}
                            hoveredCardId={deckGame.hoveredCardId}
                            selectedCardId={deckGame.selectedCardId}
                            disambiguationCandidates={deckGame.disambiguationCandidates}
                            pendingCardMove={deckGame.pendingCardMove}
                            pendingPromotionMove={deckGame.pendingPromotionMove}
                            onSquareClick={deckGame.handleSquareClick}
                            onConfirmCardMove={deckGame.confirmPendingCardMove}
                            onCancelCardMove={deckGame.cancelPendingCardMove}
                            onSelectPromotion={deckGame.selectPromotion}
                            onChangeCardPromotion={deckGame.changeCardPromotion}
                            inCheck={deckGame.inCheck}
                            activeModifiers={deckGame.activeModifiers}
                          />
                        </TabletopArena>
                      </div>
                      <div style={{ width: '100%', maxWidth: '820px' }}>
                        <TacticalHandBar
                          hand={playerColor === 'w' ? deckGame.whiteHand : deckGame.blackHand}
                          initialDeck={activeProfile.equippedHand}
                          isMyTurn={state?.activeTurn === room.yourRole}
                          selectedCardId={deckGame.selectedCardId}
                          hoveredCardId={deckGame.hoveredCardId}
                          activeCardIdsForPiece={deckGame.activeCardIdsForPiece}
                          onSelectCard={deckGame.selectCard}
                          onHoverCard={deckGame.setHoveredCard}
                          onCancelTargeting={deckGame.cancelPendingCardMove}
                          pendingCardMove={deckGame.pendingCardMove}
                          selectedSquare={deckGame.selectedSquare}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={styles.arenaVisual}>
                    <div style={styles.boardGraphic}>🌀 ♟️ 🌀</div>
                    <p style={styles.arenaHint}>
                      {isPlayer
                        ? state?.activeTurn === room.yourRole
                          ? "It's your turn! Make your move."
                          : "Waiting for opponent's move..."
                        : 'Observing live game state.'}
                    </p>
                  </div>
                )}

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
                <span style={styles.sidebarTabActive}>Chat</span>
              </div>

              <div style={styles.chatMessageList}>
                {room.messages.length === 0 ? (
                  <div style={styles.emptyChat}>No messages</div>
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
                  placeholder="Send message..."
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

        {/* GAME OVER MODAL & REVIEW BOARD BANNER */}
        {state?.status === 'finished' && showGameOverModal && (
          <div
            style={styles.modalOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowGameOverModal(false);
            }}
          >
            <div style={{ ...styles.modalCard, position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowGameOverModal(false)}
                aria-label="Close modal to review board"
                title="Review Board"
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(25, 27, 29, 0.7)',
                  border: '1px solid rgba(139, 126, 116, 0.3)',
                  color: '#8B7E74',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ✕
              </button>
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
                <button
                  style={styles.primaryActionBtn}
                  onClick={() => window.location.reload()}
                >
                  Play Again
                </button>
                <button
                  style={styles.secondaryActionBtn}
                  onClick={() => setShowGameOverModal(false)}
                >
                  Review Board
                </button>
                <button
                  style={styles.secondaryActionBtn}
                  onClick={() => navigate('/deck-builder')}
                >
                  Back to Matchmaking
                </button>
                <button
                  style={{ ...styles.secondaryActionBtn, opacity: 0.8 }}
                  onClick={() => navigate('/dashboard')}
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FLOATING BANNER WHEN GAME OVER MODAL IS DISMISSED */}
        {state?.status === 'finished' && !showGameOverModal && (
          <div
            style={{
              position: 'fixed',
              top: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 900,
              backgroundColor: '#141618f0',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(212, 175, 55, 0.6)',
              borderRadius: '6px',
              padding: '0.6rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              maxWidth: '90vw',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>
              {state.winner === 'draw' ? '🤝' : state.winner === room.yourRole ? '🏆' : '💀'}
            </span>
            <span style={{ fontWeight: 700, color: state.winner === room.yourRole ? '#D4AF37' : '#FAF9F6', fontSize: '0.9rem' }}>
              {state.winner === 'draw'
                ? 'Game Drawn'
                : state.winner === room.yourRole
                ? 'Victory!'
                : `${state.winner === 'white' ? 'White' : 'Black'} Won`}
            </span>
            <button
              style={{ ...styles.primaryActionBtn, padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => window.location.reload()}
            >
              Play Again
            </button>
            <button
              style={{ ...styles.secondaryActionBtn, padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => navigate('/deck-builder')}
            >
              Back to Matchmaking
            </button>
            <button
              style={{ background: 'none', border: 'none', color: '#8B7E74', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem' }}
              onClick={() => setShowGameOverModal(true)}
            >
              Show Results
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#191B1D',
    color: '#FAF9F6',
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
    backgroundColor: '#1C1E20',
    borderRadius: '6px',
    border: '1px solid rgba(139, 126, 116, 0.2)',
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
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    border: '1px solid rgba(212, 175, 55, 0.4)',
    borderRadius: '4px',
    padding: '0.3rem 0.6rem',
  },
  roomCodeLabel: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#D4AF37',
  },
  roomCodeValue: {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
    fontWeight: 800,
    fontSize: '0.95rem',
    color: '#FAF9F6',
    letterSpacing: '0.05em',
  },
  copyButton: {
    padding: '0.35rem 0.75rem',
    borderRadius: '4px',
    border: '1px solid rgba(139, 126, 116, 0.25)',
    backgroundColor: '#24272A',
    color: '#FAF9F6',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  copyButtonLarge: {
    padding: '0.65rem 1.25rem',
    borderRadius: '4px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: '#4C5C4C',
    color: '#FAF9F6',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  variantBadge: {
    fontSize: '0.8rem',
    color: '#8B7E74',
    backgroundColor: '#24272A',
    border: '1px solid rgba(139, 126, 116, 0.2)',
    padding: '0.3rem 0.6rem',
    borderRadius: '4px',
    fontWeight: 600,
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
    color: '#8B7E74',
    textTransform: 'capitalize',
  },
  latencyBadge: {
    fontSize: '0.75rem',
    fontFamily: 'ui-monospace, monospace',
    color: '#6E665E',
  },
  spectatorBanner: {
    textAlign: 'center',
    padding: '0.6rem',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '6px',
    color: '#D4AF37',
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: '1rem',
  },
  drawBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1.25rem',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    border: '1px solid rgba(212, 175, 55, 0.4)',
    borderRadius: '6px',
    color: '#D4AF37',
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: '1rem',
  },
  drawAcceptBtn: {
    padding: '0.4rem 0.8rem',
    backgroundColor: '#4C5C4C',
    color: '#FAF9F6',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    fontWeight: 600,
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
    backgroundColor: '#24272A',
    borderRadius: '6px',
    border: '1px solid rgba(139, 126, 116, 0.2)',
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
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '3px solid rgba(139, 126, 116, 0.25)',
    borderTopColor: '#D4AF37',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1.5rem',
  },
  waitingTitle: {
    margin: '0 0 0.5rem',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#FAF9F6',
  },
  waitingSub: {
    margin: 0,
    color: '#8B7E74',
    fontSize: '0.9rem',
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
    borderBottom: '1px solid rgba(139, 126, 116, 0.15)',
    paddingBottom: '0.75rem',
    marginBottom: '1.5rem',
  },
  boardTitle: {
    fontWeight: 700,
    fontSize: '1rem',
    color: '#FAF9F6',
  },
  turnIndicator: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#D4AF37',
    fontFamily: 'ui-monospace, monospace',
  },
  arenaVisual: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '260px',
    backgroundColor: '#191B1D',
    borderRadius: '6px',
    border: '1px dashed rgba(139, 126, 116, 0.2)',
  },
  boardGraphic: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  arenaHint: {
    color: '#8B7E74',
    fontSize: '0.85rem',
    margin: 0,
  },
  hudBar: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(139, 126, 116, 0.15)',
  },
  hudButton: {
    padding: '0.45rem 0.85rem',
    borderRadius: '4px',
    border: '1px solid rgba(139, 126, 116, 0.25)',
    backgroundColor: '#1C1E20',
    color: '#FAF9F6',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  hudButtonDanger: {
    padding: '0.45rem 0.85rem',
    borderRadius: '4px',
    border: '1px solid rgba(170, 74, 68, 0.4)',
    backgroundColor: 'rgba(170, 74, 68, 0.15)',
    color: '#FAF9F6',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  sidebar: {
    backgroundColor: '#1C1E20',
    borderRadius: '6px',
    border: '1px solid rgba(139, 126, 116, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    height: '480px',
  },
  sidebarTabs: {
    padding: '0.85rem 1rem',
    borderBottom: '1px solid rgba(139, 126, 116, 0.15)',
  },
  sidebarTabActive: {
    fontWeight: 700,
    fontSize: '0.85rem',
    color: '#FAF9F6',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
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
    color: '#8B7E74',
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
    color: '#D4AF37',
    marginRight: '0.4rem',
  },
  chatText: {
    color: '#FAF9F6',
  },
  chatForm: {
    display: 'flex',
    padding: '0.75rem',
    gap: '0.5rem',
    borderTop: '1px solid rgba(139, 126, 116, 0.15)',
  },
  chatInput: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    backgroundColor: '#191B1D',
    border: '1px solid rgba(139, 126, 116, 0.25)',
    borderRadius: '4px',
    color: '#FAF9F6',
    fontSize: '0.85rem',
  },
  chatSendBtn: {
    padding: '0.5rem 0.85rem',
    backgroundColor: '#4C5C4C',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    color: '#FAF9F6',
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
    backgroundColor: 'rgba(10, 11, 13, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: '#24272A',
    border: '1px solid rgba(139, 126, 116, 0.3)',
    borderRadius: '8px',
    padding: '2rem 1.5rem',
    textAlign: 'center',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.8)',
  },
  modalTrophy: {
    fontSize: '3rem',
    marginBottom: '0.75rem',
  },
  modalTitle: {
    margin: '0 0 0.5rem',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#FAF9F6',
  },
  modalReason: {
    margin: '0 0 1.5rem',
    color: '#8B7E74',
    fontSize: '0.9rem',
    textTransform: 'capitalize',
  },
  modalActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  primaryActionBtn: {
    padding: '0.75rem 1.25rem',
    borderRadius: '4px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: '#4C5C4C',
    color: '#FAF9F6',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  secondaryActionBtn: {
    padding: '0.75rem 1.25rem',
    borderRadius: '4px',
    border: '1px solid rgba(139, 126, 116, 0.25)',
    backgroundColor: '#1C1E20',
    color: '#FAF9F6',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
};
