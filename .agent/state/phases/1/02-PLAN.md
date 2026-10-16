---
phase: 1
plan: 2
wave: 2
depends_on:
  - "01"
files_modified:
  - src/engine/cards/cardCatalog90.json
autonomous: true
must_haves:
  truths:
    - All 90 Minor Unit cards in cardCatalog90.json have artId matching id
    - All 90 Minor Unit card titles are <= 21 characters with zero flowery/fantasy jargon
    - All 90 Minor Unit card descriptions are <= 120 characters with zero ellipses (...)
    - Suite 16 contract tests for Minor Units pass cleanly
  artifacts:
    - src/engine/cards/cardCatalog90.json
---

# Plan 1.2: Battlefield Minor Unit Catalog Polish (90 Cards: Pawn, Knight, Bishop)

<objective>
Audit and polish all 90 Battlefield Minor Unit cards (30 Pawn, 30 Knight, 30 Bishop) in `src/engine/cards/cardCatalog90.json`: replace flowery/archaic titles with direct tactical names, condense descriptions into concise rules formulas ($\le 120$ chars, zero ellipses), assign `artId`, and eliminate duplicate keys.

Purpose: Delivers a clean, direct, zero-ellipsis Minor Unit card catalog ready for vector artwork generation in Phase 2.
Output: Updated, normalized `src/engine/cards/cardCatalog90.json`.
</objective>

<context>
- `.agent/rules/STYLE.md`
- `.agent/state/DECISIONS.md` (DECISION-023)
- `.agent/state/phases/1/RESEARCH.md`
- `.agent/state/phases/1/01-PLAN.md`
- `src/engine/cards/cardCatalog90.json`
- `scripts/verify-all-cards.ts`
</context>

<tasks>

<task type="auto">
  <name>Task 1: Polish Pawn and Knight Cards (60 Cards) in cardCatalog90.json</name>
  <files>src/engine/cards/cardCatalog90.json</files>
  <action>
    For all 30 Pawn and 30 Knight cards in `src/engine/cards/cardCatalog90.json`:
    1. **Preserve `id` exactly** (e.g. `pawn_hold_the_line`, `knight_cavalry_charge`) to maintain engine handler bindings.
    2. **Polish Titles**:
       - Ensure all names are $\le 21$ characters.
       - Replace melodramatic names with direct tactical terms (e.g. rename `pawn_taunting_beckon` name from `"Taunting Beckon"` to `"Vanguard Beckon"`).
    3. **Condense Descriptions**:
       - Rewrite every description into an active tactical formula of $\le 120$ characters stating trigger, action, and constraints directly.
       - Example: `pawn_hold_the_line`: `"While pinned to your King, destroy an adjacent diagonal enemy in-place."` (66 chars).
       - Ensure **zero ellipses (`...`)** appear anywhere in the text.
    4. **Add `artId`**:
       - Add `"artId": card.id` to every record.
    5. **Clean Duplicate Keys**:
       - Ensure canonical `name` and `description` are primary; remove duplicate `card_name` and `card_description` fields.
    AVOID: Modifying `card.id` or changing energy costs or condition/effect genres.
  </action>
  <verify>npx ts-node -e "const c = require('./src/engine/cards/cardCatalog90.json').filter(x => ['Pawn','Knight'].includes(x.piece)); console.log('Checked', c.length, 'cards. Longest desc:', Math.max(...c.map(x=>x.description.length))); if (c.some(x=>x.description.length > 120 || x.description.includes('...'))) throw new Error('Failed bounds');"</verify>
  <done>All 60 Pawn and Knight cards have artId, titles <= 21 chars, descriptions <= 120 chars, and zero ellipses.</done>
</task>

<task type="auto">
  <name>Task 2: Polish Bishop Cards (30 Cards) in cardCatalog90.json</name>
  <files>src/engine/cards/cardCatalog90.json</files>
  <action>
    For all 30 Bishop cards in `src/engine/cards/cardCatalog90.json`:
    1. **Preserve `id` exactly** (e.g. `bishop_file_smite`, `bishop_piercing_ray`).
    2. **Polish Titles**:
       - Ensure all names are $\le 21$ characters.
       - Replace fantasy, religious, or awkward titles with direct tactical names:
         - `bishop_astral_transpose`: Rename `"Astral Transpose"` ➔ `"Diagonal Swap"`
         - `bishop_tractor_grace`: Rename `"Tractor Grace"` ➔ `"Diagonal Tow"`
         - `bishop_boomerang_grace`: Rename `"Boomerang Grace"` ➔ `"Recoil Hop"`
         - `bishop_zealot_convert`: Rename `"Zealot Convert"` ➔ `"Recruit Pawn"`
         - `bishop_stained_barrier`: Rename `"Stained Barrier"` ➔ `"Prism Wall"`
         - `bishop_nave_procession`: Rename `"Nave Procession"` ➔ `"Orthogonal Glide"`
         - `bishop_censure_sweep`: Rename `"Censure Sweep"` ➔ `"Bishop Cleave"`
         - `bishop_halo_strike`: Rename `"Halo Strike"` ➔ `"Bishop Smite"`
    3. **Condense Descriptions**:
       - Rewrite every description into an active tactical formula of $\le 120$ characters.
       - Example: `bishop_pilgrim_escort`: `"Slide 1–2 diagonal squares while carrying an adjacent allied Pawn along a parallel diagonal."` (94 chars).
       - Ensure **zero ellipses (`...`)** appear anywhere in the text.
    4. **Add `artId`**:
       - Add `"artId": card.id` to every record.
    5. **Clean Duplicate Keys**:
       - Remove duplicate `card_name` and `card_description` fields.
    AVOID: Modifying `card.id` or breaking Bishop movement rules.
  </action>
  <verify>npx ts-node -e "const c = require('./src/engine/cards/cardCatalog90.json').filter(x => x.piece === 'Bishop'); console.log('Checked', c.length, 'cards. Longest desc:', Math.max(...c.map(x=>x.description.length))); if (c.some(x=>x.description.length > 120 || x.description.includes('...'))) throw new Error('Failed bounds');"</verify>
  <done>All 30 Bishop cards have artId, direct tactical titles <= 21 chars, descriptions <= 120 chars, and zero ellipses.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] All 90 cards in `cardCatalog90.json` have descriptions $\le 120$ characters and zero ellipses.
- [ ] All 90 cards have `"artId": card.id`.
- [ ] `npm test` runs and passes existing engine invariant suites.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
