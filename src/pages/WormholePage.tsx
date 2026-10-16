import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import ChessboardScene from '../components/ChessboardScene';
import { api } from '../services/api';
import { playVictorySound, playDefeatSound } from '../utils/soundEffects';

export const WormholePage: React.FC = () => {
  const gameStartedAtRef = useRef<number>(Date.now());
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [recordStatus, setRecordStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      {/* Floating navigation overlay */}
      <div style={overlayNavStyle}>
        <Link to="/" style={homeLinkStyle} title="Return to Home">
          ← Home
        </Link>
        <span style={titleBadgeStyle}>3D Wormhole Chess</span>

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
        <ChessboardScene hideHeaderTitle={true} />
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  backgroundColor: '#000000',
};

const overlayNavStyle: React.CSSProperties = {
  position: 'absolute',
  top: '1rem',
  left: '1.25rem',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flexWrap: 'wrap',
  pointerEvents: 'none',
};

const homeLinkStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.45rem 0.85rem',
  backgroundColor: 'rgba(28, 30, 32, 0.88)',
  backdropFilter: 'blur(12px)',
  color: '#FAF9F6',
  textDecoration: 'none',
  fontSize: '0.85rem',
  fontWeight: 600,
  borderRadius: '6px',
  border: '1px solid rgba(139, 126, 116, 0.25)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
  transition: 'background-color 0.15s ease, border-color 0.15s ease',
};

const titleBadgeStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.45rem 0.85rem',
  backgroundColor: 'rgba(28, 30, 32, 0.88)',
  backdropFilter: 'blur(12px)',
  color: '#FAF9F6',
  fontSize: '0.85rem',
  fontWeight: 700,
  borderRadius: '6px',
  border: '1px solid rgba(139, 126, 116, 0.25)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
};

const finishBtnStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  padding: '0.45rem 0.85rem',
  backgroundColor: '#4C5C4C',
  color: '#FAF9F6',
  fontSize: '0.85rem',
  fontWeight: 600,
  borderRadius: '6px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  transition: 'background-color 0.15s ease',
};

const statusBadgeStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  padding: '0.4rem 0.75rem',
  backgroundColor: 'rgba(76, 92, 76, 0.25)',
  border: '1px solid rgba(212, 175, 55, 0.4)',
  color: '#D4AF37',
  fontSize: '0.8rem',
  fontWeight: 600,
  borderRadius: '6px',
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
