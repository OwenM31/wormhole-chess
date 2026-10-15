---
phase: 5
level: 2
researched_at: 2026-10-15T00:59:00-05:00
---

# Phase 5 Research: Integration, Polish & Production Deployment

## Questions Investigated

1. **Cloudflare Pages SPA Routing with Pages Functions**: How should Cloudflare Pages route client-side React Router paths (`/dashboard`, `/deck-builder`, `/play/:code`, `/wormhole`) without 404s while preserving server-side Pages Functions under `/api/*`?
2. **D1 Match History Persistence & ELO Rating Protection**: How should match records be structured in D1 to support paginated retrieval, variant filtering (`deck_builder:pvp`, `deck_builder:ai`, `wormhole:local`), move history inspection, and strict separation between competitive PvP ELO and casual practice games?
3. **Cloud Custom Deck Synchronization**: How should custom 8-card loadouts sync to D1's `custom_decks` table via `/api/decks` for registered users with seamless fallback to `localStorage` for guests and account upgrade migration?
4. **Interactive Historical Match Viewer**: How should the React UI reconstruct past game states, stepping forward and backward through both chess moves and simultaneous tactical card activations with playback controls?
5. **Zero-Dependency Synthesized Audio**: How can procedural sound effects (move clicks, captures, check alerts, card activations, game over stingers) be generated via the Web Audio API with zero asset downloads, zero latency, and global mute support?
6. **Full-Stack Deployment & Automation**: What unified build and migration scripts are required in `package.json` to verify TypeScript, build artifacts, apply D1 database migrations, and deploy to Cloudflare Pages and companion Workers?

---

## Findings

### 1. Cloudflare Pages SPA Routing with Pages Functions

When Cloudflare Pages hosts a project containing both a static build output (`build/`) and a `functions/` directory:
- By default, Cloudflare Pages attempts to route any path not matching a static file to a matching file in `functions/`.
- Deep links like `/play/ABCDE` or `/deck-builder` will result in HTTP 404 unless explicitly excluded from Functions routing and directed to the static asset fallback.
- **Solution (`public/_routes.json` & `public/_redirects`)**:
  - `_routes.json` explicitly defines which paths trigger Pages Functions. By specifying `"include": ["/api/*"]` and `"exclude": []`, only requests under `/api/` invoke Cloudflare Pages Functions.
  - Adding `_redirects` (`/* /index.html 200`) ensures that all frontend paths return HTTP 200 with `/index.html`, allowing React Router (`BrowserRouter`) to resolve the route client-side.

**Sources:**
- Cloudflare Pages Routing Documentation: `https://developers.cloudflare.com/pages/configuration/routing/`
- Cloudflare Pages Functions `_routes.json`: `https://developers.cloudflare.com/pages/functions/routing/#functions-routing-with-_routesjson`

**Recommendation:** Create `public/_routes.json` targeting only `/api/*`, alongside `public/_redirects` with `/* /index.html 200`.

---

### 2. D1 Match History Persistence & ELO Rating Protection

D1's `matches` table (`d1/schema.sql`) records:
`id`, `variant`, `white_user_id`, `black_user_id`, `winner_id`, `result`, `moves_pgn`, `started_at`, `ended_at`.

#### Variant & Match Type Tagging
- Multi-player Ranked: `deck_builder:pvp` (managed exclusively by server-authoritative `GameRoomDO`, which updates ELO in `player_stats`).
- Solo AI Practice: `deck_builder:ai` (submitted via `POST /api/matches` when a solo game concludes against `DeckChessAI`).
- Wormhole 3D Local: `wormhole:local` (submitted via `POST /api/matches` when a hotseat or local game ends).

#### Rating Protection Rule
- `POST /api/matches` endpoint only increments `player_stats.wins`, `losses`, or `draws` for casual/solo play—it **never** mutates `player_stats.elo_rating`.
- Competitive ELO changes remain strictly guarded within the server-authoritative `GameRoomDO` Durable Object.

#### Performance Indexing
Add a compound index in `d1/schema.sql` for rapid user match history queries:
```sql
CREATE INDEX IF NOT EXISTS idx_matches_user_started ON matches(white_user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_black_started ON matches(black_user_id, started_at DESC);
```

