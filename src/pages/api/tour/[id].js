// edit and delete tour by id
// Required fields: user_id
import connectToDB from "../../../db/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      const { tour_name, visibility, description, city, artworks } = req.body;
      let update = {};
      if (tour_name !== undefined) update.tour_name = tour_name;
      if (visibility !== undefined) update.visibility = visibility;
      if (description !== undefined) update.description = description;
      if (city !== undefined) update.city = city;
      if (artworks !== undefined) update.artworks = artworks;

      const mongooseInstance = await connectToDB();
      const db = mongooseInstance.connection.db;

      const result = await db.collection("Tours").updateOne(
        { _id: ObjectId(id) },
        { $set: update }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "Tour not found or no changes made" });
      }
      return res.status(200).json({ message: "Tour updated successfully" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }

  } else if (req.method === "DELETE") {
    try {
      const { user_id } = req.body;
      if (!user_id) {
        return res.status(400).json({ error: "Missing user_id in request body" });
      }

      const mongooseInstance = await connectToDB();
      const db = mongooseInstance.connection.db;

      const tour = await db.collection("Tours").findOne({ _id: ObjectId(id) });
      if (!tour) {
        return res.status(404).json({ error: "Tour not found" });
      }
      if (tour.user_id !== user_id) {
        return res.status(403).json({ error: "Unauthorized: This is not your tour" });
      }

      const result = await db.collection("Tours").deleteOne({ _id: ObjectId(id), user_id });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Tour not found or already deleted" });
      }
      return res.status(200).json({ message: "Tour deleted successfully" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["PUT", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
