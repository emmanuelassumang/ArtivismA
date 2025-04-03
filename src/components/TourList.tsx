"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Tour {
  _id: string;
  tour_name: string;
  city: string;
  description: string;
  created_at: string;
  user_id: string;
  artworks: string[];
  visibility: string;
}

interface TourListProps {
  tours: Tour[];
  currentUserId: string;
  onUpdate: (tours: Tour[]) => void;
}

export default function TourList({ tours, currentUserId, onUpdate }: TourListProps) {
  const [expandedDescription, setExpandedDescription] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [visibleTours, setVisibleTours] = useState<Tour[]>([]);
  
  // Refs for observer
  const tourRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // Set initial visible tours
  useEffect(() => {
    setVisibleTours(tours.slice(0, Math.min(6, tours.length)));
  }, [tours]);
  
  // Setup intersection observer for animation effects
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('opacity-0', 'translate-y-8');
          entry.target.classList.add('opacity-100', 'translate-y-0');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    // Observe all tour cards
    tourRefs.current.forEach((ref) => {
      if (ref) {
        ref.classList.add('opacity-0', 'translate-y-8');
        observer.observe(ref);
      }
    });
    
    return () => observer.disconnect();
  }, [visibleTours]);
  
  // Toggle description expansion
  const toggleDescription = (tourId: string) => {
    if (expandedDescription === tourId) {
      setExpandedDescription(null);
    } else {
      setExpandedDescription(tourId);
    }
  };

  // Handle tour deletion
  const handleDeleteTour = async (tourId: string) => {
    try {
      setLoading(tourId);
      
      const response = await fetch(`/api/tour/${tourId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: currentUserId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete tour: ${response.statusText}`);
      }
      
      // Update local state
      const updatedTours = tours.filter(tour => tour._id !== tourId);
      onUpdate(updatedTours);
      
      // Clear confirm state
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting tour:', error);
      alert('Failed to delete tour: ' + error.message);
    } finally {
      setLoading(null);
    }
  };
  
  // Load more tours
  const loadMoreTours = () => {
    const currentLength = visibleTours.length;
    const nextBatch = tours.slice(currentLength, currentLength + 6);
    setVisibleTours([...visibleTours, ...nextBatch]);
  };
  
  // Get a random colorful gradient for each tour card
  const getGradient = (tourId: string) => {
    // Generate a deterministic but "random" number from the tour ID
    const hash = tourId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    // Define a set of gradient combinations for variety
    const gradients = [
      'from-indigo-500 to-purple-500',
      'from-blue-500 to-indigo-500',
      'from-purple-500 to-pink-500',
      'from-pink-500 to-rose-500',
      'from-rose-500 to-orange-500',
      'from-orange-500 to-amber-500',
      'from-amber-500 to-yellow-500',
      'from-emerald-500 to-teal-500',
      'from-teal-500 to-cyan-500',
      'from-cyan-500 to-sky-500',
    ];
    
    return gradients[hash % gradients.length];
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {visibleTours.map((tour) => {
          const isOwner = tour.user_id === currentUserId;
          const isDeleteConfirming = deleteConfirm === tour._id;
          const isLoading = loading === tour._id;
          const formattedDate = tour.created_at ? formatDistanceToNow(new Date(tour.created_at), { addSuffix: true }) : 'Unknown date';
          const cardGradient = getGradient(tour._id);
          
          return (
            <div 
              key={tour._id} 
              className="bg-white rounded-xl shadow-sm overflow-hidden hover-lift transform transition-all duration-500"
              ref={(el) => el && tourRefs.current.set(tour._id, el)}
            >
              {/* Colorful header */}
              <div className={`h-3 bg-gradient-to-r ${cardGradient}`}></div>
              
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold text-gray-800 mb-1">{tour.tour_name}</h3>
                  <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-medium">
                    {tour.city}
                  </span>
                </div>
                
                <div className="mt-3">
                  {tour.description ? (
                    <>
                      <p className={`text-gray-600 text-sm ${expandedDescription === tour._id ? '' : 'line-clamp-2'}`}>
                        {tour.description}
                      </p>
                      {tour.description.length > 100 && (
                        <button 
                          onClick={() => toggleDescription(tour._id)}
                          className="text-indigo-600 text-xs mt-1 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                        >
                          {expandedDescription === tour._id ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm italic">No description provided</p>
                  )}
                </div>
                
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <div className="flex items-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="font-medium">{tour.artworks.length}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="capitalize">{tour.visibility}</span>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between items-center">
                  <Link 
                    href={`/tours/${tour._id}`}
                    className="relative inline-flex items-center justify-center bg-indigo-600 text-white text-sm py-2 px-6 rounded-lg overflow-hidden group hover:bg-indigo-700 transition-colors"
                  >
                    <span className="relative z-10 flex items-center">
                      <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 5L20 10M20 10L15 15M20 10H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      View Tour
                    </span>
                    <span className="absolute w-0 h-full bg-indigo-700 left-0 top-0 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  
                  {isOwner && (
                    <div className="flex space-x-2">
                      <Link 
                        href={`/tours/${tour._id}/edit`}
                        className="text-gray-600 hover:text-indigo-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      
                      {!isDeleteConfirming ? (
                        <button 
                          onClick={() => setDeleteConfirm(tour._id)}
                          className="text-gray-600 hover:text-red-600 transition-colors"
                          disabled={isLoading}
                          aria-label="Delete tour"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      ) : (
                        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg absolute right-6 mt-2 z-10">
                          <p className="text-sm text-gray-700 mb-2">Delete this tour?</p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleDeleteTour(tour._id)}
                              className="bg-red-600 text-white text-xs py-1 px-3 rounded hover:bg-red-700 transition-colors"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <span className="flex items-center">
                                  <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1"></span>
                                  Deleting...
                                </span>
                              ) : (
                                'Yes, delete'
                              )}
                            </button>
                            <button 
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-600 text-xs py-1 px-3 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                              disabled={isLoading}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Load more button */}
      {visibleTours.length < tours.length && (
        <div className="text-center mt-8">
          <button
            onClick={loadMoreTours}
            className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors duration-300"
          >
            <span>Load more tours</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}