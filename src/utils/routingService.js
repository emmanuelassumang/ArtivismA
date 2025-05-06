/**
 * Routing service for calculating paths between coordinates
 * Uses local distance calculations without external API dependencies
 */

/**
 * Get the route between two points
 * @param {[number, number]} start - [lat, lng] of starting point
 * @param {[number, number]} end - [lat, lng] of ending point
 * @param {string} mode - The transportation mode ('car', 'foot', 'bike'). Defaults to 'car'
 * @returns {Promise<{distance: number, duration: number, geometry: {coordinates: [number, number][]}}}>
 */
export async function getRoute(start, end, mode = 'car', useLocalOnly = false) {
  // Validate input coordinates with detailed logging
  if (!start || !end) {
    console.error('Missing start or end coordinates:', { start, end });
    throw new Error('Missing start or end coordinates');
  }
  
  if (!Array.isArray(start) || !Array.isArray(end)) {
    console.error('Coordinates must be arrays:', { start, end });
    throw new Error('Coordinates must be arrays');
  }
  
  if (start.length !== 2 || end.length !== 2) {
    console.error('Coordinates must have exactly 2 values:', { start, end });
    throw new Error('Coordinates must have exactly 2 values');
  }
  
  if (isNaN(start[0]) || isNaN(start[1]) || isNaN(end[0]) || isNaN(end[1])) {
    console.error('Coordinate values must be numbers:', { start, end });
    throw new Error('Coordinate values must be numbers');
  }
  
  // Validate coordinate ranges
  if (Math.abs(start[0]) > 90 || Math.abs(end[0]) > 90) {
    console.error('Latitude values must be between -90 and 90:', { start, end });
    throw new Error('Latitude values must be between -90 and 90');
  }
  
  if (Math.abs(start[1]) > 180 || Math.abs(end[1]) > 180) {
    console.error('Longitude values must be between -180 and 180:', { start, end });
    throw new Error('Longitude values must be between -180 and 180');
  }
  
  console.log(`Getting route from [${start[0]},${start[1]}] to [${end[0]},${end[1]}]`);

  // Determine coordinate order - check if likely swapped
  let startLat = start[0];
  let startLng = start[1];
  let endLat = end[0];
  let endLng = end[1];
  
  // Apply smart correction if coordinates look reversed
  // (if lat is > 90, it's likely a longitude value)
  if (Math.abs(startLat) > 90 && Math.abs(startLng) <= 90) {
    console.log('Detected swapped coordinates in start point, fixing order');
    [startLat, startLng] = [startLng, startLat];
  }
  
  if (Math.abs(endLat) > 90 && Math.abs(endLng) <= 90) {
    console.log('Detected swapped coordinates in end point, fixing order');
    [endLat, endLng] = [endLng, endLat];
  }
  
  // If useLocalOnly is true, skip API calls and use local calculation
  if (useLocalOnly) {
    console.log('Using local-only route calculation (skipping API calls)');
    return generateLocalRoute(startLat, startLng, endLat, endLng, mode);
  }
  
  // Map our API modes to GraphHopper vehicle types
  const modeToVehicle = {
    'driving': 'car',
    'walking': 'foot',
    'cycling': 'bike',
    'car': 'car',
    'foot': 'foot',
    'bike': 'bike'
  };
  
  // Validate mode parameter (fallback to car if invalid)
  const vehicle = modeToVehicle[mode] || 'car';
  
  // Skip GraphHopper API and use local route calculation
  console.log('Using local-only route calculation (API calls disabled)');
  return generateLocalRoute(startLat, startLng, endLat, endLng, mode);
  
  // This code is never reached due to the early return above
}

/**
 * Calculate optimal tour route for multiple points using a greedy algorithm
 * @param {Array<[number, number]>} points - Array of [lat, lng] coordinates
 * @param {string} mode - The transportation mode ('car', 'foot', 'bike'). Defaults to 'car'
 * @returns {Promise<{order: number[], totalDistance: number, totalDuration: number, travelInfo: {foot: {distance: number, duration: number}, car: {distance: number, duration: number}, bike: {distance: number, duration: number}}[]}>}
 */
