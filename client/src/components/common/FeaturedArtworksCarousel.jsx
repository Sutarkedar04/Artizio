// src/components/FeaturedArtworksCarousel.jsx
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const FeaturedArtworksCarousel = ({
  artworks = [],
  accentColor = "#C9A227",
  textColor = "#EDE6D6"
}) => {
  // ─── REFS ──────────────────────────────────────────────────────────────
  const slideshowRef = useRef(null);
  const slideRefs = useRef([]);
  const cardBoxRefs = useRef([]);

  const titleTextRef = useRef(null);
  const artistTextRef = useRef(null);
  const titleSpansRef = useRef([]);
  const artistSpansRef = useRef([]);

  // ─── STATE ─────────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isContentOpen, setIsContentOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const setSlideRef = (el, index) => { slideRefs.current[index] = el; };
  const setCardBoxRef = (el, index) => { cardBoxRefs.current[index] = el; };

  // ─── TEXT SCRAMBLE HELPERS ──────────────────────────────────────────
  const randomChar = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz.:,^';
    return chars[Math.floor(Math.random() * chars.length)];
  };

  const randomizeLetters = (spans) => new Promise((resolve) => {
    if (!spans || spans.length === 0) { resolve(); return; }
    let completed = 0;
    spans.forEach((span, pos) => {
      let count = 0;
      const maxIter = 6 + Math.random() * 8;
      const interval = setInterval(() => {
        span.textContent = randomChar();
        count++;
        if (count > maxIter) {
          clearInterval(interval);
          span.textContent = span.dataset.initial || '';
          span.style.opacity = '1';
          completed++;
          if (completed === spans.length) resolve();
        }
      }, 30 + pos * 10);
    });
  });

  const disassembleLetters = (spans) => new Promise((resolve) => {
    if (!spans || spans.length === 0) { resolve(); return; }
    spans.forEach((span, i) => {
      setTimeout(() => {
        span.style.opacity = '0';
        if (i === spans.length - 1) setTimeout(resolve, 100);
      }, i * 20);
    });
  });

  const buildSpansFor = (artwork) => {
    const titleEl = titleTextRef.current;
    const artistEl = artistTextRef.current;
    if (!titleEl || !artistEl) return;

    titleEl.innerHTML = '';
    titleSpansRef.current = (artwork?.title || '').split('').map((char) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.dataset.initial = char;
      span.style.display = 'inline-block';
      titleEl.appendChild(span);
      return span;
    });

    artistEl.innerHTML = '';
    artistSpansRef.current = (artwork?.artist?.name || 'Unknown Artist').split('').map((char) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.dataset.initial = char;
      span.style.display = 'inline-block';
      artistEl.appendChild(span);
      return span;
    });
  };

  // ─── 5-POSITION TRANSFORM TABLE ──────────────────────────────────────
  const getTransforms = () => {
    const stage = slideshowRef.current;
    const box = cardBoxRefs.current.find(Boolean);
    const stageW = stage?.offsetWidth || window.innerWidth;
    const stageH = stage?.offsetHeight || window.innerHeight;
    const cardW = box?.offsetWidth || stageW * 0.4;
    const cardH = box?.offsetHeight || stageH * 0.7;

    return [
      { x: -(stageW / 2 + cardW), y: -(stageH / 2 + cardH), rotate: -30 },
      { x: -(stageW / 2 - cardW / 3), y: -(stageH / 2 - cardH / 3), rotate: 0 },
      { x: 0, y: 0, rotate: 0 },
      { x: (stageW / 2 - cardW / 3), y: (stageH / 2 - cardH / 3), rotate: 0 },
      { x: (stageW / 2 + cardW), y: (stageH / 2 + cardH), rotate: 30 },
    ];
  };

  const setSlideAt = (index, posIdx, transforms) => {
    const el = slideRefs.current[index];
    if (!el) return;
    const t = transforms[posIdx];
    gsap.set(el, { x: t.x, y: t.y, rotate: t.rotate, opacity: posIdx === 0 || posIdx === 4 ? 0 : 1 });
  };

  const tweenSlideTo = (index, posIdx, transforms, delay = 0) => {
    const el = slideRefs.current[index];
    if (!el) return Promise.resolve();
    const t = transforms[posIdx];
    return new Promise((resolve) => {
      gsap.to(el, {
        x: t.x,
        y: t.y,
        rotate: t.rotate,
        opacity: posIdx === 0 || posIdx === 4 ? 0 : 1,
        duration: 0.8,
        delay,
        ease: 'power4.inOut',
        onComplete: resolve,
      });
    });
  };

  const layoutAtRest = (centerIndex, animate) => {
    const total = artworks.length;
    if (total === 0) return;
    const transforms = getTransforms();
    const prevIdx = (centerIndex - 1 + total) % total;
    const nextIdx = (centerIndex + 1) % total;

    artworks.forEach((_, i) => {
      const el = slideRefs.current[i];
      if (!el) return;
      gsap.set(el, { opacity: 0 });
    });

    artworks.forEach((_, i) => {
      let posIdx = null;
      if (i === centerIndex) posIdx = 2;
      else if (i === prevIdx && total > 1) posIdx = 1;
      else if (i === nextIdx && total > 2) posIdx = 3;

      const el = slideRefs.current[i];
      if (!el || posIdx === null) return;

      if (animate) tweenSlideTo(i, posIdx, transforms);
      else setSlideAt(i, posIdx, transforms);
    });
  };

  // ─── NAVIGATION ─────────────────────────────────────────────────────
  const navigate = async (direction) => {
    const total = artworks.length;
    if (isAnimating || isContentOpen || total < 3) return;
    setIsAnimating(true);

    const transforms = getTransforms();
    const prevIdx = (currentIndex - 1 + total) % total;
    const nextIdx = (currentIndex + 1) % total;

    await disassembleLetters(titleSpansRef.current);
    await disassembleLetters(artistSpansRef.current);

    if (direction === 'next') {
      const upcomingIdx = (currentIndex + 2) % total;
      tweenSlideTo(prevIdx, 0, transforms, 0).then(() => gsap.set(slideRefs.current[prevIdx], { opacity: 0 }));
      tweenSlideTo(currentIndex, 1, transforms, 0.07);
      tweenSlideTo(nextIdx, 2, transforms, 0.14);
      setSlideAt(upcomingIdx, 4, transforms);
      await tweenSlideTo(upcomingIdx, 3, transforms, 0.21);
    } else {
      const upcomingIdx = (currentIndex - 2 + total) % total;
      tweenSlideTo(nextIdx, 4, transforms, 0).then(() => gsap.set(slideRefs.current[nextIdx], { opacity: 0 }));
      tweenSlideTo(currentIndex, 3, transforms, 0.07);
      tweenSlideTo(prevIdx, 2, transforms, 0.14);
      setSlideAt(upcomingIdx, 0, transforms);
      await tweenSlideTo(upcomingIdx, 1, transforms, 0.21);
    }

    const newIndex = direction === 'next' ? nextIdx : prevIdx;
    setCurrentIndex(newIndex);
    setIsAnimating(false);
    buildSpansFor(artworks[newIndex]);
    randomizeLetters(titleSpansRef.current);
    randomizeLetters(artistSpansRef.current);
  };

  // ─── KEYBOARD SHORTCUTS ──────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (artworks.length === 0) return;
      if (e.key === 'ArrowRight' && !isContentOpen) navigate('next');
      if (e.key === 'ArrowLeft' && !isContentOpen) navigate('prev');
      if (e.key === 'Escape' && isContentOpen) setIsContentOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, isContentOpen, isAnimating, artworks.length]);

  // ─── INITIAL SETUP ────────────────────────────────────────────────────
  useEffect(() => {
    if (artworks.length === 0) {
      setIsLoaded(true);
      return;
    }

    const initCarousel = () => {
      const allRefsExist = slideRefs.current.every(el => el !== undefined && el !== null);
      if (!allRefsExist) {
        requestAnimationFrame(initCarousel);
        return;
      }

      layoutAtRest(currentIndex, false);
      buildSpansFor(artworks[currentIndex]);

      const timer = setTimeout(() => {
        setIsLoaded(true);
        randomizeLetters(titleSpansRef.current);
        randomizeLetters(artistSpansRef.current);
      }, 300);

      const handleResize = () => layoutAtRest(currentIndex, false);
      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    };

    const timeoutId = setTimeout(() => {
      requestAnimationFrame(initCarousel);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [artworks]);
 // ─── AUTOPLAY ──────────────────────────────────────────────────────────
const isPausedRef = useRef(false);

useEffect(() => {
  if (artworks.length < 3) return; // matches navigate()'s own guard

  const AUTOPLAY_DELAY = 4500; // ms between slides — tune to taste

  const interval = setInterval(() => {
    if (isPausedRef.current || isAnimating || isContentOpen) return;
    navigate('next');
  }, AUTOPLAY_DELAY);

  return () => clearInterval(interval);
}, [currentIndex, isAnimating, isContentOpen, artworks.length]);
  // ─── LOADING / EMPTY STATES ───────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="w-full h-[50vh] md:h-[60vh] max-h-[600px] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#c9a227]/20 border-t-[#c9a227] rounded-full animate-spin" />
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="w-full h-[50vh] md:h-[60vh] max-h-[600px] flex items-center justify-center">
        <p className="text-center text-[#EDE6D6]/40 text-sm">
          No featured artworks yet — check back soon.
        </p>
      </div>
    );
  }

  const activeArtwork = artworks[currentIndex];
  const prevIdx = (currentIndex - 1 + artworks.length) % artworks.length;
  const nextIdx = (currentIndex + 1) % artworks.length;

  return (
    <div className="relative w-full h-[56vh] md:h-[66vh] max-h-[650px] overflow-visible"
    onMouseEnter={() => { isPausedRef.current = true; }}
  onMouseLeave={() => { isPausedRef.current = false; }}>
      <div ref={slideshowRef} className="relative w-full h-full" style={{ perspective: '1200px' }}>
        {artworks.map((artwork, index) => (
          <div
            key={artwork._id || index}
            ref={(el) => setSlideRef(el, index)}
            className="absolute inset-0 flex items-center justify-center will-change-transform cursor-pointer"
            style={{ transformStyle: 'preserve-3d', pointerEvents: 'auto' }}
            onClick={() => {
              if (index === currentIndex) setIsContentOpen(!isContentOpen);
              else if (index === nextIdx) navigate('next');
              else if (index === prevIdx) navigate('prev');
            }}
          >
            <div
              ref={(el) => setCardBoxRef(el, index)}
              className="relative w-[51%] md:w-[39%] lg:w-[32%] h-[62%] md:h-[65%] rounded-sm overflow-hidden shadow-2xl"
              style={{
                border: '8px solid #0f0e0d',
                padding: '10px',
                backgroundColor: '#0f0e0d',
                boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
              }}
            >
              <div
                className="absolute inset-[10px] bg-cover bg-center"
                style={{ backgroundImage: `url(${artwork.imageUrl})`, filter: 'brightness(0.9) saturate(1)' }}
              />
              <div className="absolute top-4 right-4 z-10 text-[#C9A227]/40 text-xs tracking-[0.2em]">
                {String(index + 1).padStart(2, '0')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── PERSISTENT TEXT PANEL ────────────────────────────────── */}
      <div className="absolute bottom-16 md:bottom-20 left-1/2 -translate-x-1/2 z-30 text-center px-4 pointer-events-none w-full max-w-md">
        <h3
          ref={titleTextRef}
          className="text-xl md:text-2xl lg:text-3xl font-serif leading-tight"
          style={{ color: textColor }}
        />
        <p ref={artistTextRef} className="text-xs md:text-sm mt-1 opacity-90" style={{ color: accentColor }} />

        {!isContentOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-3 text-[10px] tracking-[0.15em] uppercase pointer-events-auto cursor-pointer"
            style={{ color: `${textColor}4D` }}
            onClick={() => setIsContentOpen(true)}
          >
            Click to view details
          </motion.div>
        )}

        <AnimatePresence>
          {isContentOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 pointer-events-auto"
            >
              {activeArtwork?.description && (
                <p className="text-xs md:text-sm leading-relaxed mb-3" style={{ color: `${textColor}B3` }}>
                  {activeArtwork.description}
                </p>
              )}
              <button
                onClick={() => setIsContentOpen(false)}
                className="text-xs hover:underline"
                style={{ color: accentColor }}
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── ANIMATED CTA SECTION WITH SCROLLTRIGGER ─────────────── */}
      {!isContentOpen && (
        <div className="hidden md:flex md:flex-col absolute bottom-10 left-6 lg:left-10 z-30 max-w-[210px] lg:max-w-[260px] pointer-events-auto text-left">
  <h4
    className="font-sans font-black uppercase tracking-tight leading-[0.92] text-2xl lg:text-3xl mb-2"
    style={{ color: textColor }}
  >
    More To Discover Awaits
  </h4>

  <button
  onClick={() =>
    window.dispatchEvent(
      new CustomEvent("navigate", { detail: "login" })
    )
  }
  className="font-serif italic text-sm lg:text-base opacity-90 hover:opacity-100 transition-opacity text-left underline decoration-[#D27005]/60 underline-offset-4 w-fit"
  style={{ color: textColor }}
>
  Sign in to explore the full collection
</button>
</div>
      )}

      {/* ─── ANIMATED NAV BUTTONS ────────────────────────────────── */}
      {!isContentOpen && artworks.length > 2 && (
        <>
          <motion.button
            onClick={() => navigate('prev')}
            className="absolute top-4 left-4 z-20 p-3 rounded-full bg-[#D27005] text-white shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ 
              scale: 1.1,
              backgroundColor: "#e8850a",
              boxShadow: "0 0 25px rgba(210, 112, 5, 0.6)"
            }}
            whileTap={{ scale: 0.9 }}
            animate={{
              boxShadow: [
                "0 0 15px rgba(210, 112, 5, 0.3)",
                "0 0 25px rgba(210, 112, 5, 0.5)",
                "0 0 15px rgba(210, 112, 5, 0.3)"
              ]
            }}
            transition={{
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            aria-label="Previous"
          >
            <ChevronLeft size={24} />
          </motion.button>

          <motion.button
            onClick={() => navigate('next')}
            className="absolute bottom-4 right-4 z-20 p-3 rounded-full bg-[#D27005] text-white shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ 
              scale: 1.1,
              backgroundColor: "#e8850a",
              boxShadow: "0 0 25px rgba(210, 112, 5, 0.6)"
            }}
            whileTap={{ scale: 0.9 }}
            animate={{
              boxShadow: [
                "0 0 15px rgba(210, 112, 5, 0.3)",
                "0 0 25px rgba(210, 112, 5, 0.5)",
                "0 0 15px rgba(210, 112, 5, 0.3)"
              ]
            }}
            transition={{
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            aria-label="Next"
          >
            <ChevronRight size={24} />
          </motion.button>
        </>
      )}
    </div>
  );
};

export default FeaturedArtworksCarousel;