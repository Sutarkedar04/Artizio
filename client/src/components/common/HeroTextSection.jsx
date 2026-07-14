// src/components/HeroTextSection.jsx
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HeroTextSection = ({ 
  eyebrow = "For Artists, By Artists",
  title1 = "Made To",
  title2 = "Be Found",
  subtitle = (
    <>
      Stop waiting to be discovered. Upload your work and let{' '}
      <span style={{ color: '#C9A227', fontWeight: 600 }}>Artizio</span> bring the world to you.
    </>
  ),
  accentColor = "#C9A227",
  textColor = "#EDE6D6"
}) => {
  const containerRef = useRef(null);
  const eyebrowRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const underlineRef = useRef(null);
  const subtitleRef = useRef(null);

  // src/components/HeroTextSection.jsx
useEffect(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animatedEls = [eyebrowRef.current, line1Ref.current, line2Ref.current, subtitleRef.current];

  if (prefersReducedMotion) {
    gsap.set(animatedEls, { yPercent: 0, opacity: 1 });
    if (underlineRef.current) {
      gsap.set(underlineRef.current, { strokeDashoffset: 0 });
    }
    return;
  }

  const ctx = gsap.context(() => {
    gsap.set(animatedEls, { yPercent: 110, opacity: 0 });

    let underlineLen = 0;
    if (underlineRef.current) {
      underlineLen = underlineRef.current.getTotalLength();
      gsap.set(underlineRef.current, {
        strokeDasharray: underlineLen,
        strokeDashoffset: underlineLen
      });
    }

    // --- Entrance ---
    // Decided directly from the container's real position instead of
    // trusting ScrollTrigger's "already past start" detection, which is
    // sensitive to layout/measurement timing on SPA route changes.
    const playEntrance = () => {
      gsap.timeline()
        .to(eyebrowRef.current, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, 0.15)
        .to(line1Ref.current, { yPercent: 0, opacity: 1, duration: 0.95, ease: 'power4.out' }, 0.25)
        .to(line2Ref.current, { yPercent: 0, opacity: 1, duration: 0.95, ease: 'power4.out' }, 0.35)
        .to(underlineRef.current, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' }, 0.5)
        .to(subtitleRef.current, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, 0.65);
    };

    let entranceST = null;
    const rect = containerRef.current.getBoundingClientRect();
    const alreadyInView = rect.top < window.innerHeight * 0.8;

    if (alreadyInView) {
      // Hero is on screen right when this mounts (normal case, since it's
      // the top of the page) — just play it, no ScrollTrigger needed.
      playEntrance();
    } else {
      // Below the fold at mount — wait for a real scroll-into-view.
      entranceST = ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top 80%',
        once: true,
        onEnter: playEntrance,
      });
    }

    // --- Exit (scroll-out parallax/fade) ---
    // Safe now that scroll always starts at 0 on route change (see
    // ScrollToTop in App.jsx) — this will correctly read progress: 0
    // at mount instead of jumping straight to "scrolled past, hide it".
    gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      }
    })
      .to(eyebrowRef.current, { opacity: 0, yPercent: -30, ease: 'none' }, 0)
      .to([line1Ref.current, line2Ref.current], { yPercent: -60, opacity: 0.15, ease: 'none' }, 0)
      .to(underlineRef.current, { opacity: 0, ease: 'none' }, 0)
      .to(subtitleRef.current, { yPercent: -20, opacity: 0, ease: 'none' }, 0);

    // Recheck measurements once fonts/layout truly settle (handles font
    // reflow shifting the container's actual pixel position).
    document.fonts.ready.then(() => {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });

    return () => {
      entranceST?.kill();
    };
  }, containerRef);

  return () => ctx.revert();
}, []);

  return (
    <div ref={containerRef} className="text-center mb-12 mt-20 md:mb-16">
      {/* Eyebrow */}
      <div className="overflow-hidden mb-4">
        <p
          ref={eyebrowRef}
          className="tracking-[0.3em] uppercase text-xs"
          style={{ color: accentColor }}
        >
          {eyebrow}
        </p>
      </div>

      {/* Main Title */}
      <h1 className="font-serif mb-4" style={{ letterSpacing: '-0.02em', lineHeight: 0.86 }}>
        <span className="block overflow-hidden">
          <span
            ref={line1Ref}
            className="block"
            style={{ fontSize: 'clamp(3.2rem, 13vw, 9.5rem)', color: textColor }}
          >
            {title1}
          </span>
        </span>
        <span className="block overflow-hidden">
          <span
            ref={line2Ref}
            className="block"
            style={{ fontSize: 'clamp(3.2rem, 13vw, 9.5rem)', color: accentColor }}
          >
            {title2}
          </span>
        </span>
      </h1>

      {/* Underline */}
      <div className="flex justify-center mb-3" aria-hidden="true">
        <svg width="150" height="14" viewBox="0 0 150 14" className="overflow-visible">
          <path
            ref={underlineRef}
            d="M2 9 C 35 2, 65 12, 95 5 S 138 3, 148 7"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Subtitle */}
<div className="overflow-hidden">
  <p 
    ref={subtitleRef} 
    className="text-sm max-w-md mx-auto"
    style={{ color: `${textColor}99` }}
  >
    {subtitle}
  </p>
</div>
    </div>
  );
};

export default HeroTextSection;