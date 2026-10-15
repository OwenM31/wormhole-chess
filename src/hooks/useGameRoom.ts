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

export function useGameRoom({
  roomCode,
  user,
  timeControl,
  variant,
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

  const sendMessage = useCallback((msg: ClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const connect = useCallback(() => {
    if (!roomCode || isUnmountedRef.current) return;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const params = new URLSearchParams();
    if (user?.id) params.set('userId', user.id);
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
        setConnectionStatus('reconnecting');

        // Exponential backoff reconnection: min 1s, max 10s
        const backoffMs = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, backoffMs);
      };

      socket.onerror = () => {
        if (isUnmountedRef.current) return;
        setConnectionStatus('disconnected');
      };
    } catch (err: any) {
      setError(err?.message || 'Failed to establish WebSocket connection');
      setConnectionStatus('disconnected');
    }
  }, [roomCode, user?.id, user?.username, user?.isGuest, timeControl, variant]);

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
