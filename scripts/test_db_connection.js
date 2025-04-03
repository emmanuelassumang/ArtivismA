/**
 * Test database connection
 * 
 * Usage: node scripts/test_db_connection.js
 * 
 * This script tests connectivity to MongoDB and checks if your collections exist.
 */

import connectToDB from "../src/db/mongodb.js";

async function testConnection() {
  let mongooseInstance;
  try {
    console.log("Connecting to MongoDB...");
    mongooseInstance = await connectToDB();
    
    if (!mongooseInstance) {
      throw new Error("Failed to connect to MongoDB");
    }
    
    console.log("✅ Successfully connected to MongoDB!");
    
    const db = mongooseInstance.connection.db;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log("\nCollections in database:");
    if (collections.length === 0) {
      console.log("❌ No collections found. You may need to seed your database.");
    } else {
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }
    
    // Check for the arts collection
    const hasArts = collections.some(c => c.name === "arts");
    if (hasArts) {
      // Count documents in the arts collection
      const artCount = await db.collection("arts").countDocuments();
      console.log(`\n✅ Found 'arts' collection with ${artCount} documents`);
      
      // Sample a document from arts
      if (artCount > 0) {
        const sampleArt = await db.collection("arts").findOne({});
        console.log("\nSample artwork:");
        console.log(`ID: ${sampleArt._id}`);
        console.log(`Name: ${sampleArt.name}`);
        if (sampleArt.location && sampleArt.location.city) {
          console.log(`City: ${sampleArt.location.city}`);
        }
        if (sampleArt.themes) {
          console.log(`Themes: ${sampleArt.themes.join(', ')}`);
        }
      }
    } else {
      console.log("\n❌ 'arts' collection not found. You need to seed your database.");
      console.log("Run: node scripts/seed_real_data.js");
    }
    
    // Check for the tours collection
    const hasTours = collections.some(c => c.name === "tours");
    if (hasTours) {
      const tourCount = await db.collection("tours").countDocuments();
      console.log(`\n✅ Found 'tours' collection with ${tourCount} documents`);
    } else {
      console.log("\n❌ 'tours' collection not found. You may need to create it.");
    }
    
    // Check for the users collection
    const hasUsers = collections.some(c => c.name === "users");
    if (hasUsers) {
      const userCount = await db.collection("users").countDocuments();
      console.log(`\n✅ Found 'users' collection with ${userCount} documents`);
    } else {
      console.log("\n❌ 'users' collection not found. You may need to create it.");
    }
    
    console.log("\nDatabase connection test complete!");
    
  } catch (error) {
    console.error("\n❌ Database connection failed:", error);
  } finally {
    if (mongooseInstance && mongooseInstance.connection) {
      await mongooseInstance.connection.close();
      console.log("Database connection closed");
    }
  }
}

// Run the function if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConnection()
    .catch(error => {
      console.error("Unhandled error:", error);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}