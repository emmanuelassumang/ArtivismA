// src/pages/api/users/many.js
import { ObjectId } from "mongodb";
import connectToDB from "../../../utils/dbConnect";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "userIds must be a non-empty array" });
    }

    const db = (await connectToDB()).connection.db;
    
    // Convert string IDs to ObjectIds where possible
    const objectIds = userIds.map(id => {
      try {
        if (ObjectId.isValid(id)) {
          return new ObjectId(id);
        }
        return id;
      } catch (error) {
        return id; // Keep as string if conversion fails
      }
    });

    // Query for users with either string ID or ObjectId
    const users = await db.collection("users").find({
      $or: [
        { _id: { $in: objectIds } },
        { _id: { $in: userIds } }
      ]
    }).toArray();

    // Create a map of user ID to username for easy access
    const userMap = users.reduce((acc, user) => {
      // Convert ObjectId to string for consistent keys
      const userId = user._id.toString();
      acc[userId] = {
        username: user.username || 'Anonymous User',
        name: user.name || '',
        email: user.email || '',
        profile_image: user.profile_image || ''
      };
      return acc;
    }, {});

    return res.status(200).json({ users: userMap });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return res.status(500).json({ error: "Server error" });
  }
}