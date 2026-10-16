---
description: Deep technical research for a phase
argument-hint: "<phase-number> [--level 1|2|3]"
---

# /research-phase Workflow

<objective>
Conduct technical research to inform planning decisions for a phase.
</objective>

<discovery_levels>
## Discovery Levels

| Level | Time | Use When |
|-------|------|----------|
| 0 | 0 min | Already know, just doing it |
| 1 | 2-5 min | Single library, confirming syntax |
| 2 | 15-30 min | Choosing between options, new integration |
| 3 | 1+ hour | Architectural decision, novel problem |

**Default:** Level 2 unless specified.
</discovery_levels>

<process>

## 1. Load Phase Context

Read:
- Phase objective from .agent/state/ROADMAP.md
- Relevant ARCHITECTURE.md sections
- STACK.md for current technologies

---

## 2. Identify Research Questions

What needs to be understood before planning?

```markdown
## Research Questions

1. {Technical question 1}
2. {Technical question 2}
3. {Integration question}
```

---

## 3. Conduct Research

Use `/web-search "<query>"` to gather authoritative documentation, library comparisons, or API references.

Based on discovery level:

**Level 1:** Quick verification
- Check official docs via `/web-search`
- Confirm API/syntax

**Level 2:** Comparison research
- Compare 2-3 options using `/web-search`
- Evaluate trade-offs
- Make recommendation

**Level 3:** Deep dive
- Prototype if needed
- Research edge cases
- Document unknowns

---

## 4. Generate RESEARCH.md

Create `.agent/state/phases/{N}/RESEARCH.md`:

```markdown
---
phase: {N}
level: {1|2|3}
researched_at: {date}
---

# Phase {N} Research

## Questions Investigated
1. {question}
2. {question}

## Findings

### {Topic 1}
{What was learned}

**Sources:**
- {URL}

**Recommendation:** {what to do}

### {Topic 2}
...

## Technical Architecture & Contracts

> [!IMPORTANT]
> **Skill Activation: data-architect**
> If this phase touches databases, schemas, state transitions, financial calculations, or API contracts, read and apply `.agent/skills/data-architect/SKILL.md`. Formulate the 5-layer contract alignment table, state transition matrix, and immutable system invariants below before marking research complete.

### 5-Layer Contract Alignment
| Domain Concept | SQL DDL / Storage | Shared TypeScript | Runtime Validation (Zod) | API Request/Response DTO | Form / Client State |
|---|---|---|---|---|---|
| {Concept} | {SQL type} | {TS type} | {Zod schema} | {DTO field} | {UI display} |

### State Transition Matrix
| Current State | Event: {Action 1} | Event: {Action 2} | Event: {Action 3} |
|---|---|---|---|
| {State A} | ➔ {Next State} | 400 {Error Code} | 400 {Error Code} |

### Immutable System Invariants
1. {Rule 1}: {Enforcement mechanism (e.g. database trigger, unique index, session context)}
2. {Rule 2}: {Enforcement mechanism}

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| {decision} | {choice} | {why} |

## Patterns to Follow
- {pattern 1}
- {pattern 2}

## Anti-Patterns to Avoid
- {anti-pattern}: {why}

## Dependencies Identified
| Package | Version | Purpose |
|---------|---------|---------|
| {pkg} | {ver} | {why} |

## Risks
- {risk}: {mitigation}

## Ready for Planning
- [x] Questions answered
- [x] Contracts and invariants specified
- [x] Approach selected
- [x] Dependencies identified
```

---

## 5. Commit Research

```powershell
git add .agent/state/phases/{N}/RESEARCH.md
git commit -m "docs(phase-{N}): research complete"
```

---

## 6. Offer Next Steps

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► RESEARCH COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase {N}: {name}
Level: {level}

Key findings:
• {finding 1}
• {finding 2}

───────────────────────────────────────────────────────

▶ NEXT

/design-phase {N} — Research aesthetic benchmarks & prototype UI variants (if UI phase)
/plan {N}         — Create execution plans informed by research (for non-visual / backend phases)

───────────────────────────────────────────────────────
```

</process>

<related>
## Related

### Workflows
| Command | Relationship |
|---|---|
| `@discuss-phase.md` | Run before @research-phase to align on scope and business decisions |
| `@design-phase.md` | Run after @research-phase if the phase has UI/frontend deliverables |
| `@plan.md` | Run after @research-phase to decompose work into atomic execution plans |

### Skills
| Skill | Purpose |
|---|---|
| `data-architect` | Formulates 5-layer contracts, state transition matrices, and system invariants |
| `context-fetch` | Efficient targeted search for documentation and library APIs |
| `web-search` | Authoritative documentation lookup |
</related>
