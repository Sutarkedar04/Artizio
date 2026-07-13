// src/components/profile/ProfileEditForm.jsx
import React, { useState } from 'react';
import { Camera, Save, Lock, User } from 'lucide-react';

const ProfileEditForm = ({
  formData,
  setFormData,
  profilePicture,
  previewUrl,
  loading,
  editing,
  wantsPasswordChange,
  setWantsPasswordChange,
  resetPasswordFields,
  handleImageChange,
  handleSubmit,
  onCancel
}) => {
  return (
    <div className="border-t px-6 py-6">
      <h2 className="text-xl font-bold mb-6">Personal Information</h2>
      
      {/* Profile Picture Upload - Only visible when editing */}
      {editing && (
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300">
              {previewUrl ? (
                <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={32} className="text-gray-400" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-amber-600 p-1.5 rounded-full cursor-pointer hover:bg-amber-700 shadow-lg">
              <Camera size={14} className="text-white" />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                className="hidden" 
              />
            </label>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Profile Picture</p>
            <p className="text-xs text-gray-500">Click the camera icon to upload</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          {editing ? (
            <input 
              type="text" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
              required 
            />
          ) : (
            <p className="p-3 bg-gray-50 rounded-lg">{formData.name}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          {editing ? (
            <input 
              type="email" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
              required 
            />
          ) : (
            <p className="p-3 bg-gray-50 rounded-lg">{formData.email}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
          {editing ? (
            <input 
              type="tel" 
              value={formData.mobileNumber} 
              onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})} 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
              pattern="[0-9]{10}" 
              required 
            />
          ) : (
            <p className="p-3 bg-gray-50 rounded-lg">{formData.mobileNumber}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          {editing ? (
            <input 
              type="text" 
              value={formData.location} 
              onChange={(e) => setFormData({...formData, location: e.target.value})} 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
              placeholder="City, Country" 
            />
          ) : (
            <p className="p-3 bg-gray-50 rounded-lg">{formData.location || 'Not specified'}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          {editing ? (
            <textarea 
              value={formData.bio} 
              onChange={(e) => setFormData({...formData, bio: e.target.value})} 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
              rows="4" 
              placeholder="Tell us about yourself..." 
            />
          ) : (
            <p className="p-3 bg-gray-50 rounded-lg">{formData.bio || 'No bio added yet'}</p>
          )}
        </div>

        {editing && (
          <div className="border-t pt-4 mt-2">
            {!wantsPasswordChange ? (
              <button
                type="button"
                onClick={() => setWantsPasswordChange(true)}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
              >
                <Lock size={14} /> Change Password
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Lock size={14} /> Change Password
                  </p>
                  <button
                    type="button"
                    onClick={resetPasswordFields}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Enter your current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {editing && (
          <div className="flex gap-3 pt-4">
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center"
            >
              <Save size={18} className="mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              type="button" 
              onClick={onCancel} 
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileEditForm;