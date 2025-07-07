-- Temporarily disable the auth trigger to test user creation

-- Drop the trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
