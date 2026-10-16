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

### [DECISION-014] Frontend Visual Craft, Anti-AI-Slop & Mandatory Copy Confirmation Policy

**Date**: 2026-10-15
**Status**: Accepted

#### Context
The initial implementation of the frontend views relied on default LLM visual patterns (undifferentiated dark grey surfaces, unconstrained card proportions, generic badges, and awkward spacing ratios). Additionally, default LLM-generated UI text often falls into hyperbolic, cringey, or corporate filler.

#### Decision
1. **Milestone v2.0 Scope**: Systematically redesign all views using `@design-phase.md` page-by-page (researching curated niche benchmarks, generating 3–5 visual variants, capturing screenshots, and gaining user approval before planning or implementation).
2. **Mandatory Copy Approval Mandate**: The agent must NEVER write or inject user-facing copy (headings, hero text, card descriptions, tooltips, empty states, or button labels) without explicitly proposing the exact text strings to the user and obtaining confirmation first.
3. **Design System & Anti-Slop Directives**: Codified in `.agent/rules/STYLE.md` with layered neutrals, deliberate typography pairings, restrained tabular figures, and balanced screen proportions (fixing Deck Builder board and panel proportions).

#### Consequences
- Eliminates AI-slop visual and textual artifacts.
- Guarantees high-craft aesthetic continuity across all pages.
- Prevents awkward copy by keeping the user as the final editor of all UI text.

---

### [DECISION-015] Phase 1 Design System Tokens & Technical Density Dashboard Architecture

**Date**: 2026-10-15
**Status**: Accepted

#### Context
Following the `@design-phase.md` workflow for Phase 1 (Design System Foundations & Player Dashboard Redesign), three distinct visual variants were generated, rendered with Playwright at 2x retina scale, and presented for user evaluation: Variant A (Technical Density 2-Column Command Layout), Variant B (Minimalist Monochrome Single-Column), and Variant C (Tactical Glass Bento). Candidate copy was reviewed with the user, establishing that "less is more" for daily use.

#### Decision
1. **Design Direction Selected**: Variant A (Technical Density).
2. **Layout Geometry**: Widescreen-balanced 2-column distribution (`1fr 340px`) separating interactive queues and recent matches into an expansive left feed while anchoring identity, tabular statistics, and deck loadouts in a right sidebar.
3. **Design Tokens**:
   - Palette: Deep jet canvas (`#090a0f`), primary surface (`#0e1118`), panel headers (`#0c0e14`), borders (`1px solid rgba(255, 255, 255, 0.08)`).
   - Accents: Cyan (`#38bdf8`), Matchmaking / Victory Emerald (`#10b981`), Defeat Rose (`#f87171`), 3D Arena Blue (`#2563eb`), Deck Builder Purple (`#7c3aed`).
   - Radii: `6px` structural panels and cards, `4px` interactive buttons and status pills.
   - Typography: Tabular monospace figures (`ui-monospace`) for ratings, timers, and game records.
4. **Copy Nomenclature**:
   - Logo: "Wormhole Chess"
   - Navigation: "Home" · "Wormhole" · "Deck Builder" · "Profile"
   - Actions: "Find Match", "Create Room", "Join with Code", "Replay", "Play Wormhole", "Play Deck Builder"
   - Modes: "Wormhole" (3D) and "Deck Builder" (2D) without hyperbolic adjectives.

#### Consequences
- Forms the core design tokens codified in `STYLE.md` and `DESIGN_STATE.md` to be inherited by Phases 2–5.
- Dashboard avoids vertical scroll bloating on standard 1280x800 screens.
- Approved visual reference locked at `.agent/state/artifacts/design/phase_1_approved.png`.

---

### [DECISION-016] Phase 2 Tactical Arena Architecture & Authentic Wormhole Chess Color System

**Date**: 2026-10-15
**Status**: Accepted

#### Context
Phase 2 redesigns the Deck Builder Chess arena (`/deck-builder`). In v1, the 2D chessboard (520px) stacked vertically above the tactical hand bar (140px) and opponent bars exceeded 800px in height, causing vertical scroll jank on standard 1280x800 desktop viewports. Additionally, the user requested incorporating the authentic custom color scheme they manually created for the 3D Wormhole Chess game (`src/components/Constants.tsx`) project-wide, anchoring the left side with a collapsible rail, and keeping the tactical card dock flush to the board width with an accordion/carousel hover expand effect.

