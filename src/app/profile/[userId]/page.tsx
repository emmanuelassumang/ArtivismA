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
}

interface Artwork {
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userRes = await fetch(`/api/users/${userId}`);
        const userData = await userRes.json();

        if (!userData.user) throw new Error("User not found");

        setUser(userData.user);

        const toursRes = await fetch(`/api/tour/user?user_id=${userData.user.user_id}`);
        const toursData = await toursRes.json();
        setCreatedTours(toursData.tours);
      } catch (err) {
        console.error("Failed to fetch user profile or tours:", err);
      } finally {
        setLoading(false);
      }
    }

    if (userId) fetchUser();
  }, [userId]);

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
            <li><strong>Liked Artworks:</strong> {user.liked_arts?.length || 0}</li>
            <li><strong>Created Tours:</strong> {user.created_tours?.length || 0}</li>
          </ul>
        </div>
      </section>

      {/* Created Tours Grid */}
      <section className="container mx-auto px-6 pt-4 pb-16">
        <h2 className="text-2xl font-semibold text-indigo-800 mb-6 text-center">Created Tours</h2>
        {createdTours.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {createdTours.map((tour) => {
              const image = tour.artwork_details?.[0]?.artwork_url;
              return (
                <div key={tour._id} className="bg-white rounded-lg shadow hover:shadow-md transition">
                  <div className="relative h-40 bg-gray-100 overflow-hidden rounded-t-lg">
                    <img
                      src={image || "https://via.placeholder.com/300x200?text=No+Image"}
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
    </main>
  );
}
