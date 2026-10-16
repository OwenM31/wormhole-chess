# Phase 3 Research: Home Landing & Authentication Redesign

## 1. Executive Summary & Objective

Phase 3 redesigns the platform's primary entry routes:
1. **Home Landing Page (`/`, `src/pages/HomePage.tsx`)**: Replaces legacy generic AI marketing copy, bright blues/greens, and bloated cards with an atmospheric, restrained presentation. Grounded in the user-selected hybrid layout: a unified stage with variant tabs (`Deck Builder Chess` ↔ `3D Wormhole Chess`), a live 4-card tactical loadout rack, and the user's explicit "less is more" copy directives.
2. **Authentication Page (`/login`, `/register`, `src/pages/AuthPage.tsx`)**: Refactors the sign-in, registration, and guest onboarding flows into a crisp 400px segmented card adhering to the authentic Wormhole Chess design system (`#191B1D` canvas, `#24272A` surface, 6px radii, 1px hairline borders), eliminating marketing paragraphs while preserving session hooks, input validation, and guest-to-registered account linking.

---

## 2. Aesthetic & Token Specifications (Approved in Phase 3)

### 2.1 Authentic Wormhole Color Palette
| Token | Hex Value | Usage |
|---|---|---|
| `baseBackground` | `#191B1D` | Global canvas background |
| `surfaceCard` | `#24272A` | Primary card panels, stage card, auth card |
| `headerNav` | `#1C1E20` | Top navigation bar, stage tab bar, input containers |
| `inputElevated` | `#191B1D` | Form inputs, card asset item backgrounds |
| `warmWhite` | `#FAF9F6` | Primary high-contrast titles, values, and button labels |
| `smokeyTaupe` | `#8B7E74` | Subtitles, labels, inactive tabs, secondary metadata |
| `borderStroke` | `rgba(139, 126, 116, 0.22)` | Crisp 1px structural micro-borders |
| `warmGold` | `#D4AF37` | Energy counter `⚡`, active status pills, portal accents |
| `lodenGreen` | `#4C5C4C` | Primary action triggers (`Play Deck Builder →`, `Sign In`) |
| `lodenGreenHover` | `#5C6C5C` | Action button hover states |
| `dangerRed` | `#AA4A44` | Validation error banners |

### 2.2 Approved Copy Guidelines (User Confirmed)
- **Home Hero**:
  - Title: `Wormhole Chess`
  - Subtitle: `A collection of chess variants.`
  - Under-hero feature cards: Completely eliminated (zero generic marketing filler).
- **Deck Builder Stage Tab**:
  - Label: `🃏 Deck Builder Chess`
  - Heading: `Deck Builder Chess`
  - One-liner: `Standard chess rules with an 8-card loadout and 3 energy per turn.`
  - Counter: `⚡ ENERGY 3/3`
  - Cards: `♞ Knight Escort [2⚡]`, `🛡️ Shield Wall [1⚡]`, `🌀 Spatial Warp [3⚡]`, `👑 King Decree [2⚡]`
  - CTAs: `Play Deck Builder →` · `Solo Practice`
- **3D Wormhole Stage Tab**:
  - Label: `🌀 3D Wormhole Chess`
  - Heading: `3D Wormhole Chess`
  - One-liner: `Two 8x8 boards linked by a hole in the middle, for up to 4 players.`
  - Visual: Dual 3D isometric boards with `PORTAL D4 ⇄ H5` link
  - CTAs: `Launch 3D Wormhole →` · `Solo Practice`
- **Auth Page Tabs & Form**:
  - Tabs: `Sign In` · `Register` (or `Upgrade` if guest) · `Guest`
  - Form Fields: `Username` · `Password` · `Email (optional)`
  - CTA: `Sign In` / `Create Account` / `Play as Guest`
  - Guest Notice: `Playing as {username}. Registering links your stats.`

---

## 3. Plan Wave Breakdown

### Wave 1: Plan 3.1 — Home Landing Page Interactive Polish & Navigation Wiring
- **Target File**: `src/pages/HomePage.tsx`
- **Scope**:
  - Connect dynamic tab switching between `deck-builder` and `wormhole` variants with keyboard and mouse interactivity.
  - Implement tactile card hover effects and piece-class accent bars on the 4 sample tactical cards.
  - Wire direct routing links to `/deck-builder`, `/deck-builder?mode=ai`, `/wormhole`, and `/wormhole?mode=practice`.
  - Validate mobile viewport responsiveness (375px) ensuring cards wrap cleanly without horizontal scrollbars.

### Wave 2: Plan 3.2 — Authentication Page Wiring & Guest State Polish
- **Target File**: `src/pages/AuthPage.tsx`
- **Scope**:
  - Connect segmented tab switching (`login`, `register`, `guest`) to URL query/pathname parameters and active session state.
  - Preserve all `useAuth` hook methods (`login`, `register`, `loginAsGuest`), validation rules, error alerts, and redirect on authenticated session.
  - Ensure autofocus, clean password masking, and mobile responsive centering.

---

## 4. Verification & Testing Strategy

1. **Automated Unit & Invariant Testing**:
   - `npm test`: Verify all 83 card engine invariant tests continue passing with zero regressions.
2. **Full-Stack Typecheck**:
   - `npm run typecheck:all`: Clean across client TypeScript, Cloudflare Pages Functions, and companion Worker.
3. **Production Build**:
   - `npm run build`: Production bundle compiles cleanly without warnings or errors.
4. **Empirical Playwright UX Suite (`scripts/verify-phase3-ux.mjs`)**:
   - Test Desktop (1280x800):
     - Home page loads with approved copy ("Wormhole Chess", "A collection of chess variants.").
     - Deck Builder tab shows 4 tactical cards and energy pill.
     - Click 3D Wormhole tab: verifies smooth switch and approved copy ("Two 8x8 boards linked by a hole in the middle, for up to 4 players.").
     - Capture `phase3_home_desktop.png` and `phase3_home_3d_tab.png`.
   - Test Mobile (375x667):
     - Check `document.documentElement.scrollWidth <= 375` (zero horizontal overflow).
     - Capture `phase3_home_mobile.png`.
   - Test Auth Page (`/login`):
     - Verify 400px centered card, tab switching (`Sign In` ↔ `Register` ↔ `Guest`).
     - Test guest alert rendering when guest session active.
     - Capture `phase3_auth_desktop.png` and `phase3_auth_mobile.png`.
