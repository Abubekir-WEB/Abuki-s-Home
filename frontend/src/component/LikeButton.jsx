import { useState } from "react";
import axios from "axios";
import "./LikeButton.css";

const HEART_OUTLINE =
  "M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.221.06-2.299.84-2.867 1.95-.576 1.12-.681 2.62-.243 4.45.753 3.27 3.347 6.46 7.806 10.15 4.458-3.69 7.052-6.88 7.805-10.15.438-1.83.333-3.33-.243-4.45-.569-1.11-1.647-1.89-2.867-1.95zM12 19.41c-3.691-3.06-5.964-5.82-6.61-8.43-.43-1.69-.084-2.77.38-3.59.45-.8 1.27-1.3 2.32-1.33 1.02-.03 2.09.4 3.08 1.7l.83 1.13.83-1.13c.99-1.3 2.06-1.73 3.08-1.7 1.05.03 1.87.53 2.32 1.33.46.82.81 1.9.38 3.59-.65 2.61-2.92 5.37-6.61 8.43z";
const HEART_FILLED =
  "M20.884 13.19c-1.351 2.48-4.001 5.12-8.884 8.81-4.883-3.69-7.533-6.33-8.884-8.81-1.646-3.02-.407-6.6 2.02-8.04 1.42-.85 3.41-.85 4.94.38L12 7.1l1.94-1.57c1.53-1.23 3.52-1.23 4.94-.38 2.43 1.44 3.67 5.02 2.02 8.04z";

function formatCount(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${n}`;
}

function LikeButton({ postId, initialLikeCount = 0, initialIsLiked = false }) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to like posts.");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const url = `http://localhost:4000/user/posts/${postId}/like`;
      const headers = { Authorization: `Bearer ${token}` };
      if (isLiked) {
        await axios.delete(url, { headers });
        setIsLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await axios.post(url, {}, { headers });
        setIsLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch (error) {
      console.error("Like operation failed:", error);
      alert(error.response?.data?.message || "Unable to update like. Please try again.");
    } finally {
      setLoading(false);
    }
  };

 return (
  <button
    type="button"
    className={`x-like${isLiked ? " x-like--active" : ""}`}
    onClick={handleLike}
    disabled={loading}
    aria-pressed={isLiked}
    aria-label={isLiked ? "Unlike post" : "Like post"}
  >
    <span className="x-like__icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d={isLiked
            ? "M20.884 13.19c-1.351 2.48-4.001 5.12-8.884 8.81-4.883-3.69-7.533-6.33-8.884-8.81-1.646-3.02-.407-6.6 2.02-8.04 1.42-.85 3.41-.85 4.94.38L12 7.1l1.94-1.57c1.53-1.23 3.52-1.23 4.94-.38 2.43 1.44 3.67 5.02 2.02 8.04z"
            : "M16.697 3.5c-1.868 0-3.527.878-4.697 2.258C10.83 4.378 9.171 3.5 7.303 3.5 3.861 3.5 1.5 6.29 1.5 9.5c0 4.252 4.186 8.365 9.947 12.31l.553.38.553-.38C18.314 17.865 22.5 13.752 22.5 9.5c0-3.21-2.361-6-5.803-6zm-4.697 16.26C6.574 15.96 3.5 12.47 3.5 9.5c0-2.2 1.562-4 3.803-4 1.46 0 2.85.88 3.822 2.55L12 9.55l.875-1.5C13.847 6.38 15.237 5.5 16.697 5.5c2.241 0 3.803 1.8 3.803 4 0 2.97-3.074 6.46-8.5 10.26z"}
        />
      </svg>
    </span>
    <span className="x-like__count">{likeCount}</span>
  </button>
);

}

export default LikeButton;
