import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { DeckChessBoard } from '../components/DeckChessBoard';
import { TacticalHandBar } from '../components/TacticalHandBar';
import { DeckBuilderView } from '../components/DeckBuilderView';
import { useDeckChessGame } from '../hooks/useDeckChessGame';
import { PieceColor } from '../types/deckChess';
import { STARTER_DECK } from '../engine/cardGraph';

export const DeckBuilderPage: React.FC = () => {
  const navigate = useNavigate();

  // Active top-level view: 'arena' (play chess) vs 'forge' (deck customizer)
  const [activeTab, setActiveTab] = useState<'arena' | 'forge'>('arena');

  // Match setup state
  const [hasStartedMatch, setHasStartedMatch] = useState<boolean>(true);
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'tactical'>('medium');

  // Custom 8-card battle deck
  const [customDeck, setCustomDeck] = useState<string[]>(() => {
    const saved = localStorage.getItem('deck_builder_loadout_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 8) {
          return parsed;
        }
      } catch (e) {
        // Fallback
      }
    }
    return STARTER_DECK.map((c) => c.id);
  });

  // Hook connecting the game engine, tactical cards, and AI bot
  const game = useDeckChessGame({
    mode: 'ai',
    playerColor,
    aiDifficulty,
    whiteDeck: playerColor === 'w' ? customDeck : undefined,
    blackDeck: playerColor === 'b' ? customDeck : undefined,
  });

  // Handle Online Matchmaking Launch (redirect to live room with deck_builder variant)
  const handleLaunchOnlineRoom = () => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/play/${randomCode}?variant=deck_builder&timeControl=5m`);
  };

  const handleStartNewMatch = (color: PieceColor, diff: 'easy' | 'medium' | 'tactical') => {
    setPlayerColor(color);
    setAiDifficulty(diff);
    setHasStartedMatch(true);
    game.resetGame(
      color === 'w' ? customDeck : undefined,
      color === 'b' ? customDeck : undefined
    );
  };

  const myHand = playerColor === 'w' ? game.whiteHand : game.blackHand;
  const oppHand = playerColor === 'w' ? game.blackHand : game.whiteHand;
  const isMyTurn = game.turn === playerColor;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans select-none">
      <Navigation />

      {/* SUB-HEADER / VIEW TABS */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2.5 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🃏</span>
            <div>
              <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Deck Builder Chess
                <span className="text-[10px] font-mono uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                  2D Phase 4
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('arena')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'arena'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚔️ Battle Arena
            </button>
            <button
              onClick={() => setActiveTab('forge')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'forge'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              🔨 Deck Forge (8 Cards)
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-6">
        {activeTab === 'forge' ? (
          <DeckBuilderView
            initialDeck={customDeck}
            onSaveDeck={(saved) => {
              setCustomDeck(saved);
              game.resetGame(
                playerColor === 'w' ? saved : undefined,
                playerColor === 'b' ? saved : undefined
              );
              setActiveTab('arena');
            }}
            onBackToBattle={() => setActiveTab('arena')}
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
            {/* LEFT / CENTER: BOARD & TACTICAL HAND */}
            <div className="flex-1 w-full flex flex-col items-center gap-4">
              {/* Opponent Status Bar */}
              <div className="w-full max-w-[520px] bg-slate-900/80 border border-slate-800/80 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-900/60 border border-purple-500/50 flex items-center justify-center text-sm shadow">
                    🤖
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">
                        Tactical Bot ({aiDifficulty.toUpperCase()})
                      </span>
                      {game.isAiThinking && (
                        <span className="text-[10px] text-sky-400 font-mono animate-pulse">
                          Thinking...
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Cards: {oppHand.length} in hand
                    </div>
                  </div>
                </div>

                {/* Opponent Captures */}
                <div className="flex items-center gap-1 text-xs">
                  {playerColor === 'w' ? (
                    <span className="text-slate-400 font-mono text-[11px]">
                      Graveyard: {game.graveyard.b.p + game.graveyard.b.n + game.graveyard.b.b + game.graveyard.b.r + game.graveyard.b.q} fallen
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono text-[11px]">
                      Graveyard: {game.graveyard.w.p + game.graveyard.w.n + game.graveyard.w.b + game.graveyard.w.r + game.graveyard.w.q} fallen
                    </span>
                  )}
                </div>
              </div>

              {/* 2D Chessboard */}
              <div className="relative">
                <DeckChessBoard
                  fen={game.fen}
                  orientation={playerColor}
                  selectedSquare={game.selectedSquare}
                  legalMoves={game.legalMovesForSelected}
                  validAnchorSquares={game.validAnchorSquares}
                  validTargetSquares={game.validTargetSquares}
                  activeModifiers={game.activeModifiers}
                  inCheck={game.inCheck}
                  onSquareClick={game.handleSquareClick}
                />

                {/* GAME OVER MODAL OVERLAY */}
                {game.isGameOver && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center z-30 border border-slate-700 animate-fadeIn">
                    <span className="text-5xl mb-2">
                      {game.winner === 'draw'
                        ? '🤝'
                        : game.winner === playerColor
                        ? '🏆'
                        : '💀'}
                    </span>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                      {game.winner === 'draw'
                        ? 'Stalemate / Draw'
                        : game.winner === playerColor
                        ? 'Victory Achieved!'
                        : 'Defeat'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-mono">
                      Match concluded by {game.finishReason || 'checkmate'}
                    </p>
                    <div className="flex items-center gap-3 mt-5">
                      <button
                        onClick={() => game.resetGame()}
                        className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-900/40 transition-all cursor-pointer"
                      >
                        Play Rematch
                      </button>
                      <button
                        onClick={() => setActiveTab('forge')}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                      >
                        Tweak Deck
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tactical Hand Bar */}
              <div className="w-full">
                <TacticalHandBar
                  hand={myHand}
                  initialDeck={customDeck}
                  energy={game.energy}
                  hasPlayedCardThisTurn={game.hasPlayedCardThisTurn}
                  isMyTurn={isMyTurn}
                  selectedCard={game.selectedCard}
                  targetingStage={game.targetingStage}
                  onSelectCard={game.selectCard}
                  onCancelTargeting={game.cancelCardSelection}
                />
              </div>
            </div>

            {/* RIGHT SIDE PANEL: COMBAT LOG & MATCH LAUNCHER */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
              {/* Quick Launchers / Match Config */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Battle Setup & Launch
                </h3>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-mono text-slate-400">
                    Bot Tactical Difficulty:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['easy', 'medium', 'tactical'] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => handleStartNewMatch(playerColor, diff)}
                        className={`py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                          aiDifficulty === diff
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-mono text-slate-400">Play As:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleStartNewMatch('w', aiDifficulty)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        playerColor === 'w'
                          ? 'bg-slate-200 text-slate-900 shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>⚪</span> White (First)
                    </button>
                    <button
                      onClick={() => handleStartNewMatch('b', aiDifficulty)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        playerColor === 'b'
                          ? 'bg-slate-800 border-2 border-sky-400 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>⚫</span> Black
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => game.resign(playerColor)}
                    disabled={game.isGameOver}
                    className="flex-1 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
                  >
                    Resign Match
                  </button>
                  <button
                    onClick={() => game.resetGame()}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-700"
                  >
                    New Game
                  </button>
                </div>

                {/* Online Matchmaking Trigger */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={handleLaunchOnlineRoom}
                    className="w-full py-2 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/40 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>🌐</span>
                    <span>Battle Online Player (Multiplayer)</span>
                  </button>
                </div>
              </div>

              {/* Combat Log */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-2 h-72">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Combat & Card Log
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Turn {game.turnNumber}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1 font-mono text-xs">
                  {game.combatLog.map((log) => {
                    const isCard = log.type === 'card';
                    const isMove = log.type === 'move';
                    const isSystem = log.type === 'system';

                    return (
                      <div
                        key={log.id}
                        className={`p-1.5 rounded-lg text-[11px] leading-tight ${
                          isCard
                            ? 'bg-purple-950/60 border border-purple-500/30 text-purple-200'
                            : isMove
                            ? 'bg-slate-800/60 text-slate-200'
                            : 'text-slate-400 italic'
                        }`}
                      >
                        {isCard && <span className="font-bold mr-1 text-amber-400">✦</span>}
                        {log.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DeckBuilderPage;
