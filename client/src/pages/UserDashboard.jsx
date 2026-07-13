import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Clock, CheckCircle, XCircle, Package, Trash2, AlertCircle } from 'lucide-react';
import { commissionAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { goToPage } from '../utils/navigation'; // Import the goToPage function

const UserDashboard = () => {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchMyCommissions();
  }, []);

  const fetchMyCommissions = async () => {
    try {
      const response = await commissionAPI.getMyRequests();
      setCommissions(response.data.data);
    } catch (error) {
      toast.error('Failed to load your requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (commissionId) => {
    try {
      await commissionAPI.cancel(commissionId, cancelReason);
      toast.success('Commission request cancelled successfully');
      fetchMyCommissions();
      setShowCancelModal(null);
      setCancelReason('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock className="text-yellow-500" size={20} />;
      case 'accepted': return <CheckCircle className="text-blue-500" size={20} />;
      case 'rejected': return <XCircle className="text-red-500" size={20} />;
      case 'completed': return <Package className="text-green-500" size={20} />;
      case 'cancelled': return <Trash2 className="text-gray-500" size={20} />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const canCancel = (status) => {
    return status === 'pending' || status === 'accepted';
  };

  // Handle artist profile navigation
  const handleArtistClick = (artistId, artistName) => {
    if (!artistId) {
      toast.error('Artist profile not available');
      return;
    }
    // Use goToPage to navigate to artist profile
    goToPage('artistProfile', { artistId });
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 border-b">
          <h2 className="text-2xl font-bold">My Dashboard</h2>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>

        <div className="p-6">
          {/* User Info Section */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-lg mb-3">Account Information</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div><span className="text-gray-600">Name:</span> <span className="font-medium">{user?.name}</span></div>
              <div><span className="text-gray-600">Email:</span> <span className="font-medium">{user?.email}</span></div>
              <div><span className="text-gray-600">Mobile:</span> <span className="font-medium">{user?.mobileNumber}</span></div>
              <div><span className="text-gray-600">Member since:</span> <span className="font-medium">{new Date(user?.createdAt).toLocaleDateString()}</span></div>
            </div>
          </div>

          {/* Commission Requests */}
          <h3 className="font-semibold text-lg mb-4">My Commission Requests</h3>
          
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">You haven't made any commission requests yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {commissions.map((commission) => (
                <div key={commission._id} className="border rounded-xl p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(commission.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(commission.status)}`}>
                        {commission.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-sm text-gray-500">
                        {new Date(commission.createdAt).toLocaleDateString()}
                      </span>
                      {canCancel(commission.status) && (
                        <button
                          onClick={() => setShowCancelModal(commission._id)}
                          className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Artist Name - Clickable to navigate to artist profile */}
                  <p className="text-sm text-gray-500 mb-2">
  Artist:{' '}
  <button
    onClick={() => goToPage('artistProfile', { artistId: commission.artist })}
    className="font-medium text-amber-600 hover:text-amber-700 hover:underline"
  >
    {commission.artistName}
  </button>
</p>
                  
                  <p className="text-gray-700 mb-4">{commission.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {commission.dimensions && (
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Dimensions</p>
                        <p className="text-sm font-medium">{commission.dimensions}</p>
                      </div>
                    )}
                    {commission.budget && (
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Budget</p>
                        <p className="text-sm font-medium">${commission.budget}</p>
                      </div>
                    )}
                    {commission.deadline && (
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Deadline</p>
                        <p className="text-sm font-medium">{new Date(commission.deadline).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {commission.referenceImageUrl && (
                    <img src={commission.referenceImageUrl} alt="Reference" className="h-32 w-auto rounded-lg mb-4" />
                  )}

                  {commission.statusNotes && commission.status !== 'cancelled' && (
                    <div className="bg-blue-50 p-3 rounded-lg mt-2">
                      <p className="text-sm text-blue-800">{commission.statusNotes}</p>
                    </div>
                  )}

                  {commission.cancellationReason && commission.status === 'cancelled' && (
                    <div className="bg-red-50 p-3 rounded-lg mt-2">
                      <p className="text-sm text-red-800"><strong>Reason:</strong> {commission.cancellationReason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={24} className="text-red-500" />
              <h3 className="text-xl font-semibold">Cancel Commission Request</h3>
            </div>
            <p className="text-gray-600 mb-4">Are you sure you want to cancel this commission request?</p>
            <textarea
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4"
              rows="3"
            />
            <div className="flex gap-3">
              <button onClick={() => handleCancelRequest(showCancelModal)} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">Yes, Cancel</button>
              <button onClick={() => { setShowCancelModal(null); setCancelReason(''); }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">No, Keep</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;