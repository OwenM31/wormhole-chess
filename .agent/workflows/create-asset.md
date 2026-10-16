---
description: Targeted asset creation workflow for UI icons, empty-state illustrations, app icons, and 2D game sprites with 5-variant contact sheet and sharpening loop
argument-hint: "<description> [--format svg|png] [--preset empty-state|app-icon|game-sprite|ui-icon] [--output <path>]"
---

# /create-asset Workflow

<role>
You are a precision digital asset designer and frontend graphics engineer. You create production-ready visual assets (clean vector SVGs and optimized raster PNGs) for user interfaces, empty states, application icons, and 2D games without introducing bloated graphic suites or placeholder slop.

Your job: Parse the asset requirements, ground styling in project design tokens, generate 5 distinct stylistic interpretations in temporary scratch space, render a unified 5-up preview contact sheet using `playwright-cli`, guide the user through a selection and sharpening loop, promote the winning asset to production, and immediately purge all scratch clutter.
</role>

<objective>
Provide a fast, highly targeted visual asset generation pipeline:
1. **5-Variant Contact Sheet**: Generate 5 distinct stylistic interpretations (Minimalist Line, Modern Duotone, Dimensional, Humanist, Bold Graphic) into temporary scratch space.
2. **Preview Rendering**: Render a 5-up visual contact sheet via `playwright-cli` showcasing all variants against transparent and contrast backgrounds.
3. **Selection & Sharpening Gate**: Allow the user to pick a winner directly, sharpen specific details (strokes, palette, dimensions, viewBox), or regenerate.
4. **Dual-Track Engine**:
   - *Vector Track (`.svg`)*: Agent-authored native vector code, theme-token aware (`.agent/rules/STYLE.md`), 0-byte external dependencies, infinitely scalable.
   - *Raster Track (`.png` / `.webp`)*: High-craft illustrations, textures, or sprites dispatched to the built-in `image-generator` subagent (or HTML5 Canvas rendering).
5. **Strict Repository Hygiene**: Promote only the selected asset to the target project directory and immediately purge all 4 discarded scratch variants and preview screenshots.
</objective>

<context>
- **Arguments:** `$ARGUMENTS` (asset description, format, preset, and output path)
- **Common Presets:**
  - `--preset empty-state`: Reassuring spot illustration for 0-data screens (default 240×240).
  - `--preset app-icon`: Favicon and app icon suite (`favicon.svg`, `icon-192.png`, `apple-touch-icon.png`).
  - `--preset game-sprite`: 2D transparent sprite at defined dimensions (e.g. 32×32, 64×64).
  - `--preset ui-icon`: 24×24 scalable SVG icon component using `currentColor` and clean bounding box.
- **Reference Files:**
  - `.agent/rules/STYLE.md` — Project color tokens, radii, typography, and theme invariants.
  - `.agent/state/DESIGN_STATE.md` — Visual continuity log from previous UI phases.
</context>

<process>

## 1. Parse Arguments & Context Ingestion

1. **Extract Parameters:**
   - **Description:** Core subject, metaphor, and visual intent (e.g. `"empty invoice clipboard"`, `"retro spaceship sprite"`, `"school crest favicon"`).
   - **Format:** `--format svg` (default for UI icons/illustrations) or `--format png` (for sprites/textured art).
   - **Preset:** `--preset empty-state | app-icon | game-sprite | ui-icon`.
   - **Output Path:** `--output <path>` (e.g. `apps/web/public/assets/empty-invoices.svg`). If omitted, derive sensible target:
     - Empty states: `public/assets/illustrations/<name>.<ext>` or `src/assets/<name>.<ext>`
     - UI icons: `src/components/icons/<Name>Icon.tsx` or `public/icons/<name>.svg`
     - App icons: `public/favicon.svg` and `public/icons/`
     - Game sprites: `public/assets/sprites/<name>.<ext>`

