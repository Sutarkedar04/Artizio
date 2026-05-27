import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const adminExists = await User.findOne({ email: 'admin@artvault.com' });
    
    if (!adminExists) {
      await User.create({
        name: 'Kedar Sutar',
        email: 'sutarkedar14@gmail.com',
        mobileNumber: '9623744227',
        password: 'kedar@14',
        role: 'admin',
        bio: 'Art Gallery Administrator',
        location: 'ArtVault Studio'
      });
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: sutarkedar14@gmail.com');
      console.log('📱 Mobile: 9623744227');
      console.log('🔑 Password: kedar@14');
    } else {
      console.log('⚠️ Admin user already exists');
    }
    
    process.exit();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();