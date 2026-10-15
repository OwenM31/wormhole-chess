---
phase: 3
plan: 2
wave: 2
depends_on: ["01"]
files_modified:
  - src/types/room.ts
  - src/services/matchmakingApi.ts
  - src/hooks/useGameRoom.ts
  - src/components/ChessClock.tsx
  - src/components/MatchmakingLobby.tsx
  - src/pages/PlayRoomPage.tsx
  - src/pages/DashboardPage.tsx
  - src/App.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "useGameRoom hook manages WebSocket lifecycle, ping/pong heartbeats, reconnection, and state synchronization"
    - "MatchmakingLobby displays live queue counts, supports finding public matches with searching animation, and creating/joining private room codes"
    - "ChessClock renders White and Black clocks, highlights current turn, counts down smoothly on client, handles untimed matches gracefully, and displays 60s disconnect warning"
    - "PlayRoomPage routes at /play/:code, provides chat/turn controls, and cleanly hosts game variants with player profile HUDs"
  artifacts:
    - "src/types/room.ts"
    - "src/hooks/useGameRoom.ts"
    - "src/components/ChessClock.tsx"
    - "src/components/MatchmakingLobby.tsx"
    - "src/pages/PlayRoomPage.tsx"
  key_links:
    - "PlayRoomPage connects to GameRoomDO via useGameRoom hook"
    - "MatchmakingLobby initiates matches and redirects players to /play/:code"
    - "ChessClock updates smoothly with clock state received from GameRoomDO"
    - "App.tsx mounts /play/:code route"
---

# Plan 3.2: Client Multiplayer Hook, Lobby Flow & Real-Time Clock UI

<objective>
Build the client-side real-time multiplayer subsystem: the typed `useGameRoom` WebSocket hook, the `MatchmakingLobby` UI with live player queue stats, the dual-timer `ChessClock` component (with untimed support and disconnect warnings), and the `/play/:code` `PlayRoomPage` shell.

Purpose: Connect human and guest players to real-time rooms and random matchmaking queues with low latency, seamless reconnection, and clear visual indicators.
Output: Complete frontend multiplayer client suite wired to the Cloudflare Durable Objects backend.
</objective>

<context>
Load for context:
- .agent/state/SPEC.md
- .agent/state/DECISIONS.md (DECISION-006)
- .agent/state/phases/3/RESEARCH.md
- .agent/state/phases/3/01-PLAN.md
- src/context/AuthContext.tsx
- src/App.tsx
</context>

<tasks>

