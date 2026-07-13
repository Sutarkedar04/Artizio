// App.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/common/Navbar';
import BottomNavbar from './components/common/BottomNavbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthModal from './components/common/AuthModal';
import Feed from './pages/Feed';
import Explore from './pages/Explore';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/Verifyemail';
import ProfilePage from './pages/ProfilePage';
import ArtistProfilePage from './pages/ArtistProfilePage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCommissions from './pages/ManageCommissions';
import ManageArtworks from './pages/ManageArtworks';
import UploadArtwork from './pages/UploadArtwork';
import { userAPI } from './services/api';

// Maps the legacy page-key vocabulary (used throughout the app via
// goToPage(page, extra)) to real URL paths, so every existing
// goToPage('someKey') call keeps working without being rewritten.
const PAGE_TO_PATH = {
  explore: '/',
  feed: '/feed',
  myRequests: '/my-requests',
  profile: '/profile',
  accountSettings: '/account-settings',
  admin: '/admin',
  artistCommissions: '/artist-dashboard/commissions',
  artistArtworks: '/artist-dashboard/artworks',
  artistUpload: '/artist-dashboard/upload',
  login: '/login',
};

// Reverse mapping, best-effort, purely so Navbar/BottomNavbar (which take
// an `activePage` string prop to highlight the current tab) keep working
// without being rewritten. If Navbar is ever migrated to <NavLink>, this
// can be deleted.
const pathToPageKey = (pathname) => {
  if (pathname.startsWith('/artist-dashboard/commissions')) return 'artistCommissions';
  if (pathname.startsWith('/artist-dashboard/artworks')) return 'artistArtworks';
  if (pathname.startsWith('/artist-dashboard/upload')) return 'artistUpload';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/artist/')) return 'artistProfile';
  const entry = Object.entries(PAGE_TO_PATH).find(([, path]) => path === pathname);
  return entry ? entry[0] : 'explore';
};

// Small adapter so ArtistProfilePage (which expects an `artistId` prop)
// doesn't need to be touched — it now reads the id from the URL instead
// of from App-level state.
const ArtistProfileRoute = () => {
  const { artistId } = useParams();
  return <ArtistProfilePage artistId={artistId} />;
};

