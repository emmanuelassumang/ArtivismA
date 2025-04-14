import connectToDB from "../../../utils/dbConnect";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: "Missing user_id parameter" });
  }

  try {
    const mongooseInstance = await connectToDB();
    const db = mongooseInstance.connection.db;

    const tours = await db.collection("tours").find({ user_id }).toArray();

    if (tours.length === 0) {
      return res.status(200).json({ tours: [], count: 0 });
    }

    const toursWithArtworks = await Promise.all(
      tours.map(async (tour) => {
        if (!tour.artworks || tour.artworks.length === 0) {
          return { ...tour, artwork_details: [] };
        }

        // Assume artwork _id values are strings, not ObjectId
        const artwork_details = await db.collection("arts").find({
          _id: { $in: tour.artworks }
        }).toArray();

        return { ...tour, artwork_details };
      })
    );

    return res.status(200).json({
      tours: toursWithArtworks,
      count: toursWithArtworks.length
    });
  } catch (error) {
    console.error("Error fetching user tours:", error);
    return res.status(500).json({ error: error.message });
  }
}
