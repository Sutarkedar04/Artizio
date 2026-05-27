import React from 'react';
import { motion } from 'framer-motion';

const ArtworkCard = ({ artwork, index, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.03 }}
      onClick={() => onClick(artwork)}
      className="bg-white rounded-2xl overflow-hidden shadow-xl cursor-pointer transform transition-all duration-300 hover:shadow-2xl"
    >
      <div className="relative h-64 overflow-hidden">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        {artwork.isFeatured && (
          <span className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
            Featured
          </span>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 text-gray-800">{artwork.title}</h3>
        <p className="text-gray-600 mb-3 line-clamp-2">{artwork.description}</p>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{artwork.medium}</span>
          <span>{artwork.dimensions}</span>
          <span>{artwork.yearCreated}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ArtworkCard;