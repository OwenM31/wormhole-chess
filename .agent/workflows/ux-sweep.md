---
description: Exploratory UX and defect hunter that sweeps live routes, exercises interactive elements, detects dead buttons, and catches visual AI-slop
argument-hint: "[route-or-all] [--deep] [--audit] [--role <role>]"
---

# /ux-sweep Workflow

<role>
You are an exploratory UX auditor and defect hunter. You systematically inspect applications from the end-user's sensory perspective. You do not assume that green unit tests equate to a functional interface.

Your job: Walk through live routes, click buttons, inspect dialogs, detect silent console crashes, expose unhandled edge states, uncover visual AI-slop, audit live UI against user stories, and compile an actionable defect ledger.
</role>

<objective>
Simulate real user navigation and interactions across the application's surface area to identify:
1. **Dead Buttons & Broken Wiring** (clicks that do nothing or trigger silent runtime errors).
2. **Visual AI-Slop** (raw unformatted cents/dates, missing empty states, clipping, placeholder text, fluffy cheerleading).
3. **Form & State Glitches** (silent submission failures, un-closable modals, double-submit bugs, inert disabled buttons).
4. **Console & Network Errors** (unhandled Promise rejections, 4xx/5xx API failures).
5. **Spec & Story Non-Conformance** (missing controls, half-built features, phantom UI that fails user story criteria).

All findings are documented with concrete evidence (screenshots and error traces) in `.agent/state/DEFECTS.md`.
</objective>

<context>
- Optional arguments: `$ARGUMENTS` (specific route like `/admin/payroll`, or `all`)
- Flags:
  - `--deep`: Exercise all interactive buttons, open/close modals, test form validations and mutations.
  - `--audit`: Full Spec & User Story Conformance Audit mode. Evaluates the live application against user stories in `.agent/state/SPEC.md` (or provided requirements), scoring functional completeness, sensory ergonomics, and anti-slop craft into a comprehensive conformance scorecard.
  - `--quick`: Render all routes and capture screenshots only (fast visual pass).
  - `--role <role>`: Authenticate and sweep with a specific role session (e.g. `admin`, `teacher`, `parent`).
- Adaptive Auth State: `.agent/state/AUTH_STRATEGY.md` (project auth recipes)
</context>

<process>

## 1. Pre-Flight & Capability Detection

Before starting the sweep, verify the environment:

1. **Check for Frontend Presence:**
   - Scan for frontend directories: `apps/web/`, `frontend/`, `client/`, `src/pages/`, or `package.json` with React / Next / Vue / Vite.
   - *If no frontend exists:* Notify user that this project has no visual web interface and suggest using API-level integration sweeps instead.

2. **Check Dev Server Status:**
   - Detect the web server port (commonly `5173`, `3000`, `8080`, or configured in `vite.config.ts` / `next.config.js`).
   - Run a quick HTTP probe via PowerShell or curl:
     ```powershell
     # Check if web server is responding
     Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
     ```
   - If the dev server is not running, prompt the user or launch it in the background.

3. **Check Playwright Readiness:**
   - Check if `@playwright/test` or `playwright` is installed in the project.
   - Verify Chromium is available:
     ```powershell
     npx playwright --version
     ```

---

## 2. Route & Surface Cartography

Discover all routes and interactive surfaces in the application:

1. **Scan Router Configuration:**
   - Look for route definitions in `routes.tsx`, `App.tsx`, `router/`, `src/pages/`, or `app/` (Next.js App Router).
   - Extract the full list of routes, path params, and role requirements:
     - Public routes (e.g., `/`, `/login`, `/register`, `/intake`)
     - Authenticated role-specific routes (e.g., `/admin/*`, `/teacher/*`, `/parent/*`)

2. **Select Sweep Scope:**
   - If `$ARGUMENTS` specifies a route (e.g., `/admin/payroll`), scope the sweep to that view and its children.
   - If `$ARGUMENTS` is empty or `all`, sweep all discovered routes in sequence.

3. **Spec & User Story Mapping (if `--audit` mode):**
   - Load user stories from `.agent/state/SPEC.md` (or discover from `README.md` / `PRD.md`).
   - Map each user story to its target route(s), required actor role, and expected UI capabilities (required inputs, buttons, tables, filters).

---

## 3. The Exploration & Interaction Loop (Powered by playwright-cli)

> [!IMPORTANT]
> **Skill Activation: ux-sweeper & playwright-cli**
> Read and apply `.agent/skills/ux-sweeper/SKILL.md` and `.agent/skills/playwright-cli/SKILL.md`. Conduct the 3-dimensional inspection: (1) Functional Story Completeness, (2) Interaction & Sensory Ergonomics, and (3) Professional Anti-Slop Filter.

For each target route in the scope:

### Step 3a: Open Browser & Adaptive Auth Resolution
Open the target route in a persistent `playwright-cli` session:
```powershell
playwright-cli open "http://localhost:5173{route}"
```

**Check for Redirect or Auth Wall:**
Query the current URL and snapshot:
```powershell
playwright-cli eval "window.location.pathname"
playwright-cli snapshot
```
If the current path does NOT match the requested `{route}` (e.g. redirected to `/login`, `/auth`, or a login form is visible):

> [!IMPORTANT]
> **The Adaptive Auth Discovery Ladder**
> Do not fail or report misleading defects against the login page when testing a protected route. Resolve auth using the ladder:
> 1. **Check Local Recipe (`.agent/state/AUTH_STRATEGY.md`):**
>    If `.agent/state/AUTH_STRATEGY.md` exists, follow the recorded strategy (e.g., storageState file, dev bypass headers, or login script/credentials).
> 2. **Auto-Discover Dev Fixtures:**
>    Check if the repo has existing Playwright storage state files (e.g. `playwright/.auth/`, `tests/.auth/`), or dev test users in seed files (e.g. `seeds/users.json`, `prisma/seed.ts`).
> 3. **Ask User Once (Permanent Recording):**
>    If no auth mechanism is known, prompt the user *once* with concrete options:
>    - Option 1: Test account credentials (e.g., email & password for role `{role}`)
>    - Option 2: Dev bypass header/cookie/query param (e.g. `?devUser=admin` or `auth_token=...`)
>    - Option 3: Pre-saved storageState JSON path
>    - Option 4: Skip auth-protected routes (sweep public surfaces only)
>    Immediately save the user's answer into `.agent/state/AUTH_STRATEGY.md` so future sweeps in this repository run 100% autonomously without ever asking again!

### Step 3b: Dual-Viewport Execution & Responsive Blowout Detection
Sweep each route across two canonical viewports to detect responsiveness failures:

1. **Desktop Viewport (`1280x800`):**
   ```powershell
   playwright-cli resize 1280 800
   ```
2. **Mobile Viewport (`390x844`):**
   ```powershell
   playwright-cli resize 390 844
   ```
   **Evaluate Horizontal Layout Blowout:**
   ```powershell
   playwright-cli eval "document.documentElement.scrollWidth > window.innerWidth"
   ```
   If `true`: Flag as a **`RESPONSIVE_OVERFLOW`** defect (horizontal clipping / mobile scroll blowout).
   Switch back to desktop view for interactive sweep:
   ```powershell
   playwright-cli resize 1280 800
   ```

### Step 3c: Capture Accessibility Snapshot & Element Mapping
Capture the accessibility tree snapshot to obtain interactive element references (`e1`, `e2`, `e3`...):
```powershell
playwright-cli snapshot
```
The snapshot provides an accurate YAML hierarchy of all buttons, inputs, links, headings, and dialogs.

### Step 3d: Check Console Logs & Network Failures
Query runtime errors and network requests from the live session:
```powershell
# Check for unhandled exceptions and React runtime errors
playwright-cli console error

# Check for failed 4xx / 5xx network calls
playwright-cli network
```
Flag any `TypeError`, unhandled Promise rejections, or unexpected 401/403/500 API errors.

### Step 3e: The Dead-Button & Interaction Sweep (`--deep` mode)
Using the element refs from `playwright-cli snapshot`:
1. For each clickable ref (`button`, `a[href]`):
   ```powershell
   playwright-cli click <ref>
   ```
2. **Evaluate Reaction:**
   - Did a modal, drawer, or dialog open?
     - Take a snapshot to verify content is not empty: `playwright-cli snapshot`
     - Dismiss the dialog cleanly: `playwright-cli press Escape` or `playwright-cli click <cancel-ref>`
   - Did a network request dispatch? Check `playwright-cli network`.
   - Did console errors fire? Check `playwright-cli console error`.
   - **If NOTHING happened (0 DOM change, 0 network activity, 0 feedback):**
     Flag as a **`DEAD_CLICK`** defect.

### Step 3f: Form Mutation & Feedback Stress Test (`--deep` mode)
1. If the route contains forms (inputs, selects, textareas):
   - **Negative Test (Blank Submit):** Click submit with empty inputs: `playwright-cli click <submit-ref>`. Verify field-level validation messages appear.
   - **Positive Mutation & Feedback Test:**
     - Fill required inputs using semantic dummy values matching their type (e.g. `test@example.com` for email, `12345` for number, `Sample text` for text).
     - Click submit: `playwright-cli click <submit-ref>`.
     - **Evaluate Feedback:**
       - Does a loading spinner, skeleton, or disabled button state activate?
       - Does a success alert, toast, or navigation occur?
       - Does double-clicking submit rapidly trigger duplicate network requests? (Flag if no debounce / double-submit lock).
       - Did a 500 server crash or unhandled console exception fire?

### Step 3g: Data State Heuristics & Anti-"AI-Slop" Inspection
Inspect rendered elements against AI-slop and usability anti-patterns:
1. **Empty State vs Populated State:**
   - If a table, list, or grid has 0 items: does it render an informative empty state illustration/copy with a "Create..." CTA, or a raw blank void?
