import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { artistAPI, communityAPI } from '../../services/api';
import { goToPage } from '../../utils/navigation';

const Navbar = ({ activePage, setActivePage, onLoginClick }) => {
  const { isLoggedIn, isAdmin, logout, user } = useAuth();
  const isArtist = user?.role === 'artist' || user?.isArtist === true;
  const [isLightBg, setIsLightBg] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // --- Scroll detection for hiding navbar ---
  const { scrollY } = useScroll();
  
  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    // Hide when scrolling down past 100px, show when scrolling up
    if (current > previous && current > 100) {
      setIsHidden(true);
    } else {
      setIsHidden(false);
    }
  });

  // --- Search state ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ artists: [], artworks: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const checkBackground = () => {
      const navbarHeight = 60;
      const centerX = window.innerWidth / 2;
      const yPoints = [navbarHeight + 10, navbarHeight + 50, navbarHeight + 100];

      for (const y of yPoints) {
        const el = document.elementFromPoint(centerX, y);
        if (!el) continue;

        let current = el;
        while (current && current !== document.body) {
          const bg = window.getComputedStyle(current).backgroundColor;
          const rgb = bg.match(/\d+/g);

          if (rgb && !(rgb[0] === 0 && rgb[1] === 0 && rgb[2] === 0 && rgb[3] === 0) && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
            const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
            setIsLightBg(brightness > 128);
            return;
          }
          current = current.parentElement;
        }
      }

      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      const rgb = bodyBg.match(/\d+/g);
      if (rgb) {
        const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
        setIsLightBg(brightness > 128);
      }
    };

    window.addEventListener('scroll', checkBackground);
    checkBackground();
    const t1 = setTimeout(checkBackground, 100);
    const t2 = setTimeout(checkBackground, 300);
    const t3 = setTimeout(checkBackground, 500);

    return () => {
      window.removeEventListener('scroll', checkBackground);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activePage]);

  // Close the results dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced fetch: artists by name + artworks by title/description, in parallel
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = searchQuery.trim();
    if (!q) {
      setSearchResults({ artists: [], artworks: [] });
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const [artistRes, artworkRes] = await Promise.all([
          artistAPI.search(q),
          communityAPI.searchArtworks({ q })
        ]);
        setSearchResults({
          artists: artistRes.data?.data || [],
          artworks: (artworkRes.data?.data || []).slice(0, 6)
        });
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults({ artists: [], artworks: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ artists: [], artworks: [] });
    setShowResults(false);
  };

  const handleSelectArtist = (artistDoc) => {
    goToPage('artistProfile', { artistId: artistDoc._id });
    clearSearch();
  };

  const handleSelectArtwork = (artwork) => {
    if (artwork.artistProfileId) {
      goToPage('artistProfile', { artistId: artwork.artistProfileId });
    }
    clearSearch();
  };

  const hasResults = searchResults.artists.length > 0 || searchResults.artworks.length > 0;

  const getNavItems = () => {
    const items = [
      { id: 'explore', label: 'Explore', requiresAuth: false },
    ];

    if (isLoggedIn) {
      items.unshift({
        id: 'feed',
        label: 'Feed',
        requiresAuth: true,
      });
    }

    if (isLoggedIn && isArtist) {
      items.push({ id: 'artistCommissions', label: 'Commissions', requiresAuth: true });
      items.push({ id: 'artistUpload', label: 'Upload', requiresAuth: true });
    }

    if (isLoggedIn && !isAdmin) {
      items.push({ id: 'myRequests', label: 'My Requests', requiresAuth: true });
    }

    if (isLoggedIn && isAdmin) {
      items.push({ id: 'admin', label: 'Admin Panel', requiresAuth: true });
    }

    if (isLoggedIn) {
      items.push({ id: 'profile', label: 'Profile', requiresAuth: true });
    }

    if (!isLoggedIn) {
      items.push({ id: 'login', label: 'Sign In', requiresAuth: false });
    }

    return items;
  };

  const navItems = getNavItems();

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
    <>
      <style>{`
        .glass-nav {
          background: rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          overflow: visible;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
        }

        .glass-nav .container > div {
          height: 48px;
        }

        .glass-nav-item {
          position: relative;
          padding: 6px 16px;
          font-weight: 500;
          color: #78350f;
          border-radius: 8px;
          transition: color 0.2s ease, background 0.2s ease;
        }

        .glass-nav-item:hover {
          color: #b45309;
          background: rgba(180, 83, 9, 0.08);
        }

        .glass-nav-item.active {
          color: #b45309;
        }

        .glass-nav-item.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 16px;
          right: 16px;
          height: 2px;
          background: linear-gradient(90deg, #d97706, #b45309);
          border-radius: 2px;
        }

        .glass-logout-btn {
          padding: 6px 16px;
          background: rgba(239, 68, 68, 0.12);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          font-weight: 500;
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .glass-logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.35);
        }

        .glass-logo {
          font-size: 1.6rem;
          font-weight: 700;
          background: linear-gradient(135deg, #d97706 0%, #92400e 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          cursor: pointer;
          letter-spacing: -0.02em;
        }

        .logo-img {
          transition: opacity 0.3s ease;
        }

        .glass-search-input {
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(180, 83, 9, 0.15);
          color: #78350f;
        }

        .glass-search-input::placeholder {
          color: rgba(120, 53, 15, 0.5);
        }

        .glass-search-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(180, 83, 9, 0.4);
        }

        .search-results-dropdown {
          background: white;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        }
      `}</style>

      <motion.nav 
        className="glass-nav"
        animate={{
          y: isHidden ? -200 : 0,
          opacity: isHidden ? 0 : 1,
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}
      >
        <div className="container mx-auto px-6 py-3">
          <div className="flex justify-between items-center gap-4">
            <motion.span 
              onClick={() => setActivePage('explore')} 
              className="glass-logo flex items-center gap-2 cursor-pointer flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src={isLightBg ? "/darklogo.png" : "/whitelogo.png"}
                alt="ArtVault logo"
                className="logo-img h-15 w-auto"
              />
            </motion.span>

            {isLoggedIn && (
              <motion.div 
                ref={searchRef} 
                className="relative flex-1 max-w-md"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-800/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    placeholder="Search artists or artworks..."
                    className="glass-search-input w-full pl-9 pr-8 py-1.5 rounded-lg text-sm transition-colors"
                  />
                  {searchQuery && (
                    <motion.button
                      onClick={clearSearch}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-800/50 hover:text-amber-800"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X size={14} />
                    </motion.button>
                  )}
                </div>

                {showResults && searchQuery.trim() && (
                  <motion.div 
                    className="search-results-dropdown absolute left-0 right-0 mt-2 rounded-xl overflow-hidden max-h-96 overflow-y-auto z-50"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {searchLoading ? (
                      <div className="flex items-center justify-center gap-2 py-6 text-gray-400 text-sm">
                        <Loader2 size={16} className="animate-spin" /> Searching...
                      </div>
                    ) : !hasResults ? (
                      <div className="py-6 text-center text-gray-400 text-sm">
                        No results for "{searchQuery}"
                      </div>
                    ) : (
                      <>
                        {searchResults.artists.length > 0 && (
                          <div className="py-2">
                            <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                              Artists
                            </p>
                            {searchResults.artists.map((artist) => (
                              <motion.button
                                key={artist._id}
                                onClick={() => handleSelectArtist(artist)}
                                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-left"
                                whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <img
                                  src={artist.user?.profilePicture || '/default-avatar.png'}
                                  alt={artist.user?.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                                <span className="text-sm font-medium text-gray-800">
                                  {artist.user?.name || 'Artist'}
                                </span>
                              </motion.button>
                            ))}
                          </div>
                        )}

                        {searchResults.artworks.length > 0 && (
                          <div className="py-2 border-t border-gray-100">
                            <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                              Artworks
                            </p>
                            {searchResults.artworks.map((artwork) => (
                              <motion.button
                                key={artwork._id}
                                onClick={() => handleSelectArtwork(artwork)}
                                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-left"
                                whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <img
                                  src={artwork.imageUrl}
                                  alt={artwork.title}
                                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">{artwork.title}</p>
                                  <p className="text-xs text-gray-400 truncate">by {artwork.artist?.name || 'Artist'}</p>
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            <div className="flex items-center gap-1 flex-shrink-0">
              {navItems.map(item => (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`glass-nav-item ${activePage === item.id ? 'active' : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.label}
                </motion.button>
              ))}

              {isLoggedIn && (
                <motion.button 
                  onClick={logout} 
                  className="glass-logout-btn ml-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Logout
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;