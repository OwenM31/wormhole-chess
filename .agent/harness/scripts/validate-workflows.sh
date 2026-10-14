#!/bin/bash
# Coding Harness Workflow Validation Script
# Validates all workflow files for required structure

error_count=0
warning_count=0
workflows_checked=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " HARNESS ► VALIDATING WORKFLOWS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

script_dir="$(dirname "$0")"
target_dir=""

if [ -d "$script_dir/../../workflows" ]; then
    target_dir="$script_dir/../../workflows"
elif [ -d "$script_dir/../workflows" ]; then
    target_dir="$script_dir/../workflows"
elif [ -d ".agent/workflows" ]; then
    target_dir=".agent/workflows"
elif [ -d "workflows" ]; then
    target_dir="workflows"
fi

if [ -z "$target_dir" ]; then
    echo "❌ Could not locate workflows directory"
    exit 1
fi

for file in "$target_dir"/*.md; do
    [ -e "$file" ] || continue
    ((workflows_checked++))
    filename=$(basename "$file")
    has_errors=false
    
    # Check for frontmatter
    if ! head -1 "$file" | grep -q "^---"; then
        echo "❌ $filename: Missing frontmatter"
        ((error_count++))
        has_errors=true
    fi
    
    # Check for description
    if ! grep -q "description:" "$file"; then
        echo "❌ $filename: Missing description in frontmatter"
        ((error_count++))
        has_errors=true
    fi
    
    # Check for process tags
    if ! grep -q "<process>" "$file"; then
        echo "⚠️  $filename: Missing <process> tag"
        ((warning_count++))
    fi
    
    if [ "$has_errors" = false ]; then
        echo "✅ $filename"
    fi
done

echo ""
echo "───────────────────────────────────────────────────────"
echo ""
echo "Workflows checked: $workflows_checked"
echo "Errors: $error_count"
echo "Warnings: $warning_count"
echo ""

if [ $error_count -eq 0 ]; then
    echo "✅ All workflows valid!"
    exit 0
else
    echo "❌ Validation failed"
    exit 1
fi
