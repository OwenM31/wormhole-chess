---
description: The Strategist — Decompose requirements into executable phases in ROADMAP.md
argument-hint: "[phase] [--research] [--skip-research] [--skip-design] [--gaps] [--fix-defects]"
---

# /plan Workflow

<role>
You are a planner orchestrator. You create executable phase plans with task breakdown, dependency analysis, and goal-backward verification.

**Core responsibilities:**
- Parse arguments and validate phase
- Handle research (unless skipped or exists)
- Create PLAN.md files with XML task structure
- Verify plans with checker logic
- Iterate until plans pass (max 3 iterations)
</role>

<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Why subagents:** Research and planning burn context fast. Verification uses fresh context. User sees the flow between agents in main context.
</objective>

<context>
**Phase number:** $ARGUMENTS (optional — auto-detects next unplanned phase if not provided)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research entirely, go straight to planning
- `--skip-design` — Skip UI design phase checks and proceed with standard planning
- `--gaps` or `--fix-defects` — Gap closure and defect remediation mode (reads VERIFICATION.md and DEFECTS.md, skips research)

**Required files:**
- `.agent/state/SPEC.md` — Must be FINALIZED (Planning Lock)
- `.agent/state/ROADMAP.md` — Must have phases defined
- `.agent/rules/STYLE.md` — If phase involves UI, styling tokens approved by @design-phase
- `.agent/state/DESIGN_STATE.md` — If phase involves UI, design continuity and variant decisions
</context>

<philosophy>

## Solo Developer + AI Workflow
You are planning for ONE person (the user) and ONE implementer (the AI).
- No teams, stakeholders, ceremonies, coordination overhead
- User is the visionary/product owner
- AI is the builder

## Plans Are Prompts
PLAN.md is NOT a document that gets transformed into a prompt.
PLAN.md IS the prompt. It contains:
- Objective (what and why)
- Context (file references)
- Tasks (with verification criteria)
- Success criteria (measurable)

## Quality Degradation Curve

| Context Usage | Quality | State |
|---------------|---------|-------|
| 0-30% | PEAK | Thorough, comprehensive |
| 30-50% | GOOD | Confident, solid work |
| 50-70% | DEGRADING | Efficiency mode begins |
| 70%+ | POOR | Rushed, minimal |

**The rule:** Plans should complete within ~50% context. More plans, smaller scope.

## Aggressive Atomicity
Each plan: **2-3 tasks max**. No exceptions.

</philosophy>

<discovery_levels>

## Discovery Protocol

Discovery is MANDATORY unless you can prove current context exists.

**Level 0 — Skip** (pure internal work)
- ALL work follows established codebase patterns
- No new external dependencies
- Pure internal refactoring or feature extension

**Level 1 — Quick Verification** (2-5 min)
- Single known library, confirming syntax/version
- Low-risk decision (easily changed later)
- Action: Run `/web-search "<query>"`, no RESEARCH.md needed

**Level 2 — Standard Research** (15-30 min)
- Choosing between 2-3 options
- New external integration (API, service)
- Medium-risk decision
- Action: Research with `/web-search` or `/research-phase`, create RESEARCH.md with findings

**Level 3 — Deep Dive** (1+ hour)
- Architectural decision with long-term impact
- Novel problem without clear patterns
- High-risk, hard to change later
- Action: Run `/research-phase` for full research with RESEARCH.md

</discovery_levels>

<process>

## 1. Validate Environment (Planning Lock)

**PowerShell:**
```powershell
# Check SPEC.md exists and is finalized
$spec = Get-Content ".agent/state/SPEC.md" -Raw
if ($spec -notmatch "FINALIZED") {
    Write-Error "SPEC.md must be FINALIZED before planning"
    exit
}
```

**Bash:**
```bash
# Check SPEC.md exists and is finalized
if ! grep -q "FINALIZED" ".agent/state/SPEC.md"; then
    echo "Error: SPEC.md must be FINALIZED before planning" >&2
    exit 1
fi
```

**If not finalized:** Error — user must complete SPEC.md first.

---

## 2. Parse and Normalize Arguments

Extract from $ARGUMENTS:
- Phase number (integer)
- `--research` flag
- `--skip-research` flag
- `--skip-design` flag
- `--gaps` or `--fix-defects` flag

**If no phase number:** Detect next unplanned phase from ROADMAP.md (or active phase from STATE.md if in gap/defect remediation mode).

---

## 3. Validate Phase

**PowerShell:**
```powershell
Select-String -Path ".agent/state/ROADMAP.md" -Pattern "Phase $PHASE:"
```

**Bash:**
```bash
grep "Phase $PHASE:" ".agent/state/ROADMAP.md"
```

**If not found:** Error with available phases.
**If found:** Extract phase name and description.

---

## 4. Ensure Phase Directory

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

## 5. Handle Research

**If `--gaps` or `--fix-defects` flag:** Skip research (remediation plans are derived directly from VERIFICATION.md and .agent/state/DEFECTS.md).

**If `--skip-research` flag:** Skip to step 6.

**Check for existing research:**
**PowerShell:**
```powershell
Test-Path "$PHASE_DIR/RESEARCH.md"
```

**Bash:**
```bash
test -f "$PHASE_DIR/RESEARCH.md"
```

**If RESEARCH.md exists AND `--research` flag NOT set:**
- Display: `Using existing research: $PHASE_DIR/RESEARCH.md`
- Skip to step 6

