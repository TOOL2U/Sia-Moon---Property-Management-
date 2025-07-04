-- Create Test User for Villa Property Management
-- Run this in Supabase SQL Editor

-- Step 1: Clean up any existing test data
DELETE FROM public.users WHERE email = 'test@example.com';

-- Step 2: Get the auth user ID (run this after creating the auth user)
-- First create the auth user in Supabase Dashboard, then run this:
SELECT id, email FROM auth.users WHERE email = 'test@example.com';

-- Step 3: Create profile linked to auth user (replace UUID with actual ID from step 2)
-- INSERT INTO public.users (id, name, email, role) VALUES
--   ('REPLACE_WITH_ACTUAL_UUID_FROM_AUTH_USERS', 'Test User', 'test@example.com', 'client');

-- Step 4: Alternative - Create unlinked profile (for testing)
INSERT INTO public.users (name, email, role) VALUES
  ('Test User', 'test@example.com', 'client');

-- Step 5: Verify the user was created
SELECT * FROM public.users WHERE email = 'test@example.com';

-- Instructions:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" and create:
--    - Email: test@example.com
--    - Password: password123
--    - Auto Confirm User: YES (important!)
-- 3. Run this SQL in Supabase SQL Editor
-- 4. Test login at http://localhost:3000/auth/login

-- Debug: Check both tables
SELECT 'auth.users' as table_name, id::text, email, created_at::text FROM auth.users WHERE email = 'test@example.com'
UNION ALL
SELECT 'public.users' as table_name, id::text, email, created_at::text FROM public.users WHERE email = 'test@example.com';
