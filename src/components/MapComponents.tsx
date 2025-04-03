"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import { Icon, LatLngBounds, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";

// Import Leaflet
import L from "leaflet";

// Fix the default marker icon paths in Next.js:
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

// Artwork interface
interface Artwork {
  _id: string;
  name: string;
  description: string;
  artists?: string[];
  themes?: string[];
  image_url?: string;
  location: {
    coordinates: [number, number];
    city: string;
    address?: string;
    country?: string;
  };
  interactions?: {
    likes_count: number;
    comments: any[];
  };
}

interface MapComponentsProps {
  artworks: Artwork[];
  center: [number, number];
  zoom: number;
  mapKey: string;
}

// MapUpdater component to handle updates without re-rendering the entire map
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

// Custom marker for different art themes
function getMarkerIcon(theme: string): Icon {
  // Define theme colors
  const themeColors: Record<string, string> = {
    "street art": "#4f46e5", // indigo
    "graffiti": "#6d28d9", // purple
    "mural": "#2563eb", // blue
    "installation": "#db2777", // pink
    "sculpture": "#ea580c", // orange
    "performance": "#a855f7", // violet
    "cultural heritage": "#0891b2", // cyan
    "social justice": "#dc2626", // red
    "environmental": "#16a34a", // green
    "political": "#b91c1c", // dark red
    "feminism": "#c026d3", // fuchsia
    "lgbtq+": "#7c3aed", // violet
    "indigenous": "#b45309", // amber
    "historic": "#1e40af", // dark blue
  };
  
  const normalizedTheme = theme?.toLowerCase() || "";
  const themeColor = themeColors[normalizedTheme] || "#4f46e5"; // Default to indigo
  
  // Create a custom marker with the theme color
  return new L.Icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38"><path fill="${encodeURIComponent(themeColor)}" stroke="white" stroke-width="1" d="M15 2c-6.071 0-11 4.929-11 11 0 6.071 11 22 11 22s11-15.929 11-22c0-6.071-4.929-11-11-11z"/><circle fill="white" cx="15" cy="13" r="4.5"/></svg>`,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -36],
    shadowUrl: '/leaflet/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [13, 40]
  });
}

export default function MapComponents({ artworks, center, zoom, mapKey }: MapComponentsProps) {
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [markerRefs, setMarkerRefs] = useState<Record<string, LeafletMarker>>({});
  

  // Register marker references to allow programmatic popup opening
  const registerMarker = (id: string, marker: LeafletMarker) => {
    setMarkerRefs(prev => ({
      ...prev,
      [id]: marker,
    }));
  };

  // Open popup when marker is clicked
  const handleMarkerClick = (id: string) => {
    setActiveMarkerId(id);
  };
  
  // Effect to open popup when active marker changes
  useEffect(() => {
    if (activeMarkerId && markerRefs[activeMarkerId]) {
      markerRefs[activeMarkerId].openPopup();
    }
  }, [activeMarkerId, markerRefs]);

  return (
    <MapContainer
      key={mapKey}
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      attributionControl={true}
      zoomControl={false}
      className="z-0 relative"
    >
      {/* Update map view without re-rendering */}
      <MapUpdater center={center} zoom={zoom} />
      
      {/* Custom position for zoom control */}
      <ZoomControl position="bottomright" />
      
      {/* Map Tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Artwork Markers */}
      {artworks.map((art) => {
        // Skip artworks without coordinates
        if (!art.location || !art.location.coordinates) {
          return null;
        }
        
        // Get appropriate marker based on first theme
        const markerIcon = art.themes && art.themes.length > 0
          ? getMarkerIcon(art.themes[0])
          : getMarkerIcon("");
          
        // Get first letter of name for fallback image
        const nameInitial = (art.name || "A").charAt(0).toUpperCase();
        
        return (
          <Marker 
            key={art._id} 
            position={[art.location.coordinates[0], art.location.coordinates[1]]}
            icon={markerIcon}
            eventHandlers={{
              click: () => handleMarkerClick(art._id),
            }}
            ref={(ref) => ref && registerMarker(art._id, ref)}
          >
            <Popup maxWidth={320} className="artwork-popup-container">
              <div className="artwork-popup">
                <h3 className="font-bold text-xl mb-2 text-indigo-900">{art.name || "Untitled"}</h3>
                
                {art.image_url ? (
                  <div className="relative w-full h-40 overflow-hidden rounded-lg mb-3 shadow-sm">
                    <img 
                      src={art.image_url} 
                      alt={art.name} 
                      className="w-full h-full object-cover transition-transform hover:scale-110 duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        // Show fallback
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.classList.add('bg-indigo-100', 'flex', 'items-center', 'justify-center');
                          parent.innerHTML = `<span class="text-5xl font-bold text-indigo-300">${nameInitial}</span>`;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-indigo-100 rounded-lg mb-3 flex items-center justify-center shadow-sm">
                    <span className="text-5xl font-bold text-indigo-300">{nameInitial}</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  {art.artists && art.artists.length > 0 && (
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div>
                        <span className="font-medium text-gray-700">Artist{art.artists.length > 1 ? 's' : ''}: </span>
                        <span className="text-gray-900">{art.artists.join(', ')}</span>
                      </div>
                    </div>
                  )}
                  
                  {art.themes && art.themes.length > 0 && (
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <div className="flex flex-wrap gap-1">
                        {art.themes.map(theme => (
                          <span key={theme} className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">{theme}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {art.description && (
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-gray-700">{art.description}</p>
                    </div>
                  )}
                  
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Location: </span>
                      {art.location.city.charAt(0).toUpperCase() + art.location.city.slice(1)}
                      {art.location.address && `, ${art.location.address}`}
                      {art.location.country && `, ${art.location.country}`}
                    </div>
                  </div>
                </div>
                
                {art.interactions && (
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
                    <div className="flex space-x-4">
                      <div className="flex items-center text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span>{art.interactions.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span>{art.interactions.comments?.length || 0}</span>
                      </div>
                    </div>
                    
                    <button className="text-xs px-3 py-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors duration-300">
                      View Details
                    </button>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}