// edit and delete tour by id
// Required fields: user_id
import connectToDB from "../../../utils/dbConnect";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const { id } = req.query;

  // Convert id to ObjectId
  let tourObjectId;
  try {
    tourObjectId = new ObjectId(id);
  } catch (err) {
    return res.status(400).json({ error: "Invalid tour ID format" });
  }

  if (req.method === "GET") {
    try {
      const mongooseInstance = await connectToDB();
      const db = mongooseInstance.connection.db;

      const tour = await db.collection("tours").findOne({ _id: tourObjectId });

      if (!tour) {
        return res.status(404).json({ error: "Tour not found" });
      }

      // If tour has artwork IDs, fetch the artwork details
      if (tour.artworks && tour.artworks.length > 0) {
        try {
          console.log(`[API] Fetching artwork details for tour ${id} with artworks:`, tour.artworks);

          // Check available collections
          const collections = await db.listCollections().toArray();
          const collectionNames = collections.map(c => c.name);
          console.log(`[API] Available collections:`, collectionNames);

          // Determine the correct collection name
          let artCollectionName = "arts";
          if (!collectionNames.includes("arts")) {
            const artCollections = collectionNames.filter(name =>
              name.toLowerCase().includes("art") && name !== "tours"
            );
            if (artCollections.length > 0) {
              artCollectionName = artCollections[0];
              console.log(`[API] Using "${artCollectionName}" collection instead of "arts"`);
            }
          }

          // Don't convert IDs - we know they're strings from our earlier check
          const artworkIds = tour.artworks;
          console.log(`[API] Using artwork IDs as strings:`, artworkIds);

          // Query directly with string IDs since that's how they're stored
          const artworks = await db.collection(artCollectionName).find({
            _id: { $in: artworkIds }
          }).toArray();

          console.log(`[API] Found ${artworks.length} artworks:`,
            artworks.map(art => ({ id: art._id, name: art.name }))
          );

          console.log("[API] Full artwork documents being returned:", artworks);

          // Add the artwork details to the tour
          tour.artwork_details = artworks;

          if (artworks.length === 0) {
            console.warn(`[API] No artwork details found for the IDs:`, tour.artworks);
          } else if (artworks.length < tour.artworks.length) {
            console.warn(`[API] Found only ${artworks.length} artworks out of ${tour.artworks.length} requested`);
            const foundIds = artworks.map(a => a._id.toString());
            const missingIds = tour.artworks.filter(id => !foundIds.includes(id.toString()));
            console.warn(`[API] Missing artwork IDs:`, missingIds);
          }
        } catch (error) {
          console.warn("[API] Could not fetch artwork details:", error.message);
          console.error(error);
          tour.artwork_details = [];
        }
      } else {
        console.log(`[API] Tour ${id} has no artworks to fetch details for`);
        tour.artwork_details = [];
      }

      return res.status(200).json({ tour });
    } catch (error) {
      console.error("Error fetching tour:", error);
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      const { tour_name, visibility, description, city, artworks, user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: "Missing user_id in request body" });
      }

      const mongooseInstance = await connectToDB();
      const db = mongooseInstance.connection.db;

      const tour = await db.collection("tours").findOne({ _id: tourObjectId });
      if (!tour) {
        return res.status(404).json({ error: "Tour not found" });
      }

      if (tour.user_id.toString() !== user_id.toString()) {
        return res.status(403).json({ error: "Unauthorized: This is not your tour" });
      }

      let update = {};
      if (tour_name !== undefined) update.tour_name = tour_name;
      if (visibility !== undefined) update.visibility = visibility;
      if (description !== undefined) update.description = description;
      if (city !== undefined) update.city = city;
      if (artworks !== undefined) update.artworks = artworks;

      update.last_updated = new Date();

      const result = await db.collection("tours").updateOne(
        { _id: tourObjectId },
        { $set: update }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "No changes made" });
      }
      return res.status(200).json({ message: "Tour updated successfully" });
    } catch (error) {
      console.error("Error updating tour:", error);
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

      const tour = await db.collection("tours").findOne({ _id: tourObjectId });
      if (!tour) {
        return res.status(404).json({ error: "Tour not found" });
      }

      if (tour.user_id.toString() !== user_id.toString()) {
        return res.status(403).json({ error: "Unauthorized: This is not your tour" });
      }

      const result = await db.collection("tours").deleteOne({ _id: tourObjectId });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Tour couldn't be deleted" });
      }

      try {
        await db.collection("savedTours").deleteMany({ tour_id: tourObjectId });
      } catch (error) {
        console.warn("Error cleaning up saved tours:", error.message);
      }

      return res.status(200).json({ message: "Tour deleted successfully" });
    } catch (error) {
      console.error("Error deleting tour:", error);
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
