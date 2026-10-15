---
phase: 2
plan: 1
wave: 1
depends_on: []
---

# Plan 2.1: Cloudflare D1 Database Schema & Pages Functions Auth Endpoints

## Objective

Set up the Cloudflare serverless backend infrastructure using Cloudflare Pages Functions, define the relational D1 SQLite database schema (users, sessions, player stats, matches, custom decks), implement Web Crypto PBKDF2 password hashing utilities, and create production-grade authentication endpoints with HttpOnly session cookies.

## Context

- [.agent/state/SPEC.md](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/.agent/state/SPEC.md) — Goal 2 (Cloudflare Serverless Backend & Authentication)
- [.agent/state/REQUIREMENTS.md](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/.agent/state/REQUIREMENTS.md) — REQ-04, REQ-05, NFR-04
- [.agent/state/DECISIONS.md](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/.agent/state/DECISIONS.md) — [DECISION-005] (Pages Functions + HttpOnly Cookies + D1 Sessions)
- [.agent/state/phases/2/RESEARCH.md](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/.agent/state/phases/2/RESEARCH.md) — Research findings on PBKDF2 100k cap, D1 binding, and cookie security

## Tasks

<task type="auto">
  <name>Task 1: Install Cloudflare tooling, configure D1 binding, and initialize relational SQLite schema</name>
  <files>
    package.json
    wrangler.toml
    d1/schema.sql
    src/types/auth.ts
  </files>
  <action>
    1. Install `wrangler` and `@cloudflare/workers-types` as `devDependencies` in `package.json`.
    2. Create `wrangler.toml` at the project root:
       - Set `name = "wormhole-chess"`
       - Set `compatibility_date = "2024-03-20"`
       - Define `[[d1_databases]]` binding `DB`, with `database_name = "wormhole-chess-db"` and `database_id = "local-dev-id"`.
    3. Create `d1/schema.sql` containing full DDL statements:
       - `users` table: `id TEXT PRIMARY KEY`, `username TEXT UNIQUE NOT NULL`, `email TEXT`, `password_hash TEXT`, `is_guest INTEGER NOT NULL DEFAULT 0`, `created_at TEXT NOT NULL DEFAULT (datetime('now'))`, `updated_at TEXT NOT NULL DEFAULT (datetime('now'))`.
       - `sessions` table: `token_hash TEXT PRIMARY KEY`, `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `is_guest INTEGER NOT NULL DEFAULT 0`, `expires_at TEXT NOT NULL`, `created_at TEXT NOT NULL DEFAULT (datetime('now'))`.
       - `player_stats` table: `user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE`, `wins INTEGER NOT NULL DEFAULT 0`, `losses INTEGER NOT NULL DEFAULT 0`, `draws INTEGER NOT NULL DEFAULT 0`, `elo_rating INTEGER NOT NULL DEFAULT 1200`, `updated_at TEXT NOT NULL DEFAULT (datetime('now'))`.
       - `matches` table: `id TEXT PRIMARY KEY`, `variant TEXT NOT NULL`, `white_user_id TEXT REFERENCES users(id)`, `black_user_id TEXT REFERENCES users(id)`, `winner_id TEXT REFERENCES users(id)`, `result TEXT`, `moves_pgn TEXT`, `started_at TEXT NOT NULL DEFAULT (datetime('now'))`, `ended_at TEXT`.
       - `custom_decks` table: `id TEXT PRIMARY KEY`, `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `deck_name TEXT NOT NULL`, `card_ids_json TEXT NOT NULL`, `is_active INTEGER NOT NULL DEFAULT 0`, `created_at TEXT NOT NULL DEFAULT (datetime('now'))`, `updated_at TEXT NOT NULL DEFAULT (datetime('now'))`.
       - Performance indexes: `idx_sessions_user_id`, `idx_sessions_expires_at`, `idx_matches_white`, `idx_matches_black`, `idx_custom_decks_user`.
    4. Create `src/types/auth.ts` exporting shared interfaces:
       - `User` (`id`, `username`, `email`, `isGuest`, `createdAt`)
       - `PlayerStats` (`userId`, `wins`, `losses`, `draws`, `eloRating`, `totalGames`, `winRate`)
       - `Session` (`tokenHash`, `userId`, `isGuest`, `expiresAt`)
       - `AuthResponse` (`success`, `user?`, `stats?`, `error?`)
       - `LoginRequest`, `RegisterRequest`
    5. Avoid: Using external SQLite libraries or heavy Node ORMs; D1 is natively queried using `env.DB.prepare(...).bind(...).run() / .first() / .all()`.
  </action>
  <verify>
    npm run build
  </verify>
  <done>
    `wrangler.toml` and `d1/schema.sql` are created, TypeScript compiles cleanly with `src/types/auth.ts`, and `wrangler` is available in `devDependencies`.
  </done>
</task>

<task type="auto">
  <name>Task 2: Implement crypto utilities, cookie helpers, and Pages Functions authentication endpoints</name>
  <files>
    functions/api/_crypto.ts
    functions/api/_cookie.ts
    functions/api/auth/register.ts
    functions/api/auth/login.ts
    functions/api/auth/guest.ts
    functions/api/auth/logout.ts
    functions/api/auth/me.ts
  </files>
  <action>
    1. Create `functions/api/_crypto.ts`:
       - `hashPassword(password: string): Promise<string>` using native Web Crypto PBKDF2-HMAC-SHA256 with 100,000 iterations and a 16-byte random salt. Output format `saltHex:hashHex`. Do NOT exceed 100,000 iterations to stay within Cloudflare limits.
       - `verifyPassword(password: string, storedHash: string): Promise<boolean>` with constant-time byte comparison (`timingSafeEqual`).
       - `generateSessionToken(): string` generating 32 cryptographically secure random bytes formatted as a 64-character hex string.
       - `hashToken(token: string): Promise<string>` hashing the token with SHA-256 for secure database storage.
    2. Create `functions/api/_cookie.ts`:
       - `getSessionToken(request: Request): string | null` parsing `Cookie` header for `session_token`.
       - `createSessionCookieHeader(token: string, maxAgeSeconds?: number): string` generating `session_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds || 2592000}`.
       - `createClearCookieHeader(): string` generating `session_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`.
    3. Implement `functions/api/auth/register.ts`:
       - Validates `username` (3-24 chars, alphanumeric/underscore) and `password` (min 8 chars).
       - Checks for existing username.
       - If active guest session exists, upgrades the guest row to registered status (`is_guest = 0`, sets `password_hash` and optional `email`), preserving stats.
       - If no guest session, generates UUID, hashes password, inserts into `users`, initializes `player_stats` (1200 rating).
       - Creates session in `sessions` table (30-day expiry), sets HttpOnly cookie, returns sanitized user and stats.
    4. Implement `functions/api/auth/login.ts`:
       - Queries user by `username`. If not found or `is_guest = 1`, returns 401.
       - Verifies password with `verifyPassword`. If invalid, returns 401.
       - Creates session in `sessions`, sets HttpOnly cookie, returns sanitized user and stats.
    5. Implement `functions/api/auth/guest.ts`:
       - Generates anonymous username `Guest_${shortId}`.
       - Inserts guest into `users` (`is_guest = 1`, `password_hash = NULL`), initializes `player_stats`.
       - Creates session in `sessions` (`is_guest = 1`), sets HttpOnly cookie, returns guest user and initial stats.
    6. Implement `functions/api/auth/logout.ts`:
       - Reads session token from cookie, deletes matching row from `sessions`, returns response with clear-cookie header.
    7. Implement `functions/api/auth/me.ts`:
       - Reads cookie, hashes token, queries active unexpired session joined with `users` and `player_stats`.
       - Returns `{ success: true, user, stats }` or `{ success: false, error: "Unauthenticated" }` with 401 status.
    8. Avoid: Returning `password_hash` or raw `salt` in any API response.
  </action>
  <verify>
    npm run build
  </verify>
  <done>
    All 5 authentication endpoints and helper modules compile cleanly without TypeScript errors, enforce constant-time security and 100k iteration bounds, and correctly handle guest accounts, registered accounts, and session revocation.
  </done>
</task>

## Success Criteria

- [ ] `wrangler.toml` configured with D1 database binding `DB`
- [ ] D1 relational schema defines `users`, `sessions`, `player_stats`, `matches`, and `custom_decks` with foreign keys and indexes
- [ ] Native Web Crypto PBKDF2 password hashing implemented with 100k iterations and constant-time verification
- [ ] HttpOnly cookie-based session management implemented across `register`, `login`, `guest`, `logout`, and `me` endpoints
- [ ] In-place guest account upgrade supported during registration
- [ ] `npm run build` passes with zero errors
