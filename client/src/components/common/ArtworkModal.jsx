import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, Ruler, Palette, Tag, Maximize2, Minimize2,
  Heart, Share2, Download, Check, ZoomIn, Copy, MessageCircle,
  Send, Trash2, Pencil, Save, XCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { communityAPI, artworkAPI } from '../../services/api';

// Custom social media icons
const FacebookIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

// Turns a timestamp into a short relative label, Instagram-style ("2m", "3h", "5d").
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return new Date(dateStr).toLocaleDateString();
};

const ArtworkModal = ({ artwork, onClose, onArtworkUpdated, onArtworkDeleted }) => {
  const { user } = useAuth();
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeSubmitting, setLikeSubmitting] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const commentInputRef = useRef(null);

  // Edit/delete state — only relevant when the viewer owns this artwork
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const CATEGORIES = ['paintings', 'sketches', 'digital', 'watercolors', 'mixed-media', 'sculpture', 'photography'];

  // Re-sync state whenever a *different* artwork is opened in this modal,
  // since the component stays mounted and just receives a new `artwork` prop.
  useEffect(() => {
    if (artwork) {
      setIsLiked(artwork.likes?.includes(user?._id) || false);
      setLikesCount(artwork.likes?.length || 0);
      setIsImageExpanded(false);
      setShowShareMenu(false);
      setComments(artwork.comments || []);
      setCommentText('');
      setIsEditing(false);
      setEditForm(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artwork?._id, user?._id]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!artwork) return null;

  const artistId = typeof artwork.artist === 'string' ? artwork.artist : artwork.artist?._id;
  const isOwnArtwork = !!(user && artistId && artistId.toString() === user._id.toString());

  const startEditing = () => {
    setEditForm({
      title: artwork.title,
      description: artwork.description,
      category: artwork.category,
      dimensions: artwork.dimensions || '',
      medium: artwork.medium || '',
      yearCreated: artwork.yearCreated,
      isFeatured: !!artwork.isFeatured
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const response = await artworkAPI.update(artwork._id, editForm);
      const updated = response.data.data;
      toast.success('Artwork updated successfully!');
      setIsEditing(false);
      onArtworkUpdated?.(updated);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArtwork = async () => {
    if (deleting) return;
    if (!window.confirm('Delete this artwork permanently? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await artworkAPI.delete(artwork._id);
      toast.success('Artwork deleted successfully');
      onArtworkDeleted?.(artwork._id);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
      setDeleting(false);
    }
  };

  const handleShare = async (platform) => {
    const shareUrl = `${window.location.origin}/artwork/${artwork._id}`;
    const shareText = `Check out "${artwork.title}" by ${artwork.artist?.name || 'Artist'} on ArtVault!`;

    let shareLink = '';
    switch(platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'copy':
        await navigator.clipboard.writeText(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
        setShowShareMenu(false);
        return;
      default:
        return;
    }

    window.open(shareLink, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: artwork.title,
          text: `Check out "${artwork.title}" by ${artwork.artist?.name || 'Artist'}`,
          url: `${window.location.origin}/artwork/${artwork._id}`,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(artwork.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${artwork.title.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Real like: hits the backend and syncs to its authoritative response.
  // Optimistic UI update, with rollback if the request fails.
  const handleLike = async () => {
    if (!user) {
      toast.info('Please login to like artworks');
      return;
    }
    if (likeSubmitting) return;

    const prevLiked = isLiked;
    const prevCount = likesCount;

    // optimistic update for a snappy feel
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);
    setLikeSubmitting(true);

    try {
      const response = await communityAPI.likeArtwork(artwork._id);
      setIsLiked(response.data.liked);
      setLikesCount(response.data.likesCount);
    } catch (error) {
      // roll back on failure
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error(error.response?.data?.message || 'Failed to update like');
    } finally {
      setLikeSubmitting(false);
    }
  };

  // Posts a new comment optimistically, then reconciles with the server response.
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('Please login to comment');
      return;
    }
    const text = commentText.trim();
    if (!text || commentSubmitting) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      _id: tempId,
      text,
      user: { _id: user._id, name: user.name, profilePicture: user.profilePicture },
      createdAt: new Date().toISOString(),
    };

    setComments(prev => [...prev, optimisticComment]);
    setCommentText('');
    setCommentSubmitting(true);

    try {
      const response = await communityAPI.commentOnArtwork(artwork._id, text);
      const data = response.data;
      if (Array.isArray(data.comments)) {
        setComments(data.comments);
      } else if (Array.isArray(data.data?.comments)) {
        setComments(data.data.comments);
      } else if (data.comment) {
        setComments(prev => prev.map(c => (c._id === tempId ? data.comment : c)));
      } else if (data.data && data.data._id) {
        setComments(prev => prev.map(c => (c._id === tempId ? data.data : c)));
      }
    } catch (error) {
      setComments(prev => prev.filter(c => c._id !== tempId));
      setCommentText(text);
      toast.error(error.response?.data?.message || 'Failed to post comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const prevComments = comments;
    setComments(prev => prev.filter(c => c._id !== commentId));

    try {
      await communityAPI.deleteComment(artwork._id, commentId);
    } catch (error) {
      setComments(prevComments);
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    }
  };
   
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[1100] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all duration-300 backdrop-blur-sm hover:scale-110"
          >
            <X size={20} />
          </button>

          {/* LEFT: image */}
          <div
            className={`relative bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden transition-all duration-500 cursor-pointer w-full md:w-3/5 ${
              isImageExpanded ? 'h-[70vh]' : 'h-[45vh] md:h-auto'
            }`}
            onClick={() => setIsImageExpanded(!isImageExpanded)}
          >
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              className="w-full h-full object-contain transition-transform duration-700 hover:scale-105"
            />

            {!isImageExpanded && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/40">
                <div className="bg-black/70 text-white px-4 py-2 rounded-full flex items-center gap-2">
                  <ZoomIn size={18} />
                  <span className="text-sm">Click to zoom</span>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageExpanded(!isImageExpanded);
                }}
                className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all duration-300 backdrop-blur-sm hover:scale-110"
              >
                {isImageExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all duration-300 backdrop-blur-sm hover:scale-110"
              >
                <Download size={18} />
              </button>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNativeShare();
                  }}
                  className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all duration-300 backdrop-blur-sm hover:scale-110"
                >
                  <Share2 size={18} />
                </button>

                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 bg-white rounded-xl shadow-2xl p-3 z-10 min-w-[180px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-2">
                        <button
                          onClick={() => handleShare('facebook')}
                          className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition text-blue-600"
                        >
                          <FacebookIcon />
                          <span className="text-sm">Facebook</span>
                        </button>
                        <button
                          onClick={() => handleShare('twitter')}
                          className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition text-sky-500"
                        >
                          <TwitterIcon />
                          <span className="text-sm">Twitter</span>
                        </button>
                        <button
                          onClick={() => handleShare('linkedin')}
                          className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition text-blue-700"
                        >
                          <LinkedinIcon />
                          <span className="text-sm">LinkedIn</span>
                        </button>
                        <button
                          onClick={() => handleShare('copy')}
                          className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                          {shareCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                          <span className="text-sm">{shareCopied ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {artwork.isFeatured && (
              <div className="absolute top-4 left-4">
                <motion.span
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-1"
                >
                  <span className="text-yellow-300 animate-pulse">★</span>
                  Featured Masterpiece
                </motion.span>
              </div>
            )}
          </div>

          {/* RIGHT: details, likes, comments */}
          <div className="flex flex-col w-full md:w-2/5 max-h-[90vh] md:max-h-none">
            <div className="overflow-y-auto flex-1 p-6 pr-6 md:pr-14">
              {/* Title + Edit/Delete buttons */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <motion.h2
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2"
                  >
                    {artwork.title}
                  </motion.h2>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <span className="capitalize px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
                      {artwork.category}
                    </span>
                    <span>•</span>
                    <span>{artwork.yearCreated}</span>
                    <span>•</span>
                    <span>{artwork.medium}</span>
                  </div>
                </div>

                {isOwnArtwork && !isEditing && (
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={startEditing}
                      className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition"
                      title="Edit artwork"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={handleDeleteArtwork}
                      disabled={deleting}
                      className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition disabled:opacity-50"
                      title="Delete artwork"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Edit Form */}
              {isEditing ? (
                <form onSubmit={handleSaveEdit} className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                    placeholder="Title"
                    required
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                    rows="3"
                    placeholder="Description"
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={editForm.yearCreated}
                      onChange={(e) => setEditForm({ ...editForm, yearCreated: parseInt(e.target.value) })}
                      className="p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                      placeholder="Year"
                    />
                    <input
                      type="text"
                      value={editForm.dimensions}
                      onChange={(e) => setEditForm({ ...editForm, dimensions: e.target.value })}
                      className="p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                      placeholder="Dimensions"
                    />
                    <input
                      type="text"
                      value={editForm.medium}
                      onChange={(e) => setEditForm({ ...editForm, medium: e.target.value })}
                      className="p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                      placeholder="Medium"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition disabled:opacity-50"
                    >
                      <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                    >
                      <XCircle size={14} /> Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  

                  {/* Like / comment action bar */}
                  <div className="flex items-center gap-4 py-3 border-y border-gray-100 mb-4">
                    <button
                      onClick={handleLike}
                      disabled={likeSubmitting}
                      className={`flex items-center gap-1.5 transition-all duration-300 disabled:opacity-60 ${
                        isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <motion.span whileTap={{ scale: 0.85 }}>
                        <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
                      </motion.span>
                      <span className="text-sm font-medium">{likesCount}</span>
                    </button>

                    <button
                      onClick={() => commentInputRef.current?.focus()}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-amber-600 transition-colors"
                    >
                      <MessageCircle size={22} />
                      <span className="text-sm font-medium">{comments.length}</span>
                    </button>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                  >
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-6 h-0.5 bg-amber-500"></span>
                      About this artwork
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {artwork.description}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 gap-3 mb-6"
                  >
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl group hover:shadow-md transition-all duration-300">
                      <Palette size={18} className="text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Medium</p>
                      <p className="text-sm font-medium text-gray-800 mt-1">{artwork.medium}</p>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl group hover:shadow-md transition-all duration-300">
                      <Ruler size={18} className="text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Dimensions</p>
                      <p className="text-sm font-medium text-gray-800 mt-1">{artwork.dimensions}</p>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl group hover:shadow-md transition-all duration-300">
                      <Calendar size={18} className="text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Year</p>
                      <p className="text-sm font-medium text-gray-800 mt-1">{artwork.yearCreated}</p>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl group hover:shadow-md transition-all duration-300">
                      <Tag size={18} className="text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                      <p className="text-sm font-medium text-gray-800 mt-1 capitalize">{artwork.category}</p>
                    </div>
                  </motion.div>
                </>
              )}

              {/* Comments section - always visible */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-amber-500"></span>
                  Comments ({comments.length})
                </h3>

                {comments.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">No comments yet. Be the first to say something!</p>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <motion.div
                        key={comment._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 group"
                      >
                        <img
                          src={comment.user?.profilePicture || '/default-avatar.png'}
                          alt={comment.user?.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 break-words">
                            <span className="font-semibold mr-1.5">{comment.user?.name || 'User'}</span>
                            {comment.text}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
                            {user && comment.user?._id === user._id && (
                              <button
                                onClick={() => handleDeleteComment(comment._id)}
                                className="text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Comment input + close/download actions */}
            <div className="border-t border-gray-100 p-4 space-y-3">
              <form onSubmit={handleAddComment} className="flex items-center gap-2">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={user ? 'Add a comment...' : 'Login to comment'}
                  disabled={!user || commentSubmitting}
                  className="flex-1 px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!user || !commentText.trim() || commentSubmitting}
                  className="p-2.5 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition disabled:opacity-40 disabled:hover:bg-amber-600"
                >
                  <Send size={16} />
                </button>
              </form>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-300"
                >
                  Close
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-medium hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ArtworkModal;