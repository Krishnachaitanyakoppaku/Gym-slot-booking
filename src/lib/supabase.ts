import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface User {
  id: string;
  email: string;
  name: string;
  student_id?: string;
  is_admin: boolean;
  created_at: string;
}

export interface Slot {
  id: string;
  date: string;
  time_slot: string;
  capacity: number;
  is_blocked: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  slot_id: string;
  booking_date: string;
  status: 'active' | 'cancelled';
  created_at: string;
  // Relations
  user?: User;
  slot?: Slot;
}

export interface Feedback {
  id: string;
  user_id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  rating: number;
  status: 'new' | 'reviewed' | 'resolved';
  created_at: string;
  // Relations
  user?: User;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}