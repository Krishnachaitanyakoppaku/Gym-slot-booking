import { supabase } from '../lib/supabase';

export const authService = {
  // Sign up new user
  async signUp(email: string, password: string, name: string, studentId?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          student_id: studentId,
          is_admin: false
        }
      }
    });
    
    if (error) throw error;
    return data;
  },

  // Sign in user
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      // Provide better error messages for common issues
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Please check your email and click the confirmation link before logging in. If you didn\'t receive an email, contact the admin.');
      }
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
      throw error;
    }
    return data;
  },

  // Sign in admin (uses real Supabase authentication)
  async signInAdmin(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // Verify the user is actually an admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', data.user.id)
      .single();
    
    if (userError || !userData?.is_admin) {
      await supabase.auth.signOut();
      throw new Error('Access denied: Admin privileges required');
    }
    
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Get current session
  async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
};