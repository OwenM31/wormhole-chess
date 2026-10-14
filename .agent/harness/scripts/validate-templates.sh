#!/bin/bash
# Coding Harness Template Validation Script
# Validates all template files

error_count=0
warning_count=0
templates_checked=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " HARNESS ► VALIDATING TEMPLATES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

script_dir="$(dirname "$0")"
target_dir=""

if [ -d "$script_dir/../templates" ]; then
    target_dir="$script_dir/../templates"
elif [ -d "$script_dir/../../harness/templates" ]; then
    target_dir="$script_dir/../../harness/templates"
elif [ -d ".agent/harness/templates" ]; then
    target_dir=".agent/harness/templates"
elif [ -d ".agent/templates" ]; then
    target_dir=".agent/templates"
elif [ -d "templates" ]; then
    target_dir="templates"
fi

if [ -z "$target_dir" ]; then
    echo "❌ Could not locate templates directory"
    exit 1
fi

for file in "$target_dir"/*.md; do
    [ -e "$file" ] || continue
    ((templates_checked++))
    filename=$(basename "$file")
    has_errors=false
    
    # Check for title (# heading)
    if ! head -1 "$file" | grep -q "^# "; then
        echo "❌ $filename: Missing title (# heading)"
        ((error_count++))
        has_errors=true
    fi
    
    # Check for Last updated marker
    if ! grep -q "Last updated" "$file"; then
        echo "⚠️  $filename: Missing 'Last updated' marker"
        ((warning_count++))
    fi
    
    # Check minimum length
    file_size=$(wc -c < "$file")
    if [ "$file_size" -lt 200 ]; then
        echo "⚠️  $filename: Very short template (<200 chars)"
        ((warning_count++))
    fi
    
    if [ "$has_errors" = false ]; then
        echo "✅ $filename"
    fi
done

echo ""
echo "───────────────────────────────────────────────────────"
echo ""
echo "Templates checked: $templates_checked"
echo "Errors: $error_count"
echo "Warnings: $warning_count"
echo ""

if [ $error_count -eq 0 ]; then
    echo "✅ All templates valid!"
    exit 0
else
    echo "❌ Validation failed"
    exit 1
fi
