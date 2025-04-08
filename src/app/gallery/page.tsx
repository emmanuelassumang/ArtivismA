'use client';

import { useEffect, useState } from "react";
import Link from "next/link";

export default function GalleryPage() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArtworks() {
      try {
        const res = await fetch("/api/art/search");
        const data = await res.json();
        setArtworks(data.artworks);
      } catch (err) {
        console.error("Failed to fetch artworks:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchArtworks();
  }, []);

  if (loading) {
    return <div className="p-10 text-center">Loading artworks...</div>;
  }

  return (
    <main className="min-h-screen px-6 pt-28 pb-16 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-indigo-800 mb-10 text-center">Gallery</h1>
      {artworks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {artworks.map((art) => (
            <Link key={art._id} href={`/art/${art._id}`}>
              <div className="overflow-hidden rounded-xl shadow hover:shadow-md transition-transform duration-300 transform hover:scale-105">
                <img
                  src={art.artwork_url}
                  alt={art.name}
                  className="w-full h-40 object-cover"
                />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No artworks found.</p>
      )}
    </main>
  );
}
