import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('omnipulse_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('omnipulse_token'));
  const [loading, setLoading] = useState(true);

  // Load current user and profile on initialization
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('omnipulse_token');
      if (savedToken) {
        try {
          const res = await axiosClient.get('/auth/me');
          setUser(res.data.user);
          setProfile(res.data.profile);
          localStorage.setItem('omnipulse_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    const { token: newToken, user: newUser, profile: newProfile } = res.data;
    localStorage.setItem('omnipulse_token', newToken);
    localStorage.setItem('omnipulse_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setProfile(newProfile);
    return newUser;
  };

  const demoLogin = async (role) => {
    const res = await axiosClient.post('/auth/demo', { role });
    const { token: newToken, user: newUser, profile: newProfile } = res.data;
    localStorage.setItem('omnipulse_token', newToken);
    localStorage.setItem('omnipulse_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setProfile(newProfile);
    return newUser;
  };

  const register = async (formData) => {
    const res = await axiosClient.post('/auth/register', formData);
    const { token: newToken, user: newUser, profile: newProfile } = res.data;
    localStorage.setItem('omnipulse_token', newToken);
    localStorage.setItem('omnipulse_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setProfile(newProfile);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('omnipulse_token');
    localStorage.removeItem('omnipulse_user');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await axiosClient.get('/auth/me');
      setUser(res.data.user);
      setProfile(res.data.profile);
      localStorage.setItem('omnipulse_user', JSON.stringify(res.data.user));
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        isCustomer: user?.role === 'customer',
        login,
        demoLogin,
        register,
        logout,
        refreshProfile
      }}
    >
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
