import { DurableObject } from 'cloudflare:workers';
import type {
  WorkerEnv,
  QueuedPlayer,
  QueueStats,
} from './types';

interface QueueAttachment {
  userId: string;
  username: string;
  isGuest: boolean;
  variant?: string;
}

export class MatchmakerDO extends DurableObject<WorkerEnv> {
  private queues: Map<string, QueuedPlayer[]> = new Map();
  private activeRooms: Set<string> = new Set();

  constructor(ctx: DurableObjectState, env: WorkerEnv) {
    super(ctx, env);
    this.queues.set('deck_builder', []);
    this.queues.set('wormhole_3d', []);
  }

  private getQueue(variant: string): QueuedPlayer[] {
    if (!this.queues.has(variant)) {
      this.queues.set(variant, []);
    }
    return this.queues.get(variant)!;
  }

  private removeFromAllQueues(userId: string): void {
    for (const [, queue] of this.queues) {
      const idx = queue.findIndex((p) => p.userId === userId);
      if (idx >= 0) {
        queue.splice(idx, 1);
      }
    }
  }

  private getStats(): QueueStats {
    const deckBuilderQueue = this.getQueue('deck_builder').length;
    const wormhole3dQueue = this.getQueue('wormhole_3d').length;
    const totalQueued = deckBuilderQueue + wormhole3dQueue;
    const totalSockets = this.ctx.getWebSockets().length;

    return {
      inQueue: {
        deck_builder: deckBuilderQueue,
        wormhole_3d: wormhole3dQueue,
        total: totalQueued,
      },
      activeMatches: this.activeRooms.size,
      totalOnline: Math.max(totalSockets, totalQueued),
    };
  }

  private broadcastMetrics(): void {
    const stats = this.getStats();
    const payload = JSON.stringify({ type: 'metrics', stats });
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(payload);
      } catch {
        // Ignore dead sockets
      }
    }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `WH-${code}`;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade for real-time matchmaking queue
    if (request.headers.get('Upgrade') === 'websocket' || url.pathname.endsWith('/ws')) {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.ctx.acceptWebSocket(server);

      // Send initial metrics immediately
      server.send(JSON.stringify({ type: 'metrics', stats: this.getStats() }));

      return new Response(null, { status: 101, webSocket: client });
    }

    // HTTP GET /stats
    if (request.method === 'GET' && (url.pathname.endsWith('/stats') || url.pathname === '/')) {
      return new Response(JSON.stringify({ success: true, ...this.getStats() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // HTTP POST /room_closed (called by GameRoomDO when a match concludes)
    if (request.method === 'POST' && url.pathname.endsWith('/room_closed')) {
      try {
        const body = (await request.json()) as { roomCode?: string };
        if (body.roomCode) {
          this.activeRooms.delete(body.roomCode.toUpperCase());
          this.broadcastMetrics();
        }
      } catch {
        // Ignore JSON error
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const raw = typeof message === 'string' ? message : new TextDecoder().decode(message);
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }

    if (data.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
      return;
    }

    if (data.type === 'leave_queue') {
      const attachment = ws.deserializeAttachment() as QueueAttachment | null;
      if (attachment) {
        this.removeFromAllQueues(attachment.userId);
        ws.serializeAttachment({ ...attachment, variant: undefined });
        this.broadcastMetrics();
      }
      return;
    }

    if (data.type === 'join_queue') {
      const { variant = 'deck_builder', userId, username, isGuest = false } = data;
      if (!userId || !username) {
        ws.send(JSON.stringify({ type: 'error', message: 'Missing userId or username' }));
        return;
      }

      // Attach user information to socket
      const attachment: QueueAttachment = { userId, username, isGuest, variant };
      ws.serializeAttachment(attachment);

      // Remove from any queue before re-adding
      this.removeFromAllQueues(userId);

      const queue = this.getQueue(variant);
      queue.push({
        userId,
        username,
        isGuest,
        joinedAt: Date.now(),
      });

      // Check if match can be formed
      if (queue.length >= 2) {
        const p1 = queue.shift()!;
        const p2 = queue.shift()!;

        const roomCode = this.generateRoomCode();
        this.activeRooms.add(roomCode);

        // Randomize White and Black
        const p1IsWhite = Math.random() < 0.5;
        const p1Role = p1IsWhite ? 'white' : 'black';
        const p2Role = p1IsWhite ? 'black' : 'white';

        // Notify matched players via their connected websockets
        for (const clientWs of this.ctx.getWebSockets()) {
          const clientMeta = clientWs.deserializeAttachment() as QueueAttachment | null;
          if (clientMeta?.userId === p1.userId) {
            clientWs.send(
              JSON.stringify({
                type: 'match_found',
                roomCode,
                role: p1Role,
                opponent: p2.username,
                variant,
              })
            );
          } else if (clientMeta?.userId === p2.userId) {
            clientWs.send(
              JSON.stringify({
                type: 'match_found',
                roomCode,
                role: p2Role,
                opponent: p1.username,
                variant,
              })
            );
          }
        }
      }

      this.broadcastMetrics();
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const attachment = ws.deserializeAttachment() as QueueAttachment | null;
    if (attachment?.userId) {
      this.removeFromAllQueues(attachment.userId);
      this.broadcastMetrics();
    }
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }
}
