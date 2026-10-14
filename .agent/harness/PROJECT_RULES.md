# PROJECT_RULES.md — Coding Harness Canonical Rules

> **Single Source of Truth** for the Coding Harness methodology.
> 
> Model-agnostic. All workflows, skills, and extensions reference this file.

---

## Core Protocol

**SPEC → PLAN → EXECUTE → VERIFY → COMMIT**

1. **SPEC**: Define requirements in `.agent/state/SPEC.md` until status is `FINALIZED`
2. **PLAN**: Decompose into phases in `.agent/state/ROADMAP.md`, then detailed plans in `.agent/state/phases/`
3. **EXECUTE**: Implement with atomic commits per task
4. **VERIFY**: Prove completion with empirical evidence
5. **COMMIT**: One task = one commit, message format: `type(scope): description`

**Planning Lock**: No implementation code until `SPEC.md` contains "Status: FINALIZED".

---

## Proof Requirements

Every change requires verification evidence:

| Change Type | Required Proof |
|-------------|----------------|
| API endpoint | curl/HTTP response |
| UI change | Screenshot or rendered DOM assertion |
| Build/compile | Command output |
| Test | Test runner output |
| Config | Verification command |

**Never accept**: "It looks correct", "This should work", "I've done similar before".

**Always require**: Captured output, screenshot, or test result.

---

## Search-First Discipline

**Before reading any file completely:**

1. **Search first** — Use grep, ripgrep, or IDE search to find relevant snippets
2. **Evaluate snippets** — Determine if full file read is justified
3. **Targeted reads** — Only read specific line ranges when needed

**Benefits:**
- Reduces context pollution
- Faster understanding of large codebases
- Prevents reading irrelevant code

**Anti-pattern**: Reading entire files "to understand the context" without searching first.

---

## Wave Execution

Plans are grouped into **waves** based on dependencies:

| Wave | Characteristic | Execution |
|------|----------------|-----------|
| 1 | Foundation tasks, no dependencies | Run in parallel / sequentially without blockers |
| 2 | Depends on Wave 1 | Wait for Wave 1, then execute |
| 3 | Depends on Wave 2 | Wait for Wave 2, then execute |

**Wave Completion Protocol:**
1. All tasks in wave verified
2. State snapshot created
3. Commit all wave work
4. Update `.agent/state/STATE.md` with current position

---

## State Snapshots

At the end of each wave or significant work block, create a state snapshot:

```markdown
## Wave N Summary

**Objective:** {what this wave aimed to accomplish}

**Changes:**
- {change 1}
- {change 2}

**Files Touched:**
- {file1}
- {file2}

**Verification:**
- {command}: {result}

**Risks/Debt:**
- {any concerns}

**Next Wave TODO:**
- {item 1}
- {item 2}
```

---

## Model Independence

**Absolute Rule**: No rule, workflow, or skill may require a specific model provider.

**Allowed:**
- Capability-based recommendations (e.g., "use a reasoning model for planning", "use a fast model for execution")
- Optional configuration files for provider parameter tuning
- Examples mentioning specific models as illustrations

**Forbidden:**
- Hard dependencies on provider-specific proprietary features
- Breaking behavior when a specific model is unavailable
- Duplicating canonical rules across multiple model profiles

See [docs/model-selection-playbook.md](docs/model-selection-playbook.md) for capability guidance.

---

## Commit Conventions

**Format:**
```
type(scope): description
```

**Types:**
| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code restructure (no behavior change) |
| `test` | Adding/updating tests |
| `chore` | Maintenance, dependencies |

**Rules:**
- One task = one commit
- Verify before commit
- Scope = phase number for phase work (e.g., `feat(phase-1): ...`)

---

## Core Engineering Principles

These foundational principles guide all planning, coding, and refactoring decisions:

### 1. KISS (Keep It Simple, Stupid)
- **Principle:** Systems work best when they are kept simple rather than made complicated. Avoid unnecessary indirection, clever metaprogramming, and deep abstraction hierarchies.
- **Decomposition:** Simplicity is not cramming 300 lines into one monolithic function. Break complex features into small, focused functions with clear intent. If a function changes external state (like writing a file or updating a database), make that action explicit rather than hiding unexpected mutations inside calculation helpers.
- **Planning Directive:** In `/plan`, identify foundational primitive helpers and schedule them in Wave 1 before building higher-level composite features in Wave 2.

### 2. YAGNI (You Aren't Gonna Need It)
- **Principle:** Always implement things when you actually need them, never when you just foresee that you need them.
- **Directive:** Build only what is explicitly mandated by the active phase's must-haves. Do not create speculative parameters, unused configuration options, or anticipatory hooks for imaginary future needs. Every unrequested line wastes context budget, slows down execution, and creates maintenance overhead.

