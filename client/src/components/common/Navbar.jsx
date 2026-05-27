import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = ({ activePage, setActivePage, onLoginClick }) => {
  const { isLoggedIn, isAdmin, logout, user } = useAuth();

  const navItems = [
    { id: 'gallery', label: 'Gallery', requiresAuth: false },
  ];

  // Only show Commission for non-admin logged in users
  if (isLoggedIn && !isAdmin) {
    navItems.push({ id: 'commission', label: 'Commission', requiresAuth: true });
    navItems.push({ id: 'myRequests', label: 'My Requests', requiresAuth: true });
    navItems.push({ id: 'profile', label: 'Profile', requiresAuth: true });
  }
  
  // Only show Admin Panel for admin users
  if (isLoggedIn && isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin Panel', requiresAuth: true });
    navItems.push({ id: 'profile', label: 'Profile', requiresAuth: true });
  }

  // Show Sign In for non-logged in users
  if (!isLoggedIn) {
    navItems.push({ id: 'login', label: 'Sign In', requiresAuth: false });
  }

  const handleNavClick = (item) => {
    if (item.id === 'login') {
      onLoginClick();
    } else if (item.requiresAuth && !isLoggedIn) {
      onLoginClick();
    } else {
      setActivePage(item.id);
    }
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 backdrop-blur-lg bg-white/95">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 
            onClick={() => setActivePage('gallery')}
            className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent cursor-pointer"
          >
            ArtVault
          </h1>
          
          <div className="flex space-x-4">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`px-4 py-2 transition font-medium ${
                  activePage === item.id
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-gray-700 hover:text-amber-600'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            {isLoggedIn && (
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;