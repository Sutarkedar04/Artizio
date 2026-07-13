// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { goToPage } from '../utils/navigation';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileEditForm from '../components/profile/ProfileEditForm';
import SwitchAccountModal from '../components/profile/SwitchAccountModal';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '', email: '', mobileNumber: '', bio: '', location: '',
    currentPassword: '', password: '', confirmPassword: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [wantsPasswordChange, setWantsPasswordChange] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [artistStatus, setArtistStatus] = useState({ 
    isArtist: false, 
    artistId: null, 
    hasArtworks: 0,
    followersCount: 0,
    followingCount: 0
  });

  const isArtist = user?.role === 'artist' || user?.isArtist === true;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobileNumber: user.mobileNumber || '',
        bio: user.bio || '',
        location: user.location || '',
        currentPassword: '',
        password: '',
        confirmPassword: ''
      });
      setPreviewUrl(user.profilePicture || '');
      checkArtistStatus();
    }
  }, [user]);

  const checkArtistStatus = async () => {
    try {
      const response = await userAPI.getArtistStatus();
      setArtistStatus(response.data.data);
    } catch (error) {
      console.error('Failed to check artist status:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const resetPasswordFields = () => {
    setWantsPasswordChange(false);
    setFormData(prev => ({ ...prev, currentPassword: '', password: '', confirmPassword: '' }));
  };

  const handleUpgradeToArtist = async () => {
    setSwitchLoading(true);
    try {
      const response = await userAPI.upgradeToArtist();
      updateUser(response.data.data);
      setShowSwitchModal(false);

      const statusRes = await userAPI.getArtistStatus();
      const newArtistId = statusRes.data?.data?.artistId;
      setArtistStatus(statusRes.data.data);

      toast.success('You are now an artist! Taking you to your artist profile...');
      if (newArtistId) {
        goToPage('artistProfile', { artistId: newArtistId });
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error(error.response?.data?.message || 'Failed to upgrade to artist');
    } finally {
      setSwitchLoading(false);
    }
  };

  const handleSwitchToUser = async () => {
    setSwitchLoading(true);
    try {
      const response = await userAPI.switchToUser();
      updateUser(response.data.data);
      toast.success('Switched back to regular user account');
      setShowSwitchModal(false);
      await checkArtistStatus();
    } catch (error) {
      console.error('Switch error:', error);
      if (error.response?.data?.artworkCount) {
        toast.error(`You have ${error.response.data.artworkCount} artwork(s). Please delete them first.`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to switch back');
      }
    } finally {
      setSwitchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (wantsPasswordChange) {
      if (!formData.currentPassword) {
        toast.error('Please enter your current password to change it');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        toast.error('New password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
    }

    setLoading(true);
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('email', formData.email);
    submitData.append('mobileNumber', formData.mobileNumber);
    submitData.append('bio', formData.bio);
    submitData.append('location', formData.location);

    if (wantsPasswordChange) {
      submitData.append('currentPassword', formData.currentPassword);
      submitData.append('password', formData.password);
    }

    if (profilePicture) submitData.append('profilePicture', profilePicture);

    try {
      const response = await userAPI.updateProfile(submitData);
      updateUser(response.data.data);
      toast.success('Profile updated successfully!');
      setEditing(false);
      resetPasswordFields();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    resetPasswordFields();
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobileNumber: user.mobileNumber || '',
        bio: user.bio || '',
        location: user.location || '',
        currentPassword: '',
        password: '',
        confirmPassword: ''
      });
      setPreviewUrl(user.profilePicture || '');
    }
  };

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/profile/${user?._id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: user?.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Profile link copied');
      }
    } catch (error) {
      // user cancelled share, ignore
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Profile Header */}
        <div className="px-6 pb-6 pt-6">
          <ProfileHeader
            user={user}
            profileData={user}
            isArtist={isArtist}
            isOwnProfile={true}
            mode="user"
            stats={{
              followersCount: artistStatus.followersCount || 0,
              followingCount: artistStatus.followingCount || 0,
            }}
            onEditProfile={() => setEditing(true)}
            onSwitchRole={() => setShowSwitchModal(true)}
            onShareProfile={handleShareProfile}
          />
        </div>

        {/* Profile Edit Form */}
        <ProfileEditForm
          formData={formData}
          setFormData={setFormData}
          profilePicture={profilePicture}
          previewUrl={previewUrl}
          loading={loading}
          editing={editing}
          wantsPasswordChange={wantsPasswordChange}
          setWantsPasswordChange={setWantsPasswordChange}
          resetPasswordFields={resetPasswordFields}
          handleImageChange={handleImageChange}
          handleSubmit={handleSubmit}
          onCancel={handleCancelEdit}
        />
      </motion.div>

      {/* Switch Account Modal */}
      <SwitchAccountModal
        isOpen={showSwitchModal}
        isArtist={isArtist}
        artistStatus={artistStatus}
        switchLoading={switchLoading}
        onClose={() => setShowSwitchModal(false)}
        onUpgradeToArtist={handleUpgradeToArtist}
        onSwitchToUser={handleSwitchToUser}
      />
    </div>
  );
};

export default ProfilePage;