---
phase: 5
plan: 3
wave: 3
depends_on: ["02"]
---

# Plan 5.3: Historical Match Replay Viewer, Dashboard UI & Cloudflare Production Deployment

## Objective
Build the interactive Historical Match Replay Viewer in React, upgrade the Player Dashboard with dynamic match history and variant filters, configure Cloudflare Pages SPA fallback routing, and provide unified full-stack verification and deployment commands.

## Context
- `.agent/state/SPEC.md`
- `.agent/state/phases/5/RESEARCH.md`
- `.agent/state/phases/5/01-PLAN.md`
- `.agent/state/phases/5/02-PLAN.md`
- `src/pages/DashboardPage.tsx`
- `src/components/DeckChessBoard.tsx`
- `package.json`

## Tasks

<task type="auto">
  <name>Build Interactive Historical Match Replay Viewer Component</name>
  <files>src/components/HistoricalMatchViewer.tsx</files>
  <action>
    Create `src/components/HistoricalMatchViewer.tsx`:
    - Accept props: `{ match: MatchRecord; onClose: () => void }`.
    - State management:
      * `currentIndex`: `-1` (starting board) to `moves.length - 1` (final board).
      * `isPlaying`: boolean auto-play toggle.
      * `playbackSpeed`: auto-advance interval (default 1200ms).
    - Board Display:
      * Render 2D chessboard using `DeckChessBoard` in read-only mode, or an SVG board displaying the `fenAfter` at `currentIndex`.
      * If `currentIndex >= 0`, highlight `from` and `to` squares of `moves[currentIndex].chessMove`.
      * If `moves[currentIndex].cardAction` exists, render a tactical card banner above the board displaying the card name, piece-class theme color (`PIECE_COLOR_THEMES`), energy cost, and target square.
    - Playback Controls:
      * `|◀` Jump to Start (`currentIndex = -1`)
      * `◀` Step Backward (`currentIndex = Math.max(-1, currentIndex - 1)`)
      * `▶ / ⏸` Auto-Play toggle with `setInterval`
      * `▶` Step Forward (`currentIndex = Math.min(moves.length - 1, currentIndex + 1)`)
      * `▶|` Jump to End (`currentIndex = moves.length - 1`)
    - Move Log Sidebar:
      * Scrollable list of turns with turn numbers, player tags, SAN notation, and card badges.
      * Active turn highlighted and auto-scrolled into view.
      * Clicking any turn sets `currentIndex` directly.
    - Sound Integration:
      * Trigger `playMoveSound()` or `playCardSound()` on each step forward.
  </action>
  <verify>npm run build</verify>
  <done>HistoricalMatchViewer component compiles cleanly with full playback controls and board/card annotations.</done>
</task>

<task type="auto">
  <name>Upgrade Dashboard with Dynamic Match History & Variant Filtering</name>
  <files>src/pages/DashboardPage.tsx</files>
  <action>
    Enhance `src/pages/DashboardPage.tsx`:
    - Fetch match history on mount via `api.getMatchHistory({ limit: 50 })`.
    - Filter pills state: `'all' | 'pvp' | 'solo_local'`:
      * `'all'`: All recorded matches.
      * `'pvp'`: Filter to `deck_builder:pvp` and multiplayer matches.
      * `'solo_local'`: Filter to `deck_builder:ai` and `wormhole:local` casual practice matches.
    - Dynamic Match Table:
      * Replace the static empty card with a responsive match history list.
      * Display columns / cards: Variant badge (2D Deck Builder / 3D Wormhole), Mode badge (Ranked PvP / Practice AI), Opponent name, Outcome pill (Victory / Defeat / Draw with color styling), Turns count, Timestamp, and "Review Match 🔍" button.
      * Clicking "Review Match" opens `HistoricalMatchViewer` in a clean modal overlay.
    - Empty state: Show friendly empty state card with variant launch links if no matches exist in the selected filter.
  </action>
  <verify>npm run build</verify>
  <done>Dashboard renders dynamic match history, supports variant filtering, and opens the historical match replay viewer.</done>
</task>

<task type="auto">
  <name>Configure Cloudflare Pages SPA Routing & Full-Stack Scripts</name>
  <files>public/_routes.json, public/_redirects, package.json</files>
  <action>
    Configure production deployment assets and unified scripts:
    - Create `public/_routes.json`:
      ```json
      {
        "version": 1,
        "include": ["/api/*"],
        "exclude": []
      }
      ```
    - Create `public/_redirects`:
      ```text
      /*    /index.html   200
      ```
    - In `package.json`, add unified verification and deployment scripts:
      * `"typecheck:all"`: `"tsc --noEmit && npx tsc -p functions/tsconfig.json --noEmit && npx tsc -p worker/tsconfig.json --noEmit"`
      * `"build:all"`: `"npm run build"`
      * `"db:migrate:local"`: `"wrangler d1 execute DB --local --file=./d1/schema.sql"`
      * `"db:migrate:prod"`: `"wrangler d1 execute DB --file=./d1/schema.sql"`
      * `"deploy:worker"`: `"cd worker && wrangler deploy"`
      * `"deploy:pages"`: `"wrangler pages deploy build"`
  </action>
  <verify>npm run typecheck:all && npm run build:all</verify>
  <done>Cloudflare Pages SPA routing files are in place and npm run typecheck:all passes across frontend, functions, and worker.</done>
</task>

## Success Criteria
- [ ] `HistoricalMatchViewer.tsx` renders board positions from FEN with move arrows, card callout badges, and step/auto-play controls.
- [ ] `DashboardPage.tsx` renders dynamic matches from D1 with variant filter tabs and replay modal trigger.
- [ ] `public/_routes.json` and `public/_redirects` ensure Cloudflare Pages routes deep links to `index.html` while reserving `/api/*` for Pages Functions.
- [ ] `npm run typecheck:all` verifies React app, Pages Functions, and companion Worker in a single command with 0 errors.
- [ ] `npm run build:all` creates production `build/` bundle in < 1 second.
