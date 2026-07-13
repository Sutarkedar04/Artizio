// src/components/HeroSection.jsx
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import HeroTextSection from './HeroTextSection';
import FeaturedArtworksCarousel from './FeaturedArtworksCarousel';

const HeroSection = ({ featuredArtworks }) => {
  const containerRef = useRef(null);
  const wallArtworks = featuredArtworks?.slice(0, 6) || [];

  return (
    <section 
      ref={containerRef} 
      className="relative min-h-screen bg-[#181614] overflow-hidden text-[#EDE6D6]"
      style={{ 
        backgroundColor: '#181614',
        marginTop: 0, // Remove any margin
        paddingTop: 0 // Remove any padding
      }}
    >
      {/* ─── BACKGROUND GRAIN ─── */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none z-0" aria-hidden="true">
        <filter id="grain-hero">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-hero)" />
      </svg>

      {/* ─── AMBIENT SPOTLIGHT ─── */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
        style={{
          width: '80vw',
          height: '100%',
          background: 'radial-gradient(ellipse 50% 70% at 50% 40%, rgba(201,162,39,0.08) 0%, rgba(201,162,39,0.02) 45%, transparent 75%)',
        }}
      />

      <div className="relative z-20 container mx-auto px-6 flex flex-col justify-center  min-h-screen pt-20 md:pt-24 pb-12">
        
        {/* ─── HERO TEXT SECTION ─── */}
        <HeroTextSection 
  eyebrow="For Artists, By Artists"
  title1="Made To"
  title2="Be Found"
  subtitle={
    <>
      Stop waiting to be discovered. Upload your work and let{' '}
      <span style={{ color: '#C9A227', fontWeight: 600 }}>Artizio</span> bring the world to you.
    </>
  }
  accentColor="#C9A227"
  textColor="#EDE6D6"
/>

        {/* ─── FEATURED ARTWORKS CAROUSEL ─── */}
        <div className="mt-16 md:mt-30">
        <FeaturedArtworksCarousel 
          artworks={wallArtworks}
          accentColor="#C9A227"
          textColor="#EDE6D6"
        />
        </div>
        {/* ─── SCROLL INDICATOR ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          className="flex justify-center mt-8 md:mt-12"
        >
          <ChevronDown size={22} className="text-[#EDE6D6]/30 animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;