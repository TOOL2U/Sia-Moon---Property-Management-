#!/bin/bash

###############################################################################
# Simple Admin User Creation Script
# This script helps you create an admin account for Sia Moon Property Management
###############################################################################

echo "🏗️  Sia Moon Admin User Creation"
echo "=================================="
echo ""

# Default values
DEFAULT_EMAIL="admin@siamoon.com"
DEFAULT_PASSWORD="Admin123!"
DEFAULT_NAME="Admin User"

# Get user input
read -p "Enter admin email [${DEFAULT_EMAIL}]: " email
email=${email:-$DEFAULT_EMAIL}

read -sp "Enter admin password (min 6 chars) [${DEFAULT_PASSWORD}]: " password
echo ""
password=${password:-$DEFAULT_PASSWORD}

read -p "Enter full name [${DEFAULT_NAME}]: " fullname
fullname=${fullname:-$DEFAULT_NAME}

echo ""
echo "📋 Creating admin user with:"
echo "   Email: $email"
echo "   Name: $fullname"
echo ""

# Instructions
echo "🔐 STEP 1: Sign up through Firebase"
echo "=================================="
echo ""
echo "Please follow these steps:"
echo ""
echo "1. Open your browser and go to: http://localhost:3000/auth/signup"
echo ""
echo "2. Fill in the signup form with:"
echo "   - Email: $email"
echo "   - Password: $password"
echo "   - Full Name: $fullname"
echo "   - Role: Select 'Client' (we'll upgrade to admin in the next step)"
echo ""
echo "3. Click 'Sign Up'"
echo ""
read -p "Press ENTER when you've completed the signup..."

echo ""
echo "🎯 STEP 2: Grant admin privileges"
echo "=================================="
echo ""
echo "Now we'll grant admin privileges to your account."
echo ""
echo "Option A - Use the Admin Setup Page (Recommended):"
echo "   1. Go to: http://localhost:3000/admin-setup"
echo "   2. Click 'Check Status' to verify your account"
echo "   3. Click 'Setup Admin User' to grant admin role"
echo ""
echo "Option B - Direct Firebase Console:"
echo "   1. Go to Firebase Console: https://console.firebase.google.com"
echo "   2. Select your project: sia-moon-sanctuary"
echo "   3. Go to Firestore Database"
echo "   4. Find the 'users' collection"
echo "   5. Find the document with email: $email"
echo "   6. Edit the document and set 'role' to 'admin'"
echo ""
read -p "Press ENTER when you've completed this step..."

echo ""
echo "✅ Admin Setup Complete!"
echo "========================"
echo ""
echo "You can now login with:"
echo "   Email: $email"
echo "   Password: $password"
echo ""
echo "Login URL: http://localhost:3000/auth/login"
echo ""