<task type="auto">
  <name>Create Typed Protocol & useGameRoom WebSocket Hook</name>
  <files>
    src/types/room.ts
    src/services/matchmakingApi.ts
    src/hooks/useGameRoom.ts
  </files>
  <action>
    1. Create `src/types/room.ts` sharing client-server room contracts:
       - `RoomState`, `PlayerSlot`, `ClockState`, `RoomEvent`, `ClientMessage`.
       - Message types: `join`, `turn`, `chat`, `resign`, `draw_offer`, `draw_accept`, `sync`, `presence`, `timeout`, `game_over`, `ping`, `pong`.
    2. Create `src/services/matchmakingApi.ts`:
       - `getQueueStats()`: fetches `GET /api/matchmaking/stats`.
       - WebSocket queue listener connecting to `/api/matchmaking/ws` for real-time queueing and `match_found` notifications.
    3. Implement `src/hooks/useGameRoom.ts`:
       - Accepts `roomCode: string`, `user: { id, username, isGuest } | null`.
       - Manages native `WebSocket` connection to `${protocol}//${host}/api/room/${roomCode}`.
       - Automatic reconnection with exponential backoff on unexpected drops.
       - Heartbeat ping every 20s to keep connection alive and measure round-trip latency.
       - Dispatches incoming server events to React state (`roomState`, `connectionStatus`, `latencyMs`, `messages`, `error`).
       - Exposes helper methods: `sendTurn(payload)`, `resign()`, `offerDraw()`, `acceptDraw()`, `sendChat(text)`.
       - Computes local interpolated clock time (smooth countdown of moving player's clock aligned with server delta).
    AVOID: Relying strictly on client intervals without server timestamp reconciliation; always synchronize against server `lastTurnTimestamp`.
  </action>
  <verify>
    npm run build
  </verify>
  <done>
    `useGameRoom` hook and room protocol types compile without errors.
  </done>
</task>

<task type="auto">
  <name>Build MatchmakingLobby Component with Live Metrics & Dual Matchmaking</name>
  <files>
    src/components/MatchmakingLobby.tsx
    src/pages/DashboardPage.tsx
  </files>
  <action>
    1. Implement `src/components/MatchmakingLobby.tsx`:
       - Header badge showing live statistics: `"X players in queue • Y active matches"`.
       - Tab 1: **Quick Match**:
         - Variant selector cards (`Deck Builder Chess` or `3D Wormhole Chess`).
         - "Find Match" CTA with pulsating radar animation when searching (`"Finding opponent for Deck Builder Chess..."`), estimated wait time, and "Cancel" button.
         - On `match_found`: celebratory flash and immediate navigation to `/play/${roomCode}`.
       - Tab 2: **Private Match**:
         - Create Room section:
           - Time control selector: 3 min (Blitz), 5 min (Rapid), 10 min (Classical), or Untimed (Casual).
           - "Generate Room" button creating unique 6-character code (e.g. `WH-9821`) and copying shareable URL `https://wormhole-chess.com/play/WH-9821`.
         - Join Room section:
           - 6-character code input with automatic uppercase formatting.
           - "Join Room" button redirecting to `/play/${code}`.
       - Spectate indicator for observing open/active matches.
    2. Update `src/pages/DashboardPage.tsx`:
       - Mount the `MatchmakingLobby` component directly into the dashboard alongside player stats.
       - Ensure responsive styling matching the space-themed dark palette (`#0a0b1e`, `#121530`, glowing cyan/purple accents).
  </action>
  <verify>
    npm run build
  </verify>
  <done>
    MatchmakingLobby component renders dual matchmaking modes and live queue metrics cleanly inside DashboardPage.
  </done>
</task>

<task type="auto">
  <name>Build ChessClock Component, PlayRoomPage Shell & Route Wiring</name>
  <files>
    src/components/ChessClock.tsx
    src/pages/PlayRoomPage.tsx
    src/App.tsx
  </files>
  <action>
    1. Create `src/components/ChessClock.tsx`:
       - Renders dual White and Black digital clocks (format `mm:ss` or `m:ss.s` when under 10s).
       - Active turn highlighting with glowing borders and ticking animation.
       - Handles untimed matches by rendering a subtle "Casual / Untimed" badge instead of countdown numbers.
       - Disconnect alert banner: if opponent is disconnected, shows an amber warning bar with 60s countdown: `"Opponent disconnected. Forfeit in X seconds..."`.
       - Low time warning (<30s) pulsing in red.
    2. Create `src/pages/PlayRoomPage.tsx`:
       - Extracts `code` param from URL via `useParams()`.
       - Consumes `useGameRoom(code)`.
       - Renders top navigation bar with room code, shareable link copy button, connection status badge (green/yellow/red), and round-trip latency (`42ms`).
       - Player header displaying White Player (username, ELO/Guest), Black Player (username, ELO/Guest), and active turn indicator.
       - Top/Bottom `ChessClock` positioning matching standard online chess layouts.
       - Central game canvas container (ready to host 2D Deck Builder or 3D Wormhole board).
       - Floating HUD controls: Resign, Offer Draw, Toggle Chat drawer.
       - Spectator banner if current user is neither White nor Black: `"Spectator Mode — Watching Live Match"`.
       - Game Over modal on finish (showing winner, reason: checkmate/resignation/timeout/disconnect, and "Return to Dashboard" / "Play Again" buttons).
    3. Update `src/App.tsx`:
       - Add `<Route path="/play/:code" element={<PlayRoomPage />} />`.
  </action>
  <verify>
    npm run build
  </verify>
  <done>
    PlayRoomPage and ChessClock compile cleanly, fully wired into App router with zero build errors.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run build` succeeds in < 2 seconds with zero TypeScript or bundling errors
- [ ] `/play/:code` route is registered in `App.tsx`
- [ ] `useGameRoom` exposes `sendTurn`, `resign`, `offerDraw`, and clock status
- [ ] `ChessClock` supports both timed (countdown) and untimed modes with disconnect grace warnings
- [ ] `MatchmakingLobby` provides quick-match queueing and private room creation
</verification>

<success_criteria>
- [ ] Production build succeeds cleanly
- [ ] Full client-side multiplayer loop ready to host chess variants
- [ ] Complete traceability to REQ-07 and NFR-03
</success_criteria>
