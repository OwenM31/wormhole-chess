---
phase: 3
level: 2
researched_at: 2026-10-14
---

# Phase 3 Research — Real-Time Room Coordination & Durable Objects

## Questions Investigated

1. **Cloudflare Hibernatable WebSockets in Durable Objects**: How does modern `state.acceptWebSocket`, `webSocketMessage`, and attachment serialization operate for low-latency turn coordination with zero-idle memory cost?
2. **Cloudflare Pages to Durable Object Worker Architecture**: How can a Cloudflare Pages Functions project bind to and proxy WebSocket upgrade requests to a dedicated Durable Object Worker (`worker/`)?
3. **Dual Matchmaking & Presence Architecture**: How should the centralized `MatchmakerDO` manage FIFO matchmaking queues per variant while broadcasting live active players and queue metrics?
4. **Server-Authoritative Clock & Turn Synchronization**: How can `GameRoomDO` manage chess clocks (with increment and untimed toggles) and disconnect forfeit timers using the Durable Object Alarms API (`storage.setAlarm`) without drift?
5. **Variant-Agnostic Coordination & Spectator Support**: How can room state decouple game engine rules from network coordination so both 2D Deck Builder Chess and 3D Wormhole Chess use the exact same room engine, while supporting read-only spectators?
6. **Local Development & Client Hook**: How can developers run and test the complete stack locally using Wrangler Miniflare, and how should the React frontend interface with the room via `useGameRoom`?

---

## Findings

### 1. Cloudflare Hibernatable WebSockets API

Durable Objects offer a native WebSocket Hibernation API via `this.ctx.acceptWebSocket(server, tags)`:
- **Zero-Idle Billing**: Unlike legacy WebSockets which keep the Worker V8 isolate pinned in memory, hibernated WebSockets allow the isolate to shut down while the TCP/WebSocket connections remain held at the Cloudflare edge.
- **Event-Driven Wakeup**: When a client sends a message or drops connection, Cloudflare transparently wakes the DO and invokes:
  - `webSocketMessage(ws: WebSocket, message: string | ArrayBuffer)`
  - `webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean)`
  - `webSocketError(ws: WebSocket, error: unknown)`
- **Metadata Attachments**: Memory is cleared upon hibernation, so connection metadata (e.g. `userId`, `role: "white" | "black" | "spectator"`, `username`) must be attached via `ws.serializeAttachment(...)` and read back with `ws.deserializeAttachment(...)`.
- **Broadcast Optimization**: Calling `this.ctx.getWebSockets(tag?)` provides all currently open sockets for instant broadcast of turn payloads and clock state.

**Sources:**
- Cloudflare Workers Durable Objects WebSocket Hibernation Documentation (2024-2026)
- Cloudflare Workers Runtime API reference (`cloudflare:workers`)

---

### 2. Pages Functions to Worker Durable Object Topology

Cloudflare Pages Functions cannot directly export Durable Object classes within the `functions/` directory. The canonical architecture uses a companion Worker:

```
┌────────────────────────────────────────────────────────┐
│ Cloudflare Pages Frontend & Static Bundle (Vite)       │
│ - Pages Functions (/api/auth/*, /api/room/[code].ts)   │
└──────────────────────────┬─────────────────────────────┘
                           │ Durable Object Binding
                           │ (script_name = "wormhole-game-worker")
                           ▼
┌────────────────────────────────────────────────────────┐
│ Cloudflare Worker (worker/)                            │
│ - GameRoomDO (Class: Room & turn coordinator)          │
│ - MatchmakerDO (Class: Central queue & stats)          │
│ - D1 Database Binding (DB) for recording match results │
└────────────────────────────────────────────────────────┘
```

#### Binding Configuration
In root `wrangler.toml`:
```toml
[durable_objects]
bindings = [
  { name = "GAME_ROOM", class_name = "GameRoomDO", script_name = "wormhole-game-worker" },
  { name = "MATCHMAKER", class_name = "MatchmakerDO", script_name = "wormhole-game-worker" }
]
```

In `worker/wrangler.toml`:
```toml
name = "wormhole-game-worker"
main = "src/index.ts"
compatibility_date = "2024-03-20"

[durable_objects]
bindings = [
  { name = "GAME_ROOM", class_name = "GameRoomDO" },
  { name = "MATCHMAKER", class_name = "MatchmakerDO" }
]

[[migrations]]
tag = "v1"
new_classes = ["GameRoomDO", "MatchmakerDO"]

[[d1_databases]]
binding = "DB"
database_name = "wormhole-chess-db"
database_id = "local-dev-id"
```

