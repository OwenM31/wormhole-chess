import React, { useState, useRef, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { DeckChessBoard } from '../components/DeckChessBoard';
import { TabletopArena } from '../components/TabletopArena';
import { TacticalHandBar } from '../components/TacticalHandBar';
import { DeckBuilderView } from '../components/DeckBuilderView';
import { DeckBuilderMainMenu } from '../components/DeckBuilderMainMenu';
import { MultiplayerCharacterStage, OfflineMatchConfig } from '../components/MultiplayerCharacterStage';
import { useDeckChessGame } from '../hooks/useDeckChessGame';
import { usePlayerProfiles } from '../hooks/usePlayerProfiles';
import { useAuth } from '../context/AuthContext';
import { PieceColor } from '../types/deckChess';
import { CANONICAL_36_CARDS } from '../engine/cards/releaseRoster36';

type TopScreen = 'menu' | 'multiplayer' | 'arena' | 'forge';

export const DeckBuilderPage: React.FC = () => {
  const { user } = useAuth();
  const profilesHook = usePlayerProfiles();
  const { activeProfile } = profilesHook;

  // Active top-level screen: 'menu' (default), 'multiplayer', 'arena', or 'forge'
  const [screen, setScreen] = useState<TopScreen>('menu');

  // Right Panel tab state in Arena: 'moves' vs 'chat'
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
    { id: '1', sender: 'System', text: 'Tactical Room initialized. 36-Card Playbook active.', time: '00:00', isSystem: true },
    { id: '2', sender: 'Tactical AI', text: 'Good luck. Make your move or play a card.', time: '00:01' },
  ]);
  const [chatInput, setChatInput] = useState<string>('');

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    const newMsg = {
      id: String(Date.now()),
      sender: user?.username || activeProfile.name || 'Player',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  // Hook connecting the game engine, tactical cards, and AI bot
  const game = useDeckChessGame({
    mode: 'ai',
    playerColor,
    aiDifficulty,
    whiteDeck: playerColor === 'w' ? activeProfile.equippedHand : undefined,
    blackDeck: playerColor === 'b' ? activeProfile.equippedHand : undefined,
  });

  // Scroll to latest move when log updates
  useEffect(() => {
    moveLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [game.combatLog]);

  const handleStartOfflineMatch = (config: OfflineMatchConfig) => {
    setPlayerColor(config.playerColor);
    setAiDifficulty(config.aiDifficulty);

    // AI deck generation based on mode
    let aiDeck: string[] = [];
    if (config.aiDeckMode === 'mirror') {
      aiDeck = [...activeProfile.equippedHand];
    } else if (config.aiDeckMode === 'random') {
      const allIds = CANONICAL_36_CARDS.map((c) => c.id);
      aiDeck = allIds.sort(() => Math.random() - 0.5).slice(0, config.handSize || 8);
    } else {
      // 'towny' mode: 0 cards
      aiDeck = [];
    }

    const whiteDeck = config.playerColor === 'w' ? activeProfile.equippedHand : aiDeck;
    const blackDeck = config.playerColor === 'b' ? activeProfile.equippedHand : aiDeck;

    game.resetGame(whiteDeck, blackDeck);
    setScreen('arena');
  };

  const handleStartNewMatch = (color: PieceColor, diff: 'easy' | 'medium' | 'tactical') => {
    setPlayerColor(color);
    setAiDifficulty(diff);
    game.resetGame(
      color === 'w' ? activeProfile.equippedHand : undefined,
      color === 'b' ? activeProfile.equippedHand : undefined
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

  const playerCaptured = playerColor === 'w' ? game.graveyard.b : game.graveyard.w;
  const opponentCaptured = playerColor === 'w' ? game.graveyard.w : game.graveyard.b;

  return (
    <div className="min-h-screen bg-[#191B1D] text-[#FAF9F6] flex flex-col font-sans select-none overflow-x-hidden">
      <Navigation />

      {/* 1. MAIN MENU SCREEN */}
      {screen === 'menu' && (
        <DeckBuilderMainMenu
          onOpenMultiplayer={() => setScreen('multiplayer')}
          profilesHook={profilesHook}
        />
      )}

      {/* 2. MULTIPLAYER CHARACTER STAGE SCREEN */}
      {screen === 'multiplayer' && (
        <MultiplayerCharacterStage
          onBackToMenu={() => setScreen('menu')}
          onStartOfflineMatch={handleStartOfflineMatch}
          profilesHook={profilesHook}
        />
      )}

      {/* 3. LEGACY FORGE / DECK BUILDER VIEW */}
      {screen === 'forge' && (
        <main className="flex-1 p-2 sm:p-4 lg:p-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-5xl">
            <DeckBuilderView
              initialDeck={activeProfile.equippedHand}
              onSaveDeck={(saved) => {
                game.resetGame(
                  playerColor === 'w' ? saved : undefined,
                  playerColor === 'b' ? saved : undefined
                );
                setScreen('arena');
              }}
              onBackToBattle={() => setScreen('arena')}
            />
          </div>
        </main>
      )}

      {/* 4. ARENA MATCH SCREEN */}
      {screen === 'arena' && (
        <main className="flex-1 p-2 sm:p-4 lg:p-6 flex flex-col items-center justify-center">
          {/* Top Arena Navigation Bar */}
          <div className="w-full max-w-[1240px] flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScreen('multiplayer')}
                data-testid="back-to-stage-btn"
                className="px-2.5 py-1 bg-[#24272A] hover:bg-[#2C3034] text-[#FAF9F6] border border-[rgba(139,126,116,0.25)] rounded text-xs font-semibold cursor-pointer"
              >
                ← Stage
              </button>
              <button
                type="button"
                onClick={() => setScreen('menu')}
                data-testid="back-to-menu-btn"
                className="px-2.5 py-1 bg-[#1C1E20] hover:bg-[#222528] text-[#8B7E74] hover:text-[#FAF9F6] border border-[rgba(139,126,116,0.2)] rounded text-xs cursor-pointer"
              >
                ← Main Menu
              </button>
            </div>
            <div className="text-xs text-[#8B7E74]">
              Profile: <span className="text-[#FAF9F6] font-semibold">{activeProfile.name}</span> · Mode: Playtest
            </div>
          </div>

          <div className="w-full max-w-[1240px] flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-5">
            {/* 1. LEFT COLUMN (356px): TCG Ruffle Hand Stage */}
            <div className="w-full max-w-[512px] lg:w-[356px] lg:h-[596px] order-2 lg:order-1 flex flex-col">
              <TacticalHandBar
                hand={myHand}
                initialDeck={activeProfile.equippedHand}
                energy={game.energy}
                hasPlayedCardThisTurn={game.hasPlayedCardThisTurn}
                isMyTurn={isMyTurn}
                selectedCard={game.selectedCard}
                selectedCardId={game.selectedCardId}
                hoveredCardId={game.hoveredCardId}
                targetingStage={game.targetingStage}
                activeCardIdsForPiece={game.activeCardIdsForPiece}
                onSelectCard={game.selectCard}
                onHoverCard={game.setHoveredCard}
                onCancelTargeting={game.cancelPendingCardMove}
                pendingCardMove={game.pendingCardMove}
                selectedSquare={game.selectedSquare}
              />
            </div>

            {/* 2. CENTER COLUMN (512px): Full 512x512 Chessboard */}
            <div className="w-full max-w-[512px] flex flex-col justify-between order-1 lg:order-2 gap-2">
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

              {/* Tavern Tabletop Stage with Inscribed Chessboard */}
              <div className="relative w-full max-w-[820px] flex flex-col items-center">
                <TabletopArena>
                  <DeckChessBoard
                    embedded
                    fen={game.fen}
                    orientation={playerColor}
                    selectedSquare={game.selectedSquare}
                    legalMoves={game.legalMovesForSelected}
                    empoweredMoves={game.empoweredMoves}
                    hoveredCardId={game.hoveredCardId}
                    selectedCardId={game.selectedCardId}
                    disambiguationCandidates={game.disambiguationCandidates}
                    pendingCardMove={game.pendingCardMove}
                    onSquareClick={game.handleSquareClick}
                    onConfirmCardMove={game.confirmPendingCardMove}
                    onCancelCardMove={game.cancelPendingCardMove}
                    validAnchorSquares={game.validAnchorSquares}
                    validTargetSquares={game.validTargetSquares}
                    activeModifiers={game.activeModifiers}
                    inCheck={game.inCheck}
                  />

                  {/* Game Over Modal Overlay */}
                  {game.isGameOver && (
                    <div className="absolute inset-0 bg-[#141618]/90 backdrop-blur-md rounded-md flex flex-col items-center justify-center p-6 text-center z-40 border border-[#D4AF37]/50 shadow-2xl">
                      <span className="text-4xl mb-2">
                        {game.winner === 'draw'
                          ? '🤝'
                          : game.winner === playerColor
                          ? '🏆'
                          : '💀'}
                      </span>
                      <h2
                        className={`text-xl font-bold tracking-tight ${
                          game.winner === playerColor ? 'text-[#D4AF37]' : 'text-[#FAF9F6]'
                        }`}
                      >
                        {game.winner === 'draw'
                          ? 'Draw'
                          : game.winner === playerColor
                          ? 'Victory!'
                          : 'Defeat'}
                      </h2>
                      <p className="text-xs text-[#8B7E74] mt-1 capitalize font-mono">
                        Reason: {game.finishReason ? game.finishReason.replace('_', ' ') : 'Match Concluded'}
                      </p>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleStartNewMatch(playerColor, aiDifficulty)}
                          className="px-4 py-2 bg-[#4C5C4C] hover:bg-[#5C6C5C] text-[#FAF9F6] text-xs font-bold rounded transition-colors shadow cursor-pointer"
                        >
                          Rematch
                        </button>
                        <button
                          onClick={() => setScreen('multiplayer')}
                          className="px-4 py-2 bg-[#24272A] hover:bg-[#282B2E] text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-semibold rounded transition-colors cursor-pointer"
                        >
                          Back to Stage
                        </button>
                      </div>
                    </div>
                  )}
                </TabletopArena>
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
                  <span className="font-medium truncate">{user?.username || activeProfile.name || 'Player'}</span>
                  {isMyTurn && (
                    <span className="text-[10px] text-[#D4AF37] font-mono animate-pulse">
                      your turn
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm tracking-widest select-none opacity-85">
                    {renderGraveyardGlyphs(playerCaptured)}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#FAF9F6]">
                    10:00
                  </span>
                </div>
              </div>
            </div>

            {/* 3. RIGHT COLUMN (280px): Tactical Telemetry & Moves / Chat Panel */}
            <div className="w-full max-w-[512px] lg:w-[280px] lg:h-[596px] order-3 flex flex-col justify-between bg-[#1C1E20] border border-[rgba(139,126,116,0.2)] rounded-md p-3 shadow-xl">
              {/* Header: Segmented Tabs (Moves | Chat) + Turn Counter */}
              <div className="flex items-center justify-between pb-2.5 border-b border-[rgba(139,126,116,0.16)]">
                <div className="flex bg-[#191B1D] p-0.5 rounded border border-[rgba(139,126,116,0.2)]">
                  <button
                    onClick={() => setRightTab('moves')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      rightTab === 'moves'
                        ? 'bg-[#24272A] text-[#FAF9F6] shadow-sm'
                        : 'text-[#8B7E74] hover:text-[#FAF9F6]'
                    }`}
                  >
                    Moves
                  </button>
                  <button
                    onClick={() => setRightTab('chat')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      rightTab === 'chat'
                        ? 'bg-[#24272A] text-[#FAF9F6] shadow-sm'
                        : 'text-[#8B7E74] hover:text-[#FAF9F6]'
                    }`}
                  >
                    Chat
                  </button>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-[#8B7E74] uppercase">
                    TURN {game.turnNumber}
                  </div>
                  <div className="text-[11px] font-bold text-[#D4AF37]">
                    {isMyTurn ? 'Your Turn' : 'AI Turn'}
                  </div>
                </div>
              </div>

              {/* Tab Body: Moves List vs Live Chat */}
              <div className="flex-1 my-2 overflow-hidden flex flex-col">
                {rightTab === 'moves' ? (
                  <div className="flex-1 overflow-y-auto pr-1 space-y-1 font-mono text-xs">
                    {game.combatLog.length === 0 ? (
                      <div className="text-center text-[#8B7E74] text-xs py-8">
                        No moves recorded yet
                      </div>
                    ) : (
                      game.combatLog.map((log) => (
                        <div
                          key={log.id}
                          className={`p-1.5 rounded text-[11px] leading-tight ${
                            log.type === 'system'
                              ? 'bg-[#191B1D] text-[#8B7E74] italic border border-[rgba(139,126,116,0.1)]'
                              : log.type === 'card'
                              ? 'bg-[#24272A] border-l-2 border-[#D4AF37] text-[#FAF9F6]'
                              : 'bg-[#191B1D] text-[#FAF9F6] border border-[rgba(139,126,116,0.15)]'
                          }`}
                        >
                          {log.text}
                        </div>
                      ))
                    )}
                    <div ref={moveLogEndRef} />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-1.5 rounded text-[11px] leading-relaxed ${
                            msg.isSystem
                              ? 'bg-[#191B1D] text-[#8B7E74] border border-[rgba(139,126,116,0.15)] italic'
                              : msg.sender === (user?.username || activeProfile.name || 'Player')
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
                  type="button"
                  onClick={() => game.resign(playerColor)}
                  disabled={game.isGameOver}
                  className="flex-1 py-1.5 bg-[#191B1D] hover:bg-[#AA4A44]/20 text-[#AA4A44] border border-[#AA4A44]/40 rounded text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                >
                  Resign
                </button>
                <button
                  type="button"
                  onClick={() => handleStartNewMatch(playerColor, aiDifficulty)}
                  className="flex-1 py-1.5 bg-[#24272A] hover:bg-[#282B2E] text-[#FAF9F6] border border-[rgba(139,126,116,0.25)] rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  New Game
                </button>
                <button
                  type="button"
                  onClick={() => setScreen('multiplayer')}
                  className="flex-1 py-1.5 bg-[#24272A] hover:bg-[#282B2E] text-[#D4AF37] border border-[#D4AF37]/40 rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  My Deck
                </button>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default DeckBuilderPage;
