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
} from '../types/deckChess';
import { DeckChessEngine, DeckChessEngineState } from '../engine/DeckChessEngine';
import { computeBestTurn, evaluateBoard } from '../engine/DeckChessAI';
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

  // Card targeting & selection state
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [disambiguationCandidates, setDisambiguationCandidates] = useState<EmpoweredMove[] | null>(null);
  const [pendingCardMove, setPendingCardMove] = useState<EmpoweredMove[] | null | any>(null);

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

  // Clear piece selection
  const clearPieceSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalMovesForSelected([]);
    setEmpoweredMovesForSelected([]);
  }, []);

  // Cancel any pending card move or selection
  const cancelPendingCardMove = useCallback(() => {
    setPendingCardMove(null);
    setDisambiguationCandidates(null);
    setSelectedCardId(null);
    setSelectedCard(null);
    setTargetingStage('none');
    clearPieceSelection();
  }, [clearPieceSelection]);

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

  // Card selection from tactical hand bar (Card-First Flow & Arm/Disarm Toggle)
  const selectCardFromHand = useCallback(
    (cardId: string) => {
      if (gameState.isGameOver || isAiThinking) return;
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
          setEmpoweredMovesForSelected(pieceMoves);
          const extraSquares = Array.from(new Set(pieceMoves.map((m) => m.extraSquare).filter(Boolean)));
          if (extraSquares.length > 1) {
            setDisambiguationCandidates(pieceMoves);
          } else if (pieceMoves.length === 1 && !pieceMoves[0].extraSquare) {
            setPendingCardMove(pieceMoves[0]);
          }
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
        setEmpoweredMovesForSelected(anchorMoves);
        const extraSquares = Array.from(new Set(anchorMoves.map((m) => m.extraSquare).filter(Boolean)));
        if (extraSquares.length > 1) {
          setDisambiguationCandidates(anchorMoves);
        } else if (anchorMoves.length === 1 && !anchorMoves[0].extraSquare) {
          setPendingCardMove(anchorMoves[0]);
        }
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
    ]
  );

  // Trigger AI turn execution (with Card-Aware 36-Playbook evaluation)
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

        // 1. Evaluate tactical 36-Playbook empowered moves
        const empoweredMoves = engine.getEmpoweredMoves();
        const currentScore = evaluateBoard(engine, aiColor);
        let bestEmpowered: EmpoweredMove | null = null;
        let bestEmpoweredGain = 0;

        if (aiDifficulty !== 'easy' && empoweredMoves.length > 0) {
          for (const emp of empoweredMoves) {
            const sim = engine.clone();
            const res = sim.makeEmpoweredMove(emp);
            if (res.success && !sim.isCheckmate()) {
              const evalAfter = evaluateBoard(sim, aiColor);
              const gain = evalAfter - currentScore;
              if (gain > bestEmpoweredGain && gain >= 30) {
                bestEmpoweredGain = gain;
                bestEmpowered = emp;
              }
            }
          }
        }

        // 2. If a favorable empowered card move is found, execute it!
        if (bestEmpowered && bestEmpoweredGain >= 30) {
          const empRes = engine.makeEmpoweredMove(bestEmpowered);
          if (empRes.success) {
            playCardSound();
            const cardName = bestEmpowered.metadata?.cardName || bestEmpowered.cardId;
            addLog(
              `AI Bot played [${cardName}] ➔ ${bestEmpowered.to}`,
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

            const turnRecord: RecordedTurn = {
              turnNumber: engine.getTurnNumber(),
              player: aiColor,
              chessMove: { from: bestEmpowered.from, to: bestEmpowered.to },
              cardAction: {
                cardId: bestEmpowered.cardId,
                anchorSquare: bestEmpowered.from,
                targetSquare: bestEmpowered.to,
                extraSquare: bestEmpowered.extraSquare,
              },
              fenAfter: engine.getFen(),
              combatText: `AI Bot played [${cardName}] ➔ ${bestEmpowered.to}`,
              timestamp: Date.now(),
            };
            setRecordedTurns((prev) => [...prev, turnRecord]);
            syncState();
            setIsAiThinking(false);
            return;
          }
        }

        // 3. Otherwise compute standard chess move via Minimax
        const decision = computeBestTurn(engine, aiColor, aiDifficulty);

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

  // Execute standard chess move (immediate on click, no confirmation prompt)
  const makeMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      if (gameState.isGameOver || isAiThinking) return false;

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
        fenAfter: engineRef.current.getFen(),
        combatText: `${currentTurn === 'w' ? 'White' : 'Black'} moved ${moveSan}`,
        timestamp: Date.now(),
      };
      lastCardActionRef.current = null;
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
    if (gameState.isGameOver || isAiThinking) return false;
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

    const cardName = move.metadata?.cardName || move.cardId;
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
      fenAfter: engineRef.current.getFen(),
      combatText: `${currentTurn === 'w' ? 'White' : 'Black'} played [${cardName}] ➔ ${move.to}`,
      timestamp: Date.now(),
    };
    lastCardActionRef.current = null;
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
      if (gameState.isGameOver || isAiThinking) return;
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
        // Standard legal move executed instantly
        if (legalMovesForSelected.includes(square)) {
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
        if (matchingEmpowered.length === 1 && (!matchingEmpowered[0].disambiguationPrompt || matchingEmpowered[0].extraSquare)) {
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
          setEmpoweredMovesForSelected(newPieceEmpowered);
          const extraSquares = Array.from(new Set(newPieceEmpowered.map((m) => m.extraSquare).filter(Boolean)));
          if (extraSquares.length > 1) {
            setDisambiguationCandidates(newPieceEmpowered);
          } else {
            setDisambiguationCandidates(null);
          }
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

      const turnRecord: RecordedTurn = {
        turnNumber: payload.turnNumber,
        player: payload.playerColor,
        chessMove: payload.chessMove,
        cardAction: payload.cardAction,
        fenAfter: payload.resultingFen || engine.getFen(),
        combatText: `${payload.playerColor === 'w' ? 'White' : 'Black'} moved ${moveSan}`,
        timestamp: Date.now(),
      };
      setRecordedTurns((prev) => [...prev, turnRecord]);

      cancelPendingCardMove();
      syncState();
    },
    [addLog, cancelPendingCardMove, syncState]
  );

  // Reset or initialize new match
  const resetGame = useCallback(
    (newWhiteDeck?: string[], newBlackDeck?: string[]) => {
      engineRef.current = new DeckChessEngine(undefined, newWhiteDeck, newBlackDeck);
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

  // Resign match
  const resign = useCallback(
    (color: PieceColor) => {
      engineRef.current.resign(color);
      addLog(`${color === 'w' ? 'White' : 'Black'} resigned.`, 'system');
      syncState();
    },
    [addLog, syncState]
  );

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
    fen: gameState.fen,
    turn: gameState.turn,
    turnNumber: gameState.turnNumber,
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
    selectedCardId,
    hoveredCardId,
    setHoveredCard: setHoveredCardId,
    disambiguationCandidates,
    pendingCardMove,
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

    // Actions
    handleSquareClick,
    selectCard: selectCardFromHand,
    selectCardFromHand,
    confirmPendingCardMove,
    cancelPendingCardMove,
    cancelCardSelection,
    makeMove,
    makeEmpoweredMove: confirmPendingCardMove,
    applyRemoteTurn,
    resetGame,
    resign,
  };
}
