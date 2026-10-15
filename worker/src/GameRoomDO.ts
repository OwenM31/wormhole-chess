import { DurableObject } from 'cloudflare:workers';
import type {
  WorkerEnv,
  RoomState,
  PlayerSlot,
  ClockState,
  PlayerRole,
  TurnColor,
  FinishReason,
  SocketAttachment,
  ClientMessage,
  ServerMessage,
} from './types';

export class GameRoomDO extends DurableObject<WorkerEnv> {
  private roomState: RoomState | null = null;

  constructor(ctx: DurableObjectState, env: WorkerEnv) {
    super(ctx, env);
  }

  private async getState(): Promise<RoomState> {
    if (!this.roomState) {
      this.roomState = (await this.ctx.storage.get<RoomState>('roomState')) || null;
    }
    return this.roomState!;
  }

  private async saveState(): Promise<void> {
    if (this.roomState) {
      await this.ctx.storage.put('roomState', this.roomState);
    }
  }

  private initializeState(
    roomCode: string,
    variant: string = 'deck_builder',
    timeControl: string = '5+0'
  ): RoomState {
    let initialSeconds = 300;
    let incrementSeconds = 0;
    let isUntimed = false;

    if (timeControl === 'untimed') {
      isUntimed = true;
      initialSeconds = 0;
    } else if (timeControl === '3+0') {
      initialSeconds = 180;
    } else if (timeControl === '5+0') {
      initialSeconds = 300;
    } else if (timeControl === '10+0') {
      initialSeconds = 600;
    }

    const clock: ClockState = {
      initialSeconds,
      incrementSeconds,
      whiteMs: initialSeconds * 1000,
      blackMs: initialSeconds * 1000,
      lastTurnTimestamp: null,
      isUntimed,
    };

    return {
      roomCode: roomCode.toUpperCase(),
      variant,
      status: 'waiting',
      whitePlayer: null,
      blackPlayer: null,
      spectators: [],
      activeTurn: null,
      clock,
      turnNumber: 1,
      moveHistory: [],
      winner: null,
      finishReason: null,
      startedAt: null,
      endedAt: null,
    };
  }

