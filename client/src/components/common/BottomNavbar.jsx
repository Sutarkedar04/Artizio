import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Headphones } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const BottomNavbar = () => {
  const { isLoggedIn, isAdmin } = useAuth();

  // Only show for regular users who are logged in (not for admin)
  if (!isLoggedIn || isAdmin) return null;

  // Admin contact details to show to users
  const adminContact = {
    email: 'Artizio@gmail.com',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg mt-12"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Support Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
              <Headphones size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-amber-400">Need Help?</p>
              <p className="text-sm font-semibold text-white">Contact Admin</p>
            </div>
          </div>

          {/* Admin Email */}
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-amber-400" />
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm text-gray-200">{adminContact.email}</p>
            </div>
          </div>


          {/* Copyright */}
          <div className="text-xs text-gray-500">
            © {new Date().getFullYear()} Artizio
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BottomNavbar;