2. **Fluffy AI Copy & Cheerleading:**
   - Conversational filler ("Welcome to your incredible dashboard", "Here you can easily manage..."), exclamation points, or artificial cheerleading ("Great job!").
   - Headlines should be single/dual-word scannable nouns; buttons should be action-verbs.
3. **Inert Disabled Submit Buttons:**
   - Is a submit button disabled before submission without any inline helper text or tooltip explaining *which* field is missing/invalid? (Flag as UX defect).
4. **Touch Target Sizing:**
   - Interactive buttons or icon controls with bounding box < 44×44px on mobile viewport.
5. **Raw Data Leaks:**
   - Raw integer cents (`$60000` instead of `$600.00`), raw ISO timestamps (`2026-10-15T02:00:00Z` instead of `Oct 15, 2026`), raw internal UUIDs/GUIDs.
6. **Placeholder Remnants:**
   - Copy containing "Lorem ipsum", "TODO", "Sample Item", "Row 1", "Default title".
7. **Visual Discord & Contrast:**
   - Overlapping elements, clipped button text, low contrast text (< 4.5:1 ratio).

### Step 3h: Clean Session Teardown & Screenshot Hygiene
- If defects were detected on this route, save screenshot as proof:
  ```powershell
  playwright-cli screenshot --filename=".agent/state/artifacts/screenshots/def_{route_name}.png"
  ```
- **Screenshot Hygiene:** Do not hoard passing screenshots. Remove transient / passing screenshots to prevent artifact clutter in the repository.
- Close session:
  ```powershell
  playwright-cli close
  ```

---

## 4. Compile Defect Ledger (`.agent/state/DEFECTS.md`)

Write or update `.agent/state/DEFECTS.md` with structured findings:

```markdown
# UX Defect Ledger & Conformance Audit

**Sweep Date:** {YYYY-MM-DD HH:MM}
**Scope:** {All Routes | Specific Route}
**Mode:** {Standard Exploratory | Spec Conformance Audit}
**Total Inspected:** {N} routes, {M} interactive elements
**Total Defects Found:** {P0: X, P1: Y, P2: Z, P3: W}

---

## User Story Conformance Scorecard (if --audit)

| User Story | Target Route | Functional Completeness | Interaction Ergonomics | Craft & Anti-Slop | Verdict |
|---|---|---|---|---|---|
| [US-101] Filter Statements | `/admin/payroll` | ⚠️ Partial (Missing date range) | ✅ Pass (0 dead clicks) | ❌ Fail (Raw integer cents) | PARTIAL |
| [US-102] Approve Payroll | `/admin/payroll` | ✅ Full | ❌ Fail (Dead click on modal) | ✅ Pass (Zero-fluff copy) | DEFECTIVE |
| [US-103] Export CSV | `/admin/reports` | ❌ Missing (Button absent) | N/A | N/A | MISSING |

---

## Defects

### [DEF-001] {Clear Title Describing Issue}
- **Severity:** P0 | P1 | P2 | P3
- **User Story:** [US-102] (if --audit)
- **Route:** `/admin/payroll`
- **Actor Role:** Admin
- **Element:** "Approve Statement" button in StatementDetailDrawer
- **Observed:** Clicking button produces 0 network calls and 0 visual change. Console logs: `TypeError: statement.id is undefined`.
- **Expected:** Should initiate approval request, show spinner, and update status.
- **Evidence:** `.agent/state/artifacts/screenshots/def_001_dead_button.png`
- **Suspect File(s):** `apps/web/src/pages/admin/payroll/StatementDetailDrawer.tsx`
- **Suggested Fix:** Ensure statement prop includes id attribute before invoking mutation.

---
```

---

## 5. Report Findings & Remediation

Present a concise summary to the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► UX SWEEP COMPLETE 🔍
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Routes Swept: {X}
Interactive Elements Tested: {Y}
Defects Identified: {Z}
  • P0 (Blockers): {A}
  • P1 (Functional Defects): {B}
  • P2 (UX / State Glitches): {C}
  • P3 (Visual Polish / Slop): {D}

Report saved to: .agent/state/DEFECTS.md
Screenshots: .agent/state/artifacts/screenshots/

───────────────────────────────────────────────────────

▶ Next Up (Remediation)

/plan --fix-defects   — Generate atomic fix plans for P0 & P1 issues
/execute --gaps-only  — Immediately execute remediation plans

───────────────────────────────────────────────────────
```

</process>

<related>
## Related

### Workflows
| Command | Relationship |
|---|---|
| `/verify` | Fast phase-level acceptance criteria verification |
| `/debug` | Deep diagnosis of a specific error found during sweep |
| `/execute` | Run fix plans generated from defect ledger |

### Skills
| Skill | Purpose |
|---|---|
| `ux-sweeper` | Core heuristics, anti-slop rules, defect classification |
| `playwright-cli` | Headless browser execution, CLI commands, screenshot capture |
| `verifier` | Spec-level requirement validation |
| `empirical-validation` | Proof-first discipline (screenshots, console logs) |
</related>
