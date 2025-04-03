// View all tours created by a user
// Required fields: user_id
import connectToDB from "../../../utils/dbConnect";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { user_id } = req.query;
      if (!user_id) {
        return res.status(400).json({ error: "Missing user_id parameter" });
      }

      const mongooseInstance = await connectToDB();
      const db = mongooseInstance.connection.db;

      // Use string ID only - don't try to convert to ObjectId for non-ObjectId user_ids
      let filter = { user_id };
      let tours = await db.collection("tours").find(filter).toArray();
      
      // Return empty array if no tours found
      if (tours.length === 0) {
        return res.status(200).json({ 
          tours: [],
          count: 0
        });
      }

      // For each tour, get the tour's artwork details if available
      if (tours.length > 0) {
        const toursWithArtworkDetails = await Promise.all(tours.map(async tour => {
          if (tour.artworks && tour.artworks.length > 0) {
            try {
              // Handle mixed ID types (string IDs and ObjectIds)
              const artworkIds = [];
              const stringIds = [];
              
              // Separate ObjectIds and string IDs
              for (const id of tour.artworks) {
                if (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
                  try {
                    artworkIds.push(new ObjectId(id));
                  } catch (e) {
                    stringIds.push(id);
                  }
                } else {
                  stringIds.push(id);
                }
              }
              
              // Query with both ID types
              const query = { $or: [] };
              if (artworkIds.length > 0) {
                query.$or.push({ _id: { $in: artworkIds } });
              }
              if (stringIds.length > 0) {
                query.$or.push({ _id: { $in: stringIds } });
              }
              
              // Skip query if no valid IDs
              if (query.$or.length === 0) {
                return { ...tour, artwork_details: [] };
              }
              
              const artworks = await db.collection("arts").find(query).toArray();
              
              return {
                ...tour,
                artwork_details: artworks
              };
            } catch (error) {
              console.warn(`Could not fetch artwork details for tour ${tour._id}:`, error.message);
              return { ...tour, artwork_details: [] }; // Return tour with empty artwork details
            }
          }
          return { ...tour, artwork_details: [] };
        }));
        
        return res.status(200).json({ 
          tours: toursWithArtworkDetails,
          count: toursWithArtworkDetails.length
        });
      }

      return res.status(200).json({ 
        tours,
        count: tours.length
      });
    } catch (error) {
      console.error("Error fetching user tours:", error);
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
