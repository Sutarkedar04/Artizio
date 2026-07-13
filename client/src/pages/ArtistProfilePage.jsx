// src/pages/ArtistProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Grid, MessageCircle, Heart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import RequestCommissionButton from '../components/common/RequestCommissionButton';
import ArtworkModal from '../components/common/ArtworkModal';
import ProfileHeader from '../components/profile/ProfileHeader'; // Add this import
import { artistAPI,userAPI } from '../services/api';
import { toast } from 'react-toastify';
import { goToPage } from '../utils/navigation';

const ArtistProfilePage = ({ artistId }) => {
  const id = artistId;
  const { user } = useAuth();
  const [artistProfile, setArtistProfile] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [stats, setStats] = useState({ followersCount: 0, followingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followSubmitting, setFollowSubmitting] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState(null);

  useEffect(() => {
    if (id) fetchArtistProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchArtistProfile = async () => {
    setLoading(true);
    try {
      const response = await artistAPI.getProfile(id);
      const { artist, artworks: artistArtworks, stats: artistStats } = response.data.data;

      setArtistProfile(artist);
      setArtworks(artistArtworks || []);
      setStats(artistStats || { followersCount: 0, followingCount: 0 });

      if (user && artist.user?.followers) {
        setIsFollowing(artist.user.followers.some(followerId =>
          (followerId?._id || followerId).toString() === user._id.toString()
        ));
      }
    } catch (error) {
      toast.error('Failed to load artist profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.info('Please login to follow artists');
      return;
    }
    if (followSubmitting) return;

    setFollowSubmitting(true);
    try {
      const response = await userAPI.followUser(artistUser._id);
      setIsFollowing(response.data.following);
      setStats(prev => ({ ...prev, followersCount: response.data.count }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update follow status');
    } finally {
      setFollowSubmitting(false);
    }
  };

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/artist/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: artistUser?.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Profile link copied');
      }
    } catch (error) {
      // user cancelled share, ignore
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-600"></div>
      </div>
    );
  }

  if (!artistProfile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Artist not found</h2>
      </div>
    );
  }

  const artistUser = artistProfile.user || {};
  const isOwnProfile = user && artistUser._id && user._id.toString() === artistUser._id.toString();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 pt-8 pb-12 max-w-4xl">

        {/* Replace the entire header section with ProfileHeader */}
        <ProfileHeader
    user={artistUser}
    profileData={artistProfile}
    isArtist={true}
    mode="artist"
    artworks={artworks}
    stats={stats}
    isOwnProfile={isOwnProfile}
    isFollowing={isFollowing}
    followSubmitting={followSubmitting}
    onFollow={handleFollow}
    onShareProfile={handleShareProfile}
    onEditProfile={() => goToPage("accountSettings")}
/>

        {/* Tab bar */}
        <div className="border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 -mt-px pt-4 pb-2 border-t-2 border-gray-900 w-fit mx-auto sm:mx-0 px-1">
            <Grid size={14} className="text-gray-900" />
            <span className="text-xs font-semibold tracking-widest text-gray-900 uppercase">Posts</span>
          </div>
        </div>

        {/* Artworks Grid - square Instagram-style thumbnails */}
        <div className="mt-2">
          {artworks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl mt-4">
              <Grid size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">
                {isOwnProfile ? "You haven't posted any artwork yet" : 'No artworks yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-1">
              {artworks.map((artwork, index) => (
                <motion.div
                  key={artwork._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(index * 0.03, 0.6) }}
                  onClick={() => setSelectedArtwork(artwork)}
                  className="relative aspect-square overflow-hidden cursor-pointer group bg-gray-100"
                >
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {artwork.isFeatured && (
                    <span className="absolute top-2 right-2 text-amber-400 text-lg drop-shadow">★</span>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center gap-5 opacity-0 group-hover:opacity-100">
                    <span className="flex items-center gap-1.5 text-white font-semibold text-sm">
                      <Heart size={18} fill="white" /> {artwork.likes?.length || 0}
                    </span>
                    <span className="flex items-center gap-1.5 text-white font-semibold text-sm">
                      <MessageCircle size={18} fill="white" /> {artwork.comments?.length || 0}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ArtworkModal with update/delete callbacks */}
      <ArtworkModal
        artwork={selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
        onArtworkUpdated={(updated) => {
          setArtworks(prev => prev.map(a => a._id === updated._id ? updated : a));
          setSelectedArtwork(updated);
        }}
        onArtworkDeleted={(id) => {
          setArtworks(prev => prev.filter(a => a._id !== id));
        }}
      />
    </div>
  );
};

export default ArtistProfilePage;