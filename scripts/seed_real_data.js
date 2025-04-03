import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import connectToDB from "../src/db/mongodb.js";

async function seedDB(file_path) {
  let mongooseInstance;
  try {
    // Connect to MongoDB
    mongooseInstance = await connectToDB();
    const db = mongooseInstance.connection.db;
    
    // List collections to see what's available
    const collections = await db.listCollections().toArray();
    console.log("Available collections:", collections.map(c => c.name));
    
    const artCollection = db.collection("arts");
    const toursCollection = db.collection("tours");

    // Clear existing data from both collections
    await artCollection.deleteMany({});
    await toursCollection.deleteMany({});
    console.log("Cleared existing data from arts and tours collections");

    // Load data from file
    const rawData = fs.readFileSync(file_path, "utf-8");
    const artworks = JSON.parse(rawData);

    // Process data to ensure coordinates are correctly formatted
    const processedArtworks = artworks.map(artwork => {
      // Ensure coordinates are in correct order [lng, lat] for MongoDB
      // For leaflet consumption, we'll handle the conversion in the API response
      
      // Make sure coordinates are numbers
      if (artwork.location && artwork.location.coordinates) {
        artwork.location.coordinates = artwork.location.coordinates.map(coord => 
          typeof coord === 'string' ? parseFloat(coord) : coord
        );
      }
      
      return artwork;
    });

    // Insert data
    await artCollection.insertMany(processedArtworks);
    console.log(`Successfully seeded ${processedArtworks.length} artworks to 'arts' collection`);
    
    // Create a sample tour using the first few artworks
    if (processedArtworks.length >= 3) {
      const sampleArtworks = processedArtworks.slice(0, 3);
      const sampleTour = {
        tour_name: "Sample Art Tour",
        description: "A sample tour with a few artworks",
        city: sampleArtworks[0].location.city || "Unknown City",
        user_id: "user123", // A sample user ID
        artworks: sampleArtworks.map(art => art._id), // Reference the artwork IDs
        visibility: "public",
        created_at: new Date(),
        last_updated: new Date()
      };
      
      await toursCollection.insertOne(sampleTour);
      console.log("Created a sample tour with 3 artworks");
    }
    
    return true;
  } catch (error) {
    console.error("Error seeding the database:", error);
    return false;
  } finally {
    if (mongooseInstance && mongooseInstance.connection) {
      await mongooseInstance.connection.close();
      console.log("Database connection closed");
    }
  }
}

const file_path = path.join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "data",
  "cleaned_Month-2024-08.json"
);

// Run seeding if script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDB(file_path)
    .then(success => {
      if (success) {
        console.log("✅ Database seeding completed successfully");
      } else {
        console.error("❌ Database seeding failed");
      }
      process.exit(0);
    })
    .catch(error => {
      console.error("❌ Unhandled error during seeding:", error);
      process.exit(1);
    });
}
