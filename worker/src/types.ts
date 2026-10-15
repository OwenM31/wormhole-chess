// Common types for Cloudflare Worker & Durable Objects

export type PlayerRole = 'white' | 'black' | 'spectator';
export type RoomStatus = 'waiting' | 'ready' | 'in_progress' | 'finished';
export type TurnColor = 'white' | 'black';
export type FinishReason =
  | 'checkmate'
  | 'resignation'
  | 'timeout'
  | 'disconnect_forfeit'
  | 'draw_agreement';

export interface PlayerSlot {
  userId: string;
  username: string;
  isGuest: boolean;
  connected: boolean;
  disconnectedAt: number | null;
}

export interface ClockState {
  initialSeconds: number; // 0 for untimed
  incrementSeconds: number;
  whiteMs: number;
  blackMs: number;
  lastTurnTimestamp: number | null;
  isUntimed: boolean;
}

export interface MoveRecord {
  turnNumber: number;
  player: TurnColor;
  payload: unknown;
  timestamp: number;
}

export interface RoomState {
  roomCode: string;
  variant: string; // 'deck_builder' | 'wormhole_3d' | etc.
  status: RoomStatus;
  whitePlayer: PlayerSlot | null;
  blackPlayer: PlayerSlot | null;
  spectators: PlayerSlot[];
  activeTurn: TurnColor | null;
  clock: ClockState;
  turnNumber: number;
  moveHistory: MoveRecord[];
  winner: TurnColor | 'draw' | null;
  finishReason: FinishReason | null;
  startedAt: number | null;
  endedAt: number | null;
}

export interface SocketAttachment {
  userId: string;
  username: string;
  isGuest: boolean;
  role: PlayerRole;
}

// Client -> Server messages
export type ClientMessage =
  | { type: 'turn'; payload: unknown; gameOver?: boolean; winner?: TurnColor | 'draw'; finishReason?: FinishReason }
  | { type: 'resign' }
  | { type: 'draw_offer' }
  | { type: 'draw_accept' }
  | { type: 'chat'; text: string }
  | { type: 'ping' };

// Server -> Client messages
export type ServerMessage =
  | { type: 'sync'; state: RoomState; yourRole: PlayerRole }
  | { type: 'turn_played'; turnNumber: number; activeTurn: TurnColor; payload: unknown; clock: ClockState }
  | { type: 'player_joined'; role: PlayerRole; player: PlayerSlot }
  | { type: 'player_disconnected'; role: PlayerRole; graceExpiresAt: number | null }
  | { type: 'player_reconnected'; role: PlayerRole }
  | { type: 'game_started'; state: RoomState }
  | { type: 'game_over'; winner: TurnColor | 'draw' | null; reason: FinishReason; state: RoomState }
  | { type: 'draw_offered'; fromRole: TurnColor }
  | { type: 'chat'; sender: string; role: PlayerRole; text: string; timestamp: number }
  | { type: 'pong' }
  | { type: 'error'; message: string };

// Matchmaking types
export interface QueuedPlayer {
  userId: string;
  username: string;
  isGuest: boolean;
  joinedAt: number;
}

export interface QueueStats {
  inQueue: {
    deck_builder: number;
    wormhole_3d: number;
    total: number;
  };
  activeMatches: number;
  totalOnline: number;
}

// Worker Bindings
export interface WorkerEnv {
  GAME_ROOM: DurableObjectNamespace;
  MATCHMAKER: DurableObjectNamespace;
  DB: D1Database;
}
