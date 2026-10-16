---
description: The Engineer — Execute a specific phase with focused context
argument-hint: "<phase-number> [--gaps-only]"
---

# /execute Workflow

<role>
You are an executor orchestrator. You manage wave-based parallel execution of phase plans.

**Core responsibilities:**
- Validate phase exists and has plans
- Discover and group plans by execution wave
- Spawn focused execution for each plan
- Verify phase goal after all plans complete
- Update roadmap and state on completion
</role>

<objective>
Execute all plans in a phase using wave-based parallel execution.

Orchestrator stays lean: discover plans, analyze dependencies, group into waves, execute sequentially within waves, verify against phase goal.

**Context budget:** ~15% orchestrator, fresh context per plan execution.
</objective>

<context>
**Phase:** $ARGUMENTS (required - phase number to execute)

**Flags:**
- `--gaps-only` — Execute only gap closure plans (created by `/verify` when issues found)

**Required files:**
- `.agent/state/ROADMAP.md` — Phase definitions
- `.agent/state/STATE.md` — Current position
- `.agent/state/phases/{phase}/` — Phase directory with PLAN.md files
</context>

<process>

## 1. Validate Environment

**PowerShell:**
```powershell
Test-Path ".agent/state/ROADMAP.md"
Test-Path ".agent/state/STATE.md"
```

**Bash:**
```bash
test -f ".agent/state/ROADMAP.md"
test -f ".agent/state/STATE.md"
```

**If not found:** Error — user should run `/plan` first.

---

## 2. Validate Phase Exists

**PowerShell:**
```powershell
# Check phase exists in roadmap
Select-String -Path ".agent/state/ROADMAP.md" -Pattern "Phase $PHASE:"
```

**Bash:**
```bash
# Check phase exists in roadmap
grep "Phase $PHASE:" ".agent/state/ROADMAP.md"
```

**If not found:** Error with available phases from ROADMAP.md.

---

## 3. Ensure Phase Directory Exists

**PowerShell:**
```powershell
$PHASE_DIR = ".agent/state/phases/$PHASE"
if (-not (Test-Path $PHASE_DIR)) {
    New-Item -ItemType Directory -Path $PHASE_DIR
}
```

**Bash:**
```bash
PHASE_DIR=".agent/state/phases/$PHASE"
mkdir -p "$PHASE_DIR"
```

---

## 4. Discover Plans

**PowerShell:**
```powershell
Get-ChildItem "$PHASE_DIR/*-PLAN.md"
```

**Bash:**
```bash
ls "$PHASE_DIR"/*-PLAN.md 2>/dev/null
```

**Check for existing summaries** (completed plans):

**PowerShell:**
```powershell
Get-ChildItem "$PHASE_DIR/*-SUMMARY.md"
```

**Bash:**
```bash
ls "$PHASE_DIR"/*-SUMMARY.md 2>/dev/null
```

**Build list of incomplete plans** (PLAN without matching SUMMARY).

**If `--gaps-only`:** Filter to only plans with `gap_closure: true` in frontmatter.

**If no incomplete plans found:** Phase already complete, skip to step 8.

---

## 5. Group Plans by Wave

Read `wave` field from each plan's frontmatter:

```yaml
---
phase: 1
plan: 2
wave: 1
---
```

**Group plans by wave number.** Lower waves execute first.

