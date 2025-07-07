#!/bin/bash

# ASCII colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RESET='\033[0m'

echo -e "${CYAN}=======================================================${RESET}"
echo -e "${CYAN}     Environment Variable Status Check                ${RESET}"
echo -e "${CYAN}=======================================================${RESET}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo -e "${RED}❌ .env.local file not found!${RESET}"
  echo -e "${YELLOW}This file should contain all your environment variables.${RESET}"
  echo -e "${YELLOW}Please create it based on .env.example${RESET}"
  exit 1
fi

echo -e "${GREEN}✓ .env.local file found${RESET}"
echo ""

# Define categories and their variables (simpler approach)
SUPABASE_VARS="NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY"
APP_VARS="NEXT_PUBLIC_APP_URL NODE_ENV"
CLOUDINARY_VARS="NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET"
EMAIL_VARS="SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS FROM_EMAIL FROM_NAME"
WEBHOOK_VARS="NEXT_PUBLIC_MAKE_WEBHOOK_URL"

# Function to check variables
check_variables() {
  local category=$1
  shift
  local variables=$@
  local missing=false
  
  echo -e "${BLUE}$category Configuration:${RESET}"
  
  for var in $variables; do
    value=$(grep -E "^$var=" .env.local | cut -d '=' -f2-)
    if [ -z "$value" ]; then
      echo -e "  ${RED}❌ $var is missing${RESET}"
      missing=true
    else
      # Mask sensitive values
      if [[ "$var" == *"KEY"* || "$var" == *"SECRET"* || "$var" == *"PASS"* ]]; then
        echo -e "  ${GREEN}✓ $var is set ${YELLOW}(value hidden)${RESET}"
      else
        echo -e "  ${GREEN}✓ $var is set${RESET} to '$value'"
      fi
    fi
  done
  
  if [ "$missing" = true ]; then
    echo -e "  ${YELLOW}⚠️  Some variables in this category are missing${RESET}"
  else
    echo -e "  ${GREEN}✓ All variables in this category are set${RESET}"
  fi
  echo ""
}

# Check each category
check_variables "SUPABASE" $SUPABASE_VARS
check_variables "APPLICATION" $APP_VARS
check_variables "CLOUDINARY" $CLOUDINARY_VARS
check_variables "EMAIL" $EMAIL_VARS
check_variables "WEBHOOK" $WEBHOOK_VARS

echo -e "${CYAN}=======================================================${RESET}"
echo -e "${CYAN}     Environment Check Complete                       ${RESET}"
echo -e "${CYAN}=======================================================${RESET}"
echo ""
echo -e "${YELLOW}Reminder: Make sure the same environment variables are set${RESET}"
echo -e "${YELLOW}in your production deployment environment as well.${RESET}"
