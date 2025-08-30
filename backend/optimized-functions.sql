-- =====================================================
-- OPTIMIZED DATABASE FUNCTIONS FOR FAST LOADING
-- =====================================================

-- Function 1: Get all slots with booking counts in one query
CREATE OR REPLACE FUNCTION get_slots_with_bookings(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  id UUID,
  date DATE,
  time_slot TEXT,
  capacity INTEGER,
  is_blocked BOOLEAN,
  created_at TIMESTAMPTZ,
  booking_count BIGINT,
  bookings JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.date,
    s.time_slot,
    s.capacity,
    s.is_blocked,
    s.created_at,
    COALESCE(booking_counts.count, 0) as booking_count,
    COALESCE(booking_details.bookings, '[]'::jsonb) as bookings
  FROM slots s
  LEFT JOIN (
    SELECT 
      b.date,
      b.time_slot,
      COUNT(*) as count
    FROM bookings b
    WHERE b.date BETWEEN start_date AND end_date
    GROUP BY b.date, b.time_slot
  ) booking_counts ON s.date = booking_counts.date AND s.time_slot = booking_counts.time_slot
  LEFT JOIN (
    SELECT 
      b.date,
      b.time_slot,
      jsonb_agg(
        jsonb_build_object(
          'id', b.id,
          'user_id', b.user_id,
          'created_at', b.created_at,
          'user', jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'student_id', u.student_id
          )
        )
      ) as bookings
    FROM bookings b
    LEFT JOIN users u ON b.user_id = u.id
    WHERE b.date BETWEEN start_date AND end_date
    GROUP BY b.date, b.time_slot
  ) booking_details ON s.date = booking_details.date AND s.time_slot = booking_details.time_slot
  WHERE s.date BETWEEN start_date AND end_date
  ORDER BY s.date, s.time_slot;
END;
$$;

-- Function 2: Fast admin slot toggle with immediate return
CREATE OR REPLACE FUNCTION admin_toggle_slot_fast(
  slot_id UUID
)
RETURNS TABLE (
  id UUID,
  date DATE,
  time_slot TEXT,
  capacity INTEGER,
  is_blocked BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Toggle the slot and return the updated row
  RETURN QUERY
  UPDATE slots 
  SET is_blocked = NOT is_blocked
  WHERE slots.id = slot_id
  RETURNING slots.id, slots.date, slots.time_slot, slots.capacity, slots.is_blocked, slots.created_at;
END;
$$;

-- Function 3: Initialize week slots efficiently
CREATE OR REPLACE FUNCTION initialize_week_slots(
  start_date DATE,
  end_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  time_slots TEXT[] := ARRAY[
    '5:00 - 6:00 AM',
    '6:00 - 7:00 AM', 
    '7:00 - 8:00 AM',
    '6:00 - 7:00 PM',
    '8:00 - 9:00 PM',
    '9:00 - 10:00 PM'
  ];
  current_date DATE;
  slot_time TEXT;
  inserted_count INTEGER := 0;
BEGIN
  -- Loop through each date in the range
  current_date := start_date;
  WHILE current_date <= end_date LOOP
    -- Loop through each time slot
    FOREACH slot_time IN ARRAY time_slots LOOP
      -- Insert slot if it doesn't exist
      INSERT INTO slots (date, time_slot, capacity, is_blocked)
      VALUES (current_date, slot_time, 30, false)
      ON CONFLICT (date, time_slot) DO NOTHING;
      
      -- Count successful inserts
      IF FOUND THEN
        inserted_count := inserted_count + 1;
      END IF;
    END LOOP;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN inserted_count;
END;
$$;

-- Function 4: Get current week data (optimized for dashboard)
CREATE OR REPLACE FUNCTION get_current_week_admin_data()
RETURNS TABLE (
  id UUID,
  date DATE,
  time_slot TEXT,
  capacity INTEGER,
  is_blocked BOOLEAN,
  created_at TIMESTAMPTZ,
  booking_count BIGINT,
  bookings JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  monday_date DATE;
  sunday_date DATE;
BEGIN
  -- Calculate current week (Monday to Sunday)
  monday_date := CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE) - 1)::INTEGER;
  sunday_date := monday_date + INTERVAL '6 days';
  
  -- Initialize slots for current week if they don't exist
  PERFORM initialize_week_slots(monday_date, sunday_date);
  
  -- Return all data for current week
  RETURN QUERY
  SELECT * FROM get_slots_with_bookings(monday_date, sunday_date);
END;
$$;

-- Function 5: Get feedback with user details efficiently
CREATE OR REPLACE FUNCTION get_all_feedback_with_users()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  email TEXT,
  subject TEXT,
  message TEXT,
  rating INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ,
  user_name TEXT,
  user_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.user_id,
    f.name,
    f.email,
    f.subject,
    f.message,
    f.rating,
    f.status,
    f.created_at,
    u.name as user_name,
    u.email as user_email
  FROM feedback f
  LEFT JOIN users u ON f.user_id = u.id
  ORDER BY f.created_at DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_slots_with_bookings(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_toggle_slot_fast(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_week_slots(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_week_admin_data() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_feedback_with_users() TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_slots_date_time ON slots(date, time_slot);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(date, time_slot);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- Analyze tables for better query planning
ANALYZE slots;
ANALYZE bookings;
ANALYZE users;
ANALYZE feedback;