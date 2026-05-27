import { useState, useEffect } from 'react';
import { artworkAPI } from '../services/api';
import { toast } from 'react-toastify';

export const useArtworks = () => {
  const [artworks, setArtworks] = useState([]);
  const [featuredArtworks, setFeaturedArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchArtworks();
  }, []);

  const refetch = () => {
    setLoading(true);
    fetchArtworks();
  };

  return { artworks, featuredArtworks, loading, refetch };
};