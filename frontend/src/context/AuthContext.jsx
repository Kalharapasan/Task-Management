import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, setAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function rehydrate() {
      try {
        const response = await authApi.refresh({ signal: controller.signal });
        setAccessToken(response.data.data.accessToken);
        if (isMounted) setUser(response.data.data.user);
      } catch (err) {
        if (err?.code === 'ERR_CANCELED' || controller.signal.aborted) return;
        if (err?.response?.status !== 401) {
          console.error('[AuthContext] Session rehydration failed:', err?.message ?? err);
        }
        setAccessToken(null);
      } finally {
        if (isMounted && !controller.signal.aborted) setIsLoading(false);
      }
    }

    rehydrate();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authApi.login(email, password);
    const { accessToken, user: loggedInUser } = response.data.data;
    setAccessToken(accessToken);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const response = await authApi.register(name, email, password);
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the network call fails, still clear local auth state.
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
