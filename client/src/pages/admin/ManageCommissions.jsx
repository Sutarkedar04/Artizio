import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { User, Mail, Phone, CheckCircle, XCircle, Clock, Package, Trash2, Eye } from 'lucide-react';
import { commissionAPI } from '../../services/api';

const ManageCommissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      const response = await commissionAPI.getAll();
      setCommissions(response.data.data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      let notes = '';
      if (status === 'rejected') {
        notes = prompt('Please provide a reason for rejection:');
        if (!notes) return;
      } else if (status === 'accepted') {
        notes = prompt('Add any notes for the client (optional):') || '';
      } else if (status === 'completed') {
        notes = prompt('Add completion notes (optional):') || '';
      }
      
      await commissionAPI.updateStatus(id, { status, statusNotes: notes });
      toast.success(`Commission ${status} successfully!`);
      fetchCommissions();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this commission request?')) {
      try {
        await commissionAPI.delete(id);
        toast.success('Commission deleted successfully');
        fetchCommissions();
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Delete failed');
      }
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

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock size={16} />,
      accepted: <CheckCircle size={16} />,
      rejected: <XCircle size={16} />,
      completed: <Package size={16} />,
      cancelled: <Trash2 size={16} />
    };
    return icons[status] || null;
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(status)}`}>
        {getStatusIcon(status)}
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-2xl font-bold mb-6">Commission Requests</h2>
      
      {commissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-gray-500">No commission requests yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {commissions.map((commission) => (
            <div key={commission._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <User size={18} className="text-amber-600" />
                      <span className="font-semibold">{commission.user?.name || commission.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-amber-600" />
                      <span className="text-gray-600">{commission.user?.email || commission.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-amber-600" />
                      <span className="text-gray-600">{commission.user?.mobileNumber || commission.mobileNumber || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(commission.status)}
                    <span className="text-sm text-gray-500">
                      {new Date(commission.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
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
                    <div className="mb-4">
                      <button
                        onClick={() => window.open(commission.referenceImageUrl, '_blank')}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <Eye size={16} /> View Reference Image
                      </button>
                    </div>
                  )}

                  {commission.statusNotes && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-blue-800">{commission.statusNotes}</p>
                    </div>
                  )}

                  {commission.cancellationReason && commission.status === 'cancelled' && (
                    <div className="bg-red-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-red-800">
                        <strong>Cancellation Reason:</strong> {commission.cancellationReason}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  {commission.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(commission._id, 'accepted')}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition flex items-center gap-2"
                      >
                        <CheckCircle size={16} /> Accept
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(commission._id, 'rejected')}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition flex items-center gap-2"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </>
                  )}
                  {commission.status === 'accepted' && (
                    <button
                      onClick={() => handleUpdateStatus(commission._id, 'completed')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition flex items-center gap-2"
                    >
                      <Package size={16} /> Mark as Completed
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(commission._id)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Delete Request
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

export default ManageCommissions;