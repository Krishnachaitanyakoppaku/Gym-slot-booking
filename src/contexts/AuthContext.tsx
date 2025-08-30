import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const session = await authService.getCurrentSession();
        setUser(session?.user ?? null);
        
        // Check if admin from localStorage (for admin@123 login)
        const adminToken = localStorage.getItem('adminToken');
        if (adminToken === 'admin-authenticated') {
          setIsAdmin(true);
        } else if (session?.user) {
          // Check if regular user is admin
          setIsAdmin(session.user.user_metadata?.is_admin || false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setIsAdmin(session.user.user_metadata?.is_admin || false);
          // Update localStorage
          localStorage.setItem('userName', session.user.user_metadata?.name || session.user.email?.split('@')[0].toUpperCase() || '');
          localStorage.setItem('userEmail', session.user.email || '');
          localStorage.setItem('userId', session.user.id);
        } else {
          setIsAdmin(false);
          // Clear localStorage
          localStorage.removeItem('userName');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userId');
          localStorage.removeItem('adminToken');
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setIsAdmin(false);
      // Clear localStorage
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
      localStorage.removeItem('adminToken');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    loading,
    isAdmin,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};