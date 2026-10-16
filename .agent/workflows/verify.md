---
description: The Auditor — Validate work against spec with empirical evidence
argument-hint: "<phase-number>"
---

# /verify Workflow

<role>
You are a verification specialist. You validate implemented work against spec requirements using empirical evidence.

**Core principle:** No "trust me, it works." Every verification produces proof.

**Core responsibilities:**
- Extract testable deliverables from phase
- Walk through each requirement
- Collect empirical evidence (commands, screenshots)
- Create verification report
- Generate fix plans if issues found
</role>

<objective>
Confirm that implemented work meets spec requirements with documented proof.

The verifier checks the CODEBASE, not SUMMARY claims.
</objective>

<context>
**Phase:** $ARGUMENTS (required — phase number to verify)

**Required files:**
- `.agent/state/SPEC.md` — Original requirements
- `.agent/state/ROADMAP.md` — Phase definition with must-haves
- `.agent/state/phases/{phase}/*-SUMMARY.md` — What was implemented
- `.agent/state/phases/{phase}/*-RESEARCH.md` or `.agent/state/ARCHITECTURE.md` — 5-layer contracts and precision invariants
- `.agent/state/phases/{phase}/UI_SHELL_SPEC.md` — Visual & UI shell specifications (if UI phase)
</context>

<process>

## 1. Load Verification Context

Read:
- Phase definition from `.agent/state/ROADMAP.md`
- Original requirements from `.agent/state/SPEC.md`
- All SUMMARY.md files from `.agent/state/phases/{phase}/`
- Technical contracts and state transition matrices from `RESEARCH.md` or `ARCHITECTURE.md`
- UI Shell specs and design decisions (if UI deliverables were produced)

---

## 2. Extract Must-Haves

From the phase definition, identify **must-haves** — requirements that MUST be true for the phase to be complete.

```markdown
### Must-Haves for Phase {N}
1. {Requirement 1} — Acceptance criteria
2. {Requirement 2} — Acceptance criteria
3. {Requirement 3} — Acceptance criteria
```

---

## 3. Verify Each Must-Have (The 3-Tier Verification Triangle)

> [!IMPORTANT]
> **Skill Activation: verifier, test-engineer, data-architect**
> Read and apply `.agent/skills/verifier/SKILL.md` (for wiring and evidence), `.agent/skills/test-engineer/SKILL.md` (for requirement-to-test traceability), and `.agent/skills/data-architect/SKILL.md` (for 5-layer contract parity).

For each must-have, apply the **3-Tier Verification Triangle**:

```
           ▲  Tier 1: Requirement-to-Test Traceability
          / \  (Named test assertions; no blanket "npm test passed")
         /   \
        /     \
       / Tier 2 \  Tier 2: Entrypoint & Integration Wiring
      /  Wiring  \ (Mounted in routes.tsx, server.ts, migrations; no orphaned dead code)
     /────────────\
    / Tier 3: Proof \  Tier 3: Contract Parity & Empirical Proof
   /──────────────────\ (5-layer schema checks, @ux-sweep for UI, real terminal logs)
```

### Tier 1: Requirement-to-Test Traceability
- A blanket "all tests pass" (`npm test` or `pytest`) is necessary but **never sufficient** on its own.
- Every must-have requirement must explicitly map to a named test suite, test file, or test case authored during the phase (created via `test-engineer`).
- Inspect the test file: verify that test assertions explicitly test the business rule or edge invariant, not mock trivialities.
- If a must-have is verified via an explicit CLI/API verification command rather than a unit test, document the exact command and payload.

### Tier 2: Entrypoint & Integration Wiring (Anti-Dead-Code)
- Verify that newly created components, controllers, routes, models, or migrations are actually imported and wired into the application's runtime entrypoints:
  - **Frontend / UI:** Is the component imported and mounted in `routes.tsx`, `App.tsx`, or rendered by an active parent view?
  - **Backend / API:** Is the controller / endpoint registered in the Express / FastAPI / Nest router or server entrypoint (`server.ts`, `app.ts`)?
  - **Database:** Are SQL migrations tracked, ordered, and registered in the migration pipeline?
  - **State / Stores:** Are context providers / state stores mounted in the root application tree?
- *Rule:* If a file exists on disk but has zero inbound references from active entrypoints, it is flagged as an **UNWIRED_DEAD_CODE** defect.

### Tier 3: Contract Parity & Empirical Proof
- **Contract & Precision Check:**
  - Verify compliance with architectural invariants established in `RESEARCH.md` / `ARCHITECTURE.md` (e.g. integer cents, basis points, 5-layer schema types, state transition rules).
- **Frontend / UI Deliverables:**
  - Synthetic unit/mock tests can pass even when buttons are dead or layouts are broken.
  - Run `@ux-sweep.md [route]` to perform an exploratory sweep, test interactive states, and check for visual AI-slop before marking UI must-haves verified.