#### WebSocket Proxying in Pages Functions
In `functions/api/room/[code].ts`:
```typescript
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const roomCode = (params.code as string).toUpperCase();

  if (request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected WebSocket upgrade", { status: 426 });
  }

  const id = env.GAME_ROOM.idFromName(roomCode);
  const stub = env.GAME_ROOM.get(id);
  return stub.fetch(request);
};
```
This preserves a single origin (`/api/room/:code`) with zero CORS complications.

---

### 3. Matchmaking & Live Visual Metrics (`MatchmakerDO`)

`MatchmakerDO` is a designated singleton DO (`idFromName("global")`):
- **Queues by Variant**: Maintains separate FIFO arrays for `deck_builder` and `wormhole_3d`.
- **Match Formation**: When 2 players are queued for the same variant:
  1. Generates a random 6-character room code (e.g. `WH-8472`).
  2. Assigns White and Black randomly.
  3. Sends `{ type: "match_found", roomCode, role: "white" | "black", variant }` to both sockets.
  4. Dequeues both players and redirects them to the room.
- **Visual Presence Metrics**:
  - `MatchmakerDO` periodically counts connected queue sockets and receives active match notifications from `GameRoomDO` instances.
  - Exposes endpoint `GET /api/matchmaking/stats` returning:
    ```json
    {
      "inQueue": { "deck_builder": 2, "wormhole_3d": 1, "total": 3 },
      "activeMatches": 4,
      "totalOnline": 11
    }
    ```
  - Broadcasts live metric updates over WebSocket to players waiting in the lobby/dashboard.

---

### 4. Server-Authoritative Clock & Turn Sync (`GameRoomDO`)

To guarantee cheat-proof, latency-resilient clock sync without constant 1-second CPU ticks:
- **Elapsed-Time Calculation**:
  - `clockConfig`: `{ initialSeconds: number | null, incrementSeconds: number }`.
  - When game starts (both White and Black ready):
    - `activeTurn = 'white'`.
    - `turnStartedAt = Date.now()`.
    - If timed: `setAlarm(Date.now() + whiteTimeMs)`.
  - On legal turn message received from player whose turn it is:
    - `now = Date.now()`.
    - `elapsed = now - turnStartedAt`.
    - Deduct elapsed from moving player's remaining bank, add `incrementSeconds * 1000`.
    - Check for timeout: `if (playerTime <= 0)` -> Flag fall, opponent wins!
    - Switch `activeTurn` to opponent, record `turnStartedAt = now`.
    - Reset alarm to `now + opponentTimeMs`.
    - Broadcast turn payload + authoritative clock remaining values to all players & spectators.
- **Untimed Matches**:
  - If `initialSeconds === null`, no clock countdown is enforced. Alarms are reserved solely for disconnect grace periods.
- **Disconnect Grace Period**:
  - If a player's socket drops while game is in progress:
    - Mark player as `disconnected: true`.
    - Schedule disconnect forfeit alarm for `Date.now() + 60000` (60s grace).
    - If player reconnects within 60s, cancel disconnect alarm.
    - If alarm triggers while player remains disconnected, forfeit game to opponent.

---

### 5. Decoupled Variant-Agnostic Room State

The room state isolates network presence and turn progression from variant-specific rules:

```typescript
interface RoomState {
  roomCode: string;
  variant: 'deck_builder' | 'wormhole_3d';
  status: 'waiting' | 'ready' | 'in_progress' | 'finished';
  whitePlayer: PlayerSlot | null;
  blackPlayer: PlayerSlot | null;
  spectators: SpectatorSlot[];
  activeTurn: 'white' | 'black' | null;
  clock: {
    initialSeconds: number | null;
    incrementSeconds: number;
    whiteMs: number;
    blackMs: number;
    lastTurnTimestamp: number | null;
  };
  turnNumber: number;
  lastMovePayload: any | null;
  moveHistory: any[];
  winner: 'white' | 'black' | 'draw' | null;
  finishReason: 'checkmate' | 'resignation' | 'timeout' | 'disconnect_forfeit' | 'draw_agreement' | null;
}
```

