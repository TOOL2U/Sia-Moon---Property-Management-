#!/bin/bash

# This script will help set up the Supabase SQL trigger for profile creation

# ASCII colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
RESET='\033[0m'

echo -e "${CYAN}=======================================================${RESET}"
echo -e "${CYAN}     Supabase Profile Trigger Setup Instructions      ${RESET}"
echo -e "${CYAN}=======================================================${RESET}"
echo ""

echo -e "${YELLOW}The automated profile creation trigger is not currently installed.${RESET}"
echo -e "${YELLOW}Here are instructions to add it to your Supabase project:${RESET}"
echo ""

echo -e "${GREEN}1. Log into the Supabase Dashboard:${RESET}"
echo "   https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/sql"
echo ""

echo -e "${GREEN}2. Open the SQL Editor${RESET}"
echo ""

echo -e "${GREEN}3. Copy and paste the following SQL commands:${RESET}"
echo -e "${BLUE}--------------------------------------------------------${RESET}"
echo "-- Function to handle new user creation"
echo "create or replace function public.handle_new_user()"
echo "returns trigger as \$\$"
echo "begin"
echo "  insert into public.profiles (id, email, full_name, role)"
echo "  values ("
echo "    new.id,"
echo "    new.email,"
echo "    coalesce(new.raw_user_meta_data->>'full_name', new.email),"
echo "    coalesce(new.raw_user_meta_data->>'role', 'client')"
echo "  );"
echo "  return new;"
echo "end;"
echo "\$\$ language plpgsql security definer;"
echo ""
echo "-- Trigger to execute the function after a new user is created"
echo "create or replace trigger on_auth_user_created"
echo "  after insert on auth.users"
echo "  for each row execute procedure public.handle_new_user();"
echo -e "${BLUE}--------------------------------------------------------${RESET}"
echo ""

echo -e "${GREEN}4. Click the 'Run' button to execute the SQL${RESET}"
echo ""

echo -e "${GREEN}5. Verify the trigger was created by running this query:${RESET}"
echo -e "${BLUE}--------------------------------------------------------${RESET}"
echo "select * from pg_triggers where tgname = 'on_auth_user_created';"
echo -e "${BLUE}--------------------------------------------------------${RESET}"
echo ""

echo -e "${GREEN}6. After adding the trigger, run this test script again:${RESET}"
echo "   node test-profile-creation.js"
echo ""

echo -e "${CYAN}=======================================================${RESET}"
echo -e "${CYAN}                  End of Instructions                 ${RESET}"
echo -e "${CYAN}=======================================================${RESET}"
