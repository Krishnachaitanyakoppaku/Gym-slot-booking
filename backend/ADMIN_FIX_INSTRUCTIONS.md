# Admin Dashboard Fix Instructions

## 🚨 **Current Issues**
1. Admin cannot block/unblock slots
2. Admin cannot see user bookings
3. Slot toggle buttons don't work

## 🔧 **Complete Fix**

### **Step 1: Run Database Fix**
Go to your **Supabase SQL Editor** and run this file:
```
backend/fix-admin-permissions.sql
```

This will:
- ✅ Create proper admin user
- ✅ Fix all RLS policies
- ✅ Create admin bypass function
- ✅ Grant proper permissions

### **Step 2: Test the Fix**
Run this test script:
```bash
cd backend
node test-admin-complete.js
```

### **Step 3: Verify in App**
1. **Login as admin**: `admin@iiitdm.ac.in` / `admin123`
2. **Go to admin dashboard**: `/admin/dashboard`
3. **Test slot toggle**: Click "Block" button on any slot
4. **Check booking visibility**: Click on slots to see bookings

## 🎯 **Expected Results After Fix**

### **Slot Toggle**
- ✅ Click "Block" → Slot turns red immediately
- ✅ Click "Open" → Slot turns green immediately
- ✅ Button shows "..." while processing
- ✅ No console errors

### **Booking Visibility**
- ✅ Click any slot → See modal with booking details
- ✅ See list of students who booked
- ✅ See student names, emails, IDs
- ✅ See user feedback from those students

### **User Experience**
- ✅ Users see blocked slots as gray "BLOCKED"
- ✅ Users cannot click blocked slots
- ✅ Booking validation prevents booking blocked slots

## 🔍 **If Still Not Working**

### **Check Console Errors**
1. Press `F12` → Console tab
2. Look for red error messages
3. Common errors:
   - `"function does not exist"` → Run the SQL fix
   - `"permission denied"` → RLS policies not updated
   - `"authentication required"` → Re-login as admin

### **Verify Database Setup**
Run these queries in Supabase SQL Editor:

```sql
-- Check admin user exists
SELECT id, email, is_admin FROM users WHERE email = 'admin@iiitdm.ac.in';

-- Check admin function exists
SELECT proname FROM pg_proc WHERE proname = 'admin_toggle_slot';

-- Check RLS policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'slots';
```

### **Manual Test**
Try this in Supabase SQL Editor:
```sql
-- Test admin bypass function
SELECT * FROM admin_toggle_slot('2024-01-15', '5:00 - 6:00 AM');
```

## 📋 **Root Cause Analysis**

The issues were caused by:
1. **Restrictive RLS policies** blocking admin operations
2. **Missing admin bypass functions** for slot operations
3. **Incorrect permission setup** for admin user

The fix creates:
1. **Comprehensive admin policies** allowing full access
2. **Admin bypass function** that ignores RLS
3. **Proper admin user setup** with correct permissions

## 🚀 **After Running the Fix**

The admin dashboard will have:
- **Working slot toggle** with visual feedback
- **Complete booking visibility** with user details
- **Feedback integration** showing user complaints
- **Reliable database operations** without permission errors

Run the SQL fix and test - the admin functionality should work perfectly!