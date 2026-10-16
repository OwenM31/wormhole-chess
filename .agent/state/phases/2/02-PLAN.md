---
phase: 2
plan: 2
wave: 2
depends_on:
  - "2.1"
files_modified:
  - scripts/generate-pawn-assets.mjs
  - public/assets/cards/pawn/*.svg
autonomous: true
must_haves:
  truths:
    - scripts/generate-pawn-assets.mjs implements the authentic Staunton Pawn vector silhouette and tailors vector optics for all 30 Pawn cards
    - Exactly 30 Pawn vector SVG illustrations exist in public/assets/cards/pawn/ matching all Pawn artIds in cardCatalog90.json
    - Every Pawn SVG utilizes the standardized 5x5 isometric board (Option B Alabaster Ivory #D5CDC0 & Dark Obsidian #2C3539) and Staunton Pawn piece with 50% FIDE base ratio
    - Zero text is stamped onto chessboard squares (pure vector arcs, dashed guides, and landing reticles only)
  artifacts:
    - scripts/generate-pawn-assets.mjs
    - public/assets/cards/pawn/pawn_hold_the_line.svg
---

# Plan 2.2: Pawn Vector Artwork Suite (30 Cards)

<objective>
Design the authentic Staunton Pawn vector piece silhouette and author `scripts/generate-pawn-assets.mjs` to batch generate all 30 Pawn card illustrations in `public/assets/cards/pawn/` adhering strictly to the standardized 5×5 isometric board baseline, Option B palette, and pure vector optics.

Purpose: Delivers the second third (30 cards) of the Minor Unit vector library, equipping all frontline Pawn tactical cards with high-craft isometric illustrations.
Output: `scripts/generate-pawn-assets.mjs` and 30 production SVG files in `public/assets/cards/pawn/`.
</objective>

<context>
- `.agent/state/SPEC.md`
- `.agent/state/ROADMAP.md`
- `.agent/state/phases/2/RESEARCH.md`
- `.agent/rules/STYLE.md` (Section 7: 5×5 Standardized Isometric Vector Card Art Specifications)
- `.agent/state/DESIGN_STATE.md` (Milestone v3.0 Phase 2 approved baseline)
- `scripts/verify-phase2-assets.mjs` (Contract validation harness from Plan 2.1)
- `src/engine/cards/cardCatalog90.json` (30 Pawn card definitions)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Design Staunton Pawn silhouette and author Pawn generator script</name>
  <files>scripts/generate-pawn-assets.mjs</files>
  <action>
    Create `scripts/generate-pawn-assets.mjs` incorporating:
    1. Reusable 5×5 isometric board foundation ($W=10.5, H=5.8, X_0=60, Y_0=38, dz=6$) with Option B palette (`#D5CDC0` light, `#2C3539` dark, strict alternating parity `(c + r) % 2 === 0`, perimeter 3D slab).
    2. Staunton Pawn piece silhouette:
       - Turned plinth circular base ($rx=5.0, ry=2.75$, height 16px) centered on origin tile $(cx, cy)$ with ground drop shadow.
       - Concave pedestal neck, collar waist fillet, and spherical infantry bulwark/cap.
       - Authentic Steel/Warm White gradient fills (`#FAF9F6` highlight, `#A8B2B8` midtone, `#717D84` shadow) with gold rim accents.
    3. Archetype mapping for all 30 Pawn cards in `cardCatalog90.json`:
       - **Brace & Defense** (`pawn_hold_the_line`, `pawn_raise_buckler`, `pawn_king_s_duel`, `pawn_iron_wedge`): Interlocking tower shields, diagonal block reticle, kinetic shield bubble (`rgba(56, 189, 248, 0.4)`).
       - **Charges & Strikes** (`pawn_bayonet_charge`, `pawn_sweeping_halberd`, `pawn_sniper_shot`, `pawn_pike_thrust`): Forward bayonet blade, angled sweeping halberd arc, gold crosshairs on target square.
       - **Mobility & Leaps** (`pawn_close_the_gap`, `pawn_sidestep`, `pawn_tactical_retreat`, `pawn_feint_step`, `pawn_flank_march`, `pawn_vaulting_advance`, `pawn_catapult_launch`, `pawn_inward_bound`): 3D leap arcs, lateral step vectors, backward recoil traces.
       - **Barricades & Walls** (`pawn_corner_the_prey`, `pawn_trench_barricade`): 3D isometric stone wall slabs erected on target tiles.
       - **Reserves & Rally** (`pawn_call_reserves`, `pawn_reinforce_chain`, `pawn_royal_levy`, `pawn_second_wave`, `pawn_militia_muster`): Allied pawn spawn beacons with radiant circular ground runes.
       - **Position Swaps & Pulls** (`pawn_flank_tunnel`, `pawn_vanguard_tow`, `pawn_signal_swap`, `pawn_clear_sightline`, `pawn_taunting_beckon`, `pawn_ambush_switch`): Curved bidirectional swap arrows and tractor beam file paths.
    4. Top HUD condition badge with concise condition copy (e.g. `COND: PINNED TO KING`, `COND: 0 LEGAL MOVES`, `COND: BESIDE ALLY`, `COND: RIM FILE`, `COND: ENEMY TERRITORY`).
    AVOID: Any text on tiles. All tactical effects must be conveyed through vector optics.
  </action>
  <verify>node scripts/generate-pawn-assets.mjs --dry-run || node -e "import('./scripts/generate-pawn-assets.mjs') if needed"</verify>
  <done>scripts/generate-pawn-assets.mjs is syntactically valid and ready to output 30 Pawn SVGs.</done>
</task>

<task type="auto">
  <name>Task 2: Batch generate all 30 Pawn SVGs and verify contract assertions</name>
  <files>public/assets/cards/pawn/*.svg</files>
  <action>
    1. Run `node scripts/generate-pawn-assets.mjs` to render and save all 30 Pawn SVG assets into `public/assets/cards/pawn/{artId}.svg`.
    2. Verify all 30 files are generated on disk.
    3. Run `node scripts/verify-phase2-assets.mjs --pawns-only` to validate all 30 Pawn files against XML, viewBox, board geometry, top HUD condition badge, zero text on tiles, and catalog alignment.
    AVOID: Base64 embedded images, malformed XML tags, or overhanging piece geometry exceeding tile boundaries.
  </action>
  <verify>node scripts/verify-phase2-assets.mjs --pawns-only</verify>
  <done>All 30 Pawn SVGs generated and pass 100% of contract assertions in verify-phase2-assets.mjs.</done>
</task>

</tasks>

<verification>
After completing tasks, verify:
- [ ] Exactly 30 Pawn SVG files exist in public/assets/cards/pawn/ matching cardCatalog90.json
- [ ] node scripts/verify-phase2-assets.mjs --pawns-only reports 30/30 PASSED with 0 errors
- [ ] All SVGs adhere strictly to Option B board palette and Staunton Pawn silhouette
</verification>

<success_criteria>
- [ ] All 30 Pawn card vector assets generated and verified
</success_criteria>
