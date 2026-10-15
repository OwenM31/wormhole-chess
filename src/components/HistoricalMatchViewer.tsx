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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📜</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Match Replay</h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {match.variant}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    match.result === '1-0'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : match.result === '0-1'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {match.result || 'Finished'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                White: <span className="text-slate-200 font-medium">{match.whiteUsername || 'Player 1'}</span> vs Black:{' '}
                <span className="text-slate-200 font-medium">{match.blackUsername || 'Player 2 / AI'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-lg"
            title="Close Replay"
          >
            ✕
          </button>
        </div>

        {/* Content Body: Board + Sidebar */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row gap-6 p-6">
          {/* Left Column: Board & Controls */}
          <div className="flex-1 flex flex-col items-center gap-4">
            {/* Tactical Card Annotation Banner */}
            {currentCard && cardTheme && (
              <div
                className="w-full max-w-[480px] p-3 rounded-xl border flex items-center justify-between gap-3 shadow-lg transition-all"
                style={{
                  backgroundColor: `${cardTheme.hex}15`,
                  borderColor: cardTheme.hex,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{cardTheme.badgeIcon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        {currentCard.name}
                      </span>
                      <span
                        className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase"
                        style={{
                          backgroundColor: `${cardTheme.hex}30`,
                          color: cardTheme.hex,
                        }}
                      >
                        ⚡ {currentCard.energyCost} Energy
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{currentCard.description}</p>
                  </div>
                </div>
                {currentMove?.cardAction?.anchorSquare && (
                  <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
                    Anchor: {currentMove.cardAction.anchorSquare}
                    {currentMove.cardAction.targetSquare ? ` ➔ ${currentMove.cardAction.targetSquare}` : ''}
                  </span>
                )}
              </div>
            )}

            {/* Chess Board */}
            <div className="w-full max-w-[480px] aspect-square flex items-center justify-center">
              <DeckChessBoard
                fen={currentFen}
                orientation="w"
                selectedSquare={currentMove?.chessMove?.from}
                legalMoves={currentMove?.chessMove?.to ? [currentMove.chessMove.to] : []}
                validAnchorSquares={currentMove?.cardAction?.anchorSquare ? [currentMove.cardAction.anchorSquare] : []}
                validTargetSquares={currentMove?.cardAction?.targetSquare ? [currentMove.cardAction.targetSquare] : []}
                onSquareClick={() => {}}
              />
            </div>

            {/* Replay Controls Toolbar */}
            <div className="w-full max-w-[480px] bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400">
                {currentIndex === -1 ? 'Start' : `Turn ${currentIndex + 1} of ${moves.length}`}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStep(-1)}
                  disabled={currentIndex === -1}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  title="Jump to Start"
                >
                  |◀
                </button>
                <button
                  onClick={() => handleStep(currentIndex - 1)}
                  disabled={currentIndex === -1}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  title="Step Backward"
                >
                  ◀
                </button>
                <button
                  onClick={handleTogglePlay}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  title={isPlaying ? 'Pause' : 'Auto Play'}
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
                <button
                  onClick={() => handleStep(currentIndex + 1)}
                  disabled={currentIndex >= moves.length - 1}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  title="Step Forward"
                >
                  ▶
                </button>
                <button
                  onClick={() => handleStep(moves.length - 1)}
                  disabled={currentIndex >= moves.length - 1}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  title="Jump to End"
                >
                  ▶|
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Move List Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Match Move History ({moves.length} Turns)
            </h4>

            {moves.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs italic">
                No recorded turns available for this session.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[440px] flex flex-col gap-1.5 pr-1">
                {/* Initial Position Row */}
                <button
                  onClick={() => handleStep(-1)}
                  className={`px-3 py-2 rounded-lg text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                    currentIndex === -1
                      ? 'bg-sky-950/70 border border-sky-500/50 text-sky-200'
                      : 'hover:bg-slate-800/60 text-slate-400'
                  }`}
                >
                  <span>Starting Setup</span>
                  <span className="font-mono text-[10px] text-slate-500">Init</span>
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
                      className={`p-2.5 rounded-lg text-left text-xs transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-slate-800 border-sky-500/80 text-white shadow-md'
                          : 'bg-slate-900/50 border-slate-800/70 hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-slate-400">
                          #{turn.turnNumber || idx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            turn.player === 'w'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                              : 'bg-purple-950/80 text-purple-300 border border-purple-800/40'
                          }`}
                        >
                          {turn.player === 'w' ? 'White' : 'Black'}
                        </span>
                      </div>

                      {card && (
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-emerald-400">
                          <span>{card.visualTheme.badgeIcon}</span>
                          <span>[{card.name}]</span>
                        </div>
                      )}

                      <div className="font-mono font-semibold text-sky-300 flex items-center justify-between">
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

export default HistoricalMatchViewer;
