---
phase: 3
plan: 1
wave: 1
depends_on: []
files_modified:
  - worker/wrangler.toml
  - worker/tsconfig.json
  - worker/package.json
  - worker/src/types.ts
  - worker/src/GameRoomDO.ts
  - worker/src/MatchmakerDO.ts
  - worker/src/index.ts
  - wrangler.toml
  - functions/api/room/[code].ts
  - functions/api/matchmaking/stats.ts
  - functions/api/matchmaking/ws.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "GameRoomDO manages room state, seat assignments (White, Black, Spectator), turn alternation, and opaque payload broadcast"
    - "GameRoomDO manages server-authoritative turn clocks (timed vs untimed) and 60-second disconnect forfeit grace periods using DO alarms"
    - "GameRoomDO records match outcomes and updates player stats in D1 database upon match conclusion"
    - "MatchmakerDO maintains FIFO queues by variant and pairs players into generated room codes while reporting live queue and active match counts"
    - "Pages Functions proxy incoming WebSocket upgrades to GameRoomDO and MatchmakerDO stubs with single-origin routing"
  artifacts:
    - "worker/wrangler.toml"
    - "worker/src/GameRoomDO.ts"
    - "worker/src/MatchmakerDO.ts"
    - "worker/src/index.ts"
    - "functions/api/room/[code].ts"
    - "functions/api/matchmaking/stats.ts"
    - "functions/api/matchmaking/ws.ts"
  key_links:
    - "functions/api/room/[code].ts routes WebSocket upgrade to env.GAME_ROOM stub"
    - "functions/api/matchmaking/stats.ts reads live queue metrics from env.MATCHMAKER stub"
    - "GameRoomDO inserts match record into env.DB matches table on game over"
---

# Plan 3.1: Cloudflare Durable Objects Engine & Pages Proxy Endpoints

<objective>
Build the companion Cloudflare Worker (`worker/`) implementing the variant-agnostic `GameRoomDO` and centralized `MatchmakerDO` using Cloudflare Hibernatable WebSockets and the Alarms API, bound to Cloudflare Pages Functions to proxy real-time WebSocket connections.

Purpose: Provide the server-authoritative, ultra-low latency real-time multiplayer networking foundation for both 2D Deck Builder Chess and 3D Wormhole Chess without engine coupling.
Output: Complete companion worker with `GameRoomDO`, `MatchmakerDO`, and Pages Functions WebSocket proxy routes.
</objective>

<context>
Load for context:
- .agent/state/SPEC.md
- .agent/state/DECISIONS.md (DECISION-002, DECISION-005, DECISION-006)
- .agent/state/phases/3/RESEARCH.md
- d1/schema.sql
- wrangler.toml
</context>

<tasks>

<task type="auto">
  <name>Setup Companion Worker & GameRoomDO with Hibernatable WebSockets & Clock Alarms</name>
  <files>
    worker/wrangler.toml
    worker/tsconfig.json
    worker/package.json
    worker/src/types.ts
    worker/src/GameRoomDO.ts
  </files>
  <action>
    1. Create `worker/wrangler.toml` configuring worker `wormhole-game-worker`, compatibility date `2024-03-20`, `main = "src/index.ts"`, Durable Objects bindings for `GAME_ROOM` (`GameRoomDO`) and `MATCHMAKER` (`MatchmakerDO`), migrations tag `v1`, and D1 database binding `DB` (`wormhole-chess-db`).
    2. Create `worker/tsconfig.json` extending standard ES2022/NodeNext options with types `["@cloudflare/workers-types"]`.
    3. Create `worker/package.json` with build/typecheck scripts and `@cloudflare/workers-types` devDependency.
    4. Create `worker/src/types.ts` defining:
       - `RoomState`: `roomCode`, `variant`, `status` ('waiting' | 'ready' | 'in_progress' | 'finished'), `whitePlayer`, `blackPlayer`, `spectators`, `activeTurn` ('white' | 'black' | null), `clock` (initialSeconds, incrementSeconds, whiteMs, blackMs, lastTurnTimestamp), `turnNumber`, `moveHistory`, `winner`, `finishReason`.
       - `PlayerSlot`: `userId`, `username`, `isGuest`, `connected`, `disconnectedAt`.
       - `RoomMessage` protocol: `join`, `turn`, `chat`, `resign`, `draw_offer`, `draw_accept`, `sync`, `presence`, `game_over`, `ping`, `pong`.
    5. Implement `worker/src/GameRoomDO.ts` extending `DurableObject`:
       - Handle `fetch(request)`: inspect `Upgrade: websocket`. Extract `userId`, `username`, `isGuest`, and initial room config from URL query params. Create `WebSocketPair()`, call `this.ctx.acceptWebSocket(server, [role, userId])`, serialize attachment on socket, and return `101 Switching Protocols` response.
       - Role allocation: first player becomes `white`, second becomes `black`. Any further connections are assigned `spectator`. If a reconnecting `userId` matches White or Black, reattach and cancel pending disconnect grace alarm.
       - Implement `webSocketMessage(ws, message)`:
         - Handle `turn`: verify sender is assigned to `activeTurn` and match is `in_progress`. Compute clock delta: `elapsed = now - lastTurnTimestamp`, subtract from moving player's clock, add increment. Check for flag fall (`<= 0`). Advance turn, store payload in `moveHistory`, update alarm to `now + opponentRemainingMs`, and broadcast `turn_played` with authoritative clock and turnNumber.
         - Handle `resign`: mark resigning player as loser, finish game, broadcast `game_over`.
         - Handle `chat`: relay sanitized chat message to room sockets.
         - Handle `ping`: reply with `pong` for heartbeat latency tracking.
       - Implement `alarm()`:
         - Check if clock expired for `activeTurn` -> broadcast timeout victory and finish game.
         - Check if disconnect grace period expired (60s) -> forfeit disconnected player and finish game.
       - When game finishes:
         - Cancel any active alarms.
         - Persist match row to D1 `DB`: insert into `matches` (`id`, `variant`, `white_user_id`, `black_user_id`, `winner_id`, `result`, `moves_pgn`, `started_at`, `ended_at`).
         - Update `player_stats` table for registered players.
    AVOID: Running 1-second `setInterval` in the DO (burns CPU and prevents hibernation). Always use `this.ctx.storage.setAlarm` and timestamp deltas.
    AVOID: Validating variant-specific chess piece rules in the DO. The DO must remain variant-agnostic.
  </action>
  <verify>
    npx tsc -p worker/tsconfig.json
  </verify>
  <done>
    GameRoomDO compiles cleanly with full WebSocket hibernation, alarm handling, D1 persistence, and variant-agnostic turn routing.
  </done>
