import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { artworkAPI } from '../services/api';

const CATEGORIES = [
  { id: 'paintings', label: 'Paintings', description: 'Oil, Acrylic, Canvas artworks' },
  { id: 'sketches', label: 'Sketches', description: 'Pencil, Charcoal, Pen drawings' },
  { id: 'digital', label: 'Digital Art', description: 'Digital illustrations, Vector art' },
  { id: 'watercolors', label: 'Watercolors', description: 'Watercolor paintings' },
  { id: 'mixed-media', label: 'Mixed Media', description: 'Combination of different mediums' }
];

const UploadArtwork = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'paintings',
    dimensions: '',
    medium: '',
    yearCreated: new Date().getFullYear()
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      toast.error('Please select an image');
      return;
    }

    setUploading(true);
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== undefined && formData[key] !== null) {
        submitData.append(key, formData[key]);
      }
    });
    submitData.append('image', image);

    try {
      await artworkAPI.create(submitData);
      toast.success('Artwork uploaded successfully!');
      setFormData({
        title: '',
        description: '',
        category: 'paintings',
        dimensions: '',
        medium: '',
        yearCreated: new Date().getFullYear(),
        isFeatured: false
      });
      setImage(null);
      setPreview(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, WebP, GIF)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const getCategoryDescription = (categoryId) => {
    const category = CATEGORIES.find(cat => cat.id === categoryId);
    return category?.description || '';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Upload New Artwork
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Artwork Title *
            </label>
            <input
              type="text"
              placeholder="Enter artwork title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
            {formData.category && (
              <p className="text-xs text-gray-500 mt-1">
                {getCategoryDescription(formData.category)}
              </p>
            )}
          </div>

          {/* Dimensions Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dimensions *
            </label>
            <input
              type="text"
              placeholder="e.g., 16x20 inches, A4, 50x70cm"
              value={formData.dimensions}
              onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>

          {/* Medium Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medium *
            </label>
            <input
              type="text"
              placeholder="e.g., Oil on Canvas, Digital, Watercolor"
              value={formData.medium}
              onChange={(e) => setFormData({...formData, medium: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>

          {/* Year Created */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year Created *
            </label>
            <input
              type="number"
              placeholder="Year"
              value={formData.yearCreated}
              onChange={(e) => setFormData({...formData, yearCreated: parseInt(e.target.value)})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              min="1900"
              max={new Date().getFullYear()}
              required
            />
          </div>
        </div>
        
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            placeholder="Describe the artwork, inspiration, techniques used..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            rows="4"
            required
          />
        </div>
        
        
        {/* Image Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Artwork Image *
          </label>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleImageChange}
            className="mb-2 cursor-pointer"
            required
          />
          {preview && (
            <div className="mt-4">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-h-64 mx-auto rounded-lg shadow-md" 
              />
              <p className="text-sm text-green-600 mt-2">✓ Image ready for upload</p>
            </div>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Supported formats: JPG, PNG, WebP, GIF (Max 10MB)
          </p>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Uploading...
            </span>
          ) : (
            'Upload Artwork'
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default UploadArtwork;