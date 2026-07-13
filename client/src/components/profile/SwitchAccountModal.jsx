// src/components/profile/SwitchAccountModal.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brush, ArrowLeft, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';

const SwitchAccountModal = ({
  isOpen,
  isArtist,
  artistStatus,
  switchLoading,
  onClose,
  onUpgradeToArtist,
  onSwitchToUser
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white rounded-2xl max-w-md w-full p-6"
      >
        {!isArtist ? (
          // Upgrade to Artist Modal
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Brush size={24} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Become an Artist</h3>
                <p className="text-sm text-gray-500">Upgrade your account</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle size={18} className="text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Upload Artwork</p>
                  <p className="text-xs text-green-600">Share your creations with the community</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle size={18} className="text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Manage Commissions</p>
                  <p className="text-xs text-green-600">Accept and manage custom artwork requests</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle size={18} className="text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Build Following</p>
                  <p className="text-xs text-green-600">Grow your audience and get discovered</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={onClose} 
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button 
                onClick={onUpgradeToArtist} 
                disabled={switchLoading} 
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {switchLoading ? 'Processing...' : 'Yes, Become Artist'}
              </button>
            </div>
          </>
        ) : (
          // Switch to User Modal
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Switch to Regular User?</h3>
                <p className="text-sm text-gray-500">This action will remove your artist profile</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              {artistStatus.hasArtworks > 0 ? (
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <XCircle size={18} className="text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">You have {artistStatus.hasArtworks} artwork(s)</p>
                    <p className="text-xs text-red-600">Please delete all artworks before switching back</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertCircle size={18} className="text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Warning!</p>
                    <p className="text-xs text-yellow-600">Your artist profile, followers, and commission history will be removed.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={onClose} 
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button 
                onClick={onSwitchToUser} 
                disabled={switchLoading || artistStatus.hasArtworks > 0} 
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {switchLoading ? 'Processing...' : 'Yes, Switch to User'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default SwitchAccountModal;