#### API Endpoints
- `GET /api/matches?limit=10&offset=0&variant=all`: Fetches authenticated user's match history with joined opponent usernames and parsed move counts.
- `POST /api/matches`: Body `{ variant, opponent, result, winner, moves, startedAt, endedAt }`. Authenticates session token, validates payload, and inserts into D1.

---

### 3. Cloud Custom Deck Synchronization

The `custom_decks` table in `d1/schema.sql` stores:
`id`, `user_id`, `deck_name`, `card_ids_json`, `is_active`, `created_at`, `updated_at`.

#### Workflow & API
- `GET /api/decks`: Returns all custom decks for the authenticated user, indicating which deck is currently `is_active`.
- `POST /api/decks`: Accepts `{ deckName: string, cardIds: string[], isActive: boolean }`.
  - Validates exactly 8 valid card IDs from `EXPANDED_LIBRARY`.
  - Enforces `validateDeckLoadout()` rules (at least 1 pawn card, at least 1 minor piece card, all energy costs 1–3).
  - Deactivates previous active decks if `isActive: true`, and inserts or updates the record.
- **Guest Fallback & Auto-Migration**:
  - `DeckBuilderView` queries `/api/decks` if authenticated. If the user is a guest or network fails, it seamlessly falls back to `localStorage` (`wormhole_active_deck_v1`).
  - When a guest registers a full account via `functions/api/auth/register.ts`, the existing user ID is updated in-place (`is_guest = 0`), automatically retaining all their custom decks and match history in D1.

---

### 4. Interactive Historical Match Viewer

To review matches with rich tactical card actions and chess moves:

#### Enriched Turn Format
Multiplayer `GameRoomDO` and solo `useDeckChessGame` will serialize turns into an array:
```ts
export interface RecordedTurn {
  turnNumber: number;
  player: 'white' | 'black';
  chessMove: { from: string; to: string; san?: string; promotion?: string };
  cardAction?: {
    cardId: string;
    cardName: string;
    targetSquare?: string;
    energyCost: number;
  };
  fenAfter: string;
  combatText?: string;
  timestamp?: number;
}
```

#### Viewer Architecture
- Modal / Panel component `HistoricalMatchViewer.tsx` rendered in `DashboardPage.tsx`.
- State: `currentIndex` (`-1` = initial starting board, `0` to `moves.length - 1`).
- Controls:
  - `|◀` Jump to Start (`currentIndex = -1`)
  - `◀` Step Back (`currentIndex - 1`)
  - `▶ / ⏸` Auto-Play toggle with timer interval (`1200ms`)
  - `▶` Step Forward (`currentIndex + 1`)
  - `▶|` Jump to Final (`currentIndex = moves.length - 1`)
- Visual display:
  - Board: 2D responsive board displaying `fenAfter` at `currentIndex`.
  - Move indicator: Arrow or highlight showing `chessMove.from` -> `chessMove.to`.
  - Tactical card callout: If `cardAction` exists on this turn, render a glowing card badge showing card name, piece-class theme color, and targeted square.
  - Interactive move table: Clickable turn list with current step highlighted.

---

### 5. Zero-Dependency Synthesized Audio (Web Audio API)

Instead of downloading heavy MP3/WAV files that can fail or introduce loading latency:
- Use browser `AudioContext` synthesizers (`OscillatorNode` + `GainNode` with exponential volume ramps).
- **Audio Profiles**:
  - `move`: Short subtle wood knock (triangle wave 320Hz -> 160Hz over 0.05s).
  - `capture`: Snappy tactile strike (triangle + noise burst 240Hz -> 80Hz over 0.08s).
  - `check`: Dual chime alert (sine 880Hz -> 1174Hz over 0.16s).
  - `cardPlay`: Arcane harmonic shimmer (arpeggiated 440Hz -> 660Hz -> 880Hz over 0.14s).
  - `victory`: Ascending major triad (C5, E5, G5, C6 chords over 0.6s).
  - `defeat`: Descending minor transition (Eb4 -> D4 -> C4 over 0.5s).
