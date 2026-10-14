---
phase: 2
level: 2
researched_at: 2026-10-14T18:58:30-05:00
---

# Phase 2 Research: Cloudflare Backend, D1 Database & Authentication UI

## Questions Investigated

1. **Cloudflare Pages Functions vs Standalone Worker Architecture**: How should backend endpoints be colocated with the Vite React application, and how does D1 binding interact with Cloudflare Pages Functions?
2. **Password Hashing on Cloudflare Edge Runtime**: What is the most secure, standards-compliant password hashing algorithm available natively in the Cloudflare Workers / Pages runtime without heavy Node dependencies?
3. **HttpOnly Cookie Session Architecture with D1**: How should session cookies be issued, verified, and revoked in Pages Functions, and how should guest sessions transition to registered accounts?
4. **Local Development & Emulation Strategy**: How do we develop and test Cloudflare Pages Functions and D1 locally alongside the Vite dev server with sub-second HMR?
5. **D1 Relational Schema Design**: What tables, columns, constraints, and indexes are required for users, sessions, stats, matches, and custom decks?

---

## Findings

### 1. Cloudflare Pages Functions & D1 Binding Configuration

**Architecture:**
- Cloudflare Pages natively supports serverless API functions located in `/functions`.
- A directory structure like `functions/api/auth/[action].ts` or `functions/api/[[route]].ts` intercepts requests matching `/api/*`.
- In `wrangler.toml` (or `wrangler.json`), D1 databases are bound via `[[d1_databases]]`:
  ```toml
  name = "wormhole-chess"
  compatibility_date = "2024-03-20"

  [[d1_databases]]
  binding = "DB"
  database_name = "wormhole-chess-db"
  database_id = "local-dev-id"
  ```
- Inside a Pages Function handler (`onRequestGet`, `onRequestPost`, or `onRequest`):
  ```typescript
  import type { EventContext } from '@cloudflare/workers-types';

  export async function onRequest(context: EventContext<Env, any, any>): Promise<Response> {
    const { env, request } = context;
    const { results } = await env.DB.prepare('SELECT * FROM users LIMIT 10').all();
    return Response.json(results);
  }
  ```

**Key Advantages:**
- Deployed atomically alongside the Vite static assets to `wormhole-chess.com`.
- Shared origin eliminates all Cross-Origin Resource Sharing (CORS) preflights and headers in production.
- Direct binding to Cloudflare D1 with zero network hops between Pages Functions and D1 storage.

