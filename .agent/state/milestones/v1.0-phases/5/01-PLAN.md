---
phase: 5
plan: 1
wave: 1
depends_on: []
---

# Plan 5.1: D1 Match & Deck Persistence Endpoints

## Objective
Implement backend Pages Functions endpoints for querying and recording match histories and custom decks, with ELO rating protection, input validation, and typed frontend API client integration.

## Context
- `.agent/state/SPEC.md`
- `.agent/state/phases/5/RESEARCH.md`
- `d1/schema.sql`
- `functions/api/_cookie.ts`
- `functions/api/_crypto.ts`
- `src/services/api.ts`

## Tasks

<task type="auto">
  <name>Implement Match History API Endpoints in Pages Functions</name>
  <files>functions/api/matches.ts, d1/schema.sql</files>
  <action>
    Create `functions/api/matches.ts` handling both GET and POST requests:
    - `GET /api/matches`:
      * Extract session via `getSession(context)`. If no valid session, return 401.
      * Read query parameters `limit` (default 20, max 100), `offset` (default 0), and optional `variant` filter.
      * Query D1 `matches` table joining `users` as `white_user` and `black_user` to return player display names.
      * Parse `moves_pgn` JSON safely into `moves` array.
      * Return `{ matches: Array<{ id, variant, whiteUserId, whiteUsername, blackUserId, blackUsername, winnerId, result, moves, startedAt, endedAt }>, total: number }`.
    - `POST /api/matches`:
      * Extract session via `getSession(context)`. If no valid session, return 401.
      * Parse body: `{ variant: string, opponentName?: string, result: string, winner: 'white' | 'black' | 'draw' | null, moves: any[], startedAt: number, endedAt: number }`.
      * Validate variant (e.g. `deck_builder:ai`, `wormhole:local`).
      * Insert record into `matches` table with generated UUID.
      * Update `player_stats`: For non-guest users in solo/local games, increment `wins`, `losses`, or `draws` without modifying `elo_rating` (preserving competitive ELO integrity as established in DECISION-008).
    - In `d1/schema.sql`, add compound performance indexes:
      `CREATE INDEX IF NOT EXISTS idx_matches_white_started ON matches(white_user_id, started_at DESC);`
      `CREATE INDEX IF NOT EXISTS idx_matches_black_started ON matches(black_user_id, started_at DESC);`
  </action>
  <verify>npx tsc -p functions/tsconfig.json --noEmit</verify>
  <done>Pages Functions typecheck passes cleanly with GET and POST /api/matches handlers and database query execution.</done>
</task>

<task type="auto">
  <name>Implement Custom Decks Cloud API Endpoints</name>
  <files>functions/api/decks.ts</files>
  <action>
    Create `functions/api/decks.ts` handling both GET and POST requests:
    - `GET /api/decks`:
      * Extract session via `getSession(context)`. If no session, return 401.
      * Query `custom_decks` where `user_id = ?` ordered by `is_active DESC, updated_at DESC`.
      * Parse `card_ids_json` into string arrays.
      * Return `{ decks: Array<{ id, deckName, cardIds, isActive, createdAt, updatedAt }> }`.
    - `POST /api/decks`:
      * Extract session via `getSession(context)`. If no session, return 401.
      * Parse body: `{ deckName: string, cardIds: string[], isActive?: boolean }`.
      * Validate that `cardIds` is an array of exactly 8 strings.
      * If `isActive` is true, set `is_active = 0` on existing user decks first.
      * Insert new deck (or update if `id` provided) with `datetime('now')`.
      * Return `{ success: true, deck: { id, deckName, cardIds, isActive } }`.
  </action>
  <verify>npx tsc -p functions/tsconfig.json --noEmit</verify>
  <done>Pages Functions typecheck passes with GET and POST /api/decks endpoints with 8-card array validation.</done>
</task>

<task type="auto">
  <name>Extend Frontend API Client with Match and Deck Methods</name>
  <files>src/services/api.ts</files>
  <action>
    Update `src/services/api.ts` to export typed methods and interfaces for matches and decks:
    - Define interfaces:
      * `MatchRecord`: `{ id: string; variant: string; whiteUserId?: string; whiteUsername?: string; blackUserId?: string; blackUsername?: string; winnerId?: string; result?: string; moves?: any[]; startedAt: string; endedAt?: string; }`
      * `CustomDeckRecord`: `{ id: string; deckName: string; cardIds: string[]; isActive: boolean; createdAt: string; updatedAt: string; }`
      * `RecordMatchPayload`: `{ variant: string; opponentName?: string; result: string; winner: 'white' | 'black' | 'draw' | null; moves: any[]; startedAt: number; endedAt: number; }`
    - Add client API methods to `api` object:
      * `getMatchHistory(params?: { limit?: number; offset?: number; variant?: string }): Promise<{ matches: MatchRecord[]; total: number }>`
      * `recordMatch(payload: RecordMatchPayload): Promise<{ success: boolean; matchId: string }>`
      * `getCustomDecks(): Promise<{ decks: CustomDeckRecord[] }>`
      * `saveCustomDeck(payload: { deckName: string; cardIds: string[]; isActive?: boolean }): Promise<{ success: boolean; deck: CustomDeckRecord }>`
  </action>
  <verify>npm run build</verify>
  <done>Frontend build passes with typed client methods for matches and decks exported from api.ts.</done>
</task>

## Success Criteria
- [ ] `functions/api/matches.ts` provides authenticated `GET` and `POST` handlers with ELO integrity preservation.
- [ ] `functions/api/decks.ts` provides authenticated `GET` and `POST` handlers for custom 8-card loadouts.
- [ ] `src/services/api.ts` provides typed client wrappers for all match history and custom deck endpoints.
- [ ] Both `npx tsc -p functions/tsconfig.json` and `npm run build` pass with zero errors.
