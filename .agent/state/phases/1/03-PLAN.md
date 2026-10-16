---
phase: 1
plan: 3
wave: 2
depends_on:
  - "01"
files_modified:
  - src/engine/cards/cardCatalogMajor90.json
autonomous: true
must_haves:
  truths:
    - All 90 Major Unit cards in cardCatalogMajor90.json have artId matching id
    - All 90 Major Unit card titles are <= 21 characters with zero flowery/fantasy jargon
    - All 90 Major Unit card descriptions are <= 120 characters with zero ellipses (...)
    - Suite 16 contract tests for Major Units pass cleanly
  artifacts:
    - src/engine/cards/cardCatalogMajor90.json
---

# Plan 1.3: Royal Court Major Unit Catalog Polish (90 Cards: Rook, Queen, King)

<objective>
Audit and polish all 90 Royal Court Major Unit cards (30 Rook, 30 Queen, 30 King) in `src/engine/cards/cardCatalogMajor90.json`: replace flowery/melodramatic titles with direct tactical names, condense descriptions into concise rules formulas ($\le 120$ chars, zero ellipses), assign `artId`, and eliminate duplicate keys.

Purpose: Delivers a clean, direct, zero-ellipsis Major Unit card catalog completing the full 180-card library ahead of vector artwork generation in Phase 3.
Output: Updated, normalized `src/engine/cards/cardCatalogMajor90.json`.
</objective>

<context>
- `.agent/rules/STYLE.md`
- `.agent/state/DECISIONS.md` (DECISION-023)
- `.agent/state/phases/1/RESEARCH.md`
- `.agent/state/phases/1/01-PLAN.md`
- `src/engine/cards/cardCatalogMajor90.json`
- `scripts/verify-all-cards.ts`
</context>

<tasks>

<task type="auto">
  <name>Task 1: Polish Rook and Queen Cards (60 Cards) in cardCatalogMajor90.json</name>
  <files>src/engine/cards/cardCatalogMajor90.json</files>
  <action>
    For all 30 Rook and 30 Queen cards in `src/engine/cards/cardCatalogMajor90.json`:
    1. **Preserve `id` exactly** (e.g. `rook_rampart_seal`, `queen_counter_smite`) to preserve engine handlers.
    2. **Polish Titles**:
       - Ensure all names are $\le 21$ characters.
       - Replace flowery or fantasy names with direct tactical terms:
         - `queen_arcane_dogleg`: Rename `"Arcane Dogleg"` ➔ `"Dogleg Leap"`
         - `queen_maiden_leap`: Rename `"Maiden Leap"` ➔ `"Royal Leap"`
    3. **Condense Descriptions**:
       - Rewrite every description into an active tactical formula of $\le 120$ characters stating trigger, action, and constraints directly.
       - Example: `rook_rampart_seal`: `"When adjacent to an ally, place an impassable barrier for 2 turns on an adjacent empty square."` (91 chars).
       - Example: `queen_counter_smite`: `"While under enemy attack, destroy the attacking piece in-place without moving."` (75 chars).
       - Ensure **zero ellipses (`...`)** appear anywhere in the text.
    4. **Add `artId`**:
       - Add `"artId": card.id` to every record.
    5. **Clean Duplicate Keys**:
       - Remove duplicate `card_name` and `card_description` fields.
    AVOID: Modifying `card.id` or changing energy costs.
  </action>
  <verify>npx ts-node -e "const c = require('./src/engine/cards/cardCatalogMajor90.json').filter(x => ['Rook','Queen'].includes(x.piece)); console.log('Checked', c.length, 'cards. Longest desc:', Math.max(...c.map(x=>x.description.length))); if (c.some(x=>x.description.length > 120 || x.description.includes('...'))) throw new Error('Failed bounds');"</verify>
  <done>All 60 Rook and Queen cards have artId, titles <= 21 chars, descriptions <= 120 chars, and zero ellipses.</done>
</task>

<task type="auto">
  <name>Task 2: Polish King Cards (30 Cards) in cardCatalogMajor90.json</name>
  <files>src/engine/cards/cardCatalogMajor90.json</files>
  <action>
    For all 30 King cards in `src/engine/cards/cardCatalogMajor90.json`:
    1. **Preserve `id` exactly** (e.g. `king_keep_garrison`, `king_bodyguard_switch`).
    2. **Polish Titles**:
       - Ensure all names are $\le 21$ characters.
       - Replace phrase-like or melodramatic titles with direct tactical names:
         - `king_break_the_pin`: Rename `"Break the Pin"` ➔ `"Pin Breaker"`
         - `king_monarch_s_decree`: Rename `"Monarch's Decree"` ➔ `"Royal Strike"`
    3. **Condense Descriptions**:
       - Rewrite every description into an active tactical formula of $\le 120$ characters.
       - Example: `king_keep_garrison`: `"While on home rank 1, spawn a fresh friendly Pawn onto an adjacent empty 2nd-rank square."` (88 chars).
       - Ensure **zero ellipses (`...`)** appear anywhere in the text.
    4. **Add `artId`**:
       - Add `"artId": card.id` to every record.
    5. **Clean Duplicate Keys**:
       - Remove duplicate `card_name` and `card_description` fields.
    AVOID: Modifying `card.id` or breaking King safety rules.
  </action>
  <verify>npx ts-node -e "const c = require('./src/engine/cards/cardCatalogMajor90.json').filter(x => x.piece === 'King'); console.log('Checked', c.length, 'cards. Longest desc:', Math.max(...c.map(x=>x.description.length))); if (c.some(x=>x.description.length > 120 || x.description.includes('...'))) throw new Error('Failed bounds');"</verify>
  <done>All 30 King cards have artId, titles <= 21 chars, descriptions <= 120 chars, and zero ellipses.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] All 90 cards in `cardCatalogMajor90.json` have descriptions $\le 120$ characters and zero ellipses.
- [ ] All 90 cards have `"artId": card.id`.
- [ ] `npm test` runs and passes all 16 test suites (203+ tests).
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