#### Decision
1. **Arena Layout Architecture**: Variant A Refined (Collapsible Left Rail + Balanced Center Stage + Tabular Move History Right Sidebar).
   - Board size balanced at 470px by 470px (`aspect-ratio: 1 / 1`).
   - Tactical card dock locked to strictly 470px width, perfectly flush with the board.
   - Accordion/carousel card hover expand effect: hovering a card expands its width from 42px to ~115px (`flex: 2.6`) to reveal its title and effect rules without expanding the 470px container.
   - Collapsible left navigation rail (58px) with quick route icons, settings, and collapse toggle.
2. **Authentic Wormhole Color Palette** (codified in `STYLE.md` and `DESIGN_STATE.md` project-wide):
   - Base Background: Deep Charcoal `#191B1D`
   - Card / Panel Surface: Charcoal `#24272A`
   - Header / Rail: Dark Charcoal `#1C1E20`
   - Light Squares: Smokey Taupe `#8B7E74`
   - Dark Squares: Loden Green Dark `#3C493F`
   - Brand & Active Glow: Warm Gold `#D4AF37`
   - Primary Actions: Loden Green `#4C5C4C`
   - Resign / Danger: Brick Red `#AA4A44`
   - Primary Headings / Text: Warm White `#FAF9F6`
3. **Approved UI Copy**:
   - Mode Header: "Deck Builder Chess" (no subtitle).
   - View Tabs: "Find Match" and "My Deck".
   - Opponent & Player Graveyard: Real piece glyphs (`♟ ♞`) with advantage tally (`+2`).
   - Turn indicator: Chess.com-style illumination/shading.
   - Move History: Clean algebraic notation plies without "Combat Log" title.
4. **Future Polish Item**:
   - Refine the tactical hand carousel with a full-card pop-out reveal effect on hover (tracked in `TODO.md`).

#### Consequences
- Eliminates 100% of vertical scrolling on standard desktop viewports (1280x800).
- Harmonizes the aesthetic identity of the entire website with the creator's original custom 3D Wormhole Chess colors.
- Approved visual reference locked at `.agent/state/artifacts/design/phase_2_approved.png`.

---

### [DECISION-017] Phase 3 Home Landing & Authentication Architecture: Unified Stage & Restrained Copy

**Date**: 2026-10-15
**Status**: Accepted

#### Context
Phase 3 redesigns the Home Landing page (`/`) and Authentication page (`/login`, `/register`). The legacy versions featured wordy, generic AI-generated marketing copy, bright GitHub-style blues and greens (`#1f6feb`, `#238636`), and bloated cards. In design research, the user evaluated 3 visual variants and requested a hybrid combining the unified tab stage from Variant B, tactical card asset previews from Variant C, and the total removal of unnecessary under-hero feature cards, with a strict "less is more" copy approach.

#### Decision
1. **Home Landing Layout**:
   - Ultra-minimal hero: `Wormhole Chess` with concise subtitle `A collection of chess variants.`.
   - Total elimination of the 3 under-hero feature cards to eradicate filler text and visual clutter.
   - Unified stage with tabbed variant switching (`🃏 Deck Builder Chess` | `🌀 3D Wormhole Chess`).
   - **Deck Builder View**: 4-card sample asset rack (`♞ Knight Escort [2⚡]`, `🛡️ Shield Wall [1⚡]`, `🌀 Spatial Warp [3⚡]`, `👑 King Decree [2⚡]`), 3/3 energy counter, primary action button `Play Deck Builder →`, and secondary `Solo Practice`.
   - **3D Wormhole View**: Dual isometric board schematic with dimensional portal beam and approved one-liner `Two 8x8 boards linked by a hole in the middle, for up to 4 players.`.
2. **Authentication Page Layout**:
   - Crisp 400px centered card adhering to the Wormhole palette (`#24272A` surface, `#191B1D` canvas, `1px solid rgba(139, 126, 116, 0.25)` borders).
   - Segmented tabs: `Sign In` · `Register` · `Guest`.
   - Clean form fields with 4px radii, uppercase micro-labels, and `#4C5C4C` Loden Green submit button.
3. **Approved Copy**:
   - Hero Subtitle: `A collection of chess variants.`.
   - 3D Wormhole One-Liner: `Two 8x8 boards linked by a hole in the middle, for up to 4 players.`.
   - Deck Builder One-Liner: `Standard chess rules with an 8-card loadout and 3 energy per turn.`.

