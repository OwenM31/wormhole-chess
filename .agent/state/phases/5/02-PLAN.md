---
phase: 5
plan: 2
wave: 2
depends_on: ["01"]
---

# Plan 5.2: Game Flow Match Recording, Cloud Deck Sync & Web Audio SFX

## Objective
Connect match completion flows in both chess variants to persistent D1 records with rich turn serialization, synchronize custom decks between the cloud API and browser storage, and implement procedural sound effects using the Web Audio API.

## Context
- `.agent/state/SPEC.md`
- `.agent/state/phases/5/RESEARCH.md`
- `.agent/state/phases/5/01-PLAN.md`
- `src/services/api.ts`
- `src/hooks/useDeckChessGame.ts`
- `src/components/DeckBuilderView.tsx`
- `src/pages/WormholePage.tsx`

## Tasks

<task type="auto">
  <name>Implement Web Audio Synthesizer Engine & SFX Triggers</name>
  <files>src/utils/soundEffects.ts, src/components/Navigation.tsx</files>
  <action>
    Create `src/utils/soundEffects.ts` using the browser native Web Audio API with zero external asset dependencies:
    - Lazy AudioContext initialization on first user interaction to comply with browser autoplay security policies.
    - Sound synthesis routines:
      * `playMoveSound()`: Clean wooden pop (triangle wave sweep 320Hz -> 160Hz, 0.05s).
      * `playCaptureSound()`: Snappy tactical impact (triangle + noise burst 240Hz -> 80Hz, 0.08s).
      * `playCheckSound()`: Warning chime (two-tone sine 880Hz -> 1174Hz, 0.16s).
      * `playCardSound()`: Mystic card shimmer (arpeggiated harmonics 440Hz -> 660Hz -> 880Hz, 0.14s).
      * `playVictorySound()`: Ascending major triad fanfare (C5, E5, G5, C6 over 0.6s).
      * `playDefeatSound()`: Gentle descending minor transition (Eb4 -> D4 -> C4 over 0.5s).
    - Mute state management:
      * Store preference in `localStorage` (`wormhole_sfx_muted`).
      * Provide `isMuted()`, `setMuted(muted: boolean)`, and `toggleMuted(): boolean`.
    - In `src/components/Navigation.tsx`, add a subtle audio toggle button (🔊 / 🔇) with tooltip that updates and persists the mute state.
  </action>
  <verify>npm run build</verify>
  <done>Web Audio synthesizer utility compiles cleanly and audio toggle button is mounted in Navigation.</done>
</task>

<task type="auto">
  <name>Connect Match Completion Recording & SFX in Game Engines</name>
  <files>src/hooks/useDeckChessGame.ts, src/pages/WormholePage.tsx</files>
  <action>
    Integrate match completion recording and sound effects into both chess variants:
    - In `src/hooks/useDeckChessGame.ts`:
      * Trigger `playMoveSound()`, `playCaptureSound()`, `playCheckSound()`, and `playCardSound()` at appropriate action events.
      * Track enriched `RecordedTurn[]` history storing `{ turnNumber, player, chessMove, cardAction, fenAfter, combatText, timestamp }`.
      * In `finishGame()`, trigger `playVictorySound()` or `playDefeatSound()`, and dispatch `api.recordMatch()`:
        `variant: isSolo ? 'deck_builder:ai' : 'deck_builder:pvp'`,
        `opponentName: isSolo ? 'Stockfish Minimax AI' : (remote opponent)`,
        `result: winner === 'white' ? '1-0' : winner === 'black' ? '0-1' : '1/2-1/2'`,
        `winner: winner`,
        `moves: recordedTurns`,
        `startedAt: gameStartedAt, endedAt: Date.now()`.
    - In `src/pages/WormholePage.tsx`:
      * When a 3D match ends or user concludes the session with a decisive state, record local match via `api.recordMatch({ variant: 'wormhole:local', opponentName: 'Local Player', result, winner, moves: [], startedAt, endedAt })`.
      * Add sound effects for moves and victory/defeat.
  </action>
  <verify>npm run build</verify>
  <done>Production build succeeds with match recording and sound triggers connected to useDeckChessGame and WormholePage.</done>
</task>

<task type="auto">
  <name>Connect Cloud Deck Synchronization in DeckBuilderView</name>
  <files>src/components/DeckBuilderView.tsx</files>
  <action>
    Upgrade `src/components/DeckBuilderView.tsx` with cloud synchronization backed by `/api/decks`:
    - On component mount, attempt to fetch saved custom decks via `api.getCustomDecks()`:
      * If user is authenticated and has a cloud active deck, populate active deck from cloud and sync to `localStorage`.
      * If user is a guest or offline, load from `localStorage` (`wormhole_active_deck_v1`).
    - When user clicks "Save & Activate Deck":
      * Validate deck with `validateDeckLoadout(currentDeck)`.
      * Save locally to `localStorage` immediately for instant feedback.
      * If authenticated, invoke `api.saveCustomDeck({ deckName: 'Active Loadout', cardIds, isActive: true })`.
      * Display status banner: "☁️ Deck synced to cloud" (or "💾 Saved locally (Guest mode)").
  </action>
  <verify>npm run build</verify>
  <done>DeckBuilderView loads and saves active decks to Cloudflare D1 via api.ts with graceful localStorage fallback.</done>
</task>

## Success Criteria
- [ ] Procedural sound effects synthesize in `src/utils/soundEffects.ts` with mute toggle in Navigation.
- [ ] `useDeckChessGame` records completed games with enriched `RecordedTurn[]` into D1 via `api.recordMatch()`.
- [ ] 3D Wormhole Chess records completed sessions into D1 match history.
- [ ] `DeckBuilderView` synchronizes custom loadouts with `/api/decks` for registered players while preserving guest `localStorage` support.
- [ ] `npm run build` succeeds cleanly.
