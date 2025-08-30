# 🏋️ Gym Booking System - Backend Documentation

## 📁 File Structure

### Database Setup Files
- **`fix-admin-permissions.sql`** - Complete admin user setup and RLS policies
- **`optimized-functions.sql`** - High-performance database functions for fast loading

### Documentation
- **`SUPABASE_SETUP.md`** - Complete Supabase database setup guide
- **`ADMIN_FIX_INSTRUCTIONS.md`** - Step-by-step admin setup instructions
- **`setup-optimized-backend.md`** - Performance optimization setup guide

## 🚀 Quick Setup

### 1. Database Setup
```sql
-- Run this in Supabase SQL Editor
\i fix-admin-permissions.sql
```

### 2. Performance Optimization (Optional)
```sql
-- Run this for faster loading
\i optimized-functions.sql
```

### 3. Admin Access
- **Email**: admin@iiitdm.ac.in
- **Password**: admin123
- **Dashboard**: `/admin/dashboard`

## 📊 Database Schema

### Core Tables
- **`users`** - Student user accounts
- **`slots`** - Gym time slots (date, time, capacity, blocked status)
- **`bookings`** - User slot reservations
- **`feedback`** - User feedback and complaints

### Key Features
- **Row Level Security (RLS)** - Secure data access
- **Admin Functions** - Special permissions for admin operations
- **Optimized Queries** - Fast data loading with minimal database calls

## 🔧 Admin Functions

### Slot Management
- View all slots in calendar format
- Block/unblock slots for maintenance
- See booking counts and user details
- Navigate between weeks/months

### User Management
- View all user bookings
- See user feedback and complaints
- Update feedback status (new/reviewed/resolved)

### Performance Features
- Single-query data loading
- Optimistic UI updates
- Real-time slot status updates

## 🛠️ Troubleshooting

### Common Issues
1. **Admin can't access slots** → Run `fix-admin-permissions.sql`
2. **Slow loading** → Run `optimized-functions.sql`
3. **Toggle buttons not working** → Check admin authentication
4. **Missing slots** → Slots are auto-created for current week

### Debug Tools
- Browser console shows detailed logs
- Admin dashboard has permission test button
- Error messages show specific database issues

## 📈 Performance Metrics

### Before Optimization
- 30+ database queries per page load
- 5-10 second loading times
- Individual booking queries for each slot

### After Optimization
- 1-2 database queries per page load
- Under 1 second loading times
- Bulk data loading with JOINs

## 🔐 Security

### Admin Access
- Secure authentication required
- RLS policies protect user data
- Admin functions use `SECURITY DEFINER`

### User Protection
- Users can only see their own bookings
- Blocked slots prevent new bookings
- Feedback is properly attributed to users