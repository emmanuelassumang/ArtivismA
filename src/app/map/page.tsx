"use client";

export default function MapPage() {
  return (
    <div className="flex flex-col h-screen w-screen pt-16">
      {/* Page title */}
      <div className="bg-indigo-700 text-white py-6">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl font-bold">Explore Artwork</h1>
          <p className="text-indigo-100 mt-2">
            Discover street art across different cities and themes
          </p>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="flex-1 overflow-hidden">
        <iframe 
          src="/basic-map.html" 
          className="w-full h-full border-none"
          title="Artivism Map"
          allow="geolocation"
        />
      </div>
    </div>
  );
}