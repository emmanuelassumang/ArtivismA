// src/pages/api/art/theme/theme_name.js
import connectToDB from "../../../../db/mongodb";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { theme } = req.query;
      if (!theme) {
        return res.status(400).json({ error: "Missing theme query parameter" });
      }

      const mongooseInstance = await connectToDB();
      const db = mongooseInstance.connection.db;

      // Adjust "arts" to your actual collection name
      const artworks = await db.collection("arts").find({ themes: theme }).toArray();

      return res.status(200).json({ artworks });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
