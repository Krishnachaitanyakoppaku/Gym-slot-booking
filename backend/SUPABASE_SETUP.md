# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Choose organization and enter:
   - **Name**: `iiitdm-gym-management`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your location
5. Click "Create new project"

## 2. Get Project Credentials

1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

## 3. Setup Environment Variables

1. Create `.env` file in your project root:

```bash
cp .env.example .env
```

2. Edit `.env` and add your credentials:

```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. Create Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Copy the entire content from `database/schema.sql`
3. Paste it in the SQL editor
4. Click **Run** to execute

## 5. Configure Authentication

1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add: `http://localhost:3000`
3. Under **Redirect URLs**, add: `http://localhost:3000/**`
4. **Email Templates**: Customize if needed (optional)

## 6. Test the Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

3. Try creating an account and logging in

## 7. Create Admin User (Optional)

After setting up, you can create an admin user by:

1. Sign up normally through the app
2. Go to **Authentication** → **Users** in Supabase dashboard
3. Find your user and click to edit
4. In **Raw User Meta Data**, add:

```json
{
  "name": "Your Name",
  "is_admin": true
}
```

5. Update the `users` table directly in **Table Editor**:
   - Set `is_admin` to `true` for your user

## 8. Production Deployment

When deploying to production:

1. Update **Site URL** and **Redirect URLs** in Auth settings
2. Add production domain to allowed origins
3. Update environment variables in your hosting platform

## Database Tables Created

- **users**: User profiles and admin flags
- **slots**: Gym time slots with capacity and blocking
- **bookings**: User bookings for specific slots
- **feedback**: User feedback and complaints

## Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Admin Policies**: Admins can manage all data
- **Automatic User Creation**: User profile created on signup
- **Data Validation**: Constraints and checks in place

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Check your environment variables
2. **"Row Level Security"**: Make sure RLS policies are applied
3. **"User not found"**: Check if user profile was created in `users` table
4. **CORS errors**: Verify Site URL and Redirect URLs in Auth settings

### Useful SQL Queries:

```sql
-- Check if user profiles are created
SELECT * FROM users;

-- View all slots
SELECT * FROM slots ORDER BY date, time_slot;

-- Check bookings with user info
SELECT b.*, u.name, u.email, s.date, s.time_slot
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN slots s ON b.slot_id = s.id;

-- View feedback
SELECT * FROM feedback ORDER BY created_at DESC;
```
