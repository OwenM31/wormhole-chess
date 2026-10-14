# SPEC.md — Project Specification

> **Status**: `FINALIZED`
>
> ⚠️ **Planning Lock**: No code may be written until this spec is marked `FINALIZED`.

## Vision

Transform Wormhole Chess from an isolated, monolithic 3D demo into a modern, full-featured online chess variant platform. The site will host multiple innovative games—beginning with the signature 3D Wormhole Chess and introducing a new 2D Deck Builder Chess—powered by a Cloudflare serverless architecture (Pages, Workers, D1, and Durable Objects) featuring guest access, user accounts, player dashboards, online turn-based matchmaking, and lightweight AI testing opponents.

## Goals

1. **Modern Platform Architecture & Fast Tooling** — Migrate build pipeline from deprecated Create React App to Vite, implement client-side routing (`react-router-dom`), and modularize game engines away from UI views.
2. **Cloudflare Serverless Backend & Authentication** — Build Cloudflare Workers API endpoints backed by Cloudflare D1 for user accounts (username/password, optional email, session management), guest tokens, player statistics, and deck configurations.
3. **Turn-based Matchmaking & Durable Objects** — Implement stateful game sessions and online room coordination (matchmaking and private room codes) using Cloudflare Durable Objects.
4. **2D Deck Builder Chess Variant** — Develop a new turn-based 2D chess variant featuring a simultaneous "play card + chess move" turn loop, customizable decks, and a simple heuristic AI opponent for full-flow testing.
5. **Preserve & Encapsulate 3D Wormhole Chess** — Maintain full feature parity of the existing non-Euclidean 3D Wormhole Chess engine while isolating it within a dedicated route and clean module boundary.

## Non-Goals (Out of Scope for v1)

- **Pass-and-play / Hotseat Mode:** Local shared-device play is explicitly excluded for v1 in favor of online room matches and solo AI play.
- **3D Graphics for Deck Builder Chess:** Deck Builder Chess will feature a 2D board and card interface for v1; 3D rendering for this variant is deferred to a future milestone.
- **Deep Chess AI Engines:** Heavy engines (e.g., Stockfish, Leela) are out of scope; a lightweight rule-based/heuristic AI will provide opponent testing.
- **Elo Ratings & Public Ranked Ladders:** Complex ranking ladders and tournaments are deferred; v1 provides win/loss record tracking and casual/private matchmaking.
- **Third-party OAuth Providers:** OAuth (Google, GitHub) is deferred to future iterations; v1 uses secure D1 username/password and guest sessions.

## Users

- **Guest Players:** Can immediately launch games, test out the variants, and join private match links without signing up. Endpoints securely handle anonymous guest session tokens.
- **Registered Players:** Create accounts with username and password (optional email) to persist match histories, track win/loss records, save custom decks, and access the Player Dashboard.

## Constraints

- **Infrastructure:** Cloudflare Pages (Frontend hosting), Cloudflare Workers (REST API), Cloudflare D1 (Relational SQLite), Cloudflare Durable Objects (Stateful room coordination).
- **Frontend Stack:** React 19, TypeScript, Vite, React Three Fiber (Wormhole 3D), CSS / DOM / 2D Canvas (Deck Builder).
- **Turn Mechanics:** All gameplay is turn-based.

## Success Criteria

- [ ] Production build succeeds with Vite in < 10 seconds and deploys seamlessly to Cloudflare Pages.
- [ ] Client router provides navigation between Home, Dashboard, Auth, 3D Wormhole Chess, and 2D Deck Builder Chess.
- [ ] Authentication system supports registration, login, logout, and guest sessions with D1 storage.
- [ ] Player Dashboard displays active games, match history, win/loss stats, and game variant launchers.
- [ ] Players can create private rooms and invite remote opponents to turn-based matches via Durable Objects.
- [ ] Deck Builder Chess executes a complete game loop (play card + chess move) against a remote opponent or simple AI.
- [ ] 3D Wormhole Chess runs on its dedicated route with zero regression in camera, piece animations, or board topology.

---

*Last updated: 2026-10-14*
