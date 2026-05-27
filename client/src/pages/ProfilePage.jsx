import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { User, Mail, Phone, MapPin, FileText, Camera, Save } from 'lucide-react';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '', email: '', mobileNumber: '', bio: '', location: '', password: '', confirmPassword: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobileNumber: user.mobileNumber || '',
        bio: user.bio || '',
        location: user.location || '',
        password: '',
        confirmPassword: ''
      });
      setPreviewUrl(user.profilePicture || '');
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] && key !== 'confirmPassword') {
        submitData.append(key, formData[key]);
      }
    });
    if (profilePicture) submitData.append('profilePicture', profilePicture);

    try {
      const response = await userAPI.updateProfile(submitData);
      updateUser(response.data.data);
      toast.success('Profile updated successfully!');
      setEditing(false);
      setFormData({ ...formData, password: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 border-b">
          <h2 className="text-2xl font-bold">My Profile</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><User size={48} className="text-gray-400" /></div>
                )}
              </div>
              {editing && (
                <label className="absolute bottom-0 right-0 bg-amber-600 p-2 rounded-full cursor-pointer hover:bg-amber-700">
                  <Camera size={16} className="text-white" />
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><User size={16} className="inline mr-1" /> Full Name</label>
              {editing ? (
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-lg" required />
              ) : (
                <p className="p-3 bg-gray-50 rounded-lg">{formData.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><Mail size={16} className="inline mr-1" /> Email</label>
              {editing ? (
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-3 border rounded-lg" required />
              ) : (
                <p className="p-3 bg-gray-50 rounded-lg">{formData.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><Phone size={16} className="inline mr-1" /> Mobile Number</label>
              {editing ? (
                <input type="tel" value={formData.mobileNumber} onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})} className="w-full p-3 border rounded-lg" pattern="[0-9]{10}" required />
              ) : (
                <p className="p-3 bg-gray-50 rounded-lg">{formData.mobileNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><MapPin size={16} className="inline mr-1" /> Location</label>
              {editing ? (
                <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="City, Country" />
              ) : (
                <p className="p-3 bg-gray-50 rounded-lg">{formData.location || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><FileText size={16} className="inline mr-1" /> Bio</label>
              {editing ? (
                <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full p-3 border rounded-lg" rows="3" placeholder="Tell us about yourself..." />
              ) : (
                <p className="p-3 bg-gray-50 rounded-lg">{formData.bio || 'No bio added yet'}</p>
              )}
            </div>

            {editing && (
              <>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">New Password (optional)</label><input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full p-3 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label><input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="w-full p-3 border rounded-lg" /></div>
              </>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            {editing ? (
              <>
                <button type="submit" disabled={loading} className="flex-1 bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50"><Save size={18} className="inline mr-2" />{loading ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => { setEditing(false); if (user) { setFormData({ name: user.name || '', email: user.email || '', mobileNumber: user.mobileNumber || '', bio: user.bio || '', location: user.location || '', password: '', confirmPassword: '' }); setPreviewUrl(user.profilePicture || ''); } }} className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400">Cancel</button>
              </>
            ) : (
              <button type="button" onClick={() => setEditing(true)} className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700">Edit Profile</button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfilePage;