
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

import LikeButton from "./LikeButton";
import CommentButton from "./CommentButton";

import "./Posts.css";

const API_URL = "http://localhost:4000/user";
const SERVER_URL = "http://localhost:4000";

// Build the correct URL for uploaded images.
function getImageUrl(imagePath) {
  if (!imagePath) return null;

  const path = String(imagePath).trim();

  if (!path) return null;

  // Keep absolute URLs unchanged.
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Normalize Windows path separators.
  const normalizedPath = path.replace(/\\/g, "/");

  // Remove leading slashes.
  const cleanPath = normalizedPath.replace(/^\/+/, "");

  // If only the filename is stored, use /uploads/.
  const imagePathWithFolder = cleanPath.includes("/")
    ? cleanPath
    : `uploads/${cleanPath}`;

  // Encode each path segment without encoding directory separators.
  const encodedPath = imagePathWithFolder
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${SERVER_URL}/${encodedPath}`;
}

function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  // Fetch posts from the backend.
  const fetchPosts = useCallback(async () => {
    if (!token) {
      setPosts([]);
      setError("Please log in to view posts.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/getFile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Support either an array or an object containing posts.
      const fetchedPosts = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.posts)
          ? response.data.posts
          : null;

      if (!fetchedPosts) {
        throw new Error(
          "The server returned an unexpected posts format."
        );
      }

      setPosts(fetchedPosts);
    } catch (err) {
      console.error(
        "Failed to fetch posts:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Unable to load posts. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Navigation handlers.
  function chat() {
    navigate("/messaging");
  }

  function uploadFile() {
    navigate("/uploadfile");
  }

  function notification() {
    navigate("/notification");
  }

  return (
    <div className="posts-page">
      {/* Header */}
      <header className="posts-header">
        <h1>Abuki's Home</h1>
      </header>

      {/* Feed tabs */}
      <div className="posts-tabs">
        <div className="tab active">
          For you
        </div>

        <div className="tab">
          <Link to="/follow">Following</Link>
        </div>
      </div>

      {/* Posts feed */}
      <main className="posts-container">
        {loading ? (
          <div className="posts-empty">
            <p>Loading posts...</p>
          </div>
        ) : error ? (
          <div className="posts-empty">
            <p>{error}</p>

            <button
              type="button"
              onClick={fetchPosts}
            >
              Try again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="posts-empty">
            <h2>Welcome to your feed</h2>

            <p>
              When people share posts, you'll see them here.
            </p>
          </div>
        ) : (
          posts.map((item, index) => {
            const postId = item.postid ?? item.postId;

            const authorId = Number(
              item.userid ?? item.userId
            );

            const validAuthorId =
              Number.isInteger(authorId) &&
              authorId > 0;

            const authorName = [
              item.firstname || "User",
              item.lastname || "",
            ]
              .filter(Boolean)
              .join(" ")
              .trim();

            const profileImage = getImageUrl(
              item.profilePicture
            );

            const postImage = getImageUrl(
              item.postPicture
            );

            return (
              <article
                className="post-card"
                key={postId ?? `post-${index}`}
              >
                {/* Author avatar */}
                <Link
                  to={
                    validAuthorId
                      ? `/profile/${authorId}`
                      : "#"
                  }
                  className="post-author-link"
                  aria-label={`View ${authorName}'s profile`}
                >
                  <div className="post-avatar">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={`${authorName}'s profile`}
                        onError={(event) => {
                          console.error(
                            "Profile image failed:",
                            event.currentTarget.src
                          );

                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <span>
                        {item.firstname
                          ? item.firstname
                              .charAt(0)
                              .toUpperCase()
                          : "U"}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Post body */}
                <div className="post-body">
                  {/* Author information — no Follow button */}
                  <div className="post-card-header">
                    <div className="post-author-info">
                      <Link
                        to={
                          validAuthorId
                            ? `/profile/${authorId}`
                            : "#"
                        }
                        className="post-author-link"
                      >
                        <h3>{authorName}</h3>
                      </Link>

                      <span className="post-handle">
                        @user{authorId} · Post
                      </span>
                    </div>
                  </div>

                  {/* Post text */}
                  {item.postText && (
                    <div className="post-content">
                      {item.postText}
                    </div>
                  )}

                  {/* Post image */}
                  {postImage && (
                    <img
                      className="post-image"
                      src={postImage}
                      alt="Post attachment"
                      loading="lazy"
                      onError={(event) => {
                        console.error(
                          "Post image failed to load:",
                          event.currentTarget.src
                        );
                      }}
                    />
                  )}

                  {/* Like and comment actions */}
                  {postId != null && (
                    <div className="post-actions">
                      <CommentButton
                        postId={postId}
                      />

                      <LikeButton
                        postId={postId}
                        initialLikeCount={Number(
                          item.likeCount ?? 0
                        )}
                        initialIsLiked={
                          Number(item.isLiked) === 1 ||
                          item.isLiked === true
                        }
                      />
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="posts-navigation">
        <button
          type="button"
          onClick={chat}
          aria-label="Open chat"
        >
          <span
            className="nav-icon"
            aria-hidden="true"
          >
            ☏
          </span>

          <span>Chat</span>
        </button>

        <button
          type="button"
          className="create-post-button"
          onClick={uploadFile}
          aria-label="Create a post"
        >
          <span
            className="nav-icon"
            aria-hidden="true"
          >
            ＋
          </span>

          <span>Post</span>
        </button>

        <button
          type="button"
          onClick={notification}
          aria-label="Open notifications"
        >
          <span
            className="nav-icon"
            aria-hidden="true"
          >
            ♧
          </span>

          <span>Notifications</span>
        </button>
      </nav>
    </div>
  );
}

export default Posts;
