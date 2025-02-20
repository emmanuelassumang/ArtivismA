// createTour API endpoint
// POST request to create a new tour
// Required fields: user_id, tour_name, city, artworks
import connectToDB from "../../../db/mongodb";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { user_id, tour_name, city, description, artworks, visibility } = req.body;
      if (!user_id || !tour_name || !city || !artworks) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Establish connection and get the native DB object
      const mongooseInstance = await connectToDB();
      const db = mongooseInstance.connection.db;

      const newTour = {
        user_id,
        tour_name,
        city,
        description: description || "",
        artworks,
        created_at: new Date(),
        visibility: visibility || "public"
      };

      const result = await db.collection("Tours").insertOne(newTour);
      return res.status(201).json({ message: "Tour created", tourId: result.insertedId });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
