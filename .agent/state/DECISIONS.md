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

### [DECISION-007] Deck Builder Chess Architecture: chess.js Foundation, Energy Economy, Fixed Tactical Hand & Dual Play Modes

**Date**: 2026-10-14
**Status**: Accepted

#### Context
Phase 4 requires building the 2D Deck Builder Chess variant, including board rules, card action system, turn loop, AI opponent, and deck customization. We evaluated chess move generation options, card resource economy, card pool mechanics (preventing "deck fail"), and game modes.

#### Scope
- Implement 2D Deck Builder Chess board engine and rules with 8x8 chess + card action resolution (REQ-08, REQ-09).
- Implement a lightweight heuristic AI bot for solo testing (REQ-10).
- Support both Solo Play vs AI (instant client-side) and Online Multiplayer via existing `GameRoomDO` rooms (REQ-07, REQ-09).
- Implement Deck Builder card collection and custom loadout configuration UI (REQ-11).

#### Approach
1. **Chess Engine Foundation (`chess.js`)**:
   - Chose: Use `chess.js` for standard 8x8 move validation, king safety, check/checkmate detection, and FEN tracking, wrapped with a custom `DeckChessEngine` / `CardActionResolver`.
   - Reason: Prevents subtle chess rule bugs (castling privileges, en passant, pins) and isolates card effects into a clean, testable wrapper layer.
2. **Energy Economy (3 Energy per Turn)**:
   - Chose: Each player receives 3 Energy at the start of their turn to spend on tactical cards (cards cost 1–3 Energy), combined with 1 mandatory chess move.
   - Reason: Provides rich tactical decision-making and allows combining multiple low-cost cards or single powerful high-cost cards.
3. **Fixed Tactical Hand (No Deck Fail)**:
   - Chose: Players enter matches with a fixed hand of 6 curated cards (selected from a library of 5–8 abilities). No random drawing or deck exhaustion mechanic.
   - Reason: Eliminates RNG draw frustration and deck-fail states while maintaining chess-like strategic determinism. The Deck Builder UI allows players to configure their active loadout.
