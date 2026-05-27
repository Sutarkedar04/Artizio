import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isLoggedIn, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-600"></div>
    </div>;
  }

  if (!isLoggedIn) {
    return <div className="text-center py-20">
      <h2 className="text-2xl font-bold mb-4">Please Login</h2>
      <p className="text-gray-600">You need to be logged in to access this page.</p>
    </div>;
  }

  if (requireAdmin && !isAdmin) {
    return <div className="text-center py-20">
      <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
      <p className="text-gray-600">You don't have permission to access this page.</p>
    </div>;
  }

  return children;
};

export default ProtectedRoute;