// Test database connection
import mongoose from 'mongoose';
import connectToDB from './src/utils/dbConnect.js';

async function testConnection() {
  console.log('Testing database connection...');
  try {
    const db = await connectToDB();
    console.log('Successfully connected to MongoDB!');
    
    // Try to get a list of collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Available collections: ${collections.map(c => c.name).join(', ')}`);
    
    // Check if we have the required collections
    const requiredCollections = ['arts', 'tours', 'users'];
    const foundCollections = collections.map(c => c.name);
    
    for (const coll of requiredCollections) {
      if (foundCollections.includes(coll)) {
        console.log(`✅ Collection '${coll}' found`);
      } else {
        console.log(`❌ Collection '${coll}' NOT found`);
      }
    }
    
    // Try to count documents in the arts collection
    if (foundCollections.includes('arts')) {
      const artCount = await mongoose.connection.db.collection('arts').countDocuments();
      console.log(`The 'arts' collection has ${artCount} documents`);
    }
    
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  } finally {
    // Close the connection
    try {
      await mongoose.connection.close();
      console.log('Database connection closed');
    } catch (e) {
      console.log('Error closing connection', e);
    }
    process.exit(0);
  }
}

testConnection();