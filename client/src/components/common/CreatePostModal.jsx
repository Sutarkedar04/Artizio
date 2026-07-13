import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { artworkAPI } from '../../services/api';

const CATEGORIES = [
  'paintings', 'sketches', 'digital', 'watercolors', 'mixed-media', 'sculpture', 'photography'
];

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'paintings',
    dimensions: '',
    medium: '',
    isForSale: false,
    price: ''
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image (JPEG, PNG, WebP)');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      toast.error('Please select an image');
      return;
    }

    setUploading(true);
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) submitData.append(key, formData[key]);
    });
    submitData.append('image', image);

    try {
      await artworkAPI.create(submitData);
      toast.success('Post created successfully!');
      onPostCreated();
      onClose();
      setFormData({
        title: '',
        description: '',
        category: 'paintings',
        dimensions: '',
        medium: '',
        isForSale: false,
        price: ''
      });
      setImage(null);
      setPreview(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Create New Post</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                <button
                  type="button"
                  onClick={() => { setImage(null); setPreview(null); }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <XCircle size={20} />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <ImageIcon size={48} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Click to upload artwork image</p>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" required />
              </label>
            )}
          </div>

          {/* Title */}
          <input
            type="text"
            placeholder="Artwork Title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
            required
          />

          {/* Description */}
          <textarea
            placeholder="Describe your artwork..."
            rows="4"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
            required
          />

          {/* Category */}
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder='Dimensions (e.g., 16x20")'
              value={formData.dimensions}
              onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
              className="p-3 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Medium (e.g., Oil on Canvas)"
              value={formData.medium}
              onChange={(e) => setFormData({...formData, medium: e.target.value})}
              className="p-3 border rounded-lg"
            />
          </div>

          {/* For Sale Option */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isForSale}
              onChange={(e) => setFormData({...formData, isForSale: e.target.checked})}
              className="w-4 h-4"
            />
            <span>This artwork is for sale</span>
          </label>

          {formData.isForSale && (
            <input
              type="number"
              placeholder="Price (USD)"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="p-3 border rounded-lg"
            />
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 transition disabled:opacity-50"
          >
            {uploading ? 'Posting...' : 'Share to Feed'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreatePostModal;