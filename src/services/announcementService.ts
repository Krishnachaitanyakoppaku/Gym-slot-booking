import { supabase } from '../lib/supabase';
import { Announcement } from '../lib/supabase';

export const announcementService = {
  // Create a new announcement
  async createAnnouncement(title: string, content: string, expiresAt: string | null): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .insert({ title, content, expires_at: expiresAt })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all announcements (for admin)
  async getAllAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get active announcements (for users)
  async getActiveAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gte.' + new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Update an announcement
  async updateAnnouncement(id: string, title: string, content: string, expiresAt: string | null, isActive: boolean): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .update({ title, content, expires_at: expiresAt, is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete an announcement
  async deleteAnnouncement(id: string): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};