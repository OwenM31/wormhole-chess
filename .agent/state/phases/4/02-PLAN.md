---
phase: 4
plan: 2
wave: 1
depends_on: []
files_modified:
  - src/utils/handOrder.ts
  - scripts/verify-hand-order.ts
  - src/components/TacticalHandBar.tsx
  - src/components/PlayingCard.tsx
  - src/components/MultiplayerCharacterStage.tsx
  - package.json
autonomous: true
user_setup: []

must_haves:
  truths:
    - "On a 375px-wide viewport, cards in the in-game Tactical Hand and the Deck Builder Equipped Hand keep their desktop readable size and the row scrolls horizontally (swipe) instead of compressing"
    - "Once a card is played, it renders grayed-out at the END of the hand; unplayed cards keep their original relative order"
    - "Duplicate copies are count-aware: with 2x P1 equipped and 1 played, exactly one P1 is grayed and one remains playable"
    - "On touch devices, tapping a card does not leave a 'sticky hover' preview behind; hover preview only fires for mouse pointers"
  artifacts:
    - "src/utils/handOrder.ts exports a pure buildHandDisplay(initialDeck, remainingHand) function"
    - "scripts/verify-hand-order.ts passes and is wired into npm test"
---

# Plan 4.2: Mobile Card Scroll Rows & Spent-Card Tail Ordering

<objective>
Fix two hand-presentation issues found in playtest:
1. On mobile, cards get squished horizontally. Replace compressing layouts with horizontally scrollable rows (native swipe + scroll snap) while keeping card size readable.
2. When a card is played (grayed out), move it to the end of the player's hand.

Purpose: Cards must stay legible on phones; the playable cards should always be at the front of the hand.
Output: `src/utils/handOrder.ts` (+ test), updated `TacticalHandBar.tsx`, `PlayingCard.tsx`, `MultiplayerCharacterStage.tsx`.
</objective>

<context>
Load for context:
- .agent/rules/STYLE.md
- src/components/TacticalHandBar.tsx (renders `initialDeck` in 2 rows of 4 with negative-margin fan overlap; `isAvailable = hand.includes(cardId)` — NOT count-aware)
- src/components/PlayingCard.tsx (size="hand" uses `w-[92px] h-[142px] sm:w-[96px] sm:h-[148px]`; size="equipped" is `aspectRatio 5/7` and fills its grid cell)
- src/components/MultiplayerCharacterStage.tsx (~L614: Equipped Slots grid uses `repeat(handSize, minmax(0, 1fr))` — this is what squishes on mobile; ~L758 library grid uses `auto-fill, minmax(212px, 1fr)` which already wraps and is fine)
- src/engine/DeckChessEngine.ts (played cards are `splice`d out of `whiteHand`/`blackHand`; the UI derives "spent" by diffing `initialDeck` vs remaining hand)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Count-aware hand display ordering (spec test first, then util)</name>
  <files>scripts/verify-hand-order.ts, src/utils/handOrder.ts, package.json</files>
  <action>
    1. RED: Create `scripts/verify-hand-order.ts` (same assert/console style as `scripts/verify-36-playbook.ts`) asserting `buildHandDisplay(initialDeck: string[], remainingHand: string[]): Array<{ cardId: string; spent: boolean; slotKey: string }>`:
       - No cards played → same order as initialDeck, all `spent: false`.
       - initialDeck [A,B,C,D], remaining [A,C,D] → [A,C,D,B(spent)].
       - Two played → both at tail, in the order they appear in initialDeck: [A,B,C,D] remaining [B,D] → [B,D,A(spent),C(spent)].
       - Duplicates: initialDeck [P1,N1,P1,R1], remaining [N1,P1,R1] → exactly one P1 spent; result [N1? no — preserve initial order of unspent:] the FIRST occurrence(s) in initialDeck are treated as remaining, extra copies are spent → [P1,N1,R1,P1(spent)].
       - `slotKey` values are unique and stable (e.g. `${cardId}#${occurrenceIndex}`) so React keys don't collide on duplicates.
       - remainingHand containing a card NOT in initialDeck (defensive) → appended as unspent, never crashes.
    2. GREEN: Implement `src/utils/handOrder.ts` as a pure function (no React imports). Algorithm: build a count map from `remainingHand`; walk `initialDeck`, decrement count when > 0 → unspent list, else → spent list; return `[...unspent, ...spent]`.
    3. Append `&& tsx scripts/verify-hand-order.ts` to the `"test"` script in package.json.
    AVOID: using `hand.includes(cardId)` for availability — it marks every duplicate copy as available after one copy is played.
    AVOID: storing reordered hands in engine state — the engine hand order is used for network sync (`applyRemoteTurn`); ordering is a pure presentation concern.
  </action>
  <verify>npx tsx scripts/verify-hand-order.ts</verify>
  <done>All hand-order assertions pass; `npm test` includes the new suite.</done>
</task>

