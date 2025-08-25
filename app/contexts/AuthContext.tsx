'use client'
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, User, UserRole } from '../types/auth';
import {
  loginUser,
  registerUser,
  logoutUser,
  resetUserPassword,
  updateUserProfile,
  onAuthStateChange
} from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string, rememberMe?: boolean): Promise<void> => {
    setLoading(true);
    try {
      const loggedInUser = await loginUser({ email, password, rememberMe });
      setUser(loggedInUser);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Updated to match the type signature
  const register = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole
  ): Promise<void> => {
    setLoading(true);
    try {
      const registeredUser = await registerUser({
        email,
        password,
        confirmPassword: password, // Assume password is confirmed at UI level
        displayName,
        role,
        institution: '',
        department: ''
      });
      setUser(registeredUser);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    await resetUserPassword(email);
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    
    await updateUserProfile(user.uid, data);
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};