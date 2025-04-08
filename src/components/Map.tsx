"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

// Import types only
import type { MapContainer as MapContainerType, TileLayer as TileLayerType, Marker as MarkerType, Popup as PopupType } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

// Dynamically import Leaflet components to avoid SSR issues
const MapComponents = dynamic(
  () => import("./MapComponents"),
  { 
    ssr: false,
    loading: () => <div className="h-full flex items-center justify-center">Loading map...</div>
  }
);

// Artwork interface
interface Artwork {
  _id: string;
  name: string;
  description: string;
  artists?: string[];
  themes?: string[];
  image_url?: string;
  artwork_url?: string;
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

export default function MapComponent() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [filteredArtworks, setFilteredArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  
  // Map center
  const [mapCenter, setMapCenter] = useState<[number, number]>([38.70, -9.20]);
  const [mapZoom, setMapZoom] = useState(10);

  // Fetch all artworks
  useEffect(() => {
    async function fetchArtworks() {
      try {
        const res = await fetch("/api/get_all");
        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        // Extract unique cities and themes for filters
        const uniqueCities = [...new Set(data.artworks.map((art: Artwork) => 
          art.location?.city ? (art.location.city.charAt(0).toUpperCase() + art.location.city.slice(1)) : "Unknown"
        ))];
        
        const allThemes: string[] = [];
        data.artworks.forEach((art: Artwork) => {
          if (art.themes && art.themes.length > 0) {
            allThemes.push(...art.themes);
          }
        });
        const uniqueThemes = [...new Set(allThemes)];
        
        setCities(uniqueCities.sort());
        setThemes(uniqueThemes.sort());
        setArtworks(data.artworks || []);
        setFilteredArtworks(data.artworks || []);
        
        // Set initial map center from first artwork
        if (data.artworks && data.artworks.length > 0 && data.artworks[0].location?.coordinates) {
          setMapCenter(data.artworks[0].location.coordinates);
        }
      } catch (err) {
        console.error("Error fetching artworks:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchArtworks();
  }, []);

  // Filter artworks when city or theme changes
  useEffect(() => {
    let filtered = [...artworks];
    
    if (selectedCity) {
      filtered = filtered.filter(art => 
        art.location?.city?.toLowerCase() === selectedCity.toLowerCase()
      );
    }
    
    if (selectedTheme) {
      filtered = filtered.filter(art => 
        art.themes && art.themes.some(theme => 
          theme.toLowerCase() === selectedTheme.toLowerCase()
        )
      );
    }
    
    setFilteredArtworks(filtered);
    
    // Update map center based on filtered artworks
    if (filtered.length > 0) {
      // Calculate the average center of filtered artworks
      const validArtworks = filtered.filter(art => art.location && art.location.coordinates);
      if (validArtworks.length > 0) {
        // In clean_data.js, coordinates are stored as [latitude, longitude]
        const totalLat = validArtworks.reduce((sum, art) => sum + art.location.coordinates[0], 0);
        const totalLng = validArtworks.reduce((sum, art) => sum + art.location.coordinates[1], 0);
        const avgLat = totalLat / validArtworks.length;
        const avgLng = totalLng / validArtworks.length;
        
        setMapCenter([avgLat, avgLng]);
        setMapZoom(11); // Zoom appropriately based on filter
      }
    } else if (artworks.length > 0) {
      // If no filtered results, use first artwork as center
      const validArtworks = artworks.filter(art => art.location && art.location.coordinates);
      if (validArtworks.length > 0) {
        // In clean_data.js, coordinates are already stored as [latitude, longitude]
        setMapCenter(validArtworks[0].location.coordinates);
        setMapZoom(10);
      }
    }
  }, [selectedCity, selectedTheme, artworks]);

  // Handle filter changes
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
  };
  
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTheme(e.target.value);
  };
  
  const resetFilters = () => {
    setSelectedCity("");
    setSelectedTheme("");
  };

  if (loading) return <div className="flex items-center justify-center h-full">Loading map data...</div>;

  if (error) return <div className="flex items-center justify-center h-full text-red-500">Error loading map data: {error}</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Filter Controls */}
      <div className="p-4 bg-white shadow-md z-10">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="city-filter" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <select
              id="city-filter"
              value={selectedCity}
              onChange={handleCityChange}
              className="block w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="theme-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Theme
            </label>
            <select
              id="theme-filter"
              value={selectedTheme}
              onChange={handleThemeChange}
              className="block w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Themes</option>
              {themes.map(theme => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md mb-0.5"
            >
              Reset
            </button>
          </div>
        </div>
        
        <div className="mt-2 text-sm text-gray-500">
          {filteredArtworks.length} 
          {filteredArtworks.length === 1 ? ' artwork' : ' artworks'} found
          {selectedCity || selectedTheme ? ' matching filters' : ''}
        </div>
      </div>
      
      {/* Map */}
      <div className="flex-1">
        <MapComponents 
          artworks={filteredArtworks} 
          center={mapCenter} 
          zoom={mapZoom}
          mapKey={`map-${selectedCity}-${selectedTheme}`}
        />
      </div>
    </div>
  );
}