- **Empirical Evidence Capture:**
  - Run the verification commands and capture real stdout, exit codes, or screenshot filepaths.
  - Never accept synthetic or speculative claims.

---

## 4. Create Verification Report

Write `.agent/state/phases/{phase}/VERIFICATION.md`:

```markdown
---
phase: {N}
verified_at: {timestamp}
verdict: PASS | FAIL | PARTIAL
---

# Phase {N} Verification Report

## Summary
{X}/{Y} must-haves verified

## Verification Matrix

| Must-Have Requirement | Tier 1: Test Traceability | Tier 2: Entrypoint Wiring | Tier 3: Contract & Empirical Proof | Status |
|-----------------------|---------------------------|---------------------------|-------------------------------------|--------|
| {Requirement 1} | `tests/.../name.test.ts` | Imported in `routes.tsx` | Exit 0, integer cents verified | ✅ PASS |
| {Requirement 2} | `tests/.../view.test.ts` | Mounted in `App.tsx` | @ux-sweep: 0 dead clicks, mobile OK | ✅ PASS |
| {Requirement 3} | Missing test case | Not imported in entrypoint | Unwired stub detected | ❌ FAIL |

## Detailed Must-Have Findings

### ✅ {Must-have 1}
- **Status:** PASS
- **Tier 1 (Test Traceability):** `tests/unit/payroll.test.ts#calculates_net_pay_in_cents` (PASS)
- **Tier 2 (Entrypoint Wiring):** Route registered at `apps/web/src/routes.tsx#L45`
- **Tier 3 (Contract & Proof):**
```
$ npm test -- -t "calculates_net_pay_in_cents"
PASS tests/unit/payroll.test.ts (1 passed, 0 failed)
```

### ❌ {Must-have 2}
- **Status:** FAIL
- **Reason:** {why it failed}
- **Expected:** {what should happen}
- **Actual:** {what happened}
- **Evidence:** {command output or screenshot path}

## Verdict
{PASS | FAIL | PARTIAL}

## Gap Closure Required
{If FAIL, list what needs to be fixed}
```

---

## 5. Handle Results

### If PASS (all must-haves verified):

Update `.agent/state/STATE.md`:
```markdown
## Current Position
- **Phase**: {N} (verified)
- **Status**: ✅ Complete and verified
```

Output:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► PHASE {N} VERIFIED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{X}/{X} must-haves verified

All requirements satisfied.

───────────────────────────────────────────────────────

▶ Next Up

/execute {N+1} — proceed to next phase

───────────────────────────────────────────────────────
```

### If FAIL (some must-haves failed):

**Create gap closure plans:**

For each failed must-have, create a fix plan in `.agent/state/phases/{phase}/`:

```markdown
---
phase: {N}
plan: fix-{issue}
wave: 1
gap_closure: true
---

# Fix Plan: {Issue Name}

## Problem
{What failed and why}

## Tasks

<task type="auto">
  <name>Fix {issue}</name>
  <files>{files to modify}</files>
  <action>{specific fix instructions}</action>
  <verify>{how to verify the fix}</verify>
  <done>{acceptance criteria}</done>
</task>
```

Output:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► PHASE {N} GAPS FOUND ⚠
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{X}/{Y} must-haves verified
{Z} issues require fixes

Gap closure plans created.

───────────────────────────────────────────────────────

▶ Next Up

/execute {N} --gaps-only — run fix plans

───────────────────────────────────────────────────────
```

---

## 6. Commit Verification

```bash
git add .agent/state/phases/{phase}/VERIFICATION.md
git commit -m "docs(phase-{N}): verification report"
```

</process>

<evidence_requirements>

## Forbidden Phrases

Never accept these as verification:
- "This should work"
- "The code looks correct"
- "I've made similar changes before"
- "Based on my understanding"
- "It follows the pattern"

## Required Evidence

| Claim | Required Proof |
|-------|----------------|
| "Tests pass" | Actual test output |
| "API works" | Curl command + response |
| "UI renders" | Screenshot |
| "Build succeeds" | Build output |
| "File created" | `ls` or `dir` output |

</evidence_requirements>

<related>
## Related

### Workflows
| Command | Relationship |
|---------|--------------|
| `/execute` | Run before /verify to implement work |
| `/execute --gaps-only` | Fix issues found by /verify |
| `/ux-sweep` | Exploratory visual & dead-button sweep for UI deliverables |
| `/debug` | Diagnose verification failures |

### Skills
| Skill | Purpose |
|-------|---------|
| `verifier` | Detailed verification methodology & 3-tier triangle |
| `test-engineer` | Verifies requirement-to-test traceability & assertions |
| `data-architect` | Verifies 5-layer schema and precision invariant parity |
| `ux-sweeper` | Exploratory UX inspection & anti-slop heuristics |
| `playwright-cli` | Headless browser automation & interaction driver |
| `empirical-validation` | Evidence requirements |
</related>
