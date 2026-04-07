import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('nf_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const persistUser = (userData, token) => {
    setUser(userData);
    localStorage.setItem('nf_user', JSON.stringify(userData));
    if (token) localStorage.setItem('nf_token', token);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persistUser(data.user, data.token);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    persistUser(data.user, data.token);
    return data.user;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nf_token');
    localStorage.removeItem('nf_user');
  };

  const refreshProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      persistUser(data.user, null);
    } catch {
      logout();
    }
  };

  // Refresh profile on mount if token present
  useEffect(() => {
    const token = localStorage.getItem('nf_token');
    if (token && !user) {
      setLoading(true);
      refreshProfile().finally(() => setLoading(false));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
