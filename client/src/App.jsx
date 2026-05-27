import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/common/Navbar';
import BottomNavbar from './components/common/BottomNavbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthModal from './components/common/AuthModal';
import Gallery from './pages/Gallery';
import Commission from './pages/Commission';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProfilePage from './pages/ProfilePage';
import UserDashboard from './pages/user/UserDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

const AppContent = () => {
  const [activePage, setActivePage] = useState('gallery');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { isLoggedIn, login, register, isAdmin } = useAuth();

  // Check if we're on reset password page from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('token')) {
      setActivePage('reset-password');
    }
  }, []);

  // Listen for navigation events from bottom navbar
  useEffect(() => {
    const handleNavigation = (event) => {
      const page = event.detail;
      if (page === 'admin' && !isAdmin) return;
      if (page === 'upload' && !isAdmin) return;
      if (page === 'commissions' && !isAdmin) return;
      if (page === 'myRequests' && !isLoggedIn) return;
      if (page === 'commission' && !isLoggedIn) {
        setShowAuthModal(true);
        return;
      }
      setActivePage(page);
    };

    window.addEventListener('navigate', handleNavigation);
    return () => window.removeEventListener('navigate', handleNavigation);
  }, [isAdmin, isLoggedIn]);

  const handleLogin = async (email, password) => {
    const result = await login(email, password);
    if (result.success) {
      setShowAuthModal(false);
      setActivePage('gallery');
    }
  };

  const handleRegister = async (name, email, mobileNumber, password) => {
    const result = await register({ name, email, mobileNumber, password });
    if (result.success) {
      setShowAuthModal(false);
      setActivePage('gallery');
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'gallery':
        return <Gallery />;
      case 'commission':
        return <Commission />;
      case 'myRequests':
        return <ProtectedRoute><UserDashboard /></ProtectedRoute>;
      case 'profile':
        return <ProtectedRoute><ProfilePage /></ProtectedRoute>;
      case 'admin':
        return <ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>;
      case 'upload':
        return <ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>;
      case 'commissions':
        return <ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>;
      case 'reset-password':
        return <ResetPassword onBackToLogin={() => {
          setActivePage('login');
          setShowForgotPassword(false);
        }} />;
      case 'login':
        if (showForgotPassword) {
          return <ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />;
        }
        return showRegister ? 
          <Register onSwitchToLogin={() => setShowRegister(false)} /> : 
          <Login 
            onSwitchToRegister={() => setShowRegister(true)} 
            onForgotPassword={() => setShowForgotPassword(true)}
          />;
      default:
        return <Gallery />;
    }
  };

  const handleNavAction = (page) => {
    if (page === 'commission' && !isLoggedIn) {
      setShowAuthModal(true);
    } else if (page === 'login') {
      setActivePage('login');
      setShowRegister(false);
      setShowForgotPassword(false);
    } else {
      setActivePage(page);
    }
  };

  // If logged in and trying to access login/register, redirect to gallery
  if (isLoggedIn && (activePage === 'login' || activePage === 'register' || activePage === 'reset-password')) {
    setActivePage('gallery');
  }

  // Don't show bottom navbar on auth pages
  const showBottomNavbar = isLoggedIn && activePage !== 'login' && activePage !== 'register' && activePage !== 'reset-password';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <ToastContainer position="bottom-right" theme="dark" />
      <Navbar 
        activePage={activePage} 
        setActivePage={handleNavAction}
        onLoginClick={() => setActivePage('login')}
      />
      <main className="flex-grow">
        {renderPage()}
      </main>
      {showBottomNavbar && <BottomNavbar />}
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;