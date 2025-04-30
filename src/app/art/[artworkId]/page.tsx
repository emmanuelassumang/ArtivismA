"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { jwtDecode, JwtPayload } from "jwt-decode";

export default function ArtworkPage() {
  const params = useParams();
  const artworkId = params?.artworkId as string;
  const [artwork, setArtwork] = useState(null);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]); 
  const [userId, setUserId] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, any>>({});

  // Define a custom interface for the decoded token
  interface CustomJwtPayload extends JwtPayload {
    userId: string;
  }

  // Fetch user profiles for comments
  const fetchUserProfiles = async (comments: any[]) => {
    if (!comments || comments.length === 0) return;

    // Extract unique user IDs from comments
    const userIds = [...new Set(comments.map(comment => comment.user_id))];
    
    if (userIds.length === 0) return;

    try {
      const res = await fetch('/api/users/many', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserMap(data.users || {});
      }
    } catch (error) {
      console.error('Error fetching user profiles:', error);
    }
  };

  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decodedToken = jwtDecode<CustomJwtPayload>(token);
          setUserId(decodedToken.userId); // Store userId from token
        } catch (error) {
          console.error("Error decoding token:", error);
        }
      }
    }

    fetchUser(); // First get logged-in user info
  }, []);

  // Effect to fetch artwork after userId is set
  useEffect(() => {
    async function fetchArtwork() {
      try {
        const res = await fetch(`/api/art/${artworkId}`);
        const data = await res.json();
        
        if (data.artwork) {
          setArtwork(data.artwork);
          setLikes(data.artwork?.likes?.length || 0);
          setComments(data.artwork?.comments || []);
          
          // Check if user has liked this artwork
          if (userId && data.artwork?.likes?.includes(userId)) {
            setHasLiked(true);
          } else {
            setHasLiked(false);
          }
          
          // Fetch user profiles for comments
          if (data.artwork?.comments?.length > 0) {
            fetchUserProfiles(data.artwork.comments);
          }
        }
      } catch (err) {
        console.error("Failed to load artwork:", err);
      }
    }

    if (artworkId) {
      fetchArtwork();
    }
  }, [artworkId, userId]);

  const handleLikeToggle = async () => {
    if (!userId) return alert("You need to be logged in to like this artwork.");

    // Determine action based on current like status
    const action = hasLiked ? 'unlike' : 'like';
    
    // Optimistic UI update
    if (action === 'like') {
      setLikes((prev) => prev + 1);
      setHasLiked(true);
    } else {
      setLikes((prev) => Math.max(0, prev - 1));
      setHasLiked(false);
    }

    try {
      const res = await fetch(`/api/art/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkId, userId, action }),
      });
      
      if (!res.ok) {
        // Revert optimistic update on error
        if (action === 'like') {
          setLikes((prev) => prev - 1);
          setHasLiked(false);
        } else {
          setLikes((prev) => prev + 1);
          setHasLiked(true);
        }
        
        const errorData = await res.json();
        console.error(`Failed to ${action} artwork:`, errorData);
      }
    } catch (error) {
      // Revert optimistic update on error
      if (action === 'like') {
        setLikes((prev) => prev - 1);
        setHasLiked(false);
      } else {
        setLikes((prev) => prev + 1);
        setHasLiked(true);
      }
      console.error(`Error ${action}ing artwork:`, error);
    }
  };

  const handleComment = async () => {
    if (!userId) return alert("You need to be logged in to comment.");
    if (!comment.trim()) return;

    const newComment = comment.trim();
    const newCommentObj = { 
      user_id: userId, 
      comment_text: newComment, 
      timestamp: new Date(),
      comment_id: Date.now().toString() // Temporary ID for optimistic rendering
    };
    
    // Optimistic UI update
    setComments((prev) => [...prev, newCommentObj]);
    setComment("");

    try {
      const res = await fetch(`/api/art/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artwork_id: artworkId,
          user_id: userId,
          comment_text: newComment,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Update the comment with the real ID from the server
        if (data.comment) {
          setComments(prev => 
            prev.map(c => 
              c.comment_id === newCommentObj.comment_id ? data.comment : c
            )
          );
        }
        
        // If this is the first comment by this user, add them to the userMap
        if (!userMap[userId]) {
          fetchUserProfiles([newCommentObj]);
        }
      } else {
        console.error("Failed to post comment");
        // Revert the optimistic update
        setComments(prev => prev.filter(c => c.comment_id !== newCommentObj.comment_id));
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      // Revert the optimistic update
      setComments(prev => prev.filter(c => c.comment_id !== newCommentObj.comment_id));
    }
  };

  const handleShare = () => {
    const shareURL = window.location.href;
    navigator.clipboard.writeText(shareURL);
    alert("Link copied to clipboard!");
  };

  const getUserDisplayName = (userId: string) => {
    if (!userId) return 'Anonymous';
    if (!userMap[userId]) return 'User';
    
    return userMap[userId].username || userMap[userId].name || 'Anonymous User';
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
            <div className="bg-white p-6 rounded-md shadow mb-6">
              <h2 className="text-xl font-bold mb-4">About This Artwork</h2>
              <p className="mb-6 text-gray-700">
                {artwork.description?.replace(/<\/?[^>]+(>|$)/g, "") ||
                  "No description provided."}
              </p>
              
              {artwork.themes?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {artwork.themes.map(theme => (
                    <span key={theme} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                      {theme}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-md shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Comments</h2>
                <span className="text-sm text-gray-500">{comments.length || 0} comments</span>
              </div>

              <div className="flex mb-6">
                <input
                  type="text"
                  placeholder="Leave a comment..."
                  className="flex-1 border border-gray-300 rounded-l px-3 py-2"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleComment();
                    }
                  }}
                />
                <button
                  onClick={handleComment}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r"
                >
                  Post
                </button>
              </div>

              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg border-l-4 border-indigo-500">
                      <div className="flex items-center mb-2">
                        <div className="bg-indigo-600 h-8 w-8 rounded-full flex items-center justify-center text-white font-medium mr-2">
                          {getUserDisplayName(comment.user_id).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-700">{getUserDisplayName(comment.user_id)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(comment.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="ml-10 text-gray-700">{comment.comment_text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-gray-500 italic">No comments yet. Be the first to comment!</p>
                )}
              </div>
            </div>
          </div>
            
          <div className="md:w-1/3">
            <div className="bg-white p-6 rounded-md shadow mb-6 sticky top-24">
              <h3 className="font-bold mb-4">Location</h3>
              <div className="mb-4">
                <p className="flex items-center gap-2 mb-1 text-gray-700">
                  <span className="text-gray-500">City:</span> 
                  <span className="font-medium">{artwork.location?.city || "Unknown"}</span>
                </p>
                <p className="flex items-center gap-2 mb-1 text-gray-700">
                  <span className="text-gray-500">Address:</span> 
                  <span className="font-medium">{artwork.location?.address || "Not specified"}</span>
                </p>
                <p className="flex items-center gap-2 mb-1 text-gray-700">
                  <span className="text-gray-500">Country:</span> 
                  <span className="font-medium">{artwork.location?.country || "Unknown"}</span>
                </p>
              </div>
              
              {artwork.accessibility && (
                <div className="mt-6 mb-4">
                  <h3 className="font-bold mb-3">Accessibility Features</h3>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-gray-700">
                      <span className={artwork.accessibility?.wheelchair_accessible ? "text-green-500" : "text-gray-400"}>
                        {artwork.accessibility?.wheelchair_accessible ? "✓" : "✗"}
                      </span>
                      <span>Wheelchair Accessible</span>
                    </p>
                    <p className="flex items-center gap-2 text-gray-700">
                      <span className={artwork.accessibility?.audio_descriptions ? "text-green-500" : "text-gray-400"}>
                        {artwork.accessibility?.audio_descriptions ? "✓" : "✗"}
                      </span>
                      <span>Audio Descriptions</span>
                    </p>
                    <p className="flex items-center gap-2 text-gray-700">
                      <span className={artwork.accessibility?.low_mobility_friendly ? "text-green-500" : "text-gray-400"}>
                        {artwork.accessibility?.low_mobility_friendly ? "✓" : "✗"}
                      </span>
                      <span>Low Mobility Friendly</span>
                    </p>
                    <p className="flex items-center gap-2 text-gray-700">
                      <span className={artwork.accessibility?.child_friendly ? "text-green-500" : "text-gray-400"}>
                        {artwork.accessibility?.child_friendly ? "✓" : "✗"}
                      </span>
                      <span>Child Friendly</span>
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-2 mt-6">
                <button
                  onClick={handleLikeToggle}
                  className={`${
                    hasLiked 
                      ? "bg-pink-600 hover:bg-pink-700" 
                      : "bg-indigo-600 hover:bg-indigo-700"
                  } text-white px-4 py-2 rounded-md flex items-center justify-center gap-2`}
                >
                  <span>{hasLiked ? "❤️" : "🤍"}</span> {hasLiked ? "Liked" : "Like"} ({likes})
                </button>

                <button
                  onClick={handleShare}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center justify-center gap-2"
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