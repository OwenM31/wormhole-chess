---
phase: 2
plan: 3
wave: 2
depends_on:
  - "2.1"
files_modified:
  - scripts/generate-bishop-assets.mjs
  - public/assets/cards/bishop/*.svg
autonomous: true
must_haves:
  truths:
    - scripts/generate-bishop-assets.mjs implements the authentic Staunton Bishop vector silhouette and tailors vector optics for all 30 Bishop cards
    - Exactly 30 Bishop vector SVG illustrations exist in public/assets/cards/bishop/ matching all Bishop artIds in cardCatalog90.json
    - Every Bishop SVG utilizes the standardized 5x5 isometric board (Option B Alabaster Ivory #D5CDC0 & Dark Obsidian #2C3539) and Staunton Bishop piece with 50% FIDE base ratio
    - Zero text is stamped onto chessboard squares (pure vector arcs, piercing diagonal rays, and landing reticles only)
  artifacts:
    - scripts/generate-bishop-assets.mjs
    - public/assets/cards/bishop/bishop_piercing_ray.svg
---

# Plan 2.3: Bishop Vector Artwork Suite (30 Cards)

<objective>
Design the authentic Staunton Bishop vector piece silhouette and author `scripts/generate-bishop-assets.mjs` to batch generate all 30 Bishop card illustrations in `public/assets/cards/bishop/` adhering strictly to the standardized 5×5 isometric board baseline, Option B palette, and pure vector optics.

Purpose: Delivers the final third (30 cards) of the Minor Unit vector library, completing all 90 Minor Unit cards (Pawn, Knight, Bishop) with bespoke isometric artwork.
Output: `scripts/generate-bishop-assets.mjs` and 30 production SVG files in `public/assets/cards/bishop/`.
</objective>

<context>
- `.agent/state/SPEC.md`
- `.agent/state/ROADMAP.md`
- `.agent/state/phases/2/RESEARCH.md`
- `.agent/rules/STYLE.md` (Section 7: 5×5 Standardized Isometric Vector Card Art Specifications)
- `.agent/state/DESIGN_STATE.md` (Milestone v3.0 Phase 2 approved baseline)
- `scripts/verify-phase2-assets.mjs` (Contract validation harness from Plan 2.1)
- `src/engine/cards/cardCatalog90.json` (30 Bishop card definitions)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Design Staunton Bishop silhouette and author Bishop generator script</name>
  <files>scripts/generate-bishop-assets.mjs</files>
  <action>
    Create `scripts/generate-bishop-assets.mjs` incorporating:
    1. Reusable 5×5 isometric board foundation ($W=10.5, H=5.8, X_0=60, Y_0=38, dz=6$) with Option B palette (`#D5CDC0` light, `#2C3539` dark, strict alternating parity `(c + r) % 2 === 0`, perimeter 3D slab).
    2. Staunton Bishop piece silhouette:
       - Turned plinth circular base ($rx=5.0, ry=2.75$, height 18px) centered on origin tile $(cx, cy)$ with ground drop shadow.
       - Slender tapered pedestal neck, waist ring, fluted ecclesiastical mitre cap with finial orb, and deep diagonal cleft notch cut into the head.
       - Authentic Plum / Violet / Warm Gold gradient fills (`#A855F7`, `#8A4F7D`, `#D4AF37`, `#FAF9F6`).
    3. Archetype mapping for all 30 Bishop cards in `cardCatalog90.json`:
       - **Piercing Diagonal Rays & Smites** (`bishop_piercing_ray`, `bishop_file_smite`, `bishop_censure_sweep`, `bishop_mirror_shatter`, `bishop_halo_strike`): High-energy radiant beam rays with glowing core, particle sparks, and dual-target impact chevrons.
       - **Color Shifts & Orthogonal Glides** (`bishop_nave_procession`, `bishop_color_shift`, `bishop_aisle_step`, `bishop_heretic_s_gambit`, `bishop_royal_approach`): Orthogonal stride guides, color-inverting diamond reticles, and Knight-jump trajectory arcs.
       - **Leaps & Escapes** (`bishop_vaulting_escape`, `bishop_skyward_check`, `bishop_boomerang_grace`, `bishop_overpass_leap`, `bishop_horizon_wrap`): High diagonal parabolic hurdle arcs and rim wrap warp portals.
       - **Sanctuary, Wards & Domes** (`bishop_cleric_s_ward`, `bishop_stained_barrier`, `bishop_cathedral_dome`, `bishop_twin_sanctuary`, `bishop_blessed_phalanx`): Glowing cathedral dome energy shield (`rgba(168, 85, 247, 0.4)`), stained glass barrier facets, and fortified pawn chain auras.
       - **Conclave Summons & Resurrections** (`bishop_belfry_acolyte`, `bishop_conclave_summon`, `bishop_altar_revival`, `bishop_cloister_initiate`, `bishop_zealot_convert`): Radiant summoning halos, diagonal resurrection light shafts, and spawned pawn markers.
       - **Escorts, Pushes & Transposition** (`bishop_part_the_crowd`, `bishop_tractor_grace`, `bishop_astral_transpose`, `bishop_fervor_push`, `bishop_pilgrim_escort`): Parallel diagonal escort vectors, tractor pull beams, and luminous minor piece swap rings.
    4. Top HUD condition badge with concise condition copy (e.g. `COND: OPEN DIAGONAL`, `COND: PINNED`, `COND: BESIDE QUEEN`, `COND: CORNER SQUARE`, `COND: UNMOVED 3 TURNS`).
    AVOID: Any stamped text on board tiles. Pure vector optics only.
  </action>
  <verify>node scripts/generate-bishop-assets.mjs --dry-run || node -e "import('./scripts/generate-bishop-assets.mjs') if needed"</verify>
  <done>scripts/generate-bishop-assets.mjs is syntactically valid and ready to output 30 Bishop SVGs.</done>
</task>

<task type="auto">
  <name>Task 2: Batch generate all 30 Bishop SVGs and verify contract assertions</name>
  <files>public/assets/cards/bishop/*.svg</files>
  <action>
    1. Run `node scripts/generate-bishop-assets.mjs` to render and save all 30 Bishop SVG assets into `public/assets/cards/bishop/{artId}.svg`.
    2. Verify all 30 files are generated on disk.
    3. Run `node scripts/verify-phase2-assets.mjs --bishops-only` to validate all 30 Bishop files against XML, viewBox, board geometry, top HUD condition badge, zero text on tiles, and catalog alignment.
    AVOID: Base64 embedded images, malformed XML tags, or overhanging piece geometry exceeding tile boundaries.
  </action>
  <verify>node scripts/verify-phase2-assets.mjs --bishops-only</verify>
  <done>All 30 Bishop SVGs generated and pass 100% of contract assertions in verify-phase2-assets.mjs.</done>
</task>

</tasks>

<verification>
After completing tasks, verify:
- [ ] Exactly 30 Bishop SVG files exist in public/assets/cards/bishop/ matching cardCatalog90.json
- [ ] node scripts/verify-phase2-assets.mjs --bishops-only reports 30/30 PASSED with 0 errors
- [ ] All SVGs adhere strictly to Option B board palette and Staunton Bishop silhouette
</verification>

<success_criteria>
- [ ] All 30 Bishop card vector assets generated and verified
</success_criteria>
