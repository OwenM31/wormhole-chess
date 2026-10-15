---
milestone: v1.0
updated: 2026-10-14T23:27:00Z
---

# Requirements

## Overview

Requirements derived from [.agent/state/SPEC.md](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/.agent/state/SPEC.md) for traceability, verification, and coverage tracking.

---

## Functional Requirements

| ID | Requirement | Source | Phase | Status |
|----|-------------|--------|-------|--------|
| REQ-01 | Migrate project build system from Create React App to Vite with fast HMR | SPEC Goal 1 | 1 | Complete |
| REQ-02 | Implement client-side routing (`/`, `/dashboard`, `/login`, `/register`, `/wormhole`, `/deck-builder`) | SPEC Goal 1 | 1 | Complete |
| REQ-03 | Encapsulate existing 3D Wormhole Chess into a dedicated route with zero gameplay regressions | SPEC Goal 5 | 1 | Complete |
| REQ-04 | Design Cloudflare D1 database schema for users, guest sessions, match history, and card decks | SPEC Goal 2 | 2 | Complete |
| REQ-05 | Implement Cloudflare Workers authentication endpoints (register, login, guest tokens, session validation) | SPEC Goal 2 | 2 | Complete |
| REQ-06 | Build Player Dashboard UI (active matches, match history, win/loss stats, game variant launchers) | SPEC Goal 2 | 2 | Complete |
| REQ-07 | Implement Cloudflare Durable Objects for stateful room management, matchmaking, and turn coordination | SPEC Goal 3 | 3 | Complete |
| REQ-08 | Implement 2D Deck Builder Chess board engine and rules (standard 8x8 moves + card actions) | SPEC Goal 4 | 4 | Complete |
| REQ-09 | Implement Deck Builder turn loop with "play card + chess move" simultaneous actions and win conditions | SPEC Goal 4 | 4 | Complete |
| REQ-10 | Implement a simple heuristic AI opponent for Deck Builder Chess to facilitate solo testing | SPEC Goal 4 | 4 | Complete |
| REQ-11 | Implement Deck Builder card collection and custom deck configuration interface | SPEC Goal 4 | 4 | Complete |

---

## Non-Functional Requirements

| ID | Requirement | Category | Phase | Status |
|----|-------------|----------|-------|--------|
| NFR-01 | Production build executes in < 10 seconds (vs ~2 minutes on CRA) | Performance | 1 | Complete (1.47s) |
| NFR-02 | Responsive layout across mobile and desktop for Home, Dashboard, and Deck Builder | UX | 2, 4, 5 | Complete |
| NFR-03 | Sub-150ms response time for turn submission and session validation | Performance | 3 | Complete (<50ms DO) |
| NFR-04 | Password hashing and secure token transmission via HTTP-only cookies or Bearer tokens | Security | 2 | Complete (PBKDF2 WebCrypto) |

---

## Constraints

| ID | Constraint | Source | Impact |
|----|------------|--------|--------|
| CON-01 | Cloudflare Ecosystem (Pages + Workers + D1 + Durable Objects) | SPEC Constraints | All backend and deployment code |
| CON-02 | Strictly turn-based gameplay across all variants | SPEC Constraints | Game loops and network synchronization |
| CON-03 | 2D interface for Deck Builder Chess in v1 | SPEC Constraints | Rendering stack for Deck Builder |

---

## Traceability Matrix

| Requirement | Plans | Tests | Status |
|-------------|-------|-------|--------|
| REQ-01 | Phase 1 | Build check & HMR test | Verified |
| REQ-02 | Phase 1 | Route navigation test | Verified |
| REQ-03 | Phase 1 | 3D board scene regression test | Verified |
| REQ-04 | Phase 2 | D1 migration & query tests | Verified |
| REQ-05 | Phase 2 | Auth integration tests (register/login/guest) | Verified |
| REQ-06 | Phase 2 | Dashboard UI component tests | Verified |
| REQ-07 | Phase 3 | Room join & turn sync tests | Verified |
| REQ-08 | Phase 4 | Move validation & card effect tests | Verified |
| REQ-09 | Phase 4 | Turn loop execution tests | Verified |
| REQ-10 | Phase 4 | AI move selection verification | Verified |
| REQ-11 | Phase 4 | Deck save/load tests | Verified |

---

*Last updated: 2026-10-15*
