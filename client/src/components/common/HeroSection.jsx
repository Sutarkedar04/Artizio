import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Brush, Star } from 'lucide-react';

const HeroSection = ({ featuredArtworks }) => {
  const topFeatured = featuredArtworks?.slice(0, 3) || [];

  return (
    <div className="relative text-white overflow-hidden" style={{ minHeight: '100vh' }}>

      {/* ── Spline 3D Background — fully interactive ── */}
      <div className="absolute inset-0 z-0" style={{ overflow: 'hidden' }}>
        <iframe
          src="https://my.spline.design/glassmaskcopycopy-fcOLgHz9d4pm4u2aVMU4hzFe-AMN/"
          frameBorder="0"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100vw',
            height: '100vh',
            minWidth: '100%',
            minHeight: '100%',
            border: 'none',
            // NO pointerEvents: 'none' — mouse events flow into Spline
          }}
        />
      </div>

      

      {/* ── Hero Content — z-20 so buttons/cards stay clickable ── */}
      <div className="container mx-auto px-6 py-20 relative z-20"style={{ pointerEvents: 'none' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
          style={{ pointerEvents: 'none' }}
        >
          {/* Featured Artworks Preview */}
          {topFeatured.length > 0 && (
            <div className="mt-12">
              <p className="text-gray-400 mb-4 tracking-widest uppercase text-sm"
                style={{ pointerEvents: 'none' }}
              >
                Featured Masterpieces
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {topFeatured.map((artwork, index) => (
                  <motion.div
                    key={artwork._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="relative group cursor-pointer rounded-xl overflow-hidden shadow-2xl"
                    style={{ pointerEvents: 'auto' }} // cards are clickable
                  >
                    <img
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-4 backdrop-blur-[2px]">
                      <p className="text-white font-semibold">{artwork.title}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;