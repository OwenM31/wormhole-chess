---
description: Show all available Coding Harness commands and workflow guides
---

# /help Workflow

<objective>
Display all available Coding Harness commands, workflow cycles, architecture, and usage hints.
</objective>

<process>

**First, read and display the version:**

**PowerShell:**
```powershell
$version = Get-Content ".agent/harness/VERSION" -ErrorAction SilentlyContinue
if (-not $version) { $version = Get-Content "harness/VERSION" -ErrorAction SilentlyContinue }
if (-not $version) { $version = Get-Content "VERSION" -ErrorAction SilentlyContinue }
if (-not $version) { $version = "1.0.0" }
```

**Bash:**
```bash
version=$(cat .agent/harness/VERSION 2>/dev/null || cat harness/VERSION 2>/dev/null || cat VERSION 2>/dev/null || echo "1.0.0")
```

**Then display comprehensive help guide:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► COMMAND & WORKFLOW GUIDE (v{version})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run workflows by referencing their file: @<workflow>.md (or /<workflow> if aliased)

CORE EXECUTION
──────────────
@discuss-phase.md [N]      Discuss scope, trade-offs, and architecture BEFORE planning
@research-phase.md [N]     Deep technical discovery & documentation (Level 1–3)
@design-phase.md [N]       Research aesthetic benchmarks & generate 3-5 UI variants for user selection
@plan.md [N]               Decompose phase N into atomic, wave-sequenced plans (2-3 tasks max)
@execute.md [N]            Execute wave-by-wave with atomic task verification & commits
@verify.md [N]             Validate phase deliverables against SPEC.md with 3-tier proof
@ux-sweep.md [route] [--audit] Exploratory UX sweep & spec conformance audit (dead buttons, slop)
@debug.md [issue]          Systematic 3-strike debugging with fresh subagent contexts
@map.md                    Analyze existing codebase architecture → ARCHITECTURE.md

PROJECT SETUP & MILESTONES
──────────────────────────
@new-project.md            Deep requirements interview → generates finalized SPEC.md
@new-milestone.md          Define release must-haves → generates phase list in ROADMAP.md
@audit-milestone.md        Cross-phase deliverable & integration audit before shipping
@complete-milestone.md     Archive completed milestone summary & create git release tag
@plan-milestone-gaps.md    Analyze gaps between current progress and milestone goals

DYNAMIC SCOPE & ROADMAP
───────────────────────
@add-phase.md              Append a new phase to the end of the milestone roadmap
@insert-phase.md [N]       Inject an urgent blocker/prerequisite phase (renumbers subsequent)
@remove-phase.md [N]       Safely deprecate or remove a phase from the roadmap
@list-phase-assumptions.md Surface hidden technical/integration assumptions before execution
@research-phase.md [N]     Deep technical discovery & documentation (Level 1–3)

SESSION & CONTEXT HYGIENE
─────────────────────────
@resume.md                 Restore working memory, active plan, and next steps from STATE.md
@pause.md                  Serialize session progress to STATE.md before context resets
@progress.md               Display visual roadmap status and phase completion
@add-todo.md               Quick-capture ideas without derailing the current execution wave
@check-todos.md            Review pending captured items and backlog ideas

UTILITIES
─────────
@help.md                   Display this guide
@web-search.md [query]     Perform targeted web searches for APIs, syntax, and libraries
@update-harness.md [flags] Update harness from GitHub (preserves .agent/state/)
@whats-new.md              Display harness changelog and recent enhancements

────────────────────────────────────────────────────────────────────

THE CONTEXT HANDOFF BRIDGE
──────────────────────────
[Any Work] ➔ @pause.md ➔ /clear-context ➔ @resume.md ➔ [Next Work]
• @pause.md:      Serializes progress, active plan, and next steps to STATE.md
• /clear-context: Wipes the conversation window to restore model reasoning to 100%
• @resume.md:     Bootstraps fresh session from STATE.md with zero memory loss

RECOMMENDED WORKFLOW CYCLES
───────────────────────────

1. Standard Phase Loop (Managing Context Rot):
   /clear-context ➔ @resume.md ➔ @discuss-phase.md {N} ➔ @research-phase.md {N} ➔ @design-phase.md {N} (if UI) ➔ @plan.md {N} ➔ @pause.md ➔
   /clear-context ➔ @resume.md ➔ @execute.md {N} ➔ @verify.md {N} ➔ @ux-sweep.md (if UI)

2. Full Milestone Lifecycle:
   @new-milestone.md (establishes release goals & ROADMAP.md phases)
     └── For each Phase 1..N:
           @discuss-phase.md {N} ➔ @research-phase.md {N} ➔ @design-phase.md {N} (if UI) ➔ @plan.md {N} ➔ @execute.md {N} ➔ @verify.md {N}
     └── Closeout:
           @audit-milestone.md ➔ @complete-milestone.md (tags git vX.X)

3. Handling Unexpected Blocker / Prerequisite:
   @insert-phase.md {N} ➔ @discuss-phase.md {N} ➔ @plan.md {N} ➔ @execute.md {N}

────────────────────────────────────────────────────────────────────

ARCHITECTURE & REASONING SKILLS
───────────────────────────────
.agent/
├── workflows/   Callable playbooks (@plan.md, @execute.md, etc.)
├── skills/      16 autonomous reasoning protocols (progressive disclosure):
│                • Planning & Execution: planner, plan-checker, executor, empirical-validation
│                • Quality & UX: verifier, ux-sweeper, playwright-cli, debugger
│                • Systems & Contracts: data-architect, test-engineer, frontend-designer, codebase-mapper
│                • Context Hygiene: context-fetch, context-compressor, token-budget, context-health-monitor
├── harness/     Static rules (PROJECT_RULES.md, STYLE.md, templates, scripts)
└── state/       Runtime memory (SPEC.md, ROADMAP.md, STATE.md, phases/)

────────────────────────────────────────────────────────────────────

CORE ENGINEERING RULES
──────────────────────
🔒 Planning Lock        No implementation until SPEC.md is FINALIZED
🌊 Wave Decomposition  Plans broken into waves; strictly 2–3 tasks per plan
💾 Atomic Commits       Verified and committed git changes task-by-task
🧹 Context Hygiene      Clear context between planning and execution sessions
✅ Empirical Proof      Verification requires test outputs/proof — never "it should work"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</process>