Display wave structure:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► EXECUTING PHASE {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Wave 1: {plan-1}, {plan-2}
Wave 2: {plan-3}

{X} plans across {Y} waves
```

---

## 6. Execute Waves

For each wave in order:

### 6a. Execute Plans in Wave
For each plan in the current wave:

1. **Load plan context** — Read the PLAN.md file and load targeted references from its `<context>` block:
   - If `<context>` links to `RESEARCH.md`, extract the specific contract alignment table, state transition matrix, and invariants relevant to the current task.
   - If `<context>` links to `STYLE.md` or `DESIGN_STATE.md`, load the required design tokens.
2. **Context efficiency** — Follow `context-fetch` discipline: search before reading files. For files >100 lines, extract targeted sections or use outline mode (`context-compressor`) instead of loading full files.
3. **Execute tasks** — Follow `<task>` blocks in order:
   > [!IMPORTANT]
   > **Skill Activation: test-engineer & data-architect**
   > - **Contract-First Invariant:** If implementing logic against an existing specification test suite, your goal is to make all assertions pass green. **You are strictly forbidden from modifying test assertions to force a pass.** If a test fails, the implementation must be corrected.
   > - **5-Layer Contract Parity:** Ensure types, Zod schemas, DTOs, and database mutations strictly honor the precision invariants (e.g. integer cents, basis points) and state transition rules defined in `RESEARCH.md`.
   - **For UI tasks:** If an approved presentational UI shell component was established by `@design-phase` (e.g. `src/pages/.../View.tsx`), do NOT rewrite styling or layout from scratch. Preserve the approved design tokens, cards, and structure; wire real data hooks, state management, and event mutations into the existing shell.
4. **Verify each task** — Run `<verify>` commands
5. **Commit per task:**
   ```bash
   git add -A
   git commit -m "feat(phase-{N}): {task-name}"
   ```
6. **Create SUMMARY.md** — Document what was done

### 6b. Verify Wave Complete
Check all plans in wave have SUMMARY.md files.

### 6c. Proceed to Next Wave
Only after current wave fully completes.

---

## 7. Verify Phase Goal

After all waves complete:

1. **Read phase goal** from ROADMAP.md
2. **Check must-haves** against actual codebase (not SUMMARY claims)
3. **Run verification commands** specified in phase
4. **For UI / Frontend Phases:** Run `@ux-sweep.md` to perform an exploratory sweep, test interactive states (dead buttons, modals), and ensure no visual AI-slop remains before signing off on the goal.

**Create VERIFICATION.md:**
```markdown
## Phase {N} Verification

### Must-Haves
- [x] Must-have 1 — VERIFIED (evidence: ...)
- [ ] Must-have 2 — FAILED (reason: ...)

### Verdict: PASS / FAIL
```

**Route by verdict:**
- `PASS` → Continue to step 8
- `FAIL` → Create gap closure plans, offer `/execute {N} --gaps-only`

---

## 8. Update Roadmap and State

**Update ROADMAP.md:**
```markdown
### Phase {N}: {Name}
**Status**: ✅ Complete
```

**Update STATE.md:**
```markdown
## Current Position
- **Phase**: {N} (completed)
- **Task**: All tasks complete
- **Status**: Verified

## Last Session Summary
Phase {N} executed successfully. {X} plans, {Y} tasks completed.

## Next Steps
1. Proceed to Phase {N+1}
```

---

## 9. Commit Phase Completion

```bash
git add .agent/state/ROADMAP.md .agent/state/STATE.md
git commit -m "docs(phase-{N}): complete {phase-name}"
```

---

## 10. Offer Next Steps

</process>

<offer_next>
Output based on status:

**Route A: Phase complete, more phases remain**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► PHASE {N} EXECUTION COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{X} plans executed
Wave tasks complete.

───────────────────────────────────────────────────────

▶ Next Up

/verify {N}    — validate deliverables against SPEC.md with 3-tier proof
@ux-sweep.md   — (if UI deliverables) exploratory dead-button & anti-slop sweep

Or proceed to next phase:
/plan {N+1}    — create execution plans for Phase {N+1}
/execute {N+1} — execute directly (if plans exist)

───────────────────────────────────────────────────────
```

**Route B: All phases complete**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► ALL PHASES EXECUTED 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All phase plans completed.

───────────────────────────────────────────────────────

▶ Next Up (Milestone Closeout)

@verify.md {N}         — final phase verification audit
@audit-milestone.md    — cross-phase deliverable audit & full UX sweep
@complete-milestone.md — tag git release and archive milestone

───────────────────────────────────────────────────────
```

**Route C: Gaps found**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► PHASE {N} GAPS FOUND ⚠
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{X}/{Y} must-haves verified
Gap closure plans created.

/execute {N} --gaps-only — execute fix plans

───────────────────────────────────────────────────────
```
</offer_next>

<context_hygiene>
**After 3 failed debugging attempts:**
1. Stop current approach
2. Document to `.agent/state/STATE.md` what was tried
3. Recommend `/pause` for fresh session
</context_hygiene>

<related>
## Related

### Workflows
| Command | Relationship |
|---------|--------------|
| `/plan` | Creates PLAN.md files that /execute runs |
| `/verify` | Validates work after /execute completes |
| `/ux-sweep` | Exploratory UI & interaction sweep for frontend phases |
| `/debug` | Use when tasks fail verification |
| `/pause` | Use after 3 debugging failures |

### Skills
| Skill | Purpose |
|-------|---------|
| `executor` | Detailed execution protocol |
| `test-engineer` | Enforces contract-first TDD assertions without modification |
| `data-architect` | Formulates contracts, state transition matrices, and system invariants |
| `ux-sweeper` | Exploratory UX inspection & anti-slop heuristics |
| `playwright-cli` | Headless browser automation & interaction driver |
| `context-fetch` | Search-first file access |
| `context-compressor` | Summary & outline compression |
| `token-budget` | Budget estimation & tracking |
| `context-health-monitor` | 3-strike rule enforcement |
| `empirical-validation` | Verification requirements |
</related>
