"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface CustomJwtPayload {
  userId: string;
  exp?: number;
  iat?: number;
}

interface Comment {
  user_id: string;
  comment_text: string;
  timestamp: Date;
}

interface Artwork {
  _id: string;
  name: string;
  description?: string;
  artwork_url?: string;
  artists?: string[];
  themes?: string[];
  location?: {
    city?: string;
    address?: string;
    country?: string;
  };
  likes?: string[];
  comments?: Comment[];
  accessibility?: {
    wheelchair_accessible?: boolean;
    audio_descriptions?: boolean;
    low_mobility_friendly?: boolean;
    child_friendly?: boolean;
  };
}

export default function ArtworkPage() {
  const params = useParams();
  const artworkId = params?.artworkId as string;
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [likes, setLikes] = useState(0);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArtwork() {
      try {
        const res = await fetch(`/api/art/${artworkId}`);
        const data = await res.json();
        setArtwork(data.artwork);
        setLikes(data.artwork?.likes?.length || 0);
        setComments(data.artwork?.comments || []);
      } catch (err) {
        console.error("Failed to load artwork:", err);
      }
    }

    async function fetchUser() {
      const token = localStorage.getItem("token");
      console.log(token);
      if (token) {
        const decodedToken = jwtDecode<CustomJwtPayload>(token);
        setUserId(decodedToken.userId); // Store userId from token
        console.log(userId);
      }
    }

    fetchArtwork();
    fetchUser(); // Get logged-in user info

    // if (artworkId) fetchArtwork();
  }, [artworkId]);

  const handleLike = async () => {
    if (!userId) return alert("You need to be logged in to like this artwork.");

    try {
      const res = await fetch(`/api/art/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkId, userId }), // Send the userId with the like request
      });
      if (res.ok) {
        setLikes((prev) => prev + 1);
      } else {
        console.error("Failed to like artwork");
      }
    } catch (error) {
      console.error("Error liking artwork:", error);
    }
  };

  const handleComment = async () => {
    if (!userId) return alert("You need to be logged in to comment.");
    if (!comment.trim()) return;

    const newComment = comment.trim();
    setComments((prev) => [
      ...prev,
      { user_id: userId, comment_text: newComment, timestamp: new Date() },
    ]); // Add structured comment
    setComment("");

    try {
      const res = await fetch(`/api/art/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artwork_id: artworkId,
          user_id: userId,
          comment_text: newComment,
        }), // Send the userId with the like request
      });
      if (!res.ok) {
        console.error("Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const handleShare = () => {
    const shareURL = window.location.href;
    navigator.clipboard.writeText(shareURL);
    alert("Link copied to clipboard!");
  };

  if (!artwork)
    return <div className="p-10 text-center">Loading artwork...</div>;

  return (
    <main className="pt-20 pb-16">
      <div className="relative w-full h-[50vh] mb-8 overflow-hidden bg-black">
        <img
          src={artwork.artwork_url}
          alt={artwork.name}
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">
              {artwork.name}
            </h1>
            {artwork.artists?.length > 0 && (
              <p className="text-sm text-gray-200 mb-2">
                By: {artwork.artists.join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-2/3">
            <div className="bg-card-bg p-6 rounded-md mb-6">
              <h2 className="text-xl font-bold mb-4">About This Artwork</h2>
              <p className="mb-6">
                {artwork.description?.replace(/<\/?[^>]+(>|$)/g, "") ||
                  "No description provided."}
              </p>
              
              {artwork.themes?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {artwork.themes.map(theme => (
                    <span key={theme} className="filter-chip bg-input-bg">
                      {theme}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card-bg p-6 rounded-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Comments</h2>
                <span className="text-sm">{comments.length || 0} comments</span>
              </div>

              <div className="flex mb-6">
                <input
                  type="text"
                  placeholder="Leave a comment..."
                  className="flex-1 input-dark"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button
                  onClick={handleComment}
                  className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                >
                  Post
                </button>
              </div>

              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment, idx) => (
                    <div key={idx} className="border-b border-gray-700 pb-4">
                      <div className="flex items-center mb-2">
                        <div className="bg-indigo-600 h-8 w-8 rounded-full flex items-center justify-center text-white font-medium mr-2">
                          {comment.user_id.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold">{comment.user_id}</p>
                          <p className="text-xs opacity-70">
                            {new Date(comment.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="ml-10">{comment.comment_text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 opacity-70">No comments yet. Be the first to comment!</p>
                )}
              </div>
            </div>
          </div>
            
          <div className="md:w-1/3">
            <div className="bg-card-bg p-6 rounded-md mb-6 sticky top-24">
              <h3 className="font-bold mb-4">Location</h3>
              <div className="mb-4">
                <p className="flex items-center gap-2 mb-1">
                  <span className="opacity-70">City:</span> 
                  <span className="font-medium">{artwork.location?.city || "Unknown"}</span>
                </p>
                <p className="flex items-center gap-2 mb-1">
                  <span className="opacity-70">Address:</span> 
                  <span className="font-medium">{artwork.location?.address || "Not specified"}</span>
                </p>
                <p className="flex items-center gap-2 mb-1">
                  <span className="opacity-70">Country:</span> 
                  <span className="font-medium">{artwork.location?.country || "Unknown"}</span>
                </p>
              </div>
              
              <div className="mt-6 mb-4">
                <h3 className="font-bold mb-3">Accessibility Features</h3>
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <span className={artwork.accessibility?.wheelchair_accessible ? "text-green-500" : "text-gray-500"}>
                      {artwork.accessibility?.wheelchair_accessible ? "✓" : "✗"}
                    </span>
                    <span>Wheelchair Accessible</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className={artwork.accessibility?.audio_descriptions ? "text-green-500" : "text-gray-500"}>
                      {artwork.accessibility?.audio_descriptions ? "✓" : "✗"}
                    </span>
                    <span>Audio Descriptions</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className={artwork.accessibility?.low_mobility_friendly ? "text-green-500" : "text-gray-500"}>
                      {artwork.accessibility?.low_mobility_friendly ? "✓" : "✗"}
                    </span>
                    <span>Low Mobility Friendly</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className={artwork.accessibility?.child_friendly ? "text-green-500" : "text-gray-500"}>
                      {artwork.accessibility?.child_friendly ? "✓" : "✗"}
                    </span>
                    <span>Child Friendly</span>
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 mt-6">
                <button
                  onClick={handleLike}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
                >
                  <span>❤️</span> Like ({likes})
                </button>

                <button
                  onClick={handleShare}
                  className="bg-input-bg hover:bg-card-hover px-4 py-2 rounded-md flex items-center justify-center gap-2"
                >
                  <span>🔗</span> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
