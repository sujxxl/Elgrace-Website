import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Session, User as SupaUser } from '@supabase/supabase-js';

type UserRole = 'guest' | 'model' | 'client' | 'admin';

interface User {
  id: string;
  email: string | null;
  name?: string | null;
  avatar?: string | null;
  role: UserRole; // no ?
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithMagicLink: (email: string) => Promise<{ success: boolean; message?: string }>;
  signup: (
    email: string,
    password: string,
    displayName?: string,
    role?: 'model' | 'client'
  ) => Promise<{ success: boolean; message?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; message?: string }>;
  verifyAndUpdatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapUser = (u: SupaUser | null): User | null => {
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as Record<string, any>;
  return {
    id: u.id,
    email: u.email ?? null,
    name: meta.display_name ?? null,
    avatar: meta.avatar ?? null,
    role: (meta.role as UserRole) ?? 'guest',
  };
};

const signup = async (
  email: string,
  password: string,
  displayName?: string,
  role?: 'model' | 'client'
) => {
  try {
    // Create auth user with role in JWT metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName ?? null,
          role: role ?? 'guest',
        },
      },
    });

    if (error) {
      return { success: false, message: error.message };
    }

    const user = data.user;
    if (!user) {
      return { success: false, message: 'User not returned from signup' };
    }

    // No additional table writes here: model/client details are captured
    // later via model_profiles / brand_profiles flows.
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message ?? 'Signup failed' };
  }
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ? mapUser(data.session.user) : null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
      setUser(s?.user ? mapUser(s.user) : null);
    });

    return () => {
      mounted = false;
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

  const requestPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { success: false, message: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message ?? 'Password reset failed' };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, message: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message ?? 'Update password failed' };
    }
  };

  const verifyAndUpdatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!user?.email) {
        return { success: false, message: 'User email not found' };
      }

      // Verify current password by attempting to re-authenticate
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (authError) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // If verification succeeds, update to new password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) return { success: false, message: updateError.message };

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message ?? 'Password update failed' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        session,
        login,
        loginWithMagicLink,
        signup,
        requestPasswordReset,
        updatePassword,
        verifyAndUpdatePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};