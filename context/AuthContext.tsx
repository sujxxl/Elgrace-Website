import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User as SupaUser } from '@supabase/supabase-js';

type UserRole = 'guest' | 'model' | 'client';

interface User {
  id: string;
  email: string | null;
  name?: string | null;
  avatar?: string | null;
  role?: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithMagicLink: (email: string) => Promise<{ success: boolean; message?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapUser = (u: SupaUser | null): User | null => {
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as Record<string, any>;
  return {
    id: u.id,
    email: u.email ?? null,
    name: meta.name ?? null,
    avatar: meta.avatar ?? null,
    role: (meta.role as UserRole) ?? 'guest',
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ? mapUser(data.session.user) : null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapUser(session.user) : null);
    });

    return () => {
      mounted = false;
      // unsubscribe if available
      if (listener?.subscription) listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, message: error.message };
      setUser(data.user ? mapUser(data.user) : null);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message ?? 'Login failed' };
    }
  };

  const loginWithMagicLink = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) return { success: false, message: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message ?? 'Magic link failed' };
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { success: false, message: error.message };
      setUser(data.user ? mapUser(data.user) : null);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message ?? 'Signup failed' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithMagicLink, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};