**If research needed:**

Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► RESEARCHING PHASE {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Perform research based on discovery level (see `<discovery_levels>`).

Create `$PHASE_DIR/RESEARCH.md` with findings.

---

## 6. Create Plans

Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► PLANNING PHASE {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 6a. Gather Context
Load:
- `.agent/state/SPEC.md` — Requirements
- `.agent/state/ROADMAP.md` — Phase description
- `$PHASE_DIR/RESEARCH.md` — If exists
- `.agent/state/ARCHITECTURE.md` — If exists
- `.agent/rules/STYLE.md` — Design tokens (if exists and phase involves UI)
- `.agent/state/DESIGN_STATE.md` — Visual continuity & approved variants (if exists and phase involves UI)
- `.agent/state/artifacts/design/phase_{N}_approved.png` — Approved visual mockup reference (if exists)

### 6b. Decompose into Tasks
For the phase goal:
1. Identify all deliverables (Backend, Database, and UI).
2. **For UI Deliverables (UI Shell Pattern):**
   - Check if an approved presentational UI shell component was generated by `@design-phase` (e.g. `src/pages/.../View.tsx`).
   - **If UI Shell exists:** Formulate UI tasks as *wiring tasks* rather than rebuilding styling from scratch. Ensure wiring tasks connect all 4 states (`isLoading`, `isEmpty`, `error`, `data`) and button action handlers to live API hooks / stores, never implementing just the "happy path."
   - **If UI Shell does not exist and phase is UI-heavy:** Ask user if they wish to run `@design-phase.md {N}` first to choose an aesthetic direction, or proceed with standard planning (pass `--skip-design` to bypass).
3. **For Backend / Logic Deliverables (Contract-First / TDD Pattern):**
   > [!IMPORTANT]
   > **Skill Activation: test-engineer**
   > Read and apply `.agent/skills/test-engineer/SKILL.md`. Translate user stories from `SPEC.md` and state matrices / error codes from `RESEARCH.md` directly into a specification test suite.
   - Sequence tasks in a two-beat rhythm:
     - *Task A (Specification Tests):* Author the contract test assertions asserting exact response schemas, state transitions, rejection error codes, and invariants (initially failing/red).
     - *Task B (Implementation):* Implement the SQL migration, stored procedure, service, or API endpoint until Task A tests pass green.
     - *Drift Prevention:* Executor is explicitly forbidden from modifying test assertions to make them pass.
4. **For Gap Closure & Defect Remediation (`--gaps` or `--fix-defects`):**
   - Read failed must-haves from `VERIFICATION.md` and P0/P1 issues from `.agent/state/DEFECTS.md`.
   - Create focused fix plans with `gap_closure: true` in YAML frontmatter targeting only the failing assertions, broken wiring, or UX defects.
5. Break into atomic tasks (2-3 per plan).
6. Determine dependencies between tasks.
7. Assign execution waves.

### 6c. Write PLAN.md Files

Create `$PHASE_DIR/{N}-PLAN.md`:

```markdown
---
phase: {N}
plan: 1
wave: 1
---

# Plan {N}.1: {Plan Name}

## Objective
{What this plan delivers and why}

## Context
- .agent/state/SPEC.md
- .agent/state/ARCHITECTURE.md
- {relevant source files}

## Tasks

<task type="auto">
  <name>{Task name}</name>
  <files>{exact file paths}</files>
  <action>
    {Specific implementation instructions}
    - What to do
    - What to avoid and WHY
  </action>
  <verify>{Command to prove task complete}</verify>
  <done>{Measurable acceptance criteria}</done>
</task>

<task type="auto">
  ...
</task>

## Success Criteria
- [ ] {Measurable outcome 1}
- [ ] {Measurable outcome 2}
```

---

## 7. Verify Plans (Checker Logic)

For each plan, verify:
- [ ] All files specified exist or will be created
- [ ] Actions are specific (no "implement X")
- [ ] Verify commands are executable
- [ ] Done criteria are measurable
- [ ] Context references exist

**If issues found:** Fix and re-verify (max 3 iterations).

---

## 8. Update State

Update `.agent/state/STATE.md`:
```markdown
## Current Position
- **Phase**: {N}
- **Task**: Planning complete
- **Status**: Ready for execution

## Next Steps
1. /execute {N}
```

---

## 9. Commit Plans

```bash
git add .agent/state/phases/$PHASE/
git add .agent/state/STATE.md
git commit -m "docs(phase-$PHASE): create execution plans"
```

---

## 10. Offer Next Steps

</process>

<offer_next>

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► PHASE {N} PLANNED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{X} plans created across {Y} waves

Plans:
• {N}.1: {Name} (wave 1)
• {N}.2: {Name} (wave 1)
• {N}.3: {Name} (wave 2)

───────────────────────────────────────────────────────

▶ Next Up

/execute {N} — run all plans

───────────────────────────────────────────────────────
```

</offer_next>

<task_types>

| Type | Use For | Autonomy |
|------|---------|----------|
| `auto` | Everything the agent can do independently | Fully autonomous |
| `checkpoint:human-verify` | Visual/functional verification | Pauses for user |
| `checkpoint:decision` | Implementation choices | Pauses for user |

**Automation-first rule:** If the agent CAN do it, the agent MUST do it. Checkpoints are for verification AFTER automation.

</task_types>

<related>
## Related

### Workflows
| Command | Relationship |
|---------|--------------|
| `/discuss-phase` | Scopes architectural decisions before planning |
| `/design-phase` | Researches aesthetic benchmarks & locks UI design variants before planning |
| `/map` | Run before /plan to get codebase context |
| `/execute` | Runs PLAN.md files created by /plan |
| `/verify` | Validates executed plans |

### Skills
| Skill | Purpose |
|-------|---------|
| `planner` | Detailed planning methodology |
| `plan-checker` | Validates plans before execution |
| `data-architect` | Formulates contracts, state transition matrices, and system invariants |
| `test-engineer` | Formulates contract-first test suites from user stories and contracts |
| `frontend-designer` | Aesthetic benchmarks & UI design prototyping |
</related>
