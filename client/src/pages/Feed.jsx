import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, Users, Palette, RefreshCw, Lock, Sparkles } from 'lucide-react';
import FeedPost from '../components/common/FeedPost';
import CreatePostModal from '../components/common/CreatePostModal';
import { useAuth } from '../contexts/AuthContext';
import { communityAPI, userAPI } from '../services/api';
import { toast } from 'react-toastify';

// How many trending posts a logged-out visitor gets to preview.
// Note: guests can't call GET /api/community/feed (it requires auth), so their
// preview comes from GET /api/community/trending, which is a public route.
const GUEST_PREVIEW_LIMIT = 5;

const Feed = () => {
  const { user, isLoggedIn } = useAuth();
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Set of artist (User) _ids the current user follows. Shared across every
  // FeedPost so that following an artist on one post updates the button on
  // every other post by the same artist, instead of each card tracking its
  // own local "isFollowing" state.
  const [followingIds, setFollowingIds] = useState(new Set());

  useEffect(() => {
    if (isLoggedIn) {
      fetchFeed();
      fetchTrending();
      fetchFollowing();
    } else {
      fetchGuestPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const enhancePosts = (allArtworks) => {
    const enhanced = allArtworks.map(art => ({
      ...art,
      artist: art.artist && typeof art.artist === 'object'
        ? art.artist
        : {
            _id: art.artist || 'unknown',
            name: 'Artist',
            profilePicture: null,
            email: ''
          },
      artistName: art.artist?.name || 'Artist'
    }));
    return enhanced.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // Full personalized feed (followed artists + popular) — logged-in users only
  const fetchFeed = async () => {
    try {
      const response = await communityAPI.getFeed();
      setPosts(enhancePosts(response.data.data));
    } catch (error) {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await communityAPI.getTrending();
      setTrending(response.data.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to load trending:', error);
    }
  };

  // Who the current user already follows — used to seed the Follow/Following
  // button state for every post in the feed.
  const fetchFollowing = async () => {
    if (!user?._id) return;
    try {
      const response = await userAPI.getFollowing(user._id);
      const ids = (response.data.data || []).map(u => u._id);
      setFollowingIds(new Set(ids));
    } catch (error) {
      console.error('Failed to load following list:', error);
    }
  };

  // Guests see a read-only slice of public trending artworks instead of the real feed
  const fetchGuestPreview = async () => {
    try {
      const response = await communityAPI.getTrending();
      const preview = enhancePosts(response.data.data.slice(0, GUEST_PREVIEW_LIMIT));
      setPosts(preview);
    } catch (error) {
      toast.error('Failed to load preview');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const promptSignIn = () => {
    toast.info('Sign in to like, comment, and see art from artists you follow');
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'login' }));
  };

  // Real like: calls the backend, then syncs local state to the server's response
  const handleLike = async (postId) => {
    if (!isLoggedIn) {
      promptSignIn();
      return;
    }
    try {
      const response = await communityAPI.likeArtwork(postId);
      const { liked, likesCount } = response.data;

      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post._id !== postId) return post;
          const otherLikes = (post.likes || []).filter(id => id !== user._id);
          return {
            ...post,
            likes: liked ? [...otherLikes, user._id] : otherLikes,
            likesCount
          };
        })
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update like');
    }
  };

  // Real comment: posts to the backend, then uses the authoritative comment list it returns
  const handleComment = async (postId, commentText) => {
    if (!isLoggedIn) {
      promptSignIn();
      return;
    }
    if (!commentText || !commentText.trim()) return;

    try {
      const response = await communityAPI.commentOnArtwork(postId, commentText.trim());
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId ? { ...post, comments: response.data.comments } : post
        )
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  };

  // Real delete: calls backend delete, then removes it from local state only on success
  const handleDeleteComment = async (postId, commentId) => {
    if (!isLoggedIn) {
      promptSignIn();
      return;
    }
    try {
      await communityAPI.deleteComment(postId, commentId);
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post._id !== postId) return post;
          return {
            ...post,
            comments: post.comments?.filter(c => c._id !== commentId) || []
          };
        })
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  // Follow/unfollow an artist. Updates the shared followingIds Set, so every
  // FeedPost by that artist (not just the one that was clicked) re-renders
  // with the correct Follow/Following state.
  const handleFollow = async (artistId) => {
    if (!isLoggedIn) {
      promptSignIn();
      return;
    }
    try {
      const response = await userAPI.followUser(artistId);
      const { following } = response.data;

      setFollowingIds(prev => {
        const next = new Set(prev);
        if (following) {
          next.add(artistId);
        } else {
          next.delete(artistId);
        }
        return next;
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update follow status');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (isLoggedIn) {
      fetchFeed();
      fetchTrending();
      fetchFollowing();
    } else {
      fetchGuestPreview();
    }
  };

  const handlePostCreated = () => {
    fetchFeed();
    fetchTrending();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Feed */}
        <div className="flex-1">
          {/* Feed Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">{isLoggedIn ? 'Feed' : 'Trending Now'}</h1>
              <p className="text-gray-500 text-sm">
                {isLoggedIn ? 'Discover artwork from artists' : "A preview of what's popular on Artizio"}
              </p>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              </motion.button>
              {isLoggedIn && (user?.role === 'artist' || user?.role === 'admin') && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl px-4 py-2 flex items-center gap-2 font-semibold shadow-lg"
                >
                  <Plus size={18} />
                  Create Post
                </motion.button>
              )}
            </div>
          </div>

          {/* Feed Posts */}
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <Palette size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No posts yet</p>
              {isLoggedIn && (user?.role === 'artist' || user?.role === 'admin') && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                >
                  Create First Post
                </button>
              )}
            </div>
          ) : (
            <>
              {posts.map(post => (
                <FeedPost
                  key={post._id}
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  onDeleteComment={handleDeleteComment}
                  onFollow={handleFollow}
                  isFollowing={followingIds.has(post.artist?._id)}
                  currentUser={user}
                />
              ))}

              {/* Sign-in gate for guests, shown after the preview instead of the real personalized feed */}
              {!isLoggedIn && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-white rounded-2xl shadow-sm p-8 text-center"
                >
                  <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock size={24} className="text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    This is just the highlights
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm max-w-sm mx-auto">
                    Sign in to see a personalized feed from artists you follow, like and comment on artwork, and request commissions directly.
                  </p>
                  <button
                    onClick={promptSignIn}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition shadow-lg"
                  >
                    <Sparkles size={18} />
                    Sign In to Unlock Your Feed
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Sidebar - Trending (logged-in users only; guests already see trending as their main feed) */}
        {isLoggedIn && (
          <div className="lg:w-80">
            <div className="sticky top-20">
              {/* Stats Card */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold mb-3">Your Activity</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Posts Liked</span>
                    <span className="font-semibold">
                      {posts.reduce((sum, post) => sum + (post.likes?.includes(user?._id) ? 1 : 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comments Made</span>
                    <span className="font-semibold">
                      {posts.reduce((sum, post) => sum + (post.comments?.filter(c => c.user?._id === user?._id).length || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trending Section */}
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={20} className="text-amber-600" />
                  <h3 className="font-semibold">Trending Artworks</h3>
                </div>
                {trending.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No trending artworks yet</p>
                ) : (
                  trending.map((artwork, idx) => (
                    <div key={artwork._id} className="flex items-center gap-3 mb-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition">
                      <span className="text-xl font-bold text-gray-300 w-8">#{idx + 1}</span>
                      <img src={artwork.imageUrl} alt={artwork.title} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{artwork.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{artwork.likes?.length || 0} likes</span>
                          <span>•</span>
                          <span>{artwork.comments?.length || 0} comments</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Suggested Section */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={20} className="text-amber-600" />
                  <h3 className="font-semibold">About Feed</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Like and comment on artworks to show support. Share artwork with your friends and family!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoggedIn && (
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
};

export default Feed;