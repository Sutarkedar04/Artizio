import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users/me`);
      setUser(response.data.data);
      setIsLoggedIn(true);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/users/login`, { email, password });
      const { token: authToken, ...userData } = response.data.data;
      localStorage.setItem('token', authToken);
      setToken(authToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      setUser(userData);
      setIsLoggedIn(true);
      toast.success(`Welcome back, ${userData.name}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      const unverified = error.response?.data?.unverified === true;
      toast.error(message);
      return { success: false, error: message, unverified };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/api/users/register`, userData);
      toast.success(response.data.message || 'Account created! Please check your email to verify your account.');
      return { success: true, email: response.data.data?.email };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await axios.get(`${API_URL}/api/users/verify-email/${verificationToken}`);
      const { token: authToken, ...userData } = response.data.data;
      localStorage.setItem('token', authToken);
      setToken(authToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      setUser(userData);
      setIsLoggedIn(true);
      toast.success('Email verified! Welcome to ArtVault.');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const resendVerification = async (email) => {
    try {
      const response = await axios.post(`${API_URL}/api/users/resend-verification`, { email });
      toast.success(response.data.message);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend verification email';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    delete axios.defaults.headers.common['Authorization'];
    toast.info('Logged out successfully');
  };

  const updateUser = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoggedIn,
      loading,
      login,
      register,
      verifyEmail,
      resendVerification,
      logout,
      updateUser,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};