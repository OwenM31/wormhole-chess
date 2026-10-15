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
- **Section Headers**: `font-size: 0.75rem`, `font-weight: 600`, `letter-spacing: 0.06em`, `text-transform: uppercase`, `color: #94a3b8`

---

### 3. Geometry & Surface Rhythm
- **Corner Radii**:
  - `6px` for structural panels, play mode cards, and modals
  - `4px` for buttons, segmented controls, status pills, and time pills
- **Hairline Strokes**: strictly `1px solid` micro-borders for crisp technical fidelity.
- **Layout Architecture**:
  - Widescreen 2-column or bento distribution to eliminate excessive vertical scroll.
  - Keep boards, tactical hand bars, and match feeds comfortably within standard viewports (1280x800).
