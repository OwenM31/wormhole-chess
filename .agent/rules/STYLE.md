# Visual & Copy Style Guidelines

## Core Directives

### 1. Mandatory Copy Approval Rule
> **MANDATE**: ALWAYS ask for user confirmation before writing or updating any user-facing copy.
- Never invent dramatic, pseudo-cosmic, corporate, or hyperbolic filler ("Unleash your strategic mastery", "Welcome to the cosmic arena", "Synergy", etc.).
- Keep all UI text restrained, functional, authentic, and concise (resembling high-craft tools like Linear, Raycast, or minimal tactical games).
- Before placing copy into mockups, templates, or components, explicitly present candidate text strings to the user and obtain their confirmation.
- Ground rules established in Phase 1:
  - Navigation: "Wormhole Chess" · "Home" · "Wormhole" · "Deck Builder" · "Profile"
  - Home Hero: "Wormhole Chess" · Subtitle: "A collection of chess variants." (strictly eliminate unnecessary feature cards or corporate bloat).
  - Game modes: "Wormhole" (3D) and "Deck Builder" (2D) — avoid adding "Tactical Arena" fluff.
  - Mode one-liners:
    - 3D Wormhole: "Two 8x8 boards linked by a hole in the middle, for up to 4 players."
    - Deck Builder: "Standard chess rules with an 8-card loadout and 3 energy per turn."
  - Actions: "Find Match", "Create Room", "Join with Code", "Play Wormhole", "Play Deck Builder", "Solo Practice", "Replay".
  - Account state: "Sign In" · "Register" · "Guest" (clean tabs, zero wordy paragraphs).

---

## Design System Tokens (Locked in Phase 2: Wormhole Authentic Palette)

### 1. Color Palette (From Constants.tsx)
- **Base Background**: `#191B1D` (warm deep charcoal)
- **Primary Surface / Cards**: `#24272A` (charcoal panel surface)
- **Panel Header / Navigation**: `#1C1E20` (dark charcoal bar)
- **Elevated Controls / Inputs / Inactive Pills**: `#222528` or `#282B2E`
- **Border Stroke**: `1px solid rgba(139, 126, 116, 0.2)` (subtle dividers: `rgba(139, 126, 116, 0.12)`)
- **Border Highlight**: `rgba(212, 175, 55, 0.45)` on active focus/hover

#### Text Hierarchy
- **Primary Text**: `#FAF9F6` (warm white, high contrast)
- **Secondary Text**: `#8B7E74` (smokey taupe, labels, subtitles, secondary metadata)
- **Muted Text**: `#6E665E` (timestamps, subtle units, disabled states)

#### Semantic & Tactical Accents
- **Warm Gold Accent**: `#D4AF37` (brand glyphs, active player glow, turn highlights, energy pips `⚡`)
- **Loden Green**: `#4C5C4C` (hover `#5C6C5C`, text `#FAF9F6`; primary action buttons, online matchmaking)
- **Loden Green Dark**: `#3C493F` (dark chessboard squares)
- **Smokey Taupe**: `#8B7E74` (light chessboard squares, secondary pills)
- **Brick Red / Danger**: `#AA4A44` (resign button, check alert, loss)
- **Tactical Purple**: `#A855F7` (card targeting highlight, active card aura)

---

### 2. Typography
- **Primary Sans**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif`
- **Tabular Monospace**: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace` with `font-variant-numeric: tabular-nums` (mandatory for all ratings, timers, turns, and game stats).
- **Section Headers**: `font-size: 0.75rem`, `font-weight: 600`, `letter-spacing: 0.06em`, `text-transform: uppercase`, `color: #8B7E74`

---

### 3. Geometry & Surface Rhythm
- **Corner Radii**:
  - `6px` for structural panels, play mode cards, and modals
  - `7px` for portrait TCG playing cards (`aspect-ratio: 5 / 7`)
  - `4px` for buttons, segmented controls, status pills, and time pills
- **Hairline Strokes**: strictly `1px solid` micro-borders for crisp technical fidelity.
- **Layout Architecture**:
  - Widescreen 2-column or 3-column distribution to eliminate excessive vertical scroll.
  - Keep boards, TCG hand stages, and match feeds comfortably within standard viewports (1280x800).

---

### 4. 3D Wormhole HUD & Floating Overlays (Phase 4 Directives)
- **Floating HUD Backdrop**: `rgba(28, 30, 32, 0.88)` with `backdrop-filter: blur(12px)` and `1px solid rgba(139, 126, 116, 0.25)`.
- **Zero Obtrusive Sidebars**: The 3D canvas is edge-to-edge. Move history and controls are tucked into a sleek collapsible slide-out drawer (`290px`) that can be opened or closed on demand.
- **Floating Camera Dock**: Anchored at bottom-center with 4px buttons and tactile keybinding badges (`[T] Top`, `[F] Flip 180°`, `[R] Rotate 90°`, `[L] Orbit Lock`, `[X] Reset`).
- **Tactical Chess Clocks**: Tabular numerals with warm gold illumination (`#D4AF37`) for the active player's turn, cleanly integrated into top HUD capsules without giant bloated cards.

---

### 5. Deck Builder 3-Column TCG Ruffle Hand Stage (Phase 7 Directives)
- **No Redundant Bottom Card Bar, Left Route Icon Rail, or Left Mode Tabs**:
  - The Left Hand Stage (`356px` width on desktop) contains **only** the `⚡ ENERGY` bar (`3/3` with 3 gold pips) and the **2×4 Portrait TCG Ruffle Hand** (zero instructional text notes like `"7/8 IN HAND"` or `"Hover any card..."`).
  - The Center Stage holds the full **`512×512px` square Chessboard** flanked only by the Opponent and Player status bars (`36px` height each).
  - The Right Panel (`280px` width on desktop) features **`Moves` | `Chat`** segmented tabs in its top header alongside the `Turn` counter, and concise bottom match controls (`Resign` · `New Game` · `My Deck`).
