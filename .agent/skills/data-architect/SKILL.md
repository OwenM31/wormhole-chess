---
name: Data Architect
description: Formulates canonical 5-layer data contracts, exhaustive state transition matrices, and immutable precision invariants to prevent architectural drift
---

# Data Architect Skill

<role>
You are a principal data and systems architect. You specialize in mathematical precision, relational integrity, distributed state machines, and contract-first schema design. You ensure that deep technical systems have zero ambiguity before a single line of implementation code is planned.
</role>

---

## Core Philosophy

> **"Systems drift when contracts are implicit."**
>
> If an AI agent has to guess whether an amount is in dollars or cents, whether a status transition is permitted, or which layer validates an invariant, it will guess differently across different tasks. The Data Architect makes contracts, transitions, and invariants mathematically explicit upfront.

---

## The Three Core Deliverables (For Technical & Data Phases)

When `@research-phase.md` investigates a phase involving databases, state lifecycles, ledgers, or APIs, the `data-architect` skill produces three standardized sections in `RESEARCH.md`:

### 1. The 5-Layer Contract Alignment Table
Eliminates contract and naming drift across all tiers of the application stack:

```markdown
### 5-Layer Contract Alignment
| Domain Concept | SQL DDL / Storage | Shared TypeScript | Runtime Validation (Zod) | API Request/Response DTO | Form / Client State |
|---|---|---|---|---|---|
| Monetary Value | `gross_cents BIGINT NOT NULL` | `gross_cents: number` | `z.number().int().nonnegative()` | `{ "gross_cents": 5000 }` | `$50.00` (formatted) |
| Lifecycle Status | `VARCHAR(30) NOT NULL` | `enum StatementStatus` | `z.nativeEnum(StatementStatus)` | `{ "status": "IN_REVIEW" }` | Status Chip |
| Identifier | `UNIQUEIDENTIFIER` | `string` (UUID v4) | `z.string().uuid()` | `{ "statement_id": "..." }` | Route Param `:id` |
| Concurrency Lock | `row_version ROWVERSION` | `row_version: string` | `z.string()` | `If-Match: "..."` (ETag) | Stored in memory |
```

### 2. The Exhaustive State Transition Matrix
Guarantees that state machine lifecycles handle all edge transitions and race conditions rather than just the happy path:

```markdown
### State Transition Matrix
| Current State | Event: Submit | Event: Approve | Event: Dispute | Event: Mark Paid | Event: Void |
|---|---|---|---|---|---|
| `DRAFT` | ➔ `IN_REVIEW` | 400 `NOT_SUBMITTED` | 400 `NOT_SUBMITTED` | 400 `NOT_APPROVED` | ➔ `VOID` |
| `IN_REVIEW` | 400 `ALREADY_SUBMITTED` | ➔ `APPROVED` (if Director) | ➔ `DISPUTED` | 400 `NOT_APPROVED` | ➔ `VOID` |
| `DISPUTED` | 400 `UNDER_DISPUTE` | 400 `RESOLVE_DISPUTE_FIRST` | 400 `ALREADY_DISPUTED`| 400 `NOT_APPROVED` | ➔ `VOID` |
| `APPROVED` (Locked) | 400 `ALREADY_LOCKED` | 400 `ALREADY_APPROVED` | 400 `ALREADY_LOCKED` | ➔ `PAID` | 400 `LOCKED` (Req Override) |
| `PAID` (Final) | 400 `FINAL_STATE` | 400 `FINAL_STATE` | 400 `FINAL_STATE` | 400 `ALREADY_PAID` | 400 `CANNOT_VOID_PAID` |
| `VOID` (Dead) | 400 `VOID_STATE` | 400 `VOID_STATE` | 400 `VOID_STATE` | 400 `VOID_STATE` | 400 `ALREADY_VOID` |
```

### 3. The Immutable Invariants Ledger
Rules that must NEVER be broken by any future task or code change. Documented with their mechanical enforcement mechanism:

```markdown
### Immutable System Invariants
1. **Zero Floating-Point Drift:** All currency calculations must use integer cents (`bigint`) and integer basis points (`1 bp = 0.01%`). Zero floats allowed in math.
   - *Enforcement:* Verified in shared pure math functions and T-SQL `ROUND(..., 0)` routines.
2. **Mechanical Double-Spend/Double-Pay Guard:** No single session instance or invoice can be paid twice across the lifetime of the database.
   - *Enforcement:* Unique filtered nonclustered index on `(session_instance_id, line_type) WHERE line_type <> 'ADJUSTMENT'`.
3. **Database Immutability Lock:** Once a statement or financial batch has `locked_at IS NOT NULL`, any INSERT, UPDATE, or DELETE on child lines must abort.
   - *Enforcement:* Physical database trigger `pay.trg_payroll_lock` raising Error 52010.
4. **Segregation of Duties (SoD):** The submitter of a financial request cannot approve their own stage (unless stage is explicitly designated `SUBJECT_SELF`).
   - *Enforcement:* `wf.usp_decide_stage` checking `actor_user_id <> submitter_user_id`.
```

---

## When to Activate

Activate the `data-architect` skill in `@research-phase.md` whenever a phase involves:
- New database tables, columns, or migration files.
- Entities with multi-step lifecycles or statuses (orders, applications, invoices, approvals).
- Currency, balances, inventory, quotas, or rate limiting.
- Data synchronization, export formats (CSV/EDI/JSON), or batch processing.
