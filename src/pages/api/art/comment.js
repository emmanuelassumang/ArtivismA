// src/pages/api/art/comment.js
import connectToDB from "../../../db/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { artwork_id, user_id, comment_text } = req.body;
      if (!artwork_id || !user_id || !comment_text) {
        return res.status(400).json({ error: "Missing artwork_id, user_id, or comment_text" });
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

      // Build a comment object using string ID for compatibility
      const comment = {
        comment_id: new ObjectId().toString(), // Store as string
        user_id,
        comment_text,
        timestamp: new Date(),
      };

      // Ensure the interactions field exists before updating
      let updateQuery;
      if (!artwork.interactions) {
        // If interactions doesn't exist, create it with the comment
        updateQuery = { 
          $set: { 
            interactions: {
              likes_count: 0,
              comments: [comment]
            }
          }
        };
      } else if (!artwork.interactions.comments) {
        // If comments array doesn't exist, create it
        updateQuery = { 
          $set: { "interactions.comments": [comment] }
        };
      } else {
        // Otherwise push to existing comments array
        updateQuery = { 
          $push: { "interactions.comments": comment }
        };
      }

      // Add comment to the artwork
      const result = await db.collection("arts").updateOne(query, updateQuery);

      if (result.modifiedCount === 0) {
        return res.status(500).json({ error: "Failed to add comment" });
      }

      return res.status(200).json({ 
        message: "Comment added successfully", 
        comment,
        artwork_id: artwork._id.toString() 
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
