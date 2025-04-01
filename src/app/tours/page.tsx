"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TourList from "../../components/TourList";
import CreateTourModal from "../../components/CreateTourModal";

export default function ToursPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Temporary user ID until we implement authentication
  const tempUserId = "user123";
  
  // Fetch tours on component mount
  useEffect(() => {
    async function fetchTours() {
      try {
        setLoading(true);
        const response = await fetch(`/api/tour?limit=50`);
        if (!response.ok) {
          throw new Error(`Error fetching tours: ${response.statusText}`);
        }
        const data = await response.json();
        setTours(data.tours || []);
      } catch (err) {
        console.error("Failed to fetch tours:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTours();
  }, []);
  
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  
  const handleTourCreated = (newTour) => {
    setTours(prev => [newTour, ...prev]);
    handleCloseModal();
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-indigo-700 text-white py-8">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl font-bold mb-4">Art Tours</h1>
          <p className="text-indigo-100 mb-6 max-w-2xl">
            Create and explore curated tours of street art in cities around the world. 
            Save your favorite routes and share them with friends.
          </p>
          <button 
            onClick={handleOpenModal}
            className="bg-white text-indigo-700 py-2 px-6 rounded-lg font-medium hover:bg-indigo-50 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Create New Tour
          </button>
        </div>
      </div>
      
      {/* Tours list */}
      <div className="container mx-auto px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={handleOpenModal}
              className="bg-indigo-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Create Your First Tour
            </button>
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No Tours Found</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              You haven't created any art tours yet. Create your first curated tour to get started.
            </p>
            <button 
              onClick={handleOpenModal}
              className="bg-indigo-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Create Your First Tour
            </button>
          </div>
        ) : (
          <TourList tours={tours} currentUserId={tempUserId} onUpdate={(updatedTours) => setTours(updatedTours)} />
        )}
      </div>
      
      {/* Create tour modal */}
      <CreateTourModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onTourCreated={handleTourCreated}
        userId={tempUserId}
      />
    </div>
  );
}