2. **Ingest Theme Tokens:**
   - Read `.agent/rules/STYLE.md` and `.agent/state/DESIGN_STATE.md` if available.
   - Extract primary accent color, muted background tints, stroke defaults, and corner radii so generated vector assets feel native to the host application.

---

## 2. Generate 5 Stylistic Interpretations

> [!IMPORTANT]
> **Skill Activation: frontend-designer**
> Apply `.agent/skills/frontend-designer/SKILL.md` craft invariants: zero visual slop, intentional geometry, no blurry SVG filters, semantic color mapping.

Create temporary workspace: `scratch/assets/`

Author 5 distinct stylistic variants in `scratch/assets/`:

| Variant | Style Archetype | Description & Characteristics |
|---|---|---|
| **Variant 1** | **Minimalist Line** | Ultra-clean mono-line geometry (1.5–2px stroke), un-filled or hairline accents, high restraint, modern tech aesthetic. |
| **Variant 2** | **Modern Duotone** | Primary brand stroke + soft 15–25% secondary opacity wash, subtle layering, standard for modern SaaS interfaces. |
| **Variant 3** | **Dimensional (Soft Elevation)** | Subtle vertical linear gradients, gentle ambient drop-shadow, layered depth, tactile surface feel. |
| **Variant 4** | **Humanist / Warm** | Gentle curves, organic roundness (`stroke-linecap="round"`, `stroke-linejoin="round"`), approachable friendly metaphor. |
| **Variant 5** | **Bold Graphic / Silhouette** | High-contrast solid fills, punchy silhouette, thick boundary contours, maximum legibility at small scale. |

### Track A: Vector Generation (`.svg`)
Generate 5 standalone SVG files (`variant_1.svg` through `variant_5.svg`):
- Explicit `viewBox` (e.g. `viewBox="0 0 240 240"` for empty states, `0 0 24 24` for UI icons).
- Semantic colors drawn directly from `STYLE.md` or `currentColor`.
- Clean SVG primitives (`<path>`, `<rect>`, `<circle>`, `<g>`) with zero unneeded metadata or bloated editor tags.

### Track B: Raster Generation (`.png`)
If generating raster assets or sprites:
- Invoke the built-in `image-generator` subagent with 5 tailored style briefs emphasizing transparent backgrounds, precise pixel framing, and the specific archetype.
- Alternatively, author an HTML5 Canvas script in `scratch/assets/render_variants.js` to render pixel-art or procedural graphics cleanly to PNG.

---

## 3. Render Previews & 5-Up Contact Sheet

> [!IMPORTANT]
> **Skill Activation: playwright-cli**
> Use `playwright-cli` to render an all-in-one preview contact sheet for visual inspection.

1. **Build Contact Sheet HTML (`scratch/assets/contact_sheet.html`):**
   - Create an HTML file containing a 5-column grid (or 2-row layout) showcasing all 5 variants side-by-side.
   - Include a checkerboard background toggle to confirm transparency.
   - Display variant labels, style archetype titles, and dimensions under each card.

2. **Render Contact Sheet Screenshot:**
   ```powershell
   # Ensure artifact directory exists
   New-Item -ItemType Directory -Force -Path ".agent/state/artifacts/assets"

   # Capture contact sheet preview
   playwright-cli open "file:///$PWD/scratch/assets/contact_sheet.html"
   playwright-cli resize 1440 900
   playwright-cli screenshot --filename=".agent/state/artifacts/assets/contact_sheet.png"
   playwright-cli close
   ```

---

## 4. User Selection & Sharpening Gate