- **Portrait TCG Playing Cards (`5:7` Aspect Ratio)**:
  - Arranged in **2 rows of 4 cards** (or 1 row of 5 in 5-card mode) with a tactile **ruffle spread overlap (`margin-left: -24px`)** and subtle fan rotation (`-3deg` to `+3.5deg`).
  - Each card features a 3-part Pokémon/TCG anatomy:
    1. **Top Header**: Card Title + Energy Cost badge (`⚡1–3` or `USED`).
    2. **Center Art / Visual Explainer Window**: Displays the piece glyph by default and renders an **animated mini-board schematic** (showing the piece's condition & movement/capture targets with glowing gold rings) when hovered or active.
    3. **Bottom Rules Box**: Compact `Condition ➔ Effect` taxonomy header + concise rule description.
- **Smooth Hover Pop-Out Reveal**: Hovering any card smoothly elevates and straightens it (`transform: translateY(-18px) scale(1.22) rotate(0deg)`, `z-index: 30`) with a warm gold border (`#D4AF37`).

---

### 6. Card Rules & Nomenclature Directives (Milestone v3.0)
- **Zero-Ellipsis Rule**: NEVER allow text on screen to be truncated or cut off with an ellipsis (`...` or `text-overflow: ellipsis` or `line-clamp`). All card titles and rules notes must be authored to fit completely and cleanly within their allocated card containers across all viewport sizes.
- **Direct Tactical Language**: No flowery, melodramatic, or overly metaphorical filler. Move and card names must be direct, evocative, and punchy. Rules descriptions must state concrete piece actions directly (e.g. `[Pin] Capture adjacent diagonal enemy in-place without moving.`).

---

### 7. 5×5 Standardized Isometric Vector Card Art Specifications (Milestone v3.0 Phase 2)
- **Geometry & Matrix**:
  - Reusable 5×5 isometric board ($c \in [0..4], r \in [0..4]$, 25 tiles total).
  - Isometric constants: $W = 10.5, H = 5.8, X_0 = 60, Y_0 = 38$, 3D perimeter depth $dz = 6$.
  - Shared vertex formulation: zero floating or stepped squares, 100% coplanar slab.
- **Palette Tokens (Option B Ivory & Obsidian)**:
  - Light Squares: `#D5CDC0` (Alabaster Ivory)
  - Dark Squares: `#2C3539` (Dark Obsidian Slate)
  - Grid Seam Stroke: `#141618` at 0.5px
  - 3D Perimeter Slab: `#222629` (left face), `#151719` (right face)
  - Ground Shadow: `#0A0B0C` ellipse at opacity 0.6
- **Strict Parity Invariant**:
  - Square color must strictly evaluate `(col + row) % 2 === 0 ? LIGHT : DARK`. Zero adjacent same-color squares.
- **Move Optics (Zero Text on Board)**:
  - Movement and special action paths must be depicted via clean vector optics: high 3D parabolic arcs with gradient fills (`#FFFDF7` core, `#D4AF37` outer glow), ground-plane dashed file guides, glowing landing reticles (`rgba(212, 175, 55, 0.42)`), and downward impact chevrons.
  - Zero raw text labels stamped onto chess squares.
- **Piece Proportions & Centering**:
  - Authentic Staunton piece silhouette mounted on a turned circular plinth base.
  - Base diameter strictly $50\%$ of tile width ($rx=5.0, ry=2.75$), anchored directly at the tile center.
  - Piece height capped at $16–18$px to prevent overhanging into neighboring squares.
- **Condition HUD Badge**:
  - Top HUD badge at $(10, 6)$, dimensions $100 \times 11$, $rx=2$, fill `#141618`, stroke `#D4AF37`.
  - Displays trigger condition in bold monospace (e.g. `COND: 2 SQUARES CLEAR`).

---

### 8. Deck Builder Main Menu Hub — Fluid 11-Column Focal Grid (Milestone v3.0 Phase 3)
- **Zero Hardcoded Pixel Column Widths**:
  - Never hardcode fixed pixel widths (e.g. `470px`, `320px`) or fixed pixel heights (`215px`) for layout columns or character stages.
  - Use a fluid **11-Column CSS Grid** on desktop (`grid-template-columns: repeat(11, minmax(0, 1fr))`, `gap: clamp(1rem, 1.8vw, 2rem)`):
    - **Primary Menu Stack (`Campaign`, `Multiplayer`, `My Profile` + `Switch Profile`)**: `grid-column: 3 / span 4` (Columns 3–6).
    - **Center Breathing Gutter**: Column 7 (`1fr` natural grid column gap).
    - **Player Showcase Companion Card (`Stats`, `Character Canvas`, `Gear & Cosmetics`, `Hand`)**: `grid-column: 8 / span 3` (Columns 8–10).
  - Use `aspect-ratio: 4 / 3` (or `1 / 1`) and `rem`/`clamp()` spacing for the Character Canvas window so it scales fluidly across all desktop, laptop, tablet, and mobile viewports.
- **Authentic Loden Green & Smokey Taupe Atmospheric Backdrop**:
  - Fullscreen background art layer and primary `Campaign` hero button strictly use the established **Loden Green Dark (`#3C493F`)**, **Loden Green (`#4C5C4C`)**, **Smokey Taupe (`#8B7E74`)**, and **Deep Charcoal (`#191B1D` / `#24272A`)** palette—never yellow/brown washes.


