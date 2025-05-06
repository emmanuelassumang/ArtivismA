'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { LatLngBounds } from 'leaflet';

// Dynamically import Leaflet to avoid SSR issues
const LeafletImport = dynamic(
  () => import('leaflet').then(mod => {
    // Import leaflet CSS when the component loads
    import('leaflet/dist/leaflet.css');
    return mod;
  }),
  { ssr: false }
);

// Basic map implementation without any React wrapper libraries
export default function BasicMap() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Make sure Leaflet has access to window
    if (typeof window === 'undefined') return;
    
    // Load Leaflet asynchronously
    let L: typeof import('leaflet');
    
    async function initializeMap() {
      try {
        // Get the Leaflet instance
        L = await LeafletImport;
        
        // Fix Leaflet icon issues
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/leaflet/marker-icon-2x.png',
          iconUrl: '/leaflet/marker-icon.png',
          shadowUrl: '/leaflet/marker-shadow.png',
        });
      
        // Create a map ID
        const mapId = 'map-' + Math.random().toString(36).substring(2, 9);
        
        // Create a map container div
        const mapDiv = document.createElement('div');
        mapDiv.id = mapId;
        mapDiv.style.height = '100%';
        mapDiv.style.width = '100%';
        
        // Find parent container and append
        const container = document.getElementById('map-container');
        if (container) {
          // Clear any existing content
          container.innerHTML = '';
          container.appendChild(mapDiv);
          
          // Default coordinates (will be updated with artwork data)
          let initialCoords: [number, number] = [40.7128, -74.0060]; // NYC as default
          
          // Create map with consistent initial center
          const map = L.map(mapId, {
            center: initialCoords,
            zoom: 10,
            minZoom: 2,
            maxZoom: 18,
            preferCanvas: true // Better performance for many markers
          });
          
          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(map);
          
          // Fetch data
          fetch('/api/get_all')
            .then(response => response.json())
            .then(data => {
              if (!data.artworks || !Array.isArray(data.artworks)) {
                throw new Error('No artwork data received');
              }
              
              // Track valid coordinates for bounds calculation
              const bounds = L.latLngBounds([]);
              let hasValidCoordinates = false;
              
              // Create markers for each artwork
              data.artworks.forEach((art: any) => {
                if (art.location && art.location.coordinates) {
                  const coords = art.location.coordinates;
                  
                  // Validate coordinates before using them
                  if (Array.isArray(coords) && coords.length === 2) {
                    let lat = parseFloat(coords[0]);
                    let lng = parseFloat(coords[1]);
                    
                    // Ensure valid coordinate values
                    if (!isNaN(lat) && !isNaN(lng) && 
                        Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                      
                      // Use the coordinate for the marker
                      const leafletCoords: [number, number] = [lat, lng];
                      const marker = L.marker(leafletCoords).addTo(map);
                      
                      // Add to bounds for map fitting
                      bounds.extend(leafletCoords);
                      hasValidCoordinates = true;
                      
                      // Create popup content
                      let popupContent = `<div><strong>${art.name || 'Untitled'}</strong>`;
                      
                      if (art.description) {
                        popupContent += `<p>${art.description}</p>`;
                      }
                      
                      if (art.location.city) {
                        popupContent += `<p>${art.location.city}</p>`;
                      }
                      
                      popupContent += '</div>';
                      
                      // Bind popup to marker
                      marker.bindPopup(popupContent);
                    }
                  }
                }
              });
              
              // Fit map to artwork bounds if we have valid coordinates
              if (hasValidCoordinates && bounds.isValid()) {
                map.fitBounds(bounds, {
                  padding: [50, 50],
                  maxZoom: 13
                });
              }
              
              setLoading(false);
            })
            .catch(err => {
              console.error('Error loading artwork data:', err);
              setError(err.message || 'Failed to load artwork data');
              setLoading(false);
              
              // Add a default marker even if data loading fails
              L.marker([38.70, -9.20])
                .addTo(map)
                .bindPopup('Default location')
                .openPopup();
            });
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Failed to initialize map');
        setLoading(false);
      }
    }
    
    // Initialize map asynchronously
    initializeMap();
    
    // Return empty cleanup function
    return () => {};
  }, []);
  
  return (
    <div id="map-container" className="h-full w-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
          <div className="text-lg">Loading map...</div>
        </div>
      )}
      {error && (
        <div className="absolute bottom-4 right-4 bg-red-500 text-white p-2 rounded z-10">
          Error: {error}
        </div>
      )}
    </div>
  );
}