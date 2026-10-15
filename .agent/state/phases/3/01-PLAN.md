---
phase: 3
plan: 1
wave: 1
depends_on: []
---

# Plan 3.1: Home Landing Page Polish & Interactive Variant Showcase Wiring

## Objective

Polish and wire the presentational UI shell in `src/pages/HomePage.tsx` to provide a responsive, high-craft entry point. The page incorporates the user-approved "less is more" design: a restrained hero ("Wormhole Chess" · "A collection of chess variants."), a unified variant showcase stage with dynamic tab switching between Deck Builder Chess and 3D Wormhole Chess, an interactive 4-card sample loadout preview with piece-class accents, and quick-play routing.

## Context

- `.agent/rules/STYLE.md` — Wormhole palette tokens and approved copy rules
- `.agent/state/DESIGN_STATE.md` — Phase 3 approved layout specifications
- `.agent/state/artifacts/design/phase_3_approved.png` — Visual reference
- `.agent/state/phases/3/RESEARCH.md` — Phase 3 architecture and component details
- `src/pages/HomePage.tsx` — Target home landing component
- `src/components/Navigation.tsx` — Top navigation bar

## Tasks

<task type="auto">
  <name>Task 1: Wire variant switcher tabs, interactive card previews, and launch routes in HomePage.tsx</name>
  <files>src/pages/HomePage.tsx</files>
  <action>
    - Ensure HomePage.tsx manages active variant state (`'deck-builder' | 'wormhole'`) with accessible button triggers.
    - Deck Builder Tab view:
      - Renders title "Deck Builder Chess" and one-liner "Standard chess rules with an 8-card loadout and 3 energy per turn."
      - Displays tabular energy pill "⚡ ENERGY 3/3" styled with warm gold (`#D4AF37`).
      - Renders the 4 sample tactical cards with piece-class color accents (`#3fb950` Knight, `#58a6ff` Shield/Rook, `#A855F7` Warp, `#D4AF37` King), energy cost pills, and smooth hover translation.
      - Wires primary CTA to `/deck-builder` ("Play Deck Builder →") in Loden Green (`#4C5C4C`) and secondary CTA to `/deck-builder` ("Solo Practice").
    - 3D Wormhole Tab view:
      - Renders title "3D Wormhole Chess" and user-approved one-liner "Two 8x8 boards linked by a hole in the middle, for up to 4 players."
      - Displays dual isometric board schematic with glowing dimensional portal beam (`PORTAL D4 ⇄ H5`).
      - Wires primary CTA to `/wormhole` ("Launch 3D Wormhole →") and secondary CTA to `/wormhole` ("Solo Practice").
    - Ensure hero copy is strictly "Wormhole Chess" with subtitle "A collection of chess variants." and zero under-hero feature cards.
    - Avoid adding generic marketing filler or unapproved copy.
  </action>
  <verify>npm run typecheck:all &amp;&amp; npm run build</verify>
  <done>HomePage.tsx compiles cleanly, renders user-approved copy, and supports interactive tab switching between Deck Builder and 3D Wormhole views.</done>
</task>

<task type="auto">
  <name>Task 2: Harden mobile responsiveness and keyboard focus accessibility on HomePage.tsx</name>
  <files>src/pages/HomePage.tsx</files>
  <action>
    - Add responsive styling rules so the cards grid collapses gracefully to single-column on mobile viewports (< 640px) without horizontal scrolling (`overflow-x: hidden`).
    - Constrain stage padding on small viewports so content remains comfortable with zero clipping.
    - Ensure all interactive tabs, action links, and buttons have clear keyboard focus indicators (`:focus-visible`) using warm gold highlight (`rgba(212, 175, 55, 0.45)`).
    - Ensure semantic HTML tags (`main`, `section`, `h1`, `h2`) for accessibility and screen reader structure.
  </action>
  <verify>npm run typecheck:all &amp;&amp; npm run build</verify>
  <done>HomePage.tsx is fully responsive across 375px mobile and 1280px desktop with zero horizontal overflow, and supports keyboard navigation.</done>
</task>

## Success Criteria

- [ ] `HomePage.tsx` displays user-approved copy: "Wormhole Chess" · "A collection of chess variants."
- [ ] Active tab switches smoothly between Deck Builder Chess and 3D Wormhole Chess views.
- [ ] Deck Builder view shows 4 sample tactical cards with piece-class colors and `⚡ ENERGY 3/3` counter.
- [ ] 3D Wormhole view shows dual isometric boards and "Two 8x8 boards linked by a hole in the middle, for up to 4 players."
- [ ] Full-stack typecheck and production build pass with 0 errors.
