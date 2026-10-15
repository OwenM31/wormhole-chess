import { useState, useRef, useCallback, useEffect } from 'react';
import {
  BoardModifier,
  CardDefinition,
  DeckChessCardAction,
  DeckChessMove,
  DeckChessTurnPayload,
  GameFinishReason,
  Graveyard,
  PieceColor,
  TargetingStage,
} from '../types/deckChess';
import { DeckChessEngine, DeckChessEngineState } from '../engine/DeckChessEngine';
import { computeBestTurn } from '../engine/DeckChessAI';
import { getCardById } from '../engine/cardGraph';
import { api } from '../services/api';
import {
  playMoveSound,
  playCaptureSound,
  playCheckSound,
  playCardSound,
  playVictorySound,
  playDefeatSound,
} from '../utils/soundEffects';

export interface CombatLogEntry {
  id: string;
  text: string;
  timestamp: number;
  type: 'move' | 'card' | 'system';
  playerColor?: PieceColor;
}

export interface RecordedTurn {
  turnNumber: number;
  player: PieceColor;
  chessMove: DeckChessMove;
  cardAction?: DeckChessCardAction;
  fenAfter: string;
  combatText?: string;
  timestamp: number;
}

export interface UseDeckChessGameOptions {
  mode?: 'ai' | 'multiplayer' | 'pass_and_play';
  playerColor?: PieceColor;
  aiDifficulty?: 'easy' | 'medium' | 'tactical';
  whiteDeck?: string[];
  blackDeck?: string[];
  onTurnComplete?: (payload: DeckChessTurnPayload) => void;
}

