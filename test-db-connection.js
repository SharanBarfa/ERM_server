import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};

// Test remote connection
const testRemoteConnection = async () => {
  try {
    console.log('Testing remote MongoDB connection...');
    console.log('Connection string:', process.env.MONGODB_URI);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log('Remote connection successful!');
    
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.error(`Remote MongoDB connection error: ${error.message}`);
    return false;
  }
};

// Test local connection
const testLocalConnection = async () => {
  try {
    console.log('Testing local MongoDB connection...');
    console.log('Connection string:', process.env.MONGODB_LOCAL_URI);
    
    const conn = await mongoose.connect(process.env.MONGODB_LOCAL_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log('Local connection successful!');
    
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.error(`Local MongoDB connection error: ${error.message}`);
    return false;
  }
};

// Update .env file to use local or remote connection
const updateEnvFile = (useLocal) => {
  try {
    const envPath = path.resolve('.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace the USE_LOCAL_DB line
    envContent = envContent.replace(
      /USE_LOCAL_DB=(true|false)/,
      `USE_LOCAL_DB=${useLocal}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log(`.env file updated to use ${useLocal ? 'local' : 'remote'} database`);
  } catch (error) {
    console.error(`Error updating .env file: ${error.message}`);
  }
};

// Main function
const main = async () => {
  console.log('Testing database connections...');
  
  // Test remote connection first
  const remoteSuccess = await testRemoteConnection();
  
  if (remoteSuccess) {
    console.log('Remote connection is working. Setting as default.');
    updateEnvFile(false);
    process.exit(0);
  }
  
  // If remote fails, test local
  console.log('Remote connection failed. Testing local connection...');
  const localSuccess = await testLocalConnection();
  
  if (localSuccess) {
    console.log('Local connection is working. Setting as default.');
    updateEnvFile(true);
    process.exit(0);
  }
  
  // If both fail
  console.error('Both remote and local connections failed. Please check your MongoDB setup.');
  process.exit(1);
};

// Run the main function
main();
