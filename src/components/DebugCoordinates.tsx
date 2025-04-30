"use client";

import { useState, useEffect } from 'react';

export default function DebugCoordinates({ tourId }: { tourId: string }) {
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tour details to check coordinates
  useEffect(() => {
    if (!tourId) return;
    
    async function fetchTourDetails() {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/tour/${tourId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tour: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.tour && data.tour.artwork_details) {
          setArtworks(data.tour.artwork_details);
        } else {
          throw new Error('Tour artwork details not found');
        }
      } catch (error) {
        console.error('Error fetching tour details:', error);
        setError('Failed to load artwork coordinates. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchTourDetails();
  }, [tourId]);

  if (loading) {
    return <div className="p-4 bg-gray-100 rounded">Loading artwork coordinates...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>;
  }

  if (artworks.length === 0) {
    return <div className="p-4 bg-yellow-100 text-yellow-700 rounded">No artwork coordinates found</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 my-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Artwork Coordinates Debug</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artwork</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Raw Coordinates</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Range Check</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {artworks.map((artwork, index) => {
              // Extract coordinates or show missing
              const coords = artwork.location?.coordinates || null;
              const hasCoords = coords && Array.isArray(coords) && coords.length === 2;
              
              // Parse values for analysis
              const val1 = hasCoords ? coords[0] : null;
              const val2 = hasCoords ? coords[1] : null;
              const isNumber1 = hasCoords && !isNaN(parseFloat(val1));
              const isNumber2 = hasCoords && !isNaN(parseFloat(val2));
              
              // Check coordinate ranges to detect potential reverse order
              const num1 = isNumber1 ? parseFloat(val1) : null;
              const num2 = isNumber2 ? parseFloat(val2) : null;
              const isValidLat1 = isNumber1 && Math.abs(num1) <= 90;
              const isValidLng1 = isNumber1 && Math.abs(num1) <= 180;
              const isValidLat2 = isNumber2 && Math.abs(num2) <= 90;
              const isValidLng2 = isNumber2 && Math.abs(num2) <= 180;
              
              // Determine likely format based on ranges
              let likelyFormat = 'Unknown';
              if (isValidLat1 && isValidLng2) {
                if (isValidLng1 && isValidLat2) {
                  likelyFormat = 'Ambiguous';
                } else {
                  likelyFormat = '[lat, lng]';
                }
              } else if (isValidLng1 && isValidLat2) {
                likelyFormat = '[lng, lat]';
              }
              
              // Determine if coordinates are valid overall
              const coordStatus = !hasCoords ? 'Missing' : 
                (!isNumber1 || !isNumber2) ? 'Invalid (NaN)' :
                (Math.abs(num1) > 180 || Math.abs(num2) > 180) ? 'Out of range' : 'Valid';

              return (
                <tr key={artwork._id || index} className={!hasCoords ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{artwork.name || 'Untitled'}</div>
                    <div className="text-xs text-gray-500">{artwork._id}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <code className="text-sm">{hasCoords ? JSON.stringify(coords) : 'Missing'}</code>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      coordStatus === 'Valid' ? 'bg-green-100 text-green-800' :
                      coordStatus === 'Missing' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {coordStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {hasCoords ? (
                      <div>
                        <div>First: {isNumber1 ? 
                          `${num1} (${isValidLat1 ? '✓ lat' : '✗ lat'}, ${isValidLng1 ? '✓ lng' : '✗ lng'})` : 
                          'Not a number'}
                        </div>
                        <div>Second: {isNumber2 ? 
                          `${num2} (${isValidLat2 ? '✓ lat' : '✗ lat'}, ${isValidLng2 ? '✓ lng' : '✗ lng'})` : 
                          'Not a number'}
                        </div>
                      </div>
                    ) : 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      likelyFormat === '[lat, lng]' ? 'bg-green-100 text-green-800' :
                      likelyFormat === '[lng, lat]' ? 'bg-blue-100 text-blue-800' :
                      likelyFormat === 'Ambiguous' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {likelyFormat}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p><strong>Note:</strong> MongoDB uses [longitude, latitude] format whereas Leaflet maps use [latitude, longitude] format.</p>
        <p>Coordinate issues can prevent tour optimization from working properly.</p>
      </div>
    </div>
  );
}