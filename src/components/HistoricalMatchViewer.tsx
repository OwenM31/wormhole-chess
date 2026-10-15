import React, { useState, useEffect, useRef } from 'react';
import { MatchRecord } from '../services/api';
import { DeckChessBoard } from './DeckChessBoard';
import { getCardById, PIECE_COLOR_THEMES } from '../engine/cardGraph';
import { playMoveSound, playCardSound } from '../utils/soundEffects';

export interface HistoricalMatchViewerProps {
  match: MatchRecord;
  onClose: () => void;
}

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const HistoricalMatchViewer: React.FC<HistoricalMatchViewerProps> = ({
  match,
  onClose,
}) => {
  const moves = Array.isArray(match.moves) ? match.moves : [];
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed] = useState<number>(1200);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const activeTurnRef = useRef<HTMLDivElement | null>(null);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= moves.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        const next = prev + 1;
        const turn = moves[next];
        if (turn?.cardAction) {
          playCardSound();
        } else {
          playMoveSound();
        }
        return next;
      });
    }, playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, moves, playbackSpeed]);

  // Auto-scroll active move into view in sidebar
  useEffect(() => {
    if (activeTurnRef.current) {
      activeTurnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentIndex]);

  const currentMove = currentIndex >= 0 ? moves[currentIndex] : null;
  const currentFen = currentMove?.fenAfter || currentMove?.resultingFen || STARTING_FEN;
  const currentCard = currentMove?.cardAction ? getCardById(currentMove.cardAction.cardId) : null;
  const cardTheme = currentCard ? PIECE_COLOR_THEMES[currentCard.anchor] : null;

  const handleStep = (targetIndex: number) => {
    const clamped = Math.max(-1, Math.min(moves.length - 1, targetIndex));
    if (clamped > currentIndex) {
      const turn = moves[clamped];
      if (turn?.cardAction) {
        playCardSound();
      } else {
        playMoveSound();
      }
    }
    setCurrentIndex(clamped);
  };

  const handleTogglePlay = () => {
    if (currentIndex >= moves.length - 1) {
      setCurrentIndex(-1);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const isWin = match.result === '1-0';
  const isLoss = match.result === '0-1';

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header Bar */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.titleRow}>
              <h3 style={styles.title}>Match Replay</h3>
              <span style={styles.variantBadge}>
                {match.variant.replace(/_/g, ' ')}
              </span>
              <span
                style={{
                  ...styles.resultBadge,
                  ...(isWin ? styles.badgeWin : isLoss ? styles.badgeLoss : styles.badgeDraw),
                }}
              >
                {match.result || 'Finished'}
              </span>
            </div>
            <div style={styles.metaRow}>
              <span>White: <strong style={{ color: '#f8fafc' }}>{match.whiteUsername || 'Player 1'}</strong></span>
              <span style={{ color: '#64748b' }}>vs</span>
              <span>Black: <strong style={{ color: '#f8fafc' }}>{match.blackUsername || 'Player 2 / AI'}</strong></span>
              {match.startedAt && (
                <>
                  <span style={{ color: '#64748b' }}>·</span>
                  <span style={styles.dateText}>{formatDate(match.startedAt)}</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            style={styles.closeBtn}
            title="Close Replay"
          >
            ✕
          </button>
        </div>

        {/* Content Body: Board + Sidebar */}
        <div style={styles.body}>
          {/* Left Column: Board & Controls */}
          <div style={styles.boardColumn}>
            {/* Tactical Card Annotation Banner */}
            {currentCard && cardTheme && (
              <div
                style={{
                  ...styles.cardBanner,
                  backgroundColor: `${cardTheme.hex}14`,
                  borderColor: `${cardTheme.hex}50`,
                }}
              >
                <div style={styles.cardBannerLeft}>
                  <span style={{ fontSize: '1.2rem' }}>{cardTheme.badgeIcon}</span>
                  <div>
                    <div style={styles.cardTitleRow}>
                      <span style={styles.cardName}>{currentCard.name}</span>
                      <span
                        style={{
                          ...styles.energyTag,
                          backgroundColor: `${cardTheme.hex}25`,
                          color: cardTheme.hex,
                        }}
                      >
                        ⚡ {currentCard.energyCost} Energy
                      </span>
                    </div>
                    <p style={styles.cardDesc}>{currentCard.description}</p>
                  </div>
                </div>
                {currentMove?.cardAction?.anchorSquare && (
                  <span style={styles.anchorBadge}>
                    Anchor: {currentMove.cardAction.anchorSquare}
                    {currentMove.cardAction.targetSquare ? ` ➔ ${currentMove.cardAction.targetSquare}` : ''}
                  </span>
                )}
              </div>
            )}

            {/* Chess Board */}
            <div style={styles.boardFrame}>
              <DeckChessBoard
                fen={currentFen}
                orientation={isFlipped ? 'b' : 'w'}
                selectedSquare={currentMove?.chessMove?.from}
                legalMoves={currentMove?.chessMove?.to ? [currentMove.chessMove.to] : []}
                validAnchorSquares={currentMove?.cardAction?.anchorSquare ? [currentMove.cardAction.anchorSquare] : []}
                validTargetSquares={currentMove?.cardAction?.targetSquare ? [currentMove.cardAction.targetSquare] : []}
                onSquareClick={() => {}}
              />
            </div>

            {/* Replay Controls Toolbar */}
            <div style={styles.toolbar}>
              <span style={styles.turnCounter}>
                {currentIndex === -1 ? 'Initial Setup' : `Turn ${currentIndex + 1} / ${moves.length}`}
              </span>

              <div style={styles.controlButtons}>
                <button
                  onClick={() => handleStep(-1)}
                  disabled={currentIndex === -1}
                  style={currentIndex === -1 ? styles.toolBtnDisabled : styles.toolBtn}
                  title="Jump to Start"
                >
                  |◀
                </button>
                <button
                  onClick={() => handleStep(currentIndex - 1)}
                  disabled={currentIndex === -1}
                  style={currentIndex === -1 ? styles.toolBtnDisabled : styles.toolBtn}
                  title="Step Backward"
                >
                  ◀
                </button>
                <button
                  onClick={handleTogglePlay}
                  style={isPlaying ? styles.toolBtnPause : styles.toolBtnPlay}
                  title={isPlaying ? 'Pause' : 'Auto Play'}
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
                <button
                  onClick={() => handleStep(currentIndex + 1)}
                  disabled={currentIndex >= moves.length - 1}
                  style={currentIndex >= moves.length - 1 ? styles.toolBtnDisabled : styles.toolBtn}
                  title="Step Forward"
                >
                  ▶
                </button>
                <button
                  onClick={() => handleStep(moves.length - 1)}
                  disabled={currentIndex >= moves.length - 1}
                  style={currentIndex >= moves.length - 1 ? styles.toolBtnDisabled : styles.toolBtn}
                  title="Jump to End"
                >
                  ▶|
                </button>
                <button
                  onClick={() => setIsFlipped((prev) => !prev)}
                  style={styles.toolBtn}
                  title="Flip Board"
                >
                  ⟲ Flip
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Move List Sidebar */}
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <span style={styles.sidebarTitle}>Move History</span>
              <span style={styles.sidebarCount}>
                {moves.length} {moves.length === 1 ? 'ply' : 'plies'}
              </span>
            </div>

            {moves.length === 0 ? (
              <div style={styles.emptyNotice}>
                No recorded moves available for this match.
              </div>
            ) : (
              <div style={styles.moveList}>
                {/* Initial Position Row */}
                <button
                  onClick={() => handleStep(-1)}
                  style={{
                    ...styles.moveRow,
                    ...(currentIndex === -1 ? styles.moveRowActive : {}),
                  }}
                >
                  <span style={{ fontWeight: currentIndex === -1 ? 600 : 500 }}>Starting Position</span>
                  <span style={styles.moveInitTag}>Init</span>
                </button>

                {moves.map((turn: any, idx: number) => {
                  const isSelected = currentIndex === idx;
                  const card = turn.cardAction ? getCardById(turn.cardAction.cardId) : null;
                  const moveText =
                    turn.chessMove?.from && turn.chessMove?.to
                      ? `${turn.chessMove.from} ➔ ${turn.chessMove.to}`
                      : turn.combatText || `Move ${idx + 1}`;

                  return (
                    <div
                      key={idx}
                      ref={isSelected ? activeTurnRef : null}
                      onClick={() => handleStep(idx)}
                      style={{
                        ...styles.moveItem,
                        ...(isSelected ? styles.moveItemActive : {}),
                      }}
                    >
                      <div style={styles.moveItemTop}>
                        <span style={styles.turnNumber}>#{turn.turnNumber || idx + 1}</span>
                        <span
                          style={{
                            ...styles.playerBadge,
                            ...(turn.player === 'w' ? styles.playerWhite : styles.playerBlack),
                          }}
                        >
                          {turn.player === 'w' ? 'White' : 'Black'}
                        </span>
                      </div>

                      {card && (
                        <div style={styles.cardPlayRow}>
                          <span>{card.visualTheme.badgeIcon}</span>
                          <span>[{card.name}]</span>
                        </div>
                      )}

                      <div style={styles.moveNotationRow}>
                        <span>{moveText}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    backgroundColor: 'rgba(9, 10, 15, 0.85)',
    backdropFilter: 'blur(8px)',
  },
  modal: {
    backgroundColor: '#0e1118',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    width: '100%',
    maxWidth: '1040px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
    overflow: 'hidden',
  },
  header: {
    padding: '0.85rem 1.15rem',
    backgroundColor: '#0c0e14',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  title: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#f8fafc',
    margin: 0,
  },
  variantBadge: {
    fontSize: '0.65rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '0.15rem 0.45rem',
    borderRadius: '3px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: '#94a3b8',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  resultBadge: {
    fontSize: '0.65rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    padding: '0.15rem 0.45rem',
    borderRadius: '3px',
  },
  badgeWin: {
    color: '#4ade80',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    border: '1px solid rgba(74, 222, 128, 0.25)',
  },
  badgeLoss: {
    color: '#f87171',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid rgba(248, 113, 113, 0.25)',
  },
  badgeDraw: {
    color: '#94a3b8',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  metaRow: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
  },
  dateText: {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontVariantNumeric: 'tabular-nums',
    color: '#64748b',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1rem',
    padding: '0.35rem 0.65rem',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'color 0.15s ease',
  },
  body: {
    display: 'flex',
    flexDirection: 'row',
    gap: '1.25rem',
    padding: '1.25rem',
    overflowY: 'auto',
    flex: 1,
  },
  boardColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.85rem',
  },
  cardBanner: {
    width: '100%',
    maxWidth: '460px',
    padding: '0.6rem 0.85rem',
    borderRadius: '6px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
  },
  cardBannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
  },
  cardName: {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#f8fafc',
  },
  energyTag: {
    fontSize: '0.65rem',
    fontWeight: 600,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    padding: '0.1rem 0.35rem',
    borderRadius: '3px',
  },
  cardDesc: {
    fontSize: '0.7rem',
    color: '#cbd5e1',
    margin: '0.15rem 0 0',
  },
  anchorBadge: {
    fontSize: '0.7rem',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    color: '#94a3b8',
    backgroundColor: '#090a0f',
    padding: '0.2rem 0.45rem',
    borderRadius: '3px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  boardFrame: {
    width: '100%',
    maxWidth: '460px',
    aspectRatio: '1 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#0c0e14',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    padding: '0.45rem 0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
  },
  turnCounter: {
    fontSize: '0.75rem',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontVariantNumeric: 'tabular-nums',
    color: '#94a3b8',
    fontWeight: 500,
  },
  controlButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  toolBtn: {
    padding: '0.3rem 0.55rem',
    backgroundColor: '#171b26',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    color: '#f8fafc',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  toolBtnDisabled: {
    padding: '0.3rem 0.55rem',
    backgroundColor: '#0e1118',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '4px',
    color: '#64748b',
    fontSize: '0.75rem',
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  toolBtnPlay: {
    padding: '0.3rem 0.75rem',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  toolBtnPause: {
    padding: '0.3rem 0.75rem',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#090a0f',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '6px',
    padding: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    boxSizing: 'border-box',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '0.45rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  sidebarTitle: {
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#94a3b8',
  },
  sidebarCount: {
    fontSize: '0.7rem',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontVariantNumeric: 'tabular-nums',
    color: '#64748b',
  },
  emptyNotice: {
    textAlign: 'center',
    padding: '2rem 1rem',
    color: '#64748b',
    fontSize: '0.75rem',
  },
  moveList: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '440px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    paddingRight: '0.2rem',
  },
  moveRow: {
    padding: '0.45rem 0.65rem',
    borderRadius: '4px',
    backgroundColor: '#0e1118',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  moveRowActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    color: '#38bdf8',
  },
  moveInitTag: {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontSize: '0.65rem',
    color: '#64748b',
  },
  moveItem: {
    padding: '0.5rem 0.65rem',
    borderRadius: '4px',
    backgroundColor: '#0e1118',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  moveItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  moveItemTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.2rem',
  },
  turnNumber: {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontVariantNumeric: 'tabular-nums',
    fontSize: '0.7rem',
    color: '#64748b',
    fontWeight: 600,
  },
  playerBadge: {
    fontSize: '0.65rem',
    fontWeight: 600,
    padding: '0.1rem 0.35rem',
    borderRadius: '3px',
  },
  playerWhite: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#e2e8f0',
  },
  playerBlack: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    color: '#c084fc',
    border: '1px solid rgba(124, 58, 237, 0.25)',
  },
  cardPlayRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#4ade80',
    marginBottom: '0.2rem',
  },
  moveNotationRow: {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 600,
    fontSize: '0.75rem',
    color: '#38bdf8',
  },
};

export default HistoricalMatchViewer;
