import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle,XCircle} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ResetPassword = ({ onBackToLogin }) => {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reset, setReset] = useState(false);
  const [tokenValid, setTokenValid] = useState(null); // null = checking, true = valid, false = invalid

  useEffect(() => {
    // Get token from URL - improved parsing
    const urlParams = new URLSearchParams(window.location.search);
    let tokenParam = urlParams.get('token');
    
    // Also check if token is in the hash or path
    if (!tokenParam && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      tokenParam = hashParams.get('token');
    }
    
    // If still no token, check the full URL for token parameter
    if (!tokenParam) {
      const fullUrl = window.location.href;
      const match = fullUrl.match(/[?&]token=([^&]+)/);
      if (match) {
        tokenParam = decodeURIComponent(match[1]);
      }
    }
    
    console.log('Token found:', tokenParam ? 'Yes' : 'No');
    
    if (tokenParam) {
      setToken(tokenParam);
      setTokenValid(true);
    } else {
      setTokenValid(false);
      toast.error('Invalid reset link - no token found');
      setTimeout(() => onBackToLogin(), 3000);
    }
  }, [onBackToLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Sending reset request with token:', token);
      
      const response = await axios.post(`${API_URL}/api/users/reset-password`, {
        token: token,
        password: password,
        confirmPassword: confirmPassword
      });
      
      toast.success(response.data.message || 'Password reset successfully!');
      setReset(true);
      setTimeout(() => {
        onBackToLogin();
      }, 3000);
    } catch (error) {
      console.error('Reset error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking token
  if (tokenValid === null) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Validating reset link...</h2>
          <p className="text-gray-500 text-sm">Please wait while we verify your reset token.</p>
        </motion.div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-6">
            The reset link is invalid or missing. Please request a new password reset.
          </p>
          <button
            onClick={onBackToLogin}
            className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition"
          >
            Back to Login
          </button>
        </motion.div>
      </div>
    );
  }

  if (reset) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Password Reset!</h2>
          <p className="text-gray-600 mb-6">
            Your password has been successfully reset. Redirecting to login...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
      >
        <h2 className="text-2xl font-bold mb-2">Create New Password</h2>
        <p className="text-gray-600 mb-6">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;