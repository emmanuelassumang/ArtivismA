/**
 * Test coordinate format in database vs what's needed for the map
 * 
 * Usage: node scripts/test_coordinates.js
 * 
 * This script checks the format of coordinates in your arts collection
 * and helps diagnose any mapping issues.
 */

import connectToDB from "../src/db/mongodb.js";

async function testCoordinates() {
  let mongooseInstance;
  try {
    console.log("Connecting to MongoDB...");
    mongooseInstance = await connectToDB();
    
    const db = mongooseInstance.connection.db;
    
    // Get a sample of artworks with coordinates
    const artworks = await db.collection("arts")
      .find({"location.coordinates": {$exists: true}})
      .limit(5)
      .toArray();
    
    if (artworks.length === 0) {
      console.log("❌ No artworks with coordinates found in the database.");
      return;
    }
    
    console.log(`✅ Found ${artworks.length} artworks with coordinates.`);
    
    // Analyze each artwork's coordinates
    artworks.forEach((art, index) => {
      console.log(`\nArtwork ${index + 1}: ${art.name}`);
      
      const coords = art.location.coordinates;
      console.log(`Raw coordinates: [${coords.join(', ')}]`);
      
      // Check if coordinates seem to be in the correct order
      const [coord1, coord2] = coords;
      
      // Determine if this is likely [lat, lng] or [lng, lat]
      let format = "unknown";
      
      // Latitude should be between -90 and 90
      // Longitude should be between -180 and 180
      if (Math.abs(coord1) <= 90 && Math.abs(coord2) <= 180) {
        // This could be [lat, lng] but needs further checking
        format = "possibly [lat, lng]";
      }
      
      if (Math.abs(coord1) > 90 && Math.abs(coord1) <= 180 && Math.abs(coord2) <= 90) {
        format = "likely [lng, lat] - NEEDS CONVERSION FOR LEAFLET";
      }
      
      console.log(`Coordinate format: ${format}`);
      
      // For Leaflet consumption, the format should be [lat, lng]
      console.log("For Leaflet map display, coordinates should be [lat, lng]");
      
      if (format === "likely [lng, lat] - NEEDS CONVERSION FOR LEAFLET") {
        console.log(`Converted coordinates for Leaflet: [${coord2}, ${coord1}]`);
      }
    });
    
    console.log("\nCoordinate format test complete!");
    console.log("\nIMPORTANT: For Leaflet maps, coordinates should be in [latitude, longitude] format.");
    console.log("If your database has [longitude, latitude], make sure your API converts them properly.");
    
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  } finally {
    if (mongooseInstance && mongooseInstance.connection) {
      await mongooseInstance.connection.close();
      console.log("Database connection closed");
    }
  }
}

// Run the function if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCoordinates()
    .catch(error => {
      console.error("Unhandled error:", error);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}