#!/bin/bash
echo "🔄 Restoring from backup: restoring_beautiful_main_pages_and_implementing_auth_navbar"
echo "⚠️  This will overwrite current files. Are you sure? (y/N)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    cp -r app/* ../../../src/app/
    cp -r components/* ../../../src/components/
    if [ -d "contexts" ]; then
        cp -r contexts/* ../../../src/contexts/
    fi
    if [ -d "hooks" ]; then
        cp -r hooks/* ../../../src/hooks/
    fi
    if [ -d "lib" ]; then
        cp -r lib/* ../../../src/lib/
    fi
    echo "✅ Restore completed!"
else
    echo "❌ Restore cancelled"
fi
