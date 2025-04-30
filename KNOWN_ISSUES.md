# Known Issues and Fixes

This document outlines known issues and potential fixes for the Artivism application.

## GraphHopper Integration (NEW)

The application now uses the GraphHopper Routing API for route calculation and tour optimization. This provides more accurate routing information compared to the previous OSRM solution.

### API Key

The current implementation uses the following GraphHopper API key:
```
6f4b063b-25da-49dc-b6e9-f06ac754c627
```

### API Usage Notes

1. **Transportation Modes**:
   - `car` (replaces `driving`)
   - `foot` (replaces `walking`)
   - `bike` (replaces `cycling`)

2. **Coordinate Format**:
   - GraphHopper expects coordinates in `[latitude, longitude]` format
   - Response coordinates are in `[longitude, latitude]` format (GeoJSON standard)

3. **Route Optimization**:
   - The system will attempt to use GraphHopper's route optimization for multi-point tours
   - Falls back to a greedy nearest-neighbor algorithm if the API call fails

### Potential Issues

1. **VRP API Incompatibility**:
   - The GraphHopper Vehicle Routing Problem (VRP) API is returning 400 status codes
   - Current implementation attempts to use `type_id: "car"` but the API rejects this with error:
     `JSON request property [referredTypesAreAvailable] You used a vehicle type id in one of your vehicles to refer to a type that does not exist`
   - The system now bypasses the GraphHopper VRP API and uses a "greedy" nearest-neighbor algorithm instead
   - Each segment still uses the GraphHopper routing API for accurate path calculation between points

2. **API Rate Limits**:
   - The free GraphHopper API has usage limits that may be reached during heavy use
   - The system includes a fallback to local route calculation when API limits are reached

3. **Coordinate Validation**:
   - The system attempts to detect and correct swapped coordinates
   - Some artwork coordinates may be invalid or reversed

## TypeScript Errors During Build

The application has TypeScript errors when building with Next.js 15, particularly around page props in the app router's dynamic route segments. The errors appear in files like:
- `src/app/tours/[id]/edit/page.tsx`
- `src/app/tours/[id]/page.tsx`

### Workaround
Use the development server with `npm run dev` which tolerates these errors. For production builds, you may need to:

1. Add `typescript.ignoreBuildErrors = true` to your `next.config.js`
2. Edit the problematic files to use simpler prop types (avoid complex interfaces)

## Map Component Issues

The map components may have occasional rendering issues:

- `src/components/BasicMap.tsx` - Fixed syntax error in the useEffect cleanup
- `src/components/TourMapOptimized.tsx` - Complex state management for optimizing routes
- `src/components/Map.tsx` - May have leaflet initialization issues

### Recommendations
- Use the included debug components to help diagnose map issues
- Enable the `NEXT_PUBLIC_DEBUG=true` environment variable to see more detailed logging
- Most map issues are related to coordinate formatting and validation

## MongoDB Connection

The MongoDB connection in `src/utils/dbConnect.js` works correctly, but requires:
- Valid MONGO_URI in .env file
- Proper handling of the connection pool

## Environment Variables

Required environment variables:
- `MONGO_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - Database name (defaults to 'artivism')
- `NEXT_PUBLIC_DEBUG` - Set to 'true' to enable debug output
- Add `GRAPHHOPPER_API_KEY` in the future to avoid hardcoding the API key

## Testing the App

To test the application:
1. Ensure MongoDB connection is valid
2. Run `npm run dev` to start development server
3. Test different routes manually:
   - Home: `/`
   - Gallery: `/gallery`
   - Map: `/map`
   - Tours: `/tours` 
   - Tour detail: `/tours/{id}`
   - Art detail: `/art/{id}`
   
## Optimization Components

Optimization features have been updated to use GraphHopper:
- Tour optimization with `OptimizeTourButton`
- Optimized tour map display with `TourMapOptimized`
- Route calculation with `/api/tour/optimize`

These features now use GraphHopper for more accurate routes in `src/utils/routingService.js` and should work well with valid coordinate data.

## Future Improvements

1. **Multi-modal Routing**:
   - Support for mixed transportation modes in a single tour

2. **Caching**:
   - Implement local caching of route data to reduce API calls

3. **Error Handling**:
   - Improve robustness when dealing with API errors or connection issues

4. **Add API key to environment variables**:
   - Move the GraphHopper API key to an environment variable rather than hardcoded value