#### Consequences
- Eliminates generic AI marketing slop across entry-point routes.
- Promoted UI shell provides concrete foundation for Phase 3 planning and execution.
- Approved visual reference locked at `.agent/state/artifacts/design/phase_3_approved.png`.

---

### [DECISION-018] Phase 4 3D Wormhole HUD Architecture: Variant A Tactical Glass HUD

**Date**: 2026-10-15
**Status**: Accepted

#### Context
Phase 4 redesigned the 3D Wormhole Chess canvas (`WormholePage.tsx`, `ChessboardScene.tsx`) and multiplayer room (`PlayRoomPage.tsx`). The legacy implementation featured an intrusive 80px fixed top navigation header and an inflexible 380px fixed olive-drab right sidebar that compressed the WebGL viewport and broke spatial immersion. User selected Variant A (Tactical Glass HUD) during design research.

#### Decision
1. **Full-Viewport Canvas Immersion**:
   - Expanded the Three.js WebGL canvas to full `100vw × 100vh` spatial view, completely removing fixed top headers and fixed sidebars.
2. **Floating Tactical Glass Capsule**:
   - Mounted a centered, semi-transparent top HUD capsule (`rgba(28, 30, 32, 0.88)` + `backdrop-filter: blur(14px)`) displaying `← Home`, `3D Wormhole SPATIAL` label, active turn status indicator with golden accent, tabular game clocks, and conclude match button.
3. **Floating Bottom Camera Dock**:
   - Anchored a bottom-center camera dock providing one-click camera presets and monospace keybinding indicators: `Top View [T]`, `Flip 180° [F]`, `Rotate 90° [R]`, `Orbit Lock [L]` with gold border when active, and `Reset [X]`.
4. **Collapsible Right Telemetry Drawer**:
   - Replaced the fixed sidebar with a 290px slide-out telemetry drawer showing move history, turn counter, board reset, themes modal, and controls tips.
5. **Multiplayer Room Arena Polish**:
   - Aligned `PlayRoomPage.tsx` with `#191B1D` canvas, 6px cards, and restrained zero-fluff copy.

#### Consequences
- 100% immersive 3D spatial view with floating glass overlays.
- Approved visual reference locked at `.agent/state/artifacts/design/phase_4_approved.png`.

---

### [DECISION-019] Phase 5 Deck Builder Card Graph: 6x6 Taxonomy, Symmetrical 3-Cycles & Unified Action Model

**Date**: 2026-10-16
**Status**: Accepted

#### Context
Previously, tactical cards in Deck Builder Chess were a loose collection of one-off abilities without an underlying mathematical framework or thematic consistency. Additionally, turns were split into a disconnected two-phase structure: playing a card in a `PRE_MOVE_WINDOW` followed by making an unrelated chess move, which led to potential double-action exploits and UI friction.

#### Decision
1. **Deterministic 6×6 Grammar Matrix**:
   - Every card is generated by a deterministic grammar: $\text{Piece Anchor} \times \text{Condition Genre} \longrightarrow \text{Effect Genre}$.
   - **6 Condition Genres** (5 concrete triggers each):
     - `Position`: Corner, Center, Back Rank, Rim / Edge, Enemy Territory.
     - `Neighbors`: Orthogonal Ally, Diagonal Ally, Specific Ally, Partner, Formation.
     - `Lines`: Open File, Open Rank, Open Diagonal, Direct Stare (same class), Sightline to King.
     - `Threat`: Under Fire, Delivering Check, Forking, Hunting High Value, Contested (Crossfire).
     - `Blocked`: Absolute Pin, Low Mobility ($\le 2$ moves), Covered Squares, Defended Target, Friendly in Way.
     - `Momentum`: Starting Square, Just Moved Last Turn, Long Dormant ($3+$ turns), Captured Last Turn, Consecutive Moves.
   - **6 Effect Genres** (tactile board themes, zero artificial turn-skipping or energy-draining meta-effects):
     - `New Moves`: Foreign movement vectors (orthogonal step, diagonal step, sideways step, sliding).
     - `Jump & Leap`: Bypassing obstacles, hopping barriers, rim-to-rim wraps, hit-and-run recoils.
     - `Move Others`: Coordinate swaps, passenger transport, tandem shifts, pushing/pulling allies.
     - `Special Captures`: Piercing through lines, straight pawn captures, ranged strikes without moving.
     - `Walls & Shields`: Holographic barriers on empty squares, kinetic shields protecting pieces.
     - `Spawning`: Summoning fresh pawns, graveyard resurrection.

