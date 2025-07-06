-- Check existing auth users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC;

-- Check profiles table
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
ORDER BY created_at DESC;
