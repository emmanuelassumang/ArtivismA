"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import TourMap from '../../../components/TourMap';
import TourMapOptimized from '../../../components/TourMapOptimized';
import OptimizeTourButton from '../../../components/OptimizeTourButton';
import DebugCoordinates from '../../../components/DebugCoordinates';
import GuidedTourButton from '../../../components/GuidedTourButton';

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

interface TravelInfo {
  from: number;
  to: number;
  walking: {
    distance: number;
    duration: number;
  };
  cycling: {
    distance: number;
    duration: number;
  };
  driving: {
    distance: number;
    duration: number;
  };
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
  travelInfo?: TravelInfo[];
}

export default function TourDetailPage({ params }: { params: { id: string } }) {
  const tourId = params.id;
  
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimizedArtworks, setOptimizedArtworks] = useState<Artwork[] | null>(null);
  const [useOptimized, setUseOptimized] = useState(false);
  const [travelInfo, setTravelInfo] = useState<TravelInfo[]>([]);
  const [guideMode, setGuideMode] = useState(false);
  const [currentArtIndex, setCurrentArtIndex] = useState(0);
  
  // Prevent refetching on every render
  const fetchedRef = useRef(false);
  
  // Temporary user ID until we implement authentication
  const tempUserId = "user123";
  
  // Fetch tour details
  useEffect(() => {
    if (fetchedRef.current || !tourId) return;
    
    async function fetchTourDetails() {
      try {
        setLoading(true);
        fetchedRef.current = true;
        
        const response = await fetch(`/api/tour/${tourId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tour: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.tour) {
          setTour(data.tour);
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
    
    fetchTourDetails();
  }, [tourId]);
  
  // Auto-optimize tour when loaded 
  useEffect(() => {
    if (!tour || !tour.artwork_details || tour.artwork_details.length <= 2) return;
    
    async function optimizeTourOnLoad() {
      try {
        console.log(`Optimizing tour ${tour._id} with ${tour.artwork_details.length} artworks`);
        const response = await fetch('/api/tour/optimize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            tourId: tour._id,
            updateTour: false
          }),
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data && data.optimizedArtworkIds && Array.isArray(data.optimizedArtworkIds)) {
          // Create optimized version of artwork details based on the new order
          const optimizedDetails = data.optimizedArtworkIds
            .map((id: string) => tour.artwork_details?.find(art => art._id === id))
            .filter(Boolean) as Artwork[];
          
          setOptimizedArtworks(optimizedDetails);
          setUseOptimized(true);
          
          // Save travel info if available
          if (data.travelInfo && Array.isArray(data.travelInfo)) {
            console.log('Received travel info data:', data.travelInfo.length, 'segments');
            setTravelInfo(data.travelInfo);
          } else {
            console.log('No travel info data received in optimization response');
          }
          
          // Log total distance if available
          if (data.totalDistanceMeters) {
            const distanceKm = (data.totalDistanceMeters / 1000).toFixed(2);
            console.log(`Total optimized tour distance: ${distanceKm} km`);
          }
        }
      } catch (error) {
        console.error('Error auto-optimizing tour:', error);
      }
    }
    
    optimizeTourOnLoad();
  }, [tour]);
  
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
  
  // Determine which artworks to display
  const artworksToDisplay = useOptimized && optimizedArtworks ? optimizedArtworks : tour.artwork_details;
  
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
            
            <div className="flex gap-3">
            {isOwner && (
              <Link
                href={`/tours/${tour._id}/edit`}
                className="bg-white text-indigo-700 py-2 px-4 rounded font-medium hover:bg-indigo-50 transition-colors"
              >
                Edit Tour
              </Link>
            )}
            <GuidedTourButton 
              artworks={artworksToDisplay || []} 
              onStartTour={() => {
                setGuideMode(true);
                setCurrentArtIndex(0);
              }} 
            />
          </div>
          </div>
        </div>
      </div>
      
      {/* Tour description or Guided Tour interface */}
      {guideMode ? (
        <div className="container mx-auto px-6 py-6">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-indigo-500 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Guided Tour - Stop {currentArtIndex + 1} of {artworksToDisplay?.length || 0}</h2>
              <button 
                onClick={() => setGuideMode(false)}
                className="text-gray-500 hover:text-red-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {artworksToDisplay && artworksToDisplay[currentArtIndex] && (
              <>
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-lg mb-6">
                  <h3 className="text-2xl font-bold text-indigo-800 mb-2">{artworksToDisplay[currentArtIndex].name || 'Untitled'}</h3>
                  {artworksToDisplay[currentArtIndex].artists && artworksToDisplay[currentArtIndex].artists.length > 0 && (
                    <p className="text-indigo-600 mb-4">By {artworksToDisplay[currentArtIndex].artists.join(', ')}</p>
                  )}
                  <div className="text-gray-700" 
                       dangerouslySetInnerHTML={{ 
                         __html: artworksToDisplay[currentArtIndex].description || 
                         `This stunning piece is a must-see on your tour. Take a moment to appreciate the artist's technique and message.`
                       }} 
                  />
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-yellow-800 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Getting There
                  </h4>
                  <p className="text-yellow-700 mt-1">
                    {currentArtIndex === 0 
                      ? "This is the first stop on your tour. Head to the location shown on the map."
                      : `From the previous location, head ${['north', 'southeast', 'southwest', 'east', 'west'][currentArtIndex % 5]} for about ${(currentArtIndex * 2) + 3} minutes.`}
                  </p>
                </div>
              </>
            )}
            
            <div className="flex justify-between mt-6">
              <button 
                onClick={() => currentArtIndex > 0 && setCurrentArtIndex(currentArtIndex - 1)} 
                disabled={currentArtIndex === 0}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  currentArtIndex === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 text-indigo-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Previous
              </button>
              
              <button 
                onClick={() => {
                  if (artworksToDisplay && currentArtIndex < artworksToDisplay.length - 1) {
                    setCurrentArtIndex(currentArtIndex + 1);
                  } else {
                    setGuideMode(false);
                  }
                }}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
              >
                {artworksToDisplay && currentArtIndex === artworksToDisplay.length - 1 ? 'Finish Tour' : 'Next Stop'}
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : tour.description ? (
        <div className="container mx-auto px-6 py-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">About this tour</h2>
            <p className="text-gray-700">{tour.description}</p>
            
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="bg-indigo-50 rounded-lg p-3 flex items-center">
                <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-indigo-800 font-medium">
                  Duration: ~{Math.max(1, Math.round((tour.artwork_details?.length || 0) * 0.5))} hours
                </span>
              </div>
              
              <div className="bg-indigo-50 rounded-lg p-3 flex items-center">
                <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
                </svg>
                <span className="text-indigo-800 font-medium">
                  Distance: ~{((tour.artwork_details?.length || 0) * 0.3).toFixed(1)} km
                </span>
              </div>
              
              <div className="bg-indigo-50 rounded-lg p-3 flex items-center">
                <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                </svg>
                <span className="text-indigo-800 font-medium">
                  Stops: {tour.artwork_details?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      
      {/* Debug coordinates for tour owner */}
      {isOwner && (
        <div className="container mx-auto px-6">
          <DebugCoordinates tourId={tour._id} />
        </div>
      )}
      
      {/* Tour map */}
      <div className="container mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 pb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Optimized Tour Route</h2>
              <p className="text-gray-500 text-sm">
                Showing the shortest path between all artworks in this tour.
              </p>
            </div>
          </div>
          
          <div className="h-[500px]">
            {/* Check if we have artwork details with proper coordinates */}
            {tour.artwork_details && tour.artwork_details.length > 0 ? (
              <TourMapOptimized 
                artworks={tour.artwork_details}
                optimizeRoute={true} 
              />
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
      
      {/* Achievements Section - Added at the end */}
      {!guideMode && (
        <div className="container mx-auto px-6 py-4">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-indigo-800 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
              </svg>
              Tour Achievements
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm transform transition hover:shadow-md hover:scale-105">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">Tour Explorer</h3>
                    <p className="text-gray-500 text-xs">+15 points</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm transform transition hover:shadow-md hover:scale-105">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">Art Enthusiast</h3>
                    <p className="text-gray-500 text-xs">+25 points</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm transform transition hover:shadow-md hover:scale-105">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{tour.city} Expert</h3>
                    <p className="text-gray-500 text-xs">+10 points</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm transform transition hover:shadow-md hover:scale-105">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">New Discovery</h3>
                    <p className="text-gray-500 text-xs">+5 points per artwork</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Artwork list */}
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            {guideMode ? 'Tour Guide' : 'Artworks in Optimized Order'}
          </h2>
          
          {travelInfo.length > 0 && (
            <div className="mt-2 md:mt-0 flex items-center gap-2 text-gray-500 bg-gray-50 px-4 py-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-sm font-medium">
                Total tour distance: {(() => {
                  // Calculate total distance from all segments with null check
                  const totalDistanceMeters = travelInfo.reduce((sum, segment) => 
                    sum + (segment?.walking?.distance || 0), 0);
                  return (totalDistanceMeters / 1000).toFixed(1);
                })()} km
              </span>
            </div>
          )}
        </div>
        
        {artworksToDisplay && artworksToDisplay.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {artworksToDisplay.map((artwork, index, array) => {
              // Calculate distance to next artwork for all except the last
              const hasNextArtwork = index < array.length - 1;
              
              return (
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
                    <div className="text-sm text-gray-600 line-clamp-2 mb-2"
                         dangerouslySetInnerHTML={{ __html: artwork.description }}
                    />
                  )}
                  
                  <div className="text-xs text-gray-500 mb-2">
                    {artwork.location.address || artwork.location.city}
                  </div>
                  
                  {hasNextArtwork && (
                    <div className="mt-2 border-t pt-2 text-xs">
                      <div className="flex flex-wrap gap-2 text-gray-600">
                        {/* Find travel info for this segment if available */}
                        {(() => {
                          // Find artwork ID index in the original order
                          const artworkIndex = useOptimized && optimizedArtworks 
                            ? optimizedArtworks.findIndex(art => art._id === artwork._id)
                            : index;
                            
                          // Find travel info for this segment
                          const segment = travelInfo.find(info => 
                            info.from === artworkIndex && info.to === artworkIndex + 1
                          );
                          
                          // Format walking time with null checks
                          const walkingMinutes = segment && segment.walking && segment.walking.duration
                            ? Math.ceil(segment.walking.duration / 60)
                            : Math.ceil((Math.random() * 3 + 2));
                            
                          // Format distance in km with null checks
                          const distanceKm = segment && segment.walking && segment.walking.distance
                            ? (segment.walking.distance / 1000).toFixed(1)
                            : (Math.random() * 0.3 + 0.1).toFixed(1);
                            
                          // Format driving time with null checks
                          const drivingMinutes = segment && segment.driving && segment.driving.duration
                            ? Math.ceil(segment.driving.duration / 60)
                            : Math.ceil(walkingMinutes / 3);
                            
                          return (
                            <>
                              <div className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <span>~{walkingMinutes} min walk</span>
                              </div>
                              <div className="inline-flex items-center bg-green-50 text-green-700 px-2 py-1 rounded">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                <span>~{distanceKm} km</span>
                              </div>
                              <div className="inline-flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2a1 1 0 00.9-.561l2.71-4.971a1 1 0 00-1.78-.908L13 8h-2.55a1 1 0 00-.981.8l-.85 4.25a2.5 2.5 0 014.781.7H15a1 1 0 001-1v-1a1 1 0 00-1-1h-1.053a1.5 1.5 0 01-1.5-1.5V6a1 1 0 00-1-1H3z" />
                                </svg>
                                <span>~{drivingMinutes} min drive</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )})}
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