<task type="auto">
  <name>Task 2: Horizontal scroll rows for Tactical Hand (in-game) using buildHandDisplay</name>
  <files>src/components/TacticalHandBar.tsx, src/components/PlayingCard.tsx</files>
  <action>
    1. In `TacticalHandBar.tsx`:
       - Replace the `rows` split + `hand.includes` logic with `buildHandDisplay(deckCards, hand)`; use `slotKey` as React key and `!spent` as `isAvailable`.
       - Layout: below the `lg` breakpoint render ONE horizontal row: container `flex flex-nowrap overflow-x-auto snap-x snap-mandatory overscroll-x-contain` with `touch-action: pan-x`, `scroll-padding-inline`, hidden scrollbar on touch, and enough vertical padding (`pt-6 pb-3`) so the selected-card pop-out (`-translate-y-4 scale-[1.24]`) is not clipped by the scroll container. Each card wrapper is `flex-shrink-0 snap-start`. Drop the negative-margin fan overlap and rotation on this mobile row (overlap + scroll snap fight each other).
       - At `lg` and above keep the current 2×4 fanned spread (desktop is unchanged).
       - Add subtle left/right edge fade masks (CSS `mask-image: linear-gradient(...)`) only when content overflows, so users can tell the row scrolls.
       - When a card becomes selected, call `scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' })` on it so it is never half off-screen.
       - Remove the header "Cancel" button for an active card (product decision: re-tapping the selected card deselects it; no explicit deselect button). Keep the status text.
    2. In `PlayingCard.tsx` size="hand":
       - Replace hardcoded `w-[92px] h-[142px] sm:w-[96px] sm:h-[148px]` with a fluid, rem-based size that respects user font scaling: `width: clamp(5.75rem, 24vw, 6rem)` + `aspect-ratio: 5 / 7` (no fixed height). Minimum stays at today's mobile size so cards never get smaller.
       - Hover handlers: only fire `onMouseEnter`/`onMouseLeave` for mouse pointers (use `onPointerEnter`/`onPointerLeave` and check `e.pointerType === 'mouse'`), and gate the Tailwind `hover:` pop-out behind a `(hover: hover)` media query (e.g. `[@media(hover:hover)]:hover:...`). This prevents sticky hover previews on touch where tap = select.
    AVOID: hardcoding new pixel widths — use rem/clamp so OS/browser text-size settings still scale cards.
    AVOID: `overflow-x-auto` without vertical padding — overflow on one axis forces the other to clip, which would cut off the pop-out animation.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Tactical Hand renders a single swipeable row below `lg`, 2×4 fan at `lg+`, spent cards at tail, no header Cancel button, mouse-only hover; typecheck clean.</done>
</task>

<task type="auto">
  <name>Task 3: Horizontal scroll row for Deck Builder Equipped Hand + mobile Playwright check</name>
  <files>src/components/MultiplayerCharacterStage.tsx, scripts/verify-phase4-mobile-hand.mjs</files>
  <action>
    1. In `MultiplayerCharacterStage.tsx` Equipped Slots (~L614): replace `gridTemplateColumns: repeat(handSize, minmax(0, 1fr))` with a responsive track: `gridAutoFlow: 'column'`, `gridAutoColumns: 'minmax(5.75rem, 1fr)'`, `overflowX: 'auto'`, `scrollSnapType: 'x mandatory'`, `overscrollBehaviorX: 'contain'`, `touchAction: 'pan-x'`, and child `scrollSnapAlign: 'start'`. On wide screens the `1fr` still stretches the 8 slots across the row exactly as today; on narrow screens they hold at the minimum and scroll. Apply the same treatment to empty "Slot N" placeholders.
    2. Leave the 36-card library grid (`auto-fill, minmax(212px, 1fr)`) as a wrapping grid — it already wraps to 1 column on mobile and does not squish.
    3. Create `scripts/verify-phase4-mobile-hand.mjs` (Playwright, follow `scripts/verify-phase3-playtest.mjs` for server boot/selectors) that at viewport 375×812:
       - Opens `/deck-builder` → Multiplayer stage; asserts `[data-testid="equipped-hand-stage"]` slot elements each have boundingBox width ≥ 88px and the slot container `scrollWidth > clientWidth` when handSize = 8.
       - Starts an Offline Match; asserts every `[data-testid^="hand-card-"]` width ≥ 88px and the hand row `scrollWidth > clientWidth`.
       - Saves screenshots to `.agent/state/artifacts/screenshots/phase4_mobile_equipped.png` and `phase4_mobile_hand.png`.
       - Repeats the in-game width check at 1280×800 to assert the desktop 2×4 layout has NO horizontal overflow.
    AVOID: `minmax(0, 1fr)` anywhere in card rows — a 0 minimum is exactly what lets cards collapse.
  </action>
  <verify>npm run typecheck:all && npm run build && node scripts/verify-phase4-mobile-hand.mjs</verify>
  <done>Mobile (375px) card rows scroll horizontally with cards ≥ 88px wide; desktop layout has no horizontal overflow; screenshots captured.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npx tsx scripts/verify-hand-order.ts` passes (including duplicate-copy case)
- [ ] `node scripts/verify-phase4-mobile-hand.mjs` passes at 375px and 1280px
- [ ] `npm test`, `npm run typecheck:all`, `npm run build` all green
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
