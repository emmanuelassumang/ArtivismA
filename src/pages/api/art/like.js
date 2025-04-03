// src/pages/api/art/like.js
import connectToDB from "../../../utils/dbConnect";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { artwork_id, user_id } = req.body;
      if (!artwork_id || !user_id) {
        return res.status(400).json({ error: "Missing artwork_id or user_id" });
      }

      const mongooseInstance = await connectToDB();
      const db = mongooseInstance.connection.db;

      // First try to find artwork with string ID
      let query = { _id: artwork_id };
      let artwork = await db.collection("arts").findOne(query);
      
      // If not found and ID looks like a valid ObjectId, try converting
      if (!artwork && artwork_id.length === 24 && /^[0-9a-fA-F]{24}$/.test(artwork_id)) {
        try {
          const objectId = new ObjectId(artwork_id);
          artwork = await db.collection("arts").findOne({ _id: objectId });
          if (artwork) {
            query = { _id: objectId };
          }
        } catch (err) {
          console.warn("Failed to convert artwork_id to ObjectId:", err.message);
          // Continue with string ID approach
        }
      }

      if (!artwork) {
        return res.status(404).json({ error: "Artwork not found" });
      }

      // Prepare update - ensure interactions object exists
      let updateQuery;
      if (!artwork.interactions) {
        updateQuery = { 
          $set: { 
            interactions: {
              likes_count: 1,
              comments: []
            }
          }
        };
      } else {
        // Increment the likes_count within the existing interactions object
        updateQuery = { 
          $inc: { "interactions.likes_count": 1 } 
        };
      }

      // Update artwork
      const result = await db.collection("arts").updateOne(query, updateQuery);

      if (result.modifiedCount === 0) {
        return res.status(500).json({ error: "Failed to like artwork" });
      }

      // Try to update user's liked_arts array if users collection exists
      try {
        // Check if users collection exists first
        const collections = await db.listCollections({name: "users"}).toArray();
        if (collections.length > 0) {
          // Users collection exists, try to update user
          await db.collection("users").updateOne(
            { user_id: user_id },  // Look up by string user_id field
            { $addToSet: { liked_arts: artwork._id } },
            { upsert: true }  // Create user if not exists
          );
        } else {
          console.log("Users collection doesn't exist yet. Only updating artwork.");
        }
      } catch (userError) {
        console.warn("Could not update user's liked_arts:", userError.message);
        // Continue since the like was still recorded
      }

      return res.status(200).json({ 
        message: "Artwork liked successfully",
        artwork_id: artwork._id.toString(),
        likes_count: artwork.interactions ? 
          (artwork.interactions.likes_count || 0) + 1 : 1
      });
    } catch (error) {
      console.error("Error liking artwork:", error);
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
