-- Fix admin user issues
-- Run this in Supabase SQL Editor if the admin user exists but has issues

-- First, let's make sure the admin user in public.users has the correct is_admin flag
UPDATE public.users 
SET is_admin = true 
WHERE email = 'admin@iiitdm.ac.in';

-- If the public.users record doesn't exist but auth.users does, create it
INSERT INTO public.users (
  id,
  email,
  name,
  is_admin,
  created_at
) 
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'Admin'),
  true,
  NOW()
FROM auth.users au
WHERE au.email = 'admin@iiitdm.ac.in'
AND NOT EXISTS (
  SELECT 1 FROM public.users pu 
  WHERE pu.id = au.id
);

-- Verify the fix
SELECT 
  pu.id,
  pu.email,
  pu.name,
  pu.is_admin,
  au.email_confirmed_at
FROM public.users pu
JOIN auth.users au ON pu.id = au.id
WHERE pu.email = 'admin@iiitdm.ac.in';