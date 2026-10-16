---
phase: 2
plan: 1
wave: 1
depends_on: []
files_modified:
  - scripts/verify-phase2-assets.mjs
  - scripts/generate-knight-assets.mjs
  - public/assets/cards/knight/*.svg
autonomous: true
must_haves:
  truths:
    - scripts/verify-phase2-assets.mjs exists and validates XML, viewBox, board geometry, top HUD condition badge, zero text on tiles, and catalog alignment
    - Exactly 30 Knight vector SVG illustrations exist in public/assets/cards/knight/ matching all Knight artIds in cardCatalog90.json
    - Every Knight SVG utilizes the approved 5x5 isometric board (Option B Alabaster Ivory #D5CDC0 & Dark Obsidian #2C3539) and Staunton Knight silhouette with 50% FIDE base ratio
    - Zero text is stamped onto chessboard squares (pure vector arcs, dashed guides, and landing reticles only)
  artifacts:
    - scripts/verify-phase2-assets.mjs
    - scripts/generate-knight-assets.mjs
    - public/assets/cards/knight/knight_cavalry_charge.svg
---

# Plan 2.1: Contract Test Harness & Knight Vector Artwork Suite (30 Cards)

<objective>
Author the contract verification harness `scripts/verify-phase2-assets.mjs` to establish contract-first validation rules for all 90 Minor Unit SVG assets, and author the Knight vector generation engine in `scripts/generate-knight-assets.mjs` to batch generate all 30 Knight vector illustrations in `public/assets/cards/knight/` adhering strictly to the user-approved 5×5 isometric board baseline, Staunton silhouette, and pure vector optics.

Purpose: Establishes the automated quality gate for Phase 2 and completes the first third (30 cards) of the Minor Unit vector library.
Output: `scripts/verify-phase2-assets.mjs`, `scripts/generate-knight-assets.mjs`, and 30 production SVG files in `public/assets/cards/knight/`.
</objective>

<context>
- `.agent/state/SPEC.md`
- `.agent/state/ROADMAP.md`
- `.agent/state/phases/2/RESEARCH.md`
- `.agent/rules/STYLE.md` (Section 7: 5×5 Standardized Isometric Vector Card Art Specifications)
- `.agent/state/DESIGN_STATE.md` (Milestone v3.0 Phase 2 approved baseline)
- `scratch/finalize_phase2_design.mjs` (Golden baseline generator for Knight: Cavalry Charge)
- `src/engine/cards/cardCatalog90.json` (30 Knight card definitions)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Author contract test harness scripts/verify-phase2-assets.mjs</name>
  <files>scripts/verify-phase2-assets.mjs</files>
  <action>
    Create `scripts/verify-phase2-assets.mjs` to validate all Minor Unit card SVG assets against 5-layer system contracts and invariants:
    1. Read `src/engine/cards/cardCatalog90.json` to extract canonical `artId`, `anchor`, `name`, and `description` for all 90 cards.
    2. Support flags: `--knights-only`, `--pawns-only`, `--bishops-only`, or default (full 90-card audit).
    3. Assertions per asset:
       - File existence at `public/assets/cards/{anchor}/{artId}.svg`.
       - Valid XML structure: opens with `<svg xmlns="http://www.w3.org/2000/svg"`, has valid closing tag `</svg>`.
       - Declares `viewBox="0 0 120 120"` (or declared width/height attributes).
       - Zero security violations: contains NO `<script>`, NO `<foreignObject>`, NO `onload=`, NO external HTTP links.
       - Zero embedded raster blobs: contains NO base64 strings or `<image>` tags.
       - Strict 5×5 board presence: contains Option B palette tokens (`#D5CDC0` or `D5CDC0`, `#2C3539` or `2C3539`, slab points).
       - Top HUD condition badge: contains `<rect` and condition text element with monospace font.
       - Zero text on tiles invariant: contains NO text tags within the chessboard coordinate space (e.g. no "LEAP OVER", no stamped square text).
    4. Provide clear terminal reporting with pass/fail tallies and exit code 1 on any failure.
    AVOID: Skipping XML hygiene checks or allowing loose regexes that fail on valid self-closing SVG tags.
  </action>
  <verify>node scripts/verify-phase2-assets.mjs --knights-only</verify>
  <done>scripts/verify-phase2-assets.mjs executes cleanly and reports failure on missing knight files or passes on existing knight_cavalry_charge.svg.</done>
</task>

<task type="auto">
  <name>Task 2: Implement Knight vector generation script and generate all 30 Knight SVGs</name>
  <files>scripts/generate-knight-assets.mjs, public/assets/cards/knight/*.svg</files>
  <action>
    Create `scripts/generate-knight-assets.mjs` and generate all 30 Knight SVG illustrations into `public/assets/cards/knight/`:
    1. Reuse the verified 5×5 isometric board matrix ($W=10.5, H=5.8, X_0=60, Y_0=38, dz=6$) with Option B palette (`#D5CDC0` light, `#2C3539` dark, alternating parity `(c + r) % 2 === 0`, perimeter 3D slab).
    2. Reuse the approved Staunton Knight silhouette with turned plinth base ($rx=5.0, ry=2.75$, height 17px) centered on the origin tile $(cx, cy)$.
    3. Map tailored vector optics for each of the 30 Knight cards based on tactical archetypes in `cardCatalog90.json`:
       - **Fairy Leap & Charge Vectors** (`knight_cavalry_charge`, `knight_camel_stride`, `knight_zebra_leap`, `knight_spring_vault`, `knight_dabbaba_jump`, `knight_tactical_disengage`): High 3D parabolic leap arcs with gold gradients, dashed ground-plane trace guides, and glowing target reticles.
       - **Double & Multi Leaps** (`knight_double_canter`, `knight_outrider_loop`, `knight_formation_stride`): Two-stage parabolic arcs with intermediate waypoint reticle.
       - **Position Swaps & Relay** (`knight_stable_swap`, `knight_relay_switch`, `knight_saddle_carry`, `knight_breach_follow_up`, `knight_draft_slipstream`): Bidirectional curved swap arrows connecting origin and target squares.
       - **Tactical Stances & Barriers** (`knight_bastion_stance`, `knight_drop_caltrops`, `knight_stable_barricade`, `knight_flank_palisade`, `knight_raider_s_aegis`): Glowing defensive kinetic shield dome (`rgba(56, 189, 248, 0.4)`) or impassable stone wall slabs on targeted tiles.
       - **Combat & Strikes** (`knight_parting_kick`, `knight_trampling_check`, `knight_twin_javelin`, `knight_dragoon_dive`, `knight_jousting_pass`, `knight_straight_lance`): Impact chevrons, crosshair reticles, and piercing vector darts.
       - **Reserves & Outriders** (`knight_summon_squire`, `knight_flank_recruit`, `knight_king_s_outrider`, `knight_cavalry_remount`, `knight_banner_rally`): Allied pawn silhouette / golden summoning rune beacon on vacated or target tile.
    4. Top HUD condition badge on every card with concise condition text derived from rule description (e.g. `COND: 2 SQUARES CLEAR`, `COND: PINNED TO KING`, `COND: UNMOVED 3 TURNS`, `COND: BESIDE ALLY`, `COND: ENEMY TERRITORY`).
    5. Execute generator script to write all 30 SVGs to `public/assets/cards/knight/{artId}.svg`.
    AVOID: Any raw text labels stamped onto chess squares. All text must be restricted to the top HUD badge.
  </action>
  <verify>node scripts/verify-phase2-assets.mjs --knights-only</verify>
  <done>All 30 Knight SVGs generated and pass 100% of contract assertions in verify-phase2-assets.mjs.</done>
</task>

</tasks>

<verification>
After completing tasks, verify:
- [ ] scripts/verify-phase2-assets.mjs exists and validates XML, viewBox, board geometry, and catalog alignment
- [ ] Exactly 30 Knight SVG files exist in public/assets/cards/knight/ matching cardCatalog90.json
- [ ] node scripts/verify-phase2-assets.mjs --knights-only reports 30/30 PASSED with 0 errors
- [ ] npm run typecheck:all passes cleanly
</verification>

<success_criteria>
- [ ] All 30 Knight card vector assets generated and verified
- [ ] Automated contract test harness operational
</success_criteria>