Present the contact sheet clearly to the user in chat with clickable links:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► ASSET CANDIDATES: {Asset Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5 stylistic variants generated for: "{description}"
Preset: {preset} | Target Format: {format}

🖼️ [View 5-Up Contact Sheet](file:///path/to/.agent/state/artifacts/assets/contact_sheet.png)

Individual Variant Previews:
1. **Variant 1 (Minimalist Line)**: [variant_1.svg](file:///path/to/scratch/assets/variant_1.svg)
   • Crisp hairline strokes, geometric primitives, minimal visual weight.
2. **Variant 2 (Modern Duotone)**: [variant_2.svg](file:///path/to/scratch/assets/variant_2.svg)
   • Primary brand tint with 20% opacity wash, modern SaaS feel.
3. **Variant 3 (Dimensional)**: [variant_3.svg](file:///path/to/scratch/assets/variant_3.svg)
   • Soft ambient elevation, layered gradients, tactile depth.
4. **Variant 4 (Humanist)**: [variant_4.svg](file:///path/to/scratch/assets/variant_4.svg)
   • Rounded caps, warm approachable curves, organic metaphor.
5. **Variant 5 (Bold Graphic)**: [variant_5.svg](file:///path/to/scratch/assets/variant_5.svg)
   • High-contrast silhouette, heavy fills, strong small-screen legibility.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
How would you like to proceed?
• **Pick a winner directly** (e.g. "Select Variant 2")
• **Sharpen a variant** (e.g. "Sharpen Variant 2: lighten the accent fill, increase stroke to 2px")
• **Regenerate** (e.g. "Regenerate with a different metaphor: use an open book instead of a clipboard")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use `ask_question` or await the user's explicit direction.

---

## 5. The Sharpening Loop (Refinement)

If the user requests adjustments or sharpening on any variant:
1. Apply the user's specific tweaks directly to the variant file in `scratch/assets/` (e.g. adjusting stroke weights, tuning color hex codes to match `STYLE.md`, modifying curvature, or resizing viewbox).
2. Re-render the contact sheet preview via `playwright-cli`.
3. Present the refined preview back to the user until complete satisfaction is achieved.

---

## 6. Promote Winner & Execute Repository Hygiene

Once the user approves the winning variant (e.g. Variant 2):

1. **Promote to Destination:**
   - Copy the winning file from `scratch/assets/variant_{N}.{ext}` to the final target `--output <path>`.
   - Ensure target directory exists (`New-Item -ItemType Directory -Force`).
   - If `--preset app-icon` and format is SVG, generate required platform derivations (`favicon.ico`, `icon-192.png`, `apple-touch-icon.png`) using `playwright-cli` resize/screenshot if requested.

2. **Purge All Scratch Clutter:**
   - Delete the entire temporary directory `scratch/assets/`.
   - Delete the temporary contact sheet screenshot `.agent/state/artifacts/assets/contact_sheet.png`.
   - Optionally save a single record of the approved asset in `.agent/state/artifacts/assets/approved_{name}.png`.
   - Verify `git status` reflects ONLY the intended promoted asset file.

---

## 7. Next Up

Output the completion summary and suggest next logical workflows:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► ASSET PROMOTED TO PRODUCTION ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Asset: {output_path}
Format: {format} ({dimensions}, {file_size})
Preset: {preset}
Stylistic Archetype: Variant {N} ({Archetype Title})
Scratch files purged cleanly.

───────────────────────────────────────────────────────

▶ Next Up

• If building UI view: @design-phase.md or @plan.md to wire asset into presentational component
• If resolving sweep defect: @execute.md or @verify.md to confirm defect resolution

───────────────────────────────────────────────────────
```

</process>

<related>
## Related

### Workflows
| Command | Relationship |
|---|---|
| `@design-phase.md` | Call @create-asset to generate missing empty-state illustrations or custom icons during design |
| `@ux-sweep.md` | Call @create-asset during defect remediation when missing assets or broken favicons are flagged |
| `@execute.md` | Execute implementation tasks referencing the newly generated asset |
| `@help.md` | Command reference index |

### Skills
| Skill | Purpose |
|---|---|
| `frontend-designer` | Design token ingestion, aesthetic heuristics, zero-slop craft |
| `playwright-cli` | Headless browser rendering of 5-up contact sheet and icon derivations |
| `verifier` | Deliverable verification and hygiene checks |
</related>
