import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brush, X, Send, Upload, Calendar, Coins, Ruler } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { commissionAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
];

const RequestCommissionButton = ({ artist, artistName, artistId, variant = 'button' }) => {
  const { isLoggedIn } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    dimensions: '',
    deadline: '',
    budget: '',
    currency: 'INR'
  });
  const [referenceImage, setReferenceImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      toast.info('Please login to request a commission');
      return;
    }

    setSubmitting(true);
    const submitData = new FormData();
    submitData.append('artist', artistId);
    submitData.append('artistName', artistName);
    Object.keys(formData).forEach(key => {
      if (formData[key]) submitData.append(key, formData[key]);
    });
    if (referenceImage) submitData.append('referenceImage', referenceImage);

    try {
      await commissionAPI.create(submitData);
      toast.success(`Commission request sent to ${artistName}!`);
      setShowModal(false);
      setFormData({ description: '', dimensions: '', deadline: '', budget: '', currency: 'INR' });
      setReferenceImage(null);
      setPreviewUrl(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (variant === 'button') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-medium"
        >
          <Brush size={16} />
          Request Commission
        </button>

        <CommissionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          artistName={artistName}
          formData={formData}
          setFormData={setFormData}
          referenceImage={referenceImage}
          setReferenceImage={setReferenceImage}
          previewUrl={previewUrl}
          setPreviewUrl={setPreviewUrl}
          handleSubmit={handleSubmit}
          submitting={submitting}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 text-amber-600 hover:text-amber-700 transition text-sm"
      >
        <Brush size={14} />
        Commission
      </button>

      <CommissionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        artistName={artistName}
        formData={formData}
        setFormData={setFormData}
        referenceImage={referenceImage}
        setReferenceImage={setReferenceImage}
        previewUrl={previewUrl}
        setPreviewUrl={setPreviewUrl}
        handleSubmit={handleSubmit}
        submitting={submitting}
      />
    </>
  );
};

const CommissionModal = ({ 
  isOpen, onClose, artistName, formData, setFormData,
  referenceImage, setReferenceImage, previewUrl, setPreviewUrl,
  handleSubmit, submitting 
}) => {
  if (!isOpen) return null;

  const selectedCurrency = CURRENCIES.find(c => c.code === formData.currency) || CURRENCIES[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold">Request Commission from {artistName}</h2>
            <p className="text-sm text-gray-500">Describe your vision for custom artwork</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Describe your vision *
            </label>
            <textarea
              placeholder="Tell the artist about your idea, preferred style, colors, mood, subject matter..."
              rows="5"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Ruler size={16} className="inline mr-1" />
                Dimensions (optional)
              </label>
              <input
                type="text"
                placeholder="e.g., 16x20 inches, A4"
                value={formData.dimensions}
                onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar size={16} className="inline mr-1" />
                Deadline (optional)
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Coins size={16} className="inline mr-1" />
                Budget (optional)
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 bg-white flex-shrink-0 w-28"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {selectedCurrency.symbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Your budget"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    className="w-full p-3 pl-7 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <label className="cursor-pointer">
              <Upload size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Reference Image (optional)</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setReferenceImage(file);
                  setPreviewUrl(URL.createObjectURL(file));
                }}
                className="hidden"
              />
            </label>
            {previewUrl && (
              <div className="mt-4">
                <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                <button
                  type="button"
                  onClick={() => { setReferenceImage(null); setPreviewUrl(null); }}
                  className="text-red-500 text-sm mt-2"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? 'Sending...' : <><Send size={18} /> Send Commission Request</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default RequestCommissionButton;