// get all artworks in a city with a specific theme
// GET request to search for artworks by city and theme
import connectToDB from "../../../db/mongodb";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { city, theme } = req.query;
      if (!city || !theme) {
        return res.status(400).json({ error: "Missing city or theme query parameters" });
      }

      const mongooseInstance = await connectToDB();
      const db = mongooseInstance.connection.db;

      const artworks = await db.collection("Arts").find(
        { "location.city": city, themes: theme },
        { projection: { name: 1, "location.city": 1, themes: 1 } }
      ).toArray();

      return res.status(200).json({ artworks });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
