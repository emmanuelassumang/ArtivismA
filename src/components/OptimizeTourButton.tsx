"use client";

import { useState } from 'react';

interface OptimizeTourButtonProps {
  tourId: string;
  onOptimized?: (optimizedOrder: string[]) => void;
}

export default function OptimizeTourButton({ tourId, onOptimized }: OptimizeTourButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const optimizeTour = async (updateTour = false) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Optimizing tour ${tourId}, updateTour=${updateTour}`);
      
      const response = await fetch('/api/tour/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tourId, 
          updateTour 
        }),
      });
      
      console.log('Received response:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to optimize tour: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json().catch(e => {
        console.error('Error parsing response JSON:', e);
        throw new Error('Invalid response from server');
      });
      
      console.log('Optimization response data:', data);
      
      if (!data || !data.optimizedArtworkIds || !Array.isArray(data.optimizedArtworkIds)) {
        throw new Error('Invalid optimization data returned');
      }
      
      if (onOptimized && data.optimizedArtworkIds) {
        console.log('Calling onOptimized with:', data.optimizedArtworkIds);
        onOptimized(data.optimizedArtworkIds);
      }
      
      // Check for optimization message
      if (data.message) {
        console.log(`Optimization message: ${data.message}`);
        alert(data.message);
        return data;
      }
      
      // Calculate distance in kilometers for display
      const distanceKm = data.totalDistanceMeters ? 
        (data.totalDistanceMeters / 1000).toFixed(2) : 
        null;
      
      // Show success message with distance saved
      if (distanceKm) {
        // Implementation could display a toast or alert with the distance saved
        console.log(`Tour optimized! Total distance: ${distanceKm}km`);
        
        // Show an alert with the result
        alert(`Tour optimized! Total distance: ${distanceKm}km`);
      }
      
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Something went wrong';
      setError(errorMessage);
      console.error('Error optimizing tour:', err);
      alert(`Failed to optimize tour: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Preview optimization without saving changes
  const previewOptimizedRoute = () => optimizeTour(false);
  
  // Apply optimization and save to database
  const applyOptimizedRoute = () => optimizeTour(true);
  
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={previewOptimizedRoute}
        disabled={loading}
        className="px-4 py-2.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 font-semibold shadow-sm flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
        {loading ? 'Optimizing...' : 'Preview Optimized Route'}
      </button>
      
      <button
        onClick={applyOptimizedRoute}
        disabled={loading}
        className="px-4 py-2.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 font-semibold shadow-sm flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        {loading ? 'Optimizing...' : 'Apply Shortest Route'}
      </button>
      
      {error && (
        <div className="text-red-500 text-sm mt-1">{error}</div>
      )}
    </div>
  );
}