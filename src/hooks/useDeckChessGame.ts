import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
  EmpoweredMove,
  AiDifficulty,
  PositionEvaluation,
  BestTurnResult,
} from '../types/deckChess';
import { DeckChessEngine, DeckChessEngineState } from '../engine/DeckChessEngine';
import { computeBestTurn, evaluatePosition } from '../engine/DeckChessAI';
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

import {
  RecordedTurn,
  TurnRow,
  PIECE_CARD_COLORS,
  getCardTag,
  formatEmpoweredMoveSan,
  groupTurnsIntoRows,
} from '../utils/moveNotation';

export type { RecordedTurn, TurnRow };
export { PIECE_CARD_COLORS, getCardTag, formatEmpoweredMoveSan, groupTurnsIntoRows };

export interface CombatLogEntry {
  id: string;
  text: string;
  timestamp: number;
  type: 'move' | 'card' | 'system';
  playerColor?: PieceColor;
}

export interface UseDeckChessGameOptions {
  mode?: 'ai' | 'multiplayer' | 'pass_and_play';
  playerColor?: PieceColor;
  aiDifficulty?: AiDifficulty;
  whiteDeck?: string[];
  blackDeck?: string[];
  onTurnComplete?: (payload: DeckChessTurnPayload) => void;
}

function isExtraSquareFirstCard(moves: EmpoweredMove[]): boolean {
  return moves.some(
    (m) => m.stageExtraSquareFirst || m.cardId === 'r1_make_way' || m.cardId === 'n5_get_to_the_king'
  );
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

  // Card targeting & selection state
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [disambiguationCandidates, setDisambiguationCandidates] = useState<EmpoweredMove[] | null>(null);
  const [pendingCardMove, setPendingCardMove] = useState<EmpoweredMove[] | null | any>(null);
  const [pendingPromotionMove, setPendingPromotionMove] = useState<{ from: string; to: string } | null>(null);

  // Legacy targeting state preserved for backwards compatibility
  const [selectedCard, setSelectedCard] = useState<CardDefinition | null>(null);
  const [targetingStage, setTargetingStage] = useState<TargetingStage>('none');
  const [selectedAnchorSquare, setSelectedAnchorSquare] = useState<string | null>(null);
  const [selectedTargetSquare, setSelectedTargetSquare] = useState<string | null>(null);
  const [validAnchorSquares, setValidAnchorSquares] = useState<string[]>([]);
  const [validTargetSquares, setValidTargetSquares] = useState<string[]>([]);

  // Chess move selection state
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMovesForSelected, setLegalMovesForSelected] = useState<string[]>([]);
  const [empoweredMovesForSelected, setEmpoweredMovesForSelected] = useState<EmpoweredMove[]>([]);

  // Combat log
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([
    {
      id: `sys_start_${Date.now()}`,
      text: 'Game initialized. 36-Card Tactical Engine active. Standard chess moves execute immediately; card moves require confirmation.',
      timestamp: Date.now(),
      type: 'system',
    },
  ]);

  // Enriched recorded turns for match replay and persistence
  const [recordedTurns, setRecordedTurns] = useState<RecordedTurn[]>([]);
  const lastCardActionRef = useRef<DeckChessCardAction | null>(null);
  const gameStartedAtRef = useRef<number>(Date.now());
  const hasRecordedRef = useRef<boolean>(false);

  // Timeline snapshot state machine (Phase 9)
  const initialStateSnapshotRef = useRef<DeckChessEngineState>(
    engineRef.current.getState()
  );
  const [viewIndex, setViewIndex] = useState<number | null>(null);

  const activeMoveIndex = viewIndex !== null ? viewIndex : recordedTurns.length - 1;
  const isViewingHistory = viewIndex !== null && viewIndex < recordedTurns.length - 1;

  const displayedState = useMemo<DeckChessEngineState>(() => {
    if (viewIndex === -1) {
      return initialStateSnapshotRef.current;
    }
    if (viewIndex !== null && viewIndex >= 0 && viewIndex < recordedTurns.length) {
      return recordedTurns[viewIndex].stateSnapshot;
    }
    return gameState;
  }, [viewIndex, recordedTurns, gameState]);

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

  // Best-Move Hint & Live/Historical Evaluation state
  const [hintMove, setHintMove] = useState<BestTurnResult | null>(null);

  const evaluation: PositionEvaluation = useMemo(() => {
    if (!isViewingHistory) {
      return evaluatePosition(engineRef.current);
    }
    try {
      const histEngine = new DeckChessEngine(
        displayedState.fen,
        displayedState.whiteHand,
        displayedState.blackHand
      );
      if (displayedState.activeModifiers?.length) {
        histEngine.setActiveModifiers(displayedState.activeModifiers);
      }
      return evaluatePosition(histEngine);
    } catch {
      return evaluatePosition(engineRef.current);
    }
  }, [
    isViewingHistory,
    displayedState.fen,
    displayedState.whiteHand.length,
    displayedState.blackHand.length,
    displayedState.isGameOver,
    gameState.fen,
    gameState.whiteHand.length,
    gameState.blackHand.length,
    gameState.isGameOver,
  ]);

  // Clear piece selection
  const clearPieceSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalMovesForSelected([]);
    setEmpoweredMovesForSelected([]);
  }, []);

  // Cancel any pending card move or selection
  const cancelPendingCardMove = useCallback(() => {
    setPendingCardMove(null);
    setPendingPromotionMove(null);
    setDisambiguationCandidates(null);
    setSelectedCardId(null);
    setSelectedCard(null);
    setTargetingStage('none');
    setHintMove(null);
    clearPieceSelection();
  }, [clearPieceSelection]);

  // Scrubber Navigation Callbacks
  const stepBackward = useCallback(() => {
    cancelPendingCardMove();
    setViewIndex((current) => {
      const active = current !== null ? current : recordedTurns.length - 1;
      if (active <= -1) return -1;
      return active - 1;
    });
  }, [recordedTurns.length, cancelPendingCardMove]);

  const stepForward = useCallback(() => {
    cancelPendingCardMove();
    setViewIndex((current) => {
      const active = current !== null ? current : recordedTurns.length - 1;
      if (active >= recordedTurns.length - 1) return null;
      const next = active + 1;
      return next >= recordedTurns.length - 1 ? null : next;
    });
  }, [recordedTurns.length, cancelPendingCardMove]);

  const stepToMove = useCallback(
    (index: number | null) => {
      cancelPendingCardMove();
      if (index === null || index >= recordedTurns.length - 1) {
        setViewIndex(null);
      } else if (index < -1) {
        setViewIndex(-1);
      } else {
        setViewIndex(index);
      }
    },
    [recordedTurns.length, cancelPendingCardMove]
  );

  const jumpToLive = useCallback(() => {
    cancelPendingCardMove();
    setViewIndex(null);
  }, [cancelPendingCardMove]);

  // Cancel card selection (legacy alias)
  const cancelCardSelection = useCallback(() => {
    cancelPendingCardMove();
    setSelectedAnchorSquare(null);
    setSelectedTargetSquare(null);
    setValidAnchorSquares([]);
    setValidTargetSquares([]);
  }, [cancelPendingCardMove]);

  // Active cards in hand applicable for the currently selected piece
  const activeCardIdsForPiece = useMemo(() => {
    if (!selectedSquare) {
      return selectedCardId ? [selectedCardId] : [];
    }
    const pieceEmpowered = engineRef.current.getEmpoweredMoves(selectedSquare);
    const set = new Set(pieceEmpowered.map((m) => m.cardId));
    if (selectedCardId && set.has(selectedCardId)) {
      return [selectedCardId];
    }
    return Array.from(set);
  }, [selectedSquare, selectedCardId, gameState.fen]);

  // Helper to configure empowered moves and staging for an anchor piece
  const setupAnchorCardMoves = useCallback((moves: EmpoweredMove[]) => {
    setEmpoweredMovesForSelected(moves);
    if (isExtraSquareFirstCard(moves)) {
      if (moves.some((m) => m.cardId === 'n5_get_to_the_king')) {
        // For N5, always stage safe fork square S1 first
        setDisambiguationCandidates(moves);
      } else {
        // E.g. R1 Make Way
        const extraSquares = Array.from(new Set(moves.map((m) => m.extraSquare).filter(Boolean)));
        if (extraSquares.length > 1) {
          setDisambiguationCandidates(moves);
        } else {
          setDisambiguationCandidates(null);
        }
      }
    } else {
      // to-first cards (N3, Q2, P4, K3, B6, B7): show destination squares directly
      setDisambiguationCandidates(null);
      if (moves.length === 1 && !moves[0].extraSquare) {
        setPendingCardMove(moves[0]);
      }
    }
  }, []);

  // Card selection from tactical hand bar (Card-First Flow & Arm/Disarm Toggle)
  const selectCardFromHand = useCallback(
    (cardId: string) => {
      if (gameState.isGameOver || isAiThinking || isViewingHistory) return;
      if (mode === 'ai' && gameState.turn !== playerColor) return;

      // Card Arm / Disarm Toggle: Tapping the currently armed card disarms it and reverts to standard moves
      if (selectedCardId === cardId) {
        setSelectedCardId(null);
        setSelectedCard(null);
        setPendingCardMove(null);
        setDisambiguationCandidates(null);
        setEmpoweredMovesForSelected([]);
        if (selectedSquare) {
          const legalStandard = engineRef.current.getLegalMoves(selectedSquare).map((m) => m.to);
          setLegalMovesForSelected(legalStandard);
        }
        return;
      }

      setPendingCardMove(null);
      setDisambiguationCandidates(null);

      const card = getCardById(cardId);
      if (!card) return;

      const currentTurn = engineRef.current.getTurn();
      const hand = engineRef.current.getHandForColor(currentTurn);
      if (!hand.includes(cardId)) {
        addLog(`Card [${card.name}] is not in hand.`, 'system');
        return;
      }

      // Check all empowered moves on the board for this card
      const allCardMoves = engineRef.current
        .getEmpoweredMoves()
        .filter((m) => m.cardId === cardId);

      if (allCardMoves.length === 0) {
        addLog(`No valid tactical targets on board for [${card.name}].`, 'system');
        cancelPendingCardMove();
        return;
      }

      setSelectedCardId(cardId);
      setSelectedCard(card);

      // If an anchor piece was already selected and it can use this card:
      if (selectedSquare) {
        const pieceMoves = allCardMoves.filter((m) => m.from === selectedSquare);
        if (pieceMoves.length > 0) {
          setupAnchorCardMoves(pieceMoves);
          return;
        }
      }

      // If all candidate moves originate from a single piece on the board, auto-focus that piece!
      const uniqueFromSquares = Array.from(new Set(allCardMoves.map((m) => m.from)));
      if (uniqueFromSquares.length === 1) {
        const singleAnchor = uniqueFromSquares[0];
        setSelectedSquare(singleAnchor);
        const legalStandard = engineRef.current.getLegalMoves(singleAnchor).map((m) => m.to);
        setLegalMovesForSelected(legalStandard);
        const anchorMoves = allCardMoves.filter((m) => m.from === singleAnchor);
        setupAnchorCardMoves(anchorMoves);
      } else {
        // Multiple candidate pieces on the board
        clearPieceSelection();
        setEmpoweredMovesForSelected(allCardMoves);
      }
    },
    [
      gameState.isGameOver,
      gameState.turn,
      isAiThinking,
      mode,
      playerColor,
      selectedCardId,
      selectedSquare,
      cancelPendingCardMove,
      clearPieceSelection,
      addLog,
      isViewingHistory,
    ]
  );

  // Trigger AI turn execution (with Card-Aware 36-Playbook unified evaluation)
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

        // Unified Card-Aware Alpha-Beta Decision
        const decision = computeBestTurn(engine, aiColor, aiDifficulty, undefined, { deterministic: false });

        if (decision.type === 'empowered' && decision.empoweredMove) {
          const emp = decision.empoweredMove;
          const empRes = engine.makeEmpoweredMove(emp);
          if (empRes.success) {
            playCardSound();
            const cardName = emp.metadata?.cardName || emp.cardId;
            addLog(
              `AI Bot played [${cardName}] ➔ ${emp.to}`,
              'card',
              aiColor
            );

            if (engine.inCheck()) {
              setTimeout(playCheckSound, 120);
            }
            if (engine.isGameOver()) {
              const winner = engine.getWinner();
              if (winner === playerColor) {
                playVictorySound();
              } else if (winner && winner !== 'draw') {
                playDefeatSound();
              }
            }

            const cardTag = getCardTag(emp.cardId);
            const cardDef = getCardById(emp.cardId);
            const isCapture = Boolean(engine.getPiece(emp.to)) || emp.actionType === 'ranged_capture';
            const san = formatEmpoweredMoveSan(cardDef?.anchor || 'p', emp.from, emp.to, isCapture);

            const turnRecord: RecordedTurn = {
              turnNumber: engine.getTurnNumber(),
              player: aiColor,
              chessMove: { from: emp.from, to: emp.to },
              cardAction: {
                cardId: emp.cardId,
                anchorSquare: emp.from,
                targetSquare: emp.to,
                extraSquare: emp.extraSquare,
              },
              cardCode: cardTag?.code,
              cardPieceType: cardTag?.pieceType,
              san,
              fenAfter: engine.getFen(),
              stateSnapshot: engine.getState(),
              combatText: `AI Bot played [${cardName}] ➔ ${emp.to}`,
              timestamp: Date.now(),
            };
            setViewIndex(null);
            setRecordedTurns((prev) => [...prev, turnRecord]);
            syncState();
            setIsAiThinking(false);
            return;
          }
        }

        // Standard chess move execution
        const moveRes = engine.makeMove(decision.move);
        if (moveRes.success && moveRes.move) {
          const moveSan = moveRes.move.san || `${decision.move.from}-${decision.move.to}`;
          const moveDesc = moveSan;
          if (moveRes.move.captured) {
            playCaptureSound();
            addLog(
              `AI Bot captured ${moveRes.move.captured.toUpperCase()} with ${moveDesc}`,
              'move',
              aiColor
            );
          } else {
            playMoveSound();
            addLog(`AI Bot moved ${moveDesc}`, 'move', aiColor);
          }

          if (engine.inCheck()) {
            setTimeout(playCheckSound, 120);
          }
          if (engine.isGameOver()) {
            const winner = engine.getWinner();
            if (winner === playerColor) {
              playVictorySound();
            } else if (winner && winner !== 'draw') {
              playDefeatSound();
            }
          }

          const turnRecord: RecordedTurn = {
            turnNumber: engine.getTurnNumber(),
            player: aiColor,
            chessMove: decision.move,
            cardAction: decision.cardToPlay,
            san: moveSan,
            fenAfter: engine.getFen(),
            stateSnapshot: engine.getState(),
            combatText: `AI Bot moved ${moveDesc}`,
            timestamp: Date.now(),
          };
          setViewIndex(null);
          setRecordedTurns((prev) => [...prev, turnRecord]);
        }

        syncState();
      } catch (err: any) {
        console.error('AI decision error:', err);
      } finally {
        setIsAiThinking(false);
      }
    }, 200);
  }, [gameState.isGameOver, playerColor, aiDifficulty, addLog, syncState]);

  // Execute standard chess move (immediate on click, no confirmation prompt)
  const makeMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      if (gameState.isGameOver || isAiThinking || isViewingHistory) return false;

      const currentTurn = engineRef.current.getTurn();
      if ((mode === 'ai' || mode === 'multiplayer') && currentTurn !== playerColor) return false;

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
      if (engineRef.current.isGameOver()) {
        const winner = engineRef.current.getWinner();
        if (winner === playerColor) {
          playVictorySound();
        } else if (winner && winner !== 'draw') {
          playDefeatSound();
        }
      }

      const actualPromotion = res.move.promotion;
      const turnRecord: RecordedTurn = {
        turnNumber: engineRef.current.getTurnNumber(),
        player: currentTurn,
        chessMove: { from, to, promotion: actualPromotion },
        cardAction: lastCardActionRef.current || undefined,
        san: moveSan,
        fenAfter: engineRef.current.getFen(),
        stateSnapshot: engineRef.current.getState(),
        combatText: `${currentTurn === 'w' ? 'White' : 'Black'} moved ${moveSan}`,
        timestamp: Date.now(),
      };
      lastCardActionRef.current = null;
      setViewIndex(null);
      setRecordedTurns((prev) => [...prev, turnRecord]);

      cancelPendingCardMove();
      syncState();

      if (onTurnComplete) {
        const payload: DeckChessTurnPayload = {
          turnNumber: engineRef.current.getTurnNumber(),
          playerColor: currentTurn,
          chessMove: { from, to, promotion: actualPromotion },
          resultingFen: engineRef.current.getFen(),
          activeModifiers: engineRef.current.getActiveModifiers(),
        };
        onTurnComplete(payload);
      }

      if (mode === 'ai' && !engineRef.current.isGameOver()) {
        setTimeout(triggerAiTurn, 100);
      }

      return true;
    },
    [
      gameState.isGameOver,
      isAiThinking,
      isViewingHistory,
      mode,
      playerColor,
      addLog,
      cancelPendingCardMove,
      syncState,
      onTurnComplete,
      triggerAiTurn,
    ]
  );

  // Confirm pending card move (executed when Big Green Check ✓ is clicked)
  const confirmPendingCardMove = useCallback(() => {
    if (!pendingCardMove) return false;
    if (gameState.isGameOver || isAiThinking || isViewingHistory) return false;
    const currentTurn = engineRef.current.getTurn();
    if ((mode === 'ai' || mode === 'multiplayer') && currentTurn !== playerColor) return false;

    const move: EmpoweredMove = pendingCardMove;
    const targetPiece = engineRef.current.getPiece(move.to);
    const isCapture =
      Boolean(targetPiece && targetPiece.color !== currentTurn) ||
      move.actionType === 'ranged_capture';

    const res = engineRef.current.makeEmpoweredMove(move);
    if (!res.success) {
      addLog(`Card move failed: ${res.error || 'Unknown error'}`, 'system');
      cancelPendingCardMove();
      return false;
    }

    playCardSound();
    if (isCapture) {
      setTimeout(playCaptureSound, 60);
    }
    if (engineRef.current.inCheck()) {
      setTimeout(playCheckSound, 120);
    }
    if (engineRef.current.isGameOver()) {
      const winner = engineRef.current.getWinner();
      if (winner === playerColor) {
        playVictorySound();
      } else if (winner && winner !== 'draw') {
        playDefeatSound();
      }
    }

    const cardDef = getCardById(move.cardId);
    const cardTag = getCardTag(move.cardId);
    const cardName = move.metadata?.cardName || cardDef?.name || move.cardId;
    const san = formatEmpoweredMoveSan(
      cardDef?.anchor || 'p',
      move.from,
      move.to,
      isCapture
    );
    addLog(
      `${currentTurn === 'w' ? 'White' : 'Black'} played [${cardName}] ➔ ${move.to}`,
      'card',
      currentTurn
    );

    const turnRecord: RecordedTurn = {
      turnNumber: engineRef.current.getTurnNumber(),
      player: currentTurn,
      chessMove: { from: move.from, to: move.to },
      cardAction: {
        cardId: move.cardId,
        anchorSquare: move.from,
        targetSquare: move.to,
        extraSquare: move.extraSquare,
      },
      cardCode: cardTag?.code,
      cardPieceType: cardTag?.pieceType,
      san,
      fenAfter: engineRef.current.getFen(),
      stateSnapshot: engineRef.current.getState(),
      combatText: `${currentTurn === 'w' ? 'White' : 'Black'} played [${cardName}] ➔ ${move.to}`,
      timestamp: Date.now(),
    };
    lastCardActionRef.current = null;
    setViewIndex(null);
    setRecordedTurns((prev) => [...prev, turnRecord]);

    cancelPendingCardMove();
    syncState();

    if (onTurnComplete) {
      const payload: DeckChessTurnPayload = {
        turnNumber: engineRef.current.getTurnNumber(),
        playerColor: currentTurn,
        chessMove: { from: move.from, to: move.to },
        cardAction: {
          cardId: move.cardId,
          anchorSquare: move.from,
          targetSquare: move.to,
          extraSquare: move.extraSquare,
        },
        resultingFen: engineRef.current.getFen(),
        activeModifiers: engineRef.current.getActiveModifiers(),
      };
      onTurnComplete(payload);
    }

    if (mode === 'ai' && !engineRef.current.isGameOver()) {
      setTimeout(triggerAiTurn, 100);
    }

    return true;
  }, [
    pendingCardMove,
    gameState.isGameOver,
    isAiThinking,
    isViewingHistory,
    mode,
    playerColor,
    addLog,
    cancelPendingCardMove,
    syncState,
    onTurnComplete,
    triggerAiTurn,
  ]);

  // Square click coordinator (Decoupled Standard Moves & Card-Armed State Machine)
  const handleSquareClick = useCallback(
    (square: string) => {
      if (gameState.isGameOver || isAiThinking || isViewingHistory) return;
      const activeTurn = engineRef.current.getTurn();
      if ((mode === 'ai' || mode === 'multiplayer') && activeTurn !== playerColor) return;

      const clickedPiece = engineRef.current.getPiece(square);

      // 1. If an outcome preview is already pending confirmation, clicking outside or another piece cancels preview
      if (pendingCardMove) {
        if (clickedPiece && clickedPiece.color === activeTurn) {
          cancelPendingCardMove();
          setSelectedSquare(square);
          const legalStandard = engineRef.current.getLegalMoves(square).map((m) => m.to);
          setLegalMovesForSelected(legalStandard);
          setEmpoweredMovesForSelected([]);
          return;
        }
        cancelPendingCardMove();
        return;
      }

      // 2. Initial Piece Click (No piece currently selected)
      if (!selectedSquare) {
        if (clickedPiece && clickedPiece.color === activeTurn) {
          setSelectedSquare(square);
          const legalStandard = engineRef.current.getLegalMoves(square).map((m) => m.to);
          setLegalMovesForSelected(legalStandard);

          // If a card was ALREADY armed in hand, filter empowered moves for this card on this piece
          if (selectedCardId) {
            const pieceEmpowered = engineRef.current
              .getEmpoweredMoves(square)
              .filter((m) => m.cardId === selectedCardId);
            if (pieceEmpowered.length > 0) {
              setEmpoweredMovesForSelected(pieceEmpowered);
              const extraSquares = Array.from(new Set(pieceEmpowered.map((m) => m.extraSquare).filter(Boolean)));
              if (extraSquares.length > 1) {
                setDisambiguationCandidates(pieceEmpowered);
              }
            } else {
              // Clicked piece cannot use this card -> automatically disarm card and show standard moves!
              setSelectedCardId(null);
              setSelectedCard(null);
              setEmpoweredMovesForSelected([]);
            }
          } else {
            // When no card is armed, piece click ONLY produces standard chess moves
            setEmpoweredMovesForSelected([]);
          }
        }
        return;
      }

      // Clicking currently selected piece deselects it
      if (selectedSquare === square) {
        clearPieceSelection();
        setSelectedCardId(null);
        setSelectedCard(null);
        setDisambiguationCandidates(null);
        return;
      }

      // 3. CASE A: NO CARD ARMED (selectedCardId === null)
      // Standard chess moves execute immediately without any card interception
      if (!selectedCardId) {
        // Standard legal move executed instantly (or opens promotion picker if pawn reaches back rank)
        if (legalMovesForSelected.includes(square)) {
          const movingPiece = engineRef.current.getPiece(selectedSquare);
          const isPawnPromotion =
            movingPiece &&
            movingPiece.type === 'p' &&
            ((movingPiece.color === 'w' && square[1] === '8') ||
              (movingPiece.color === 'b' && square[1] === '1'));
          if (isPawnPromotion) {
            setPendingPromotionMove({ from: selectedSquare, to: square });
            return;
          }
          makeMove(selectedSquare, square);
          return;
        }

        // Clicking another friendly piece switches selection
        if (clickedPiece && clickedPiece.color === activeTurn) {
          setSelectedSquare(square);
          const legalStandard = engineRef.current.getLegalMoves(square).map((m) => m.to);
          setLegalMovesForSelected(legalStandard);
          setEmpoweredMovesForSelected([]);
          return;
        }

        // Clicking empty or enemy square not in legal moves clears selection
        clearPieceSelection();
        return;
      }

      // 4. CASE B: CARD IS ARMED (selectedCardId !== null)
      // Check multi-step staging (e.g. R1 Make Way pawn step-aside choice)
      if (disambiguationCandidates && disambiguationCandidates.length > 0) {
        // Did the user click one of the candidate extraSquares (e.g. pawn step-aside tile)?
        const matchingCandidate = disambiguationCandidates.filter((c) => c.extraSquare === square);
        if (matchingCandidate.length > 0) {
          const uniqueDests = Array.from(new Set(matchingCandidate.map((m) => m.to)));
          if (uniqueDests.length === 1) {
            // Exactly one Rook destination -> proceed directly to preview
            setPendingCardMove(matchingCandidate[0]);
            setDisambiguationCandidates(null);
          } else {
            // Multiple Rook destinations along the opened line!
            // Narrow candidate moves to those using this step-aside square
            setEmpoweredMovesForSelected(matchingCandidate);
            setDisambiguationCandidates(null);
          }
          return;
        }

        // If user clicked another friendly piece, automatically disarm card and select new piece
        if (clickedPiece && clickedPiece.color === activeTurn) {
          cancelPendingCardMove();
          setSelectedSquare(square);
          const legalStandard = engineRef.current.getLegalMoves(square).map((m) => m.to);
          setLegalMovesForSelected(legalStandard);
          setEmpoweredMovesForSelected([]);
          return;
        }

        // Clicking outside cancels staging and disarms
        cancelPendingCardMove();
        return;
      }

      // Check if clicking an empowered destination square
      const matchingEmpowered = empoweredMovesForSelected.filter((m) => m.to === square);
      if (matchingEmpowered.length > 0) {
        if (matchingEmpowered.length === 1) {
          setPendingCardMove(matchingEmpowered[0]);
          return;
        }

        // Multiple candidates with different extraSquares -> enter disambiguation staging
        setDisambiguationCandidates(matchingEmpowered);
        return;
      }

      // If clicking another friendly piece while a card is armed:
      if (clickedPiece && clickedPiece.color === activeTurn) {
        // Can this piece also use the armed card?
        const newPieceEmpowered = engineRef.current
          .getEmpoweredMoves(square)
          .filter((m) => m.cardId === selectedCardId);

        if (newPieceEmpowered.length > 0) {
          // Switch anchor piece and keep card armed
          setSelectedSquare(square);
          const legalStandard = engineRef.current.getLegalMoves(square).map((m) => m.to);
          setLegalMovesForSelected(legalStandard);
          setupAnchorCardMoves(newPieceEmpowered);
        } else {
          // Unrelated piece clicked -> automatically disarm card and select piece for standard moves!
          cancelPendingCardMove();
          setSelectedSquare(square);
          const legalStandard = engineRef.current.getLegalMoves(square).map((m) => m.to);
          setLegalMovesForSelected(legalStandard);
          setEmpoweredMovesForSelected([]);
        }
        return;
      }

      // Clicking illegal square disarms card and clears selection
      cancelPendingCardMove();
    },
    [
      gameState.isGameOver,
      isAiThinking,
      mode,
      playerColor,
      pendingCardMove,
      selectedSquare,
      selectedCardId,
      disambiguationCandidates,
      empoweredMovesForSelected,
      legalMovesForSelected,
      makeMove,
      clearPieceSelection,
      cancelPendingCardMove,
      isViewingHistory,
    ]
  );

  // Apply incoming turn from network (Multiplayer WebSocket)
  const applyRemoteTurn = useCallback(
    (payload: DeckChessTurnPayload) => {
      const engine = engineRef.current;

      if (payload.cardAction) {
        const { cardId, anchorSquare } = payload.cardAction;
        const cardDef = getCardById(cardId);
        engine.consumeCard(cardId, payload.playerColor);
        playCardSound();
        addLog(
          `${payload.playerColor === 'w' ? 'White' : 'Black'} played [${cardDef?.name || cardId}] on ${anchorSquare}`,
          'card',
          payload.playerColor
        );
      }

      if (payload.resultingFen) {
        engine.loadFen(payload.resultingFen);
      } else {
        engine.makeMove(payload.chessMove);
      }

      if (payload.activeModifiers) {
        engine.setActiveModifiers(payload.activeModifiers);
      }

      const moveSan = `${payload.chessMove.from}-${payload.chessMove.to}`;
      addLog(
        `${payload.playerColor === 'w' ? 'White' : 'Black'} moved ${moveSan}`,
        'move',
        payload.playerColor
      );

      playMoveSound();
      if (engine.inCheck()) {
        setTimeout(playCheckSound, 120);
      }

      const cardTag = payload.cardAction?.cardId ? getCardTag(payload.cardAction.cardId) : undefined;
      const turnRecord: RecordedTurn = {
        turnNumber: payload.turnNumber,
        player: payload.playerColor,
        chessMove: payload.chessMove,
        cardAction: payload.cardAction,
        cardCode: cardTag?.code,
        cardPieceType: cardTag?.pieceType,
        san: moveSan,
        fenAfter: payload.resultingFen || engine.getFen(),
        stateSnapshot: engine.getState(),
        combatText: `${payload.playerColor === 'w' ? 'White' : 'Black'} moved ${moveSan}`,
        timestamp: Date.now(),
      };
      setViewIndex(null);
      setRecordedTurns((prev) => [...prev, turnRecord]);

      cancelPendingCardMove();
      syncState();
    },
    [addLog, cancelPendingCardMove, syncState]
  );

  // Reset or initialize new match
  const resetGame = useCallback(
    (newWhiteDeck?: string[], newBlackDeck?: string[], initialFen?: string) => {
      engineRef.current = new DeckChessEngine(initialFen, newWhiteDeck, newBlackDeck);
      initialStateSnapshotRef.current = engineRef.current.getState();
      setViewIndex(null);
      cancelPendingCardMove();
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
    [cancelPendingCardMove, syncState]
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__DECK_CHESS_GAME__ = {
        getEngine: () => engineRef.current,
        resetGame,
        syncState,
        selectCard: selectCardFromHand,
        selectCardFromHand,
        cancelPendingCardMove,
        confirmPendingCardMove,
        handleSquareClick,
        makeMove,
        stepBackward,
        stepForward,
        stepToMove,
        jumpToLive,
        getActiveMoveIndex: () => (viewIndex !== null ? viewIndex : recordedTurns.length - 1),
        isViewingHistory: () => (viewIndex !== null && viewIndex < recordedTurns.length - 1),
        getRecordedTurns: () => recordedTurns,
      };
    }
  }, [
    resetGame,
    syncState,
    selectCardFromHand,
    cancelPendingCardMove,
    confirmPendingCardMove,
    handleSquareClick,
    makeMove,
    stepBackward,
    stepForward,
    stepToMove,
    jumpToLive,
    viewIndex,
    recordedTurns,
  ]);

  // Resign match
  const resign = useCallback(
    (color: PieceColor) => {
      engineRef.current.resign(color);
      addLog(`${color === 'w' ? 'White' : 'Black'} resigned.`, 'system');
      syncState();
    },
    [addLog, syncState]
  );

  // Select standard pawn promotion piece
  const selectPromotion = useCallback(
    (piece: 'q' | 'r' | 'b' | 'n') => {
      if (!pendingPromotionMove) return false;
      const { from, to } = pendingPromotionMove;
      setPendingPromotionMove(null);
      return makeMove(from, to, piece);
    },
    [pendingPromotionMove, makeMove]
  );

  // Change promotion piece on a pending card move
  const changeCardPromotion = useCallback(
    (piece: 'q' | 'r' | 'b' | 'n') => {
      setPendingCardMove((prev: EmpoweredMove | null) => {
        if (!prev) return prev;
        return { ...prev, promotion: piece };
      });
    },
    []
  );

  // Best-Move Hint Actions
  const requestHint = useCallback(() => {
    if (hintMove) {
      setHintMove(null);
      return;
    }
    const engine = engineRef.current;
    if (engine.isGameOver()) return;
    const best = computeBestTurn(engine, engine.getTurn(), 'tactical', undefined, { deterministic: true });
    setHintMove(best);
  }, [hintMove]);

  const clearHint = useCallback(() => {
    setHintMove(null);
  }, []);

  const applyHintMove = useCallback(() => {
    if (!hintMove) return;
    const engine = engineRef.current;
    if (hintMove.type === 'empowered' && hintMove.empoweredMove) {
      let emp = hintMove.empoweredMove;
      if (!emp.previewFen) {
        const fullEmpowered = engine.getEmpoweredMoves(emp.from);
        const match = fullEmpowered.find(
          (m) =>
            m.cardId === emp.cardId &&
            m.to === emp.to &&
            (!emp.extraSquare || m.extraSquare === emp.extraSquare)
        );
        if (match) emp = match;
      }
      setPendingCardMove(emp);
      setHintMove(null);
    } else if (hintMove.type === 'standard' && hintMove.move) {
      makeMove(hintMove.move.from, hintMove.move.to, hintMove.move.promotion);
      setHintMove(null);
    }
  }, [hintMove, makeMove]);

  // Auto-trigger AI turn whenever it is the AI's turn
  useEffect(() => {
    if (
      mode === 'ai' &&
      !gameState.isGameOver &&
      !isAiThinking &&
      gameState.turn !== playerColor
    ) {
      const timer = setTimeout(triggerAiTurn, 400);
      return () => clearTimeout(timer);
    }
  }, [mode, gameState.isGameOver, isAiThinking, gameState.turn, playerColor, triggerAiTurn]);

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
    displayedState,
    fen: displayedState.fen,
    turn: displayedState.turn,
    turnNumber: displayedState.turnNumber,
    hasPlayedCardThisTurn: displayedState.cardPlayedThisTurn,
    whiteHand: displayedState.whiteHand,
    blackHand: displayedState.blackHand,
    graveyard: displayedState.graveyard,
    activeModifiers: displayedState.activeModifiers,
    isGameOver: displayedState.isGameOver,
    winner: displayedState.winner,
    finishReason: displayedState.finishReason,
    inCheck: displayedState.inCheck,
    isAiThinking,

    // Timeline Scrubber & Inspection
    viewIndex,
    activeMoveIndex,
    isViewingHistory,
    stepBackward,
    stepForward,
    stepToMove,
    jumpToLive,
    lastMoveHighlight:
      activeMoveIndex >= 0 && recordedTurns[activeMoveIndex]
        ? {
            from: recordedTurns[activeMoveIndex].chessMove.from,
            to: recordedTurns[activeMoveIndex].chessMove.to,
          }
        : gameState.lastMove
        ? { from: gameState.lastMove.from, to: gameState.lastMove.to }
        : null,

    // Selection & Targeting State
    selectedCard,
    selectedCardId,
    hoveredCardId,
    setHoveredCard: setHoveredCardId,
    disambiguationCandidates,
    pendingCardMove,
    pendingPromotionMove,
    targetingStage,
    selectedAnchorSquare,
    selectedTargetSquare,
    validAnchorSquares,
    validTargetSquares,
    selectedSquare,
    legalMovesForSelected,
    empoweredMoves: empoweredMovesForSelected,
    activeCardIdsForPiece,

    // Combat Log & Match Records
    combatLog,
    recordedTurns,

    // Evaluation & Hints
    evaluation,
    hintMove,
    requestHint,
    clearHint,
    applyHintMove,

    // Actions
    handleSquareClick,
    selectCard: selectCardFromHand,
    selectCardFromHand,
    confirmPendingCardMove,
    cancelPendingCardMove,
    cancelCardSelection,
    selectPromotion,
    changeCardPromotion,
    makeMove,
    makeEmpoweredMove: confirmPendingCardMove,
    applyRemoteTurn,
    resetGame,
    resign,
  };
}
