-- Manual Admin User Creation
-- Run this in Supabase SQL Editor to create an admin user directly

-- First, insert into auth.users (this bypasses email confirmation)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@iiitdm.ac.in',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Admin", "is_admin": true}',
  false,
  'authenticated'
);

-- Then insert into public.users table
INSERT INTO public.users (
  id,
  email,
  name,
  is_admin,
  created_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@iiitdm.ac.in'),
  'admin@iiitdm.ac.in',
  'Admin',
  true,
  NOW()
);

-- Verify the admin user was created
SELECT * FROM public.users WHERE is_admin = true;