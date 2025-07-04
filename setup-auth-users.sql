-- Setup Authentication Users for Villa Property Management
-- Run this in your Supabase SQL Editor

-- First, ensure RLS is disabled for setup
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Clear existing users (optional - remove if you want to keep existing data)
-- DELETE FROM users;

-- Create demo users in the users table
-- Note: These will need to be created through the Supabase Auth signup process
-- This script just ensures the profile records exist

-- Insert demo users (these IDs should match the auth.users table after signup)
INSERT INTO users (id, name, email, role) VALUES
  -- Client user
  ('550e8400-e29b-41d4-a716-446655440001', 'John Smith', 'john.smith@example.com', 'client'),
  -- Staff user  
  ('550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', 'sarah.johnson@siamoon.com', 'staff')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Verify users were created
SELECT * FROM users ORDER BY created_at;

-- Re-enable RLS if needed (optional)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Instructions for setting up authentication:
-- 
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" and create:
--    - Email: john.smith@example.com
--    - Password: password123
--    - Confirm password: password123
--    - Auto Confirm User: Yes
--    - User ID: 550e8400-e29b-41d4-a716-446655440001
--
-- 3. Click "Add user" and create:
--    - Email: sarah.johnson@siamoon.com  
--    - Password: password123
--    - Confirm password: password123
--    - Auto Confirm User: Yes
--    - User ID: 550e8400-e29b-41d4-a716-446655440002
--
-- 4. The profile records above will link to these auth users
--
-- Alternative: Use the signup form in your app at /auth/signup
