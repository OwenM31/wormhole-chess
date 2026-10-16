import React, { useState, useEffect } from 'react';
import type { TurnColor, PlayerSlot } from '../types/room';

export interface ChessClockProps {
  whiteMs: number;
  blackMs: number;
  activeTurn: TurnColor | null;
  isUntimed: boolean;
  whitePlayer: PlayerSlot | null;
  blackPlayer: PlayerSlot | null;
  disconnectGraceExpiresAt: number | null;
}

export const ChessClock: React.FC<ChessClockProps> = ({
  whiteMs,
  blackMs,
  activeTurn,
  isUntimed,
  whitePlayer,
  blackPlayer,
  disconnectGraceExpiresAt,
}) => {
  const [graceSecondsLeft, setGraceSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!disconnectGraceExpiresAt) {
      setGraceSecondsLeft(null);
      return;
    }
    const updateGrace = () => {
      const remaining = Math.max(0, Math.ceil((disconnectGraceExpiresAt - Date.now()) / 1000));
      setGraceSecondsLeft(remaining);
    };
    updateGrace();
    const interval = setInterval(updateGrace, 1000);
    return () => clearInterval(interval);
  }, [disconnectGraceExpiresAt]);

  const formatTime = (ms: number) => {
    if (ms <= 0) return '0:00.0';
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (totalSeconds < 10) {
      const tenths = Math.floor((ms % 1000) / 100);
      return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`;
    }

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const isWhiteLow = !isUntimed && whiteMs < 30000 && whiteMs > 0;
  const isBlackLow = !isUntimed && blackMs < 30000 && blackMs > 0;

  return (
    <div style={styles.container}>
      {/* Disconnect Alert Bar */}
      {graceSecondsLeft !== null && graceSecondsLeft > 0 && (
        <div style={styles.disconnectBanner}>
          <span style={styles.disconnectIcon}>⚠️</span>
          <span>
            Opponent disconnected. Reconnection grace forfeit in{' '}
            <strong>{graceSecondsLeft}s</strong>...
          </span>
        </div>
      )}

      <div style={styles.clockRow} className="chess-clock-row">
        {/* White Clock */}
        <div
          className="chess-clock-box"
          style={{
            ...styles.clockBox,
            ...(activeTurn === 'white' ? styles.clockActive : {}),
            ...(isWhiteLow ? styles.clockLowTime : {}),
          }}
        >
          <div style={styles.playerMeta}>
            <span style={styles.colorPillWhite}>⚪ White</span>
            <span style={styles.playerName}>
              {whitePlayer?.username || 'Waiting for player...'}
              {whitePlayer && !whitePlayer.connected && ' (Disconnected)'}
            </span>
          </div>
          <div style={styles.timeDisplay} className="chess-clock-time">
            {isUntimed ? (
              <span style={styles.untimedBadge}>Casual / Untimed</span>
            ) : (
              formatTime(whiteMs)
            )}
          </div>
        </div>

        <div style={styles.vsBadge} className="chess-clock-vs">
          VS
        </div>

        {/* Black Clock */}
        <div
          className="chess-clock-box"
          style={{
            ...styles.clockBox,
            ...(activeTurn === 'black' ? styles.clockActive : {}),
            ...(isBlackLow ? styles.clockLowTime : {}),
          }}
        >
          <div style={styles.playerMeta}>
            <span style={styles.colorPillBlack}>⚫ Black</span>
            <span style={styles.playerName}>
              {blackPlayer?.username || 'Waiting for player...'}
              {blackPlayer && !blackPlayer.connected && ' (Disconnected)'}
            </span>
          </div>
          <div style={styles.timeDisplay} className="chess-clock-time">
            {isUntimed ? (
              <span style={styles.untimedBadge}>Casual / Untimed</span>
            ) : (
              formatTime(blackMs)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto 1.5rem',
  },
  disconnectBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.65rem 1rem',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    border: '1px solid rgba(212, 175, 55, 0.4)',
    borderRadius: '6px',
    color: '#D4AF37',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  disconnectIcon: {
    fontSize: '1.1rem',
  },
  clockRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: '1rem',
  },
  vsBadge: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: '#8B7E74',
    letterSpacing: '0.1em',
  },
  clockBox: {
    padding: '0.9rem 1.15rem',
    backgroundColor: '#24272A',
    border: '1px solid rgba(139, 126, 116, 0.2)',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    transition: 'all 0.15s ease',
  },
  clockActive: {
    borderColor: '#D4AF37',
    backgroundColor: '#2A2E33',
    boxShadow: '0 0 16px rgba(212, 175, 55, 0.2)',
  },
  clockLowTime: {
    borderColor: '#AA4A44',
    backgroundColor: 'rgba(170, 74, 68, 0.2)',
    boxShadow: '0 0 16px rgba(170, 74, 68, 0.3)',
  },
  playerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  colorPillWhite: {
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '0.2rem 0.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '4px',
    color: '#FAF9F6',
  },
  colorPillBlack: {
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '0.2rem 0.5rem',
    backgroundColor: '#191B1D',
    borderRadius: '4px',
    color: '#8B7E74',
    border: '1px solid rgba(139, 126, 116, 0.25)',
  },
  playerName: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#FAF9F6',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  timeDisplay: {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
    fontVariantNumeric: 'tabular-nums',
    fontSize: '1.65rem',
    fontWeight: 700,
    color: '#FAF9F6',
    letterSpacing: '0.04em',
  },
  untimedBadge: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#8B7E74',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};
