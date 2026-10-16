---
phase: 7
plan: 1
wave: 1
depends_on: []
---

# Plan 7.1: Cross-Page Palette Unification & Copy Alignment

## Objective
Unify all Phase 1 components (`Navigation.tsx`, `DashboardPage.tsx`, `MatchmakingLobby.tsx`, `HistoricalMatchViewer.tsx`) onto the Authentic Wormhole Palette (`#191B1D` base, `#24272A` surface, `#1C1E20` header, `#FAF9F6` warm white, `#8B7E74` smokey taupe, `#D4AF37` warm gold, `#4C5C4C` loden green, `#AA4A44` brick red), align legacy copy strings in `PlayRoomPage.tsx` per `.agent/rules/STYLE.md`, and harden responsive stacking on `HistoricalMatchViewer.tsx` and `PlayRoomPage.tsx`.

## Context
- `.agent/state/SPEC.md`
- `.agent/rules/STYLE.md`
- `.agent/state/DESIGN_STATE.md`
- `.agent/state/DECISIONS.md` (DECISION-020)
- `.agent/state/phases/7/RESEARCH.md`
- `src/components/Navigation.tsx`
- `src/pages/DashboardPage.tsx`
- `src/components/MatchmakingLobby.tsx`
- `src/components/HistoricalMatchViewer.tsx`
- `src/pages/PlayRoomPage.tsx`

## Tasks

<task type="auto">
  <name>Task 1: Migrate Navigation.tsx and DashboardPage.tsx to the Authentic Wormhole Palette</name>
  <files>src/components/Navigation.tsx, src/pages/DashboardPage.tsx</files>
  <action>
    Update `src/components/Navigation.tsx` and `src/pages/DashboardPage.tsx` to eliminate all Phase 1 legacy cool-slate/cyan/emerald colors (`#090a0f`, `#0e1118`, `#0c0e14`, `#38bdf8`, `#10b981`, `#2563eb`, `#7c3aed`) and apply the Authentic Wormhole Palette locked in `.agent/rules/STYLE.md`:
    - In `src/components/Navigation.tsx`:
      - Set `navContainerStyle.backgroundColor` to `'#1C1E20'`, `borderBottom` to `'1px solid rgba(139, 126, 116, 0.2)'`, `color` to `'#FAF9F6'`.
      - Set `brandBadgeStyle` (`v2.0`) to warm gold (`backgroundColor: 'rgba(212, 175, 55, 0.14)'`, `color: '#D4AF37'`, `border: '1px solid rgba(212, 175, 55, 0.35)'`).
      - Set `linkStyle.color` to `'#8B7E74'`, `activeLinkStyle` to `color: '#FAF9F6'`, `backgroundColor: '#24272A'`, `border: '1px solid rgba(212, 175, 55, 0.35)'`.
      - Set `soundToggleButtonStyle`, `userPillLinkStyle`, `signOutButtonStyle`, `createAccountBtnStyle`, and `signInButtonStyle` to use `#24272A` surface, `rgba(139, 126, 116, 0.25)` borders, `#D4AF37` gold accents, and `#4C5C4C` loden green for primary sign-in.
    - In `src/pages/DashboardPage.tsx`:
      - Set `containerStyle.backgroundColor` to `'#191B1D'` and `color` to `'#FAF9F6'`.
      - Set panel surfaces (`panelStyle`, `profileCardStyle`, `statBoxStyle`, `authPromptCardStyle`) to `backgroundColor: '#24272A'` with `border: '1px solid rgba(139, 126, 116, 0.2)'`, and `panelHeaderStyle` to `backgroundColor: '#1C1E20'` with `borderBottom: '1px solid rgba(139, 126, 116, 0.16)'`.
      - Set `avatarCircleStyle` and `memberBadgeStyle` to warm gold (`#D4AF37`, `rgba(212, 175, 55, 0.14)`), primary action buttons (`btnWormholeStyle`, `primaryBtnStyle`) to Loden Green (`#4C5C4C`), and `btnDeckBuilderStyle` / `btnSoloStyle` / `btnManageDeckStyle` to `#282B2E` / `#1C1E20` with warm gold or taupe borders.
      - Preserve all existing user-facing copy strings without adding any unapproved filler text.
  </action>
  <verify>npm run typecheck:all</verify>
  <done>Navigation.tsx and DashboardPage.tsx compile cleanly with 0 TypeScript errors and use 100% Authentic Wormhole Palette tokens (#191B1D, #24272A, #1C1E20, #D4AF37, #4C5C4C, #8B7E74).</done>
</task>

<task type="auto">
  <name>Task 2: Migrate MatchmakingLobby.tsx & HistoricalMatchViewer.tsx Palette, Align PlayRoomPage.tsx Copy & Harden Responsive Grids</name>
  <files>src/components/MatchmakingLobby.tsx, src/components/HistoricalMatchViewer.tsx, src/pages/PlayRoomPage.tsx</files>
  <action>
    1. In `src/components/MatchmakingLobby.tsx`:
       - Replace `#0e1118`, `#0c0e14`, `#090a0f`, `#171b26`, `#38bdf8`, `#10b981`, `#2563eb` with Authentic Wormhole Palette tokens (`#24272A` container, `#1C1E20` header & segmented track, `#D4AF37` active border/accent, `#4C5C4C` primary Find Match / Create Room button, `#8B7E74` secondary labels).
    2. In `src/components/HistoricalMatchViewer.tsx`:
       - Replace `#0e1118`, `#0c0e14`, `#090a0f`, `#38bdf8`, `#2563eb` with Authentic Wormhole Palette tokens (`#24272A` modal surface, `#1C1E20` header/toolbar/sidebar, `#D4AF37` active move highlight, `#4C5C4C` Play button).
       - Add responsive `<style>` rules (`.replay-modal-body`, `.replay-sidebar`) so below `860px` viewport width, the modal body stacks vertically (`flex-direction: column`) and `.replay-sidebar` expands to `width: 100%`.
    3. In `src/pages/PlayRoomPage.tsx`:
       - Update lines 165–167 per `[DECISION-020]` and `.agent/rules/STYLE.md`: replace `'Deck Builder Chess Board'` with `'Deck Builder'` and `'3D Wormhole Hyperbolic Arena'` with `'3D Wormhole'`.
       - Add a responsive `<style>` rule for `.playroom-layout` so below `860px` viewport width, `grid-template-columns` collapses cleanly to `1fr`.
  </action>
  <verify>npm run typecheck:all && npm test</verify>
  <done>MatchmakingLobby.tsx, HistoricalMatchViewer.tsx, and PlayRoomPage.tsx use Authentic Wormhole Palette tokens, PlayRoomPage.tsx displays 'Deck Builder' / '3D Wormhole', and responsive stacking is active below 860px.</done>
</task>

## Success Criteria
- [ ] Zero legacy `#090a0f` / `#0e1118` / `#0c0e14` backgrounds remain in `Navigation.tsx`, `DashboardPage.tsx`, `MatchmakingLobby.tsx`, or `HistoricalMatchViewer.tsx`.
- [ ] `PlayRoomPage.tsx` uses approved restrained strings `'Deck Builder'` and `'3D Wormhole'`.
- [ ] `HistoricalMatchViewer.tsx` and `PlayRoomPage.tsx` collapse cleanly to single-column layouts on mobile/tablet viewports (`< 860px`).
- [ ] `npm run typecheck:all` and `npm test` pass with 0 errors.
