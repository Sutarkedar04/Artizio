import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Artist from '../models/Artist.js';
import Artwork from '../models/Artwork.js';

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Migrate existing artworks to have artist field
    const artworks = await Artwork.find({ artist: { $exists: false } });
    console.log(`Found ${artworks.length} artworks without artist field`);
    
    for (const artwork of artworks) {
      // Find the admin user to assign as artist
      const admin = await User.findOne({ role: 'admin' });
      if (admin) {
        artwork.artist = admin._id;
        await artwork.save();
        console.log(`Updated artwork: ${artwork.title}`);
      }
    }
    
    // Create artist profiles for users with artworks
    const usersWithArtworks = await Artwork.distinct('artist');
    for (const userId of usersWithArtworks) {
      const existingArtist = await Artist.findOne({ user: userId });
      if (!existingArtist) {
        const user = await User.findById(userId);
        if (user) {
          await Artist.create({
            user: userId,
            bio: user.bio || '',
            specialties: ['Painting', 'Drawing']
          });
          console.log(`Created artist profile for: ${user.name}`);
          
          // Update user role to artist if not admin
          if (user.role !== 'admin') {
            user.role = 'artist';
            await user.save();
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    process.exit();
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

migrate();