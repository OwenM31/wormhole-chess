---
description: Show recent Coding Harness changes and new features
---

# /whats-new Workflow

<objective>
Display recent changes, new features, and improvements to Coding Harness.
</objective>

<process>

## 1. Read CHANGELOG.md

**PowerShell:**
```powershell
if (Test-Path ".agent/harness/CHANGELOG.md") { Get-Content ".agent/harness/CHANGELOG.md" -Head 50 }
elseif (Test-Path "CHANGELOG.md") { Get-Content "CHANGELOG.md" -Head 50 }
```

**Bash:**
```bash
head -50 .agent/harness/CHANGELOG.md 2>/dev/null || head -50 CHANGELOG.md 2>/dev/null || true
```

## 2. Display Recent Changes

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► WHAT'S NEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VERSION 1.2.0
═════════════

🌍 CROSS-PLATFORM SUPPORT

• All workflow files include PowerShell and Bash equivalents
• Consolidated, model-agnostic capability playbook
• /web-search workflow for research

───────────────────────────────────────────────────────

VERSION 1.1.0
═════════════

📚 TEMPLATE PARITY & EXAMPLES

• Modular templates for all development stages
• Examples directory with walkthroughs
• /add-todo and /check-todos workflows
• Clean .agent/ directory layout

───────────────────────────────────────────────────────

VERSION 1.0.0
═════════════

🎉 INITIAL RELEASE

• Core workflows, skills, and templates
• 4 core rules: Planning Lock, State Persistence,
  Context Hygiene, Empirical Validation

───────────────────────────────────────────────────────

📚 Full changelog: CHANGELOG.md

───────────────────────────────────────────────────────
```

</process>

<related>
## Related

### Workflows
| Command | Relationship |
|---------|--------------|
| `/update` | Check update status |
| `/help` | List all commands |

</related>
