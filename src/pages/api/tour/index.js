// createTour API endpoint
// POST request to create a new tour
// Required fields: user_id, tour_name, city, artworks
import connectToDB from "../../../db/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      // GET all tours
      const { limit = 20, page = 1, city, visibility = "public" } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const mongooseInstance = await connectToDB();
      const db = mongooseInstance.connection.db;
      
      // Build query
      const query = {};
      if (city) {
        query.city = city;
      }
      if (visibility) {
        query.visibility = visibility;
      }
      
      // Get total count
      const totalCount = await db.collection("tours").countDocuments(query);
      
      // Get tours with pagination
      const tours = await db.collection("tours")
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();
        
      return res.status(200).json({
        tours,
        count: tours.length,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      });
      
    } catch (error) {
      console.error("Error fetching tours:", error);
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      const { user_id, tour_name, city, description, artworks, visibility } = req.body;
      if (!user_id || !tour_name || !city || !artworks) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Establish connection and get the DB object
      const mongooseInstance = await connectToDB();
      const db = mongooseInstance.connection.db;
      
      // Process artwork IDs to ensure they're valid
      const processedArtworks = [];
      
      // Check if artworks exist before creating the tour
      for (const id of artworks) {
        // First try as string ID
        let artwork = await db.collection("arts").findOne({ _id: id });
        
        // If not found and looks like ObjectId, try converting
        if (!artwork && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
          try {
            const objectId = new ObjectId(id);
            artwork = await db.collection("arts").findOne({ _id: objectId });
            if (artwork) {
              processedArtworks.push(objectId);
              continue;
            }
          } catch (err) {
            console.warn(`Invalid artwork ID format: ${id}`);
          }
        }
        
        // If found as string, use as is
        if (artwork) {
          processedArtworks.push(id);
        }
      }
      
      if (processedArtworks.length === 0) {
        return res.status(400).json({ error: "No valid artwork IDs provided" });
      }

      const newTour = {
        user_id,
        tour_name,
        city,
        description: description || "",
        artworks: processedArtworks,
        created_at: new Date(),
        last_updated: new Date(),
        visibility: visibility || "public"
      };

      const result = await db.collection("tours").insertOne(newTour);
      
      // Try to update user record if users collection exists
      try {
        const collections = await db.listCollections({name: "users"}).toArray();
        if (collections.length > 0) {
          // Update or create user record
          await db.collection("users").updateOne(
            { user_id: user_id },
            { 
              $addToSet: { created_tours: result.insertedId },
              $setOnInsert: { 
                username: user_id,
                profile_created_at: new Date()
              }
            },
            { upsert: true }
          );
        }
      } catch (userError) {
        console.warn("Could not update user record:", userError.message);
      }
      
      return res.status(201).json({ 
        message: "Tour created", 
        tour: {
          ...newTour,
          _id: result.insertedId
        }
      });
    } catch (error) {
      console.error("Error creating tour:", error);
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