export async function calculateOptimalTourOrder(points, mode = 'car') {
  // Validate input
  if (!points || !Array.isArray(points)) {
    console.error('Invalid points array:', points);
    return {
      order: [],
      totalDistance: 0,
      totalDuration: 0
    };
  }

  // Validate each point and filter out invalid ones
  const validPoints = points.filter(point => 
    Array.isArray(point) && 
    point.length === 2 && 
    !isNaN(point[0]) && 
    !isNaN(point[1])
  );
  
  console.log(`Optimizing tour with ${validPoints.length} valid points out of ${points.length} total`);
  
  if (validPoints.length <= 2) {
    // If 0, 1, or 2 valid points, no optimization needed
    return {
      order: validPoints.map((_, i) => i),
      totalDistance: 0,
      totalDuration: 0
    };
  }
  
  // Map our API modes to GraphHopper vehicle types
  const modeToVehicle = {
    'driving': 'car',
    'walking': 'foot',
    'cycling': 'bike',
    'car': 'car',
    'foot': 'foot',
    'bike': 'bike'
  };
  
  // Validate mode parameter (fallback to car if invalid)
  const vehicle = modeToVehicle[mode] || 'car';
  
  // Use greedy approach for optimization (no external API)
  console.log('Using greedy approach for tour optimization (GraphHopper VRP API disabled)');
  
  // Start with first point
  const order = [0];
  let totalDistance = 0;
  let totalDuration = 0;
  let currentPoint = validPoints[0];
  
  // Track available points
  const remaining = new Set(validPoints.slice(1).map((_, i) => i + 1));
  
  // Greedy algorithm - find the closest point at each step
  while (remaining.size > 0) {
    let closestIdx = null;
    let closestDistance = Infinity;
    
    // Find closest remaining point
    for (const idx of remaining) {
      // Calculate straight-line distance (faster than API call for finding nearest)
      const distance = calculateHaversineDistance(
        currentPoint[0], 
        currentPoint[1], 
        validPoints[idx][0], 
        validPoints[idx][1]
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIdx = idx;
      }
    }
    
    if (closestIdx !== null) {
      // Add closest point to order
      order.push(closestIdx);
      
      // Remove from remaining
      remaining.delete(closestIdx);
      
      // Get actual routing data between current and closest
      try {
        // Get route for the selected transportation mode - always use local route generation
        const route = await getRoute(currentPoint, validPoints[closestIdx], vehicle, true);
        totalDistance += route.distance;
        totalDuration += route.duration;
        console.log(`Added point ${closestIdx} to route, distance: ${(route.distance/1000).toFixed(2)}km`);
      } catch (err) {
        console.error(`Routing failed for points ${order.length-1} to ${closestIdx}:`, err);
        // If routing fails, use straight-line distance
        totalDistance += closestDistance;
        totalDuration += closestDistance / 10; // Rough estimate
      }
      
      // Update current point
      currentPoint = validPoints[closestIdx];
    }
  }
  
  console.log(`Optimization complete. Total distance: ${(totalDistance/1000).toFixed(2)}km`);
  
  // Map the order back to original indices if points were filtered
  let mappedOrder = order;
  if (validPoints.length !== points.length) {
    // Create mapping from valid points to original indices
    const validIndices = points.map((p, i) => 
      Array.isArray(p) && p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]) ? i : -1
    ).filter(i => i !== -1);
    
    // Map the optimized order back to original indices
    mappedOrder = order.map(idx => validIndices[idx]);
  }
  
  // Calculate travel info with estimated times for different modes
  const travelInfo = [];
  
  // For each route segment
  for (let i = 0; i < mappedOrder.length - 1; i++) {
    const idx1 = mappedOrder[i];
    const idx2 = mappedOrder[i + 1];
    
    if (idx1 === undefined || idx2 === undefined) continue;
    
    // Get the coordinates
    const p1 = points[idx1];
    const p2 = points[idx2];
    
    if (!p1 || !p2) continue;
    
    // Calculate straight-line distance as a baseline
    const straightDistance = calculateHaversineDistance(p1[0], p1[1], p2[0], p2[1]);
    
    // Apply a 1.3x factor to account for real-world routes not being straight lines
    const estimatedDistance = straightDistance * 1.3;
    
    // Calculate estimated times for different modes of transport
    travelInfo.push({
      from: idx1,
      to: idx2,
      foot: {
        distance: estimatedDistance,
        duration: estimatedDistance / 1.4  // seconds at 5 km/h
      },
      bike: {
        distance: estimatedDistance,
        duration: estimatedDistance / 4.2  // seconds at 15 km/h
      },
      car: {
        distance: estimatedDistance,
        duration: estimatedDistance / 13.9 // seconds at 50 km/h
      }
    });
  }
  
  return {
    order: mappedOrder,
    totalDistance,
    totalDuration,
    travelInfo
  };
}

