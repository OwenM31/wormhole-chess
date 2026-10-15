import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { DeckChessBoard } from '../components/DeckChessBoard';
import { TacticalHandBar } from '../components/TacticalHandBar';
import { DeckBuilderView } from '../components/DeckBuilderView';
import { useDeckChessGame } from '../hooks/useDeckChessGame';
import { useAuth } from '../context/AuthContext';
import { PieceColor } from '../types/deckChess';
import { STARTER_DECK } from '../engine/cardGraph';

export const DeckBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Active top-level view: 'arena' (play chess) vs 'forge' (deck loadout curator)
  const [activeTab, setActiveTab] = useState<'arena' | 'forge'>('arena');

  // Collapsible Left Navigation Rail state
  const [isRailCollapsed, setIsRailCollapsed] = useState<boolean>(false);

  // Match setup state
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'tactical'>('medium');

  // Auto-scroll ref for move history
  const moveLogEndRef = useRef<HTMLDivElement | null>(null);

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
        // Fallback to starter deck
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

  // Scroll to latest move when log updates
  useEffect(() => {
    moveLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [game.combatLog]);

  // Handle Online Matchmaking Launch
  const handleLaunchOnlineRoom = () => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/play/${randomCode}?variant=deck_builder&timeControl=5m`);
  };

  const handleStartNewMatch = (color: PieceColor, diff: 'easy' | 'medium' | 'tactical') => {
    setPlayerColor(color);
    setAiDifficulty(diff);
    game.resetGame(
      color === 'w' ? customDeck : undefined,
      color === 'b' ? customDeck : undefined
    );
  };

  const myHand = playerColor === 'w' ? game.whiteHand : game.blackHand;
  const oppHand = playerColor === 'w' ? game.blackHand : game.whiteHand;
  const isMyTurn = game.turn === playerColor;

  // Helper to render authentic piece graveyard glyphs
  const renderGraveyardGlyphs = (gy: { p: number; n: number; b: number; r: number; q: number }) => {
    const glyphs: string[] = [];
    for (let i = 0; i < gy.q; i++) glyphs.push('♛');
    for (let i = 0; i < gy.r; i++) glyphs.push('♜');
    for (let i = 0; i < gy.b; i++) glyphs.push('♝');
    for (let i = 0; i < gy.n; i++) glyphs.push('♞');
    for (let i = 0; i < gy.p; i++) glyphs.push('♟');
    return glyphs.length > 0 ? glyphs.join(' ') : '—';
  };

  // Material advantage calculation
  const playerCaptured = playerColor === 'w' ? game.graveyard.b : game.graveyard.w;
  const opponentCaptured = playerColor === 'w' ? game.graveyard.w : game.graveyard.b;

  const playerMaterialScore =
    playerCaptured.p * 1 +
    playerCaptured.n * 3 +
    playerCaptured.b * 3 +
    playerCaptured.r * 5 +
    playerCaptured.q * 9;

  const opponentMaterialScore =
    opponentCaptured.p * 1 +
    opponentCaptured.n * 3 +
    opponentCaptured.b * 3 +
    opponentCaptured.r * 5 +
    opponentCaptured.q * 9;

  const materialAdvantage = playerMaterialScore - opponentMaterialScore;

  return (
    <div className="min-h-screen bg-[#191B1D] text-[#FAF9F6] flex flex-col font-sans select-none overflow-x-hidden">
      <Navigation />

      {/* SUB-HEADER / VIEW TABS */}
      <header className="bg-[#141618] border-b border-[rgba(139,126,116,0.2)] px-4 py-2 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold tracking-wide text-[#FAF9F6]">
              Deck Builder Chess
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('arena')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'arena'
                  ? 'bg-[#24272A] text-[#FAF9F6] border border-[#D4AF37]/60 shadow-sm'
                  : 'text-[#8B7E74] hover:text-[#FAF9F6] border border-transparent'
              }`}
            >
              Find Match
            </button>
            <button
              onClick={() => setActiveTab('forge')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'forge'
                  ? 'bg-[#24272A] text-[#FAF9F6] border border-[#D4AF37]/60 shadow-sm'
                  : 'text-[#8B7E74] hover:text-[#FAF9F6] border border-transparent'
              }`}
            >
              My Deck
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER WITH LEFT RAIL + ARENA */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* COLLAPSIBLE LEFT NAVIGATION RAIL (DESKTOP) */}
        {activeTab === 'arena' && (
          <aside
            className={`hidden md:flex flex-col items-center justify-between py-3 border-r border-[rgba(139,126,116,0.2)] bg-[#141618] transition-all duration-200 ${
              isRailCollapsed ? 'w-10' : 'w-[58px]'
            }`}
          >
            <div className="flex flex-col items-center gap-4 w-full">
              <Link
                to="/"
                title="Home"
                className="w-10 h-10 rounded-md flex items-center justify-center text-[#8B7E74] hover:text-[#FAF9F6] hover:bg-[#24272A] transition-colors"
              >
                <span className="text-base">🏠</span>
              </Link>
              <Link
                to="/wormhole"
                title="3D Wormhole Chess"
                className="w-10 h-10 rounded-md flex items-center justify-center text-[#8B7E74] hover:text-[#FAF9F6] hover:bg-[#24272A] transition-colors"
              >
                <span className="text-base">🌀</span>
              </Link>
              <div
                title="Deck Builder Chess"
                className="w-10 h-10 rounded-md flex items-center justify-center text-[#FAF9F6] bg-[#24272A] border-l-2 border-[#D4AF37] shadow-inner"
              >
                <span className="text-base">🃏</span>
              </div>
              <Link
                to="/dashboard"
                title="Player Profile"
                className="w-10 h-10 rounded-md flex items-center justify-center text-[#8B7E74] hover:text-[#FAF9F6] hover:bg-[#24272A] transition-colors"
              >
                <span className="text-base">📊</span>
              </Link>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setIsRailCollapsed(!isRailCollapsed)}
                title={isRailCollapsed ? 'Expand Navigation Rail' : 'Collapse Navigation Rail'}
                className="w-8 h-8 rounded flex items-center justify-center text-[10px] text-[#8B7E74] hover:text-[#FAF9F6] hover:bg-[#24272A] transition-colors cursor-pointer"
              >
                {isRailCollapsed ? '▶' : '◀'}
              </button>
            </div>
          </aside>
        )}

        {/* PAGE CONTENT */}
        <main className="flex-1 p-2 sm:p-4 flex flex-col items-center justify-start">
          {activeTab === 'forge' ? (
            <div className="w-full max-w-5xl">
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
            </div>
          ) : (
            <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4">
              {/* CENTER ARENA STAGE (470px) */}
              <div className="w-full max-w-[470px] flex flex-col items-center gap-1.5">
                {/* OPPONENT STATUS BAR (CHESS.COM ILLUMINATION) */}
                <div
                  className={`w-full h-[36px] px-3 rounded-md flex items-center justify-between text-xs border transition-all duration-300 ${
                    !isMyTurn
                      ? 'bg-[#24272A] border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.2)] text-[#FAF9F6]'
                      : 'bg-[#191B1D] border-[rgba(139,126,116,0.18)] text-[#8B7E74]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm">🤖</span>
                    <span className="font-medium truncate">
                      Tactical AI ({aiDifficulty.toUpperCase()})
                    </span>
                    {game.isAiThinking && (
                      <span className="text-[10px] text-[#D4AF37] font-mono animate-pulse">
                        thinking...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm tracking-widest select-none opacity-85">
                      {renderGraveyardGlyphs(opponentCaptured)}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#8B7E74]">
                      10:00
                    </span>
                  </div>
                </div>

                {/* 2D CHESSBOARD (470px) */}
                <div className="relative w-full max-w-[470px]">
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
                    <div className="absolute inset-0 bg-[#141618]/90 backdrop-blur-md rounded-md flex flex-col items-center justify-center p-6 text-center z-30 border border-[#D4AF37]/50 shadow-2xl">
                      <span className="text-4xl mb-2">
                        {game.winner === 'draw'
                          ? '🤝'
                          : game.winner === playerColor
                          ? '🏆'
                          : '💀'}
                      </span>
                      <h2
                        className={`text-xl font-bold tracking-tight ${
                          game.winner === 'draw'
                            ? 'text-[#8B7E74]'
                            : game.winner === playerColor
                            ? 'text-[#D4AF37]'
                            : 'text-[#AA4A44]'
                        }`}
                      >
                        {game.winner === 'draw'
                          ? 'Draw'
                          : game.winner === playerColor
                          ? 'Victory'
                          : 'Defeat'}
                      </h2>
                      <p className="text-xs text-[#8B7E74] font-mono mt-1">
                        Match concluded by {game.finishReason || 'checkmate'}
                      </p>
                      <div className="flex items-center gap-3 mt-4">
                        <button
                          onClick={() => game.resetGame()}
                          className="px-4 py-1.5 bg-[#4C5C4C] hover:bg-[#5C6C5C] text-[#FAF9F6] rounded text-xs font-semibold shadow transition-colors cursor-pointer"
                        >
                          Rematch
                        </button>
                        <button
                          onClick={() => setActiveTab('forge')}
                          className="px-3 py-1.5 bg-[#24272A] hover:bg-[#282B2E] text-[#8B7E74] hover:text-[#FAF9F6] border border-[rgba(139,126,116,0.3)] rounded text-xs font-medium transition-colors cursor-pointer"
                        >
                          My Deck
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* PLAYER STATUS BAR (CHESS.COM ILLUMINATION) */}
                <div
                  className={`w-full h-[36px] px-3 rounded-md flex items-center justify-between text-xs border transition-all duration-300 ${
                    isMyTurn
                      ? 'bg-[#24272A] border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.2)] text-[#FAF9F6]'
                      : 'bg-[#191B1D] border-[rgba(139,126,116,0.18)] text-[#8B7E74]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm">👤</span>
                    <span className="font-medium truncate">
                      {user?.username || 'GrandmasterX'}
                    </span>
                    <span className="text-[10px] text-[#8B7E74] font-mono">
                      ({playerColor === 'w' ? 'White' : 'Black'})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 font-mono text-sm tracking-widest select-none opacity-85">
                      <span>{renderGraveyardGlyphs(playerCaptured)}</span>
                      {materialAdvantage > 0 && (
                        <span className="text-[10px] text-[#D4AF37] font-bold">
                          +{materialAdvantage}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[#8B7E74]">
                      09:42
                    </span>
                  </div>
                </div>

                {/* TACTICAL HAND BAR (FLUSH 470px) */}
                <div className="w-full max-w-[470px]">
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

              {/* RIGHT MOVE HISTORY & ACTIONS (TABULAR NOTATION) */}
              <div className="w-full lg:w-[280px] h-[585px] bg-[#191B1D] border border-[rgba(139,126,116,0.25)] rounded-md p-3 flex flex-col justify-between shadow-lg">
                <div className="flex flex-col flex-1 min-h-0">
                  {/* HEADER */}
                  <div className="flex items-center justify-between pb-2 border-b border-[rgba(139,126,116,0.2)]">
                    <span className="text-xs uppercase font-bold text-[#8B7E74] tracking-wider">
                      Move History
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#D4AF37]">
                      Turn {game.turnNumber}
                    </span>
                  </div>

                  {/* DIFFICULTY SELECTOR */}
                  <div className="flex items-center justify-between py-2 border-b border-[rgba(139,126,116,0.15)] text-[11px] font-mono text-[#8B7E74]">
                    <span>AI DIFFICULTY</span>
                    <div className="flex gap-1">
                      {(['easy', 'medium', 'tactical'] as const).map((diff) => (
                        <button
                          key={diff}
                          onClick={() => handleStartNewMatch(playerColor, diff)}
                          className={`px-1.5 py-0.5 rounded text-[10px] capitalize transition-colors cursor-pointer ${
                            aiDifficulty === diff
                              ? 'bg-[#D4AF37] text-[#191B1D] font-bold'
                              : 'bg-[#24272A] text-[#8B7E74] hover:text-[#FAF9F6]'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TABULAR MOVE LIST */}
                  <div className="flex-1 overflow-y-auto py-2 pr-1 space-y-1 font-mono text-xs">
                    {game.combatLog.length === 0 ? (
                      <div className="text-[11px] text-[#8B7E74] italic text-center py-6">
                        No moves recorded yet. Play a card or move a piece.
                      </div>
                    ) : (
                      game.combatLog.map((log) => {
                        const isCard = log.type === 'card';
                        const isMove = log.type === 'move';

                        return (
                          <div
                            key={log.id}
                            className={`px-2 py-1 rounded text-[11px] leading-tight transition-colors ${
                              isCard
                                ? 'bg-[#24272A] border border-[#D4AF37]/40 text-[#FAF9F6]'
                                : isMove
                                ? 'bg-[#1C1E20] text-[#FAF9F6] border border-transparent'
                                : 'text-[#8B7E74] italic'
                            }`}
                          >
                            {isCard && <span className="font-bold mr-1 text-[#D4AF37]">✦</span>}
                            {log.text}
                          </div>
                        );
                      })
                    )}
                    <div ref={moveLogEndRef} />
                  </div>
                </div>

                {/* ACTION FOOTER */}
                <div className="pt-2 border-t border-[rgba(139,126,116,0.2)] flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => game.resign(playerColor)}
                      disabled={game.isGameOver}
                      className="flex-1 py-1.5 bg-[#191B1D] hover:bg-[#AA4A44]/20 text-[#AA4A44] border border-[#AA4A44]/50 rounded text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      Resign
                    </button>
                    <button
                      onClick={() => handleStartNewMatch(playerColor, aiDifficulty)}
                      className="flex-1 py-1.5 bg-[#24272A] hover:bg-[#282B2E] text-[#FAF9F6] border border-[rgba(139,126,116,0.25)] rounded text-xs font-semibold transition-colors cursor-pointer"
                    >
                      New Game
                    </button>
                  </div>

                  <button
                    onClick={handleLaunchOnlineRoom}
                    className="w-full py-2 bg-[#4C5C4C] hover:bg-[#5C6C5C] text-[#FAF9F6] rounded text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>Find Match</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DeckBuilderPage;