  private broadcast(message: ServerMessage, excludeWs?: WebSocket): void {
    const payload = JSON.stringify(message);
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== excludeWs) {
        try {
          ws.send(payload);
        } catch {
          // Socket might have closed abruptly
        }
      }
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Provide read-only HTTP state inspection
    if (request.headers.get('Upgrade') !== 'websocket') {
      const state = await this.getState();
      if (!state) {
        return new Response(JSON.stringify({ error: 'Room not initialized' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(state), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse URL query parameters
    const userId = url.searchParams.get('userId') || `guest_${crypto.randomUUID().slice(0, 8)}`;
    const username = url.searchParams.get('username') || `Player_${userId.slice(-4)}`;
    const isGuest = url.searchParams.get('isGuest') === 'true';
    const variant = url.searchParams.get('variant') || 'deck_builder';
    const timeControl = url.searchParams.get('timeControl') || '5+0';

    const pathSegments = url.pathname.split('/').filter(Boolean);
    const roomCode = (pathSegments.pop() || url.searchParams.get('code') || 'ROOM').toUpperCase();

    // Load or initialize state
    let state = await this.getState();
    if (!state) {
      state = this.initializeState(roomCode, variant, timeControl);
      this.roomState = state;
    }

    let role: PlayerRole = 'spectator';

    // Role allocation / reconnection logic
    if (state.whitePlayer?.userId === userId) {
      // White reconnecting
      role = 'white';
      state.whitePlayer.connected = true;
      state.whitePlayer.disconnectedAt = null;
      this.broadcast({ type: 'player_reconnected', role: 'white' });
    } else if (state.blackPlayer?.userId === userId) {
      // Black reconnecting
      role = 'black';
      state.blackPlayer.connected = true;
      state.blackPlayer.disconnectedAt = null;
      this.broadcast({ type: 'player_reconnected', role: 'black' });
    } else if (!state.whitePlayer) {
      // White seat available
      role = 'white';
      state.whitePlayer = {
        userId,
        username,
        isGuest,
        connected: true,
        disconnectedAt: null,
      };
    } else if (!state.blackPlayer) {
      // Black seat available
      role = 'black';
      state.blackPlayer = {
        userId,
        username,
        isGuest,
        connected: true,
        disconnectedAt: null,
      };

      // Both players joined! Start game if waiting
      if (state.status === 'waiting') {
        state.status = 'in_progress';
        state.startedAt = Date.now();
        state.activeTurn = 'white';
        if (!state.clock.isUntimed) {
          state.clock.lastTurnTimestamp = Date.now();
          await this.ctx.storage.setAlarm(Date.now() + state.clock.whiteMs);
        }
        this.broadcast({ type: 'game_started', state });
      }
    } else {
      // Seats full: join as Spectator
      role = 'spectator';
      const existingIdx = state.spectators.findIndex((s) => s.userId === userId);
      const specSlot: PlayerSlot = {
        userId,
        username,
        isGuest,
        connected: true,
        disconnectedAt: null,
      };
      if (existingIdx >= 0) {
        state.spectators[existingIdx] = specSlot;
      } else {
        state.spectators.push(specSlot);
      }
    }

    await this.saveState();

    // Accept WebSocketPair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server, [role, userId]);
    const attachment: SocketAttachment = { userId, username, isGuest, role };
    server.serializeAttachment(attachment);

    // Send immediate sync to connecting socket
    server.send(
      JSON.stringify({
        type: 'sync',
        state,
        yourRole: role,
      } as ServerMessage)
    );

    // Broadcast player presence if not a spectator
    if (role !== 'spectator') {
      this.broadcast(
        {
          type: 'player_joined',
          role,
          player: role === 'white' ? state.whitePlayer! : state.blackPlayer!,
        },
        server
      );
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const raw = typeof message === 'string' ? message : new TextDecoder().decode(message);
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Malformed JSON payload' }));
      return;
    }

    const meta = ws.deserializeAttachment() as SocketAttachment | null;
    if (!meta) return;

    if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
      return;
    }

    const state = await this.getState();
    if (!state) return;

    if (msg.type === 'chat') {
      const cleanText = String(msg.text || '').trim().slice(0, 500);
      if (cleanText.length > 0) {
        this.broadcast({
          type: 'chat',
          sender: meta.username,
          role: meta.role,
          text: cleanText,
          timestamp: Date.now(),
        });
      }
      return;
    }

    // Only active players in an in-progress game can play moves, offer draws, or resign
    if (state.status !== 'in_progress') {
      ws.send(JSON.stringify({ type: 'error', message: 'Match is not in progress' }));
      return;
    }

    if (meta.role !== 'white' && meta.role !== 'black') {
      ws.send(JSON.stringify({ type: 'error', message: 'Spectators cannot execute game actions' }));
      return;
    }

    if (msg.type === 'resign') {
      const winner: TurnColor = meta.role === 'white' ? 'black' : 'white';
      await this.finishGame(winner, 'resignation');
      return;
    }

    if (msg.type === 'draw_offer') {
      this.broadcast({ type: 'draw_offered', fromRole: meta.role }, ws);
      return;
    }

    if (msg.type === 'draw_accept') {
      await this.finishGame('draw', 'draw_agreement');
      return;
    }

    if (msg.type === 'turn') {
      if (state.activeTurn !== meta.role) {
        ws.send(JSON.stringify({ type: 'error', message: "It is not your turn" }));
        return;
      }

      const now = Date.now();

      // Clock reconciliation
      if (!state.clock.isUntimed && state.clock.lastTurnTimestamp) {
        const elapsed = now - state.clock.lastTurnTimestamp;
        if (meta.role === 'white') {
          state.clock.whiteMs = Math.max(
            0,
            state.clock.whiteMs - elapsed + state.clock.incrementSeconds * 1000
          );
          if (state.clock.whiteMs <= 0) {
            await this.finishGame('black', 'timeout');
            return;
          }
        } else {
          state.clock.blackMs = Math.max(
            0,
            state.clock.blackMs - elapsed + state.clock.incrementSeconds * 1000
          );
          if (state.clock.blackMs <= 0) {
            await this.finishGame('white', 'timeout');
            return;
          }
        }
      }

      // Record move payload
      state.moveHistory.push({
        turnNumber: state.turnNumber,
        player: meta.role,
        payload: msg.payload,
        timestamp: now,
      });

      // Check if turn signaled match conclusion (e.g. checkmate / board solved)
      if (msg.gameOver) {
        const declaredWinner = msg.winner ?? (meta.role === 'white' ? 'white' : 'black');
        await this.finishGame(declaredWinner, msg.finishReason ?? 'checkmate');
        return;
      }

      // Advance turn
      state.turnNumber += 1;
      const nextTurn: TurnColor = meta.role === 'white' ? 'black' : 'white';
      state.activeTurn = nextTurn;
      state.clock.lastTurnTimestamp = now;

      // Update alarm for next player's clock timeout
      if (!state.clock.isUntimed) {
        const nextMs = nextTurn === 'white' ? state.clock.whiteMs : state.clock.blackMs;
        await this.ctx.storage.setAlarm(now + nextMs);
      }

      await this.saveState();

      // Broadcast move event with authoritative clock
      this.broadcast({
        type: 'turn_played',
        turnNumber: state.turnNumber - 1,
        activeTurn: nextTurn,
        payload: msg.payload,
        clock: state.clock,
      });
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const meta = ws.deserializeAttachment() as SocketAttachment | null;
    if (!meta) return;

    const state = await this.getState();
    if (!state) return;

    if (meta.role === 'white' && state.whitePlayer) {
      state.whitePlayer.connected = false;
      state.whitePlayer.disconnectedAt = Date.now();
    } else if (meta.role === 'black' && state.blackPlayer) {
      state.blackPlayer.connected = false;
      state.blackPlayer.disconnectedAt = Date.now();
    } else if (meta.role === 'spectator') {
      const idx = state.spectators.findIndex((s) => s.userId === meta.userId);
      if (idx >= 0) state.spectators.splice(idx, 1);
    }

    if (state.status === 'in_progress' && (meta.role === 'white' || meta.role === 'black')) {
      const graceExpiresAt = Date.now() + 60000;
      this.broadcast({
        type: 'player_disconnected',
        role: meta.role,
        graceExpiresAt,
      });

      // Alarm: ensure an alarm fires at grace expiration (or sooner if clock expires first)
      const currentAlarm = await this.ctx.storage.getAlarm();
      if (!currentAlarm || graceExpiresAt < currentAlarm) {
        await this.ctx.storage.setAlarm(graceExpiresAt);
      }
    }

    await this.saveState();
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  async alarm(): Promise<void> {
    const state = await this.getState();
    if (!state || state.status !== 'in_progress') return;

    const now = Date.now();

    // 1. Check disconnect grace timeout (60 seconds)
    if (
      state.whitePlayer &&
      !state.whitePlayer.connected &&
      state.whitePlayer.disconnectedAt &&
      now - state.whitePlayer.disconnectedAt >= 60000
    ) {
      await this.finishGame('black', 'disconnect_forfeit');
      return;
    }

    if (
      state.blackPlayer &&
      !state.blackPlayer.connected &&
      state.blackPlayer.disconnectedAt &&
      now - state.blackPlayer.disconnectedAt >= 60000
    ) {
      await this.finishGame('white', 'disconnect_forfeit');
      return;
    }

    // 2. Check turn clock timeout
    if (!state.clock.isUntimed && state.activeTurn && state.clock.lastTurnTimestamp) {
      const elapsed = now - state.clock.lastTurnTimestamp;
      if (state.activeTurn === 'white') {
        const remaining = state.clock.whiteMs - elapsed;
        if (remaining <= 50) {
          await this.finishGame('black', 'timeout');
          return;
        }
      } else {
        const remaining = state.clock.blackMs - elapsed;
        if (remaining <= 50) {
          await this.finishGame('white', 'timeout');
          return;
        }
      }
    }
  }

  private async finishGame(
    winner: TurnColor | 'draw' | null,
    reason: FinishReason
  ): Promise<void> {
    const state = await this.getState();
    if (!state || state.status === 'finished') return;

    state.status = 'finished';
    state.winner = winner;
    state.finishReason = reason;
    state.endedAt = Date.now();

    try {
      await this.ctx.storage.deleteAlarm();
    } catch {
      // Ignore alarm delete failures
    }

    await this.saveState();

    this.broadcast({
      type: 'game_over',
      winner,
      reason,
      state,
    });

    // Record match in D1 database
    try {
      const matchId = crypto.randomUUID();
      const whiteUserId = state.whitePlayer?.userId || null;
      const blackUserId = state.blackPlayer?.userId || null;
      const winnerId =
        winner === 'white' ? whiteUserId : winner === 'black' ? blackUserId : null;
      const result =
        winner === 'white' ? '1-0' : winner === 'black' ? '0-1' : winner === 'draw' ? '1/2-1/2' : null;
      const movesJson = JSON.stringify(state.moveHistory);

      await this.env.DB.prepare(
        `INSERT INTO matches (id, variant, white_user_id, black_user_id, winner_id, result, moves_pgn, started_at, ended_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime(?, 'unixepoch'), datetime(?, 'unixepoch'))`
      )
        .bind(
          matchId,
          state.variant,
          whiteUserId,
          blackUserId,
          winnerId,
          result,
          movesJson,
          Math.floor((state.startedAt || Date.now()) / 1000),
          Math.floor(Date.now() / 1000)
        )
        .run();

      // Update player stats for non-guest users
      if (state.whitePlayer && !state.whitePlayer.isGuest && whiteUserId) {
        if (winner === 'white') {
          await this.env.DB.prepare(
            `UPDATE player_stats SET wins = wins + 1, elo_rating = elo_rating + 16, updated_at = datetime('now') WHERE user_id = ?`
          ).bind(whiteUserId).run();
        } else if (winner === 'black') {
          await this.env.DB.prepare(
            `UPDATE player_stats SET losses = losses + 1, elo_rating = MAX(100, elo_rating - 16), updated_at = datetime('now') WHERE user_id = ?`
          ).bind(whiteUserId).run();
        } else if (winner === 'draw') {
          await this.env.DB.prepare(
            `UPDATE player_stats SET draws = draws + 1, updated_at = datetime('now') WHERE user_id = ?`
          ).bind(whiteUserId).run();
        }
      }

      if (state.blackPlayer && !state.blackPlayer.isGuest && blackUserId) {
        if (winner === 'black') {
          await this.env.DB.prepare(
            `UPDATE player_stats SET wins = wins + 1, elo_rating = elo_rating + 16, updated_at = datetime('now') WHERE user_id = ?`
          ).bind(blackUserId).run();
        } else if (winner === 'white') {
          await this.env.DB.prepare(
            `UPDATE player_stats SET losses = losses + 1, elo_rating = MAX(100, elo_rating - 16), updated_at = datetime('now') WHERE user_id = ?`
          ).bind(blackUserId).run();
        } else if (winner === 'draw') {
          await this.env.DB.prepare(
            `UPDATE player_stats SET draws = draws + 1, updated_at = datetime('now') WHERE user_id = ?`
          ).bind(blackUserId).run();
        }
      }
    } catch (err) {
      console.error('[GameRoomDO] Failed to record match in D1:', err);
    }
  }
}
