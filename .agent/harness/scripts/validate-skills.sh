#!/bin/bash
# Coding Harness Skill Validation Script
# Validates all skill directories for required structure

error_count=0
warning_count=0
skills_checked=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " HARNESS ► VALIDATING SKILLS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

script_dir="$(dirname "$0")"
target_dir=""

if [ -d "$script_dir/../../skills" ]; then
    target_dir="$script_dir/../../skills"
elif [ -d "$script_dir/../skills" ]; then
    target_dir="$script_dir/../skills"
elif [ -d ".agent/skills" ]; then
    target_dir=".agent/skills"
elif [ -d "skills" ]; then
    target_dir="skills"
fi

if [ -z "$target_dir" ]; then
    echo "❌ Could not locate skills directory"
    exit 1
fi

for skill in "$target_dir"/*/; do
    [ -d "$skill" ] || continue
    ((skills_checked++))
    skill_name=$(basename "$skill")
    skill_file="$skill/SKILL.md"
    has_errors=false
    
    # Check SKILL.md exists
    if [ ! -f "$skill_file" ]; then
        echo "❌ $skill_name: Missing SKILL.md"
        ((error_count++))
        continue
    fi
    
    # Check for frontmatter
    if ! head -1 "$skill_file" | grep -q "^---"; then
        echo "❌ $skill_name: Missing frontmatter"
        ((error_count++))
        has_errors=true
    fi
    
    # Check for name field
    if ! grep -q "name:" "$skill_file"; then
        echo "❌ $skill_name: Missing name in frontmatter"
        ((error_count++))
        has_errors=true
    fi
    
    # Check for description field
    if ! grep -q "description:" "$skill_file"; then
        echo "❌ $skill_name: Missing description in frontmatter"
        ((error_count++))
        has_errors=true
    fi
    
    if [ "$has_errors" = false ]; then
        echo "✅ $skill_name"
    fi
done

echo ""
echo "───────────────────────────────────────────────────────"
echo ""
echo "Skills checked: $skills_checked"
echo "Errors: $error_count"
echo ""

if [ $error_count -eq 0 ]; then
    echo "✅ All skills valid!"
    exit 0
else
    echo "❌ Validation failed"
    exit 1
fi
