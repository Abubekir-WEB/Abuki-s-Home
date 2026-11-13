
import {
  Fragment,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";

import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import Notifications from "./Notifications";
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

  // Add uploads folder if only filename is stored.
  const imagePathWithFolder = cleanPath.includes("/")
    ? cleanPath
    : `uploads/${cleanPath}`;

  // Encode path segments.
  const encodedPath = imagePathWithFolder
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${SERVER_URL}/${encodedPath}`;
}

// Get logged-in user's ID from JWT.
function getCurrentUserId(token) {
  try {
    if (!token) return null;

    const decoded = jwtDecode(token);

    return (
      decoded.id ??
      decoded.userid ??
      decoded.userId ??
      decoded._id ??
      null
    );
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}

// Records a view when at least 50% of a post is visible.
function PostViewTracker({ postId, token, onViewRecorded }) {
  const postRef = useRef(null);
  const hasRecordedView = useRef(false);

  useEffect(() => {
    if (!postId || !token || !postRef.current) return;

    if (hasRecordedView.current) return;

    const element = postRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (
          entry.isIntersecting &&
          entry.intersectionRatio >= 0.5 &&
          !hasRecordedView.current
        ) {
          hasRecordedView.current = true;

          axios
            .post(
              `${API_URL}/posts/${postId}/view`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )
            .then((response) => {
              const count = Number(response.data?.viewCount);

              if (Number.isFinite(count)) {
                onViewRecorded(postId, count);
              }
            })
            .catch((error) => {
              // Allow another attempt if the request failed.
              hasRecordedView.current = false;

              console.error(
                `Failed to record view for post ${postId}:`,
                error.response?.data || error.message
              );
            });
        }
      },
      {
        threshold: 0.5,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [postId, token, onViewRecorded]);

  return <div ref={postRef} className="post-view-tracker" />;
}

// News card component.
function NewsCard({ article }) {
  if (!article) return null;

  return (
    <article className="news-card">

      <div className="news-card-label">
        <span>📰</span> News

        {article.source?.name && (
          <span> · {article.source.name}</span>
        )}
      </div>

      {article.image && (
        <img
          src={article.image}
          alt={article.title || "News"}
          className="news-image"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}

      <div className="news-content">

        <h3>{article.title}</h3>

        {article.description && (
          <p>{article.description}</p>
        )}

        {article.publishedAt && (
          <small>
            {new Date(article.publishedAt).toLocaleString()}
          </small>
        )}

        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read full story →
          </a>
        )}

      </div>
    </article>
  );
}

function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // News state.
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);

  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const currentUserId = getCurrentUserId(token);

  // Fetch posts from backend.
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

      const response = await axios.get(`${API_URL}/getFile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const fetchedPosts = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.posts)
          ? response.data.posts
          : null;

      if (!fetchedPosts) {
        throw new Error("The server returned an unexpected posts format.");
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

  // Fetch news from backend.
  const fetchNews = useCallback(async () => {
    try {
      setNewsLoading(true);

      const response = await axios.get(`${API_URL}/news`);

      if (response.data?.success) {
        setNews(
          Array.isArray(response.data.articles)
            ? response.data.articles
            : []
        );
      }

    } catch (err) {
      console.error(
        "Failed to fetch news:",
        err.response?.data || err.message
      );

      setNews([]);

    } finally {
      setNewsLoading(false);
    }
  }, []);

  // Load posts.
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Load news.
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Update view count after backend records a view.
  const handleViewRecorded = useCallback((postId, viewCount) => {
    setPosts((previousPosts) =>
      previousPosts.map((post) => {
        const currentPostId = post.postid ?? post.postId;

        return Number(currentPostId) === Number(postId)
          ? { ...post, viewCount }
          : post;
      })
    );
  }, []);

  // Navigation handlers.
  function chat() {
    navigate("/messaging");
  }

  function uploadFile() {
    navigate("/uploadfile");
  }

  function openProfile() {
    if (!currentUserId) {
      navigate("/login");
      return;
    }

    navigate(`/profile/${currentUserId}`);
  }

  // Render posts and insert news after every five posts.
  function renderPosts() {
    const feedItems = [];

    posts.forEach((item, index) => {
      const postId = item.postid ?? item.postId;

      const authorId = Number(
        item.userid ?? item.userId
      );

      const validAuthorId =
        Number.isInteger(authorId) && authorId > 0;

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

      feedItems.push(
        <Fragment key={postId ?? `post-${index}`}>

          <article className="post-card">

            {/* Detect when this post becomes visible */}
            {postId != null && (
              <PostViewTracker
                postId={postId}
                token={token}
                onViewRecorded={handleViewRecorded}
              />
            )}

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
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span>
                    {item.firstname
                      ? item.firstname.charAt(0).toUpperCase()
                      : "U"}
                  </span>
                )}

              </div>
            </Link>

            {/* Post body */}
            <div className="post-body">

              {/* Author information */}
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

              {/* Like, comment and view actions */}
              {postId != null && (
                <div className="post-actions">

                  <CommentButton postId={postId} />

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

                  {/* View count */}
                  <div
                    className="post-view-count"
                    title="Total unique views"
                    aria-label={`${Number(
                      item.viewCount ?? 0
                    )} views`}
                  >
                    <span aria-hidden="true">👁</span>

                    <span>
                      {Number(item.viewCount ?? 0)} Views
                    </span>
                  </div>

                </div>
              )}

            </div>
          </article>

        </Fragment>
      );

      // Insert a news card after every five posts.
      if ((index + 1) % 5 === 0) {
        const newsIndex = Math.floor(index / 5);

        if (news[newsIndex]) {
          feedItems.push(
            <NewsCard
              key={`news-${newsIndex}`}
              article={news[newsIndex]}
            />
          );
        }
      }
    });

    return feedItems;
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

            <button type="button" onClick={fetchPosts}>
              Try again
            </button>
          </div>

        ) : posts.length === 0 ? (

          <div className="posts-empty">
            <h2>Welcome to your feed</h2>

            <p>
              When people share posts, you'll see them here.
            </p>

            {newsLoading ? (
              <p>Loading news...</p>
            ) : (
              news.map((article, index) => (
                <NewsCard
                  key={`news-${index}`}
                  article={article}
                />
              ))
            )}

          </div>

        ) : (

          <>
            {renderPosts()}

            {newsLoading && (
              <div className="posts-empty">
                <p>Loading news...</p>
              </div>
            )}
          </>

        )}

      </main>

      {/* Bottom navigation */}
      <nav className="posts-navigation">

        {/* Chat */}
        <button
          type="button"
          onClick={chat}
          aria-label="Open chat"
        >
          <span className="nav-icon" aria-hidden="true">
            ☏
          </span>

          <span>Chat</span>
        </button>

        {/* Create post */}
        <button
          type="button"
          className="create-post-button"
          onClick={uploadFile}
          aria-label="Create a post"
        >
          <span className="nav-icon" aria-hidden="true">
            ＋
          </span>

          <span>Post</span>
        </button>

        {/* Notifications */}
        <div className="nav-notification">
          <Notifications />
        </div>

        {/* My Profile */}
        <button
          type="button"
          onClick={openProfile}
          aria-label="Open your profile"
        >
          <span className="nav-icon" aria-hidden="true">
            👤
          </span>

          <span>Profile</span>
        </button>

      </nav>

    </div>
  );
}

export default Posts;
