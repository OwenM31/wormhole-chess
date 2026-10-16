import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ChessboardScene from '../components/ChessboardScene';
import { api } from '../services/api';
import { playVictorySound, playDefeatSound } from '../utils/soundEffects';

export const WormholePage: React.FC = () => {
  const gameStartedAtRef = useRef<number>(Date.now());
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [recordStatus, setRecordStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnInfo, setTurnInfo] = useState<{
    currentPlayer: 1 | 2 | 3 | 4;
    turnCount: number;
    moveCount: number;
  }>({
    currentPlayer: 1,
    turnCount: 1,
    moveCount: 0,
  });

  const [whiteTime, setWhiteTime] = useState(300);
  const [blackTime, setBlackTime] = useState(300);

  useEffect(() => {
    if (showFinishModal) return;
    const interval = setInterval(() => {
      if (turnInfo.currentPlayer === 1) {
        setWhiteTime((prev) => Math.max(0, prev - 1));
      } else if (turnInfo.currentPlayer === 2) {
        setBlackTime((prev) => Math.max(0, prev - 1));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [turnInfo.currentPlayer, showFinishModal]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const turnLabel =
    turnInfo.currentPlayer === 1
      ? 'White to move'
      : turnInfo.currentPlayer === 2
      ? 'Black to move'
      : `Player ${turnInfo.currentPlayer} to move`;

  const turnDotColor =
    turnInfo.currentPlayer === 1
      ? '#FAF9F6'
      : turnInfo.currentPlayer === 2
      ? '#191B1D'
      : turnInfo.currentPlayer === 3
      ? '#4C5C4C'
      : '#D4AF37';

  const handleConcludeMatch = async (winner: 'white' | 'black' | 'draw') => {
    setIsSubmitting(true);
    const result = winner === 'white' ? '1-0' : winner === 'black' ? '0-1' : '1/2-1/2';

    if (winner === 'white') {
      playVictorySound();
    } else if (winner === 'black') {
      playDefeatSound();
    }

    try {
      const res = await api.recordMatch({
        variant: 'wormhole:local',
        opponentName: 'Local Player',
        result,
        winner,
        moves: [],
        startedAt: gameStartedAtRef.current,
        endedAt: Date.now(),
      });

      if (res.success) {
        setRecordStatus(`Match recorded to history (${result}) ✓`);
        gameStartedAtRef.current = Date.now();
      } else {
        setRecordStatus('Saved locally');
      }
    } catch (err: unknown) {
      setRecordStatus('Recorded locally (offline / guest)');
    } finally {
      setIsSubmitting(false);
      setShowFinishModal(false);
      setTimeout(() => setRecordStatus(null), 4000);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Floating Top Glass HUD Capsule (Variant A) */}
      <div style={overlayNavStyle}>
        <Link to="/" style={homeLinkStyle} title="Return to Home">
          ← Home
        </Link>

        <div style={modeBadgeStyle}>
          <span>3D Wormhole</span>
          <span style={spatialTagStyle}>SPATIAL</span>
        </div>

        <div style={turnBadgeStyle}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: turnDotColor,
              border: '1px solid #D4AF37',
              boxShadow: '0 0 6px rgba(212, 175, 55, 0.6)',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: '0.8rem', color: '#FAF9F6', fontWeight: 600 }}>
            {turnLabel} · Turn {turnInfo.turnCount}
          </span>
        </div>

        <div style={clockBadgeStyle}>
          <span
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '0.8rem',
              color: '#8B7E74',
            }}
          >
            <span
              style={{
                color: turnInfo.currentPlayer === 1 ? '#D4AF37' : '#FAF9F6',
                fontWeight: 600,
              }}
            >
              {formatTime(whiteTime)}
            </span>
            {' vs '}
            <span
              style={{
                color: turnInfo.currentPlayer === 2 ? '#D4AF37' : '#FAF9F6',
                fontWeight: 600,
              }}
            >
              {formatTime(blackTime)}
            </span>
          </span>
        </div>

        <button
          onClick={() => setShowFinishModal((prev) => !prev)}
          style={finishBtnStyle}
          title="Conclude match and save record to history"
        >
          🏁 Conclude Match
        </button>

        {recordStatus && <span style={statusBadgeStyle}>{recordStatus}</span>}
      </div>

      {/* Match Conclusion Modal */}
      {showFinishModal && (
        <div style={modalBackdropStyle}>
          <div style={modalDialogStyle}>
            <h3 style={modalHeadingStyle}>Conclude 3D Match</h3>
            <p style={modalSubtextStyle}>
              Select the final result to persist this match into your cloud history:
            </p>
            <div style={modalButtonGridStyle}>
              <button
                onClick={() => handleConcludeMatch('white')}
                disabled={isSubmitting}
                style={whiteWinBtnStyle}
              >
                ⚪ White Wins (1-0)
              </button>
              <button
                onClick={() => handleConcludeMatch('black')}
                disabled={isSubmitting}
                style={blackWinBtnStyle}
              >
                ⚫ Black Wins (0-1)
              </button>
              <button
                onClick={() => handleConcludeMatch('draw')}
                disabled={isSubmitting}
                style={drawBtnStyle}
              >
                🤝 Draw (1/2-1/2)
              </button>
            </div>
            <button
              onClick={() => setShowFinishModal(false)}
              style={cancelBtnStyle}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Full-viewport Three.js Canvas Container */}
      <div style={canvasContainerStyle}>
        <ChessboardScene hideHeaderTitle={true} onGameStateChange={setTurnInfo} />
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  backgroundColor: '#090A0F',
};

const overlayNavStyle: React.CSSProperties = {
  position: 'absolute',
  top: '1rem',
  left: '1.25rem',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  gap: '0.65rem',
  flexWrap: 'wrap',
  padding: '6px 10px',
  backgroundColor: 'rgba(28, 30, 32, 0.88)',
  backdropFilter: 'blur(14px)',
  borderRadius: '6px',
  border: '1px solid rgba(139, 126, 116, 0.25)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
};

const homeLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.4rem 0.75rem',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  color: '#FAF9F6',
  textDecoration: 'none',
  fontSize: '0.8rem',
  fontWeight: 600,
  borderRadius: '4px',
  border: '1px solid rgba(139, 126, 116, 0.2)',
  transition: 'background-color 0.15s ease, border-color 0.15s ease',
};

const modeBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.4rem 0.65rem',
  color: '#FAF9F6',
  fontSize: '0.8rem',
  fontWeight: 700,
};

const spatialTagStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  backgroundColor: 'rgba(212, 175, 55, 0.15)',
  color: '#D4AF37',
  padding: '1px 5px',
  borderRadius: '3px',
  fontWeight: 700,
  letterSpacing: '0.05em',
};

const turnBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.35rem 0.65rem',
  backgroundColor: 'rgba(0, 0, 0, 0.35)',
  borderRadius: '4px',
  border: '1px solid rgba(139, 126, 116, 0.2)',
};

const clockBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.35rem 0.65rem',
  backgroundColor: 'rgba(0, 0, 0, 0.35)',
  borderRadius: '4px',
  border: '1px solid rgba(139, 126, 116, 0.2)',
};

const finishBtnStyle: React.CSSProperties = {
  padding: '0.4rem 0.8rem',
  backgroundColor: '#4C5C4C',
  color: '#FAF9F6',
  fontSize: '0.8rem',
  fontWeight: 600,
  borderRadius: '4px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  transition: 'background-color 0.15s ease',
};

const statusBadgeStyle: React.CSSProperties = {
  padding: '0.35rem 0.65rem',
  backgroundColor: 'rgba(76, 92, 76, 0.25)',
  border: '1px solid rgba(212, 175, 55, 0.4)',
  color: '#D4AF37',
  fontSize: '0.75rem',
  fontWeight: 600,
  borderRadius: '4px',
};

const modalBackdropStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundColor: 'rgba(10, 11, 13, 0.75)',
  backdropFilter: 'blur(8px)',
  zIndex: 1100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalDialogStyle: React.CSSProperties = {
  backgroundColor: '#24272A',
  border: '1px solid rgba(139, 126, 116, 0.3)',
  borderRadius: '6px',
  padding: '1.75rem',
  width: '360px',
  maxWidth: '90vw',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  textAlign: 'center',
};

const modalHeadingStyle: React.CSSProperties = {
  margin: 0,
  color: '#FAF9F6',
  fontSize: '1.15rem',
  fontWeight: 700,
};

const modalSubtextStyle: React.CSSProperties = {
  margin: 0,
  color: '#8B7E74',
  fontSize: '0.85rem',
  lineHeight: 1.4,
};

const modalButtonGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
};

const whiteWinBtnStyle: React.CSSProperties = {
  backgroundColor: '#4C5C4C',
  color: '#FAF9F6',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '0.65rem 1rem',
  borderRadius: '4px',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const blackWinBtnStyle: React.CSSProperties = {
  backgroundColor: '#AA4A44',
  color: '#FAF9F6',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '0.65rem 1rem',
  borderRadius: '4px',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const drawBtnStyle: React.CSSProperties = {
  backgroundColor: '#1C1E20',
  color: '#FAF9F6',
  border: '1px solid rgba(139, 126, 116, 0.3)',
  padding: '0.65rem 1rem',
  borderRadius: '4px',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const cancelBtnStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#8B7E74',
  border: 'none',
  padding: '0.4rem',
  fontSize: '0.85rem',
  cursor: 'pointer',
};

const canvasContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
};

export default WormholePage;
