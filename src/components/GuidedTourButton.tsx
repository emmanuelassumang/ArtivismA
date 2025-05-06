"use client";

import { useState } from 'react';

interface Artwork {
  _id: string;
  name: string;
  artists?: string[];
  description?: string;
  location: {
    coordinates: [number, number];
  };
}

interface GuidedTourButtonProps {
  artworks: Artwork[];
  onStartTour: () => void;
}

export default function GuidedTourButton({ artworks, onStartTour }: GuidedTourButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleStartTour = () => {
    setShowModal(false);
    onStartTour();
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center justify-center"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
        </svg>
        Start Tour Guide
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Start Guided Tour</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4 mb-6 border-l-4 border-indigo-500">
              <p className="text-indigo-700">
                You're about to start a guided tour with {artworks.length} stops. A virtual guide will take you through each artwork, providing directions and information.
              </p>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-3">Tour Highlights:</h4>
              <ul className="space-y-2">
                {artworks.slice(0, 3).map((artwork, index) => (
                  <li key={artwork._id} className="flex items-start">
                    <div className="flex-shrink-0 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-gray-700">{artwork.name || 'Untitled Artwork'}</span>
                  </li>
                ))}
                {artworks.length > 3 && (
                  <li className="text-gray-500 text-sm italic pl-8">
                    And {artworks.length - 3} more stops...
                  </li>
                )}
              </ul>
            </div>

            <div className="bg-yellow-50 rounded-lg p-3 mb-6 text-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-yellow-700">
                    Remember to be aware of your surroundings during the tour. Data and roaming charges may apply.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartTour}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Start Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}