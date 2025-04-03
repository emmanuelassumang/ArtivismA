// Get all artworks with flexible search parameters
// GET request with optional parameters: city, theme, artist, keyword
import connectToDB from "../../../utils/dbConnect";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { 
        city, 
        theme, 
        artist, 
        keyword,
        limit = 500,
        page = 1 
      } = req.query;
      
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Build the filter object based on provided parameters
      const filter = {};
      
      if (city) {
        // Make city search case-insensitive
        filter["location.city"] = { $regex: new RegExp(city, 'i') };
      }
      
      if (theme) {
        // Support multiple themes separated by commas
        const themes = theme.split(',').map(t => t.trim());
        filter.themes = { $in: themes };
      }
      
      if (artist) {
        // Support multiple artists separated by commas
        const artists = artist.split(',').map(a => a.trim());
        filter.artists = { $in: artists };
      }
      
      // Text search if keyword is provided
      if (keyword) {
        filter.$or = [
          { name: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } }
        ];
      }
      
      // If no search parameters are provided, return a small default set
      if (Object.keys(filter).length === 0) {
        // Don't return error, just limit results
        console.log("No search parameters provided, returning limited results");
      }

      const mongooseInstance = await connectToDB();
      const db = mongooseInstance.connection.db;
      
      // Determine the correct collection name
      const artCollectionName = "arts";

      // Get total count for pagination
      const totalCount = await db.collection(artCollectionName).countDocuments(filter);
      
      // Get artworks with pagination
      const artworks = await db.collection(artCollectionName)
        .find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();

      // Process artworks for frontend use
      const processedArtworks = artworks.map(artwork => {
        // If HTML is in the description, strip the tags
        if (artwork.description && artwork.description.includes('<')) {
          artwork.description = artwork.description.replace(/<\/?[^>]+(>|$)/g, "");
        }
        
        // Ensure coordinates are correctly ordered for Leaflet [lat, lng]
        if (artwork.location && artwork.location.coordinates) {
          // Check if coordinates are already in the correct order
          // Latitude should be between -90 and 90
          // Longitude should be between -180 and 180
          const [coord1, coord2] = artwork.location.coordinates;
          
          // If coordinates appear to be in [lng, lat] order, swap them
          if (Math.abs(coord1) > 90 && Math.abs(coord2) <= 90) {
            artwork.location.coordinates = [coord2, coord1];
          }
        }
        
        return artwork;
      });

      // Get unique themes from the database for filtering options
      const uniqueThemes = await db.collection(artCollectionName).distinct("themes");
      
      // Get unique cities 
      const uniqueCities = await db.collection(artCollectionName).distinct("location.city");
      
      // Get unique artists (limited to top 50 to avoid too large response)
      const artistsAggregation = await db.collection(artCollectionName).aggregate([
        { $unwind: "$artists" },
        { $group: { _id: "$artists" } },
        { $limit: 50 },
        { $sort: { _id: 1 } }
      ]).toArray();
      
      const uniqueArtists = artistsAggregation.map(doc => doc._id);

      return res.status(200).json({ 
        artworks: processedArtworks,
        count: artworks.length,
        total: totalCount,
        filters: {
          city: city || null,
          theme: theme || null,
          artist: artist || null,
          keyword: keyword || null
        },
        available_filters: {
          themes: uniqueThemes,
          cities: uniqueCities,
          artists: uniqueArtists
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      });
    } catch (error) {
      console.error("Error searching for artworks:", error);
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

