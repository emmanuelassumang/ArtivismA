'use client';

import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Basic map implementation without any React wrapper libraries
export default function BasicMap() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Make sure Leaflet has access to window
    if (typeof window === 'undefined') return;
    
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
      
      // Create map
      const map = L.map(mapId).setView([38.70, -9.20], 10);
      
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
          
          // Create markers for each artwork
          data.artworks.forEach(art => {
            if (art.location && art.location.coordinates) {
              // Create marker
              const marker = L.marker(art.location.coordinates).addTo(map);
              
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
          });
          
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
      
      // Clean up function
      return () => {
        map.remove();
      };
    }
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