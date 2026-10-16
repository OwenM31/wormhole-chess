---
phase: 2
level: 2
researched_at: 2026-10-16
---

# Phase 2 Research: Minor Unit Vector Artwork Suite (90 Cards: Pawn, Knight, Bishop)

> **Objective**: Conduct technical research, establish 5-layer data contracts, define component architecture, and formulate state transitions and immutable precision invariants for authoring and integrating 90 custom vector illustration assets for Battlefield Minor Units (30 Pawn, 30 Knight, 30 Bishop).

---

## 1. Questions Investigated

1. **How should the 90 vector illustrations be constructed for maximum visual crispness, lightweight payloads, and cohesive aesthetic identity?**
   - Investigated vector primitives, scaling behaviors, and styling conventions in `public/assets/deckbuilder-chess-icon.svg` and `src/components/DeckBuilderLogo.tsx`.
   - Determined standard canvas geometry: `viewBox="0 0 120 120"` (or `0 0 240 240`) with crisp coordinate grid, centered tactical emblem silhouette, and dark squircle backdrop (`#16181A` to `#24272A`).
   - Standardized color system strictly to the Authentic Wormhole palette:
     - Gold Accent / Energy: `#D4AF37`, `#F5D061`, `#AA8A2A`
     - Pawn Steel / Silver: `#A8B2B8`, `#8B7E74`, `#FAF9F6`
     - Knight Emerald / Field: `#4C5C4C`, `#5C6C5C`, `#3C493F`
     - Bishop Plum / Ray: `#8A4F7D`, `#A855F7`, `#D4AF37`
     - Foundation Dark Surfaces: `#191B1D`, `#24272A`, `#141618`
   - Vector footprint target: 1.5–3 KB per SVG, 0 embedded raster bitmaps, 0 external font dependencies, and 0 expensive SVG Gaussian filters that cause GPU paint lag on low-power devices. Total bundle footprint for all 90 cards is ~180 KB total.

2. **How should the dedicated `<CardArt />` component be designed to handle loading, caching, and fallback resilience?**
   - Designed a shared component in `src/components/CardArt.tsx`.
   - Props: `anchor: PieceAnchor`, `artId?: string`, `cardName?: string`, `className?: string`, `alt?: string`.
   - Path resolution: `/assets/cards/${anchor}/${artId || 'default'}.svg`.
   - State handling: tracks `hasError`. On image error (or before assets exist), seamlessly renders the styled piece glyph (`PIECE_COLOR_THEMES[anchor].badgeIcon`) with identical aspect ratio and dimensions, eliminating layout shifts and broken image placeholders.
   - Browser caching: static SVGs served by Vite / Cloudflare Pages benefit from immutable asset headers and instant HTTP caching.

3. **How should vector card art integrate into `TacticalHandBar.tsx` without disrupting existing hover mini-board interactions?**
   - In `TacticalHandBar.tsx`, the card center window is currently 38px height (`h-[38px]`).
   - By default (idle card), the window displays `<CardArt anchor={card.anchor} artId={card.artId} cardName={card.name} />` inside a rounded 4px framed inset.
   - When the user hovers the card or selects it (`isSelected || isActiveForPiece`), the window smoothly transitions to reveal the 5×4 mini-board visual explainer with illuminated target coordinates.
   - This provides the best of both worlds: visceral TCG flavor at rest, and tactical mechanical clarity on hover/selection.

4. **How should vector card art integrate into `DeckBuilderView.tsx`?**
   - In `DeckBuilderView.tsx`, library cards currently render text only.
   - Introducing an art frame (56px–64px height) at the top of each card card-box creates immediate visual separation between card archetypes.
   - Displaying the card's bespoke SVG illustration immediately communicates the card's tactical essence (e.g. interlocking shields for `Hold the Line`, barded horse for `Cavalry Charge`, refractive prism beam for `Prism Slide`).
   - Retains zero-ellipsis rules: card descriptions are <= 120 chars and remain completely visible with zero truncation.

5. **What automated contract tests and validation scripts are required?**
   - Authored contract test harness in `scripts/verify-phase2-assets.mjs` verifying:
     1. Exact file presence: All 90 Minor Unit SVG files exist in `public/assets/cards/{pawn,knight,bishop}/`.
     2. Valid XML: Every SVG parses cleanly without malformed tags.
     3. Strict viewBox: All SVGs declare valid `viewBox` attributes.
     4. Hygiene: Zero external `<image>` links, zero `<script>` elements, zero embedded fonts.
     5. Catalog alignment: Every card in `cardCatalog90.json` has a 1-to-1 matching SVG file on disk.