### 3. Rule of Three (Duplication vs. Premature Abstraction)
- **Principle:** Prefer duplication over the wrong abstraction (Martin Fowler / Don Roberts).
- **Directive:** Do not extract a shared helper or base class for only two instances of similar code. Wait until three distinct, concrete use cases clearly exhibit the exact same pattern before abstracting. Two clean, independent primitives are far easier to maintain than a premature, tangled abstraction full of special-case boolean flags.

### 4. Fail Fast & Explicit Over Implicit
- **Principle:** Surface errors immediately at system boundaries.
- **Directive:** Validate inputs, arguments, and environment variables early. Throw descriptive, actionable errors with contextual parameters rather than failing silently, returning ambiguous `null`s, or swallowing exceptions.

### 5. Boy Scout Rule with Bounded Scope
- **Principle:** Leave modified files cleaner than you found them, but never perform drive-by refactoring.
- **Directive:** Clean up formatting, dead code, or clarity *only* within files already touched by the active task. Never touch unrelated modules during a task commit. If you discover technical debt elsewhere, capture it immediately using `/add-todo [file]: [description]` so it is recorded in `.agent/state/TODO.md` without derailing the current task.

### 6. Design for Deletion & High Cohesion
- **Principle:** Write self-contained code that is easy to remove or replace.
- **Directive:** Group related logic together with minimal cross-module coupling. Code that is easy to delete is inherently modular and prevents cross-file entanglement.

---

## Repository Structure

When installed into a project, all harness resources and execution state live under `.agent/`:

```
.agent/
├── workflows/            # Slash commands (/plan, /execute, /verify, /help, etc.)
├── skills/               # Agent specializations (planner, executor, verifier, etc.)
├── harness/              # All static harness infrastructure & tools
│   ├── PROJECT_RULES.md  # Canonical rules & principles (this file)
│   ├── STYLE.md          # Code style and conventions
│   ├── model_capabilities.yaml # Model capability matrix
│   ├── VERSION           # Harness version
│   ├── CHANGELOG.md      # Harness change history
│   ├── templates/        # Reference templates (spec, plan, summary, etc.)
│   ├── docs/             # Guides & playbooks (token optimization, runbook)
│   ├── examples/         # Reference walkthroughs
│   └── scripts/          # Search & validation utilities
└── state/                # Project runtime memory & artifacts
    ├── SPEC.md           # Requirements (must be FINALIZED)
    ├── ROADMAP.md        # Phases and progress
    ├── STATE.md          # Session memory
    ├── phases/           # Phase plans and summaries (e.g. phases/1/1.1-PLAN.md)
    └── debug/            # Active and resolved bug investigations
```

---

## Context Management

**Context Quality Thresholds:**

| Usage | Quality |
|-------|---------|
| 0-30% | **PEAK** — Comprehensive, thorough work |
| 30-50% | **GOOD** — Solid, confident output |
| 50-70% | **DEGRADING** — Efficiency mode |
| 70%+ | **POOR** — Rushed, incomplete |

**Context Hygiene Rules:**
- Keep plans under 50% context usage
- Fresh context for each plan execution
- After 3 debugging failures → state dump → fresh session
- `.agent/state/STATE.md` = memory across sessions

---

## Token Efficiency Rules

**Goal:** Minimize token consumption while maintaining output quality.

### Loading Rules

| Action | Rule |
|--------|------|
| Before reading file | Search first (grep, ripgrep) |
| File >200 lines | Use outline, not full file |
| File already understood | Reference summary, don't reload |
| >5 files needed | Stop, reconsider approach |

### Budget Thresholds

| Usage | Action Required |
|-------|-----------------|
| 0-50% | Proceed normally |
| 50-70% | Switch to outline mode, compress context |
| 70%+ | State dump required, recommend fresh session |

### Compression Protocol

After understanding a file:
1. Create summary in `.agent/state/STATE.md` or task notes
2. Reference summary instead of re-reading
3. Only reload specific sections if needed

### Per-Wave Efficiency

- Start each wave with minimal context
- Load files just-in-time (when task requires)
- Compress/summarize before moving to next wave
- Document token usage in state snapshots (optional)

**Anti-patterns:**
- Loading files "just in case"
- Re-reading files already understood
- Full file reads when snippets suffice
- Ignoring budget warnings

---

## Quick Reference

```
Before coding    → SPEC.md must be FINALIZED
Before file read → Search first, then targeted read
After each task  → Commit + update STATE.md
After each wave  → State snapshot
After 3 failures → State dump + fresh session
Before "Done"    → Empirical proof captured
```

---

*Coding Harness — Model-Agnostic Edition*  
*Reference implementation for multi-LLM environments*  