2. **Two Symmetrical 3-Cycles (Condition Affinities)**:
   - Every condition is the specialty ("Good At") of exactly 1 piece, and excluded ("Bad At") by exactly 1 piece:
     - **Battlefield Minor Units**:
       - ♟ **Pawn**: Good at `Blocked` | Excludes `Momentum`
       - ♞ **Knight**: Good at `Momentum` | Excludes `Lines`
       - ♝ **Bishop**: Good at `Lines` | Excludes `Blocked`
     - **Royal Court Major Units**:
       - ♜ **Rook**: Good at `Neighbors` | Excludes `Position`
       - ♚ **King**: Good at `Position` | Excludes `Threat`
       - ♛ **Queen**: Good at `Threat` | Excludes `Neighbors`

3. **30-Cards-Per-Piece Architecture (180 Total Library)**:
   - Each piece has 5 active condition genres ($6 - 1 \text{ excluded}$).
   - The "Good At" condition branches into 2 distinct effect genres ($5 \times 2 = 10$ cards).
   - The other 4 condition genres map to 1 effect genre each ($4 \times 5 = 20$ cards).
   - Total cards per piece: $10 + 20 = 30$ cards, fully utilizing all 6 effect genres without excluding any effects.
   - Energy cost distribution follows a balanced bell curve: 12 cards at `1⚡` (40%), 12 cards at `2⚡` (40%), 6 cards at `3⚡` (20%).

4. **Unified Turn Action Model ("The Card IS the Move")**:
   - Unified turn flow: On each turn, the player executes either a **Standard Move (`0⚡`)** OR an **Empowered Card Move (`1–3⚡`)**.
   - No separate pre-move card phase. Playing a card directly modifies and fulfills the turn's movement/action.
   - **Tactile Board Interaction**: Clicking a piece on the board reveals standard moves in standard indicators (`0⚡`), and special card moves in glowing gold rings (`1–3⚡`). Selecting an empowered tile executes the move, deducts energy, consumes the card from the dock, and ends the turn.

5. **Canonical Phase 5 Vertical Slice Asset**:
   - The first 90 cards (Pawn, Knight, Bishop) are compiled and locked at `src/engine/cards/cardCatalog90.json`.
   - The remaining 90 cards (Rook, Queen, King) will be authored and integrated into the established schema in a subsequent wave.

#### Consequences
- Completely eliminates arbitrary one-off card design.
- Replaces disconnected two-phase turns with intuitive, blitz-paced "Supercharged Chess".
- Solves checkmate and invariant bugs by making all empowered card plays atomic chess actions.

---

### [DECISION-020] Phase 7 Global Polish, 3-Column TCG Ruffle Hand Stage, Palette Unification & Release Scope

**Date**: 2026-10-16
**Status**: Accepted

#### Context
Prior to planning Phase 7 (Global Polish, Micro-interactions, Responsive Audit & Release), we audited cross-page continuity across all 6 live routes (`/`, `/login`, `/dashboard`, `/deck-builder`, `/wormhole`, `/play/:code`). We identified that Phase 1 components (`Navigation.tsx`, `DashboardPage.tsx`, `MatchmakingLobby.tsx`, `HistoricalMatchViewer.tsx`) still used the initial cool-slate/cyan palette (`#090a0f`, `#0e1118`, `#38bdf8`, `#10b981`) rather than the Authentic Wormhole Palette locked in Phase 2 (`#191B1D`, `#24272A`, `#1C1E20`, `#D4AF37`, `#4C5C4C`). Additionally, during `@design-phase.md 7`, we prototyped and locked **Variant D** for `DeckBuilderPage.tsx`, replacing the redundant left route icon rail, secondary sub-header, and bottom horizontal card strip with a dedicated **Left TCG Ruffle Hand Stage**.

