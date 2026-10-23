import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  RoomState,
  PlayerRole,
  TurnColor,
  FinishReason,
  ChatMessage,
  ClientMessage,
  ServerMessage,
} from '../types/room';

export interface UseGameRoomOptions {
  roomCode: string;
  user?: {
    id: string;
    username: string;
    isGuest?: boolean;
  } | null;
  timeControl?: string;
  variant?: string;
}

export interface UseGameRoomReturn {
  roomState: RoomState | null;
  yourRole: PlayerRole;
  connectionStatus: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
  latencyMs: number;
  messages: ChatMessage[];
  error: string | null;
  drawOfferedBy: TurnColor | null;
  disconnectGraceExpiresAt: number | null;
  interpolatedClocks: { whiteMs: number; blackMs: number };
  sendTurn: (payload: unknown, gameOver?: boolean, winner?: TurnColor | 'draw', finishReason?: FinishReason) => void;
  resign: () => void;
  offerDraw: () => void;
  acceptDraw: () => void;
  sendChat: (text: string) => void;
}

const getTabSessionId = (code: string): string => {
  if (typeof window === 'undefined') return 'tab_0';
  try {
    let id = sessionStorage.getItem(`wormhole_tab_id_${code.toUpperCase()}`);
    if (!id) {
      id = Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem(`wormhole_tab_id_${code.toUpperCase()}`, id);
    }
    return id;
  } catch {
    return Math.random().toString(36).substring(2, 9);
  }
};

