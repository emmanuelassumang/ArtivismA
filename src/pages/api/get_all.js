// src/pages/api/get_all.js
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get MongoDB URI from environment
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/artivism';

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
    const db = client.db(); // Use default database specified in URI
    
    // Cache the database connection
    cachedDb = db;
    console.log('Connected to MongoDB successfully');
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
      const { limit = 100, page = 1, city } = req.query;
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
      
      // Get artworks from the arts collection with pagination
      const artworks = await db.collection("arts")
        .find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();
      
      if (!artworks || artworks.length === 0) {
        // If no real data, return dummy data for testing
        const dummyArtworks = [
          {
            _id: "dummy1",
            name: "Dummy Artwork 1",
            description: "This is a placeholder artwork",
            artists: ["Test Artist"],
            themes: ["Test Theme"],
            location: {
              coordinates: [38.7570865, -9.2340549],
              city: "Test City",
              address: "123 Test Street"
            },
            interactions: {
              likes_count: 5,
              comments: []
            }
          },
          {
            _id: "dummy2",
            name: "Dummy Artwork 2",
            description: "Another placeholder artwork",
            artists: ["Another Artist"],
            themes: ["Another Theme"],
            location: {
              coordinates: [38.7455088, -9.211941],
              city: "Test City",
              address: "456 Test Avenue"
            },
            interactions: {
              likes_count: 3,
              comments: []
            }
          }
        ];
        
        return res.status(200).json({
          artworks: dummyArtworks,
          pagination: {
            total: dummyArtworks.length,
            page: 1,
            limit: parseInt(limit),
            pages: 1
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
      
      // Return dummy data in case of error
      const dummyArtworks = [
        {
          _id: "error1",
          name: "Error Placeholder",
          description: "Data couldn't be loaded. Error: " + error.message,
          artists: ["Unknown"],
          themes: ["Error"],
          location: {
            coordinates: [38.7570865, -9.2340549],
            city: "Error City",
            address: "Error Street"
          },
          interactions: {
            likes_count: 0,
            comments: []
          }
        }
      ];
      
      return res.status(200).json({
        artworks: dummyArtworks,
        error: error.message,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          pages: 1
        }
      });
    }
  } else {
    // Only allow GET
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
