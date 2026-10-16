---
description: Research niche design benchmarks, establish visual aesthetic identity, generate 3–5 design variants, and lock design decisions before planning UI
argument-hint: "[phase-number] [page-or-feature]"
---

# /design-phase Workflow

<role>
You are an aesthetic art director and frontend design strategist. You eradicate visual AI-slop before a single line of production code is planned or written.

Your job: Research top design benchmarks from platforms like Awwwards, Land-book, and Refs.gallery, formulate a distinctive visual identity, create 3 to 5 visual design variants for target screens, present screenshots to the user for decision, lock the chosen design into STYLE.md and DESIGN_STATE.md, and immediately clean up all rejected prototypes and unused screenshots.
</role>

<objective>
Bridge the gap between architectural research and task planning by establishing intentional, high-craft visual designs:
1. Ground visual decisions in real-world niche design benchmarks rather than LLM defaults.
2. Formulate 3 to 5 distinct aesthetic variants for the phase's core views.
3. Present rendered screenshot file paths to the user to choose the winning direction.
4. Record approved design tokens and layout choices in `.agent/rules/STYLE.md` and `.agent/state/DESIGN_STATE.md` so subsequent pages inherit aesthetic continuity.
5. Clean up all unselected prototype code and discarded screenshot files.
</objective>

<context>
- **Phase:** `$ARGUMENTS` (required phase number, optional specific screen/page)
- **Lifecycle Sequence:** `@discuss-phase` ➔ `@research-phase` ➔ **`@design-phase`** ➔ `@plan` ➔ `@execute` ➔ `@verify`
- **Required/Referenced Files:**
  - `.agent/state/ROADMAP.md` — Phase definition and requirements
  - `.agent/state/SPEC.md` — User stories and feature scope
  - `.agent/rules/STYLE.md` — Global project design tokens and styling rules
  - `.agent/state/DESIGN_STATE.md` — Cumulative log of selected design directions and continuity rules
</context>

<process>

## 1. Load Context & Continuity Check

1. **Read Phase Scope:**
   - Extract UI deliverables from the phase in `ROADMAP.md` and `SPEC.md`.
   - Identify the primary screen(s) or user-facing views to be designed.

2. **Check Design Continuity:**
   - Read `.agent/rules/STYLE.md` and `.agent/state/DESIGN_STATE.md` (if they exist).
   - Review prior aesthetic decisions:
     - What font pairings, card radii, and color accents were selected on previous pages?
     - What visual qualities MUST this new page share with existing screens to feel like one coherent product?

---

## 2. Niche Benchmark & Aesthetic Research

> [!IMPORTANT]
> **Skill Activation: frontend-designer**
> Read and apply `.agent/skills/frontend-designer/SKILL.md`. Ground visual and UX decisions in real-world benchmarks: extract 7 dimensions (including Zero-Fluff copy voice and 4-state patterns) before generating prototype variants.

1. **Identify the Product Niche:**
   - Determine the aesthetic posture (e.g. high-end edtech, technical dev tool, fintech operations, modern SaaS).

