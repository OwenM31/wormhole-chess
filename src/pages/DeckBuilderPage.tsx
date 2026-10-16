import React, { useState, useRef, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { DeckChessBoard } from '../components/DeckChessBoard';
import { TacticalHandBar } from '../components/TacticalHandBar';
import { DeckBuilderView } from '../components/DeckBuilderView';
import { useDeckChessGame } from '../hooks/useDeckChessGame';
import { useAuth } from '../context/AuthContext';
import { PieceColor } from '../types/deckChess';
import { STARTER_DECK } from '../engine/cardGraph';

export const DeckBuilderPage: React.FC = () => {
  const { user } = useAuth();

  // Active top-level view: 'arena' (play chess) vs 'forge' (deck loadout curator)
  const [activeTab, setActiveTab] = useState<'arena' | 'forge'>('arena');

  // Right Panel tab state: 'moves' vs 'chat'
  const [rightTab, setRightTab] = useState<'moves' | 'chat'>('moves');

  // Match setup state
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'tactical'>('medium');

  // Auto-scroll ref for move history
  const moveLogEndRef = useRef<HTMLDivElement | null>(null);

  // Chat message state
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; sender: string; text: string; time: string; isSystem?: boolean }>
  >([
    { id: '1', sender: 'System', text: 'Tactical Room initialized. 8-card loadout active.', time: '00:00', isSystem: true },
    { id: '2', sender: 'Tactical AI', text: 'Good luck. Make your move or play a card.', time: '00:01' },
  ]);
  const [chatInput, setChatInput] = useState<string>('');

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    const newMsg = {
      id: String(Date.now()),
      sender: user?.username || 'Player',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

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

  const handleStartNewMatch = (color: PieceColor, diff: 'easy' | 'medium' | 'tactical') => {
    setPlayerColor(color);
    setAiDifficulty(diff);
    game.resetGame(
      color === 'w' ? customDeck : undefined,
      color === 'b' ? customDeck : undefined
    );
  };

  const myHand = playerColor === 'w' ? game.whiteHand : game.blackHand;
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

      {/* PAGE CONTENT */}
      <main className="flex-1 p-2 sm:p-4 lg:p-6 flex flex-col items-center justify-center">
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
          <div className="w-full max-w-[1240px] flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-5">
            {/* 1. LEFT COLUMN (356px): TCG Ruffle Hand Stage */}
            <div className="w-full max-w-[512px] lg:w-[356px] lg:h-[596px] order-2 lg:order-1 flex flex-col">
              <TacticalHandBar
                hand={myHand}
                initialDeck={customDeck}
                energy={game.energy}
                hasPlayedCardThisTurn={game.hasPlayedCardThisTurn}
                isMyTurn={isMyTurn}
                selectedCard={game.selectedCard}
                targetingStage={game.targetingStage}
                activeCardIdsForPiece={game.empoweredMoves?.map((m) => m.cardId)}
                onSelectCard={game.selectCard}
                onCancelTargeting={game.cancelCardSelection}
              />
            </div>

            {/* 2. CENTER COLUMN (512px): Full 512x512 Chessboard */}
            <div className="w-full max-w-[512px] lg:h-[596px] flex flex-col justify-between order-1 lg:order-2 gap-2">
              {/* Opponent Status Bar (36px) */}
              <div
                className={`w-full h-[36px] px-3 rounded-md flex items-center justify-between text-xs border transition-all duration-300 ${
                  !isMyTurn
                    ? 'bg-[#24272A] border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.2)] text-[#FAF9F6]'
                    : 'bg-[#191B1D] border-[rgba(139,126,116,0.2)] text-[#8B7E74]'
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

              {/* Full 512x512 Square Chessboard */}
              <div className="relative w-full max-w-[512px] aspect-square">
                <DeckChessBoard
                  fen={game.fen}
                  orientation={playerColor}
                  selectedSquare={game.selectedSquare}
                  legalMoves={game.legalMovesForSelected}
                  empoweredMoves={game.empoweredMoves}
                  validAnchorSquares={game.validAnchorSquares}
                  validTargetSquares={game.validTargetSquares}
                  activeModifiers={game.activeModifiers}
                  inCheck={game.inCheck}
                  onSquareClick={game.handleSquareClick}
                />

                {/* Game Over Modal Overlay */}
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

              {/* Player Status Bar (36px) */}
              <div
                className={`w-full h-[36px] px-3 rounded-md flex items-center justify-between text-xs border transition-all duration-300 ${
                  isMyTurn
                    ? 'bg-[#24272A] border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.2)] text-[#FAF9F6]'
                    : 'bg-[#191B1D] border-[rgba(139,126,116,0.2)] text-[#8B7E74]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-sm">👤</span>
                  <span className="font-medium truncate">
                    {user?.username || 'Player'}
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
            </div>

            {/* 3. RIGHT COLUMN (280px): Moves | Chat Tabs & Compact Footer */}
            <div className="w-full max-w-[512px] lg:w-[280px] lg:h-[596px] order-3 bg-[#1C1E20] border border-[rgba(139,126,116,0.2)] rounded-md p-3 flex flex-col justify-between shadow-lg">
              <div className="flex flex-col flex-1 min-h-0">
                {/* Header with Segmented Tabs: Moves | Chat + Turn Counter */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[rgba(139,126,116,0.16)]">
                  <div className="flex items-center bg-[#24272A] border border-[rgba(139,126,116,0.2)] rounded p-0.5 gap-0.5">
                    <button
                      onClick={() => setRightTab('moves')}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        rightTab === 'moves'
                          ? 'bg-[#1C1E20] text-[#FAF9F6] border border-[#D4AF37]/50 shadow-sm'
                          : 'text-[#8B7E74] hover:text-[#FAF9F6]'
                      }`}
                    >
                      Moves
                    </button>
                    <button
                      onClick={() => setRightTab('chat')}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        rightTab === 'chat'
                          ? 'bg-[#1C1E20] text-[#FAF9F6] border border-[#D4AF37]/50 shadow-sm'
                          : 'text-[#8B7E74] hover:text-[#FAF9F6]'
                      }`}
                    >
                      Chat
                    </button>
                  </div>

                  <span className="text-xs font-mono font-semibold text-[#D4AF37]">
                    Turn {game.turnNumber}
                  </span>
                </div>

                {/* Tab Body: Moves Log */}
                {rightTab === 'moves' ? (
                  <div className="flex flex-col flex-1 min-h-0">
                    {/* Difficulty Selector */}
                    <div className="flex items-center justify-between py-2 border-b border-[rgba(139,126,116,0.12)] text-[11px] font-mono text-[#8B7E74]">
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

                    {/* Scrollable Combat Log */}
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
                                  ? 'bg-[#191B1D] text-[#FAF9F6] border border-transparent'
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
                ) : (
                  /* Tab Body: Live Tactical Chat */
                  <div className="flex flex-col flex-1 min-h-0 justify-between">
                    <div className="flex-1 overflow-y-auto py-2 pr-1 space-y-2 text-xs">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-1.5 rounded text-[11px] leading-relaxed ${
                            msg.isSystem
                              ? 'bg-[#191B1D] text-[#8B7E74] border border-[rgba(139,126,116,0.15)] italic'
                              : msg.sender === (user?.username || 'Player')
                              ? 'bg-[#24272A] border border-[#D4AF37]/35 text-[#FAF9F6]'
                              : 'bg-[#191B1D] border border-[rgba(139,126,116,0.2)] text-[#FAF9F6]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] font-mono text-[#8B7E74] mb-0.5">
                            <span className="font-bold text-[#D4AF37]">{msg.sender}</span>
                            <span>{msg.time}</span>
                          </div>
                          <div>{msg.text}</div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendChat} className="flex gap-1 pt-2 border-t border-[rgba(139,126,116,0.16)]">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Send message..."
                        className="flex-1 px-2 py-1 bg-[#191B1D] border border-[rgba(139,126,116,0.25)] rounded text-xs text-[#FAF9F6] outline-none placeholder-[#8B7E74]"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-[#4C5C4C] hover:bg-[#5C6C5C] text-[#FAF9F6] rounded text-xs font-medium cursor-pointer"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* ACTION FOOTER: Resign · New Game · My Deck */}
              <div className="pt-2.5 border-t border-[rgba(139,126,116,0.16)] flex items-center gap-1.5">
                <button
                  onClick={() => game.resign(playerColor)}
                  disabled={game.isGameOver}
                  className="flex-1 py-1.5 bg-[#191B1D] hover:bg-[#AA4A44]/20 text-[#AA4A44] border border-[#AA4A44]/40 rounded text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                >
                  Resign
                </button>
                <button
                  onClick={() => handleStartNewMatch(playerColor, aiDifficulty)}
                  className="flex-1 py-1.5 bg-[#24272A] hover:bg-[#282B2E] text-[#FAF9F6] border border-[rgba(139,126,116,0.25)] rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  New Game
                </button>
                <button
                  onClick={() => setActiveTab('forge')}
                  className="flex-1 py-1.5 bg-[#24272A] hover:bg-[#282B2E] text-[#D4AF37] border border-[#D4AF37]/40 rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  My Deck
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DeckBuilderPage;
