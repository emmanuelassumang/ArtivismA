import connectToDB from "../../../utils/dbConnect";

export default async function handler(req, res) {
  const { id } = req.query;

  console.log("[API] Incoming string artworkId:", id);

  try {
    const mongooseInstance = await connectToDB();
    const db = mongooseInstance.connection.db;

    // Since your _id is a string, use it directly
    const artwork = await db.collection("arts").findOne({ _id: id });

    if (!artwork) {
      console.warn("[API] Artwork not found for _id:", id);
      return res.status(404).json({ error: "Artwork not found" });
    }

    return res.status(200).json({ artwork });
  } catch (err) {
    console.error("[API] Error fetching artwork:", err);
    return res.status(500).json({ error: err.message });
  }
}
