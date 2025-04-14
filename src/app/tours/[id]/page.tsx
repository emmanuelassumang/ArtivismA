"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import TourMap from '../../../components/TourMap';
import { use } from 'react';

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

export default function TourDetailPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  // Unwrap params if it's a Promise
  const resolvedParams = use(params);
  const tourId = resolvedParams.id;
  
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Temporary user ID until we implement authentication
  const tempUserId = "user123";
  
  // Fetch tour details
  useEffect(() => {
    async function fetchTourDetails() {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/tour/${tourId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tour: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Debug the response
        console.log('Tour API response:', data);
        
        if (data.tour) {
          setTour(data.tour);
          console.log('Tour data set:', data.tour);
          console.log('Artwork details:', data.tour.artwork_details);
        } else {
          throw new Error('Tour not found');
        }
      } catch (error) {
        console.error('Error fetching tour details:', error);
        setError('Failed to load tour details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    if (tourId) {
      fetchTourDetails();
    }
  }, [tourId]);
  
  // Format date
  const formattedDate = tour?.created_at 
    ? formatDistanceToNow(new Date(tour.created_at), { addSuffix: true }) 
    : '';
  
  // Check if user is the owner
  const isOwner = tour?.user_id === tempUserId;
  
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
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Tour Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The tour you are looking for does not exist or has been removed.'}</p>
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
      {/* Tour header */}
      <div className="bg-indigo-700 text-white py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link
                  href="/tours"
                  className="text-indigo-200 hover:text-white flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Back to Tours
                </Link>
                
                <span className="text-indigo-200">/</span>
                
                <span className="text-white">{tour.tour_name}</span>
              </div>
              
              <h1 className="text-3xl font-bold mb-2">{tour.tour_name}</h1>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-indigo-100">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {tour.city}
                </div>
                
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {tour.visibility === 'public' ? 'Public' : 'Private'}
                </div>
                
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Created {formattedDate}
                </div>
                
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {tour.artwork_details?.length || tour.artworks.length} Artworks
                </div>
              </div>
            </div>
            
            {isOwner && (
              <Link
                href={`/tours/${tour._id}/edit`}
                className="bg-white text-indigo-700 py-2 px-4 rounded font-medium hover:bg-indigo-50 transition-colors"
              >
                Edit Tour
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Tour description */}
      {tour.description && (
        <div className="container mx-auto px-6 py-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">About this tour</h2>
            <p className="text-gray-700">{tour.description}</p>
          </div>
        </div>
      )}
      
      {/* Tour map */}
      <div className="container mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <h2 className="text-xl font-semibold text-gray-800 p-6 pb-0">Tour Map</h2>
          <p className="text-gray-500 text-sm px-6 pb-4">Follow this route to discover all artworks in this tour.</p>
          <div className="h-96">
            {/* Check if we have artwork details with proper coordinates */}
            {tour.artwork_details && tour.artwork_details.length > 0 ? (
              <TourMap artworks={tour.artwork_details} />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">
                <div className="text-center p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p>Could not load artwork locations for this tour.</p>
                  <p className="text-sm mt-2">The tour contains {tour.artworks.length} artwork references.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Artwork list */}
      <div className="container mx-auto px-6 py-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Artworks in this Tour</h2>
        
        {tour.artwork_details && tour.artwork_details.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tour.artwork_details.map((artwork, index) => (
              <div key={artwork._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-48 bg-gray-200">
                  {artwork.artwork_url ? (
                    <img
                      src={artwork.artwork_url}
                      alt={artwork.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Use a local fallback instead of external placeholder
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          // Create a fallback element with the first letter of the artwork name
                          const nameInitial = (artwork.name || "Art").charAt(0).toUpperCase();
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-300';
                          fallback.innerHTML = `<span class="text-5xl font-bold">${nameInitial}</span>`;
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-100">
                      <span className="text-5xl font-bold text-indigo-300">
                        {(artwork.name || "Art").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                    {index + 1}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{artwork.name || 'Untitled'}</h3>
                  
                  {artwork.artists && artwork.artists.length > 0 && (
                    <p className="text-sm text-gray-600 mb-2">
                      By {artwork.artists.join(', ')}
                    </p>
                  )}
                  
                  {artwork.themes && artwork.themes.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {artwork.themes.map(theme => (
                        <span key={theme} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {artwork.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {artwork.description}
                    </p>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    {artwork.location.address || artwork.location.city}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Artwork Details Available</h3>
            <p className="text-gray-500">
              This tour contains artwork references, but the detailed information could not be loaded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}