"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface User {
  _id: string;
  user_id: string;
  username: string;
  email: string;
  city?: string;
  profile_created_at: string;
  liked_arts: string[];
  created_tours: string[];
  bio?: string;
}

interface Artwork {
  _id: string;
  name?: string;
  artists?: string[];
  artwork_url?: string;
}

interface Tour {
  _id: string;
  tour_name: string;
  city: string;
  description?: string;
  artwork_details?: Artwork[];
}

export default function ProfilePage() {
  const { userId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [createdTours, setCreatedTours] = useState<Tour[]>([]);
  const [likedArtworks, setLikedArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState<string>("");
  const [editingBio, setEditingBio] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userRes = await fetch(`/api/users/${userId}`);
        const userData = await userRes.json();

        if (!userData.user) throw new Error("User not found");

        setUser(userData.user);
        setBio(userData.user.bio || "");

        if (userData.user.created_tours?.length > 0) {
          const ids = userData.user.created_tours.join(",");
          const toursRes = await fetch(`/api/tour/many?ids=${ids}`);
          const toursData = await toursRes.json();
          setCreatedTours(toursData.tours);
        }        

        if (userData.user.liked_arts?.length > 0) {
          const artsRes = await fetch("/api/art/search?limit=1000");
          const artsData = await artsRes.json();
          const liked = artsData.artworks.filter((a: Artwork) => userData.user.liked_arts.includes(a._id));
          setLikedArtworks(liked);
        }
      } catch (err) {
        console.error("Failed to fetch user profile or tours:", err);
      } finally {
        setLoading(false);
      }
    }

    if (userId) fetchUser();
  }, [userId]);

  const handleBioSave = async () => {
    if (!user) return;

    try {
      await fetch(`/api/users/${user._id}/bio`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio })
      });
      setEditingBio(false);
      setUser((prev) => prev ? { ...prev, bio } : prev);
    } catch (err) {
      console.error("Failed to update bio:", err);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">User not found.</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-800 via-purple-800 to-violet-900 text-white py-20 text-center">
        <h1 className="text-5xl font-bold mb-2">Welcome, {user.username}</h1>
        <p className="text-indigo-200 text-lg">Member since {new Date(user.profile_created_at).toLocaleDateString()}</p>
      </section>

      {/* Profile Details */}
      <section className="container mx-auto px-6 pt-12 pb-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-indigo-800 mb-6">Your Profile</h2>
          <ul className="space-y-4 text-gray-700">
            <li><strong>Email:</strong> {user.email}</li>
            <li><strong>City:</strong> {user.city || "Not specified"}</li>
            <li><strong>Liked Artworks:</strong> {user.liked_arts?.length || 0}</li>
            <li><strong>Created Tours:</strong> {user.created_tours?.length || 0}</li>
            <li>
              <strong>Bio:</strong>
              {editingBio ? (
                <div className="mt-2">
                  <textarea
                    className="w-full border rounded p-2 text-sm"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                  <button
                    onClick={handleBioSave}
                    className="mt-2 bg-indigo-600 text-white py-1 px-4 rounded text-sm"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">{user.bio || "No bio provided."}</p>
                  <button
                    onClick={() => setEditingBio(true)}
                    className="mt-1 text-indigo-600 text-sm"
                  >
                    Edit Bio
                  </button>
                </div>
              )}
            </li>
          </ul>
        </div>
      </section>

      {/* Created Tours Grid */}
      <section className="container mx-auto px-6 pt-4 pb-16">
        <h2 className="text-2xl font-semibold text-indigo-800 mb-6 text-center">Created Tours</h2>
        {createdTours.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

{createdTours.map((tour) => {
  const image = "https://placehold.co/300x200?text=Art+Tour";

  return (
    <div key={tour._id} className="bg-white rounded-lg shadow hover:shadow-md transition">
      <div className="relative h-40 bg-gray-100 overflow-hidden rounded-t-lg">
        <img
          src={image}
          alt={tour.tour_name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-indigo-700">{tour.tour_name}</h3>
        <p className="text-sm text-gray-600">{tour.city}</p>
        {tour.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{tour.description}</p>
        )}
        <Link
          href={`/tours/${tour._id}`}
          className="text-indigo-600 mt-2 inline-block text-sm font-medium"
        >
          View Tour →
        </Link>
      </div>
    </div>
  );
})}

          </div>
        ) : (
          <p className="text-center text-gray-500">You haven't created any tours yet.</p>
        )}
      </section>

      {/* Liked Artworks Grid */}
      <section className="container mx-auto px-6 pb-20">
        <h2 className="text-2xl font-semibold text-indigo-800 mb-6 text-center">Liked Artworks</h2>
        {likedArtworks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {likedArtworks.map((art) => (
              <div key={art._id} className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="h-32 bg-gray-100">
                  <img
                    src={art.artwork_url || "https://via.placeholder.com/300x200?text=No+Image"}
                    alt={art.name || "Artwork"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-indigo-700 line-clamp-1">{art.name || "Untitled"}</h3>
                  {art.artists?.length > 0 && (
                    <p className="text-xs text-gray-500 line-clamp-1">{art.artists.join(", ")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">You haven't liked any artworks yet.</p>
        )}
      </section>
    </main>
  );
}