</task>

<task type="auto">
  <name>Implement MatchmakerDO & Worker Router Entry</name>
  <files>
    worker/src/MatchmakerDO.ts
    worker/src/index.ts
  </files>
  <action>
    1. Implement `worker/src/MatchmakerDO.ts` extending `DurableObject`:
       - Maintain state: `queues: Record<string, QueuedPlayer[]>`, `activeRooms: Set<string>`, `totalOnline: number`.
       - WebSocket handler for matchmaking queue:
         - When client joins queue (`{ type: "join_queue", variant, userId, username }`):
           - Add to FIFO queue for specified variant.
           - Check if queue length >= 2:
             - Dequeue 2 players.
             - Generate random 6-character room code (e.g. `WH-` + 4 random uppercase chars/numbers).
             - Randomly assign White and Black.
             - Send `{ type: "match_found", roomCode, role: "white" | "black", variant }` to both sockets.
             - Add roomCode to `activeRooms`.
         - When client disconnects or sends `{ type: "leave_queue" }`: remove from queues.
         - Broadcast queue metric updates `{ type: "metrics", inQueue, activeMatches }` to connected queue clients.
       - HTTP handler for stats:
         - `GET /stats`: return JSON `{ inQueue: { deck_builder, wormhole_3d, total }, activeMatches, totalOnline }`.
         - `POST /room_closed`: allow `GameRoomDO` to notify when a room terminates, updating `activeRooms`.
    2. Implement `worker/src/index.ts`:
       - Export `GameRoomDO` and `MatchmakerDO`.
       - Default export `fetch(request, env)`:
         - Route `/room/:code`: forward to `env.GAME_ROOM.get(env.GAME_ROOM.idFromName(code)).fetch(request)`.
         - Route `/matchmaking/ws` and `/matchmaking/stats`: forward to `env.MATCHMAKER.get(env.MATCHMAKER.idFromName("global")).fetch(request)`.
  </action>
  <verify>
    npx tsc -p worker/tsconfig.json
  </verify>
  <done>
    MatchmakerDO and worker entry point compile with zero errors and handle pairing and live queue stats.
  </done>
</task>

<task type="auto">
  <name>Configure Pages Functions Proxy Endpoints & Root Wrangler Binding</name>
  <files>
    wrangler.toml
    functions/api/room/[code].ts
    functions/api/matchmaking/stats.ts
    functions/api/matchmaking/ws.ts
  </files>
  <action>
    1. Update root `wrangler.toml` to declare Durable Object bindings pointing to companion worker:
       ```toml
       [durable_objects]
       bindings = [
         { name = "GAME_ROOM", class_name = "GameRoomDO", script_name = "wormhole-game-worker" },
         { name = "MATCHMAKER", class_name = "MatchmakerDO", script_name = "wormhole-game-worker" }
       ]
       ```
    2. Implement `functions/api/room/[code].ts`:
       - Extract session token from cookie to determine `userId` and `username` (or fallback to query params for guests).
       - Check `Upgrade: websocket` header.
       - Construct target URL with user details and proxy request to `env.GAME_ROOM.get(env.GAME_ROOM.idFromName(code)).fetch(proxiedRequest)`.
       - Return response from DO stub.
    3. Implement `functions/api/matchmaking/stats.ts`:
       - Proxy `GET` request to `env.MATCHMAKER.get(env.MATCHMAKER.idFromName("global")).fetch(request)`.
       - Return live queue stats with JSON headers.
    4. Implement `functions/api/matchmaking/ws.ts`:
       - Extract user session from cookie.
       - Proxy WebSocket upgrade to `env.MATCHMAKER.get(env.MATCHMAKER.idFromName("global")).fetch(request)`.
    5. Run full typecheck across both `worker/` and `functions/`.
  </action>
  <verify>
    npx tsc -p functions/tsconfig.json; npx tsc -p worker/tsconfig.json
  </verify>
  <done>
    Pages Functions routes cleanly proxy WebSocket and HTTP requests to GameRoomDO and MatchmakerDO with 0 type errors.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `worker/tsconfig.json` compiles with zero errors
- [ ] `functions/tsconfig.json` compiles with zero errors
- [ ] `wrangler.toml` contains bindings for `GAME_ROOM` and `MATCHMAKER`
- [ ] `GameRoomDO` implements `acceptWebSocket`, `webSocketMessage`, `alarm`, and D1 `matches` write
- [ ] `MatchmakerDO` pairs players into rooms and provides queue statistics
</verification>

<success_criteria>
- [ ] All 3 tasks verified with zero TypeScript errors
- [ ] Companion worker architecture established
- [ ] Sub-150ms WebSocket routing path operational
</success_criteria>
