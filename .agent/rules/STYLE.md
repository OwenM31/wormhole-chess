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
- **No Redundant Bottom Card Bar or Left Route Icon Rail**: The player's hand lives exclusively in the **Left Hand Stage (`356px` width on desktop)**, freeing the Center Stage for a full **`512×512px` square Chessboard** flanked only by the Opponent and Player status bars (`36px` height each).
- **Portrait TCG Playing Cards (`5:7` Aspect Ratio)**:
  - Arranged in **2 rows of 4 cards** (or 1 row of 5 in 5-card mode) with a tactile **ruffle spread overlap (`margin-left: -24px`)** and subtle fan rotation (`-3deg` to `+3.5deg`).
  - Each card features a 3-part Pokémon/TCG anatomy:
    1. **Top Header**: Card Title + Energy Cost badge (`⚡1–3`).
    2. **Center Art / Visual Explainer Window**: Displays the piece glyph by default and renders an **animated mini-board schematic** (showing the piece's condition & movement/capture targets with glowing gold rings) when hovered or active.
    3. **Bottom Rules Box**: Compact `Condition ➔ Effect` taxonomy header + concise rule description.
- **Smooth Hover Pop-Out Reveal**: Hovering any card smoothly elevates and straightens it (`transform: translateY(-18px) scale(1.22) rotate(0deg)`, `z-index: 30`) with a warm gold border (`#D4AF37`) so the full card face and mini-board visual explainer are effortlessly readable without needing a separate Card Inspector panel.

