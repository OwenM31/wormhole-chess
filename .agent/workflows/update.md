---
description: Check for updates or update harness components from GitHub
argument-hint: "[--check-only]"
---

# /update Workflow

<objective>
Check for Coding Harness updates or execute the full update-harness workflow.
</objective>

<process>

To update your Coding Harness from GitHub while preserving all project memory (`.agent/state/`), run:

```text
@.agent/workflows/update-harness.md
```

Or run with `--check-only` to check if a new version is available without applying changes:

```text
@.agent/workflows/update-harness.md --check-only
```

</process>
