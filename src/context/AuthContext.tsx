import React, { createContext, useContext, useState, useEffect } from 'react';
import { handleAuthCallback } from '../services/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  token: string | null;
  login: (code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored auth state on mount
    const storedToken = localStorage.getItem('github_token');
    const storedUser = localStorage.getItem('github_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }

    // Handle OAuth callback
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    if (code) {
      handleAuthCallback(code)
        .then(({ token, user }) => {
          setToken(token);
          setUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('github_token', token);
          localStorage.setItem('github_user', JSON.stringify(user));
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(console.error);
    }
  }, []);

  const login = async (code: string) => {
    const { token, user } = await handleAuthCallback(code);
    setToken(token);
    setUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('github_token', token);
    localStorage.setItem('github_user', JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_user');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);