/**
 * Calculate straight-line distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point in degrees
 * @param {number} lng1 - Longitude of first point in degrees
 * @param {number} lat2 - Latitude of second point in degrees
 * @param {number} lng2 - Longitude of second point in degrees
 * @returns {number} - Distance in meters
 */
function calculateHaversineDistance(lat1, lng1, lat2, lng2) {
  // Validate inputs
  if (lat1 === undefined || lng1 === undefined || lat2 === undefined || lng2 === undefined ||
      isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
    console.error('Invalid coordinates for Haversine calculation:', { lat1, lng1, lat2, lng2 });
    return 0; // Return 0 distance as fallback
  }
  
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Generate a local route between two points without using external APIs
 * Creates a realistic-looking route with some random waypoints
 * 
 * @param {number} startLat - Starting latitude
 * @param {number} startLng - Starting longitude
 * @param {number} endLat - Ending latitude
 * @param {number} endLng - Ending longitude
 * @param {string} mode - Transportation mode
 * @returns {{distance: number, duration: number, geometry: {type: string, coordinates: [number, number][]}}}
 */
function generateLocalRoute(startLat, startLng, endLat, endLng, mode) {
  // Calculate straight-line distance
  const straightLineDistance = calculateHaversineDistance(startLat, startLng, endLat, endLng);
  
  // Apply a factor to account for real-world routes not being straight lines
  const estimatedDistance = straightLineDistance * 1.3;
  
  // Estimate duration based on mode of transport
  let estimatedSpeed; // meters per second
  switch(mode) {
    case 'walking':
      estimatedSpeed = 1.4; // ~5 km/h
      break;
    case 'cycling':
      estimatedSpeed = 4.2; // ~15 km/h
      break;
    default: // driving
      estimatedSpeed = 8.3; // ~30 km/h (urban average)
      break;
  }
  
  const estimatedDuration = estimatedDistance / estimatedSpeed;
  
  // Create a more realistic route by adding some waypoints
  // The number of intermediate points scales with distance
  const numPoints = Math.max(2, Math.min(20, Math.floor(estimatedDistance / 1000)));
  
  // Generate intermediate waypoints
  const waypoints = [];
  
  // Always include start and end points in longitude,latitude order (GeoJSON format)
  waypoints.push([startLng, startLat]);
  
  // Add random waypoints that make the route look realistic
  for (let i = 1; i < numPoints - 1; i++) {
    const ratio = i / (numPoints - 1);
    
    // Interpolate between start and end with some random variance
    const lat = startLat + ratio * (endLat - startLat) + (Math.random() - 0.5) * 0.01;
    const lng = startLng + ratio * (endLng - startLng) + (Math.random() - 0.5) * 0.01;
    
    waypoints.push([lng, lat]);
  }
  
  // Add end point
  waypoints.push([endLng, endLat]);
  
  return {
    distance: estimatedDistance,
    duration: estimatedDuration,
    geometry: {
      type: "LineString",
      coordinates: waypoints
    }
  };
}