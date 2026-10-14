---
milestone: v1.0 Platform Expansion
version: 1.0.0
updated: 2026-10-14T23:27:00Z
---

# Roadmap

> **Current Phase:** Phase 1 - Modern Foundation, Vite Migration & Client Routing
> **Status:** ⬜ Not Started

## Must-Haves (from SPEC)

- [ ] Vite-powered build pipeline with sub-10s production builds and instant HMR
- [ ] Client-side routing with Home screen, Auth, Dashboard, and dedicated variant pages
- [ ] Working Cloudflare Workers + D1 backend supporting both Registered Users and Guests
- [ ] Cloudflare Durable Objects managing game rooms and turn-based synchronization
- [ ] Playable 2D Deck Builder Chess with "play card + chess move" turn loop and simple AI testing opponent
- [ ] 3D Wormhole Chess fully preserved and playable on `/wormhole` route

---

## Phases

### Phase 1: Modern Foundation, Vite Migration & Client Routing
**Status:** ✅ Complete
**Objective:** Replace deprecated Create React App with Vite, implement client-side routing, build the initial Home landing page, and isolate 3D Wormhole Chess on `/wormhole` with zero regressions.
**Requirements:** REQ-01, REQ-02, REQ-03, NFR-01

**Plans:**
- [x] Plan 1.1: Migrate CRA to Vite (replace `react-scripts`, update `index.html`, configure `vite.config.ts`, verify < 10s build)
- [x] Plan 1.2: Implement client routing (`react-router-dom`) with Home page shell and encapsulated `/wormhole` route

---

### Phase 2: Cloudflare Backend, D1 Database & Authentication UI
**Status:** ⬜ Not Started
**Objective:** Set up Cloudflare Workers with D1 SQLite storage, implement secure user registration/login and guest session tokens, and build the Player Dashboard.
**Depends on:** Phase 1
**Requirements:** REQ-04, REQ-05, REQ-06, NFR-02, NFR-04

**Plans:**
- [ ] Plan 2.1: Cloudflare D1 schema design & Workers authentication endpoints (register, login, guest token, profile)
- [ ] Plan 2.2: Frontend Auth views (Login, Register, Guest modal) and Player Dashboard UI

---

### Phase 3: Real-Time Room Coordination & Durable Objects
**Status:** ⬜ Not Started
**Objective:** Deploy Cloudflare Durable Objects to manage room sessions, private room codes, casual matchmaking, and turn coordination for online matches.
**Depends on:** Phase 2
**Requirements:** REQ-07, NFR-03, CON-01, CON-02

**Plans:**
- [ ] Plan 3.1: Implement `GameRoomDO` Durable Object for room creation, private invite codes, player connection, and turn synchronization
- [ ] Plan 3.2: Connect frontend match lobby and room joining flow to Durable Objects

---

### Phase 4: Deck Builder Chess (2D Variant) & AI Opponent
**Status:** ⬜ Not Started
**Objective:** Build the 2D Deck Builder Chess variant with 8x8 board rules, card action execution, simultaneous turn loop, starter deck management, and a heuristic AI opponent for testing.
**Depends on:** Phase 3
**Requirements:** REQ-08, REQ-09, REQ-10, REQ-11, CON-03

**Plans:**
- [ ] Plan 4.1: 2D Chessboard engine, card action system, and simultaneous "play card + move" turn loop
- [ ] Plan 4.2: Lightweight heuristic AI opponent for full-flow solo testing
- [ ] Plan 4.3: Deck builder UI for card collection and custom deck configuration

---

### Phase 5: Integration, Polish & Production Deployment
**Status:** ⬜ Not Started
**Objective:** Link both chess variants to persistent D1 match records, perform full guest/user end-to-end verification, and validate production Cloudflare Pages deployment.
**Depends on:** Phase 4

**Plans:**
- [ ] Plan 5.1: End-to-end match completion flow, match history recording in D1, and stats tracking
- [ ] Plan 5.2: Production build verification and Cloudflare Pages deployment configuration

---

## Progress Summary

| Phase | Status | Plans | Complete |
|-------|--------|-------|----------|
| 1: Modern Foundation & Routing | ⬜ Not Started | 0/2 | — |
| 2: Cloudflare Backend & Auth | ⬜ Not Started | 0/2 | — |
| 3: Room Coordination & DO | ⬜ Not Started | 0/2 | — |
| 4: Deck Builder Chess (2D) | ⬜ Not Started | 0/3 | — |
| 5: Polish & Deployment | ⬜ Not Started | 0/2 | — |

---

## Timeline

| Phase | Started | Completed | Duration |
|-------|---------|-----------|----------|
| 1 | — | — | — |
| 2 | — | — | — |
| 3 | — | — | — |
| 4 | — | — | — |
| 5 | — | — | — |

---

*Last updated: 2026-10-14*