// Handles the "Profile" nav item for artists: they land on their own
// public artist profile instead of the account-settings form. Falls back
// to the settings form if the artist lookup fails for any reason.
const ProfileRoute = ({ isArtist, myArtistId, fetchMyArtistId }) => {
  const [resolving, setResolving] = useState(isArtist && !myArtistId);
  const [resolvedId, setResolvedId] = useState(myArtistId);

  useEffect(() => {
    let cancelled = false;
    if (isArtist && !myArtistId) {
      setResolving(true);
      fetchMyArtistId().then((id) => {
        if (!cancelled) {
          setResolvedId(id);
          setResolving(false);
        }
      });
    } else {
      setResolvedId(myArtistId);
      setResolving(false);
    }
    return () => { cancelled = true; };
  }, [isArtist, myArtistId, fetchMyArtistId]);

  if (isArtist && resolving) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }
  if (isArtist && resolvedId) {
    return <Navigate to={`/artist/${resolvedId}`} replace />;
  }
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  );
};

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [myArtistId, setMyArtistId] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isLoggedIn, login, register, isAdmin, user } = useAuth();
  const isArtist = user?.role === 'artist' || user?.isArtist === true;

  const prevIsLoggedIn = useRef(isLoggedIn);

  // Check if current page is explore (homepage)
  const isExplorePage = location.pathname === '/';

  // Cache the current user's own artist profile id as soon as we know
  // they're an artist.
  useEffect(() => {
    if (isArtist && !myArtistId) {
      userAPI.getArtistStatus()
        .then(res => {
          const artistId = res.data?.data?.artistId;
          if (artistId) setMyArtistId(artistId);
        })
        .catch(() => {});
    }
    if (!isArtist) {
      setMyArtistId(null);
    }
  }, [isArtist, myArtistId]);

  const fetchMyArtistId = async () => {
    if (myArtistId) return myArtistId;
    try {
      const res = await userAPI.getArtistStatus();
      const id = res.data?.data?.artistId;
      if (id) setMyArtistId(id);
      return id || null;
    } catch {
      return null;
    }
  };

  // On logout, bounce off any page that requires auth, unless it's a
  // one-time email-link page (reset-password / verify-email) — those
  // must survive being logged out.
  useEffect(() => {
    if (prevIsLoggedIn.current && !isLoggedIn) {
      const p = location.pathname;
      if (p !== '/reset-password' && p !== '/verify-email') {
        navigate('/', { replace: true });
      }
      setMyArtistId(null);
    }
    prevIsLoggedIn.current = isLoggedIn;
  }, [isLoggedIn, location.pathname, navigate]);

  // Redirect logged-in users away from /login and /register.
  useEffect(() => {
    if (isLoggedIn && (location.pathname === '/login' || location.pathname === '/register')) {
      navigate('/feed', { replace: true });
    }
  }, [isLoggedIn, location.pathname, navigate]);

  // Single source of truth for legacy page-key navigation, whatever
  // triggered it: the window 'navigate' CustomEvent (goToPage() calls
  // scattered throughout the app) or a direct Navbar click.
  const navigateTo = async (page, extra = {}) => {
    const artistId = extra?.artistId;

    if (page === 'admin' && !isAdmin) return;
    if (page === 'upload' && !isAdmin) return;
    if (page === 'commissions' && !isAdmin) return;
    if (page === 'myRequests' && !isLoggedIn) return;
    if (page === 'artistCommissions' && !isArtist) return;
    if (page === 'artistArtworks' && !isArtist) return;
    if (page === 'artistUpload' && !isArtist) return;

    if (page === 'feed' && !isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    if (page === 'artistProfile' && artistId) {
      navigate(`/artist/${artistId}`);
      return;
    }

    if (page === 'profile' && isArtist) {
      const ownArtistId = await fetchMyArtistId();
      if (ownArtistId) {
        navigate(`/artist/${ownArtistId}`);
        return;
      }
    }

    const path = PAGE_TO_PATH[page];
    if (path) navigate(path);
  };

  useEffect(() => {
    const handleNavigation = (event) => {
      const detail = event.detail;
      const page = typeof detail === 'string' ? detail : detail?.page;
      const extra = typeof detail === 'object' ? detail : {};
      navigateTo(page, extra);
    };
    window.addEventListener('navigate', handleNavigation);
    return () => window.removeEventListener('navigate', handleNavigation);
  }, [isAdmin, isArtist, isLoggedIn, myArtistId]);

  const handleLogin = async (email, password) => {
    const result = await login(email, password);
    if (result.success) {
      setShowAuthModal(false);
      navigate('/feed');
    }
  };

  const handleRegister = async (name, email, mobileNumber, password) => {
    await register({ name, email, mobileNumber, password });
  };

  const handleNavAction = (page) => navigateTo(page);

  const showBottomNavbar = isLoggedIn && ![
    '/login', '/register', '/forgot-password', '/reset-password', '/verify-email'
  ].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <ToastContainer position="bottom-right" theme="dark" />
      <Navbar
        activePage={pathToPageKey(location.pathname)}
        setActivePage={handleNavAction}
        onLoginClick={() => navigate('/login')}
      />
      
      {/* ✅ Conditional padding: Explore page starts at y=0, others have padding */}
      <main className={`flex-grow ${isExplorePage ? '' : 'pt-16 md:pt-20'}`}>
        <Routes>
          <Route path="/" element={<Explore />} />
          <Route path="/feed" element={<Feed />} />

          <Route path="/my-requests" element={
            <ProtectedRoute><UserDashboard /></ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProfileRoute isArtist={isArtist} myArtistId={myArtistId} fetchMyArtistId={fetchMyArtistId} />
          } />
          <Route path="/account-settings" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />

          <Route path="/artist/:artistId" element={<ArtistProfileRoute />} />

          <Route path="/admin/*" element={
            <ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>
          } />

          <Route path="/artist-dashboard/commissions" element={
            <ProtectedRoute requireArtist><ManageCommissions /></ProtectedRoute>
          } />
          <Route path="/artist-dashboard/artworks" element={
            <ProtectedRoute requireArtist><ManageArtworks /></ProtectedRoute>
          } />
          <Route path="/artist-dashboard/upload" element={
            <ProtectedRoute requireArtist><UploadArtwork /></ProtectedRoute>
          } />

          <Route path="/reset-password" element={
            <ResetPassword onBackToLogin={() => navigate('/login')} />
          } />
          <Route path="/verify-email" element={
            <VerifyEmail onDone={() => navigate(isLoggedIn ? '/feed' : '/login')} />
          } />

          <Route path="/login" element={
            <Login
              onSwitchToRegister={() => navigate('/register')}
              onForgotPassword={() => navigate('/forgot-password')}
            />
          } />
          <Route path="/register" element={
            <Register onSwitchToLogin={() => navigate('/login')} />
          } />
          <Route path="/forgot-password" element={
            <ForgotPassword onBackToLogin={() => navigate('/login')} />
          } />

          <Route path="*" element={<Explore />} />
        </Routes>
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
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;