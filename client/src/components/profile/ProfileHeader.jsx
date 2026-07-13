// src/components/profile/ProfileHeader.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Calendar, Star, BadgeCheck, Globe,
  Pencil, Share2, User, Brush, ArrowLeft
} from 'lucide-react';
import RequestCommissionButton from '../common/RequestCommissionButton';
import { goToPage } from '../../utils/navigation';

// Social icons
const InstagramIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="2" y="2" width="20" height="20" rx="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const ProfileHeader = ({
  // Core user data
  user,
  profileData,
  isArtist = false,
  isOwnProfile = true,
  
  // Stats - Universal for ALL users now
  stats = { followersCount: 0, followingCount: 0 },
  artworks = [],
  
  // Actions
  onEditProfile,
  onSwitchRole,
  onShareProfile,
  
  // Follow functionality (for non-own profiles)
  isFollowing = false,
  followSubmitting = false,
  onFollow = null,
  
  // Mode: 'artist' or 'user'
  mode = 'user',
  
  // Loading state
  loading = false
}) => {
  // Determine the user object (could be from user or artistProfile.user)
  const userData = user || profileData?.user || profileData;
  const displayName = userData?.name || '';
  const profilePicture = userData?.profilePicture || '';
  const location = userData?.location || '';
  const bio = profileData?.bio || userData?.bio || '';
  const createdAt = userData?.createdAt || profileData?.createdAt || new Date();
  
  // Artist-specific data
  const isVerified = profileData?.verified || false;
  const specialties = profileData?.specialties || [];
  const rating = profileData?.rating || 0;
  const totalReviews = profileData?.totalReviews || 0;
  const socialLinks = profileData?.socialLinks || {};
  
  const hasSocialLinks = socialLinks.instagram || socialLinks.twitter || 
                        socialLinks.facebook || socialLinks.website;

  const socialIconMap = [
    { key: 'instagram', icon: InstagramIcon, url: socialLinks.instagram },
    { key: 'twitter', icon: TwitterIcon, url: socialLinks.twitter },
    { key: 'facebook', icon: FacebookIcon, url: socialLinks.facebook },
    { key: 'website', icon: Globe, url: socialLinks.website },
  ].filter(link => link.url);

  // Format numbers (Instagram style)
  const formatCount = (num = 0) => {
    if (num < 1000) return `${num}`;
    if (num < 1000000) return `${(num / 1000).toFixed(num % 1000 >= 100 ? 1 : 0)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  const handleEditProfile = () => {
    if (onEditProfile) {
      onEditProfile();
    } else {
      goToPage('accountSettings');
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
      {/* Profile Picture */}
      <div className="relative flex-shrink-0">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
          {profilePicture ? (
            <img src={profilePicture} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={48} className="text-gray-400" />
            </div>
          )}
        </div>
      </div>
      
      {/* Profile Info */}
      <div className="flex-1 text-center md:text-left">
        {/* Name and Badges */}
        <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{displayName}</h1>
          {isArtist && isVerified && (
            <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1">
              <BadgeCheck size={14} /> Verified
            </span>
          )}
          {isArtist && (
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-semibold">
              Artist
            </span>
          )}
        </div>
        
        {/* Location */}
        <p className="text-gray-500">{location || 'No location set'}</p>
        
        {/* Bio */}
        {bio && (
          <p className="text-gray-600 mt-2">{bio}</p>
        )}
        
        {/* Stats - Instagram style for ALL users */}
        <div className="flex items-center justify-center md:justify-start gap-8 mt-4">
          {/* Posts count - only for artists */}
          {mode === "artist" && (
            <div className="text-center">
              <span className="block text-lg font-bold">
                {formatCount(artworks.length)}
              </span>
              <span className="text-sm text-gray-500">posts</span>
            </div>
          )}

          {/* Followers - Universal for ALL users (Instagram style) */}
          <div className="text-center">
            <span className="block text-lg font-bold">
              {formatCount(stats.followersCount)}
            </span>
            <span className="text-sm text-gray-500">followers</span>
          </div>

          {/* Following - Universal for ALL users (Instagram style) */}
          <div className="text-center">
            <span className="block text-lg font-bold">
              {formatCount(stats.followingCount)}
            </span>
            <span className="text-sm text-gray-500">following</span>
          </div>

          {/* Rating - only for artists with reviews */}
          {mode === "artist" && totalReviews > 0 && (
            <div className="hidden sm:block text-center">
              <span className="flex items-center gap-1 text-lg font-bold text-gray-900">
                <Star size={16} className="text-amber-500" fill="currentColor" />
                {rating?.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">
                {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Specialties - Artist only */}
        {mode === "artist" && specialties.length > 0 && (
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
            {specialties.map(specialty => (
              <span
                key={specialty}
                className="text-xs font-medium px-3 py-1 bg-amber-50 text-amber-700 rounded-full"
              >
                {specialty}
              </span>
            ))}
          </div>
        )}

        {/* Social Links - Artist only */}
        {mode === "artist" && hasSocialLinks && (
          <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
            {socialIconMap.map(({ key, icon: Icon, url }) => (
              <a
                key={key}
                href={url.startsWith('http') ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        )}

        {/* Member since */}
        <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar size={14} /> Member since {new Date(createdAt).getFullYear()}
          </span>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col gap-2 w-full md:w-auto">
        {isOwnProfile ? (
          <>
            {/* Edit Profile Button */}
            <button 
              onClick={handleEditProfile} 
              className="px-6 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition flex items-center justify-center gap-2"
            >
              <Pencil size={16} /> Edit Profile
            </button>
            
            {/* Role Switch Button - Only for own profile */}
            {onSwitchRole && (
              <button 
                onClick={onSwitchRole}
                className={`px-6 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                  isArtist 
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isArtist ? (
                  <>
                    <ArrowLeft size={16} /> Switch to User
                  </>
                ) : (
                  <>
                    <Brush size={16} /> Become an Artist
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          // For viewing other people's profiles
          <>
            {/* Follow Button - Universal for ALL users */}
            {onFollow && (
              <button
                onClick={onFollow}
                disabled={followSubmitting}
                className={`px-5 py-1.5 rounded-lg font-semibold text-sm transition disabled:opacity-60 ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
            
            {/* Request Commission - Only for artists */}
            {mode === "artist" && (
              <RequestCommissionButton
                artistId={userData._id}
                artistName={displayName}
                variant="button"
              />
            )}
          </>
        )}
        
        {/* Share Profile Button - Universal */}
        {onShareProfile && (
          <button
            onClick={onShareProfile}
            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            title="Share profile"
          >
            <Share2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;