---

## 2. Technical Architecture & Contracts (Data Architect Skill)

### 5-Layer Contract Alignment Table

| Domain Concept | Static Asset Storage (`public/`) | Shared TypeScript (`deckChess.ts`) | Runtime / Test Validation (`verify-phase2-assets.mjs`) | Component Props (`CardArt.tsx`) | UI Display (`HandBar` & `DeckBuilder`) |
|---|---|---|---|---|---|
| **Pawn Asset File** | `/assets/cards/pawn/{artId}.svg` | `artId: string` (e.g. `pawn_hold_the_line`) | `assert(fs.existsSync(filePath))` | `<CardArt anchor="pawn" artId={id} />` | 38px TCG window / 56px curator frame |
| **Knight Asset File** | `/assets/cards/knight/{artId}.svg` | `artId: string` (e.g. `knight_cavalry_charge`) | `assert(fs.existsSync(filePath))` | `<CardArt anchor="knight" artId={id} />` | 38px TCG window / 56px curator frame |
| **Bishop Asset File** | `/assets/cards/bishop/{artId}.svg` | `artId: string` (e.g. `bishop_piercing_ray`) | `assert(fs.existsSync(filePath))` | `<CardArt anchor="bishop" artId={id} />` | 38px TCG window / 56px curator frame |
| **Fallback Glyph** | Fallback in-memory React SVG | `anchor: PieceAnchor` | `assert(['pawn','knight','bishop'].includes(anchor))` | `fallbackIcon={theme.badgeIcon}` | Centered gold/taupe piece unicode glyph |
| **SVG XML Integrity** | Standalone XML document | `string` (raw SVG XML) | `assert(!svg.includes('<script') && svg.includes('viewBox'))` | Rendered via `<img src="..." />` | Scaled with `object-contain` |

---

### Exhaustive State Transition Matrix: Card Art Rendering & TCG Interaction

| Current Component State | Event: `IMG_LOAD_SUCCESS` | Event: `IMG_LOAD_ERROR` | Event: `HOVER_ENTER` | Event: `HOVER_LEAVE` | Event: `SELECT_CARD` |
|---|---|---|---|---|---|
| **`INITIALIZING`** | ➔ `ART_DISPLAYED` | ➔ `FALLBACK_GLYPH` | ➔ `MINI_BOARD_PREVIEW` | ➔ `INITIALIZING` | ➔ `MINI_BOARD_ACTIVE` |
| **`ART_DISPLAYED`** | (No-op) | ➔ `FALLBACK_GLYPH` | ➔ `MINI_BOARD_PREVIEW` (Smooth flip to 5x4 board) | (No-op) | ➔ `MINI_BOARD_ACTIVE` (Empowered targets shown) |
| **`FALLBACK_GLYPH`** | (No-op) | (No-op) | ➔ `MINI_BOARD_PREVIEW` (Smooth flip to 5x4 board) | (No-op) | ➔ `MINI_BOARD_ACTIVE` |
| **`MINI_BOARD_PREVIEW`** | (Background) | (Background) | (No-op) | ➔ `ART_DISPLAYED` (or `FALLBACK_GLYPH`) | ➔ `MINI_BOARD_ACTIVE` |
| **`MINI_BOARD_ACTIVE`** | (Background) | (Background) | (No-op) | (Remains `MINI_BOARD_ACTIVE` while selected) | ➔ `ART_DISPLAYED` (Deselect) |

---

### Immutable System Invariants

1. **90/90 File Completeness Invariant**:
   - Exactly 30 Pawn SVGs in `public/assets/cards/pawn/`.
   - Exactly 30 Knight SVGs in `public/assets/cards/knight/`.
   - Exactly 30 Bishop SVGs in `public/assets/cards/bishop/`.
   - *Enforcement*: Automated audit in `scripts/verify-phase2-assets.mjs` verifying 90/90 files matching `artId` in `cardCatalog90.json`.
2. **Zero Layout Shift Invariant**:
   - The `<CardArt />` wrapper and fallback element must occupy the exact identical container dimensions (`w-full h-full`) as the loaded SVG image.
   - *Enforcement*: CSS strict bounding box and `object-contain` aspect-ratio constraints.
3. **Zero External Dependencies / Security Invariant**:
   - Card SVGs must be strictly self-contained vector files. Zero external HTTP image URLs, font links, or JavaScript event attributes (`onload`, `onclick`).
   - *Enforcement*: RegExp parsing check in `scripts/verify-phase2-assets.mjs`.