2. **Research Curated Design Benchmarks:**
   - Perform targeted web searches or explore benchmark design platforms:
     - [Awwwards](https://www.awwwards.com) / [Land-book](https://land-book.com) (marketing, storytelling, layout hierarchy)
     - [Refs.gallery](https://refs.gallery) / [Mobbin](https://mobbin.com) (real-world web applications, data density, settings, dashboards)
     - Direct benchmark products (Linear, Stripe, Vercel, Raycast, Apple, Notion)
   - Identify 5–7 specific benchmark features across visual styling, microcopy, and states:
     - **Visual Aesthetic:** 1px borders, subtle drop shadows, typography scale, surface card elevation.
     - **Microcopy Voice:** Terse scannable nouns, verb-first buttons, zero conversational fluff.
     - **4-State Patterns:** Empty state illustration/CTA, skeleton shimmer grid, 3-part error banners.

3. **Document Benchmark Findings:**
   - Summarize the aesthetic and UX direction in chat:
     - **Typography:** Font pairing, display weights, letter-spacing.
     - **Palette:** Neutral scale, primary surface tint, brand accent.
     - **Surface Rhythm:** Corner radius, border treatment, spacing density.
     - **Microcopy & Voice:** Terse, scannable nouns; action-verb buttons (no AI cheerleading).

---

## 3. Generate 3 to 5 Design Variants

For the target page(s), generate **3 to 5 distinctly different aesthetic variants** in temporary scratch files (e.g. `scratch/prototypes/variant_a.html`, `variant_b.html`, `variant_c.html`):

- **Variant A (e.g. Technical High-Density):** Compact padding, crisp hairline borders, high data density, tabular figures.
- **Variant B (e.g. Minimalist Editorial):** Spacious whitespace, strong typographic contrast, subdued hairline dividers.
- **Variant C (e.g. Modern Humanist):** Rounded cards (10-12px), warm neutral background, soft pill badges, friendly empty states.
- **Variant D / E (if applicable):** Split-pane preview layout, floating control docks, or high-contrast accent themes.

### Required Prototype Invariants (Skill: frontend-designer)
1. **Zero-Fluff Microcopy:**
   - Single or dual-word scannable headers (*"Payroll"*, *"Students"* — never conversational sentences).
   - Strict action-verb button syntax (*"Approve Statement"*, *"Export CSV"* — never *"Click here to proceed"*).
   - Zero AI cheerleading (*"Great job!"* or *"Oopsie daisy!"* are strictly forbidden).
2. **The 4 Invariant Screen States:**
   - Model the view across Loading (skeleton shimmer), Success (populated data), Empty (reassuring message + CTA), and Error (3-part plain language explanation).
3. **Realistic Formatted Data:**
   - Formatted currency (`$1,250.00` never `$1250`), formatted dates (`Oct 15, 2026` never raw ISO strings).
4. **Button & Touch Targets:**
   - Interactive targets minimum 44×44px hit areas on mobile viewports.

---

## 4. Render Previews & Capture Screenshots

Use `playwright-cli` to render full-page desktop screenshots of each variant into `.agent/state/artifacts/design/`:

```powershell
# Create artifacts directory if not present
New-Item -ItemType Directory -Force -Path ".agent/state/artifacts/design"

# Render each variant
playwright-cli open "file:///$PWD/scratch/prototypes/variant_a.html"
playwright-cli resize 1280 800
playwright-cli screenshot --filename=".agent/state/artifacts/design/variant_a.png"
playwright-cli close

playwright-cli open "file:///$PWD/scratch/prototypes/variant_b.html"
playwright-cli resize 1280 800
playwright-cli screenshot --filename=".agent/state/artifacts/design/variant_b.png"
playwright-cli close

playwright-cli open "file:///$PWD/scratch/prototypes/variant_c.html"
playwright-cli resize 1280 800
playwright-cli screenshot --filename=".agent/state/artifacts/design/variant_c.png"
playwright-cli close
```

---

## 5. Present Choices to User

Present the options clearly in chat with direct clickable links to the generated screenshot files:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► DESIGN VARIANTS FOR PHASE {N}: {Page Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please review the generated design variants:

1. **Variant A: Technical High-Density**
   • [View Screenshot](file:///path/to/.agent/state/artifacts/design/variant_a.png)
   • Features: Crisp 1px borders, high data density, monospace figures, compact headers.

2. **Variant B: Minimalist Editorial**
   • [View Screenshot](file:///path/to/.agent/state/artifacts/design/variant_b.png)
   • Features: Generous whitespace, elegant typography scale, subdued dividers.

3. **Variant C: Modern Humanist**
   • [View Screenshot](file:///path/to/.agent/state/artifacts/design/variant_c.png)
   • Features: Warm neutral palette, 10px rounded cards, pastel status badges.

Which design direction would you like to proceed with? (You can choose one directly or request a hybrid adjustment).
```

Use `ask_question` or wait for user response to capture their selection.

---

## 6. Lock Decision, Continuity & Automated Cleanup

Once the user selects the winning variant (e.g. Variant B):

1. **Update `.agent/rules/STYLE.md`**:
   - Write or update the shared style guidelines with the exact tokens (font families, colors, spacing units, border radii) selected.

2. **Update `.agent/state/DESIGN_STATE.md`**:
   - Record the chosen variant, rationale, and explicit continuity rules for future pages:
     ```markdown
     ## Phase {N}: {Page Name}
     - **Selected Variant:** Variant B (Minimalist Editorial)
     - **Key Visual Qualities to Inherit:** 8px card radius, Geist/Charter typography pairing, slate-50 background.
     - **Date:** {timestamp}
     ```

3. **Promote Winning Prototype to Presentational UI Shell:**
   - Promote the winning visual layout into the target feature component path (e.g. `apps/web/src/pages/{feature}/{Page}.tsx`).
   - Structure the component to accept clean, decoupled 4-state props:
     - `isLoading?: boolean` (renders duration-matched skeleton shimmer or inline spinner)
     - `isEmpty?: boolean` (renders reassuring empty state illustration with primary CTA)
     - `error?: Error | string | null` (renders 3-part plain language error alert)
     - `data?: T` (renders the populated data view)
     - Action handlers (e.g. `onApprove`, `onExport`, `onRetry`)
   - Keep the component visually complete with mock props so it compiles cleanly.
   - This UI Shell becomes the concrete visual foundation that `@plan.md` and `@execute.md` will wire to real API queries, mutations, and business logic without touching the approved styling.

4. **Execute Rigorous Cleanup**:
   - Keep the reference image of the winner: rename `.agent/state/artifacts/design/variant_b.png` to `.agent/state/artifacts/design/phase_{N}_approved.png`.
   - **Delete all unselected screenshots** (`variant_a.png`, `variant_c.png`, etc.).
   - **Delete the scratch prototype directory** (`scratch/prototypes/`).
   - Confirm repository working tree is clean.

---

## 7. Next Up

Output completion banner and hand off directly to `@plan.md`:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► DESIGN APPROVED FOR PHASE {N} ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Design tokens locked to .agent/rules/STYLE.md
Continuity logged to .agent/state/DESIGN_STATE.md
Scratch artifacts cleaned up.

───────────────────────────────────────────────────────

▶ Next Up

@plan.md {N} — Decompose phase tasks knowing exact visual specs and layout

───────────────────────────────────────────────────────
```

</process>

<related>
## Related

### Workflows
| Command | Relationship |
|---|---|
| `@discuss-phase.md` | Run before @design-phase to align on scope |
| `@research-phase.md` | Run before @design-phase for technical/schema discovery |
| `@plan.md` | Run immediately after @design-phase to plan tasks against approved design |
| `@ux-sweep.md` | Run after @execute to verify live implementation matches design |

### Skills
| Skill | Purpose |
|---|---|
| `frontend-designer` | Aesthetic research, anti-slop rules, variant generation |
| `playwright-cli` | Headless screenshot capture of prototypes |
| `verifier` | Deliverable verification |
</related>