export function useDeckChessGame({
  mode = 'ai',
  playerColor = 'w',
  aiDifficulty = 'medium',
  whiteDeck,
  blackDeck,
  onTurnComplete,
}: UseDeckChessGameOptions = {}) {
  // Retain mutable engine instance in ref
  const engineRef = useRef<DeckChessEngine>(
    new DeckChessEngine(undefined, whiteDeck, blackDeck)
  );

  // Reactive game state
  const [gameState, setGameState] = useState<DeckChessEngineState>(() =>
    engineRef.current.getState()
  );

  // AI thinking state
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Card targeting state
  const [selectedCard, setSelectedCard] = useState<CardDefinition | null>(null);
  const [targetingStage, setTargetingStage] = useState<TargetingStage>('none');
  const [selectedAnchorSquare, setSelectedAnchorSquare] = useState<string | null>(null);
  const [selectedTargetSquare, setSelectedTargetSquare] = useState<string | null>(null);
  const [validAnchorSquares, setValidAnchorSquares] = useState<string[]>([]);
  const [validTargetSquares, setValidTargetSquares] = useState<string[]>([]);

  // Chess move selection state
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMovesForSelected, setLegalMovesForSelected] = useState<string[]>([]);

  // Combat log
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([
    {
      id: `sys_start_${Date.now()}`,
      text: 'Game initialized. 3 Energy restored per turn. Standard rules apply.',
      timestamp: Date.now(),
      type: 'system',
    },
  ]);

  // Enriched recorded turns for match replay and persistence
  const [recordedTurns, setRecordedTurns] = useState<RecordedTurn[]>([]);
  const lastCardActionRef = useRef<DeckChessCardAction | null>(null);
  const gameStartedAtRef = useRef<number>(Date.now());
  const hasRecordedRef = useRef<boolean>(false);

  // Sync state from engine
  const syncState = useCallback(() => {
    setGameState(engineRef.current.getState());
  }, []);

  const addLog = useCallback(
    (text: string, type: 'move' | 'card' | 'system', color?: PieceColor) => {
      setCombatLog((prev) => [
        ...prev,
        {
          id: `log_${Date.now()}_${Math.random()}`,
          text,
          timestamp: Date.now(),
          type,
          playerColor: color,
        },
      ]);
    },
    []
  );

  // Cancel any card targeting in progress
  const cancelCardSelection = useCallback(() => {
    setSelectedCard(null);
    setTargetingStage('none');
    setSelectedAnchorSquare(null);
    setSelectedTargetSquare(null);
    setValidAnchorSquares([]);
    setValidTargetSquares([]);
  }, []);

  // Clear chess piece selection
  const clearPieceSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalMovesForSelected([]);
  }, []);

  // Card selection trigger from tactical hand bar
  const selectCard = useCallback(
    (cardId: string) => {
      if (gameState.isGameOver || isAiThinking) return;

      // In AI mode, prevent playing during AI turn
      if (mode === 'ai' && gameState.turn !== playerColor) return;

      // If clicking same card, cancel selection
      if (selectedCard?.id === cardId) {
        cancelCardSelection();
        return;
      }

      // Deselect any chess piece
      clearPieceSelection();

      const card = getCardById(cardId);
      if (!card) return;

      if (!engineRef.current.canPlayCard(cardId)) {
        addLog(`Cannot play [${card.name}]: conditions or energy requirement not met.`, 'system');
        return;
      }

      const anchors = engineRef.current.getValidAnchorsForCard(cardId);
      if (anchors.length === 0) {
        addLog(`No valid anchor piece on board for [${card.name}].`, 'system');
        return;
      }

      setSelectedCard(card);
      setTargetingStage('pick_anchor');
      setValidAnchorSquares(anchors);
      setSelectedAnchorSquare(null);
      setSelectedTargetSquare(null);
      setValidTargetSquares([]);
    },
    [
      gameState.isGameOver,
      gameState.turn,
      isAiThinking,
      mode,
      playerColor,
      selectedCard,
      cancelCardSelection,
      clearPieceSelection,
      addLog,
    ]
  );

  // Execute card activation helper
  const executeCard = useCallback(
    (
      cardId: string,
      anchorSquare: string,
      targetSquare?: string,
      extraSquare?: string
    ) => {
      const card = getCardById(cardId);
      const activeColor = engineRef.current.getTurn();
      const res = engineRef.current.activateCard(
        cardId,
        anchorSquare,
        targetSquare,
        extraSquare
      );

      if (!res.success) {
        addLog(`Card failed: ${res.error}`, 'system');
        cancelCardSelection();
        return false;
      }

      playCardSound();
      lastCardActionRef.current = { cardId, anchorSquare, targetSquare, extraSquare };

      const cardName = card ? card.name : cardId;
      const targetStr = targetSquare ? ` ➔ ${targetSquare}` : '';
      addLog(
        `${activeColor === 'w' ? 'White' : 'Black'} played [${cardName}] on ${anchorSquare}${targetStr}`,
        'card',
        activeColor
      );

      cancelCardSelection();
      syncState();
      return true;
    },
    [addLog, cancelCardSelection, syncState]
  );

  // Trigger AI turn execution
  const triggerAiTurn = useCallback(() => {
    if (gameState.isGameOver) return;
    const aiColor = playerColor === 'w' ? 'b' : 'w';

    setIsAiThinking(true);

    setTimeout(() => {
      try {
        const engine = engineRef.current;
        if (engine.getTurn() !== aiColor || engine.isGameOver()) {
          setIsAiThinking(false);
          return;
        }

        const decision = computeBestTurn(engine, aiColor, aiDifficulty);

        // 1. Play card if chosen
        if (decision.cardToPlay) {
          const { cardId, anchorSquare, targetSquare, extraSquare } = decision.cardToPlay;
          const cardDef = getCardById(cardId);
          engine.activateCard(cardId, anchorSquare, targetSquare, extraSquare);
          playCardSound();
          addLog(
            `AI Bot played [${cardDef?.name || cardId}] on ${anchorSquare}${targetSquare ? ` ➔ ${targetSquare}` : ''}`,
            'card',
            aiColor
          );
        }

        // 2. Execute chess move
        const moveRes = engine.makeMove(decision.move);
        if (moveRes.success && moveRes.move) {
          const moveDesc = moveRes.move.san || `${decision.move.from}-${decision.move.to}`;
          addLog(`AI Bot moved ${moveDesc}`, 'move', aiColor);

          if (moveRes.move.captured) {
            playCaptureSound();
          } else {
            playMoveSound();
          }
          if (engine.inCheck()) {
            setTimeout(playCheckSound, 120);
          }

          const turnRecord: RecordedTurn = {
            turnNumber: engine.getTurnNumber(),
            player: aiColor,
            chessMove: decision.move,
            cardAction: decision.cardToPlay
              ? {
                  cardId: decision.cardToPlay.cardId,
                  anchorSquare: decision.cardToPlay.anchorSquare,
                  targetSquare: decision.cardToPlay.targetSquare,
                  extraSquare: decision.cardToPlay.extraSquare,
                }
              : undefined,
            fenAfter: engine.getFen(),
            combatText: `AI Bot moved ${moveDesc}`,
            timestamp: Date.now(),
          };
          setRecordedTurns((prev) => [...prev, turnRecord]);
        }

        syncState();
      } catch (err: any) {
        console.error('AI decision error:', err);
      } finally {
        setIsAiThinking(false);
      }
    }, 400);
  }, [gameState.isGameOver, playerColor, aiDifficulty, addLog, syncState]);

  // Execute standard chess move
  const makeMove = useCallback(
    (from: string, to: string, promotion: string = 'q') => {
      if (gameState.isGameOver || isAiThinking) return false;

      const currentTurn = engineRef.current.getTurn();

      if (mode === 'ai' && currentTurn !== playerColor) return false;

      const lastPlayedCard = engineRef.current.hasPlayedCardThisTurn();

      const res = engineRef.current.makeMove({ from, to, promotion });
      if (!res.success || !res.move) {
        addLog(`Illegal move: ${from} to ${to}`, 'system');
        return false;
      }

      const moveSan = res.move.san || `${from}-${to}`;
      addLog(
        `${currentTurn === 'w' ? 'White' : 'Black'} moved ${moveSan}`,
        'move',
        currentTurn
      );

      if (res.move.captured) {
        playCaptureSound();
      } else {
        playMoveSound();
      }
      if (engineRef.current.inCheck()) {
        setTimeout(playCheckSound, 120);
      }

      const turnRecord: RecordedTurn = {
        turnNumber: engineRef.current.getTurnNumber(),
        player: currentTurn,
        chessMove: { from, to, promotion },
        cardAction: lastCardActionRef.current || undefined,
        fenAfter: engineRef.current.getFen(),
        combatText: `${currentTurn === 'w' ? 'White' : 'Black'} moved ${moveSan}`,
        timestamp: Date.now(),
      };
      lastCardActionRef.current = null;
      setRecordedTurns((prev) => [...prev, turnRecord]);

      clearPieceSelection();
      syncState();

      // Notify external consumer (e.g. WebSocket multiplayer)
      if (onTurnComplete) {
        const payload: DeckChessTurnPayload = {
          turnNumber: engineRef.current.getTurnNumber(),
          playerColor: currentTurn,
          chessMove: { from, to, promotion },
          resultingFen: engineRef.current.getFen(),
          activeModifiers: engineRef.current.getActiveModifiers(),
        };
        onTurnComplete(payload);
      }

      // If playing AI, queue bot turn
      if (mode === 'ai' && !engineRef.current.isGameOver()) {
        setTimeout(triggerAiTurn, 100);
      }

      return true;
    },
    [
      gameState.isGameOver,
      isAiThinking,
      mode,
      playerColor,
      addLog,
      clearPieceSelection,
      syncState,
      onTurnComplete,
      triggerAiTurn,
    ]
  );

  // Square click coordinator (handles card targeting and piece moves)
  const handleSquareClick = useCallback(
    (square: string) => {
      if (gameState.isGameOver || isAiThinking) return;

      // --- Mode: Card Targeting Active ---
      if (selectedCard) {
        if (targetingStage === 'pick_anchor') {
          if (!validAnchorSquares.includes(square)) {
            // Click outside valid anchors: deselect card
            cancelCardSelection();
            return;
          }

          const targets = engineRef.current.getValidTargetsForCard(selectedCard.id, square);

          if (targets.length === 0) {
            // Immediate card execution (e.g. pawn_scuttle, bishop_invert with 1 auto choice)
            executeCard(selectedCard.id, square);
          } else {
            setSelectedAnchorSquare(square);
            setTargetingStage('pick_target');
            setValidTargetSquares(targets);
          }
          return;
        }

        if (targetingStage === 'pick_target') {
          if (!validTargetSquares.includes(square)) {
            cancelCardSelection();
            return;
          }

          // Check if card needs 3rd step (e.g. knight_escort)
          if (selectedCard.id === 'knight_escort') {
            setSelectedTargetSquare(square);
            setTargetingStage('pick_secondary');
            // Passenger pawn chosen, now pick knight landing leap
            if (selectedAnchorSquare) {
              const knightMoves = engineRef.current
                .getLegalMoves(selectedAnchorSquare)
                .map((m) => m.to);
              setValidTargetSquares(knightMoves);
            }
            return;
          }

          if (selectedAnchorSquare) {
            executeCard(selectedCard.id, selectedAnchorSquare, square);
          }
          return;
        }

        if (targetingStage === 'pick_secondary') {
          if (selectedAnchorSquare && selectedTargetSquare && validTargetSquares.includes(square)) {
            executeCard(selectedCard.id, selectedAnchorSquare, selectedTargetSquare, square);
          } else {
            cancelCardSelection();
          }
          return;
        }

        return;
      }

      // --- Mode: Chess Piece Selection / Move ---
      const activeTurn = engineRef.current.getTurn();

      if (mode === 'ai' && activeTurn !== playerColor) return;

      if (!selectedSquare) {
        const piece = engineRef.current.getPiece(square);
        if (piece && piece.color === activeTurn) {
          setSelectedSquare(square);
          const legalDestinations = engineRef.current
            .getLegalMoves(square)
            .map((m) => m.to);
          setLegalMovesForSelected(legalDestinations);
        }
        return;
      }

      // Clicking currently selected piece deselects it
      if (selectedSquare === square) {
        clearPieceSelection();
        return;
      }

      // If clicking a destination in legal moves, execute move!
      if (legalMovesForSelected.includes(square)) {
        makeMove(selectedSquare, square);
        return;
      }

      // Clicking another friendly piece switches selection
      const clickedPiece = engineRef.current.getPiece(square);
      if (clickedPiece && clickedPiece.color === activeTurn) {
        setSelectedSquare(square);
        const legalDestinations = engineRef.current
          .getLegalMoves(square)
          .map((m) => m.to);
        setLegalMovesForSelected(legalDestinations);
        return;
      }

      // Clicking empty/illegal square clears selection
      clearPieceSelection();
    },
    [
      gameState.isGameOver,
      isAiThinking,
      selectedCard,
      targetingStage,
      validAnchorSquares,
      validTargetSquares,
      selectedAnchorSquare,
      selectedTargetSquare,
      selectedSquare,
      legalMovesForSelected,
      mode,
      playerColor,
      cancelCardSelection,
      executeCard,
      clearPieceSelection,
      makeMove,
    ]
  );

  // Apply incoming turn from network (Multiplayer WebSocket)
  const applyRemoteTurn = useCallback(
    (payload: DeckChessTurnPayload) => {
      const engine = engineRef.current;

      if (payload.cardAction) {
        const { cardId, anchorSquare, targetSquare, extraSquare } = payload.cardAction;
        const cardDef = getCardById(cardId);
        engine.activateCard(cardId, anchorSquare, targetSquare, extraSquare);
        playCardSound();
        addLog(
          `${payload.playerColor === 'w' ? 'White' : 'Black'} played [${cardDef?.name || cardId}] on ${anchorSquare}`,
          'card',
          payload.playerColor
        );
      }

      const moveRes = engine.makeMove(payload.chessMove);
      if (moveRes.success && moveRes.move) {
        const moveSan = moveRes.move.san || `${payload.chessMove.from}-${payload.chessMove.to}`;
        addLog(
          `${payload.playerColor === 'w' ? 'White' : 'Black'} moved ${moveSan}`,
          'move',
          payload.playerColor
        );

        if (moveRes.move.captured) {
          playCaptureSound();
        } else {
          playMoveSound();
        }
        if (engine.inCheck()) {
          setTimeout(playCheckSound, 120);
        }

        const turnRecord: RecordedTurn = {
          turnNumber: payload.turnNumber,
          player: payload.playerColor,
          chessMove: payload.chessMove,
          cardAction: payload.cardAction,
          fenAfter: payload.resultingFen,
          combatText: `${payload.playerColor === 'w' ? 'White' : 'Black'} moved ${moveSan}`,
          timestamp: Date.now(),
        };
        setRecordedTurns((prev) => [...prev, turnRecord]);
      }

      clearPieceSelection();
      cancelCardSelection();
      syncState();
    },
    [addLog, clearPieceSelection, cancelCardSelection, syncState]
  );

  // Reset or initialize new match
  const resetGame = useCallback(
    (newWhiteDeck?: string[], newBlackDeck?: string[]) => {
      engineRef.current = new DeckChessEngine(undefined, newWhiteDeck, newBlackDeck);
      clearPieceSelection();
      cancelCardSelection();
      setIsAiThinking(false);
      gameStartedAtRef.current = Date.now();
      hasRecordedRef.current = false;
      lastCardActionRef.current = null;
      setRecordedTurns([]);
      setCombatLog([
        {
          id: `sys_reset_${Date.now()}`,
          text: 'Match reset. Tactical hands replenished. White moves first.',
          timestamp: Date.now(),
          type: 'system',
        },
      ]);
      syncState();
    },
    [clearPieceSelection, cancelCardSelection, syncState]
  );

  // Resign match
  const resign = useCallback(
    (color: PieceColor) => {
      engineRef.current.resign(color);
      addLog(`${color === 'w' ? 'White' : 'Black'} resigned.`, 'system');
      syncState();
    },
    [addLog, syncState]
  );

  // Match completion recording & victory/defeat sound effects
  useEffect(() => {
    if (gameState.isGameOver && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      const isSolo = mode === 'ai';
      const winner =
        gameState.winner === 'w'
          ? 'white'
          : gameState.winner === 'b'
          ? 'black'
          : gameState.winner === 'draw'
          ? 'draw'
          : null;
      const result =
        gameState.winner === 'w'
          ? '1-0'
          : gameState.winner === 'b'
          ? '0-1'
          : '1/2-1/2';

      if (gameState.winner === playerColor) {
        playVictorySound();
      } else if (gameState.winner && gameState.winner !== 'draw') {
        playDefeatSound();
      }

      api
        .recordMatch({
          variant: isSolo
            ? 'deck_builder:ai'
            : mode === 'multiplayer'
            ? 'deck_builder:pvp'
            : 'deck_builder:local',
          opponentName: isSolo
            ? 'Minimax AI Bot'
            : mode === 'multiplayer'
            ? 'Online Opponent'
            : 'Local Player',
          result,
          winner,
          moves: recordedTurns,
          startedAt: gameStartedAtRef.current,
          endedAt: Date.now(),
        })
        .catch((err) => {
          console.warn('Failed to record deck chess match:', err);
        });
    }
  }, [gameState.isGameOver, gameState.winner, mode, playerColor, recordedTurns]);

  return {
    // Engine State
    gameState,
    fen: gameState.fen,
    turn: gameState.turn,
    turnNumber: gameState.turnNumber,
    energy: gameState.energy,
    hasPlayedCardThisTurn: gameState.cardPlayedThisTurn,
    whiteHand: gameState.whiteHand,
    blackHand: gameState.blackHand,
    graveyard: gameState.graveyard,
    activeModifiers: gameState.activeModifiers,
    isGameOver: gameState.isGameOver,
    winner: gameState.winner,
    finishReason: gameState.finishReason,
    inCheck: gameState.inCheck,
    isAiThinking,

    // Selection & Targeting State
    selectedCard,
    targetingStage,
    selectedAnchorSquare,
    selectedTargetSquare,
    validAnchorSquares,
    validTargetSquares,
    selectedSquare,
    legalMovesForSelected,

    // Combat Log & Match Records
    combatLog,
    recordedTurns,

    // Actions
    handleSquareClick,
    selectCard,
    cancelCardSelection,
    makeMove,
    applyRemoteTurn,
    resetGame,
    resign,
  };
}