4. **Authentic Palette Conformance**:
   - Vector styling must utilize Authentic Wormhole palette tokens (`#D4AF37`, `#8B7E74`, `#FAF9F6`, `#191B1D`, `#24272A`, `#4C5C4C`).
   - *Enforcement*: Visual contact sheet inspection and theme tokens.
5. **Zero-Ellipsis Preservation**:
   - Adding art frames in `DeckBuilderView.tsx` and `TacticalHandBar.tsx` must NOT cause rules text to clip, overflow, or introduce ellipses (`...`).
   - *Enforcement*: Playwright dual-viewport sweep checking `scrollWidth === clientWidth` and `Suite 16` contract tests.

---

## 3. Piece Visual Motifs & Catalog Mapping Ledger

### Pawn (30 Cards) — Tactical Motifs
*Core Silhouette: Heavy infantry helmet, tower shield, iron-pointed pike, interlocking bulwark.*

| Range | Cards | Primary Visual Motifs |
|---|---|---|
| **Blocked (10)** | `pawn_hold_the_line`, `pawn_bayonet_charge`, `pawn_sweeping_halberd`, `pawn_sniper_shot`, `pawn_phalanx_advance`, `pawn_shield_bash`, `pawn_overwatch`, `pawn_entrench`, `pawn_barricade`, `pawn_vanguard_step` | Tower shields bracing lasers, bayonet blades, forward crosshairs, reinforced stone barricades, fortified trench lines. |
| **Position (5)** | `pawn_center_control`, `pawn_diagonal_shift`, `pawn_backward_step`, `pawn_rank_push`, `pawn_rim_wrap` | Checkered center square highlights, diagonal pivot vectors, cylindrical rim wrap warp rings. |
| **Neighbors (5)** | `pawn_ally_swap`, `pawn_escort_guard`, `pawn_flank_screen`, `pawn_unit_rally`, `pawn_spear_wall` | Interlocking pauldron plates, dual soldier shoulder-to-shoulder, spear tips projecting outward. |
| **Lines (5)** | `pawn_ray_shield`, `pawn_file_march`, `pawn_file_cleave`, `pawn_piercing_step`, `pawn_column_breach` | Vertical file laser deflector, file stride arrows, split column fracture lines. |
| **Threat (5)** | `pawn_desperate_counter`, `pawn_king_shield`, `pawn_threat_brace`, `pawn_retaliation_smite`, `pawn_final_stand` | Glowing defensive dome over royal crown, spiked counter-shield, golden aura burst. |

### Knight (30 Cards) — Tactical Motifs
*Core Silhouette: Barded warhorse crest, visored charger helm, curved leaping trajectories, fairy vectors.*

| Range | Cards | Primary Visual Motifs |
|---|---|---|
| **Momentum (10)** | `knight_cavalry_charge`, `knight_camel_stride`, `knight_zebra_leap`, `knight_dabbaba_jump`, `knight_jousting_pass`, `knight_fork_threat`, `knight_outflank`, `knight_trample_advance`, `knight_vaulting_leap`, `knight_recoil_hop` | High-speed motion blur chevrons, extended (3,1) and (3,2) fairy leap compasses, double orthogonal hurdle arcs, lowered jousting lance. |
| **Position (5)** | `knight_corner_spring`, `knight_center_outpost`, `knight_rim_gallop`, `knight_backward_leap`, `knight_pivot_wheel` | Outpost flag planted on board center, spring-loaded hoof coils, 360-degree radial jump compass. |
| **Neighbors (5)** | `knight_bodyguard_link`, `knight_squadron_lead`, `knight_rear_guard`, `knight_cover_flank`, `knight_interlocking_guard` | Paired warhorses in formation, flanking shield wing, linked chainmail barrier. |
| **Threat (5)** | `knight_check_ambush`, `knight_smite_retaliate`, `knight_counter_fork`, `knight_desperate_leap`, `knight_royal_escort` | Royal crown under guard, ambush crosshair bursting from shadows, dual threat split arrows. |
| **Blocked (5)** | `knight_siege_vault`, `knight_hurdle_barrier`, `knight_gate_breach`, `knight_picket_leap`, `knight_overleap_cleave` | Wall obstacle with parabolic leap trajectory sailing over battlements, shattered gate bars. |

### Bishop (30 Cards) — Tactical Motifs
*Core Silhouette: Fluted mitre, curved crosier, radiant diagonal beam rays, prism refraction, stained glass.*

