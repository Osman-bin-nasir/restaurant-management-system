import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from '../api/axios.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Automatically check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('/auth/isAuthenticated', {
          withCredentials: true
        });
        if (res.data.success) {
          setUser(res.data.user);
        }
      } catch (err) {
        console.log(err);
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

  // ✅ Logout
  const logout = async () => {
    await axios.post('/auth/logout', {}, { withCredentials: true });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