- When player submits `{ type: "turn", payload: { from: "e2", to: "e4", cardId: "card_boost_pawn" } }`:
  - DO validates: Is sender sender's assigned seat? Does seat equal `activeTurn`? Is `status === 'in_progress'`?
  - If valid: advances turn, updates clock, stores payload in `moveHistory`, and broadcasts `{ type: "turn_played", seat, payload, clock, turnNumber }` to all clients and spectators.
- Upon game over:
  - DO writes match record directly to D1 `matches` table and updates `player_stats` table for White and Black user IDs.

---

### 6. Client Hook: `useGameRoom`

A robust React hook [`useGameRoom`](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/src/hooks/useGameRoom.ts):
- Handles WebSocket connection, heartbeat ping/pong, auto-reconnect with exponential backoff.
- Exposes:
  - `status`: `'connecting' | 'connected' | 'disconnected' | 'error'`
  - `roomState`: Current authoritative room state.
  - `role`: `'white' | 'black' | 'spectator'`
  - `sendTurn(payload: any)`
  - `resign()`
  - `offerDraw()`
  - `sendChat(message: string)`

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Worker Topology** | Companion Worker in `worker/` bound to Pages Functions | Cloudflare Pages cannot export DO classes natively; companion worker provides standard DO hosting with unified local dev. |
| **Protocol** | Hibernatable WebSockets (`state.acceptWebSocket`) | Sub-50ms latency meeting NFR-03, zero idle compute billing, native presence callbacks. |
| **Matchmaking** | Dual: Private 6-char codes + Centralized `MatchmakerDO` Queue | Fulfills user requirement for both private room codes and random queue with visual queue metrics. |
| **Clock Management** | Server-authoritative delta timestamps with DO alarms | Eliminates client clock manipulation, zero drift, minimal timer CPU overhead. |
| **Spectator Mode** | Read-only spectator sockets via attachment tags | Connections after White and Black receive live broadcasts without turn mutation capabilities. |
| **Persistence** | D1 write on match conclusion from Worker DO | Direct SQL insertion into `matches` and incrementing `player_stats` upon finish. |

---

## Patterns to Follow

1. **Tag-based WebSocket Management**: Use `this.ctx.acceptWebSocket(ws, [role, userId])` and `this.ctx.getWebSockets()` for targeted or broadcast messages.
2. **Safe Deserialization**: Always defensively parse `ws.deserializeAttachment()` inside DO handlers to survive hibernation cycles.
3. **Optimistic UI with Authoritative Rollback**: Client renders move immediately, but reconciles with authoritative server state received via WebSocket.
4. **Heartbeat Liveness**: Send lightweight ping every 30 seconds to keep edge connection alive through intermediate proxies.

---

## Anti-Patterns to Avoid

- **DO Isolate Polling / 1s `setInterval`**: Never run `setInterval(..., 1000)` in a DO to tick clocks down. It prevents hibernation and rapidly burns CPU budget. Always compute clock deltas on turns and use `setAlarm()` for expiration.
- **Coupling Game Engine to Network Protocol**: Do not embed 3D Wormhole geometry or Deck Builder card logic inside the Durable Object. Keep the DO variant-agnostic so any chess variant can plug in.
- **Client-Authoritative Clocks**: Never trust the client to tell the server what its remaining time is. The server must calculate remaining time from timestamps.

---

## Dependencies Identified

| Package | Version | Purpose |
|---------|---------|---------|
| `@cloudflare/workers-types` | ^4.20240320.0 | TypeScript definitions for Durable Objects, WebSockets, and D1 in `worker/` |
| `nanoid` (or lightweight crypto random) | native | Generating 6-character room codes (`WH-XXXX`) |

---

## Risks & Mitigations

- **Risk: Cloudflare DO Paid Plan Requirement in Production**
  - *Mitigation*: Local development with Miniflare (`wrangler dev`) does not require a paid plan. Provide automated mock room fallback for offline/isolated frontend testing.
- **Risk: Disconnections during critical turns**
  - *Mitigation*: 60-second reconnect grace period with visual countdown banner before auto-forfeiting disconnected player.
- **Risk: Concurrent WebSocket messages**
  - *Mitigation*: Durable Objects process messages with single-threaded transactional execution per room, preventing race conditions.

---

## Ready for Planning

- [x] Questions answered
- [x] Architecture topology selected
- [x] Dual matchmaking and live metrics designed
- [x] Server-authoritative clock and alarm strategy defined
- [x] Dependencies and files of interest mapped
