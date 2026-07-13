import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Palette, Brush, Star, Lock, Sparkles } from 'lucide-react';
import HeroSection from '../components/common/HeroSection';
import ArtworkCard from '../components/common/ArtworkCard';
import ArtworkModal from '../components/common/ArtworkModal';
import { artworkAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from 'gsap';

gsap.registerPlugin(ScrollTrigger);

const CATEGORIES = ['all', 'paintings', 'sketches', 'digital', 'watercolors', 'mixed-media', 'sculpture', 'photography'];

// How many artworks a logged-out visitor gets to see before hitting the sign-in prompt
const GUEST_PREVIEW_LIMIT = 4;

const Explore = () => {
  const { user, isLoggedIn } = useAuth();
  const [artworks, setArtworks] = useState([]);
  const [featuredArtworks, setFeaturedArtworks] = useState([]);
  const [filteredArtworks, setFilteredArtworks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef(null);
  const titleRef = useRef(null); // "Explore Artworks" heading that grows in sync with the clip-path panel

  useEffect(() => {
    fetchArtworks();
  }, []);

  useEffect(() => {
    filterArtworks();
  }, [selectedCategory, searchQuery, artworks]);

  const fetchArtworks = async () => {
    try {
      const response = await artworkAPI.getAll();
      const allArtworks = response.data.data;
      setArtworks(allArtworks);
      setFeaturedArtworks(allArtworks.filter(art => art.isFeatured));
    } catch (error) {
      toast.error('Failed to load artworks');
    } finally {
      setLoading(false);
    }
  };

  const filterArtworks = () => {
    let filtered = [...artworks];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(art => art.category === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(art =>
        (art.title || '').toLowerCase().includes(q) ||
        (art.description || '').toLowerCase().includes(q)
      );
    }

    setFilteredArtworks(filtered);
  };

  // Logged-out visitors get a capped preview; logged-in users see everything.
  const visibleArtworks = isLoggedIn
    ? filteredArtworks
    : filteredArtworks.slice(0, GUEST_PREVIEW_LIMIT);
  const hiddenCount = isLoggedIn
    ? 0
    : Math.max(filteredArtworks.length - GUEST_PREVIEW_LIMIT, 0);


      useEffect(() => {
  if (loading || !contentRef.current) return;

  const ctx = gsap.context(() => {
    const panel = contentRef.current;
    const originXPercent = 50;
    const originYPercent = 30;
    const finalRadius = 40; // matches panel's own border-radius

    let clipTween;
    let titleTween;

    const buildAnimation = () => {
      if (clipTween) {
        clipTween.scrollTrigger?.kill();
        clipTween.kill();
      }
      if (titleTween) {
        titleTween.scrollTrigger?.kill();
        titleTween.kill();
      }

      const { width, height } = panel.getBoundingClientRect();
      const originX = (originXPercent / 100) * width;
      const originY = (originYPercent / 100) * height;
      const halfSize = 6; // half the size of the starting "dot"

      // Distances from origin to each edge — shrinking these to 0 reveals the full box
      const startTop = Math.max(originY - halfSize, 0);
      const startBottom = Math.max(height - originY - halfSize, 0);
      const startLeft = Math.max(originX - halfSize, 0);
      const startRight = Math.max(width - originX - halfSize, 0);

      const state = {
        top: startTop,
        right: startRight,
        bottom: startBottom,
        left: startLeft,
        round: halfSize + 40, // large relative to the tiny box = looks fully circular
      };

      const applyClip = () => {
        panel.style.clipPath =
          `inset(${state.top}px ${state.right}px ${state.bottom}px ${state.left}px round ${state.round}px)`;
      };

      applyClip();

      clipTween = gsap.to(state, {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        round: finalRadius,
        ease: 'none',
        onUpdate: applyClip,
        scrollTrigger: {
          trigger: panel,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
        },
      });

      // "Explore Artworks" heading grows from small to big in lockstep with the
      // clip-path reveal below it — same trigger/start/end so they stay in sync.
      if (titleRef.current) {
        gsap.set(titleRef.current, { scale: 0.25, opacity: 0.4, transformOrigin: '50% 50%' });
        titleTween = gsap.to(titleRef.current, {
          scale: 1,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: panel,
            start: 'top bottom',
            end: 'top top',
            scrub: true,
          },
        });
      }
    };

    buildAnimation();
    window.addEventListener('resize', buildAnimation);

    return () => window.removeEventListener('resize', buildAnimation);
  }, contentRef);

  const refreshTimeout = setTimeout(() => ScrollTrigger.refresh(), 300);

  return () => {
    clearTimeout(refreshTimeout);
    ctx.revert();
  };
}, [visibleArtworks, loading]);

  // Sends a logged-out visitor to sign in, with context on *why*, instead of
  // opening the full artwork modal or the commission/like/comment features.
  const promptSignIn = () => {
    toast.info('Sign in to view artwork details and connect with artists');
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'login' }));
  };

  const handleArtworkClick = (artwork) => {
    if (!isLoggedIn) {
      promptSignIn();
      return;
    }
    setSelectedArtwork(artwork);
  };

  return (
    <div className="bg-[#1D1B19]" style={{ marginTop: '-2px' }}>
      {/* Hero Section */}
      <HeroSection featuredArtworks={featuredArtworks} />

      {/* Dark background wrapper */}
      <div className="relative mt-16 md:mt-24" style={{ backgroundColor: '#1D1B19', paddingBottom: '20px' }}>
        <div className="relative" style={{ maxWidth: '100%' }}>

          {/* "Explore Artworks" heading — sits above the clip-path panel and grows in sync with it */}
          <div
            ref={titleRef}
            className="text-center mb-6 md:mb-10 px-4"
            style={{ willChange: 'transform, opacity' }}
          >
            <h2
              className="text-white font-extrabold tracking-tight"
              style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)', lineHeight: 1.05 }}
            >
              Explore Artworks
            </h2>
          </div>

          {/* Content — always fully rendered, full width */}
          <div
            ref={contentRef}
            className="relative px-4 py-8 mx-auto"
            style={{
              backgroundColor: '#f8f6f0',
              borderRadius: '40px',
              minHeight: '100vh',
              width: '100%',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
              boxSizing: 'border-box',
              maxWidth: '1400px',
              margin: '0 auto',
              overflow: 'hidden',
            }}
          >

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full capitalize transition text-sm ${
                    selectedCategory === cat
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Results Count */}
            <div className="text-center mb-4">
              <p className="text-gray-600 text-sm">
                Showing {visibleArtworks.length} of {filteredArtworks.length} artwork{filteredArtworks.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Artworks Grid */}
{loading ? (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-600"></div>
  </div>
) : filteredArtworks.length === 0 ? (
  <div className="text-center py-12 bg-white rounded-xl">
    <Palette size={64} className="mx-auto text-gray-300 mb-4" />
    <p className="text-gray-500 text-lg">No artworks found</p>
    <button
      onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
      className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
    >
      Clear Filters
    </button>
  </div>
) : (
  <>
    <div  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {visibleArtworks.map((artwork, index) => (
        <div key={artwork._id} className="artwork-card-item">
          <ArtworkCard
            artwork={artwork}
            index={index}
            onClick={handleArtworkClick}
          />
        </div>
      ))}
    </div>

    {/* Sign-in gate: shown to logged-out visitors instead of the rest of the gallery */}
    {hiddenCount > 0 && (
      <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="mt-24 relative rounded-2xl overflow-hidden grid"
>
  {/* Blurred hint — now grid-stacked, not absolute */}
  <div className="col-start-1 row-start-1 grid grid-cols-2 md:grid-cols-4 gap-3 blur-sm opacity-40 pointer-events-none select-none">
    {filteredArtworks.slice(GUEST_PREVIEW_LIMIT, GUEST_PREVIEW_LIMIT + 4).map(artwork => (
      <div key={artwork._id} className="h-40 rounded-xl overflow-hidden bg-gray-200">
        <img src={artwork.imageUrl} alt="" className="w-full h-full object-cover" />
      </div>
    ))}
  </div>

  {/* Overlay content — same grid cell, but now its natural height sets the row height */}
  <div className="col-start-1 row-start-1 flex items-center justify-center bg-gradient-to-t from-white via-white/90 to-white/40 py-8">
    <div className="text-center px-6 max-w-md">
      <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock size={24} className="text-amber-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">
         More artworks waiting for you
      </h3>
      <p className="text-gray-600 mb-6 text-sm">
        Sign in to explore the full gallery, like and comment on artwork, follow your favorite artists, and request custom commissions.
      </p>
      <button
        onClick={promptSignIn}
        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition shadow-lg"
      >
        <Sparkles size={18} />
        Sign In to See More
      </button>
    </div>
  </div>
</motion.div>
    )}
  </>
)}
          </div>
        </div>
      </div>

      <ArtworkModal artwork={selectedArtwork} onClose={() => setSelectedArtwork(null)} />
    </div>
  );
};

export default Explore;