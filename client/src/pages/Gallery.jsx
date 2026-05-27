import React, { useState, useEffect } from 'react';
import HeroSection from '../components/common/HeroSection';
import CategoryFilter from '../components/common/CategoryFilter';
import ArtworkCard from '../components/common/ArtworkCard';
import ArtworkModal from '../components/common/ArtworkModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { artworkAPI } from '../services/api';
import { toast } from 'react-toastify';

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [featuredArtworks, setFeaturedArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtworks();
  }, []);

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

  // Calculate artwork counts per category
  const getArtworkCounts = () => {
    const counts = {};
    artworks.forEach(art => {
      counts[art.category] = (counts[art.category] || 0) + 1;
    });
    return counts;
  };

  // Filter artworks based on selected category
  const getFilteredArtworks = () => {
    if (selectedCategory === 'all') {
      return artworks;
    }
    return artworks.filter(art => art.category === selectedCategory);
  };

  const filteredArtworks = getFilteredArtworks();
  const artworkCounts = getArtworkCounts();

  return (
    <>
      <HeroSection featuredArtworks={featuredArtworks} />
      
      <div className="container mx-auto px-6 py-12">
        <CategoryFilter 
          selectedCategory={selectedCategory} 
          onSelect={setSelectedCategory}
          artworkCounts={artworkCounts}
        />

        {/* Show category info */}
        <div className="text-center mb-6">
          <p className="text-gray-600">
            Showing {filteredArtworks.length} artwork{filteredArtworks.length !== 1 ? 's' : ''} 
            {selectedCategory !== 'all' && ` in ${selectedCategory}`}
          </p>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filteredArtworks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500 text-lg">No artworks found in this category.</p>
            <button 
              onClick={() => setSelectedCategory('all')}
              className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              View All Artworks
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArtworks.map((artwork, index) => (
              <ArtworkCard 
                key={artwork._id} 
                artwork={artwork} 
                index={index}
                onClick={setSelectedArtwork}
              />
            ))}
          </div>
        )}
      </div>

      <ArtworkModal 
        artwork={selectedArtwork} 
        onClose={() => setSelectedArtwork(null)} 
      />
    </>
  );
};

export default Gallery;