#### Scope
- **Cross-Page Palette Unification**: Migrate `Navigation.tsx`, `DashboardPage.tsx`, `MatchmakingLobby.tsx`, and `HistoricalMatchViewer.tsx` onto the Authentic Wormhole Palette (`#191B1D` base, `#24272A` surface, `#1C1E20` header, `#FAF9F6` warm white, `#8B7E74` smokey taupe, `#D4AF37` warm gold, `#4C5C4C` loden green, `#AA4A44` brick red).
- **3-Column TCG Ruffle Hand Stage (`DeckBuilderPage.tsx` & `TacticalHandBar.tsx`)**: Remove the redundant left route icon rail, secondary sub-header bar, and bottom under-board card bar. Render the player's hand on the left (`356px` panel on desktop) as **2 rows of 4 portrait TCG playing cards (`5:7` aspect ratio)** (or 1 row of 5 in 5-card mode) with ruffle overlap (`margin-left: -24px`), smooth hover pop-out reveal (`scale(1.22) translateY(-18px) rotate(0deg)`), and an embedded mini-board visual explainer inside the card art window. Expand the Center Chessboard to a full `512×512px` square.
- **Restrained Copy Alignment (`PlayRoomPage.tsx`)**: Replace legacy `'3D Wormhole Hyperbolic Arena'` with `'3D Wormhole'` and `'Deck Builder Chess Board'` with `'Deck Builder'` per `STYLE.md`.
- **Multi-Viewport Responsive Hardening & Audio Polish**: Harden mobile (`375×812`), tablet (`768×1024`), and desktop (`1440×900`) viewports across all 6 routes with zero horizontal overflow, wire complete procedural audio triggers (`playCaptureSound`, `playVictorySound`, `playDefeatSound`) for empowered moves and match conclusions, and verify with a comprehensive Playwright suite and production build check.

#### Approach
1. **3-Column TCG Ruffle Hand Stage (`DeckBuilderPage.tsx`)**:
   - Chose: **Variant D — Left TCG Ruffle Hand Spread (`356px`) + Full `512×512px` Center Board (No Bottom Card Bar) + Right Move History (`276px`)**.
   - Reason: Moving the cards to the left as true portrait TCG cards (Title + `⚡` Cost header, Center Art / Mini-Board Visual Explainer window, and `Condition ➔ Effect` + Description box) makes the bottom card bar and any separate Card Inspector box completely unnecessary while giving the 2D Chessboard full `512×512px` breathing room.
2. **Release & Verification Strategy**:
   - Chose: **Option A — Full UX/Responsive Sweep + Audio/Micro-interaction Polish + Multi-Viewport Playwright Suite + Production Build Verification**.
   - Reason: Ensures 100% empirical verification across all 6 routes and 3 viewport classes alongside `npm test` (203 card tests), `npm run typecheck:all`, and `npm run build`.

#### Constraints
- Strictly adhere to the Mandatory Copy Approval Rule in `.agent/rules/STYLE.md`.
- Preserve 100% of existing game engine invariants (203/203 unit tests passing) and responsive touch usability.

---

### [DECISION-021] Brand Title & Dual Icon Architecture

**Date**: 2026-10-16
**Status**: Accepted

#### Context
Branding was previously inconsistent across navigation, home page hero, and browser tabs, using various permutations ("Wormhole Chess", "Wormhole-Chess", "v2.0" badges, and generic blue emojis).

#### Decision
1. Standardize exact brand title strictly to **"WormholeChess"** (single word, PascalCase, no space, no hyphen).
2. Establish a Dual Icon Architecture:
   - **Hero Visual Anchor**: 3D Isometric Spacetime Illustration (`WormholeSpacetimeIllustration.tsx`) positioned in the primary hero lockup on `HomePage.tsx`.
   - **Compact Brand Mark**: Flat gold Squircle Icon (`WormholeLogo.tsx`) used for Navigation, browser favicon (`favicon.svg`, `favicon.ico`), and tab pills.

#### Consequences
- Eradicates disjointed logos and version tags.
- Establishes a cohesive identity across desktop and mobile entry points.

---

### [DECISION-022] Home Copy & Variant Nomenclature Refinement

**Date**: 2026-10-16
**Status**: Accepted

#### Context
Following Milestone v2.0 closeout, the user requested refining the hero subtitle and variant tab nomenclature on the home page for crisp, natural English phrasing and clean visual balance between variants.

#### Decision
1. Update hero subtitle from `"Home of your favorite chess variants"` to **`"Home to your favorite chess variants"`**.
2. Simplify the 3D variant tab name and section header from `"3D Wormhole Chess"` to **`"Wormhole Chess"`**, achieving clean parallel parity with `"Deck Builder Chess"`.

#### Consequences
- Eliminates awkward prepositioning and excessive adjectives.
- Aligned automated Playwright test suites (`verify-phase3-ux.mjs`, `full-ux-sweep.mjs`).

---

### [DECISION-023] Phase 1 Card Nomenclature, Zero-Ellipsis Rule Constraints & Static Vector Asset Pipeline

**Date**: 2026-10-16
**Status**: Accepted

