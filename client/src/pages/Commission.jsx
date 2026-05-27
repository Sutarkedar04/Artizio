import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { commissionAPI } from '../services/api';
import { toast } from 'react-toastify';

const Commission = () => {
  const { isLoggedIn } = useAuth();
  const [formData, setFormData] = useState({
    description: '', dimensions: '', deadline: '', budget: ''
  });
  const [referenceImage, setReferenceImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      toast.info('Please login to submit a commission request');
      return;
    }

    setSubmitting(true);
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) submitData.append(key, formData[key]);
    });
    if (referenceImage) submitData.append('referenceImage', referenceImage);

    try {
      await commissionAPI.create(submitData);
      toast.success('Commission request sent! Check your dashboard for updates.');
      setFormData({ description: '', dimensions: '', deadline: '', budget: '' });
      setReferenceImage(null);
      setPreviewUrl(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Request Custom Artwork</h2>
        
        {!isLoggedIn && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-yellow-800">Please login to submit a commission request.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            placeholder="Describe your vision, preferred style, colors, mood, subject matter..."
            rows="5"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-amber-500"
            required
          />
          
          <div className="grid md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Dimensions (e.g., 16x20 inches)"
              value={formData.dimensions}
              onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
              className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="number"
              placeholder="Budget (USD)"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
              className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setReferenceImage(file);
                setPreviewUrl(URL.createObjectURL(file));
              }}
              className="mb-2"
            />
            {previewUrl && (
              <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg mt-2" />
            )}
            <p className="text-sm text-gray-500 mt-2">Optional: Upload reference images</p>
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Commission Request'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Commission;