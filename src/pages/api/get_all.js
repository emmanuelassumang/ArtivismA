// src/pages/api/get_all.js
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get MongoDB URI from environment and ensure it points to artivism database
let MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/artivism';

// Make sure we're connecting to the 'artivism' database
if (!MONGODB_URI.includes('/artivism')) {
  // Add database name if not already in the URI
  if (MONGODB_URI.includes('/?')) {
    MONGODB_URI = MONGODB_URI.replace('/?', '/artivism?');
  } else if (MONGODB_URI.includes('?')) {
    MONGODB_URI = MONGODB_URI.replace('?', '/artivism?');
  } else {
    MONGODB_URI = `${MONGODB_URI}/artivism`;
  }
  console.log('[API] Using artivism database for get_all endpoint');
}

// In-memory cache
let cachedDb = null;

async function connectToDatabase() {
  // If we already have a connection, use it
  if (cachedDb) {
    return cachedDb;
  }
  
  // If not, create a new connection
  try {
    const client = await MongoClient.connect(MONGODB_URI);
    
    // Explicitly specify the database name to ensure consistency
    const db = client.db('artivism');
    
    // Cache the database connection
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      // Get query parameters for pagination
      const { limit = 500, page = 1, city } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Connect to MongoDB directly
      const db = await connectToDatabase();
      
      // Build query
      const query = {};
      if (city) {
        query["location.city"] = city;
      }
      
      // Get total count for pagination
      const totalCount = await db.collection("arts").countDocuments(query);
      
      // Get artworks from the arts collection
      const artworks = await db.collection("arts")
        .find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();
      
      if (!artworks || artworks.length === 0) {
        return res.status(200).json({
          artworks: [],
          pagination: {
            total: 0,
            page: 1,
            limit: parseInt(limit),
            pages: 0
          }
        });
      }

      // Process artworks for frontend use
      const processedArtworks = artworks.map(artwork => {
        // If HTML is in the description, strip the tags
        if (artwork.description && artwork.description.includes('<')) {
          artwork.description = artwork.description.replace(/<\/?[^>]+(>|$)/g, "");
        }
        
        // Ensure coordinates are correctly ordered for Leaflet [lat, lng]
        if (artwork.location && artwork.location.coordinates) {
          // Check if coordinates are already in the correct order
          // Latitude should be between -90 and 90
          // Longitude should be between -180 and 180
          const [coord1, coord2] = artwork.location.coordinates;
          
          // If coordinates appear to be in [lng, lat] order, swap them
          if (Math.abs(coord1) > 90 && Math.abs(coord2) <= 90) {
            artwork.location.coordinates = [coord2, coord1];
          }
        }
        
        return artwork;
      });

      return res.status(200).json({ 
        artworks: processedArtworks,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      });
    } catch (error) {
      console.error("Error fetching all artworks:", error);
      return res.status(500).json({
        error: error.message,
        artworks: []
      });
    }
  } else {
    // Only allow GET
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
