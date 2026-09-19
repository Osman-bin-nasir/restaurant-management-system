import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from '../api/axios.js';
import { sessionCache } from '../utils/sessionCache.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const cachedUser = sessionCache.get('auth:user');
  const [user, setUserState] = useState(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);

  const setUser = (nextUser) => {
    if (nextUser) {
      const { token: _token, ...safeUser } = nextUser;
      setUserState(safeUser);
      sessionCache.set('auth:user', safeUser, 7 * 24 * 60 * 60 * 1000);
    } else {
      setUserState(null);
      sessionCache.remove('auth:user');
    }
  };

  // ✅ Automatically check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('/auth/isAuthenticated', {
          withCredentials: true,
          cacheTtl: 0,
        });
        if (res.data.success) {
          setUser(res.data.user);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // ✅ Login
  const login = async (email, password) => {
    const res = await axios.post('/auth/login', { email, password }, { withCredentials: true });
    if (res.data.success) {
      // recheck user details from backend
      const authRes = await axios.get('/auth/isAuthenticated', { withCredentials: true });
      setUser(authRes.data.user);
    }
  };

  const register = async (name, email, password) => {
    const res = await axios.post('/auth/register', { name, email, password }, { withCredentials: true });
    if (res.data.success) {
      const authRes = await axios.get('/auth/isAuthenticated', { withCredentials: true });
      setUser(authRes.data.user);
    }
  };

  // ✅ Logout
  const logout = async () => {
    await axios.post('/auth/logout', {}, { withCredentials: true });
    setUser(null);
    sessionCache.removeByPrefix('http:');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Keeping the hook beside its provider avoids a breaking import migration.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
