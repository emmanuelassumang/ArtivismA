"use client";

import { useRef, useEffect } from 'react';

interface Artwork {
  _id: string;
  name: string;
  location: {
    coordinates: [number, number];
  };
}

interface TourMapProps {
  artworks: Artwork[];
}

export default function TourMap({ artworks }: TourMapProps) {
  const mapContainerId = `map-${Math.random().toString(36).substring(2, 9)}`;
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const pathRef = useRef<any>(null);
  
  // Check if the artworks array has valid coordinates
  const validArtworks = artworks.filter(
    art => art && art.location && Array.isArray(art.location.coordinates) && art.location.coordinates.length === 2
  );
  
  // Load the map when the component mounts
  useEffect(() => {
    // Log the artworks passed to the component
    console.log('TourMap: Artworks passed to component:', artworks);
    console.log('TourMap: Valid artworks with coordinates:', validArtworks);
    
    // Exit early if window is not available (SSR) or if no valid artworks
    if (typeof window === 'undefined' || validArtworks.length === 0) {
      console.log('TourMap: Exiting early, window undefined or no valid artworks', { 
        windowDefined: typeof window !== 'undefined',
        artworksLength: artworks.length,
        validArtworksLength: validArtworks.length
      });
      return;
    }
    
    console.log('TourMap: Starting map initialization with artworks:', artworks);
    
    // Dynamic import to avoid SSR issues
    import('leaflet').then((L) => {
      console.log('TourMap: Leaflet loaded successfully');
      
      // Fix Leaflet icon issues
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });
      
      // Find the container element
      const container = document.getElementById(mapContainerId);
      if (!container) {
        console.error('TourMap: Container not found for ID:', mapContainerId);
        return;
      }
      
      console.log('TourMap: Container found, initializing map');
      
      // Initialize the map with a default view (will be adjusted later)
      if (!mapRef.current) {
        // If no valid coordinates found, use a default center
        const defaultOptions = {
          center: [0, 0], // Default center (will be overridden later)
          zoom: 2,        // Default zoom level
          attributionControl: true
        };
        
        mapRef.current = L.map(mapContainerId, defaultOptions);
        console.log('TourMap: Map instance created');
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapRef.current);
        console.log('TourMap: Tile layer added');
      }
      
      // Clear existing markers and path
      markersRef.current.forEach(marker => {
        mapRef.current.removeLayer(marker);
      });
      markersRef.current = [];
      
      if (pathRef.current) {
        mapRef.current.removeLayer(pathRef.current);
      }
      
      // Add markers and collect coordinates
      const coordinates: [number, number][] = [];
      
      console.log('TourMap: Adding markers for artworks:', validArtworks);
      
      validArtworks.forEach((artwork, index) => {
        // We've already filtered for valid artworks, but check again just to be safe
        if (!artwork.location || !artwork.location.coordinates) {
          console.error('TourMap: Missing location data for artwork:', artwork);
          return;
        }
        
        let coords = artwork.location.coordinates;
        
        // Check if coordinates need to be swapped for Leaflet
        // Leaflet expects [latitude, longitude] order
        // MongoDB typically stores as [longitude, latitude]
        // Latitude ranges from -90 to 90, longitude from -180 to 180
        const [coord1, coord2] = coords;
        
        // If first coordinate is outside latitude range, swap them
        if (Math.abs(coord1) > 90 && Math.abs(coord2) <= 90) {
          coords = [coord2, coord1]; // Swap to [lat, lng] for Leaflet
          console.log(`TourMap: Swapped coordinates for marker #${index + 1}`);
        }
        
        console.log(`TourMap: Adding marker #${index + 1} at coordinates:`, coords);
        coordinates.push(coords);
        
        // Create custom icon with number
        const icon = L.divIcon({
          className: 'tour-marker',
          html: `<div style="background-color: #4f46e5; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white;">${index + 1}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14]
        });
        
        // Create marker
        const marker = L.marker(coords, { icon });
        
        // Add popup
        marker.bindPopup(`<div>
          <b>${artwork.name || 'Untitled'}</b>
          <p>Stop ${index + 1} of ${artworks.length}</p>
        </div>`);
        
        // Add to map
        marker.addTo(mapRef.current);
        markersRef.current.push(marker);
      });
      
      // Add path between markers
      if (coordinates.length > 1) {
        console.log('TourMap: Creating path between markers with coordinates:', coordinates);
        pathRef.current = L.polyline(coordinates, {
          color: '#4f46e5',
          weight: 3,
          opacity: 0.7,
          dashArray: '5, 10',
        }).addTo(mapRef.current);
      }
      
      // Fit map to bounds
      if (coordinates.length > 0) {
        console.log('TourMap: Fitting map to bounds with coordinates:', coordinates);
        mapRef.current.fitBounds(coordinates, { padding: [30, 30] });
      } else {
        console.warn('TourMap: No valid coordinates to set map bounds');
      }
    });
    
    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [artworks, mapContainerId]);
  
  return (
    <div id={mapContainerId} className="h-full w-full">
      {(artworks.length === 0 || validArtworks.length === 0) && (
        <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">
          {artworks.length === 0 
            ? "No artworks available to display on the map" 
            : "No artworks with valid location data available"}
        </div>
      )}
    </div>
  );
}