export function useGameRoom({
  roomCode,
  user,
  timeControl = '5+0',
  variant = 'deck_builder',
}: UseGameRoomOptions): UseGameRoomReturn {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [yourRole, setYourRole] = useState<PlayerRole>('spectator');
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'reconnecting' | 'disconnected'
  >('connecting');
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [drawOfferedBy, setDrawOfferedBy] = useState<TurnColor | null>(null);
  const [disconnectGraceExpiresAt, setDisconnectGraceExpiresAt] = useState<number | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  const wsRef = useRef<WebSocket | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const isDevFallbackRef = useRef<boolean>(false);
  const pingTimestampRef = useRef<number>(0);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimerRef = useRef<any>(null);
  const pingTimerRef = useRef<any>(null);
  const isUnmountedRef = useRef<boolean>(false);

  // Smooth local ticker (updates every 200ms when game is in progress)
  useEffect(() => {
    if (roomState?.status === 'in_progress' && !roomState.clock.isUntimed) {
      const ticker = setInterval(() => {
        setNowTimestamp(Date.now());
      }, 200);
      return () => clearInterval(ticker);
    }
  }, [roomState?.status, roomState?.clock.isUntimed]);

  // Helper to initialize local BroadcastChannel room for local dev testing
  const initLocalDevChannel = useCallback(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
    if (bcRef.current) return;

    isDevFallbackRef.current = true;
    const channelName = `wormhole_dev_room_${roomCode.toUpperCase()}`;
    const bc = new BroadcastChannel(channelName);
    bcRef.current = bc;

    const storageKey = `wormhole_room_state_${roomCode.toUpperCase()}`;
    const stored = localStorage.getItem(storageKey);
    let state: RoomState;

    const initialSeconds = timeControl === '3+0' ? 180 : timeControl === '10+0' ? 600 : timeControl === 'untimed' ? 0 : 300;
    const isUntimed = timeControl === 'untimed';

    const tabId = getTabSessionId(roomCode);
    const userId = user?.id ? `${user.id}_tab_${tabId}` : `local_user_${tabId}`;
    const baseUsername = user?.username || `Player_${tabId.slice(-4)}`;

    if (!stored) {
      // First tab to open: White player, status = 'waiting'
      state = {
        roomCode: roomCode.toUpperCase(),
        variant: variant || 'deck_builder',
        status: 'waiting',
        whitePlayer: {
          userId,
          username: baseUsername,
          isGuest: true,
          connected: true,
          disconnectedAt: null,
        },
        blackPlayer: null,
        spectators: [],
        activeTurn: null,
        clock: {
          initialSeconds,
          incrementSeconds: 0,
          whiteMs: initialSeconds * 1000,
          blackMs: initialSeconds * 1000,
          lastTurnTimestamp: null,
          isUntimed,
        },
        turnNumber: 1,
        moveHistory: [],
        winner: null,
        finishReason: null,
        startedAt: null,
        endedAt: null,
      };
      setYourRole('white');
      setRoomState(state);
      localStorage.setItem(storageKey, JSON.stringify(state));
    } else {
      const parsed: RoomState = JSON.parse(stored);
      if (!parsed.blackPlayer && parsed.whitePlayer?.userId !== userId) {
        // Second tab to open: Black player, starts the match!
        const challengerName = parsed.whitePlayer?.username === baseUsername
          ? `${baseUsername} (Challenger)`
          : baseUsername;

        parsed.blackPlayer = {
          userId,
          username: challengerName,
          isGuest: true,
          connected: true,
          disconnectedAt: null,
        };
        parsed.status = 'in_progress';
        parsed.startedAt = Date.now();
        parsed.activeTurn = 'white';
        parsed.clock.lastTurnTimestamp = Date.now();
        state = parsed;
        setYourRole('black');
        setRoomState(state);
        localStorage.setItem(storageKey, JSON.stringify(state));
        bc.postMessage({ type: 'game_started', state });
      } else if (parsed.whitePlayer?.userId === userId) {
        state = parsed;
        setYourRole('white');
        setRoomState(state);
      } else if (parsed.blackPlayer?.userId === userId) {
        state = parsed;
        setYourRole('black');
        setRoomState(state);
      } else {
        state = parsed;
        setYourRole('spectator');
        setRoomState(state);
      }
    }

    setConnectionStatus('connected');
    setError(null);

    bc.onmessage = (event) => {
      if (isUnmountedRef.current) return;
      const msg = event.data;
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case 'game_started':
          setRoomState(msg.state);
          localStorage.setItem(storageKey, JSON.stringify(msg.state));
          break;
        case 'turn_played':
          setRoomState((prev) => {
            if (!prev) return null;
            const nextState: RoomState = {
              ...prev,
              turnNumber: msg.turnNumber + 1,
              activeTurn: msg.activeTurn,
              clock: msg.clock,
              moveHistory: [
                ...prev.moveHistory,
                {
                  turnNumber: msg.turnNumber,
                  player: prev.activeTurn || 'white',
                  payload: msg.payload,
                  timestamp: Date.now(),
                },
              ],
            };
            localStorage.setItem(storageKey, JSON.stringify(nextState));
            return nextState;
          });
          setDrawOfferedBy(null);
          break;
        case 'chat':
          setMessages((prev) => [...prev, msg]);
          break;
        case 'game_over':
          setRoomState(msg.state);
          localStorage.setItem(storageKey, JSON.stringify(msg.state));
          break;
        case 'draw_offered':
          setDrawOfferedBy(msg.fromRole);
          break;
      }
    };
  }, [roomCode, user?.id, user?.username, timeControl, variant]);

  const sendMessage = useCallback(
    (msg: ClientMessage) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(msg));
        return;
      }

      // Local BroadcastChannel fallback handler
      if (bcRef.current && roomState) {
        const storageKey = `wormhole_room_state_${roomCode.toUpperCase()}`;
        if (msg.type === 'turn') {
          const nextTurnColor: TurnColor = roomState.activeTurn === 'white' ? 'black' : 'white';
          const now = Date.now();
          const clock = { ...roomState.clock, lastTurnTimestamp: now };
          const turnMsg = {
            type: 'turn_played',
            turnNumber: roomState.turnNumber,
            activeTurn: nextTurnColor,
            payload: msg.payload,
            clock,
          };

          setRoomState((prev) => {
            if (!prev) return null;
            const nextState: RoomState = {
              ...prev,
              turnNumber: prev.turnNumber + 1,
              activeTurn: nextTurnColor,
              clock,
              moveHistory: [
                ...prev.moveHistory,
                {
                  turnNumber: prev.turnNumber,
                  player: prev.activeTurn || 'white',
                  payload: msg.payload,
                  timestamp: now,
                },
              ],
            };
            localStorage.setItem(storageKey, JSON.stringify(nextState));
            return nextState;
          });

          bcRef.current.postMessage(turnMsg);
        } else if (msg.type === 'chat') {
          const chatMsg: ChatMessage = {
            sender: user?.username || (yourRole === 'white' ? 'White' : 'Black'),
            role: yourRole,
            text: msg.text,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, chatMsg]);
          bcRef.current.postMessage(chatMsg);
        } else if (msg.type === 'resign') {
          const winner: TurnColor = yourRole === 'white' ? 'black' : 'white';
          const gameOverState: RoomState = {
            ...roomState,
            status: 'finished',
            winner,
            finishReason: 'resignation',
            endedAt: Date.now(),
          };
          setRoomState(gameOverState);
          localStorage.setItem(storageKey, JSON.stringify(gameOverState));
          bcRef.current.postMessage({ type: 'game_over', state: gameOverState });
        } else if (msg.type === 'draw_offer') {
          bcRef.current.postMessage({ type: 'draw_offered', fromRole: yourRole });
        } else if (msg.type === 'draw_accept') {
          const drawState: RoomState = {
            ...roomState,
            status: 'finished',
            winner: 'draw',
            finishReason: 'draw_agreement',
            endedAt: Date.now(),
          };
          setRoomState(drawState);
          localStorage.setItem(storageKey, JSON.stringify(drawState));
          bcRef.current.postMessage({ type: 'game_over', state: drawState });
        }
      }
    },
    [roomCode, roomState, yourRole, user?.username]
  );

  const connect = useCallback(() => {
    if (!roomCode || isUnmountedRef.current) return;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const params = new URLSearchParams();
    const tabId = getTabSessionId(roomCode);
    const resolvedUserId = user?.id ? `${user.id}_tab_${tabId}` : `guest_${tabId}`;
    params.set('userId', resolvedUserId);
    if (user?.username) params.set('username', user.username);
    if (user?.isGuest !== undefined) params.set('isGuest', String(user.isGuest));
    if (timeControl) params.set('timeControl', timeControl);
    if (variant) params.set('variant', variant);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const wsUrl = `${protocol}//${window.location.host}/api/room/${roomCode}${qs}`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (isUnmountedRef.current) return;
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        setError(null);

        // Start ping heartbeat every 20 seconds
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            pingTimestampRef.current = performance.now();
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
      };

      socket.onmessage = (event) => {
        if (isUnmountedRef.current) return;
        try {
          const msg = JSON.parse(event.data) as ServerMessage;

          switch (msg.type) {
            case 'sync':
              setRoomState(msg.state);
              setYourRole(msg.yourRole);
              break;

            case 'turn_played':
              setRoomState((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  turnNumber: msg.turnNumber + 1,
                  activeTurn: msg.activeTurn,
                  clock: msg.clock,
                  moveHistory: [
                    ...prev.moveHistory,
                    {
                      turnNumber: msg.turnNumber,
                      player: prev.activeTurn || 'white',
                      payload: msg.payload,
                      timestamp: Date.now(),
                    },
                  ],
                };
              });
              setDrawOfferedBy(null);
              break;

            case 'player_joined':
              setRoomState((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  [msg.role === 'white' ? 'whitePlayer' : 'blackPlayer']: msg.player,
                };
              });
              break;

            case 'player_reconnected':
              setDisconnectGraceExpiresAt(null);
              setRoomState((prev) => {
                if (!prev) return null;
                const slotKey = msg.role === 'white' ? 'whitePlayer' : 'blackPlayer';
                const currentSlot = prev[slotKey];
                if (!currentSlot) return prev;
                return {
                  ...prev,
                  [slotKey]: {
                    ...currentSlot,
                    connected: true,
                    disconnectedAt: null,
                  },
                };
              });
              break;

            case 'player_disconnected':
              if (msg.graceExpiresAt) {
                setDisconnectGraceExpiresAt(msg.graceExpiresAt);
              }
              setRoomState((prev) => {
                if (!prev) return null;
                const slotKey = msg.role === 'white' ? 'whitePlayer' : 'blackPlayer';
                const currentSlot = prev[slotKey];
                if (!currentSlot) return prev;
                return {
                  ...prev,
                  [slotKey]: {
                    ...currentSlot,
                    connected: false,
                    disconnectedAt: Date.now(),
                  },
                };
              });
              break;

            case 'game_started':
              setRoomState(msg.state);
              break;

            case 'game_over':
              setRoomState(msg.state);
              setDisconnectGraceExpiresAt(null);
              break;

            case 'draw_offered':
              setDrawOfferedBy(msg.fromRole);
              break;

            case 'chat':
              setMessages((prev) => [...prev, msg]);
              break;

            case 'pong':
              if (pingTimestampRef.current > 0) {
                setLatencyMs(Math.round(performance.now() - pingTimestampRef.current));
              }
              break;

            case 'error':
              setError(msg.message);
              break;
          }
        } catch (e) {
          console.warn('[useGameRoom] Error parsing message:', e);
        }
      };

      socket.onclose = () => {
        if (isUnmountedRef.current) return;
        clearInterval(pingTimerRef.current);

        const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isLocalHost && !bcRef.current) {
          initLocalDevChannel();
          return;
        }

        setConnectionStatus('reconnecting');
        const backoffMs = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, backoffMs);
      };

      socket.onerror = () => {
        if (isUnmountedRef.current) return;
        const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isLocalHost && !bcRef.current) {
          initLocalDevChannel();
          return;
        }
        setConnectionStatus('disconnected');
      };
    } catch (err: any) {
      const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isLocalHost && !bcRef.current) {
        initLocalDevChannel();
        return;
      }
      setError(err?.message || 'Failed to establish WebSocket connection');
      setConnectionStatus('disconnected');
    }
  }, [roomCode, user?.id, user?.username, user?.isGuest, timeControl, variant, initLocalDevChannel]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      clearInterval(pingTimerRef.current);
      clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (bcRef.current) {
        bcRef.current.close();
        bcRef.current = null;
      }
    };
  }, [connect]);

  // Interpolated smooth clock calculation
  const interpolatedClocks = {
    whiteMs: roomState?.clock.whiteMs ?? 0,
    blackMs: roomState?.clock.blackMs ?? 0,
  };

  if (
    roomState &&
    roomState.status === 'in_progress' &&
    !roomState.clock.isUntimed &&
    roomState.clock.lastTurnTimestamp &&
    roomState.activeTurn
  ) {
    const elapsed = Math.max(0, nowTimestamp - roomState.clock.lastTurnTimestamp);
    if (roomState.activeTurn === 'white') {
      interpolatedClocks.whiteMs = Math.max(0, roomState.clock.whiteMs - elapsed);
    } else {
      interpolatedClocks.blackMs = Math.max(0, roomState.clock.blackMs - elapsed);
    }
  }

  const sendTurn = useCallback(
    (payload: unknown, gameOver?: boolean, winner?: TurnColor | 'draw', finishReason?: FinishReason) => {
      sendMessage({ type: 'turn', payload, gameOver, winner, finishReason });
    },
    [sendMessage]
  );

  const resign = useCallback(() => {
    sendMessage({ type: 'resign' });
  }, [sendMessage]);

  const offerDraw = useCallback(() => {
    sendMessage({ type: 'draw_offer' });
  }, [sendMessage]);

  const acceptDraw = useCallback(() => {
    sendMessage({ type: 'draw_accept' });
    setDrawOfferedBy(null);
  }, [sendMessage]);

  const sendChat = useCallback(
    (text: string) => {
      if (text.trim()) {
        sendMessage({ type: 'chat', text });
      }
    },
    [sendMessage]
  );

  return {
    roomState,
    yourRole,
    connectionStatus,
    latencyMs,
    messages,
    error,
    drawOfferedBy,
    disconnectGraceExpiresAt,
    interpolatedClocks,
    sendTurn,
    resign,
    offerDraw,
    acceptDraw,
    sendChat,
  };
}
