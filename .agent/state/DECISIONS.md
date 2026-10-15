# DECISIONS.md — Architecture Decision Records

> **Purpose**: Log significant technical decisions and their rationale.

---

## Decisions

### [DECISION-001] Migrate from Create React App to Vite

**Date**: 2026-10-14
**Status**: Accepted

#### Context
The existing repository uses `react-scripts` 5.0.1 (Create React App), which has been officially deprecated. It has slow build times (~2 minutes), high bundle overhead, and poor compatibility with Cloudflare Pages Functions and modern dev workflows.

#### Decision
Migrate the frontend build tooling to Vite with `@vitejs/plugin-react`.

#### Rationale
- Vite reduces production build times from ~120s to < 5s.
- Near-instant Hot Module Replacement (HMR) speeds up development iterations.
- Native TypeScript and ES modules support.
- Smooth integration with Cloudflare Pages.

#### Consequences
- Need to convert `public/index.html` to root `/index.html` with `<script type="module" src="/src/index.tsx">`.
- Need to replace `react-scripts` commands in `package.json` with `vite` and `vite build`.
- Remove CRA-specific environment configurations (`GENERATE_SOURCEMAP`).

---

### [DECISION-002] Cloudflare Serverless Architecture (Pages + Workers + D1 + Durable Objects)

**Date**: 2026-10-14
**Status**: Accepted

#### Context
The project requires hosting, relational persistence for users and matches, and stateful turn coordination for multiplayer chess variants while maintaining serverless scalability.

#### Decision
Use Cloudflare Pages for static frontend hosting, Cloudflare Workers for REST API endpoints, Cloudflare D1 for relational SQLite storage, and Cloudflare Durable Objects for room management and turn coordination.

#### Rationale
- Cloudflare Pages provides automated git deployments with edge performance at wormhole-chess.com.
- Cloudflare D1 gives relational querying for users, sessions, and match histories without maintaining a database server.
- Cloudflare Durable Objects provide strongly consistent in-memory state coordination and room routing, ideal for turn-based match sessions.

#### Consequences
- Requires Cloudflare Workers development configuration (`wrangler.jsonc`).
- Need local emulation via Miniflare / Wrangler during development.

---

### [DECISION-003] Authentication Strategy: Username/Password with Optional Email & Guest Sessions

**Date**: 2026-10-14
**Status**: Accepted

#### Context
Players should be able to try out variants immediately without signup friction, while returning players should have persistent profiles and stats.

#### Decision
Support two authentication tiers:
1. Registered accounts using username + hashed password with optional email stored in Cloudflare D1.
2. Anonymous Guest sessions issuing ephemeral guest tokens for immediate gameplay.

#### Rationale
- Zero-friction onboarding for new players.
- Secure, lightweight authentication without complex external OAuth dependencies for v1.

#### Consequences
- Workers API endpoints must support both authenticated user tokens and guest tokens.

---

### [DECISION-004] 2D Interface for Deck Builder Chess

**Date**: 2026-10-14
**Status**: Accepted

#### Context
Deck Builder Chess requires card hand management, card drag-and-drop, card text readability, and chess moves. Building it in 3D right away would slow down iteration.

#### Decision
Implement Deck Builder Chess using a responsive 2D board and card UI in v1. 3D board rendering can be considered in future milestones.

#### Rationale
- Accelerates game balance, card rule iterations, and UI responsiveness.
- Distinct visual identity complementing the 3D Wormhole Chess variant.

---

### [DECISION-005] Cloudflare Pages Functions Backend with HttpOnly Cookies & D1 Sessions

**Date**: 2026-10-14
**Status**: Accepted

#### Context
Phase 2 requires backend API endpoints for authentication and player profiles, with D1 SQLite persistence. We evaluated standalone Cloudflare Workers vs Cloudflare Pages Functions, and Bearer JWTs vs HttpOnly cookies.

#### Decision
1. Implement the API backend using **Cloudflare Pages Functions** (`functions/api/*`).
2. Implement session management using **HttpOnly `Set-Cookie` session tokens** stored in a D1 `sessions` table.
3. Use browser/edge-native Web Crypto API (`PBKDF2` with HMAC-SHA256 and unique salts) for secure password hashing.
4. Support anonymous guest sessions via the same session mechanism (tagged as `is_guest: 1`) allowing seamless upgrade to registered accounts.

#### Rationale
- Pages Functions deploy alongside the Vite static build with zero CORS configuration and shared origin at `wormhole-chess.com`.
- HttpOnly cookies provide protection against XSS-based session hijacking.
- Storing active sessions in D1 allows instant server-side revocation and guest-to-registered account conversion without losing player stats.

#### Consequences
- Need `functions/tsconfig.json` or type support for Cloudflare Pages Functions (`@cloudflare/workers-types`).
- Requires CSRF prevention (SameSite cookie attributes + anti-CSRF header or token verification on mutating requests).
- Local dev can use `wrangler pages dev` or Vite proxy with local D1 emulation.

---

### [DECISION-006] Real-Time Multiplayer Architecture: Durable Objects, WebSockets, Dual Matchmaking & Spectators

**Date**: 2026-10-14
**Status**: Accepted

#### Context
Phase 3 requires stateful room coordination and multiplayer synchronization for turn-based variants (Deck Builder Chess and Wormhole Chess). We evaluated room lifecycle architecture, networking protocols, matchmaking queues, spectator modes, and clock synchronization.

#### Decision
1. **Variant-Agnostic Room Coordinator**: Implement a generic `GameRoomDO` Durable Object that manages seats (White, Black, Spectators), turn order alternation, clocks, disconnect/reconnect grace periods, and broadcasts opaque move payloads. Decouples networking from specific chess rules, allowing reuse across all variants.
2. **Hibernatable WebSockets**: Use Cloudflare Durable Objects Hibernatable WebSockets (`state.acceptWebSocket`) for ultra-low latency (<50ms) turn propagation and zero-cost idle connection handling.
3. **Dual Matchmaking Modes**:
   - **Private Rooms**: 6-character room codes with shareable URLs (`/play/:code`), optional custom clocks, or untimed casual play.
   - **Global Random Matchmaking Queue**: Centralized `MatchmakerDO` / lobby coordinator that pairs waiting players and broadcasts live visual metrics (players in queue, active matches).
4. **Configurable Turn Clocks**: Support timed clocks (e.g., 3m, 5m, 10m blitz/rapid) with the option to disable the clock completely for untimed matches.
5. **Read-Only Spectators**: Additional connections beyond the two players are granted spectator seats to receive live moves and clock sync without mutation permissions.

#### Rationale
- Decoupled room coordination prevents code duplication between 2D Deck Builder and 3D Wormhole Chess.
- Hibernatable WebSockets satisfy NFR-03 (<150ms turn submission) with high efficiency.
- Dual matchmaking satisfies casual friendly matches and instant public play.
- Live lobby counts provide immediate visual feedback of platform activity.
- Spectators support sharing matches and watching friends play.

#### Consequences
- Need a dedicated Cloudflare Worker package/directory (`worker/` or `packages/game-server/`) defining `GameRoomDO` and `MatchmakerDO`.
- Pages Functions or direct WebSocket routing to proxy connections to the DO stubs.
- Frontend requires a reusable `useGameRoom` React hook / WebSocket client to manage reconnects, heartbeats, and room events.

---

*Last updated: 2026-10-14*