- **Mute Control**: Persisted in `localStorage` (`wormhole_sfx_muted`), with a subtle toggle icon (🔊 / 🔇) in Navigation and game views.

---

### 6. Full-Stack Verification & Deployment Commands

In `package.json`, provide cohesive scripts:
- `npm run typecheck:all`: Runs TypeScript verification across React app, Cloudflare Pages Functions, and companion Worker:
  `tsc --noEmit && npx tsc -p functions/tsconfig.json --noEmit && npx tsc -p worker/tsconfig.json --noEmit`
- `npm run build:all`: Builds Vite production bundle (`build/`) and checks worker builds.
- `npm run db:migrate:local`: Executes `d1/schema.sql` against local D1 database.
- `npm run db:migrate:prod`: Executes `d1/schema.sql` against production Cloudflare D1.
- `npm run deploy:worker`: Deploys companion Worker `wormhole-game-worker` via Wrangler.
- `npm run deploy:pages`: Deploys Pages frontend via Wrangler.

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pages Routing | `_routes.json` targeting `/api/*` + `_redirects` SPA rewrite | Prevents 404s on deep links while cleanly invoking Pages Functions |
| Match Persistence | Separate `deck_builder:pvp` vs `deck_builder:ai` / `wormhole:local` | Preserves competitive ELO integrity while allowing all games to be reviewed |
| Replay Data | JSON turn array with `chessMove`, `cardAction`, and `fenAfter` | Reconstructs both board positions and card effects deterministically |
| Deck Sync | `/api/decks` with `localStorage` mirror | Provides cross-device cloud persistence for users and zero-friction guest play |
| Audio Feedback | Web Audio API procedural synthesis | Zero external assets, zero latency, zero 404 risk, 100% offline capable |
| Build Tooling | Unified npm scripts (`typecheck:all`, `build:all`) | One-step multi-target build validation |

---

## Patterns to Follow

1. **Defensive Session Validation**: Use `getSession(context)` in all `/api/*` endpoints with clear `401 Unauthorized` responses.
2. **Deterministic State Replay**: Rely on FEN strings stored per turn in `RecordedTurn` to prevent chess move desynchronization during backward/forward scrubbing.
3. **Lazy AudioContext Initialization**: Only initialize `AudioContext` on first user interaction (click/touch) to satisfy browser autoplay policies.

---

## Anti-Patterns to Avoid

- **Client-Authoritative ELO Updates**: Never let client API calls directly update `player_stats.elo_rating`. Only the server-side `GameRoomDO` can modify ELO ratings.
- **External Sound Asset Fetching**: Do not load external audio files from CDNs or static folders that could fail to load or add bundle bloat.
- **Single Catch-All Functions Route**: Do not route `/*` to Cloudflare Pages Functions, which causes unnecessary worker invocation costs and SPA 404 failures.

---

## Dependencies Identified

| Package | Version | Purpose |
|---------|---------|---------|
| `chess.js` | `^1.4.0` | Move validation and FEN generation during replay (already installed) |
| `wrangler` | `^4.151.0` | D1 database migrations and deployment tooling (already installed) |
| Web Audio API | Browser Native | Procedural sound synthesis with zero external dependencies |

---

## Risks & Mitigations

- **Risk: Disconnected Cloudflare Database in Local Dev**:
  * *Mitigation*: Ensure `GET /api/decks` and `GET /api/matches` gracefully handle missing local D1 bindings with sensible empty fallbacks and descriptive logs instead of crashing the React application.
- **Risk: Replay viewer desynchronization on custom card effects**:
  * *Mitigation*: Storing `fenAfter` on each turn object ensures the board position is always 100% faithful to the exact game state, even if complex card effects were applied.

---

## Ready for Planning

- [x] Cloudflare Pages SPA routing verified
- [x] D1 match persistence schema and ELO protection defined
- [x] Custom deck cloud synchronization protocol designed
- [x] Historical match replay viewer architecture designed
- [x] Synthesized audio feedback engine designed
- [x] Unified build and deployment commands specified
