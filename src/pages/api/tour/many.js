import connectToDB from "../../../utils/dbConnect";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { ids } = req.query;
      if (!ids) return res.status(400).json({ error: "Missing ids" });

      const idsArray = ids.split(",").map(id => new ObjectId(id));
      const mongooseInstance = await connectToDB();
      const db = mongooseInstance.connection.db;

    const tours = await db.collection("tours").find({ _id: { $in: idsArray } }).toArray();

    const artworksCollection = db.collection("arts");
    for (const tour of tours) {
    if (tour.artworks?.length > 0) {
        const firstArtworkId = typeof tour.artworks[0] === "string" ? new ObjectId(tour.artworks[0]) : tour.artworks[0];
        const artwork = await artworksCollection.findOne({ _id: firstArtworkId });

        if (artwork) {
        tour.artwork_details = [artwork];  
        }
    }
    }

      return res.status(200).json({ tours });
    } catch (err) {
      console.error("Error fetching tours by ids:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
