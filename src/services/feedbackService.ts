import { supabase } from '../lib/supabase';
import { Feedback } from '../lib/supabase';

export const feedbackService = {
  // Submit feedback
  async submitFeedback(
    userId: string,
    name: string,
    email: string,
    subject: string,
    message: string,
    rating: number
  ): Promise<Feedback> {
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_id: userId,
        name,
        email,
        subject,
        message,
        rating,
        status: 'new'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all feedback (admin)
  async getAllFeedback(): Promise<Feedback[]> {
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        *,
        user:users(name, email, student_id)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Update feedback status
  async updateFeedbackStatus(feedbackId: string, status: 'new' | 'reviewed' | 'resolved'): Promise<void> {
    const { error } = await supabase
      .from('feedback')
      .update({ status })
      .eq('id', feedbackId);

    if (error) throw error;
  },

  // Get feedback by status
  async getFeedbackByStatus(status: 'new' | 'reviewed' | 'resolved'): Promise<Feedback[]> {
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        *,
        user:users(name, email, student_id)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};