import { supabase } from '../lib/supabase';
import { Slot } from '../lib/supabase';

export const slotService = {
  // Get slots for a specific date range
  async getSlotsByDateRange(startDate: string, endDate: string): Promise<Slot[]> {
    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get slots for a specific week
  async getSlotsForWeek(weekDates: string[]): Promise<Slot[]> {
    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .in('date', weekDates)
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get ALL slots for a specific week - including blocked ones (for user visibility)
  async getAllSlotsForWeek(weekDates: string[]): Promise<Slot[]> {
    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .in('date', weekDates)
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true });

    if (error) {
      console.error('Error fetching slots:', error);
      // If RLS is blocking access, provide a helpful error message
      if (error.message.includes('row-level security') || error.code === 'PGRST301') {
        throw new Error('Unable to access slots. Please contact the administrator to fix database permissions.');
      }
      throw error;
    }
    
    return data || [];
  },

  // Get available (non-blocked) slots for a specific week - for regular users
  async getAvailableSlotsForWeek(weekDates: string[]): Promise<Slot[]> {
    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .in('date', weekDates)
      .eq('is_blocked', false)
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true });

    if (error) {
      console.error('Error fetching slots:', error);
      // If RLS is blocking access, provide a helpful error message
      if (error.message.includes('row-level security') || error.code === 'PGRST301') {
        throw new Error('Unable to access slots. Please contact the administrator to fix database permissions.');
      }
      throw error;
    }
    
    // If no slots returned, it might be due to RLS policies
    if (!data || data.length === 0) {
      console.warn('No slots returned - this might be due to RLS policies blocking access');
    }
    
    return data || [];
  },

  // Create or update slot
  async upsertSlot(slot: Omit<Slot, 'id' | 'created_at'>): Promise<Slot> {
    const { data, error } = await supabase
      .from('slots')
      .upsert({
        date: slot.date,
        time_slot: slot.time_slot,
        capacity: slot.capacity,
        is_blocked: slot.is_blocked
      }, {
        onConflict: 'date,time_slot'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Toggle slot status (block/unblock) - Admin only
  async toggleSlotStatus(date: string, timeSlot: string): Promise<Slot> {
    try {
      console.log('Attempting to toggle slot:', { date, timeSlot });
      
      // First try the admin bypass function
      const { data, error: rpcError } = await supabase
        .rpc('admin_toggle_slot', {
          slot_date: date,
          slot_time_slot: timeSlot
        });

      if (!rpcError && data && data.length > 0) {
        console.log('Successfully used admin bypass function');
        return data[0];
      }

      if (rpcError) {
        console.error('Admin function failed:', rpcError);
        throw new Error(`Admin function failed: ${rpcError.message}`);
      }

      throw new Error('No data returned from admin function');
      
    } catch (error: any) {
      console.error('Slot toggle failed:', error);
      throw new Error(`Failed to toggle slot: ${error.message}`);
    }
  },

  // Simple toggle by ID for admin dashboard
  async toggleSlotById(slotId: string): Promise<Slot> {
    try {
      // Get current slot
      const { data: currentSlot, error: fetchError } = await supabase
        .from('slots')
        .select('*')
        .eq('id', slotId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch slot: ${fetchError.message}`);
      }

      // Update slot
      const { data: updatedSlot, error: updateError } = await supabase
        .from('slots')
        .update({ is_blocked: !currentSlot.is_blocked })
        .eq('id', slotId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update slot: ${updateError.message}`);
      }

      return updatedSlot;
    } catch (error: any) {
      console.error('Toggle by ID failed:', error);
      throw error;
    }
  },

  // Initialize slots for a date range (create default open slots) - ADMIN ONLY
  async initializeSlotsForDateRange(startDate: string, endDate: string): Promise<void> {
    const timeSlots = [
      '5:00 - 6:00 AM',
      '6:00 - 7:00 AM', 
      '7:00 - 8:00 AM',
      '6:00 - 7:00 PM',
      '8:00 - 9:00 PM',
      '9:00 - 10:00 PM'
    ];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const slotsToCreate = [];

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      for (const timeSlot of timeSlots) {
        slotsToCreate.push({
          date: dateStr,
          time_slot: timeSlot,
          capacity: 30,
          is_blocked: false
        });
      }
    }

    const { error } = await supabase
      .from('slots')
      .upsert(slotsToCreate, {
        onConflict: 'date,time_slot',
        ignoreDuplicates: true
      });

    if (error) throw error;
  },

  // Safe method for regular users - gets ALL slots (including blocked) for visibility
  async getAllSlotsForWeekSafe(weekDates: string[]): Promise<Slot[]> {
    try {
      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .in('date', weekDates)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });

      if (error) {
        console.error('Error fetching slots:', error);
        // If RLS is blocking access, provide a helpful error message
        if (error.message.includes('row-level security') || error.code === 'PGRST301') {
          throw new Error('Unable to access slots. Please contact the administrator to fix database permissions.');
        }
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Slot access error:', error);
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  },

  // Safe method for regular users - only gets available slots (for backwards compatibility)
  async getAvailableSlotsForWeekSafe(weekDates: string[]): Promise<Slot[]> {
    try {
      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .in('date', weekDates)
        .eq('is_blocked', false)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });

      if (error) {
        console.error('Error fetching slots:', error);
        // If RLS is blocking access, provide a helpful error message
        if (error.message.includes('row-level security') || error.code === 'PGRST301') {
          throw new Error('Unable to access slots. Please contact the administrator to fix database permissions.');
        }
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Slot access error:', error);
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  },

  // Ultra-fast method that gets slots with booking counts in one query
  async getSlotsWithBookingCounts(weekDates: string[]): Promise<(Slot & { bookingCount: number })[]> {
    try {
      // Use the database function to get slots with booking counts in one query
      const { data, error } = await supabase
        .rpc('get_slots_with_booking_count', {
          start_date: weekDates[0],
          end_date: weekDates[weekDates.length - 1]
        });

      if (error) {
        console.error('Error fetching slots with counts:', error);
        // Fallback to separate queries if RPC fails
        return [];
      }

      // Filter out blocked slots for regular users
      return (data || []).filter((slot: any) => !slot.is_blocked);
    } catch (error) {
      console.error('RPC method failed, using fallback:', error);
      // Fallback to the safe method
      return [];
    }
  }
};