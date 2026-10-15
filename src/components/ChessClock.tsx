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

      <div style={styles.clockRow}>
        {/* White Clock */}
        <div
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
          <div style={styles.timeDisplay}>
            {isUntimed ? (
              <span style={styles.untimedBadge}>Casual / Untimed</span>
            ) : (
              formatTime(whiteMs)
            )}
          </div>
        </div>

        <div style={styles.vsBadge}>VS</div>

        {/* Black Clock */}
        <div
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
          <div style={styles.timeDisplay}>
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
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    border: '1px solid #f59e0b',
    borderRadius: '10px',
    color: '#fbbf24',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  disconnectIcon: {
    fontSize: '1.25rem',
  },
  clockRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: '1rem',
  },
  vsBadge: {
    fontSize: '0.9rem',
    fontWeight: 800,
    color: '#64748b',
    letterSpacing: '0.1em',
  },
  clockBox: {
    padding: '1rem 1.25rem',
    backgroundColor: 'rgba(18, 21, 48, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    transition: 'all 0.2s ease',
  },
  clockActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    boxShadow: '0 0 20px rgba(99, 102, 241, 0.35)',
  },
  clockLowTime: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
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
    color: '#ffffff',
  },
  colorPillBlack: {
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '0.2rem 0.5rem',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '4px',
    color: '#cbd5e1',
  },
  playerName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#e2e8f0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  timeDisplay: {
    fontFamily: 'monospace',
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#f8fafc',
    letterSpacing: '0.05em',
  },
  untimedBadge: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#94a3b8',
    fontFamily: 'system-ui, sans-serif',
  },
};
