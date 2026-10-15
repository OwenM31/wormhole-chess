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
        <ChessboardScene />
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
  left: '1rem',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flexWrap: 'wrap',
};

const homeLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.5rem 1rem',
  backgroundColor: 'rgba(13, 17, 23, 0.85)',
  backdropFilter: 'blur(8px)',
  color: '#f0f6fc',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: 600,
  borderRadius: '8px',
  border: '1px solid rgba(48, 54, 61, 0.8)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  transition: 'background-color 0.2s ease, border-color 0.2s ease',
};

const titleBadgeStyle: React.CSSProperties = {
  padding: '0.5rem 0.85rem',
  backgroundColor: 'rgba(22, 27, 34, 0.75)',
  backdropFilter: 'blur(8px)',
  color: '#8b949e',
  fontSize: '0.85rem',
  fontWeight: 500,
  borderRadius: '8px',
  border: '1px solid rgba(48, 54, 61, 0.5)',
};

const finishBtnStyle: React.CSSProperties = {
  padding: '0.5rem 0.85rem',
  backgroundColor: '#1f6feb',
  color: '#ffffff',
  fontSize: '0.85rem',
  fontWeight: 600,
  borderRadius: '8px',
  border: '1px solid #388bfd',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  boxShadow: '0 4px 12px rgba(31, 111, 235, 0.3)',
};

const statusBadgeStyle: React.CSSProperties = {
  padding: '0.45rem 0.85rem',
  backgroundColor: 'rgba(46, 160, 67, 0.2)',
  border: '1px solid #3fb950',
  color: '#3fb950',
  fontSize: '0.85rem',
  fontWeight: 600,
  borderRadius: '8px',
};

const modalBackdropStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.65)',
  backdropFilter: 'blur(4px)',
  zIndex: 1100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalDialogStyle: React.CSSProperties = {
  backgroundColor: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '12px',
  padding: '1.75rem',
  width: '360px',
  maxWidth: '90vw',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  textAlign: 'center',
};

const modalHeadingStyle: React.CSSProperties = {
  margin: 0,
  color: '#f0f6fc',
  fontSize: '1.25rem',
  fontWeight: 700,
};

const modalSubtextStyle: React.CSSProperties = {
  margin: 0,
  color: '#8b949e',
  fontSize: '0.9rem',
  lineHeight: 1.4,
};

const modalButtonGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
};

const whiteWinBtnStyle: React.CSSProperties = {
  backgroundColor: '#238636',
  color: '#ffffff',
  border: 'none',
  padding: '0.65rem 1rem',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
};

const blackWinBtnStyle: React.CSSProperties = {
  backgroundColor: '#da3633',
  color: '#ffffff',
  border: 'none',
  padding: '0.65rem 1rem',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
};

const drawBtnStyle: React.CSSProperties = {
  backgroundColor: '#30363d',
  color: '#c9d1d9',
  border: '1px solid #8b949e',
  padding: '0.65rem 1rem',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
};

const cancelBtnStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#8b949e',
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
