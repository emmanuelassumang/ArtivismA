// createTour API endpoint
// POST request to create a new tour
// Required fields: user_id, tour_name, city, artworks
import connectToDB from "../../../utils/dbConnect";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

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
      // const { user_id, tour_name, city, description, artworks, visibility } = req.body;

      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      
      if (!token) {
        return res.status(401).json({ error: "Invalid token format" });
      }
      
      try {
        const decoded = jwt.verify(token, "your_secret_key"); 
        const userId = decoded.userId;

        const { tour_name, city, description, artworks, visibility } = req.body;

        console.log('[API] Creating tour with data:', { 
          tour_name, 
          city, 
          artworksCount: artworks?.length || 0,
          visibility 
        });
        
        if (!userId || !tour_name || !city || !artworks) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Establish connection and get the DB object
        console.log('[API] Connecting to MongoDB for tour creation...');
        const mongooseInstance = await connectToDB();
        const db = mongooseInstance.connection.db;
        console.log('[API] Connected to database:', db.databaseName);
        
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
          user_id: userId,
          tour_name,
          city,
          description: description || "",
          artworks: processedArtworks,
          created_at: new Date(),
          last_updated: new Date(),
          visibility: visibility || "public"
        };

        console.log('[API] Saving new tour to database:', {
          tourName: newTour.tour_name,
          city: newTour.city,
          artworksCount: newTour.artworks.length
        });
        
        const result = await db.collection("tours").insertOne(newTour);
        await db.collection("users").updateOne(
          { _id: new ObjectId(userId) },
          { $push: { created_tours: result.insertedId } }
        );
        
        console.log('[API] Tour saved successfully with ID:', result.insertedId);
        
        // Try to update user record if users collection exists
        // This section is already handled above with the proper userId as ObjectId
        // The redundant user update is removed to avoid confusion
        
        return res.status(201).json({ 
          message: "Tour created", 
          tour: {
            ...newTour,
            _id: result.insertedId
          }
        });
      } catch (jwtError) {
        console.error("JWT verification error:", jwtError);
        return res.status(401).json({ error: "Invalid or expired token" });
      }
    } catch (error) {
      console.error("Error creating tour:", error);
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
