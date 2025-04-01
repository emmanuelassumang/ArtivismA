/**
 * Script to check the arts collection in MongoDB
 * 
 * Run with: node scripts/check_arts_collection.js
 */

import { MongoClient, ObjectId } from 'mongodb';

// Connection URL
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'artivism';

async function main() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB!');
    
    const db = client.db(dbName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check for "arts" collection
    if (!collections.some(c => c.name === 'arts')) {
      console.log('Warning: "arts" collection does not exist!');
      
      // Check if there's a similar collection
      const artCollectionCandidates = collections
        .filter(c => c.name.toLowerCase().includes('art'))
        .map(c => c.name);
      
      if (artCollectionCandidates.length > 0) {
        console.log('Found potential art collections:', artCollectionCandidates);
      }
    }
    
    // Try to determine the correct collection name
    let artCollectionName = 'arts';
    if (!collections.some(c => c.name === 'arts')) {
      const candidates = collections
        .filter(c => c.name.toLowerCase().includes('art'))
        .map(c => c.name);
      
      if (candidates.length > 0) {
        artCollectionName = candidates[0];
        console.log(`Using "${artCollectionName}" as the art collection`);
      }
    }
    
    const artsCollection = db.collection(artCollectionName);
    
    // Count total artworks
    const totalCount = await artsCollection.countDocuments();
    console.log(`Total artworks in the database: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log('ERROR: No artwork found in the database!');
    } else {
      // Get a sample artwork to check structure
      const sampleArtwork = await artsCollection.findOne({});
      console.log('Sample artwork structure:', JSON.stringify(sampleArtwork, null, 2));
      
      // Check for artworks with valid location data
      const validLocationCount = await artsCollection.countDocuments({
        'location.coordinates': { $type: 'array', $exists: true }
      });
      console.log(`Artworks with valid location.coordinates array: ${validLocationCount}`);
      
      // Check for artworks with invalid location data
      const invalidLocationCount = await artsCollection.countDocuments({
        $or: [
          { 'location.coordinates': { $exists: false } },
          { 'location.coordinates': { $type: { $ne: 'array' } } }
        ]
      });
      console.log(`Artworks with missing or invalid location.coordinates: ${invalidLocationCount}`);
      
      // Get sample of artworks with valid location data
      const sampleWithValidLocation = await artsCollection
        .find({ 'location.coordinates': { $type: 'array', $exists: true } })
        .limit(3)
        .toArray();
      
      console.log('\nSample artworks with valid location data:');
      sampleWithValidLocation.forEach(art => {
        console.log(`- ${art.name || 'Untitled'} (ID: ${art._id})`);
        console.log(`  Coordinates: ${JSON.stringify(art.location.coordinates)}`);
        console.log(`  City: ${art.location.city || 'Unknown'}`);
      });
    }
    
    // Check the tours collection
    const toursCollection = db.collection('tours');
    const totalTours = await toursCollection.countDocuments();
    console.log(`\nTotal tours in the database: ${totalTours}`);
    
    // Get sample tours
    const sampleTours = await toursCollection.find().limit(3).toArray();
    
    if (sampleTours.length > 0) {
      console.log('\nSample tours:');
      for (const tour of sampleTours) {
        console.log(`- ${tour.tour_name || 'Untitled Tour'} (ID: ${tour._id})`);
        console.log(`  Artworks count: ${tour.artworks?.length || 0}`);
        
        if (tour.artworks && tour.artworks.length > 0) {
          // Check if the referenced artworks exist
          const artworkIds = tour.artworks;
          try {
            const existingArtworks = await artsCollection.countDocuments({
              _id: { $in: artworkIds.map(id => {
                try {
                  return new ObjectId(id);
                } catch (e) {
                  return id;
                }
              })}
            });
            
            console.log(`  Referenced artworks found in arts collection: ${existingArtworks} out of ${artworkIds.length}`);
            
            if (existingArtworks < artworkIds.length) {
              console.log('  Warning: Some artwork references in this tour may be invalid');
            }
          } catch (error) {
            console.error('  Error checking artwork references:', error.message);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Connection closed.');
  }
}

main().catch(console.error);