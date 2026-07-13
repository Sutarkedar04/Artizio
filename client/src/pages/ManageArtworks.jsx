import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { artworkAPI } from '../services/api';

const ManageArtworks = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingArtwork, setEditingArtwork] = useState(null);
  
  const categories = ['paintings', 'sketches', 'digital', 'watercolors', 'mixed-media', 'sculpture', 'photography'];

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    setLoading(true);
    try {
      const response = await artworkAPI.getMyArtworks();
      console.log('Fetched artworks:', response.data);
      setArtworks(response.data.data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(error.response?.data?.message || 'Failed to load artworks');
      setArtworks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateArtwork = async (e) => {
    e.preventDefault();
    try {
      await artworkAPI.update(editingArtwork._id, editingArtwork);
      toast.success('Artwork updated successfully!');
      setEditingArtwork(null);
      fetchArtworks();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteArtwork = async (id) => {
    if (window.confirm('Are you sure you want to delete this artwork?')) {
      try {
        await artworkAPI.delete(id);
        toast.success('Artwork deleted successfully');
        fetchArtworks();
      } catch (error) {
        console.error('Delete error:', error);
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading artworks...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Artworks</h2>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'artistUpload' }))}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          Upload New
        </button>
      </div>

      {editingArtwork ? (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Edit Artwork</h2>
          <form onSubmit={handleUpdateArtwork} className="space-y-4">
            <input
              type="text"
              placeholder="Title"
              value={editingArtwork.title}
              onChange={(e) => setEditingArtwork({...editingArtwork, title: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
              required
            />
            <textarea
              placeholder="Description"
              value={editingArtwork.description}
              onChange={(e) => setEditingArtwork({...editingArtwork, description: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
              rows="3"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                value={editingArtwork.category}
                onChange={(e) => setEditingArtwork({...editingArtwork, category: e.target.value})}
                className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Dimensions"
                value={editingArtwork.dimensions}
                onChange={(e) => setEditingArtwork({...editingArtwork, dimensions: e.target.value})}
                className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="Medium"
                value={editingArtwork.medium}
                onChange={(e) => setEditingArtwork({...editingArtwork, medium: e.target.value})}
                className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="number"
                placeholder="Year"
                value={editingArtwork.yearCreated}
                onChange={(e) => setEditingArtwork({...editingArtwork, yearCreated: parseInt(e.target.value)})}
                className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
                Update Artwork
              </button>
              <button
                type="button"
                onClick={() => setEditingArtwork(null)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {artworks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-gray-500">No artworks uploaded yet.</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'artistUpload' }))}
            className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Upload Your First Artwork
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artworks.map((artwork) => (
            <div key={artwork._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <img 
                src={artwork.imageUrl} 
                alt={artwork.title} 
                className="w-full h-48 object-cover" 
              />
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{artwork.title}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{artwork.description}</p>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                  <span>{artwork.category}</span>
                  <span>{artwork.yearCreated}</span>
                </div>
                {artwork.isFeatured && (
                  <span className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full mb-2">
                    Featured
                  </span>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingArtwork(artwork)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteArtwork(artwork._id)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ManageArtworks;