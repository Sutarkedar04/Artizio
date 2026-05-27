import React, { useState } from 'react';
import ManageArtworks from './ManageArtworks';
import UploadArtwork from './UploadArtwork';
import ManageCommissions from './ManageCommissions';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('commissions');

  const tabs = [
    { id: 'commissions', label: 'Commission Requests' },
    { id: 'artworks', label: 'Manage Artworks' },
    { id: 'upload', label: 'Upload Artwork' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-6">
        <div className="flex space-x-4 border-b mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition ${
                activeTab === tab.id
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-600 hover:text-amber-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'commissions' && <ManageCommissions />}
        {activeTab === 'artworks' && <ManageArtworks />}
        {activeTab === 'upload' && <UploadArtwork />}
      </div>
    </div>
  );
};

export default AdminDashboard;