**Sources:**
- [Cloudflare Pages Functions Documentation](https://developers.cloudflare.com/pages/platform/functions/)
- [Cloudflare D1 Documentation & Bindings](https://developers.cloudflare.com/d1/get-started/)

---

### 2. Web Crypto API PBKDF2 Password Hashing

**Mechanism:**
- Node C++ packages (like `bcrypt` or `argon2`) cannot run in the Cloudflare Workers / V8 isolate runtime.
- The W3C standard **Web Crypto API (`crypto.subtle`)** is natively implemented in Cloudflare Workers and executes in high-performance native code.
- **Algorithm:** PBKDF2 with HMAC-SHA256, 16-byte cryptographically secure random salt, and 100,000 iterations.
- **Platform Limitation:** Cloudflare Workers runtime enforces an upper limit of **100,000 iterations** for PBKDF2. Values exceeding 100,000 throw a `NotSupportedError`.
- **Timing Attacks:** Comparison between the submitted password hash and stored hash must use constant-time comparison (`timingSafeEqual`) to prevent timing side-channel attacks.

**Implementation Pattern:**
```typescript
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}
```

---

### 3. Session Management & Guest Onboarding

**HttpOnly Cookie Session Strategy:**
- When a user logs in, registers, or clicks "Play as Guest":
  1. Generate a high-entropy random token: 32 bytes via `crypto.getRandomValues(new Uint8Array(32))`, encoded as a 64-character hex string.
  2. Compute SHA-256 hash of the token (`token_hash`) for database storage. (Storing token hashes prevents token exposure even if database snapshots are inspected).
  3. Insert into D1 `sessions` table: `(token_hash, user_id, is_guest, expires_at)`.
  4. Return response with `Set-Cookie`:
     `session_token=${rawToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000` (30 days).
- In incoming requests:
  - Extract `session_token` from `Cookie` header.
  - Compute SHA-256 hash.
  - Query active session from D1 joined with `users` and `player_stats`.
- When logging out:
  - Delete `token_hash` from D1 `sessions`.
  - Send `Set-Cookie: session_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`.

**Guest-to-Registered Conversion Flow:**
- When an active guest visits `/register` or clicks "Convert Account":
  - The registration endpoint checks if the current request has an active guest session.
  - If yes, instead of creating an orphaned user, it updates the existing `users` row:
    - Sets `username` to chosen username.
    - Sets `password_hash`.
    - Sets `email` (if provided).
    - Sets `is_guest = 0`.
    - Updates `sessions.is_guest = 0`.
  - Result: Player keeps all lifetime stats, win/loss history, and game progress seamlessly!

---

### 4. Local Development & Emulation Strategy

**Workflow:**
- Cloudflare provides `wrangler pages dev` which natively runs Miniflare local SQLite emulation for D1.
- We can configure `vite.config.ts` with a dev proxy:
  ```typescript
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      }
    }
  }
  ```
- Alternatively, `wrangler pages dev -- vite` boots Wrangler, emulates Functions & D1, and proxies frontend assets directly to Vite with instant HMR on port 8788.
- Local D1 database initialization:
  `npx wrangler d1 execute DB --local --file=./schema.sql` creates local tables in `.wrangler/state/v3/d1`.

---

### 5. D1 Relational Schema Design

```sql
-- D1 SQLite Schema for Wormhole Chess

-- Users Table (Registered users and Guest players)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  password_hash TEXT,
  is_guest INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sessions Table (Stores SHA-256 hash of HttpOnly session token)
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_guest INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Player Lifetime Statistics
CREATE TABLE IF NOT EXISTS player_stats (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  elo_rating INTEGER NOT NULL DEFAULT 1200,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Match Records
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  variant TEXT NOT NULL, -- 'wormhole' | 'deck_builder'
  white_user_id TEXT REFERENCES users(id),
  black_user_id TEXT REFERENCES users(id),
  winner_id TEXT REFERENCES users(id),
  result TEXT, -- 'white_win' | 'black_win' | 'draw' | 'abandoned'
  moves_pgn TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT
);

-- Custom Card Decks for Deck Builder Chess
CREATE TABLE IF NOT EXISTS custom_decks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deck_name TEXT NOT NULL,
  card_ids_json TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_matches_white ON matches(white_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_black ON matches(black_user_id);
CREATE INDEX IF NOT EXISTS idx_custom_decks_user ON custom_decks(user_id);
```

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend Architecture | Cloudflare Pages Functions (`functions/api/*`) | Unified frontend & backend repository, zero CORS complexity, direct D1 bindings, single deployment command. |
| Session Authentication | HttpOnly Cookies + D1 Sessions Table | Strongest XSS defense, server-side revocation, clean guest session tracking and upgrade capability. |
| Password Hashing | Native Web Crypto PBKDF2 (100k iters, SHA-256) | Zero external C++ binaries, fast edge performance, conforms to Cloudflare's 100k iteration limit. |
| Local Emulation | Wrangler D1 `--local` + Vite dev proxy | Fast frontend HMR paired with faithful Cloudflare D1 SQLite emulation. |
| Guest Transition | In-place row upgrade | Converting guest account to registered user preserves all stats and match records seamlessly. |

---

## Patterns to Follow

- **Constant-Time Verification:** Always use bitwise XOR comparison for hashes to prevent timing attacks.
- **Hash-at-Rest for Sessions:** Store SHA-256 hashes of session tokens in D1 rather than plain token values.
- **Shared Types:** Create a `src/types/auth.ts` shared between client and API functions to guarantee contract integrity.
- **Optimistic UI with Fallback:** AuthContext initializes with a lightweight `/api/auth/me` call, gracefully rendering logged-in or guest state.
- **CSRF Defense:** Use `SameSite=Lax` cookies plus `Sec-Fetch-Site` / custom header verification on state-mutating requests (`POST`, `PUT`, `DELETE`).

---

## Anti-Patterns to Avoid

- **External C++ bcrypt in Worker:** Installing standard `bcrypt` fails on Cloudflare V8 runtime; stick strictly to native Web Crypto API.
- **Exceeding 100k PBKDF2 Iterations:** Cloudflare Workers throws `NotSupportedError` if iterations exceed 100,000.
- **Storing Raw Session Tokens in DB:** Never store plaintext session tokens in SQLite tables.
- **Exposing Password Hashes in API Responses:** Sanitize user objects before returning to client (omit `password_hash`).

---

## Dependencies Identified

| Package | Version | Purpose |
|---------|---------|---------|
| `wrangler` | `^3.x` | Cloudflare CLI for local Pages Functions and D1 database emulation |
| `@cloudflare/workers-types` | `^4.x` | TypeScript types for Cloudflare Pages Functions (`EventContext`, `D1Database`) |

---

## Risks & Mitigations

- **Risk:** Local Windows environment execution differences with SQLite / Wrangler.
  - **Mitigation:** Use `wrangler d1 execute DB --local --file=schema.sql` which uses Miniflare's cross-platform SQLite driver.
- **Risk:** Cookie SameSite policies blocking credentials in iframe or cross-origin dev setups.
  - **Mitigation:** Configure Vite proxy so `/api` is requested on the identical host/port as frontend during development.

---

## Ready for Planning

- [x] Backend architecture confirmed (Pages Functions)
- [x] Security & hashing algorithms verified (Web Crypto PBKDF2, 100k iterations)
- [x] Session cookie and guest conversion mechanics defined
- [x] D1 relational schema drafted with indexes
- [x] Required dependencies identified (`wrangler`, `@cloudflare/workers-types`)
