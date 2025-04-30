'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPinIcon, TagIcon, FilterIcon, XIcon } from "lucide-react";
import { useAccessibility } from "@/components/AccessibilityContext";

interface Artwork {
  _id: string;
  name: string;
  artwork_url?: string;
  location?: {
    city?: string;
  };
  themes?: string[];
  accessibility?: {
    wheelchair_accessible?: boolean;
    audio_descriptions?: boolean;
    low_mobility_friendly?: boolean;
    child_friendly?: boolean;
  };
}

export default function GalleryPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [themes, setThemes] = useState<string[]>([]);
  
  // Get global accessibility filters from context
  const { accessibilityFilters, toggleAccessibilityFilter, resetAccessibilityFilters } = useAccessibility();
  
  // Local override for accessibility filters (maintains gallery-specific filters)
  const [localAccessibilityFilters, setLocalAccessibilityFilters] = useState({
    wheelchair_accessible: false,
    audio_descriptions: false,
    low_mobility_friendly: false,
    child_friendly: false
  });
  
  // Determine which filters to use - prefer local filters, fall back to global
  const [useGlobalFilters, setUseGlobalFilters] = useState(true);
  
  // Computed filters to apply (either global or local)
  const activeFilters = useGlobalFilters ? accessibilityFilters : localAccessibilityFilters;

  // Sync local filters with global on mount
  useEffect(() => {
    setLocalAccessibilityFilters(accessibilityFilters);
  }, []);

  useEffect(() => {
    async function fetchArtworks() {
      try {
        const res = await fetch("/api/art/search");
        const data = await res.json();
        setArtworks(data.artworks || []);
        
        // Extract unique themes
        const allThemes: string[] = [];
        data.artworks.forEach((art: Artwork) => {
          if (art.themes && art.themes.length > 0) {
            allThemes.push(...art.themes);
          }
        });
        setThemes([...new Set(allThemes)].sort());
      } catch (err) {
        console.error("Failed to fetch artworks:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchArtworks();
  }, []);

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

  // Check if any accessibility filters are active
  const hasActiveAccessibilityFilters = Object.values(activeFilters).some(value => value);

  // Apply theme and accessibility filters
  const filteredArtworks = artworks.filter(art => {
    // Apply theme filter if selected
    const matchesTheme = !selectedTheme || (art.themes && art.themes.includes(selectedTheme));
    
    // If no accessibility filters are active, only apply theme filter
    if (!hasActiveAccessibilityFilters) return matchesTheme;
    
    // Apply accessibility filters
    const matchesAccessibility = Object.entries(activeFilters).every(([key, isActive]) => {
      // Skip this filter if it's not active
      if (!isActive) return true;
      
      // If filter is active, artwork must have this accessibility feature
      const accessibilityKey = key as keyof typeof art.accessibility;
      return art.accessibility?.[accessibilityKey] === true;
    });
    
    return matchesTheme && matchesAccessibility;
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-indigo-600">Loading gallery...</div>
    </div>;
  }
  
  // Create accessibility filter notice content
  const getFilterExplanation = () => {
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
    
    if (activeFilterNames.length === 0) return null;
    
    return (
      <div className="mt-2 mb-6 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Accessibility filters applied: 
          </h3>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            {activeFilterNames.join(', ')}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={useGlobalFilters ? resetAccessibilityFilters : resetLocalFilters} 
            className="flex items-center text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-200 px-2 py-1 rounded"
          >
            <XIcon size={12} className="mr-1" />
            Clear
          </button>
          <button 
            onClick={toggleFilterSource}
            className="flex items-center text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-200 px-2 py-1 rounded"
            title={useGlobalFilters ? 'Using global filters from accessibility menu' : 'Using gallery-specific filters'}
          >
            <FilterIcon size={12} className="mr-1" />
            {useGlobalFilters ? 'Global Filters' : 'Local Filters'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="header-gradient mb-8">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Discover Street Art</h1>
          <p className="text-lg opacity-90 max-w-2xl">
            Explore urban art from around the world, from colorful murals to thought-provoking installations.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Theme filters */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Themes</h2>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setSelectedTheme('')}
              className={`filter-chip ${!selectedTheme ? 'active bg-indigo-600 text-white' : ''}`}
            >
              All
            </button>
            {themes.map(theme => (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                className={`filter-chip ${selectedTheme === theme ? 'active bg-indigo-600 text-white' : ''}`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>
        
        {/* Accessibility filters */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold mb-2">Accessibility Needs</h2>
            {!useGlobalFilters && (
              <button
                onClick={() => setUseGlobalFilters(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Use global filters
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => useGlobalFilters 
                ? toggleAccessibilityFilter('wheelchair_accessible') 
                : toggleLocalAccessibilityFilter('wheelchair_accessible')
              }
              className={`filter-chip ${activeFilters.wheelchair_accessible ? 'active bg-indigo-600 text-white' : ''}`}
            >
              Wheelchair Accessible
            </button>
            <button 
              onClick={() => useGlobalFilters 
                ? toggleAccessibilityFilter('audio_descriptions') 
                : toggleLocalAccessibilityFilter('audio_descriptions')
              }
              className={`filter-chip ${activeFilters.audio_descriptions ? 'active bg-indigo-600 text-white' : ''}`}
            >
              Audio Descriptions
            </button>
            <button 
              onClick={() => useGlobalFilters 
                ? toggleAccessibilityFilter('low_mobility_friendly') 
                : toggleLocalAccessibilityFilter('low_mobility_friendly')
              }
              className={`filter-chip ${activeFilters.low_mobility_friendly ? 'active bg-indigo-600 text-white' : ''}`}
            >
              Low Mobility Friendly
            </button>
            <button 
              onClick={() => useGlobalFilters 
                ? toggleAccessibilityFilter('child_friendly') 
                : toggleLocalAccessibilityFilter('child_friendly')
              }
              className={`filter-chip ${activeFilters.child_friendly ? 'active bg-indigo-600 text-white' : ''}`}
            >
              Child Friendly
            </button>
          </div>
        </div>
        
        {/* Filter notification */}
        {hasActiveAccessibilityFilters && getFilterExplanation()}

        {/* Gallery grid */}
        {filteredArtworks.length > 0 ? (
          <div className="grid-gallery">
            {filteredArtworks.map((art) => (
              <Link key={art._id} href={`/art/${art._id}`}>
                <div className="art-card-minimal">
                  <img
                    src={art.artwork_url}
                    alt={art.name}
                  />
                  <div className="overlay">
                    <h3 className="text-base font-bold truncate">{art.name}</h3>
                    <div className="flex items-center gap-1 text-xs mt-1">
                      <MapPinIcon size={12} />
                      <span>{art.location?.city || 'Unknown location'}</span>
                    </div>
                    {art.themes && art.themes.length > 0 && (
                      <div className="flex items-center gap-1 text-xs mt-1">
                        <TagIcon size={12} />
                        <span>{art.themes[0]}{art.themes.length > 1 ? ' +' + (art.themes.length - 1) : ''}</span>
                      </div>
                    )}
                    
                    {/* Accessibility indicators */}
                    {art.accessibility && (
                      <div className="flex items-center gap-1 mt-2">
                        {art.accessibility.wheelchair_accessible && (
                          <span title="Wheelchair Accessible" className="text-xs bg-blue-600 text-white px-1 rounded-sm">♿</span>
                        )}
                        {art.accessibility.audio_descriptions && (
                          <span title="Audio Descriptions" className="text-xs bg-blue-600 text-white px-1 rounded-sm">🔊</span>
                        )}
                        {art.accessibility.low_mobility_friendly && (
                          <span title="Low Mobility Friendly" className="text-xs bg-blue-600 text-white px-1 rounded-sm">🚶</span>
                        )}
                        {art.accessibility.child_friendly && (
                          <span title="Child Friendly" className="text-xs bg-blue-600 text-white px-1 rounded-sm">👶</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card-bg rounded-md">
            <p className="text-lg">No artworks found matching the selected filters.</p>
            <div className="mt-4 flex gap-2 justify-center">
              <button 
                onClick={() => setSelectedTheme('')}
                className="btn-primary"
              >
                Clear theme filter
              </button>
              {hasActiveAccessibilityFilters && (
                <button
                  onClick={useGlobalFilters ? resetAccessibilityFilters : resetLocalFilters}
                  className="btn-outline"
                >
                  Clear accessibility filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
