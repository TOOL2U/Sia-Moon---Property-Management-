#!/bin/bash

###############################################################################
# Firebase Rules Management Script
# Easily switch between development and production Firestore rules
###############################################################################

echo "🔥 Firebase Rules Management"
echo "============================="
echo ""
echo "Available commands:"
echo "  dev       - Switch to development rules (relaxed security)"
echo "  prod      - Switch to production rules (secure)"
echo "  backup    - Backup current rules"
echo "  status    - Show current rule status"
echo ""

case "$1" in
  "dev")
    echo "🔧 Switching to DEVELOPMENT rules..."
    echo "⚠️  WARNING: This allows broad access for development only!"
    
    # Backup current rules
    cp firestore.rules firestore.rules.backup
    
    # Switch to dev rules
    cp firestore.rules.dev firestore.rules
    
    # Deploy
    firebase deploy --only firestore:rules
    
    echo ""
    echo "✅ Development rules deployed!"
    echo "📋 Current rules: DEVELOPMENT (relaxed security)"
    echo "⚠️  Remember to switch back to production rules before going live!"
    ;;
    
  "prod")
    echo "🔒 Switching to PRODUCTION rules..."
    
    # Backup current rules
    cp firestore.rules firestore.rules.backup
    
    # Switch to production rules
    cp firestore.rules.production firestore.rules
    
    # Deploy
    firebase deploy --only firestore:rules
    
    echo ""
    echo "✅ Production rules deployed!"
    echo "📋 Current rules: PRODUCTION (secure)"
    echo "🔒 Full security is now active"
    ;;
    
  "backup")
    echo "💾 Backing up current rules..."
    cp firestore.rules "firestore.rules.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Rules backed up!"
    ;;
    
  "status")
    echo "📋 Firebase Rules Status"
    echo "========================"
    echo ""
    
    if cmp -s firestore.rules firestore.rules.dev; then
      echo "🔧 Current Mode: DEVELOPMENT"
      echo "📄 Rule File: firestore.rules.dev"
      echo "⚠️  Security: RELAXED (development only)"
      echo "🔓 Access: Authenticated users can read/write all data"
    elif cmp -s firestore.rules firestore.rules.production; then
      echo "🔒 Current Mode: PRODUCTION"
      echo "📄 Rule File: firestore.rules.production"
      echo "✅ Security: SECURE (production ready)"
      echo "🛡️  Access: Role-based permissions enforced"
    else
      echo "❓ Current Mode: CUSTOM"
      echo "📄 Rule File: firestore.rules (modified)"
      echo "⚠️  Security: UNKNOWN"
    fi
    
    echo ""
    echo "📁 Available rule files:"
    ls -la firestore.rules*
    ;;
    
  *)
    echo "❌ Invalid command. Use: dev, prod, backup, or status"
    echo ""
    echo "Examples:"
    echo "  ./firebase-rules.sh dev     # Switch to development rules"
    echo "  ./firebase-rules.sh prod    # Switch to production rules"
    echo "  ./firebase-rules.sh status  # Check current status"
    exit 1
    ;;
esac
