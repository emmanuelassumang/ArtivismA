// API for saving a tour.
import connectToDB from "../../../utils/dbConnect";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { user_id, tour_id } = req.body;
      if (!user_id || !tour_id) {
        return res.status(400).json({ error: "Missing user_id or tour_id" });
      }

      const savedTour = {
        user_id,
        tour_id,
        saved_at: new Date()
      };

      const mongooseInstance = await connectToDB();
      const db = mongooseInstance.connection.db;

      const result = await db.collection("SavedTours").insertOne(savedTour);
      return res.status(201).json({ message: "Tour saved", savedTourId: result.insertedId });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
