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
  preferences?: {
    artStyles?: string[];
    maxDistance?: number;
    timeAvailability?: string;
    accessibilityNeeds?: string[];
    themes?: string[];
  };
  achievements?: {
    points: number;
    completedTours: string[];
    badges: string[];
    artworksVisited: number;
  };
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
  const params = useParams();
  const userId = params?.userId as string;
  const [user, setUser] = useState<User | null>(null);
  const [createdTours, setCreatedTours] = useState<Tour[]>([]);
  const [likedArtworks, setLikedArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState<string>("");
  const [editingBio, setEditingBio] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'achievements'>('profile');
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    artStyles: [] as string[],
    maxDistance: 5,
    timeAvailability: '1-2 hours',
    accessibilityNeeds: [] as string[],
    themes: [] as string[]
  });

  useEffect(() => {
    async function fetchUser() {
      try {
        const userRes = await fetch(`/api/users/${userId}`);
        const userData = await userRes.json();

        if (!userData.user) throw new Error("User not found");

        setUser(userData.user);
        setBio(userData.user.bio || "");
        
        // Initialize preferences from user data if available
        if (userData.user.preferences) {
          setPreferences({
            artStyles: userData.user.preferences.artStyles || [],
            maxDistance: userData.user.preferences.maxDistance || 5,
            timeAvailability: userData.user.preferences.timeAvailability || '1-2 hours',
            accessibilityNeeds: userData.user.preferences.accessibilityNeeds || [],
            themes: userData.user.preferences.themes || []
          });
        }

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

  const handlePreferencesSave = async () => {
    if (!user) return;

    try {
      // This endpoint would need to be created on the backend
      await fetch(`/api/users/${user._id}/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences })
      });
      setEditingPreferences(false);
      setUser((prev) => prev ? { ...prev, preferences } : prev);
    } catch (err) {
      console.error("Failed to update preferences:", err);
    }
  };

  const artStyleOptions = ["Street Art", "Murals", "Sculptures", "Installations", "Performance Art", "Digital Art", "Mixed Media"];
  const themeOptions = ["Social Justice", "Environmental", "Cultural Heritage", "Political", "Peace", "Education", "Community"];
  const accessibilityOptions = ["Wheelchair Accessible", "Audio Descriptions", "Low Mobility Friendly", "Child Friendly"];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">User not found.</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-indigo-800 via-purple-800 to-violet-900 text-white py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div className="w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.2), rgba(255,255,255,0.2) 1px, transparent 1px, transparent 10px),
                              repeating-linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.2) 1px, transparent 1px, transparent 10px)`
          }}></div>
        </div>
        <div className="container mx-auto px-6 z-10 relative">
          <div className="w-32 h-32 mx-auto bg-indigo-600 rounded-full mb-5 flex items-center justify-center border-4 border-white shadow-lg">
            <span className="text-5xl font-bold text-white">{user.username.charAt(0).toUpperCase()}</span>
          </div>
          <h1 className="text-6xl font-bold mb-3">Welcome, {user.username}</h1>
          <p className="text-indigo-200 text-lg">Member since {new Date(user.profile_created_at).toLocaleDateString()}</p>
        </div>
      </section>

      {/* Profile Navigation Tabs */}
      <section className="container mx-auto px-6 pt-12 pb-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto transform -translate-y-16">
          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'profile'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-indigo-600'
              }`}
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              Profile
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-6 py-3 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'preferences'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-indigo-600'
              }`}
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-6 py-3 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'achievements'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-indigo-600'
              }`}
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
              </svg>
              Achievements
            </button>
          </div>

          {/* Profile Tab Content */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-2xl font-semibold text-indigo-800 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Profile Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 transform transition-transform hover:scale-105">
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="text-lg font-medium">{user.email}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 transform transition-transform hover:scale-105">
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="text-lg font-medium">{user.city || "Not specified"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 transform transition-transform hover:scale-105">
                  <p className="text-sm text-gray-500 mb-1">Liked Artworks</p>
                  <p className="text-lg font-medium">{user.liked_arts?.length || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 transform transition-transform hover:scale-105">
                  <p className="text-sm text-gray-500 mb-1">Created Tours</p>
                  <p className="text-lg font-medium">{user.created_tours?.length || 0}</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-gray-900">About</h3>
                  {!editingBio && (
                    <button
                      onClick={() => setEditingBio(true)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                      </svg>
                      Edit
                    </button>
                  )}
                </div>
                {editingBio ? (
                  <div className="mt-2">
                    <textarea
                      className="w-full border rounded-lg p-3 text-gray-700 focus:ring focus:ring-indigo-200 focus:border-indigo-500"
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                    />
                    <button
                      onClick={handleBioSave}
                      className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm transition duration-200"
                    >
                      Save Bio
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{user.bio || "No bio provided yet. Click 'Edit' to add your bio."}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preferences Tab Content */}
          {activeTab === 'preferences' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-indigo-800 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  Tour Preferences
                </h2>
                {!editingPreferences && (
                  <button
                    onClick={() => setEditingPreferences(true)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                    Edit Preferences
                  </button>
                )}
              </div>

              {editingPreferences ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Art Styles You Enjoy</label>
                    <div className="flex flex-wrap gap-2">
                      {artStyleOptions.map(style => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => {
                            if (preferences.artStyles.includes(style)) {
                              setPreferences({
                                ...preferences,
                                artStyles: preferences.artStyles.filter(s => s !== style)
                              });
                            } else {
                              setPreferences({
                                ...preferences,
                                artStyles: [...preferences.artStyles, style]
                              });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                            preferences.artStyles.includes(style)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Walking Distance (km)</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={preferences.maxDistance}
                      onChange={(e) => setPreferences({...preferences, maxDistance: parseInt(e.target.value)})}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 px-1">
                      <span>1 km</span>
                      <span>{preferences.maxDistance} km</span>
                      <span>10 km</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Availability</label>
                    <select
                      value={preferences.timeAvailability}
                      onChange={(e) => setPreferences({...preferences, timeAvailability: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Under 1 hour">Under 1 hour</option>
                      <option value="1-2 hours">1-2 hours</option>
                      <option value="2-3 hours">2-3 hours</option>
                      <option value="Half day">Half day</option>
                      <option value="Full day">Full day</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Accessibility Needs</label>
                    <div className="flex flex-wrap gap-2">
                      {accessibilityOptions.map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            if (preferences.accessibilityNeeds.includes(option)) {
                              setPreferences({
                                ...preferences,
                                accessibilityNeeds: preferences.accessibilityNeeds.filter(o => o !== option)
                              });
                            } else {
                              setPreferences({
                                ...preferences,
                                accessibilityNeeds: [...preferences.accessibilityNeeds, option]
                              });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                            preferences.accessibilityNeeds.includes(option)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Themes of Interest</label>
                    <div className="flex flex-wrap gap-2">
                      {themeOptions.map(theme => (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => {
                            if (preferences.themes.includes(theme)) {
                              setPreferences({
                                ...preferences,
                                themes: preferences.themes.filter(t => t !== theme)
                              });
                            } else {
                              setPreferences({
                                ...preferences,
                                themes: [...preferences.themes, theme]
                              });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                            preferences.themes.includes(theme)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setEditingPreferences(false)}
                      className="mr-2 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg text-sm transition duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePreferencesSave}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm transition duration-200"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                    <h3 className="font-medium text-gray-900 mb-3">Art Styles</h3>
                    <div className="flex flex-wrap gap-2">
                      {preferences.artStyles.length > 0 ? (
                        preferences.artStyles.map(style => (
                          <span key={style} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">{style}</span>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No art styles selected</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                      <h3 className="font-medium text-gray-900 mb-2">Maximum Distance</h3>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-indigo-600">{preferences.maxDistance}</span>
                        <span className="ml-1 text-gray-500">km</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                      <h3 className="font-medium text-gray-900 mb-2">Time Availability</h3>
                      <p className="text-lg text-gray-800">{preferences.timeAvailability}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                    <h3 className="font-medium text-gray-900 mb-3">Accessibility Needs</h3>
                    <div className="flex flex-wrap gap-2">
                      {preferences.accessibilityNeeds.length > 0 ? (
                        preferences.accessibilityNeeds.map(need => (
                          <span key={need} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">{need}</span>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No accessibility needs specified</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                    <h3 className="font-medium text-gray-900 mb-3">Themes of Interest</h3>
                    <div className="flex flex-wrap gap-2">
                      {preferences.themes.length > 0 ? (
                        preferences.themes.map(theme => (
                          <span key={theme} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">{theme}</span>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No themes selected</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Achievements Tab Content */}
          {activeTab === 'achievements' && (
            <div>
              <h2 className="text-2xl font-semibold text-indigo-800 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                </svg>
                Your Achievements
              </h2>

              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {user.achievements?.points || 0}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-800">Total Points</h3>
                    <p className="text-gray-600">Keep exploring art to earn more!</p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2.5 rounded-full" style={{ width: `${Math.min(((user.achievements?.points || 0) / 1000) * 100, 100)}%` }}></div>
                </div>
                <p className="text-sm text-gray-500 text-right">{user.achievements?.points || 0}/1000 points to next level</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-500 mb-4 mx-auto">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-center mb-2">Tours Completed</h3>
                  <p className="text-3xl font-bold text-indigo-600 text-center">{user.achievements?.completedTours?.length || 0}</p>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 text-purple-500 mb-4 mx-auto">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-center mb-2">Artworks Viewed</h3>
                  <p className="text-3xl font-bold text-indigo-600 text-center">{user.achievements?.artworksVisited || 0}</p>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-green-500 mb-4 mx-auto">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-center mb-2">Badges Earned</h3>
                  <p className="text-3xl font-bold text-indigo-600 text-center">{user.achievements?.badges?.length || 0}</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-4">Badges Collection</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {/* Sample badges - in a real app, these would come from user data */}
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm">First Tour</h4>
                  <p className="text-xs text-gray-500">Completed your first tour</p>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm">Weekly Explorer</h4>
                  <p className="text-xs text-gray-500">Took tours 5 days in a row</p>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex flex-col items-center justify-center opacity-50">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm">Tour Creator</h4>
                  <p className="text-xs text-gray-500">Created your first tour</p>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex flex-col items-center justify-center opacity-50">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm">Art Connoisseur</h4>
                  <p className="text-xs text-gray-500">Liked 50+ artworks</p>
                </div>
              </div>
            </div>
          )}
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
    </main>
  );
}