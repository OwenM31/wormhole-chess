---
description: Update Coding Harness components from GitHub while strictly preserving project memory
argument-hint: "[--check-only] [--force]"
---

# /update-harness Workflow

<objective>
Update harness components (`.agent/workflows/`, `.agent/skills/`, and `.agent/harness/`) from the upstream repository (https://github.com/OwenM31/Coding-Harness) while strictly protecting and preserving all project runtime memory in `.agent/state/` (SPEC.md, ROADMAP.md, STATE.md, phases/, debug/).
</objective>

<safety_guarantee>
**PROJECT MEMORY IS NEVER OVERWRITTEN:**
`.agent/state/` contains all project plans, specifications, roadmaps, and execution memory. This workflow explicitly excludes `.agent/state/` from updates, ensuring updates never clobber your project plans or session state.
</safety_guarantee>

<process>

## 1. Check Current Version & Environment

Read the currently installed version:

**PowerShell:**
```powershell
$currentVersion = "unknown"
if (Test-Path ".agent/harness/VERSION") {
    $currentVersion = (Get-Content ".agent/harness/VERSION" -Raw).Trim()
}
Write-Host "Current Harness Version: $currentVersion"
```

**Bash:**
```bash
current_version="unknown"
if [ -f ".agent/harness/VERSION" ]; then
    current_version=$(cat .agent/harness/VERSION | tr -d '[:space:]')
fi
echo "Current Harness Version: $current_version"
```

If uncommitted git changes exist in `.agent/workflows/`, `.agent/skills/`, or `.agent/harness/`, and `--force` is not passed, prompt the user before proceeding.

---

## 2. Fetch Latest Upstream Files

Clone the repository shallowly into a temporary staging directory:

**PowerShell:**
```powershell
$tempDir = ".harness-update-temp"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
git clone --depth 1 https://github.com/OwenM31/Coding-Harness.git $tempDir
```

**Bash:**
```bash
temp_dir=".harness-update-temp"
rm -rf "$temp_dir"
git clone --depth 1 https://github.com/OwenM31/Coding-Harness.git "$temp_dir"
```

Check incoming remote version:

**PowerShell:**
```powershell
$remoteVersion = "unknown"
if (Test-Path "$tempDir/.agent/harness/VERSION") {
    $remoteVersion = (Get-Content "$tempDir/.agent/harness/VERSION" -Raw).Trim()
}
Write-Host "Upstream Version: $remoteVersion"
```

**Bash:**
```bash
remote_version="unknown"
if [ -f "$temp_dir/.agent/harness/VERSION" ]; then
    remote_version=$(cat "$temp_dir/.agent/harness/VERSION" | tr -d '[:space:]')
fi
echo "Upstream Version: $remote_version"
```

If `$ARGUMENTS` contains `--check-only`:
- Compare versions and display update availability.
- Clean up the staging directory and exit without applying changes.

---

## 3. Backup Custom Rules (Safety Check)

If `.agent/harness/PROJECT_RULES.md` has custom project-specific edits, create a timestamped backup before updating:

**PowerShell:**
```powershell
if (Test-Path ".agent/harness/PROJECT_RULES.md") {
    Copy-Item ".agent/harness/PROJECT_RULES.md" ".agent/harness/PROJECT_RULES.md.bak" -Force
}
```

**Bash:**
```bash
if [ -f ".agent/harness/PROJECT_RULES.md" ]; then
    cp ".agent/harness/PROJECT_RULES.md" ".agent/harness/PROJECT_RULES.md.bak"
fi
```

---

## 4. Apply Updates (Preserving Project Memory)

Copy updated components into `.agent/` while strictly ignoring `.agent/state/`:

**PowerShell:**
```powershell
$components = @("workflows", "skills", "harness")
foreach ($comp in $components) {
    $src = Join-Path $tempDir ".agent\$comp"
    $dest = ".agent\$comp"
    if (Test-Path $src) {
        if (-not (Test-Path $dest)) {
            New-Item -ItemType Directory -Path $dest -Force | Out-Null
        }
        Copy-Item -Path "$src\*" -Destination $dest -Recurse -Force
        Write-Host "[UPDATED] .agent/$comp" -ForegroundColor Green
    }
}
Write-Host "[PRESERVED] .agent/state/ untouched (project memory safe)" -ForegroundColor Cyan
```

**Bash:**
```bash
for comp in workflows skills harness; do
    if [ -d "$temp_dir/.agent/$comp" ]; then
        mkdir -p ".agent/$comp"
        cp -r "$temp_dir/.agent/$comp/"* ".agent/$comp/"
        echo "[UPDATED] .agent/$comp"
    fi
done
echo "[PRESERVED] .agent/state/ untouched (project memory safe)"
```

---

## 5. Clean Up Temporary Staging Directory

Remove the temporary clone:

**PowerShell:**
```powershell
Remove-Item -Recurse -Force $tempDir
```

**Bash:**
```bash
rm -rf "$temp_dir"
```

---

## 6. Validate Updated Harness

Run the built-in validation script to verify workflow, skill, and template integrity:

**PowerShell:**
```powershell
if (Test-Path ".agent/harness/scripts/validate-all.ps1") {
    & powershell -ExecutionPolicy Bypass -File .agent/harness/scripts/validate-all.ps1
}
```

**Bash:**
```bash
if [ -f ".agent/harness/scripts/validate-all.sh" ]; then
    bash .agent/harness/scripts/validate-all.sh
fi
```

---

## 7. Display Summary

Display the completion banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HARNESS ► UPDATE COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Version: {currentVersion} ➔ {remoteVersion}

UPDATED COMPONENTS:
• .agent/workflows/   (latest execution playbooks)
• .agent/skills/      (latest reasoning protocols)
• .agent/harness/     (rules, templates, scripts)

PRESERVED PROJECT MEMORY:
🔒 .agent/state/       (SPEC.md, ROADMAP.md, STATE.md, phases/)
   All project plans and execution history remain untouched.

───────────────────────────────────────────────────────

Next steps:
• Run @whats-new.md to view recent features and improvements.
• Run @resume.md to continue working on your active phase.
```

</process>
