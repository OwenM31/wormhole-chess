---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/components/MatchmakingLobby.tsx
autonomous: true

must_haves:
  truths:
    - "Matchmaking lobby renders using Phase 1 design tokens (#0e1118 surface, 6px radii, 1px border stroke)"
    - "Mode switcher displays clean segmented controls for Deck Builder and Wormhole"
    - "Time control pills use monospace tabular figures (3 min, 5 min, 10 min, Untimed)"
    - "Queue actions use approved copy ('Find Match', 'Create Room', 'Join with Code')"
    - "Real-time WebSocket events and private room generation remain 100% functional"
  artifacts:
    - "src/components/MatchmakingLobby.tsx"
---

# Plan 1.1: Matchmaking Lobby Component Alignment

<objective>
Refactor the internal styling, layout, and copy of `MatchmakingLobby.tsx` to inherit Phase 1 design system tokens (Variant A: Technical Density) and user-approved copy ("Find Match", "Create Room", "Join with Code"). Ensure all WebSocket queue events, room code generation, and live player metrics continue functioning without regressions.

Purpose: Eliminate legacy styling artifacts, remove hyperbolic copy, and unify the matchmaking lobby within the new 2-column Dashboard layout.
Output: Refactored `src/components/MatchmakingLobby.tsx` adhering to locked design tokens.
</objective>

<context>
Load for context:
- .agent/state/SPEC.md
- .agent/rules/STYLE.md
- .agent/state/DESIGN_STATE.md
- .agent/state/phases/1/RESEARCH.md
- src/components/MatchmakingLobby.tsx
- src/services/matchmakingApi.ts
</context>

<tasks>

<task type="auto">
  <name>Refactor MatchmakingLobby styling and copy to locked tokens</name>
  <files>src/components/MatchmakingLobby.tsx</files>
  <action>
    Update internal CSS properties and JSX in `src/components/MatchmakingLobby.tsx`:
    1. Align panel surfaces to `#0e1118` with `#0c0e14` headers and `1px solid rgba(255, 255, 255, 0.08)` borders.
    2. Convert mode selector to compact segmented control (`#090a0f` container, `#171b26` active state, `#f8fafc` text).
    3. Update time control options to 4 clean pills (`Untimed`, `3 min`, `5 min`, `10 min`) using `ui-monospace` tabular numbers.
    4. Apply approved action copy: "Find Match" primary CTA button with emerald accent (`#10b981`), "Create Room" secondary button, and "Join with Code".
    5. Clean up private room creation UI and join code inputs to use 4px/6px radii, hairline borders, and monospace room code display (`WH-XXXX`).
    6. AVOID: Do not break WebSocket event handlers (`clientRef.current.joinQueue`, `leaveQueue`), navigation redirection on `match_found`, or clipboard copying logic.
    7. AVOID: Never reintroduce hyperbolic fluff ("Galactic Arena", "Cosmic Queue", etc.).
  </action>
  <verify>npm run typecheck:all</verify>
  <done>MatchmakingLobby compiles cleanly with zero TypeScript errors and matches Phase 1 design tokens.</done>
</task>

<task type="auto">
  <name>Verify matchmaking queue controls and state transitions</name>
  <files>src/components/MatchmakingLobby.tsx</files>
  <action>
    Review state transitions in `MatchmakingLobby.tsx`:
    1. Ensure `isSearching` state renders clean countdown timer and "Cancel Search" button with rose accent (`#f87171`).
    2. Ensure `matchedRoom` banner renders high-contrast confirmation before redirecting to `/play/:roomCode`.
    3. Verify private room code generator produces 4-character random codes (`WH-XXXX`) with copy-to-clipboard button.
    4. Confirm all styles use consistent inline CSS or Tailwind utility tokens matching `STYLE.md`.
  </action>
  <verify>npm run build</verify>
  <done>Production build passes cleanly in < 10s with zero bundling warnings.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Matchmaking lobby conforms to 6px border radii and 1px hairline border tokens.
- [ ] Approved copy ("Find Match", "Create Room", "Join with Code") rendered correctly.
- [ ] Full-stack typecheck passes (`npm run typecheck:all`).
- [ ] Production build succeeds (`npm run build`).
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
