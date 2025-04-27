import connectToDB from "../../../utils/dbConnect";
import { ObjectId } from "mongodb";

// Route handler for liking an artwork
export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { artworkId, userId } = req.body; // Get artworkId and userId from the request body
      console.log("[API] Incoming request to like artwork:", artworkId, userId);
      // Validate the input
      if (!artworkId || !userId) {
        return res.status(400).json({ error: "Missing artworkId or userId" });
      }

      const mongooseInstance = await connectToDB();
      const db = mongooseInstance.connection.db;

      // Step 1: Find the artwork by artworkId
      const artwork = await db.collection("arts").findOne({ _id: artworkId });

      // If artwork doesn't exist
      if (!artwork) {
        return res.status(404).json({ error: "Artwork not found" });
      }

      // Step 2: Check if the user has already liked this artwork
      if (artwork.likes.includes(userId)) {
        return res
          .status(400)
          .json({ error: "You have already liked this artwork" });
      }

      // Step 3: Add the userId to the artwork's likes array
      const updateResult = await db.collection("arts").updateOne(
        { _id: artworkId },
        { $push: { likes: userId } } // Add userId to likes array
      );

      // If the update was successful
      if (updateResult.modifiedCount > 0) {
        return res.status(200).json({ message: "Artwork liked successfully" });
      } else {
        return res.status(500).json({ error: "Failed to like artwork" });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    // Handle method not allowed if it's not a POST request
    return res.status(405).json({ error: "Method Not Allowed" });
  }
}
