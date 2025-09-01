import { supabase } from '../lib/supabase';
import { Booking } from '../lib/supabase';

export const bookingService = {
  // Get user's bookings
  async getUserBookings(userId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        slot:slots(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get bookings for a specific slot
  async getSlotBookings(slotId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        user:users(name, email, student_id)
      `)
      .eq('slot_id', slotId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get bookings for a date and time slot
  async getBookingsForSlot(date: string, timeSlot: string): Promise<Booking[]> {
    // First get the slot ID
    const { data: slot, error: slotError } = await supabase
      .from('slots')
      .select('id')
      .eq('date', date)
      .eq('time_slot', timeSlot)
      .single();

    if (slotError) {
      if (slotError.code === 'PGRST116') {
        // No slot found, return empty array
        return [];
      }
      throw slotError;
    }

    // Then get bookings for that slot
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        user:users(name, email, student_id)
      `)
      .eq('slot_id', slot.id)
      .eq('status', 'active');

    if (error) throw error;
    return data || [];
  },

  // Create a new booking
  async createBooking(userId: string, date: string, timeSlot: string): Promise<Booking> {
    // First, get the slot (don't create it - slots should be pre-created by admin)
    const { data: slot, error: slotError } = await supabase
      .from('slots')
      .select('*')
      .eq('date', date)
      .eq('time_slot', timeSlot)
      .single();

    if (slotError) {
      if (slotError.code === 'PGRST116') {
        throw new Error('This time slot is not available for booking. Please contact the admin.');
      }
      throw slotError;
    }

    // Check if slot is blocked
    if (slot.is_blocked) {
      throw new Error('This slot is currently blocked and cannot be booked');
    }

    // Check current bookings count
    const { data: existingBookings, error: countError } = await supabase
      .from('bookings')
      .select('id')
      .eq('slot_id', slot.id)
      .eq('status', 'active');

    if (countError) throw countError;

    if (existingBookings.length >= slot.capacity) {
      throw new Error('This slot is fully booked');
    }

    // Check if user already has a booking for this DAY
    const { data: dayBooking, error: dayBookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', userId)
      .eq('booking_date', date) // Check for any booking on the same date
      .eq('status', 'active')
      .limit(1);

    if (dayBookingError) throw dayBookingError;

    if (dayBooking && dayBooking.length > 0) {
      throw new Error('You can only book one slot per day. Please cancel your existing booking to book a new one.');
    }

    // Check if user already has a booking for this slot
    const { data: userBooking, error: userBookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', userId)
      .eq('slot_id', slot.id)
      .eq('status', 'active')
      .single();

    if (userBookingError && userBookingError.code !== 'PGRST116') throw userBookingError;
    if (userBooking) {
      throw new Error('You have already booked this slot');
    }

    // Create the booking
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        slot_id: slot.id,
        booking_date: date,
        status: 'active'
      })
      .select(`
        *,
        slot:slots(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Cancel a booking
  async cancelBooking(bookingId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Get booking counts for multiple slots efficiently
  async getBookingCountsForSlots(slotIds: string[]): Promise<{ [slotId: string]: number }> {
    if (slotIds.length === 0) return {};

    const { data, error } = await supabase
      .from('bookings')
      .select('slot_id')
      .in('slot_id', slotIds)
      .eq('status', 'active');

    if (error) throw error;

    // Count bookings per slot
    const counts: { [slotId: string]: number } = {};
    slotIds.forEach(id => counts[id] = 0); // Initialize all to 0

    data?.forEach(booking => {
      counts[booking.slot_id] = (counts[booking.slot_id] || 0) + 1;
    });

    return counts;
  },

  // Get all bookings (admin)
  async getAllBookings(): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        user:users(name, email, student_id),
        slot:slots(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get bookings for a list of slot IDs
  async getBookingsForSlotIds(slotIds: string[]): Promise<Booking[]> {
    if (slotIds.length === 0) return [];

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        user:users(name, email, student_id),
        slot:slots(*)
      `)
      .in('slot_id', slotIds)
      .eq('status', 'active')
      .order('created_at', { ascending: true }); // Order by creation date for consistency

    if (error) throw error;
    return data || [];
  }
};