# Model Selection Playbook

> Guidance for choosing models by phase and task type.
> 
> **No specific model is required.** These are recommendations, not requirements.

---

## Selection by Phase

### Planning & Architecture

**Recommended capabilities:**
- Extended reasoning / thinking mode
- Large context window (analyze multiple files)
- Strong structured output generation (specs, roadmaps, task breakdowns)

**Why:** Planning requires understanding full system context and making architectural decisions.

**Examples:** Models with "thinking" or "reasoning" modes, larger context variants.

---

### Code Implementation

**Recommended capabilities:**
- Fast iteration speed
- Strong code synthesis and instruction following
- Tool/function calling (for running verification commands)

**Why:** Implementation involves many small changes with frequent verification cycles.

**Examples:** Speed-tier models, code-specialized variants.

---

### Refactoring

**Recommended capabilities:**
- Large context window (observe before/after across files)
- Pattern recognition
- Consistent style application

**Why:** Refactoring requires maintaining consistency across large code changes.

**Examples:** Standard or long-context variants.

---

### Debugging

**Recommended capabilities:**
- Extended reasoning (hypothesis generation and systematic elimination)
- Reading stack traces and execution logs
- Context for error patterns

**Why:** Debugging requires hypothesis testing and pattern matching.

**Examples:** Reasoning-focused models.

---

### Code Review

**Recommended capabilities:**
- Large context (review full PR diffs alongside existing code)
- Security pattern knowledge
- Style consistency checking

**Why:** Review requires seeing both code and context together.

**Examples:** Long-context variants.

---

## Capability Tiers

| Tier | Characteristics | Best For |
|------|-----------------|----------|
| **Fast** | Quick responses, lower latency/cost | Implementation, iteration, simple edits |
| **Standard** | Balanced speed/quality | General implementation, documentation |
| **Reasoning** | Extended internal thinking, deliberate reasoning | Planning, debugging, architecture, security |
| **Long-context** | Large context windows (>100k tokens) | Codebase mapping, review, multi-file refactoring |

---

## Model & Runtime Optimization Patterns

### 1. Extended Reasoning / Thinking Modes

When working with models that support adjustable thinking/reasoning effort:

| Effort Level | When to Use | Typical Tasks |
|--------------|-------------|---------------|
| `low` | Quick responses needed | Simple edits, formatting, minor corrections |
| `medium` | Standard tasks (default) | Core task implementation, single-file edits |
| `high` | Complex logic | Refactoring, multi-file changes, deep debugging |
| `max` | Critical architecture | Initial project spec, roadmap decomposition, security audits |

*Avoid using maximum thinking effort for straightforward, low-complexity tasks.*

### 2. Large Context Windows

Models with large context windows can analyze extensive files, but require context discipline:

- **Search-first over loading:** Even when large context is available, always search for specific symbols or line ranges before loading full files.
- **Batch related files:** Group related code into a single context payload rather than loading files incrementally across roundtrips.
- **Structured boundaries:** Use clear XML-style tags to delimit separate files and tasks:

```xml
<file path="src/auth/service.ts">
// relevant file contents
</file>

<task>
Implement session validation
</task>
```

- **50% quality threshold:** As context fills past 50%, model precision gradually declines. Keep individual plans scoped to stay within comfortable context boundaries.

### 3. Function & Tool Calling

When the environment supports function/tool execution:
- Use tool execution sandboxes for empirical verification commands (`npm test`, build checks, curl).
- Rely on persistent state files (`.agent/state/STATE.md`, `.agent/state/SUMMARY.md`) to capture tool outputs rather than maintaining long conversational transcripts.

### 4. Local & Resource-Constrained Models

When running local models (e.g., via Ollama, llama.cpp) or smaller-parameter models:

- **Structured Prompts:** Local models follow flat, explicit structures best:
  ```markdown
  ## Task
  [Clear instruction]

  ## Context
  [Focused snippet]

  ## Expected Output
  [Exact expected format]

  ## Constraints
  [Strict limitations]
  ```
- **Aggressive Search-First:** Never load full files; extract only the minimum relevant lines.
- **Smaller Execution Waves:** Decompose phases into smaller, single-task plans so the model never loses the thread.
- **Frequent State Snapshots:** Commit and write progress to `.agent/state/STATE.md` after every single task.

---

## Anti-Patterns

❌ **Using reasoning models for simple edits** — Overkill, slow, expensive.

❌ **Using fast models for architecture** — Insufficient depth for complex structural decisions.

❌ **Ignoring context limits** — Quality degrades sharply as context window saturates.

❌ **Forcing a specific model provider** — Violates model agnosticism.

---

## Model Switching Mid-Session

**When to switch:**
- Context is approaching 50% capacity.
- Task type changes significantly (planning → implementation).
- Current model is struggling with the task type.

**How to switch:**
1. Create a state snapshot in `.agent/state/STATE.md`.
2. Commit all verified work.
3. Start a fresh session with the appropriate model.
4. Load `.agent/state/STATE.md` to resume without lost context.

---

## Model-Agnostic Principle

The Coding Harness works with any capable LLM. The methodology compensates for model differences through:

1. **Structured plans** — Reduce ambiguity and guesswork.
2. **Explicit verification** — Require empirical proof before completing tasks.
3. **State persistence** — Enable seamless model and session switching via `.agent/state/`.
4. **Fresh context** — Prevent error and token accumulation.

Choose models based on task needs, not framework requirements.

---

*See [PROJECT_RULES.md](../PROJECT_RULES.md) for canonical rules.*  
*See [docs/runbook.md](runbook.md) for operational procedures.*  
