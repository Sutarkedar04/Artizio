import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Star, Trash2, EyeOff, Eye, LayoutDashboard, Image as ImageIcon, Briefcase } from 'lucide-react';
import { artworkAPI, commissionAPI } from '../../services/api';
import AdminManageCommissions from './AdminManageCommissions';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'featured', label: 'Featured Artworks', icon: Star },
  { id: 'artworks', label: 'All Artworks', icon: ImageIcon },
  { id: 'commissions', label: 'Commissions', icon: Briefcase },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mb-6">Moderate content, curate the hero section, and manage commissions.</p>

        {/* Tab nav */}
        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  isActive
                    ? 'border-amber-600 text-amber-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'featured' && <FeaturedTab />}
        {activeTab === 'artworks' && <ArtworksTab />}
        {activeTab === 'commissions' && <AdminManageCommissions />}
      </div>
    </div>
  );
};

// ============================================
// OVERVIEW
// ============================================
const OverviewTab = () => {
  const [stats, setStats] = useState({ artworks: null, featured: null, commissions: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [artworksRes, commissionsRes] = await Promise.all([
          artworkAPI.getAll(),
          commissionAPI.getAll().catch(() => ({ data: { data: [] } })),
        ]);
        const artworks = artworksRes.data.data || [];
        setStats({
          artworks: artworksRes.data.total ?? artworks.length,
          featured: artworks.filter(a => a.isFeatured).length,
          commissions: (commissionsRes.data.data || []).length,
        });
      } catch (err) {
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const cards = [
    { label: 'Total Artworks', value: stats.artworks, color: 'from-amber-500 to-amber-600' },
    { label: 'Featured Now', value: stats.featured, color: 'from-purple-500 to-purple-600' },
    { label: 'Commission Requests', value: stats.commissions, color: 'from-emerald-500 to-emerald-600' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map(card => (
        <div key={card.label} className="bg-white rounded-xl shadow p-5">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} mb-3`} />
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{card.label}</p>
          <p className="text-3xl font-bold text-gray-800">
            {loading ? '—' : card.value}
          </p>
        </div>
      ))}
    </motion.div>
  );
};

// ============================================
// FEATURED ARTWORKS
// ============================================
const FeaturedTab = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('all'); // all | featured

  const fetchArtworks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await artworkAPI.getAll();
      setArtworks(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load artworks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchArtworks(); }, [fetchArtworks]);

  const toggleFeatured = async (artwork) => {
    setUpdatingId(artwork._id);
    try {
      const res = await artworkAPI.setFeatured(artwork._id, !artwork.isFeatured);
      setArtworks(prev => prev.map(a => a._id === artwork._id ? res.data.data : a));
      toast.success(res.data.data.isFeatured ? 'Marked as featured' : 'Removed from featured');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const visible = filter === 'featured' ? artworks.filter(a => a.isFeatured) : artworks;

  if (loading) return <p className="text-gray-500 py-8 text-center">Loading artworks...</p>;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {['all', 'featured'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition ${
              filter === f ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All Artworks' : 'Currently Featured'}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-gray-400 text-center py-12">Nothing to show here.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {visible.map(artwork => (
            <div key={artwork._id} className="bg-white rounded-xl shadow p-3">
              <img src={artwork.imageUrl} alt={artwork.title} className="w-full h-36 object-cover rounded-lg mb-3" />
              <h3 className="font-semibold text-sm truncate">{artwork.title}</h3>
              <p className="text-xs text-gray-500 mb-3 truncate">{artwork.artist?.name}</p>
              <button
                onClick={() => toggleFeatured(artwork)}
                disabled={updatingId === artwork._id}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition disabled:opacity-50 ${
                  artwork.isFeatured ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Star size={13} fill={artwork.isFeatured ? 'currentColor' : 'none'} />
                {artwork.isFeatured ? 'Featured' : 'Mark as Featured'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// ALL ARTWORKS (moderation: unpublish / delete anything)
// ============================================
const ArtworksTab = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchArtworks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await artworkAPI.getAll();
      setArtworks(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load artworks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchArtworks(); }, [fetchArtworks]);

  const togglePublic = async (artwork) => {
    setBusyId(artwork._id);
    try {
      const res = await artworkAPI.update(artwork._id, { isPublic: !artwork.isPublic });
      setArtworks(prev => prev.map(a => a._id === artwork._id ? res.data.data : a));
      toast.success(res.data.data.isPublic ? 'Artwork made public' : 'Artwork hidden');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (artwork) => {
    if (!window.confirm(`Permanently delete "${artwork.title}"? This cannot be undone.`)) return;
    setBusyId(artwork._id);
    try {
      await artworkAPI.delete(artwork._id);
      setArtworks(prev => prev.filter(a => a._id !== artwork._id));
      toast.success('Artwork deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="text-gray-500 py-8 text-center">Loading artworks...</p>;

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3">Artwork</th>
            <th className="text-left px-4 py-3">Artist</th>
            <th className="text-left px-4 py-3">Category</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-right px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {artworks.map(artwork => (
            <tr key={artwork._id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <img src={artwork.imageUrl} alt={artwork.title} className="w-10 h-10 rounded object-cover" />
                  <span className="font-medium text-gray-800 truncate max-w-[180px]">{artwork.title}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600">{artwork.artist?.name}</td>
              <td className="px-4 py-3 text-gray-600 capitalize">{artwork.category}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs ${artwork.isPublic ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {artwork.isPublic ? 'Public' : 'Hidden'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => togglePublic(artwork)}
                    disabled={busyId === artwork._id}
                    title={artwork.isPublic ? 'Hide from public' : 'Make public'}
                    className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 disabled:opacity-50"
                  >
                    {artwork.isPublic ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => handleDelete(artwork)}
                    disabled={busyId === artwork._id}
                    title="Delete permanently"
                    className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;