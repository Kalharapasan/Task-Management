import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, setAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load there's no access token in memory yet (it's never
  // persisted to storage). Silently attempt a refresh using the
  // httpOnly refresh-token cookie; if it succeeds, the user stays
  // logged in across a page reload without ever exposing a long-lived
  // token to client-side JS.
  useEffect(() => {
    let isMounted = true;

    async function rehydrate() {
      try {
        const response = await authApi.refresh();
        setAccessToken(response.data.data.accessToken);
        if (isMounted) setUser(response.data.data.user);
      } catch {
        setAccessToken(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    rehydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authApi.login(email, password);
    const { accessToken, user: loggedInUser } = response.data.data;

    setAccessToken(accessToken);
    setUser(loggedInUser);

    return loggedInUser;
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

  const value = { user, isLoading, isAuthenticated: !!user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
