# Visual & Copy Style Guidelines

## Core Directives

### 1. Mandatory Copy Approval Rule
> **MANDATE**: ALWAYS ask for user confirmation before writing or updating any user-facing copy.
- Never invent dramatic, pseudo-cosmic, corporate, or hyperbolic filler ("Unleash your strategic mastery", "Welcome to the cosmic arena", "Synergy", etc.).
- Keep all UI text restrained, functional, authentic, and concise (resembling high-craft tools like Linear, Raycast, or minimal tactical games).
- Before placing copy into mockups, templates, or components, explicitly present candidate text strings to the user and obtain their confirmation.
- Ground rules established in Phase 1:
  - Navigation: "Wormhole Chess" · "Home" · "Wormhole" · "Deck Builder" · "Profile"
  - Game modes: "Wormhole" (3D) and "Deck Builder" (2D) — avoid adding "Tactical Arena" fluff.
  - Actions: "Find Match", "Create Room", "Join with Code", "Play Wormhole", "Play Deck Builder", "Replay".
  - Account state: "Member" vs "Guest" (no "Permanent Account" jargon).

---

## Design System Tokens (Locked in Phase 1: Technical Density)

### 1. Color Palette
- **Base Background**: `#090a0f` (deep jet black)
- **Primary Surface / Cards**: `#0e1118`
- **Panel Header / Navigation**: `#0c0e14`
- **Elevated Controls / Inputs / Inactive Pills**: `#141722` or `#171b26` (hover `#1b2030`)
- **Card Hover Background**: `#11141d`
- **Border Stroke**: `1px solid rgba(255, 255, 255, 0.08)` (subtle dividers: `rgba(255, 255, 255, 0.04)`)
- **Border Highlight**: `rgba(56, 189, 248, 0.35)` on card focus/hover

#### Text Hierarchy
- **Primary Text**: `#f8fafc` (high contrast)
- **Secondary Text**: `#94a3b8` (labels, subtitles, secondary metadata)
- **Muted Text**: `#64748b` (timestamps, subtle units, disabled states)

#### Semantic Accents
- **Cyan / Brand Accent**: `#38bdf8` (badge bg: `rgba(56, 189, 248, 0.12)`, border: `rgba(56, 189, 248, 0.25)`)
- **Emerald / Positive / Matchmaking**: `#10b981` (hover `#059669`; text/badge `#4ade80`, bg `rgba(74, 222, 128, 0.1)`)
- **3D Arena Blue**: `#2563eb` (hover `#1d4ed8`)
- **Deck Builder Purple**: `#7c3aed` (hover `#6d28d9`)
- **Rose / Danger / Loss**: `#f87171` (badge bg: `rgba(248, 113, 113, 0.1)`, border `rgba(248, 113, 113, 0.25)`)

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
