import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Ruler, Palette, Tag, Maximize2, Minimize2, Heart, Share2, Download, Check, ZoomIn } from 'lucide-react';

const ArtworkModal = ({ artwork, onClose }) => {
  // ✅ All hooks must be called at the top level, before any conditional returns
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Handle escape key - Hook called unconditionally
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // ✅ Now it's safe to have the conditional return after all hooks
  if (!artwork) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: artwork.title,
          text: artwork.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(artwork.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${artwork.title.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    // You can add API call here to save liked artwork
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all duration-300 backdrop-blur-sm hover:scale-110"
          >
            <X size={20} />
          </button>

          {/* Image Section */}
          <div 
            className={`relative bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden transition-all duration-500 cursor-pointer ${
              isImageExpanded ? 'h-[70vh]' : 'h-[55vh]'
            }`}
            onClick={() => setIsImageExpanded(!isImageExpanded)}
          >
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              className="w-full h-full object-contain transition-transform duration-700 hover:scale-105"
            />
            
            {/* Zoom Hint */}
            {!isImageExpanded && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/40">
                <div className="bg-black/70 text-white px-4 py-2 rounded-full flex items-center gap-2">
                  <ZoomIn size={18} />
                  <span className="text-sm">Click to zoom</span>
                </div>
              </div>
            )}

            {/* Image Controls */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageExpanded(!isImageExpanded);
                }}
                className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all duration-300 backdrop-blur-sm hover:scale-110"
              >
                {isImageExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all duration-300 backdrop-blur-sm hover:scale-110"
              >
                <Download size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all duration-300 backdrop-blur-sm hover:scale-110 relative"
              >
                {isCopied ? <Check size={18} /> : <Share2 size={18} />}
              </button>
            </div>

            {/* Featured Badge */}
            {artwork.isFeatured && (
              <div className="absolute top-4 left-4">
                <motion.span
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-1"
                >
                  <span className="text-yellow-300 animate-pulse">★</span>
                  Featured Masterpiece
                </motion.span>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="overflow-y-auto max-h-[35vh] p-6">
            {/* Title and Actions */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <motion.h2 
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2"
                >
                  {artwork.title}
                </motion.h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <span className="capitalize px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
                    {artwork.category}
                  </span>
                  <span>•</span>
                  <span>{artwork.yearCreated}</span>
                  <span>•</span>
                  <span>{artwork.medium}</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLike}
                className={`p-2 rounded-full transition-all duration-300 ${
                  isLiked 
                    ? 'bg-red-50 text-red-500' 
                    : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500'
                }`}
                aria-label="Add to favorites"
              >
                <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
              </motion.button>
            </div>

            {/* Description */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                <span className="w-6 h-0.5 bg-amber-500"></span>
                About this artwork
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {artwork.description}
              </p>
            </motion.div>

            {/* Details Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
            >
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl group hover:shadow-md transition-all duration-300">
                <Palette size={18} className="text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs text-gray-500 uppercase tracking-wide">Medium</p>
                <p className="text-sm font-medium text-gray-800 mt-1">{artwork.medium}</p>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl group hover:shadow-md transition-all duration-300">
                <Ruler size={18} className="text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs text-gray-500 uppercase tracking-wide">Dimensions</p>
                <p className="text-sm font-medium text-gray-800 mt-1">{artwork.dimensions}</p>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl group hover:shadow-md transition-all duration-300">
                <Calendar size={18} className="text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs text-gray-500 uppercase tracking-wide">Year</p>
                <p className="text-sm font-medium text-gray-800 mt-1">{artwork.yearCreated}</p>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl group hover:shadow-md transition-all duration-300">
                <Tag size={18} className="text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                <p className="text-sm font-medium text-gray-800 mt-1 capitalize">{artwork.category}</p>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-3 pt-4 border-t border-gray-100"
            >
              <button
                onClick={onClose}
                className="flex-1 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-300"
              >
                Close
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-medium hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Download Image
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ArtworkModal;