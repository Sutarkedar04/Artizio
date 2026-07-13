import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { User, Mail, Phone, CheckCircle, XCircle, Clock, Package, Eye, Trash2 } from 'lucide-react';
import { commissionAPI } from '../../services/api';

const STATUS_FILTERS = ['all', 'pending', 'accepted','in_progress', 'rejected', 'completed', 'cancelled'];

const getStatusColor = (status) => ({
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800'
}[status] || 'bg-gray-100 text-gray-800');

const getStatusIcon = (status) => ({
  pending: <Clock size={16} />,
  accepted: <CheckCircle size={16} />,
  in_progress: <Clock size={16} />,
  rejected: <XCircle size={16} />,
  completed: <Package size={16} />,
  cancelled: <XCircle size={16} />
}[status] || null);

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(status)}`}>
    {getStatusIcon(status)}
    {status.replace('_', ' ').toUpperCase()}
  </span>
);

const AdminManageCommissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);

  const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  const formatMoney = (amount, currency = 'INR') => {
  const symbol = CURRENCY_SYMBOLS[currency] || '₹';
  return `${symbol}${Number(amount).toLocaleString('en-IN')}`;
};

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await commissionAPI.getAll();
      setCommissions(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load commissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCommissions(); }, [fetchCommissions]);

  // Admin override: force a status change regardless of which artist owns
  // the commission. Uses the general updateStatus endpoint, not the
  // artist-scoped one.
  const handleForceStatus = async (id, status) => {
    let notes = '';
    if (status === 'rejected' || status === 'cancelled') {
      notes = prompt('Reason (shown to the client):');
      if (notes === null) return;
    } else {
      notes = prompt('Optional note:') || '';
    }

    setBusyId(id);
    try {
      await commissionAPI.updateStatus(id, { status, statusNotes: notes });
      toast.success(`Commission marked ${status}`);
      fetchCommissions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this commission record? This cannot be undone.')) return;
    setBusyId(id);
    try {
      await commissionAPI.delete(id);
      setCommissions(prev => prev.filter(c => c._id !== id));
      toast.success('Commission deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  const visible = filter === 'all' ? commissions : commissions.filter(c => c.status === filter);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-bold">All Commission Requests</h2>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition ${
                filter === f ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-gray-500">No commissions match this filter.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {visible.map((commission) => (
            <div key={commission._id} className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between items-start mb-3 flex-wrap gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={15} className="text-amber-600" />
                    <span className="font-semibold">{commission.requester?.name || commission.requesterName}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-gray-600">{commission.artist?.name || 'Artist'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail size={14} className="text-amber-600" />
                    {commission.requester?.email || commission.requesterEmail}
                  </div>
                  {(commission.requester?.mobileNumber || commission.requesterMobile) && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone size={14} className="text-amber-600" />
                      {commission.requester?.mobileNumber || commission.requesterMobile}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={commission.status} />
                  <span className="text-xs text-gray-400">{new Date(commission.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3">{commission.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-xs">
                {commission.budget && (
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500">Budget</p>
                    <p className="font-medium">{formatMoney(commission.budget, commission.currency)}</p>
                  </div>
                )}
                {commission.agreedPrice && (
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-gray-500">Agreed Price</p>
                    <p className="font-medium">{formatMoney(commission.agreedPrice, commission.currency)}</p>
                  </div>
                )}
                {commission.deadline && (
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500">Deadline</p>
                    <p className="font-medium">{new Date(commission.deadline).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {commission.referenceImageUrl && (
                <button
                  onClick={() => window.open(commission.referenceImageUrl, '_blank')}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 mb-3"
                >
                  <Eye size={14} /> View Reference Image
                </button>
              )}

              {commission.statusNotes && (
                <div className="bg-blue-50 p-2.5 rounded-lg mb-3 text-xs text-blue-800">
                  {commission.statusNotes}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-3 border-t">
                {['pending', 'accepted','in_progress',  'rejected', 'completed', 'cancelled']
                  .filter(s => s !== commission.status)
                  .map(s => (
                    <button
                      key={s}
                      onClick={() => handleForceStatus(commission._id, s)}
                      disabled={busyId === commission._id}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition disabled:opacity-50 capitalize"
                    >
                      Set {s}
                    </button>
                  ))}
                <button
                  onClick={() => handleDelete(commission._id)}
                  disabled={busyId === commission._id}
                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100 transition disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AdminManageCommissions;