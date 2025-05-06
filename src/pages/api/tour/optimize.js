import { calculateOptimalTourOrder } from '../../../utils/routingService';
import connectToDatabase from '../../../utils/dbConnect';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

/**
 * Optimize a tour by calculating the shortest path between artworks
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { tourId } = req.body;
    
    if (!tourId) {
      return res.status(400).json({ message: 'Tour ID is required' });
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find the tour
    const tour = await mongoose.connection.db.collection('tours').findOne({ 
      _id: new ObjectId(tourId) 
    });
    
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }
    
    // Get the artwork IDs from the tour
    const artworkIds = tour.artworks || [];
    
    if (artworkIds.length <= 2) {
      // No need to optimize if there are 0, 1, or 2 artworks
      return res.status(200).json({ 
        optimizedOrder: artworkIds.map((_, i) => i),
        originalArtworks: artworkIds
      });
    }
    
    // Get the artworks with their coordinates
    // Don't convert IDs to ObjectId - treat them as strings since that's how they're stored
    const artworks = await mongoose.connection.db.collection('arts').find({
      _id: { $in: artworkIds }
    }).toArray();
    
    console.log(`Raw artwork IDs from tour:`, artworkIds);
    console.log(`Found artworks:`, artworks.map(art => ({ id: art._id, name: art.name })));
    
    // Map artworks to maintain original order, all IDs should be strings
    const orderedArtworks = artworkIds.map(id => {
      // Find by string comparison to be safe
      const idStr = id.toString();
      const artwork = artworks.find(art => art._id.toString() === idStr);
      
      if (!artwork) {
        console.log(`Could not find artwork with ID: ${idStr}`);
      }
      
      return artwork;
    }).filter(Boolean);
    
    console.log(`Found ${orderedArtworks.length} artworks out of ${artworkIds.length} from IDs`);
    
    // Extract coordinates for calculation
    const coordinates = orderedArtworks.map(art => {
      if (!art.location?.coordinates) {
        console.log(`Artwork ${art._id} is missing coordinates`);
        return null;
      }
      
      // Log the raw coordinates to help debug
      console.log(`Raw coordinates for artwork ${art._id} (${art.name}):`, art.location.coordinates);
      
      const coords = art.location.coordinates;
      
      // Validate coordinates format and values
      if (!Array.isArray(coords) || coords.length !== 2 || 
          isNaN(parseFloat(coords[0])) || isNaN(parseFloat(coords[1]))) {
        console.log(`Artwork ${art._id} has invalid coordinates:`, coords);
        return null;
      }
      
      // Ensure coordinates are numbers
      let val1 = parseFloat(coords[0]);
      let val2 = parseFloat(coords[1]);
      
      console.log(`Parsed coordinate values: [${val1}, ${val2}]`);
      
      // Check coordinate ranges to determine format
      // In clean_data.js, they're stored as [latitude, longitude] 
      // but MongoDB conventions typically expect [longitude, latitude]
      const isVal1Lat = Math.abs(val1) <= 90;
      const isVal1Lng = Math.abs(val1) <= 180 && Math.abs(val1) > 90;
      const isVal2Lat = Math.abs(val2) <= 90;
      const isVal2Lng = Math.abs(val2) <= 180 && Math.abs(val2) > 90;
      
      console.log(`Coordinate analysis: isVal1Lat=${isVal1Lat}, isVal1Lng=${isVal1Lng}, isVal2Lat=${isVal2Lat}, isVal2Lng=${isVal2Lng}`);
      
      // If first value looks like longitude and second like latitude, swap them
      if ((!isVal1Lat && isVal1Lng) && (isVal2Lat && !isVal2Lng)) {
        console.log(`Swapping coordinates for artwork ${art._id} from [${val1}, ${val2}] to [${val2}, ${val1}]`);
        return [val2, val1]; // Convert to [lat, lng] format for routing
      }
      
      // If both values are in valid latitude range, assume stored as [lat, lng]
      if (isVal1Lat && isVal2Lat) {
        // We know our data is stored as [lat, lng] from clean_data.js
        console.log(`Using coordinates as-is: [${val1}, ${val2}]`);
        return [val1, val2];
      }
      
      // If coordinates are out of valid ranges, log and skip
      if (!isVal1Lat && !isVal2Lat) {
        console.log(`Artwork ${art._id} has invalid coordinate ranges: [${val1}, ${val2}]`);
        return null;
      }
      
      // Return properly formatted coordinates: [latitude, longitude] for routing
      console.log(`Final coordinates for routing: [${val1}, ${val2}]`);
      return [val1, val2];
    }).filter(Boolean);
    
    console.log(`Found ${coordinates.length} valid coordinates out of ${orderedArtworks.length} artworks`);
    
    if (coordinates.length <= 2) {
      // Return a more professional response for insufficient coordinates
      return res.status(200).json({ 
        optimizedOrder: artworkIds.map((_, i) => i),
        originalArtworks: artworkIds,
        message: "Tour optimization requires at least 3 valid artwork locations."
      });
    }
    
    // Calculate optimal route order using GraphHopper
    const { order, totalDistance, totalDuration, travelInfo } = await calculateOptimalTourOrder(coordinates, 'car');
    
    console.log(`Optimization returned travel info: ${travelInfo ? travelInfo.length : 0} segments`);
    
    // Safety check for order indices
    if (!order || !Array.isArray(order)) {
      console.error('Invalid order received from optimization:', order);
      return res.status(500).json({ 
        message: 'Optimization failed to produce valid route order',
        error: 'Invalid optimization result'
      });
    }
    
    // Validate that all indices in order are within bounds
    const validOrder = order.filter(idx => idx >= 0 && idx < artworkIds.length);
    if (validOrder.length !== order.length) {
      console.warn(`Optimization returned invalid indices. Fixed ${order.length - validOrder.length} indices.`);
    }
    
    // Create a mapping of original artwork indices to their IDs
    const orderedArtworkIds = orderedArtworks.map(art => art._id.toString());
    
    // Reorder artwork IDs based on optimization
    const optimizedArtworkIds = validOrder.map(idx => {
      const artworkId = artworkIds[idx];
      
      // Double check to ensure this is a valid ID
      if (!artworkId) {
        console.log(`Warning: Invalid artwork index ${idx} in optimization order`);
        return null;
      }
      
      return artworkId;
    }).filter(Boolean);
    
    console.log('Optimized artwork order:', optimizedArtworkIds);
    console.log(`Original artwork count: ${artworkIds.length}, Optimized count: ${optimizedArtworkIds.length}`);
    
    // Update tour with optimized order
    if (req.body.updateTour) {
      try {
        await mongoose.connection.db.collection('tours').updateOne(
          { _id: new ObjectId(tourId) },
          { $set: { artworks: optimizedArtworkIds } }
        );
        console.log(`Updated tour ${tourId} with optimized artwork order`);
      } catch (updateError) {
        console.error('Error updating tour with optimized order:', updateError);
        // Continue anyway to return the optimized order
      }
    }
    
    // Return optimized order
    return res.status(200).json({
      optimizedOrder: validOrder,
      optimizedArtworkIds,
      originalArtworks: artworkIds,
      totalDistanceMeters: totalDistance,
      totalDurationSeconds: totalDuration,
      travelInfo: travelInfo || [] // Include travel mode info if available
    });
    
  } catch (error) {
    console.error('Error optimizing tour:', error);
    return res.status(500).json({ message: 'Error optimizing tour', error: error.message });
  }
}