#!/bin/bash

# Backup script to preserve beautiful designs before making changes
# Usage: ./scripts/backup-before-changes.sh "description-of-changes"

if [ -z "$1" ]; then
    echo "❌ Error: Please provide a description of the changes you're about to make"
    echo "Usage: ./scripts/backup-before-changes.sh 'description-of-changes'"
    exit 1
fi

DESCRIPTION="$1"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=".backups/${TIMESTAMP}_${DESCRIPTION// /_}"

echo "📦 Creating backup before changes: $DESCRIPTION"
echo "📁 Backup directory: $BACKUP_DIR"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup key directories that often get modified
echo "🔄 Backing up src/app..."
cp -r src/app "$BACKUP_DIR/"

echo "🔄 Backing up src/components..."
cp -r src/components "$BACKUP_DIR/"

echo "🔄 Backing up src/contexts..."
if [ -d "src/contexts" ]; then
    cp -r src/contexts "$BACKUP_DIR/"
fi

echo "🔄 Backing up src/hooks..."
if [ -d "src/hooks" ]; then
    cp -r src/hooks "$BACKUP_DIR/"
fi

echo "🔄 Backing up src/lib..."
if [ -d "src/lib" ]; then
    cp -r src/lib "$BACKUP_DIR/"
fi

# Create a restore script
cat > "$BACKUP_DIR/restore.sh" << EOF
#!/bin/bash
echo "🔄 Restoring from backup: $DESCRIPTION"
echo "⚠️  This will overwrite current files. Are you sure? (y/N)"
read -r response
if [[ "\$response" =~ ^[Yy]$ ]]; then
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
EOF

chmod +x "$BACKUP_DIR/restore.sh"

# Create a README for the backup
cat > "$BACKUP_DIR/README.md" << EOF
# Backup: $DESCRIPTION

**Created:** $(date)
**Description:** $DESCRIPTION

## Contents
- \`app/\` - All pages and API routes
- \`components/\` - UI components and layouts
- \`contexts/\` - React contexts (if exists)
- \`hooks/\` - Custom React hooks (if exists)
- \`lib/\` - Utility libraries and services (if exists)

## How to Restore
Run the restore script:
\`\`\`bash
cd $BACKUP_DIR
./restore.sh
\`\`\`

Or manually copy files back to their original locations.
EOF

echo "✅ Backup completed successfully!"
echo "📁 Location: $BACKUP_DIR"
echo "🔄 To restore later, run: cd $BACKUP_DIR && ./restore.sh"
echo ""
echo "💡 Tip: Always create a backup before major refactoring or debugging!"
