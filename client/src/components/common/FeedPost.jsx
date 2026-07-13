// src/components/common/FeedPost.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send,
  Trash2, Copy, Check, UserPlus, UserCheck
} from 'lucide-react';
import { toast } from 'react-toastify';
import RequestCommissionButton from './RequestCommissionButton';
import { goToPage } from '../../utils/navigation';

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

const FeedPost = ({
  post,
  onLike,
  onComment,
  onDeleteComment,
  onFollow,
  isFollowing,
  currentUser
}) => {
  const [showComments, setShowComments] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUser?._id) || false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [copied, setCopied] = useState(false);

  const isPostOwner = post.artist?._id === currentUser?._id;

  const handleLike = async () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    await onLike(post._id);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      _id: Date.now().toString(),
      user: {
        _id: currentUser?._id,
        name: currentUser?.name,
        profilePicture: currentUser?.profilePicture
      },
      text: commentText,
      createdAt: new Date()
    };
    setComments([newComment, ...comments]);
    setCommentText('');
    await onComment(post._id, commentText);
  };

  const handleDeleteComment = async (commentId) => {
    setComments(comments.filter(c => c._id !== commentId));
    if (onDeleteComment) {
      await onDeleteComment(post._id, commentId);
    }
    setShowDeleteConfirm(null);
    toast.success('Comment deleted');
  };

  const handleShare = async (platform) => {
    const shareUrl = `${window.location.origin}/artwork/${post._id}`;
    const shareText = `Check out "${post.title}" by ${post.artist?.name || 'Artist'} on ArtVault!`;

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
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
        setShowShareMenu(false);
        return;
      default:
        return;
    }

    window.open(shareLink, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
    toast.success(`Shared on ${platform}!`);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `Check out "${post.title}" by ${post.artist?.name || 'Artist'}`,
          url: `${window.location.origin}/artwork/${post._id}`,
        });
        toast.success('Shared successfully!');
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Removed from saved' : 'Saved to collection');
  };

  // Navigate to artist profile
  const goToArtistProfile = () => {
    if (post.artistProfileId) {
      goToPage('artistProfile', { artistId: post.artistProfileId });
    }
  };

  // Follow/unfollow — delegates to Feed.jsx's shared handler so every
  // FeedPost by the same artist stays in sync (see onFollow/isFollowing props)
  const handleFollowClick = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.info('Please login to follow users');
      return;
    }
    if (!post.artist?._id) return;
    await onFollow(post.artist._id);
  };

  const isCommentOwner = (commentUserId) => {
    return commentUserId === currentUser?._id;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden mb-6"
    >
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={goToArtistProfile}
        >
          <img
            src={post.artist?.profilePicture || '/default-avatar.png'}
            alt={post.artist?.name || 'Artist'}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-800 hover:underline">{post.artist?.name || 'Artist'}</h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
              {post.isFeatured && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Featured</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Follow Button - Show for all users except the post owner */}
          {!isPostOwner && post.artist?._id && (
            <button
              onClick={handleFollowClick}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Commission Button - For non-artists */}
      {currentUser?.role !== 'admin' && currentUser?._id !== post.artist?._id && (
        <div className="px-4 pb-2">
          <RequestCommissionButton
            artistId={post.artistProfileId}
            artistName={post.artist?.name}
            variant="small"
          />
        </div>
      )}

      {/* Post Image */}
      <div className="relative bg-gray-100">
        <img
          src={post.imageUrl}
          alt={post.title}
          className="w-full max-h-[600px] object-contain"
        />
        {post.isForSale && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
            For Sale - ${post.price}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              className="hover:text-red-500 transition"
            >
              <Heart size={24} fill={isLiked ? '#ef4444' : 'none'} className={isLiked ? 'text-red-500' : 'text-gray-600'} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowComments(!showComments)}
              className="hover:text-blue-500 transition"
            >
              <MessageCircle size={24} className="text-gray-600" />
            </motion.button>
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleNativeShare}
                className="hover:text-green-500 transition"
              >
                <Share2 size={24} className="text-gray-600" />
              </motion.button>

              {/* Share Menu Popup */}
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute left-0 mt-2 bg-white rounded-xl shadow-2xl p-3 z-10 min-w-[200px]"
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
                        {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                        <span className="text-sm">{copied ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSave}
            className="hover:text-amber-500 transition"
          >
            <Bookmark size={24} fill={isSaved ? '#f59e0b' : 'none'} className={isSaved ? 'text-amber-500' : 'text-gray-600'} />
          </motion.button>
        </div>

        {/* Likes Count */}
        <p className="font-semibold text-sm mb-2">{likesCount.toLocaleString()} likes</p>

        {/* Caption */}
        <div className="mb-3">
          <span className="font-semibold mr-2">{post.artist?.name || 'Artist'}</span>
          <span className="text-gray-700">{post.description}</span>
        </div>

        {/* Comments Preview */}
        {comments.length > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-gray-500 text-sm mb-2 hover:text-gray-700 transition"
          >
            View all {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </button>
        )}

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t pt-3 mt-3 space-y-3"
            >
              {comments.map((comment) => (
                <div key={comment._id} className="flex justify-between items-start group relative">
                  <div className="flex-1">
                    <span className="font-semibold text-sm mr-2">{comment.user?.name}</span>
                    <span className="text-sm text-gray-700">{comment.text}</span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {(isCommentOwner(comment.user?._id) || isPostOwner) && (
                    <button
                      onClick={() => setShowDeleteConfirm(comment._id)}
                      className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-600 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  {/* Delete Confirmation */}
                  {showDeleteConfirm === comment._id && (
                    <div className="absolute right-0 top-0 bg-white shadow-lg rounded-lg p-2 flex gap-2 z-10 border">
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-red-500 text-xs px-2 py-1 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="text-gray-500 text-xs px-2 py-1 hover:bg-gray-50 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="flex gap-2 mt-3">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="text-amber-600 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Artwork Details */}
        <div className="mt-3 pt-3 border-t text-xs text-gray-500 flex flex-wrap gap-3">
          <span>{post.medium || 'Medium not specified'}</span>
          {post.dimensions && <span>• {post.dimensions}</span>}
          <span>• {post.category}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default FeedPost;