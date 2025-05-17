import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String
});

// Create User model
const User = mongoose.model('User', userSchema, 'users');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected');

    try {
      // Check if test user already exists
      const existingUser = await User.findOne({ email: 'test@example.com' });

      if (existingUser) {
        console.log('Test user already exists');
      } else {
        // Create salt & hash
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // Create test user
        const testUser = new User({
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword,
          role: 'employee'
        });

        // Save user
        await testUser.save();
        console.log('Test user created successfully');
      }
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      // Close connection
      mongoose.disconnect();
      console.log('MongoDB Disconnected');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
  });
