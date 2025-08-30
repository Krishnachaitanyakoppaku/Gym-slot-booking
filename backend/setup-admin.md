# Admin User Setup Instructions

## The Issue
Your database updates aren't working because the admin authentication is using a mock system that doesn't actually authenticate with Supabase. The Row Level Security (RLS) policies in your database require proper authentication.

## Solution
You need to create a real admin user in your Supabase database.

## Steps to Fix:

### 1. Go to your Supabase Dashboard
- Open https://supabase.com/dashboard
- Navigate to your project: `ovupjxklcorssmpxyzdf`

### 2. Run the Admin Creation Script
- Go to the "SQL Editor" in your Supabase dashboard
- Copy and paste the contents of `database/create_admin.sql`
- Click "Run" to execute the script

### 3. Verify the Admin User
After running the script, you should see:
- A new user in the Authentication > Users section with email `admin@iiitdm.ac.in`
- A new row in your `users` table with `is_admin = true`

### 4. Test the Fix
1. Go to `/debug` in your app (http://localhost:3000/debug)
2. Click "Test Connection" - should show success
3. Click "Check RLS/Permissions" - should show access to slots
4. Click "Test Slot Toggle" - should show the toggle working
5. Login as admin and try toggling slots - should now persist!

## Alternative: Disable RLS Temporarily (Not Recommended)
If you want to test without setting up the admin user, you can temporarily disable RLS:

```sql
-- In Supabase SQL Editor, run:
ALTER TABLE slots DISABLE ROW LEVEL SECURITY;
```

But this is not secure and should only be used for testing.

## What Changed
- Updated `authService.ts` to use real Supabase authentication for admin
- Updated `Login.tsx` to properly handle admin authentication
- Added debug component to help troubleshoot database issues

The admin login will now:
1. Authenticate with Supabase using real credentials
2. Verify admin privileges in the database
3. Set proper session for RLS policies to work