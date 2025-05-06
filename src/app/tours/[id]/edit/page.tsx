"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Artwork {
  _id: string;
  name: string;
  description: string;
  image_url?: string;
  artwork_url?: string;
  location: {
    coordinates: [number, number];
    city: string;
    address?: string;
  };
  artists?: string[];
  themes?: string[];
}

interface Tour {
  _id: string;
  tour_name: string;
  city: string;
  description: string;
  visibility: string;
  created_at: string;
  user_id: string;
  artworks: string[];
  artwork_details?: Artwork[];
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditTourPage({ params }: PageProps) {
  const tourId = params.id;
  const router = useRouter();
  
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [availableArtworks, setAvailableArtworks] = useState<Artwork[]>([]);
  
  // Form state
  const [tourName, setTourName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [selectedArtworks, setSelectedArtworks] = useState<string[]>([]);
  
  // Temporary user ID until we implement authentication
  const tempUserId = "user123";
  
  // Fetch tour details and available artworks for the city
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch tour details
        const response = await fetch(`/api/tour/${tourId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tour: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.tour) {
          throw new Error('Tour not found');
        }
        
        // Check if user is authorized to edit
        if (data.tour.user_id !== tempUserId) {
          throw new Error('You are not authorized to edit this tour');
        }
        
        setTour(data.tour);
        
        // Initialize form state
        setTourName(data.tour.tour_name);
        setDescription(data.tour.description || '');
        setVisibility(data.tour.visibility);
        setSelectedArtworks(data.tour.artworks);
        
        // Fetch available artworks for the city
        const artsResponse = await fetch(`/api/art/search?city=${data.tour.city}`);
        
        if (artsResponse.ok) {
          const artsData = await artsResponse.json();
          if (artsData.arts) {
            setAvailableArtworks(artsData.arts);
          }
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load tour data');
      } finally {
        setLoading(false);
      }
    }
    
    if (tourId) {
      fetchData();
    }
  }, [tourId]);
  
  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!tour) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/tour/${tourId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tour_name: tourName,
          description,
          visibility,
          artworks: selectedArtworks,
          user_id: tempUserId, // Required for authorization
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update tour');
      }
      
      // Redirect to tour detail page
      router.push(`/tours/${tourId}`);
      
    } catch (error) {
      console.error('Error updating tour:', error);
      setError(error instanceof Error ? error.message : 'Failed to update tour');
      setSubmitting(false);
    }
  }
  
  // Handle artwork selection
  function toggleArtwork(artworkId: string) {
    setSelectedArtworks(prev => {
      if (prev.includes(artworkId)) {
        return prev.filter(id => id !== artworkId);
      } else {
        return [...prev, artworkId];
      }
    });
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // Error state
  if (error || !tour) {
    return (
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Cannot Edit Tour</h1>
          <p className="text-gray-600 mb-6">{error || 'The tour you are trying to edit does not exist or has been removed.'}</p>
          <Link
            href="/tours"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Tours
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-700 text-white py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link
                  href={`/tours/${tourId}`}
                  className="text-indigo-200 hover:text-white flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Back to Tour
                </Link>
                
                <span className="text-indigo-200">/</span>
                
                <span className="text-white">Edit</span>
              </div>
              
              <h1 className="text-3xl font-bold mb-2">Edit Tour</h1>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit form */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit}>
            {/* Tour name */}
            <div className="mb-6">
              <label htmlFor="tourName" className="block text-sm font-medium text-gray-700 mb-1">
                Tour Name
              </label>
              <input
                type="text"
                id="tourName"
                value={tourName}
                onChange={(e) => setTourName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* Visibility */}
            <div className="mb-6">
              <span className="block text-sm font-medium text-gray-700 mb-1">
                Visibility
              </span>
              <div className="flex gap-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="public"
                    name="visibility"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="public" className="ml-2 text-sm text-gray-700">
                    Public
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="private"
                    name="visibility"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="private" className="ml-2 text-sm text-gray-700">
                    Private
                  </label>
                </div>
              </div>
            </div>
            
            {/* Artworks */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Artworks in {tour.city} ({selectedArtworks.length} selected)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableArtworks.map((artwork) => {
                  const isSelected = selectedArtworks.includes(artwork._id);
                  
                  return (
                    <div 
                      key={artwork._id}
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-colors ${
                        isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleArtwork(artwork._id)}
                    >
                      <div className="relative h-40 bg-gray-200">
                        {artwork.artwork_url ? (
                          <img
                            src={artwork.artwork_url}
                            alt={artwork.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No image available
                          </div>
                        )}
                        
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full h-6 w-6 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3">
                        <h4 className="font-medium text-gray-800">{artwork.name || 'Untitled'}</h4>
                        {artwork.artists && artwork.artists.length > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            By {artwork.artists.join(', ')}
                          </p>
                        )}
                        {artwork.location.address && (
                          <p className="text-xs text-gray-500 mt-1">
                            {artwork.location.address}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {availableArtworks.length === 0 && (
                  <div className="col-span-3 bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-500">No artwork found in {tour.city}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <Link
                href={`/tours/${tourId}`}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || selectedArtworks.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}