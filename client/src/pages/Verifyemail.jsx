import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmail = ({ onDone }) => {
  const { verifyEmail, isLoggedIn } = useAuth();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // Remove the token from the URL immediately so refreshing
    // doesn't try to verify the same token again.
    window.history.replaceState(null, '', window.location.pathname);

    const run = async () => {
      if (!token) {
        // If there's no token (e.g. user refreshed after verification),
        // but they're already logged in, assume verification succeeded.
        if (isLoggedIn) {
          setStatus('success');
          setTimeout(() => onDone(), 1000);
        } else {
          setStatus('error');
        }
        return;
      }

      const result = await verifyEmail(token);
      setStatus(result.success ? 'success' : 'error');

      if (result.success) {
        setTimeout(() => onDone(), 2000);
      }
    };

    run();
  }, [isLoggedIn, onDone, verifyEmail]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold mb-2">
              Verifying your email...
            </h2>
            <p className="text-gray-500 text-sm">
              This will just take a moment.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Email Verified!
            </h2>
            <p className="text-gray-600">
              Redirecting you to your feed...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">
              This link is invalid or has expired. Please try logging in —
              you'll be able to resend a new verification email from there.
            </p>
            <button
              onClick={onDone}
              className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition"
            >
              Go to Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;