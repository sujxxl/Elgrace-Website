import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserRole = 'guest' | 'model' | 'client';

interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (role: UserRole, name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: Hash password using Web Crypto API
const hashPassword = async (password: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from LocalStorage
  useEffect(() => {
    const storedSession = localStorage.getItem('elgrace_session');
    if (storedSession) {
      try {
        const parsedUser = JSON.parse(storedSession);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('elgrace_session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const storedUsers = JSON.parse(localStorage.getItem('elgrace_users') || '[]');
    const hashedPassword = await hashPassword(password);

    const foundUser = storedUsers.find((u: any) => u.email === email && u.password === hashedPassword);

    if (foundUser) {
      const sessionUser: User = {
        id: foundUser.id,
        name: foundUser.name,
        role: foundUser.role,
        email: foundUser.email,
        avatar: `https://i.pravatar.cc/150?u=${foundUser.email}`
      };
      
      setUser(sessionUser);
      localStorage.setItem('elgrace_session', JSON.stringify(sessionUser));
      return { success: true };
    }

    return { success: false, message: "Invalid email or password." };
  };

  const register = async (role: UserRole, name: string, email: string, password: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const storedUsers = JSON.parse(localStorage.getItem('elgrace_users') || '[]');
    
    if (storedUsers.some((u: any) => u.email === email)) {
      return { success: false, message: "Email already exists." };
    }

    const hashedPassword = await hashPassword(password);
    
    const newUser = {
      id: Date.now().toString(),
      role,
      name,
      email,
      password: hashedPassword
    };

    storedUsers.push(newUser);
    localStorage.setItem('elgrace_users', JSON.stringify(storedUsers));

    // Auto-login after register
    const sessionUser: User = {
        id: newUser.id,
        name: newUser.name,
        role: newUser.role,
        email: newUser.email,
        avatar: `https://i.pravatar.cc/150?u=${newUser.email}`
    };
    setUser(sessionUser);
    localStorage.setItem('elgrace_session', JSON.stringify(sessionUser));

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('elgrace_session');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};