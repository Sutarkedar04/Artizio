import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireArtist = false,
}) => {
  const navigate = useNavigate();
  const { isLoggedIn, isAdmin, user, loading } = useAuth();

  const isArtist = user?.role === 'artist' || user?.isArtist === true;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-600"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">🔒 Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please login to access this page.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">⛔ Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to access this page. This area is restricted to administrators only.
          </p>
        </div>
      </div>
    );
  }

  if (requireArtist && !isArtist && !isAdmin) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">⛔ Artist Access Required</h2>
          <p className="text-gray-600 mb-6">
            This page is only accessible to artists.
            {!isAdmin && (
              <span className="block mt-2 text-sm text-amber-600">
                Go to your profile and click "Become an Artist" to upgrade your account.
              </span>
            )}
          </p>

          {!isAdmin && (
            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              Go to Profile
            </button>
          )}
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;