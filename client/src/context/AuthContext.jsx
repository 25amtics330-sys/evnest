import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('evnest_token');
      const storedUser = localStorage.getItem('evnest_user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem('evnest_token');
          localStorage.removeItem('evnest_user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user: userData } = res.data;

      localStorage.setItem('evnest_token', token);
      localStorage.setItem('evnest_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to sign in. Please try again.';
      return { success: false, error: errMsg };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      const { token, user: newUser } = res.data;

      localStorage.setItem('evnest_token', token);
      localStorage.setItem('evnest_user', JSON.stringify(newUser));
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Registration failed. Please try again.';
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('evnest_token');
    localStorage.removeItem('evnest_user');
    setUser(null);
  };

  const updateUserProfile = (updatedFields) => {
    const updatedUser = { ...user, ...updatedFields };
    localStorage.setItem('evnest_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
