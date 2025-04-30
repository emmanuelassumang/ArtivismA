"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { FilterIcon, XIcon } from "lucide-react";
import { useAccessibility } from "./AccessibilityContext";

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
  description?: string;
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
  accessibility?: {
    wheelchair_accessible?: boolean;
    audio_descriptions?: boolean;
    low_mobility_friendly?: boolean;
    child_friendly?: boolean;
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
  
  // Get global accessibility filters from context
  const { accessibilityFilters, resetAccessibilityFilters } = useAccessibility();
  
  // Local override for accessibility filters
  const [localAccessibilityFilters, setLocalAccessibilityFilters] = useState({
    wheelchair_accessible: false,
    audio_descriptions: false,
    low_mobility_friendly: false,
    child_friendly: false
  });
  
  // Toggle between using global or local filters
  const [useGlobalFilters, setUseGlobalFilters] = useState(true);
  
  // Computed filters to apply (either global or local)
  const activeFilters = useGlobalFilters ? accessibilityFilters : localAccessibilityFilters;
  
  // Determine if any accessibility filters are active
  const hasActiveAccessibilityFilters = Object.values(activeFilters).some(value => value);
  
  // Default map center (will be updated with artwork coordinates)
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]);
  const [mapZoom, setMapZoom] = useState(10);

  // Sync local filters with global on mount
  useEffect(() => {
    setLocalAccessibilityFilters(accessibilityFilters);
  }, []);

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
        
        // Calculate average center from all valid artworks
        if (data.artworks && data.artworks.length > 0) {
          const validArtworks = data.artworks.filter((art: Artwork) => 
            art.location && 
            Array.isArray(art.location.coordinates) && 
            art.location.coordinates.length === 2 &&
            !isNaN(parseFloat(art.location.coordinates[0])) &&
            !isNaN(parseFloat(art.location.coordinates[1])) &&
            Math.abs(parseFloat(art.location.coordinates[0])) <= 90 &&
            Math.abs(parseFloat(art.location.coordinates[1])) <= 180
          );
          
          if (validArtworks.length > 0) {
            // Calculate average center
            const totalLat = validArtworks.reduce((sum, art) => 
              sum + parseFloat(art.location.coordinates[0]), 0);
            const totalLng = validArtworks.reduce((sum, art) => 
              sum + parseFloat(art.location.coordinates[1]), 0);
            
            const avgLat = totalLat / validArtworks.length;
            const avgLng = totalLng / validArtworks.length;
            
            setMapCenter([avgLat, avgLng]);
            
            // Determine appropriate zoom level based on geographic spread
            // This keeps the initial view consistent
            setMapZoom(validArtworks.length > 5 ? 8 : 10);
          }
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

  // Toggle a local accessibility filter
  const toggleLocalAccessibilityFilter = (filter: keyof typeof localAccessibilityFilters) => {
    // Switch to local filters if using global
    if (useGlobalFilters) {
      setUseGlobalFilters(false);
    }
    
    setLocalAccessibilityFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  // Reset local filters
  const resetLocalFilters = () => {
    setLocalAccessibilityFilters({
      wheelchair_accessible: false,
      audio_descriptions: false,
      low_mobility_friendly: false,
      child_friendly: false
    });
  };

  // Toggle between global and local filters
  const toggleFilterSource = () => {
    setUseGlobalFilters(!useGlobalFilters);
    if (!useGlobalFilters) {
      // Sync local with global when switching back to global
      setLocalAccessibilityFilters(accessibilityFilters);
    }
  };

  // Filter artworks when filters change
  useEffect(() => {
    let filtered = [...artworks];
    
    // Apply city filter
    if (selectedCity) {
      filtered = filtered.filter(art => 
        art.location?.city?.toLowerCase() === selectedCity.toLowerCase()
      );
    }
    
    // Apply theme filter
    if (selectedTheme) {
      filtered = filtered.filter(art => 
        art.themes && art.themes.some(theme => 
          theme.toLowerCase() === selectedTheme.toLowerCase()
        )
      );
    }
    
    // Apply accessibility filters
    if (hasActiveAccessibilityFilters) {
      filtered = filtered.filter(art => {
        if (!art.accessibility) return false;
        
        return Object.entries(activeFilters).every(([key, isActive]) => {
          // Skip this filter if it's not active
          if (!isActive) return true;
          
          // If filter is active, artwork must have this accessibility feature
          const accessibilityKey = key as keyof typeof art.accessibility;
          return art.accessibility[accessibilityKey] === true;
        });
      });
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
  }, [selectedCity, selectedTheme, artworks, activeFilters, hasActiveAccessibilityFilters]);

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
    
    if (useGlobalFilters) {
      resetAccessibilityFilters();
    } else {
      resetLocalFilters();
    }
  };
  
  // Generate active filter explanation
  const getAccessibilityFilterSummary = () => {
    if (!hasActiveAccessibilityFilters) return null;
    
    const activeFilterNames = Object.entries(activeFilters)
      .filter(([_, isActive]) => isActive)
      .map(([key]) => {
        switch(key) {
          case 'wheelchair_accessible': return 'Wheelchair Accessible';
          case 'audio_descriptions': return 'Audio Descriptions';
          case 'low_mobility_friendly': return 'Low Mobility Friendly';
          case 'child_friendly': return 'Child Friendly';
          default: return '';
        }
      });
    
    return activeFilterNames.join(', ');
  };

  if (loading) return <div className="flex items-center justify-center h-full">Loading map data...</div>;

  if (error) return <div className="flex items-center justify-center h-full text-red-500">Error loading map data: {error}</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Filter Controls */}
      <div className="p-4 bg-card-bg shadow-md z-10 border-b border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="city-filter" className="block text-sm font-medium mb-1">
              City
            </label>
            <select
              id="city-filter"
              value={selectedCity}
              onChange={handleCityChange}
              className="block w-full p-2 input-dark"
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
            <label htmlFor="theme-filter" className="block text-sm font-medium mb-1">
              Theme
            </label>
            <select
              id="theme-filter"
              value={selectedTheme}
              onChange={handleThemeChange}
              className="block w-full p-2 input-dark"
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
              className="px-4 py-2 bg-input-bg hover:bg-card-hover rounded-md mb-0.5"
            >
              Reset All
            </button>
          </div>
        </div>
        
        {/* Accessibility Filters */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">Accessibility:</span>
          </div>
          
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={activeFilters.wheelchair_accessible}
              onChange={() => useGlobalFilters 
                ? null // Global filters can only be changed from the AccessibilityMenu
                : toggleLocalAccessibilityFilter('wheelchair_accessible')
              }
              className="form-checkbox h-4 w-4 text-indigo-600 rounded"
              disabled={useGlobalFilters}
            />
            <span className="ml-2 text-sm">Wheelchair</span>
          </label>
          
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={activeFilters.audio_descriptions}
              onChange={() => useGlobalFilters 
                ? null 
                : toggleLocalAccessibilityFilter('audio_descriptions')
              }
              className="form-checkbox h-4 w-4 text-indigo-600 rounded"
              disabled={useGlobalFilters}
            />
            <span className="ml-2 text-sm">Audio</span>
          </label>
          
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={activeFilters.low_mobility_friendly}
              onChange={() => useGlobalFilters 
                ? null 
                : toggleLocalAccessibilityFilter('low_mobility_friendly')
              }
              className="form-checkbox h-4 w-4 text-indigo-600 rounded"
              disabled={useGlobalFilters}
            />
            <span className="ml-2 text-sm">Low Mobility</span>
          </label>
          
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={activeFilters.child_friendly}
              onChange={() => useGlobalFilters 
                ? null 
                : toggleLocalAccessibilityFilter('child_friendly')
              }
              className="form-checkbox h-4 w-4 text-indigo-600 rounded"
              disabled={useGlobalFilters}
            />
            <span className="ml-2 text-sm">Child Friendly</span>
          </label>
          
          <button 
            onClick={toggleFilterSource}
            className={`flex items-center text-xs ${
              useGlobalFilters 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
            } hover:bg-opacity-80 px-2 py-1 rounded ml-2`}
            title={useGlobalFilters ? 'Using global filters from accessibility menu' : 'Using map-specific filters'}
          >
            <FilterIcon size={12} className="mr-1" />
            {useGlobalFilters ? 'Global Filters' : 'Local Filters'}
          </button>
        </div>
        
        {/* Filter summary and result count */}
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between">
          <div className="text-sm opacity-70">
            <span className="font-medium">{filteredArtworks.length}</span> 
            {filteredArtworks.length === 1 ? ' artwork' : ' artworks'} found
            {(selectedCity || selectedTheme || hasActiveAccessibilityFilters) ? ' matching filters' : ''}
          </div>
          
          {hasActiveAccessibilityFilters && (
            <div className="mt-2 sm:mt-0 sm:ml-4 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md">
              Showing artworks with accessibility: {getAccessibilityFilterSummary()}
            </div>
          )}
        </div>
      </div>
      
      {/* Map */}
      <div className="flex-1 relative">
        <MapComponents 
          artworks={filteredArtworks} 
          center={mapCenter} 
          zoom={mapZoom}
          mapKey={`map-${selectedCity}-${selectedTheme}-${JSON.stringify(activeFilters)}`}
        />
        
        {/* Legend overlay */}
        <div className="absolute bottom-4 left-4 bg-card-bg/90 backdrop-blur-sm p-3 rounded-md shadow-lg border border-gray-700 text-sm z-[1000]">
          <h4 className="font-medium mb-2">Map Legend</h4>
          <ul className="space-y-1">
            <li className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
              <span>Artwork Location</span>
            </li>
            {selectedTheme && (
              <li className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-400"></div>
                <span>Themed: {selectedTheme}</span>
              </li>
            )}
            {hasActiveAccessibilityFilters && (
              <li className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Accessibility Features</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}