#### Context
Prior to authoring task plans for Phase 1 (Card Nomenclature Polish & Schema Finalization), we discussed constraints regarding card text rendering, nomenclature tone, schema structure, and asset storage for the upcoming 180 vector illustrations (Phases 2 & 3).

#### Decision
1. **Zero-Ellipsis Rule & Anti-Truncation Policy**:
   - No text on screen may be truncated or cut off with an ellipsis (`...` or `text-overflow: ellipsis` or `line-clamp-2`).
   - All card rule notes must be brief, crisp, and self-contained so they render completely within card boundaries across desktop and mobile screens.
2. **Direct Tactical Language (No Flowery or Metaphorical Fluff)**:
   - Eradicate flowery, melodramatic, or overly metaphorical prose.
   - Use direct, evocative tactical language that directly describes the piece action (e.g. "Shield Wall", "Flank March", "Sniper Shot", "Railgun Bolt", "In-Place Capture").
   - Review and rename any vague or generic move titles to be direct and immediate.
3. **Schema Normalization**:
   - Clean up duplicate fields in `cardCatalog90.json` and `cardCatalogMajor90.json`: consolidate `card_name` into `name`, and `card_description` into `description`.
   - Add explicit `artId` field (e.g. `pawn_hold_the_line`) matching the SVG file identifier.
   - Keep card `id` values strictly immutable to preserve bindings in `cardRegistry.ts` and ensure zero engine regression.
4. **Static Vector Asset Architecture**:
   - In Phases 2 & 3, card vector SVGs will be stored under `public/assets/cards/{piece}/{artId}.svg`.
   - Implement a lightweight `<CardArt />` component for rendering and caching, ensuring zero bundle bloat in the main JavaScript chunk.

#### Consequences
- Prevents UI overflow and broken visual layouts.
- Guarantees immediate tactical readability during fast-paced play.
- Provides a clean schema and testable contract for Phases 2 & 3 asset creation.

---

### [DECISION-024] Phase 2 Minor Unit Vector Artwork Strategy, Generation Architecture & UI Integration

**Date**: 2026-10-16
**Status**: Accepted

#### Context
Phase 2 requires generating, reviewing, and integrating 90 bespoke vector illustration assets for Battlefield Minor Units (30 Pawn, 30 Knight, 30 Bishop) into the card game UI (`TacticalHandBar.tsx` and `DeckBuilderView.tsx`). We discussed scope presentation, aesthetic style-locking, and execution phasing.

#### Decision
1. **Option A Execution Strategy: Archetype Style-Lock Prototype + 3 Piece Waves**:
   - Step 1: Lock the Minor Unit visual grammar (line weights, duotone gold/taupe fills, tactical emblem framing) adhering to the Authentic Wormhole palette (`#D4AF37`, `#8B7E74`, `#FAF9F6`, `#191B1D`, `#24272A`).
   - Wave 1: Generate & verify 30 Pawn Vector Assets in `public/assets/cards/pawn/{artId}.svg`.
   - Wave 2: Generate & verify 30 Knight Vector Assets in `public/assets/cards/knight/{artId}.svg`.
   - Wave 3: Generate & verify 30 Bishop Vector Assets in `public/assets/cards/bishop/{artId}.svg`, wire card rendering components into UI, and visually verify via Playwright.
2. **UI Integration Scope**:
   - `TacticalHandBar.tsx`: Replace the default raw unicode glyph in the card's 38px center window with the vector illustration (`/assets/cards/{piece}/{artId}.svg`), while preserving the interactive flip to the 5x4 mini-board schematic on hover or active selection.
   - `DeckBuilderView.tsx`: Add a dedicated vector art thumbnail frame (e.g. 56px–64px) to each card item in the curator/library grid, introducing rich visual distinction while browsing loadouts.
   - Fallback Resilience: A dedicated `<CardArt />` component or standard `img` with `onError` fallback gracefully renders the piece glyph if an SVG fails to load or is being fetched.
3. **Asset Constraints**:
   - Clean, lightweight native SVGs (0-byte external dependencies, ~1.5–3KB each) with crisp vector geometry, no raster filters, scalable across retina displays.

#### Consequences
- Eliminates placeholder unicode glyphs across all 90 Minor Unit cards.
- Provides immediate visual flavor and card recognition in both the active game hand and deck builder curator.
- Retains full backward compatibility with engine handlers and preserves 100% test passing rate.

---

*Last updated: 2026-10-16*
