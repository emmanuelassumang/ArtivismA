"use client";

import { useRef, useEffect, useState, useMemo } from 'react';
import { getRoute, calculateOptimalTourOrder } from '../utils/routingService';

interface Artwork {
  _id: string;
  name: string;
  location: {
    coordinates: [number, number];
  };
}

interface TourMapProps {
  artworks: Artwork[];
  optimizeRoute?: boolean; // Now always true internally
}

export default function TourMapOptimized({ artworks, optimizeRoute = true }: TourMapProps) {
  // Generate a stable, unique ID for this component instance
  const mapContainerId = useRef(`map-${Math.random().toString(36).substring(2, 9)}`).current;
  
  // Ensure DOM element exists when using map
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routesRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [optimizedOrder, setOptimizedOrder] = useState<number[]>([]);
  const [mounted, setMounted] = useState<boolean>(false);
  
  // Set mounted flag after component mounts
  useEffect(() => {
    setMounted(true);
    
    // Cleanup function for unmount
    return () => {
      setMounted(false);
      
      // Final cleanup to prevent memory leaks when component unmounts
      if (mapRef.current) {
        try {
          // Remove all event listeners
          mapRef.current.off();
          // Remove the map instance completely
          mapRef.current.remove();
          mapRef.current = null;
        } catch (e) {
          console.error("Error during final cleanup:", e);
        }
      }
      
      // Clear marker and route references
      markersRef.current = [];
      routesRef.current = [];
    };
  }, []);
  
  // Memoize valid artworks to prevent unnecessary recalculations
  const validArtworks = useMemo(() => {
    return artworks.filter(
      art => art && art.location && Array.isArray(art.location.coordinates) && art.location.coordinates.length === 2
    );
  }, [artworks]);
  
  // Always optimize route order when component mounts or when artworks change
  useEffect(() => {
    if (!mounted || validArtworks.length <= 1) {
      // If no valid artworks, use original order
      setOptimizedOrder(validArtworks.map((_, i) => i));
      return;
    }
    
    async function optimizeRouteOrder() {
      setLoading(true);
      try {
        // Extract coordinates for optimization
        const coordinates = validArtworks.map(art => art.location.coordinates);
        
        // Calculate optimal order using GraphHopper (car mode)
        const { order } = await calculateOptimalTourOrder(coordinates, 'car');
        setOptimizedOrder(order);
      } catch (error) {
        console.error('Error optimizing route:', error);
        // Fallback to original order
        setOptimizedOrder(validArtworks.map((_, i) => i));
      } finally {
        setLoading(false);
      }
    }
    
    optimizeRouteOrder();
  }, [validArtworks, mounted]);
  
  // State to track map initialization status
  const [mapInitialized, setMapInitialized] = useState(false);

  // Load the map when the component mounts and order is calculated
  useEffect(() => {
    // Exit early if component is not mounted, window is not available (SSR),
    // if no valid artworks, or if still calculating order
    if (
      !mounted || 
      typeof window === 'undefined' || 
      validArtworks.length === 0 ||
      optimizedOrder.length === 0
    ) {
      return;
    }
    
    let L: typeof import('leaflet') | null = null;
    
    // Dynamic import to avoid SSR issues
    const loadLeaflet = async () => {
      try {
        // Only load if window is defined (client-side)
        if (typeof window !== 'undefined') {
          // Import leaflet dynamically
          const leafletModule = await import('leaflet');
          // Also import CSS
          await import('leaflet/dist/leaflet.css');
          L = leafletModule;
          return L;
        }
      } catch (error) {
        console.error("Error loading Leaflet:", error);
        return null;
      }
    };
    
    // Load Leaflet and then initialize
    loadLeaflet().then(async (L) => {
      if (!L) {
        console.error("Failed to load Leaflet library");
        return;
      }
      // Fix Leaflet icon issues
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });
      
      // Initial setup - ensure the container is ready before creating the map
      const initializeMap = () => {
        // If map is already initialized, do nothing
        if (mapInitialized) return;
        
        // Try to find the container element using both the ID and the ref
        let container = containerRef.current;
        
        // If ref doesn't have it, try using document.getElementById
        if (!container) {
          container = document.getElementById(mapContainerId);
          
          // Try querying by data attribute if ID doesn't work
          if (!container) {
            container = document.querySelector(`[data-map-id="${mapContainerId}"]`);
          }
        }
        
        if (!container) {
          console.warn(`Map container element not found: ${mapContainerId}, will retry shortly...`);
          // Retry after a short delay with exponential backoff
          setTimeout(initializeMap, 1000);
          return;
        }
        
        // Make sure DOM is properly sized
        if (container.clientWidth === 0 || container.clientHeight === 0) {
          console.warn(`Map container has zero width or height: ${container.clientWidth}x${container.clientHeight}`);
          // Add default minimum dimensions
          container.style.minHeight = '400px';
          container.style.minWidth = '100%';
          // Give browser time to apply styles
          setTimeout(initializeMap, 100);
          return;
        }
        
        console.log(`Map container found with ID: ${mapContainerId} and dimensions: ${container.clientWidth}x${container.clientHeight}`);
        
        // Force destroy any existing map instance first to avoid conflicts
        if (mapRef.current) {
          console.log("Destroying previous map instance before initialization");
          mapRef.current.remove();
          mapRef.current = null;
        }
        
        // Get center coordinates from the first valid artwork (or fallback to NYC)
        let initialCenter: [number, number] = [40.7128, -74.0060]; // Default NYC coordinates
        
        if (validArtworks.length > 0 && validArtworks[0].location?.coordinates) {
          const firstCoords = validArtworks[0].location.coordinates;
          const lat = parseFloat(firstCoords[0]);
          const lng = parseFloat(firstCoords[1]);
          
          if (!isNaN(lat) && !isNaN(lng) && 
              Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
            initialCenter = [lat, lng];
          }
        }
        
        const defaultOptions = {
          center: initialCenter,
          zoom: 10,       // Default zoom level
          minZoom: 2,     // Minimum zoom level
          maxZoom: 18,    // Maximum zoom level
          attributionControl: true,
          preferCanvas: true // Better performance for many markers
        };
        
        try {
          console.log("Creating map with options:", defaultOptions);
          
          // Create new map instance using the DOM element directly
          mapRef.current = L.map(container, defaultOptions);
          
          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(mapRef.current);
          
          console.log("Map initialized successfully");
          
          // Manually trigger resize and invalidate size to ensure proper rendering
          window.dispatchEvent(new Event('resize'));
          
          // Make sure the map knows its container size
          mapRef.current.invalidateSize(true);
          
          // Clear any existing markers/routes
          markersRef.current = [];
          routesRef.current = [];
          
          // Set the initialized flag - this will trigger the second useEffect
          setMapInitialized(true);
          
        } catch (error) {
          console.error("Error initializing map:", error);
          // Reset state and retry
          if (mapRef.current) {
            try {
              mapRef.current.remove();
            } catch (e) {
              console.error("Error cleaning up failed map:", e);
            }
            mapRef.current = null;
          }
          setTimeout(initializeMap, 1000);
        }
      };
      
      // Start the initialization process
      initializeMap();
    });
    
    // Clean up on unmount - improved cleanup
    return () => {
      // Clear all markers first
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => {
          try {
            if (mapRef.current && marker) {
              marker.removeFrom(mapRef.current);
              // Remove any popups associated with the marker
              if (marker.getPopup()) {
                marker.unbindPopup();
              }
            }
          } catch (e) {
            console.error("Error removing marker during cleanup:", e);
          }
        });
        markersRef.current = [];
      }
      
      // Clear all routes
      if (routesRef.current.length > 0) {
        routesRef.current.forEach(route => {
          try {
            if (mapRef.current && route) {
              route.removeFrom(mapRef.current);
            }
          } catch (e) {
            console.error("Error removing route during cleanup:", e);
          }
        });
        routesRef.current = [];
      }
      
      // Remove map instance
      if (mapRef.current) {
        try {
          // Remove all event listeners
          mapRef.current.off();
          // Remove the map
          mapRef.current.remove();
          mapRef.current = null;
        } catch (e) {
          console.error("Error removing map during cleanup:", e);
        }
      }
      
      setMapInitialized(false);
    };
  }, [mapContainerId, mounted, optimizedOrder, validArtworks]);
  
  // Second useEffect to add markers only after map is fully initialized
  useEffect(() => {
    // Only proceed if map is initialized and we have artworks
    if (!mapInitialized || !mapRef.current || validArtworks.length === 0 || optimizedOrder.length === 0) {
      return;
    }
    
    // Track if this effect instance is still current
    let isMounted = true;
    
    // Import Leaflet again to ensure it's available
    const loadLeaflet = async () => {
      try {
        // Only load if window is defined (client-side)
        if (typeof window !== 'undefined') {
          return await import('leaflet');
        }
        return null;
      } catch (error) {
        console.error("Error loading Leaflet for markers:", error);
        return null;
      }
    };
    
    loadLeaflet().then(async (L) => {
      if (!L || !isMounted) {
        return;
      }
      
      console.log("Map is initialized, adding markers and routes");
      
      // Define the function to add markers and routes
      const addMarkersAndRoutes = async () => {
        // Add markers based on optimized order
        const orderedArtworks = optimizedOrder.map(idx => validArtworks[idx]);
        
        // Final check to ensure map is still valid
        if (!mapRef.current || !mapRef.current._container || !mapRef.current._container.isConnected) {
          console.error("Map is no longer valid when trying to add markers");
          return;
        }
        
        // Clear any existing markers and routes first
        markersRef.current.forEach(marker => {
          try {
            if (mapRef.current) mapRef.current.removeLayer(marker);
          } catch (error) {
            console.error("Error removing marker:", error);
          }
        });
        markersRef.current = [];
        
        routesRef.current.forEach(route => {
          try {
            if (mapRef.current) mapRef.current.removeLayer(route);
          } catch (error) {
            console.error("Error removing route:", error);
          }
        });
        routesRef.current = [];
      
        console.log(`Rendering map with ${orderedArtworks.length} ordered artworks`);
        
        // Add markers for each artwork in the tour
        for (let i = 0; i < orderedArtworks.length; i++) {
          const artwork = orderedArtworks[i];
          
          // Extract coordinates and ensure proper format for Leaflet [lat, lng]
          const origCoords = artwork.location.coordinates;
          
          // Verify coordinates and convert strings to numbers if needed
          let lat = parseFloat(origCoords[0]);
          let lng = parseFloat(origCoords[1]);
          
          // Auto-detect and correct reversed coordinates
          if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
            console.log(`Detected reversed coordinates for artwork ${artwork._id}, swapping [${lat}, ${lng}] to [${lng}, ${lat}]`);
            [lat, lng] = [lng, lat];
          }
          
          // Verify extracted values are valid numbers
          if (isNaN(lat) || isNaN(lng)) {
            console.error('Invalid coordinates for artwork:', artwork);
            continue; // Skip this artwork
          }
          
          // Verify valid coordinate ranges
          if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
            console.error('Coordinates out of range for artwork:', artwork);
            continue; // Skip this artwork
          }
          
          // Create the Leaflet coordinates
          const leafletCoords: [number, number] = [lat, lng];
          
          // Create custom icon with number (reflecting the optimized order)
          const icon = L.divIcon({
            className: 'tour-marker',
            html: `<div style="background-color: #4f46e5; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${i + 1}</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18]
          });
          
          // Create marker
          const marker = L.marker(leafletCoords, { icon });
          
          // Create an enhanced popup with distance information
          const popupContent = document.createElement('div');
          popupContent.className = 'artwork-popup';
          
          // Artwork name and stop number
          const nameElement = document.createElement('div');
          nameElement.innerHTML = `<b class="text-lg">${artwork.name || 'Untitled'}</b>`;
          nameElement.className = 'mb-2';
          popupContent.appendChild(nameElement);
          
          // Stop number
          const stopElement = document.createElement('div');
          stopElement.innerHTML = `<p class="text-sm text-gray-600">Stop ${i + 1} of ${orderedArtworks.length}</p>`;
          stopElement.className = 'mb-2';
          popupContent.appendChild(stopElement);
          
          // Add distance info to the next artwork if not the last one
          if (i < orderedArtworks.length - 1) {
            const nextArtwork = orderedArtworks[i + 1];
            
            // Add a divider
            const divider = document.createElement('hr');
            divider.className = 'my-2 border-t border-gray-200';
            popupContent.appendChild(divider);
            
            // Distance to next stop
            const distanceElement = document.createElement('div');
            distanceElement.className = 'text-xs mt-1';
            
            // Calculate distance between points using Haversine formula
            const currCoords = artwork.location.coordinates;
            const nextCoords = nextArtwork.location.coordinates;
            
            const lat1 = parseFloat(currCoords[0]);
            const lng1 = parseFloat(currCoords[1]);
            const lat2 = parseFloat(nextCoords[0]);
            const lng2 = parseFloat(nextCoords[1]);
            
            if (!isNaN(lat1) && !isNaN(lng1) && !isNaN(lat2) && !isNaN(lng2)) {
              // Calculate distance
              const R = 6371; // Earth radius in km
              const dLat = (lat2 - lat1) * Math.PI / 180;
              const dLon = (lng2 - lng1) * Math.PI / 180;
              const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2); 
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
              const distance = R * c;
              
              // Calculate walking time (assuming 5 km/h)
              const walkingMin = Math.ceil(distance / 5 * 60);
              
              // Calculate driving time (assuming 30 km/h in city)
              const drivingMin = Math.ceil(distance / 30 * 60);
              
              distanceElement.innerHTML = `
                <div class="font-medium text-gray-500">Next Stop: ${nextArtwork.name || 'Untitled'}</div>
                <div class="flex mt-1 gap-2">
                  <span class="bg-blue-50 text-blue-700 px-1 py-0.5 rounded">
                    ${distance.toFixed(1)} km
                  </span>
                  <span class="bg-green-50 text-green-700 px-1 py-0.5 rounded">
                    ~${walkingMin} min walk
                  </span>
                  <span class="bg-yellow-50 text-yellow-700 px-1 py-0.5 rounded">
                    ~${drivingMin} min drive
                  </span>
                </div>
              `;
            } else {
              distanceElement.innerHTML = `<div class="text-gray-500">Distance to next stop unavailable</div>`;
            }
            
            popupContent.appendChild(distanceElement);
          }
          
          // Use the custom HTML element as popup content
          marker.bindPopup(popupContent);
          
          // Add to map with error handling
          try {
            if (mapRef.current) {
              marker.addTo(mapRef.current);
              console.log(`Added marker ${i+1} to map for ${artwork.name || 'Untitled'}`);
            } else {
              console.error("Cannot add marker: map not initialized");
            }
          } catch (error) {
            console.error("Error adding marker to map:", error);
          }
          
          markersRef.current.push(marker);
        }
        
        // Add routes between markers
        for (let i = 0; i < orderedArtworks.length - 1; i++) {
          // Get properly formatted coordinates for both points
          const artwork1 = orderedArtworks[i];
          const artwork2 = orderedArtworks[i + 1];
          
          // Process start point coordinates
          let startLat = parseFloat(artwork1.location.coordinates[0]);
          let startLng = parseFloat(artwork1.location.coordinates[1]);
          
          // Process end point coordinates
          let endLat = parseFloat(artwork2.location.coordinates[0]);
          let endLng = parseFloat(artwork2.location.coordinates[1]);
          
          // Skip if any coordinates are invalid
          if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
            console.error(`Invalid coordinates between points ${i} and ${i+1}`);
            continue;
          }
          
          // Create coordinate arrays in [lat, lng] format for routingService
          const start: [number, number] = [startLat, startLng];
          const end: [number, number] = [endLat, endLng];
          
          // Create leaflet coordinate format for fallback
          const startLeaflet: [number, number] = [startLat, startLng];
          const endLeaflet: [number, number] = [endLat, endLng];
          
          console.log(`Fetching route from [${start}] to [${end}]`);
          
          try {
            console.log(`Getting route for segment ${i} -> ${i+1}`);
            // Try with GraphHopper API first, then fallback to local if it fails
            let routeData;
            try {
              routeData = await getRoute(start, end, 'car');
            } catch (error) {
              console.log(`GraphHopper API route fetching failed, using local fallback: ${error.message}`);
              routeData = await getRoute(start, end, 'car', true); // Use local calculation
            }
            
            // Check if map is still valid during async operation
            if (!mapRef.current) {
              console.error("Map became invalid during route fetch");
              return;
            }
            
            console.log(`Got route data:`, routeData);
            
            if (!routeData.geometry || !routeData.geometry.coordinates || routeData.geometry.coordinates.length === 0) {
              console.error('Route data has no geometry coordinates', routeData);
              throw new Error('Route data has no geometry coordinates');
            }
            
            // Extract GeoJSON coordinates and convert from [lng, lat] to [lat, lng] for Leaflet
            const routeCoordinates = routeData.geometry.coordinates.map(
              coord => [coord[1], coord[0]] as [number, number]
            );
            
            // Debug log
            console.log(`Route found with ${routeCoordinates.length} points`);
            
            // Create polyline with the route coordinates
            const route = L.polyline(routeCoordinates, {
              color: '#4f46e5',
              weight: 4,
              opacity: 0.7,
            });
            
            // Add to map with error handling
            try {
              if (mapRef.current) {
                route.addTo(mapRef.current);
              } else {
                console.error("Cannot add route polyline: map not initialized");
              }
            } catch (error) {
              console.error("Error adding route polyline to map:", error);
            }
            
            // Show distance on the route - midpoint of route
            if (routeCoordinates.length > 0) {
              // Get route midpoint (approximately)
              const midIndex = Math.floor(routeCoordinates.length / 2);
              const midPoint = routeCoordinates[midIndex];
              
              // Format the distance nicely - get distance from routeData
              const distanceKm = (routeData.distance / 1000).toFixed(1);
              const durationMin = Math.ceil(routeData.duration / 60);
              
              // Create a custom distance tooltip
              const distanceIcon = L.divIcon({
                className: 'distance-marker',
                html: `<div style="background-color: white; color: #4f46e5; border-radius: 4px; padding: 2px 6px; font-size: 11px; font-weight: bold; border: 1px solid #4f46e5; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                        <span>${distanceKm} km | ~${durationMin} min</span>
                      </div>`,
                iconSize: [80, 20],
                iconAnchor: [40, 10]
              });
              
              // Add distance marker with error handling
              const distanceMarker = L.marker(midPoint, {
                icon: distanceIcon,
                interactive: false, // Don't allow clicking
                zIndexOffset: -1000 // Place it below regular markers
              });
              
              try {
                if (mapRef.current) {
                  distanceMarker.addTo(mapRef.current);
                  routesRef.current.push(distanceMarker);
                } else {
                  console.error("Cannot add distance marker: map not initialized");
                }
              } catch (error) {
                console.error("Error adding distance marker to map:", error);
              }
            }
            
            routesRef.current.push(route);
          } catch (error) {
            console.error(`Error getting route between points ${i} and ${i+1}:`, error);
            
            // Fallback to straight line if routing fails
            console.log(`Using straight line fallback from [${startLeaflet}] to [${endLeaflet}]`);
            const straightLine = L.polyline([startLeaflet, endLeaflet], {
              color: '#4f46e5',
              weight: 3,
              opacity: 0.7,
              dashArray: '5, 10',
            });
            
            // Add to map with error handling
            try {
              if (mapRef.current) {
                straightLine.addTo(mapRef.current);
              } else {
                console.error("Cannot add straight line fallback: map not initialized");
              }
            } catch (error) {
              console.error("Error adding straight line fallback to map:", error);
            }
            
            routesRef.current.push(straightLine);
            
            // Add estimated distance for straight line fallback
            // Calculate midpoint
            const midLat = (startLeaflet[0] + endLeaflet[0]) / 2;
            const midLng = (startLeaflet[1] + endLeaflet[1]) / 2;
            const midPoint: [number, number] = [midLat, midLng];
            
            // Calculate straight line distance using Haversine formula
            const R = 6371; // Earth radius in km
            const dLat = (endLeaflet[0] - startLeaflet[0]) * Math.PI / 180;
            const dLon = (endLeaflet[1] - startLeaflet[1]) * Math.PI / 180;
            const a = 
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(startLeaflet[0] * Math.PI / 180) * Math.cos(endLeaflet[0] * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2); 
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
            const distance = R * c;
            
            // Estimate duration based on straight line distance (assuming 30 km/h average speed)
            const durationMin = Math.ceil(distance / 30 * 60);
            
            // Create distance marker
            const distanceIcon = L.divIcon({
              className: 'distance-marker',
              html: `<div style="background-color: white; color: #4f46e5; border-radius: 4px; padding: 2px 6px; font-size: 11px; font-weight: bold; border: 1px solid #4f46e5; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                      <span>~${distance.toFixed(1)} km (direct)</span>
                    </div>`,
              iconSize: [100, 20],
              iconAnchor: [50, 10]
            });
            
            // Add distance marker with error handling
            const distanceMarker = L.marker(midPoint, {
              icon: distanceIcon,
              interactive: false,
              zIndexOffset: -1000
            });
            
            try {
              if (mapRef.current) {
                distanceMarker.addTo(mapRef.current);
                routesRef.current.push(distanceMarker);
              } else {
                console.error("Cannot add fallback distance marker: map not initialized");
              }
            } catch (error) {
              console.error("Error adding fallback distance marker to map:", error);
            }
          }
        }
        
        // Fit map to bounds only after all markers and routes are added
        if (mapRef.current && (markersRef.current.length > 0 || routesRef.current.length > 0)) {
          try {
            // Make sure map is still valid
            if (!mapRef.current._loaded) {
              console.error("Map not fully loaded when fitting bounds");
              // Invalidate size and try again after a short delay
              mapRef.current.invalidateSize(true);
              setTimeout(() => {
                if (mapRef.current && mapRef.current._loaded) {
                  mapRef.current.invalidateSize(true);
                }
              }, 200);
              return;
            }
            
            // Combine markers and routes into a single feature group
            const allElements = [...markersRef.current].filter(Boolean);
            
            // Add polylines from routes (exclude markers used for distances)
            routesRef.current.forEach(item => {
              if (item && item instanceof L.Polyline) {
                allElements.push(item);
              }
            });
            
            if (allElements.length > 0) {
              // Create feature group from all elements
              const group = L.featureGroup(allElements);
              
              // Get bounds and add padding
              const bounds = group.getBounds();
              
              // Only fit bounds if valid
              if (bounds.isValid()) {
                console.log("Fitting map to bounds:", bounds);
                // Add significant padding for better visibility
                mapRef.current.fitBounds(bounds, { 
                  padding: [80, 80],
                  maxZoom: 14 // Limit max zoom to ensure context is visible
                });
              }
            }
          } catch (error) {
            console.error("Error fitting bounds:", error);
          }
        }
      };
      
      // Start the process to add markers and routes - only if component still mounted
      if (isMounted) {
        addMarkersAndRoutes();
      }
    });
    
    // Return cleanup function for this effect
    return () => {
      isMounted = false;
      
      // Clean up any marker-specific resources not handled by map.remove()
      markersRef.current.forEach(marker => {
        try {
          if (marker && marker.getPopup) {
            const popup = marker.getPopup();
            if (popup) {
              popup.close();
              marker.unbindPopup();
            }
          }
        } catch (e) {
          console.error("Error cleaning up marker popup:", e);
        }
      });
    };
  }, [mapInitialized, optimizedOrder, validArtworks]);
  
  // Use useEffect to ensure container has min height/width if not specified
  // and handle window resize events
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    // Set initial dimensions for the map container
    if (containerRef.current) {
      // Set minimum dimensions for the map container
      if (containerRef.current.clientHeight < 100) {
        containerRef.current.style.minHeight = '400px';
      }
      if (containerRef.current.clientWidth < 100) {
        containerRef.current.style.minWidth = '100%';
      }
    }
    
    // Handler for resize events to ensure map fills container properly
    const handleResize = () => {
      if (mapRef.current) {
        try {
          // Force map to recalculate size when window is resized
          mapRef.current.invalidateSize(true);
        } catch (e) {
          console.error("Error handling resize:", e);
        }
      }
    };
    
    // Add resize event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mounted, mapInitialized]);
  
  // Client-side only - Ensure container refs are correctly initialized
  useEffect(() => {
    // Safety check to ensure mapContainerId is linked to the DOM element
    if (typeof document !== 'undefined' && containerRef.current) {
      containerRef.current.id = mapContainerId;
    }
  }, [mapContainerId]);

  return (
    <div ref={containerRef} id={mapContainerId} className="h-full w-full relative min-h-[400px]" data-map-id={mapContainerId}>
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
          <div className="text-lg">Optimizing route...</div>
        </div>
      )}
      
      {(artworks.length === 0 || validArtworks.length === 0) && (
        <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">
          {artworks.length === 0 
            ? "No artworks available to display on the map" 
            : "No artworks with valid location data available"}
        </div>
      )}
      
      {/* Debug info to help troubleshoot map initialization issues */}
      <div className="absolute bottom-0 left-0 right-0 p-1 bg-white bg-opacity-80 text-xs text-gray-500 border-t border-gray-200 z-10">
        <div>Artworks: {artworks.length}, Valid: {validArtworks.length}, Map ID: {mapContainerId}</div>
        <div>Map Ref: {mapRef.current ? 'Initialized' : 'Not initialized'}</div>
      </div>
    </div>
  );
}