-- Check if admin user exists and has correct permissions
-- Run this in Supabase SQL Editor

-- Check auth.users table
SELECT 
  id, 
  email, 
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'admin@iiitdm.ac.in';

-- Check public.users table
SELECT 
  id, 
  email, 
  name, 
  is_admin, 
  created_at
FROM public.users 
WHERE email = 'admin@iiitdm.ac.in';

-- Check if the user IDs match between auth and public tables
SELECT 
  'auth.users' as table_name,
  id,
  email
FROM auth.users 
WHERE email = 'admin@iiitdm.ac.in'
UNION ALL
SELECT 
  'public.users' as table_name,
  id,
  email
FROM public.users 
WHERE email = 'admin@iiitdm.ac.in';