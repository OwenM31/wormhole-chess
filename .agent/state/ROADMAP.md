---
milestone: v1.0 Platform Expansion
version: 1.0.0
updated: 2026-10-14T23:27:00Z
---

# Roadmap

> **Current Phase:** Phase 5 - Integration, Polish & Production Deployment
> **Status:** ⬜ Awaiting Planning

## Must-Haves (from SPEC)

- [x] Vite-powered build pipeline with sub-10s production builds and instant HMR
- [x] Client-side routing with Home screen, Auth, Dashboard, and dedicated variant pages
- [x] Working Cloudflare Workers + D1 backend supporting both Registered Users and Guests
- [x] Cloudflare Durable Objects managing game rooms and turn-based synchronization
- [x] Playable 2D Deck Builder Chess with "play card + chess move" turn loop and simple AI testing opponent
- [x] 3D Wormhole Chess fully preserved and playable on `/wormhole` route

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
**Status:** ✅ Complete
**Objective:** Set up Cloudflare Pages Functions with D1 SQLite storage, implement secure user registration/login and guest session tokens, and build the Player Dashboard.
**Depends on:** Phase 1
**Requirements:** REQ-04, REQ-05, REQ-06, NFR-02, NFR-04

**Plans:**
- [x] Plan 2.1: Cloudflare D1 Database Schema & Pages Functions Auth Endpoints
- [x] Plan 2.2: Frontend Auth Integration, AuthContext & Player Dashboard UI

---

### Phase 3: Real-Time Room Coordination & Durable Objects
**Status:** ✅ Complete
**Objective:** Deploy Cloudflare Durable Objects to manage room sessions, private room codes, casual matchmaking, and turn coordination for online matches.
**Depends on:** Phase 2
**Requirements:** REQ-07, NFR-03, CON-01, CON-02

**Plans:**
- [x] Plan 3.1: Implement `GameRoomDO` Durable Object for room creation, private invite codes, player connection, and turn synchronization
- [x] Plan 3.2: Connect frontend match lobby and room joining flow to Durable Objects

---

### Phase 4: Deck Builder Chess (2D Variant) & AI Opponent
**Status:** ✅ Complete
**Objective:** Build the 2D Deck Builder Chess variant with 8x8 board rules, card action execution, simultaneous turn loop, starter deck management, and a heuristic AI opponent for testing.
**Depends on:** Phase 3
**Requirements:** REQ-08, REQ-09, REQ-10, REQ-11, CON-03

**Plans:**
- [x] Plan 4.1: Core Chess Engine & Compositional Card Graph (Wave 1)
- [x] Plan 4.2: Heuristic AI Bot & Solo Play Coordinator (Wave 2)
- [x] Plan 4.3: 2D Board UI, Tactical Hand Bar, Deck Builder & Multiplayer Integration (Wave 3)

---

### Phase 5: Integration, Polish & Production Deployment
**Status:** 🔄 Ready for Execution (3 plans across 3 waves)
**Objective:** Link both chess variants to persistent D1 match records, perform full guest/user end-to-end verification, and validate production Cloudflare Pages deployment.
**Depends on:** Phase 4

**Plans:**
- [ ] Plan 5.1: D1 Match & Deck Persistence Endpoints (Wave 1)
- [ ] Plan 5.2: Game Flow Match Recording, Cloud Deck Sync & Web Audio SFX (Wave 2)
- [ ] Plan 5.3: Historical Match Replay Viewer, Dashboard UI & Cloudflare Production Deployment (Wave 3)

---

## Progress Summary

| Phase | Status | Plans | Complete |
|-------|--------|-------|----------|
| 1: Modern Foundation & Routing | ✅ Complete | 2/2 | 100% |
| 2: Cloudflare Backend & Auth | ✅ Complete | 2/2 | 100% |
| 3: Room Coordination & DO | ✅ Complete | 2/2 | 100% |
| 4: Deck Builder Chess (2D) | ✅ Complete | 3/3 | 100% |
| 5: Polish & Deployment | 🔄 Ready for Execution | 0/3 | — |

---

## Timeline

| Phase | Started | Completed | Duration |
|-------|---------|-----------|----------|
| 1 | 2026-10-14 18:37 | 2026-10-14 18:50 | 13m |
| 2 | 2026-10-14 19:04 | 2026-10-14 19:18 | 14m |
| 3 | 2026-10-14 21:59 | 2026-10-14 22:08 | 9m |
| 4 | 2026-10-14 23:13 | 2026-10-15 00:36 | 23m |
| 5 | — | — | — |

---

*Last updated: 2026-10-14*
