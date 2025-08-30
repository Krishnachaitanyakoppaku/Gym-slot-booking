-- Complete fix for admin permissions
-- Run this in Supabase SQL Editor to fix all admin issues

-- 1. Ensure admin user exists in users table (skip auth.users - too complex)
-- First check if admin exists, if not create, if exists update
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@iiitdm.ac.in') THEN
        INSERT INTO users (id, email, name, is_admin, created_at)
        VALUES (
            gen_random_uuid(),
            'admin@iiitdm.ac.in',
            'Admin User',
            true,
            now()
        );
    ELSE
        UPDATE users 
        SET is_admin = true, name = 'Admin User'
        WHERE email = 'admin@iiitdm.ac.in';
    END IF;
END $$;

-- 3. Drop all existing RLS policies that might be blocking admin
DROP POLICY IF EXISTS "Users can only read available slots" ON slots;
DROP POLICY IF EXISTS "Only authenticated users can read slots" ON slots;
DROP POLICY IF EXISTS "Admin can manage all slots" ON slots;
DROP POLICY IF EXISTS "Admins can insert slots" ON slots;
DROP POLICY IF EXISTS "Admins can update slots" ON slots;
DROP POLICY IF EXISTS "Admins can delete slots" ON slots;
DROP POLICY IF EXISTS "Admin can read all slots" ON slots;
DROP POLICY IF EXISTS "Admin can insert slots" ON slots;
DROP POLICY IF EXISTS "Admin can update slots" ON slots;
DROP POLICY IF EXISTS "Admin can delete slots" ON slots;

-- 4. Create comprehensive admin policies for slots
CREATE POLICY "Admin full access to slots" ON slots
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

-- 5. Allow regular users to read non-blocked slots
CREATE POLICY "Users can read available slots" ON slots
    FOR SELECT
    TO authenticated
    USING (
        -- Admin can see all slots
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
        OR 
        -- Regular users can see all slots (including blocked ones for visibility)
        true
    );

-- 6. Fix bookings policies
DROP POLICY IF EXISTS "Users can manage their own bookings" ON bookings;
DROP POLICY IF EXISTS "Admin can see all bookings" ON bookings;

CREATE POLICY "Admin can see all bookings" ON bookings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
        OR 
        user_id = auth.uid()
    );

CREATE POLICY "Users can create their own bookings" ON bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own bookings" ON bookings
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 7. Fix feedback policies
DROP POLICY IF EXISTS "Users can manage their own feedback" ON feedback;
DROP POLICY IF EXISTS "Admin can see all feedback" ON feedback;

CREATE POLICY "Admin can manage all feedback" ON feedback
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
        OR 
        user_id = auth.uid()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
        OR 
        user_id = auth.uid()
    );

-- 8. Create admin bypass function for slot toggle
CREATE OR REPLACE FUNCTION admin_toggle_slot(
    slot_date DATE,
    slot_time_slot TEXT
)
RETURNS TABLE(
    id UUID,
    date DATE,
    time_slot TEXT,
    capacity INTEGER,
    is_blocked BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS
AS $$
DECLARE
    current_user_id UUID;
    is_user_admin BOOLEAN;
    existing_slot RECORD;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Check if user is admin
    SELECT users.is_admin INTO is_user_admin
    FROM users 
    WHERE users.id = current_user_id;
    
    -- Only allow admin users
    IF NOT COALESCE(is_user_admin, false) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    -- Check if slot exists
    SELECT * INTO existing_slot
    FROM slots s
    WHERE s.date = slot_date 
    AND s.time_slot = slot_time_slot;
    
    -- If slot doesn't exist, create it as blocked
    IF existing_slot IS NULL THEN
        RETURN QUERY
        INSERT INTO slots (date, time_slot, capacity, is_blocked)
        VALUES (slot_date, slot_time_slot, 30, true)
        RETURNING slots.id, slots.date, slots.time_slot, slots.capacity, slots.is_blocked, slots.created_at;
    ELSE
        -- Toggle existing slot
        RETURN QUERY
        UPDATE slots 
        SET is_blocked = NOT existing_slot.is_blocked
        WHERE slots.date = slot_date 
        AND slots.time_slot = slot_time_slot
        RETURNING slots.id, slots.date, slots.time_slot, slots.capacity, slots.is_blocked, slots.created_at;
    END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION admin_toggle_slot(DATE, TEXT) TO authenticated;

-- 9. Verify admin setup
SELECT 
    'Admin user check:' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM users 
            WHERE email = 'admin@iiitdm.ac.in' 
            AND is_admin = true
        ) THEN 'ADMIN USER EXISTS ✓' 
        ELSE 'ADMIN USER MISSING ✗' 
    END as result;

-- 10. Test admin permissions
SELECT 
    'Admin slot access:' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM slots LIMIT 1
        ) THEN 'CAN ACCESS SLOTS ✓' 
        ELSE 'CANNOT ACCESS SLOTS ✗' 
    END as result;

SELECT 'Admin permissions fixed successfully!' as status;