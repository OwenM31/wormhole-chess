# STYLE.md

> **Comprehensive reference.** This document explains how the coding harness is structured and written so agents and developers contribute consistently.

---

## Core Philosophy

The Coding Harness is a **meta-prompting system** where every file is both implementation and specification. Files teach the AI how to build software systematically. The system optimizes for:

- **Solo developer + AI workflow** (no enterprise theater)
- **Context engineering** (manage the context window deliberately)
- **Plans as prompts** (PLAN.md files are executable, not documents to transform)

---

## File Structure Conventions

### Workflows (`.agent/workflows/*.md`)

Slash commands the user invokes. Each workflow:
- Has YAML frontmatter with `description`
- Contains XML-structured process blocks
- Ends with "Next Steps" routing

### Skills (`.agent/skills/*/SKILL.md`)

Specialized agent behaviors. Each skill:
- Has YAML frontmatter with `name` and `description`
- Contains detailed methodology
- Is referenced by parent workflows

### Templates (`.agent/harness/templates/*.md`)

Reusable document structures. Copy, don't reference.

### References (`.agent/harness/examples/*.md` & `.agent/harness/docs/*.md`)

Read-only documentation and examples.

### Project State (`.agent/state/*.md`)

Active project state and execution memory (`SPEC.md`, `ROADMAP.md`, `STATE.md`, `phases/`, `debug/`).

---

## XML Tag Conventions

### Semantic Containers Only

Use XML tags for semantic meaning, not formatting:

```markdown
<role>
You are an execution agent...
</role>

<objective>
Execute all plans in a phase...
</objective>

<process>
## 1. First Step
...
</process>
```

### Task Structure

```xml
<task type="auto" effort="medium">
  <name>Clear descriptive name</name>
  <files>exact/path/to/file.ts</files>
  <action>
    Specific implementation instructions.
    AVOID: common mistake (reason)
    USE: preferred approach (reason)
  </action>
  <verify>executable command that proves completion</verify>
  <done>measurable acceptance criteria</done>
</task>
```

### Effort Attribute (Optional)

The `effort` attribute hints at task complexity for model selection:

| Value | Use Case | Model Hint |
|-------|----------|------------|
| `low` | Simple edits, formatting | Fast models |
| `medium` | Standard implementation (default) | Standard models |
| `high` | Complex logic, refactoring | Reasoning models |
| `max` | Architecture, security-critical | Deep reasoning |

**Default:** `medium` if omitted. No workflow should fail if this attribute is absent.

See [docs/model-selection-playbook.md](docs/model-selection-playbook.md) for model selection guidance.

### Checkpoint Structure

```xml
<task type="checkpoint:human-verify">
  <name>Verify UI renders correctly</name>
  <action>User reviews the rendered component</action>
  <verify>User confirms visual correctness</verify>
</task>
```

---

## Language & Tone

### Imperative Voice
- ✅ "Create the file"
- ❌ "You should create the file"
- ❌ "We will create the file"

### No Filler
- ✅ "Run `npm test`"
- ❌ "Now let's go ahead and run `npm test`"

### No Sycophancy
- ✅ "Phase complete."
- ❌ "Great job! Phase complete!"

### Brevity with Substance
Every sentence should convey information. Remove words that don't add meaning.

---

## Context Engineering

### Size Constraints

| Context Usage | Quality |
|---------------|---------|
| 0-30% | PEAK — Thorough, comprehensive |
| 30-50% | GOOD — Confident, solid work |
| 50-70% | DEGRADING — Efficiency mode begins |
| 70%+ | POOR — Rushed, minimal |

**Rule:** Plans should complete within ~50% context.

### Fresh Context Pattern

When executing subprocesses (plans, tasks), agents receive:
- The specific plan being executed
- Minimal necessary context from parent files
- NO accumulated orchestrator state

### State Preservation

`STATE.md` exists because context windows are temporary.
Everything important goes in `.agent/state/STATE.md` so the next session can continue seamlessly.

---

## Anti-Patterns to Avoid

### Enterprise Patterns (Banned)

❌ Stakeholder communication  
❌ Team coordination  
❌ Sprint ceremonies  
❌ Multiple approval levels  
❌ Separate environments requiring explicit promotion  

### Temporal Language (Banned in Implementation Docs)

❌ "First, we'll..."  
❌ "Next, we should..."  
❌ "Finally, we'll..."  

### Generic XML (Banned)

```xml
<!-- DON'T -->
<section>
  <title>Authentication</title>
  <content>...</content>
</section>

<!-- DO -->
<task type="auto">
  <name>Create login endpoint</name>
  ...
</task>
```

### Vague Tasks (Banned)

```xml
<!-- DON'T -->
<action>Implement authentication</action>

<!-- DO -->
<action>
  Create POST /api/auth/login endpoint.
  Accept {email, password} JSON body.
  Query User by email, compare with bcrypt.
  Return JWT in httpOnly cookie on success.
  Return 401 on failure.
</action>
```

---

## Commit Conventions

### Format
```
type(scope): description
```

### Types
| Type | Use For |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `refactor` | Code restructure |
| `test` | Add tests |
| `chore` | Maintenance |

### Rules
- One task = one commit
- Scope is phase number for phase work
- No commit before verification passes

---

## UX Patterns

### Banners

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► STATUS MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### "Next Up" Format

```
───────────────────────────────────────────────────────

▶ NEXT

/command — description

───────────────────────────────────────────────────────
```

### Decision Gates

When user input needed:
```
⚠️ DECISION REQUIRED

Option A: {description}
Option B: {description}

Which do you prefer?
```

---

## Summary: Core Meta-Patterns

1. **Plans are prompts** — PLAN.md is read and executed directly
2. **Fresh context for execution** — Each plan runs in clean context
3. **STATE.md is memory** — Everything important persists in `.agent/state/`
4. **Verify before done** — No "trust me, it works"
5. **Aggressive atomicity** — Small tasks, atomic commits
6. **No enterprise theater** — Solo dev + AI workflow only
