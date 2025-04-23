"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { jwtDecode, JwtPayload } from "jwt-decode";

export default function ArtworkPage() {
  const params = useParams();
  const artworkId = params?.artworkId as string;
  const [artwork, setArtwork] = useState(null);
  const [likes, setLikes] = useState(0);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]); // Updated to handle object comments

  //
  const [userId, setUserId] = useState<string | null>(null);

  // Define a custom interface for the decoded token
  interface CustomJwtPayload extends JwtPayload {
    userId: string;
  }

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
      const token = localStorage.getItem("authToken");
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
    <main className="max-w-4xl mx-auto px-6 py-16">
      <img
        src={artwork.artwork_url}
        alt={artwork.name}
        className="w-full max-h-[500px] object-cover rounded-xl shadow mb-6"
      />
      <h1 className="text-4xl font-bold text-indigo-800 mb-2">
        {artwork.name}
      </h1>

      {artwork.artists?.length > 0 && (
        <p className="text-sm text-gray-500 italic mb-2">
          By: {artwork.artists.join(", ")}
        </p>
      )}

      <p className="text-gray-600 mb-4">
        {artwork.description?.replace(/<\/?[^>]+(>|$)/g, "") ||
          "No description provided."}
      </p>

      <div className="mb-6 text-sm text-gray-500">
        <p>
          <strong>City:</strong> {artwork.location?.city}
        </p>
        <p>
          <strong>Address:</strong> {artwork.location?.address}
        </p>
        <p>
          <strong>Country:</strong> {artwork.location?.country}
        </p>
        {artwork.themes?.length > 0 && (
          <p>
            <strong>Themes:</strong> {artwork.themes.join(", ")}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-8">
        <button
          onClick={handleLike}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
        >
          ❤️ Like ({likes})
        </button>

        <button
          onClick={handleShare}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
        >
          🔗 Share
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border max-w-2xl">
        <h2 className="text-xl font-semibold text-indigo-800 mb-4">Comments</h2>

        <div className="space-y-2 mb-4">
          {comments.length > 0 ? (
            comments.map((comment, idx) => (
              <div key={idx} className="text-gray-700 border-b pb-2">
                <p>
                  <strong>User:</strong> {comment.user_id}
                </p>
                <p>
                  <strong>Comment:</strong> {comment.comment_text}
                </p>
                <p>
                  <strong>Posted on:</strong>{" "}
                  {new Date(comment.timestamp).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No comments yet.</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Leave a comment..."
            className="flex-1 border border-gray-300 rounded px-3 py-2"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            onClick={handleComment}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
          >
            Post
          </button>
        </div>
      </div>
    </main>
  );
}