| Range | Cards | Primary Visual Motifs |
|---|---|---|
| **Lines (10)** | `bishop_piercing_ray`, `bishop_heretic_gambit`, `bishop_diagonal_sweep`, `bishop_cathedral_dome`, `bishop_prism_slide`, `bishop_file_smite`, `bishop_color_shift`, `bishop_laser_lance`, `bishop_refraction_beam`, `bishop_sanctuary_ray` | High-energy diagonal piercing laser beam, dual-color square swap diamond, radiant stained glass dome shield, prism split ray. |
| **Position (5)** | `bishop_corner_battery`, `bishop_center_dominance`, `bishop_rim_ricochet`, `bishop_long_diagonal`, `bishop_zenith_perch` | 8-square full board diagonal ray, ricochet angle bouncing off board rim, elevated pulpit perch. |
| **Neighbors (5)** | `bishop_clerical_ward`, `bishop_flank_blessing`, `bishop_covenant_link`, `bishop_holy_phalanx`, `bishop_relic_bearer` | Glowing aura enveloping adjacent allies, golden covenant link beam, ceremonial relic standard. |
| **Threat (5)** | `bishop_martyr_smite`, `bishop_retribution_strike`, `bishop_shield_the_weak`, `bishop_righteous_fury`, `bishop_final_blessing` | Exploding diagonal counter-smite upon capture, protective wing over damaged pawn, golden halos. |
| **Momentum (5)** | `bishop_rapid_glide`, `bishop_rebound_leap`, `bishop_crusade_charge`, `bishop_dogleg_leap`, `bishop_momentum_sweep` | Angled speed vectors, diagonal-to-orthogonal dogleg trajectory, momentum forward rush. |

---

## 4. Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| **Asset Format & Engine** | Standalone native SVGs in `public/assets/cards/{piece}/{artId}.svg` | Zero JavaScript bundle bloat, zero network API latency, instant browser caching, infinite resolution scaling. |
| **Rendering Component** | Dedicated `<CardArt />` component with error fallback | Gracefully prevents layout shift and broken image icons; provides centralized styling. |
| **TCG Hand Bar Interaction** | Vector Art at rest ➔ 5×4 Mini-Board on hover / selection | Retains rich visual immersion while maintaining immediate mechanical transparency during move planning. |
| **Deck Builder Curator Art Frame** | Top 56px visual thumbnail box above title | Elevates the Deck Builder from a dry text table into an authentic TCG card library. |
| **Contract Verification** | Standalone validation script `scripts/verify-phase2-assets.mjs` | Provides instant automated empirical proof of asset existence, valid XML, and schema fidelity. |

---

## 5. Patterns to Follow

- **Self-Contained Vector SVGs**: Use standard SVG `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">` with clean semantic tags (`<path>`, `<rect>`, `<circle>`, `<g>`).
- **Consistent Geometric Centering**: Main emblem should occupy the central 80×80 region of the 120×120 canvas, surrounded by subtle tactical frame / boundary accents.
- **Graceful Error Fallbacks**: Always handle missing or loading assets with CSS/React fallbacks so gameplay is never blocked.

---

## 6. Anti-Patterns to Avoid

- **No Bloated Raster Bitmaps**: Do not embed base64 PNGs or large raster textures inside SVGs.
- **No Heavy GPU Filters**: Avoid nested `<feGaussianBlur>` or `<feDisplacementMap>` which drop framerates on mobile or slower devices.
- **No Text Truncation / Ellipses**: When embedding artwork into `DeckBuilderView.tsx`, ensure container heights and padding do not cause card rules descriptions to be clipped or truncated.

---

## 7. Dependencies Identified

| Package / Module | Version | Purpose |
|---|---|---|
| `fs`, `path` | Node built-in | Asset existence and XML parsing validation in test harness |
| `fast-xml-parser` | (or standard regex/DOMParser) | XML syntax validation in verification script |
| React | 18.x | `<CardArt />` presentation component |
| Playwright | Local CLI | Visual contact sheet and multi-viewport verification |

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Asset Authoring Load (90 SVGs)** | Execute in 3 planned waves of 30 cards (Pawn, Knight, Bishop) adhering strictly to modular visual archetypes. |
| **Broken Image Links in Production** | Comprehensive contract audit `verify-phase2-assets.mjs` verifies every single card's `artId` matches an existing file on disk. |
| **UI Overflow on Mobile** | Maintain compact dimensions (38px height in hand, 56px in curator) and verify with Playwright dual-viewport sweep. |

---

## 9. Ready for Planning

- [x] Technical questions investigated and answered
- [x] 5-layer contracts and state transitions formulated
- [x] Piece visual motifs and catalog mapping ledger defined
- [x] Verification harness and component architecture specified
- [x] Ready for Phase 2 task decomposition (`/plan 2`)
