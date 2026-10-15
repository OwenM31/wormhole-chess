// Frontend typed definitions for Room and Matchmaking protocols

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
  initialSeconds: number;
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
  variant: string;
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

export interface ChatMessage {
  sender: string;
  role: PlayerRole;
  text: string;
  timestamp: number;
}

// Client messages sent to GameRoomDO
export type ClientMessage =
  | { type: 'turn'; payload: unknown; gameOver?: boolean; winner?: TurnColor | 'draw'; finishReason?: FinishReason }
  | { type: 'resign' }
  | { type: 'draw_offer' }
  | { type: 'draw_accept' }
  | { type: 'chat'; text: string }
  | { type: 'ping' };

// Server messages received from GameRoomDO
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

// Matchmaking Metrics & Events
export interface QueueMetrics {
  inQueue: {
    deck_builder: number;
    wormhole_3d: number;
    total: number;
  };
  activeMatches: number;
  totalOnline: number;
}

export interface MatchFoundEvent {
  type: 'match_found';
  roomCode: string;
  role: TurnColor;
  opponent: string;
  variant: string;
}
