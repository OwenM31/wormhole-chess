import type { QueueMetrics } from '../types/room';

export interface QueueStatsResponse {
  success: boolean;
  inQueue: {
    deck_builder: number;
    wormhole_3d: number;
    total: number;
  };
  activeMatches: number;
  totalOnline: number;
  error?: string;
}

export async function getQueueStats(): Promise<QueueMetrics> {
  try {
    const res = await fetch('/api/matchmaking/stats', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch stats: ${res.status}`);
    }
    const data = (await res.json()) as QueueStatsResponse;
    return {
      inQueue: data.inQueue || { deck_builder: 0, wormhole_3d: 0, total: 0 },
      activeMatches: data.activeMatches ?? 0,
      totalOnline: data.totalOnline ?? 0,
    };
  } catch (err) {
    console.warn('[MatchmakingApi] getQueueStats error:', err);
    return {
      inQueue: { deck_builder: 0, wormhole_3d: 0, total: 0 },
      activeMatches: 0,
      totalOnline: 0,
    };
  }
}

export interface MatchmakingClient {
  joinQueue: (variant: string, user: { id: string; username: string; isGuest?: boolean }) => void;
  leaveQueue: () => void;
  close: () => void;
}

export function createMatchmakingSocket(
  onMessage: (data: any) => void,
  onStatusChange?: (connected: boolean) => void
): MatchmakingClient {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${window.location.host}/api/matchmaking/ws`;

  let ws: WebSocket | null = null;
  let heartbeatTimer: any = null;
  let isClosed = false;

  function connect() {
    if (isClosed) return;
    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        onStatusChange?.(true);
        heartbeatTimer = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (e) {
          console.warn('[MatchmakingSocket] parse error:', e);
        }
      };

      ws.onclose = () => {
        clearInterval(heartbeatTimer);
        onStatusChange?.(false);
      };

      ws.onerror = (err) => {
        console.warn('[MatchmakingSocket] error:', err);
      };
    } catch (err) {
      console.warn('[MatchmakingSocket] failed to initialize:', err);
    }
  }

  connect();

  return {
    joinQueue: (variant, user) => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'join_queue',
            variant,
            userId: user.id,
            username: user.username,
            isGuest: !!user.isGuest,
          })
        );
      }
    },
    leaveQueue: () => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave_queue' }));
      }
    },
    close: () => {
      isClosed = true;
      clearInterval(heartbeatTimer);
      if (ws) {
        ws.close();
        ws = null;
      }
    },
  };
}