4. **Dual Play Modes (Solo AI + Online Multiplayer)**:
   - Chose: Build both instant Solo Play vs AI (client-side heuristic minimax evaluator with piece values and card utility scoring) and Online Multiplayer (using Phase 3's `GameRoomDO` WebSocket coordinator).
   - Reason: Solo AI provides immediate zero-wait testing and casual practice, while online multiplayer delivers the full competitive experience.

#### Constraints
- 2D responsive board interface in v1 (CON-03).
- Strictly turn-based gameplay (CON-02).
- Pure TypeScript implementation of card resolver and AI bot compatible with browser and server.

---

### [DECISION-008] Phase 5 Integration, Cloud Deck Sync, Replay Viewer & Production Deployment

**Date**: 2026-10-15
**Status**: Accepted

#### Context
Phase 5 addresses end-to-end integration, persistence, and production deployment across both chess variants (3D Wormhole Chess and 2D Deck Builder Chess). We evaluated match recording scope (PvP vs solo/local), ELO integrity, custom deck cloud persistence, replay viewer capabilities, and Cloudflare Pages SPA deployment.

#### Scope
- **D1 Match History for Online & Local Games**: Record both multiplayer games (via `GameRoomDO`) and local/solo games (via `POST /api/matches`), explicitly tagged (`pvp_online` vs `solo_local` or variant sub-tags like `deck_builder:ai`, `wormhole:local`).
- **ELO Integrity**: Only competitive online multiplayer matches modify ELO rating. Solo AI and local matches record games played, win/loss stats, and move histories without inflating competitive ELO.
- **Interactive Historical Match Viewer**: Build an interactive replay viewer in `DashboardPage` allowing players to step forward/backward through moves, auto-play, and inspect card actions played alongside chess moves.
- **Cloud Custom Deck Sync**: Implement `/api/decks` endpoints backing 8-card loadouts in D1 `custom_decks` for registered players, with automatic fallback to `localStorage` for guests and seamless migration upon registration.
- **Production Deployment & SPA Routing**: Unified build & verification scripts (`npm run build:all`, `npm run typecheck:all`), Cloudflare Pages SPA routing fallback (`_routes.json` / `404.html`), and documented D1 migration workflow.

#### Approach
1. **Separated Match Persistence (`POST /api/matches`, `GET /api/matches`)**:
   - Chose: Dedicated endpoints in Pages Functions. `GET /api/matches` returns recent match history for the current user. `POST /api/matches` records completed solo/local games.
   - Reason: Enables players to review all games while preserving server-authoritative ELO computation in `GameRoomDO`.
2. **Enriched Replay Move Representation**:
   - Chose: Serialize moves as a structured JSON array containing `{ turnNumber, player, chessMove, cardAction, fen, combatText, timestamp }`.
   - Reason: Enables the historical replay viewer to reproduce both chess board state and tactical card activations accurately.
3. **Cloud Deck Sync with Guest Fallback**:
   - Chose: `/api/decks` REST endpoint saving to D1 `custom_decks`. If offline or in guest mode without DB connectivity, seamlessly fall back to `localStorage`.
   - Reason: Ensures deck persistence across devices for registered players while preserving zero-barrier play for guests.
4. **Lightweight Tactile Audio Polish**:
   - Chose: Synthesized Web Audio API sound effects for move, capture, check, card activation, and victory/defeat.
   - Reason: Zero external audio asset downloads, instantaneous feedback, and easy mute/unmute control.

#### Constraints
- Must adhere to Cloudflare Pages Functions and D1 schema.
- SPA routes (`/play/:code`, `/deck-builder`, `/dashboard`) must load cleanly in Cloudflare Pages without 404 errors.

---

### [DECISION-013] Modular Card Behavior Registry and Chess Invariant Enforcement

**Date**: 2026-10-15
**Status**: Accepted

#### Context
Deck Builder Chess allows players to play a tactical card during their `PRE_MOVE_WINDOW` before making their standard chess move. Previously, card targeting and mutation logic was embedded in monolithic switch statements in `DeckChessEngine.ts`. This led to tight coupling, unimplemented expanded cards, and critical invariant bugs:
1. `knight_escort` placed passenger pawns on the knight's starting anchor square (e.g. `b1` or `g1`), and `king_decree` allowed swapping with pawns from back ranks. Pawns on rank 1 or 8 violated chess rules and caused `chess.js` to crash (`Invalid FEN: some pawns are on the edge rows`), breaking engine cloning, minimax AI search, multiplayer WebSocket syncing, and replay viewing.
2. Holographic barriers in `getLegalMoves()` only checked sliding rays (`r`, `b`, `q`), allowing pawn double-steps (`e2` -> `e4` through `e3`) and castling transit to pass through barriers.
3. Shields attached to static square coordinates without following the piece when it moved.
4. Future iterations or card balance changes required touching core chess engine code.

#### Decision
1. **Extracted Modular Card Registry (`src/engine/cards/cardRegistry.ts`)**:
   - Created `CardBehaviorHandler` interface declaring `evaluateConditions`, `getTargets`, `getSecondaryTargets`, and `execute`.
   - Extracted all 8 starter cards and 4 expanded cards into dedicated, self-contained handlers.
   - Core `DeckChessEngine` delegates card targeting and mutation to the registry, completely decoupled from engine internals.
2. **Rank Boundary & FEN Invariant Enforcement**:
   - `isValidPawnSquare(square)` enforces ranks 2..7 for all pawns.
   - `knight_escort` transports passenger pawns exclusively to safe flank/adjacent squares on ranks 2..7.
   - `king_decree` excludes pawns from swap targets when King is on rank 1 (White) or rank 8 (Black), and simulates King safety against check.
   - `activateCard()` simulates the board state before applying mutations, validating FEN integrity via `new Chess(fen)` and ensuring the active player retains at least 1 legal chess move.
3. **Barrier Path Enforcement**:
   - `getLegalMoves()` blocks pawn double-steps through barriers (`(from.rank + to.rank) / 2`) and castling king transit squares (`f1`/`d1` or `f8`/`d8`).
4. **Dynamic Shield Migration**:
   - When a shielded piece moves in `makeMove()`, its active shield modifier automatically migrates to the destination square.
5. **Comprehensive Automated Test Suite**:
   - Added `scripts/verify-all-cards.ts` with 83 automated assertions covering turn lifecycle, every card effect, barrier/shield rules, and edge cases, registered as `npm test`.

#### Consequences
- Any card can be added, tweaked, rebalanced, or retired in `cardRegistry.ts` without touching the chess engine.
- FEN errors are completely eliminated.
- Test suite guarantees continuous correctness.

---

*Last updated: 2026-10-15*


