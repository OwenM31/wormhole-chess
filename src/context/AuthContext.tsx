import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, PlayerStats, LoginRequest, RegisterRequest } from '../types/auth';
import { authApi } from '../services/api';

export interface AuthContextType {
  user: User | null;
  stats: PlayerStats | null;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setStats(res.stats || null);
      } else {
        setUser(null);
        setStats(null);
      }
    } catch {
      setUser(null);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.login(data);
      if (res.success && res.user) {
        setUser(res.user);
        setStats(res.stats || null);
      } else {
        throw new Error(res.error || 'Login failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.register(data);
      if (res.success && res.user) {
        setUser(res.user);
        setStats(res.stats || null);
      } else {
        throw new Error(res.error || 'Registration failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsGuest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.loginAsGuest();
      if (res.success && res.user) {
        setUser(res.user);
        setStats(res.stats || null);
      } else {
        throw new Error(res.error || 'Guest session creation failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Guest session creation failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors and clear local state
    } finally {
      setUser(null);
      setStats(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        stats,
        isLoading,
        error,
        login,
        register,
        loginAsGuest,
        logout,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
