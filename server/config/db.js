// config/db.js
import mongoose from 'mongoose';

const connectDB = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 MongoDB connection attempt ${i + 1}/${retries}...`);
      
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000, // 10 seconds (was 5000)
        socketTimeoutMS: 45000, // 45 seconds
        connectTimeoutMS: 10000, // 10 seconds
        family: 4, // Force IPv4 (often faster)
        maxPoolSize: 10, // Connection pool size
        retryWrites: true,
        w: 'majority'
      });
      
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📊 Database: ${conn.connection.name}`);
      console.log(`🔌 Connection Pool Size: ${conn.connection.readyState}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected successfully');
      });

      return conn;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        console.error('❌ All connection attempts failed. Exiting process.');
        process.exit(1);
      }
      
      // Wait longer between retries
      const waitTime = 3000 * (i + 1); // 3s, 6s, 9s...
      console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

export default connectDB;