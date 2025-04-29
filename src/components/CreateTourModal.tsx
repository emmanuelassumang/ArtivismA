"use client";

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

// TypeScript interfaces
interface Artwork {
  _id: string;
  name: string;
  location: {
    city: string;
    coordinates?: [number, number];
  };
  artists?: string[];
  themes?: string[];
  image_url?: string;
  artwork_url?: string;
  description?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTourCreated: (tour: any) => void;
}

export default function CreateTourModal({ isOpen, onClose, onTourCreated }: Props) {
  // Tour data
  const [tourName, setTourName] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
  
  // Search/filter
  const [citySearch, setCitySearch] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [filteredArtworks, setFilteredArtworks] = useState<Artwork[]>([]);
  const [artworkSearch, setArtworkSearch] = useState('');
  const [activeThemeFilter, setActiveThemeFilter] = useState<string | null>(null);
  
  // Available themes from all artworks
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);
  
  // UI states
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingArtworks, setFetchingArtworks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCity, setShowCity] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  
  // Clear form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      // Give time for the close animation before resetting
      const timeout = setTimeout(() => {
        resetForm();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);
  
  // Fetch available cities when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCities();
    }
  }, [isOpen]);
  
  // Fetch artworks when a city is selected
  useEffect(() => {
    if (city) {
      fetchArtworksForCity(city);
    }
  }, [city]);
  
  // Extract unique themes from artworks
  useEffect(() => {
    if (artworks.length > 0) {
      const themes = new Set<string>();
      
      artworks.forEach(artwork => {
        if (artwork.themes && artwork.themes.length > 0) {
          artwork.themes.forEach(theme => themes.add(theme));
        }
      });
      
      setAvailableThemes(Array.from(themes).sort());
    }
  }, [artworks]);
  
  // Filter artworks based on search and theme filter
  useEffect(() => {
    let filtered = [...artworks];
    
    // Apply theme filter if active
    if (activeThemeFilter) {
      filtered = filtered.filter(artwork => 
        artwork.themes && artwork.themes.includes(activeThemeFilter)
      );
    }
    
    // Apply search filter
    if (artworkSearch.trim()) {
      const lowerSearch = artworkSearch.toLowerCase();
      filtered = filtered.filter(artwork => 
        artwork.name.toLowerCase().includes(lowerSearch) ||
        (artwork.artists && artwork.artists.some(artist => 
          artist.toLowerCase().includes(lowerSearch)
        )) ||
        (artwork.themes && artwork.themes.some(theme => 
          theme.toLowerCase().includes(lowerSearch)
        ))
      );
    }
    
    setFilteredArtworks(filtered);
  }, [artworkSearch, activeThemeFilter, artworks]);
  
  // Reset form state
  const resetForm = () => {
    setTourName('');
    setCity('');
    setDescription('');
    setVisibility('public');
    setSelectedArtworks([]);
    setCitySearch('');
    setArtworkSearch('');
    setActiveThemeFilter(null);
    setStep(1);
    setError(null);
    setShowCity(false);
    setShowThemes(false);
  };
  
  // Fetch available cities
  const fetchCities = async () => {
    try {
      const response = await fetch('/api/get_all');
      if (!response.ok) {
        throw new Error('Failed to fetch artworks');
      }
      
      const data = await response.json();
      
      console.log('City API response:', {
        artworksCount: data.artworks?.length || 0,
        hasError: !!data.error,
        error: data.error
      });
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.artworks && Array.isArray(data.artworks)) {
        // Check if there's sample data to debug
        if (data.artworks.length > 0) {
          console.log('Sample artwork from API:', {
            name: data.artworks[0].name,
            location: data.artworks[0].location,
            id: data.artworks[0]._id
          });
        }
        
        // Extract and deduplicate cities
        const cities = Array.from(new Set(
          data.artworks
            .filter((art: any) => art.location && art.location.city)
            .map((art: any) => art.location.city)
        )).sort();
        
        console.log('Found cities:', cities.length > 0 ? cities : 'No cities found');
        
        setAvailableCities(cities);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setError('Failed to load cities. Please try again.');
    }
  };
  
  // Fetch artworks for the selected city
  const fetchArtworksForCity = async (city: string) => {
    try {
      setFetchingArtworks(true);
      console.log(`Fetching artworks for city: ${city}`);
      
      const response = await fetch(`/api/art/search?city=${encodeURIComponent(city)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch artworks: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Artwork search response:', {
        artworksCount: data.artworks?.length || 0,
        hasError: !!data.error,
        error: data.error,
        city: data.filters?.city
      });
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.artworks && Array.isArray(data.artworks)) {
        console.log(`Found ${data.artworks.length} artworks for city: ${city}`);
        if (data.artworks.length > 0) {
          console.log('Sample artwork:', {
            name: data.artworks[0].name,
            id: data.artworks[0]._id,
            location: data.artworks[0].location
          });
        }
        
        setArtworks(data.artworks);
        setFilteredArtworks(data.artworks);
      } else {
        console.log(`No artworks found for city: ${city}`);
        setArtworks([]);
        setFilteredArtworks([]);
      }
    } catch (error) {
      console.error('Error fetching artworks:', error);
      setError('Failed to load artworks. Please try again.');
    } finally {
      setFetchingArtworks(false);
    }
  };
  
  // Check if form is valid
  const isFormValid = () => {
    if (step === 1) {
      return tourName.trim() !== '' && city.trim() !== '';
    } else {
      return selectedArtworks.length > 0;
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate form
      if (!isFormValid()) {
        if (step === 1) {
          setError('Please provide a tour name and select a city.');
        } else {
          setError('Please select at least one artwork for your tour.');
        }
        return;
      }
      
      // Prepare tour data
      const tourData = {
        tour_name: tourName,
        city,
        description,
        artworks: selectedArtworks.map(artwork => artwork._id),
        visibility
      };
      
      // Submit to API
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tour', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, 
        },
        body: JSON.stringify({
          tour_name: tourName,
          city,
          description,
          artworks: selectedArtworks.map((art) => art._id),
          visibility,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create tour: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Combine the tour data with the result for the callback
      onTourCreated({
        ...tourData,
        _id: result.tour._id,
        created_at: new Date().toISOString(),
      });
      
      // Close modal and reset form
      onClose();
    } catch (error) {
      console.error('Error creating tour:', error);
      setError(`Failed to create tour: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle artwork selection
  const toggleArtworkSelection = (artwork: Artwork) => {
    const isSelected = selectedArtworks.some(art => art._id === artwork._id);
    
    if (isSelected) {
      setSelectedArtworks(prev => prev.filter(art => art._id !== artwork._id));
    } else {
      setSelectedArtworks(prev => [...prev, artwork]);
    }
  };
  
  // Filter available cities based on search
  const filteredCities = availableCities.filter(city => 
    city.toLowerCase().includes(citySearch.toLowerCase())
  );
  
  // Handle theme filter click
  const handleThemeFilter = (theme: string) => {
    if (activeThemeFilter === theme) {
      setActiveThemeFilter(null); // Clear filter if clicking active theme
    } else {
      setActiveThemeFilter(theme); // Set new filter
    }
  };
  
  // Get a color for each theme
  const getThemeColor = (theme: string) => {
    const themeColors: Record<string, string> = {
      "street art": "indigo",
      "graffiti": "purple",
      "mural": "blue",
      "installation": "pink",
      "sculpture": "orange",
      "performance": "violet",
      "cultural heritage": "cyan",
      "social justice": "red",
      "environmental": "green",
      "political": "rose",
      "feminism": "fuchsia",
      "lgbtq+": "violet",
      "indigenous": "amber",
      "historic": "sky",
    };
    
    const normalizedTheme = theme?.toLowerCase();
    return themeColors[normalizedTheme] || "indigo";
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all relative">
                {/* Close button */}
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={onClose}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold text-gray-900 mb-2"
                >
                  {step === 1 ? 'Create New Art Tour' : 'Select Artworks'}
                </Dialog.Title>
                
                <p className="text-gray-500 mb-6">
                  {step === 1 
                    ? 'Provide details for your custom art tour' 
                    : `Select artworks from ${city} to include in your tour`
                  }
                </p>
                
                {/* Progress indicator */}
                <div className="mb-8">
                  <div className="flex items-center">
                    <div 
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        step === 1 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'bg-white border-indigo-200 text-indigo-600'
                      }`}
                    >
                      <span className="font-semibold">1</span>
                    </div>
                    <div className={`flex-1 h-1 mx-2 transition-colors duration-300 ${step === 1 ? 'bg-gray-200' : 'bg-indigo-600'}`}></div>
                    <div 
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                        step === 2 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'bg-white border-indigo-200 text-indigo-500'
                      }`}
                    >
                      <span className="font-semibold">2</span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span className={step === 1 ? 'text-indigo-700 font-medium' : ''}>Tour Details</span>
                    <span className={step === 2 ? 'text-indigo-700 font-medium' : ''}>Select Artworks</span>
                  </div>
                </div>
                
                {/* Step 1: Tour details */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="tourName" className="block text-sm font-medium text-gray-700 mb-1">
                        Tour Name *
                      </label>
                      <input
                        type="text"
                        id="tourName"
                        value={tourName}
                        onChange={(e) => setTourName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., Street Art Tour of Berlin"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="citySearch" className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <div className="relative">
                        <div className="relative">
                          <input
                            type="text"
                            id="citySearch"
                            value={citySearch}
                            onChange={(e) => setCitySearch(e.target.value)}
                            onFocus={() => setShowCity(true)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Search cities..."
                            autoComplete="off"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* City dropdown */}
                        {showCity && citySearch && (
                          <div className="absolute z-10 mt-1 w-full bg-white shadow-xl max-h-60 rounded-lg py-2 text-base overflow-auto ring-1 ring-black ring-opacity-5">
                            {filteredCities.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-500">
                                No cities found
                              </div>
                            ) : (
                              <div>
                                <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider bg-gray-50">Available Cities</div>
                                {filteredCities.map((cityName) => (
                                  <div
                                    key={cityName}
                                    className={`cursor-pointer select-none relative py-2.5 pl-4 pr-9 hover:bg-indigo-50 ${
                                      city === cityName ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
                                    }`}
                                    onClick={() => {
                                      setCity(cityName);
                                      setCitySearch(cityName);
                                      setShowCity(false);
                                    }}
                                  >
                                    <div className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                      </svg>
                                      <span className="font-medium">{cityName}</span>
                                    </div>
                                    {city === cityName && (
                                      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Describe your tour (optional)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Visibility
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div 
                          className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                            visibility === 'public' 
                              ? 'border-indigo-600 bg-indigo-50' 
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => setVisibility('public')}
                        >
                          <div className={`flex items-center justify-center h-5 w-5 rounded-full border mr-3 mt-0.5 ${
                            visibility === 'public' 
                              ? 'border-indigo-600 bg-indigo-600' 
                              : 'border-gray-300'
                          }`}>
                            {visibility === 'public' && (
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                                <path d="M3.72 6.96l1.44 1.44 3.12-3.12-1.44-1.44L3.72 6.96z" />
                                <path d="M9.17 2.83L2.83 9.17 4.27 10.61 10.61 4.27 9.17 2.83z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Public</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              Anyone can view and explore this tour
                            </p>
                          </div>
                        </div>
                        
                        <div 
                          className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                            visibility === 'private' 
                              ? 'border-indigo-600 bg-indigo-50' 
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => setVisibility('private')}
                        >
                          <div className={`flex items-center justify-center h-5 w-5 rounded-full border mr-3 mt-0.5 ${
                            visibility === 'private' 
                              ? 'border-indigo-600 bg-indigo-600' 
                              : 'border-gray-300'
                          }`}>
                            {visibility === 'private' && (
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                                <path d="M3.72 6.96l1.44 1.44 3.12-3.12-1.44-1.44L3.72 6.96z" />
                                <path d="M9.17 2.83L2.83 9.17 4.27 10.61 10.61 4.27 9.17 2.83z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Private</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              Only you can access this tour
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 2: Select artworks */}
                {step === 2 && (
                  <div className="space-y-6">
                    {/* Search and filters */}
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <div className="relative">
                          <input
                            type="text"
                            id="artworkSearch"
                            value={artworkSearch}
                            onChange={(e) => setArtworkSearch(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pl-11"
                            placeholder="Search by name, artist, or theme..."
                          />
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowThemes(!showThemes)}
                          className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent flex items-center space-x-2 bg-white hover:bg-gray-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Filter</span>
                          {activeThemeFilter && (
                            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              1
                            </span>
                          )}
                        </button>
                        
                        {/* Theme filter dropdown */}
                        {showThemes && (
                          <div className="absolute right-0 mt-1 w-64 bg-white shadow-xl max-h-80 rounded-lg py-2 text-base overflow-auto ring-1 ring-black ring-opacity-5 z-20">
                            <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">
                              Filter by Theme
                            </div>
                            <div className="px-2">
                              {availableThemes.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  No themes available
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-2 py-2">
                                  {availableThemes.map((theme) => (
                                    <button
                                      key={theme}
                                      onClick={() => handleThemeFilter(theme)}
                                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                        activeThemeFilter === theme
                                          ? `bg-${getThemeColor(theme)}-600 text-white`
                                          : `bg-${getThemeColor(theme)}-100 text-${getThemeColor(theme)}-800 hover:bg-${getThemeColor(theme)}-200`
                                      }`}
                                      type="button"
                                    >
                                      {theme}
                                      {activeThemeFilter === theme && (
                                        <svg className="ml-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {activeThemeFilter && (
                                <div className="px-3 py-2 border-t border-gray-100">
                                  <button 
                                    className="text-xs text-indigo-600 hover:text-indigo-800"
                                    onClick={() => setActiveThemeFilter(null)}
                                  >
                                    Clear filter
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Selected count and clear button */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
                          {selectedArtworks.length}
                        </span>
                        <span className="text-sm text-gray-700">
                          artwork{selectedArtworks.length !== 1 ? 's' : ''} selected
                        </span>
                      </div>
                      {selectedArtworks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedArtworks([])}
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          Clear selection
                        </button>
                      )}
                    </div>
                    
                    {/* Artwork grid */}
                    <div className="overflow-y-auto max-h-96 bg-gray-50 rounded-lg border border-gray-200">
                      {fetchingArtworks ? (
                        <div className="flex flex-col justify-center items-center h-40">
                          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
                          <span className="text-gray-600">Loading artworks...</span>
                        </div>
                      ) : filteredArtworks.length === 0 ? (
                        <div className="py-12 text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500 mb-2">No artworks found</p>
                          {activeThemeFilter && (
                            <button 
                              className="text-indigo-600 hover:text-indigo-800 text-sm"
                              onClick={() => setActiveThemeFilter(null)}
                            >
                              Clear theme filter
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                          {filteredArtworks.map((artwork) => {
                            const isSelected = selectedArtworks.some(art => art._id === artwork._id);
                            // Get first letter of name for fallback image
                            const nameInitial = (artwork.name || "A").charAt(0).toUpperCase();
                            
                            return (
                              <div
                                key={artwork._id}
                                className={`group relative rounded-lg overflow-hidden transition-all duration-200 border ${
                                  isSelected 
                                    ? 'border-indigo-600 bg-indigo-50 shadow-md' 
                                    : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30'
                                }`}
                                onClick={() => toggleArtworkSelection(artwork)}
                              >
                                <div className="flex p-3 cursor-pointer">
                                  {/* Artwork image or fallback */}
                                  <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 relative">
                                    {artwork.artwork_url ? (
                                      <img 
                                        src={artwork.artwork_url} 
                                        alt={artwork.name || "Artwork"} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                          const parent = (e.target as HTMLImageElement).parentElement;
                                          if (parent) {
                                            parent.classList.add('flex', 'items-center', 'justify-center');
                                            parent.innerHTML = `<span class="text-3xl font-bold text-gray-300">${nameInitial}</span>`;
                                          }
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-3xl font-bold text-gray-300">{nameInitial}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Artwork details */}
                                  <div className="ml-3 flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                      {artwork.name || 'Untitled'}
                                    </h4>
                                    
                                    {artwork.artists && artwork.artists.length > 0 && (
                                      <p className="text-xs text-gray-500 mt-1 truncate">
                                        By {artwork.artists.join(', ')}
                                      </p>
                                    )}
                                    
                                    {artwork.themes && artwork.themes.length > 0 && (
                                      <div className="mt-1.5 flex flex-wrap gap-1">
                                        {artwork.themes.slice(0, 2).map((theme) => (
                                          <span 
                                            key={theme} 
                                            className={`inline-block bg-${getThemeColor(theme)}-100 text-${getThemeColor(theme)}-800 text-xs px-1.5 py-0.5 rounded-full`}
                                          >
                                            {theme}
                                          </span>
                                        ))}
                                        {artwork.themes.length > 2 && (
                                          <span className="inline-block bg-gray-100 text-gray-800 text-xs px-1.5 py-0.5 rounded-full">
                                            +{artwork.themes.length - 2}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Checkbox */}
                                  <div className="flex items-center">
                                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                      isSelected 
                                        ? 'bg-indigo-600 border-indigo-600' 
                                        : 'border-gray-300 group-hover:border-indigo-300'
                                    }`}>
                                      {isSelected && (
                                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                                          <path d="M3.72 6.96l1.44 1.44 3.12-3.12-1.44-1.44L3.72 6.96z" />
                                          <path d="M9.17 2.83L2.83 9.17 4.27 10.61 10.61 4.27 9.17 2.83z" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Error message */}
                {error && (
                  <div className="mt-4 flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}
                
                {/* Footer with buttons */}
                <div className="mt-8 flex justify-between">
                  {step === 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-700 bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
                        disabled={!isFormValid()}
                      >
                        Next Step
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1.5 inline" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-gray-700 bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 inline" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="group bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden"
                        disabled={loading || !isFormValid()}
                      >
                        {loading ? (
                          <span className="flex items-center">
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                            Creating Tour...
                          </span>
                        ) : (
                          <>
                            <span className="relative z-10">Create Tour</span>
                            <span className="absolute inset-0 h-full w-full bg-indigo-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200"></span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}