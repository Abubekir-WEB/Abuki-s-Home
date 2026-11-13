
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

import LikeButton from "./LikeButton";
import CommentButton from "./CommentButton";

import "./Posts.css";
import "./TrendingDetail.css";

const API_URL = "http://localhost:4000/user";
const SERVER_URL = "http://localhost:4000";

// Handle uploaded image paths.
function getImageUrl(imagePath) {
    if (!imagePath) return null;
    
    const path = String(imagePath).trim();

    if (!path) return null;

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    const normalizedPath = path.replace(/\\/g, "/");
    const cleanPath = normalizedPath.replace(/^\/+/, "");

    const imagePathWithFolder = cleanPath.includes("/")
        ? cleanPath
        : `uploads/${cleanPath}`;

    const encodedPath = imagePathWithFolder
        .split("/")
        .map(segment => encodeURIComponent(segment))
        .join("/");

    return `${SERVER_URL}/${encodedPath}`;
}

// Record a view when a post becomes visible.
function TrendingPostView({ postId, token, onViewRecorded }) {
    const postRef = useRef(null);
    const recorded = useRef(false);

    useEffect(() => {
        if (!postId || !token || !postRef.current || recorded.current) {
            return;
        }

        const observer = new IntersectionObserver(
            entries => {
                const entry = entries[0];

                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    recorded.current = true;

                    axios.post(
                        `${API_URL}/posts/${postId}/view`,
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    )
                    .then(response => {
                        const count = Number(response.data?.viewCount);

                        if (Number.isFinite(count)) {
                            onViewRecorded(postId, count);
                        }
                    })
                    .catch(error => {
                        recorded.current = false;

                        console.error(
                            "Failed to record view:",
                            error.response?.data || error.message
                        );
                    });
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(postRef.current);

        return () => observer.disconnect();
    }, [postId, token, onViewRecorded]);

    return <div ref={postRef} className="post-view-tracker" />;
}

function TrendingDetails() {
    const { hashtag } = useParams();
    const navigate = useNavigate();

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    const fetchTrendingPosts = useCallback(async () => {
        if (!token) {
            setError("Please log in to view trending posts.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/trending/${encodeURIComponent(hashtag)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data?.success) {
                setPosts(
                    Array.isArray(response.data.posts)
                        ? response.data.posts
                        : []
                );
            } else {
                setPosts([]);
            }

        } catch (err) {
            console.error(
                "Failed to load trending posts:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                "Unable to load trending posts."
            );

        } finally {
            setLoading(false);
        }
    }, [hashtag, token]);

    useEffect(() => {
        fetchTrendingPosts();
    }, [fetchTrendingPosts]);

    // Update view count without fetching the entire page again.
    const handleViewRecorded = useCallback((postId, viewCount) => {
        setPosts(previousPosts =>
            previousPosts.map(post =>
                Number(post.postid) === Number(postId)
                    ? { ...post, viewCount }
                    : post
            )
        );
    }, []);

    return (
        <div className="trending-details-page">

            <header className="trending-details-header">
                <button
                    type="button"
                    className="trending-back-button"
                    onClick={() => navigate(-1)}
                >
                    ←
                </button>

                <div>
                    <h1>{`#${hashtag}`}</h1>
                    <p>Trending topic</p>
                </div>
            </header>

            <section className="trending-details-info">
                <span className="trending-details-label">
                    What's happening
                </span>

                <h2>{`Posts about #${hashtag}`}</h2>

                <p>
                    Discover conversations and posts using this hashtag.
                </p>
            </section>

            <main className="trending-details-feed">

                {loading ? (

                    <div className="trending-details-message">
                        Loading posts...
                    </div>

                ) : error ? (

                    <div className="trending-details-message">
                        <p>{error}</p>

                        <button onClick={fetchTrendingPosts}>
                            Try again
                        </button>
                    </div>

                ) : posts.length === 0 ? (

                    <div className="trending-details-message">
                        <h3>No posts found</h3>
                        <p>
                            There are currently no posts using #{hashtag}.
                        </p>
                    </div>

                ) : (

                    posts.map((item, index) => {
                        const postId = item.postid ?? item.postId;

                        const authorId = Number(item.userid);

                        const authorName = [
                            item.firstname || "User",
                            item.lastname || ""
                        ].filter(Boolean).join(" ").trim();

                        const profileImage = getImageUrl(
                            item.profilePicture
                        );

                        const postImage = getImageUrl(
                            item.postPicture
                        );

                        return (
                            <article
                                className="post-card"
                                key={postId ?? index}
                            >
                                {postId != null && (
                                    <TrendingPostView
                                        postId={postId}
                                        token={token}
                                        onViewRecorded={handleViewRecorded}
                                    />
                                )}

                                <Link
                                    to={`/profile/${authorId}`}
                                    className="post-author-link"
                                    aria-label={`View ${authorName}'s profile`}
                                >
                                    <div className="post-avatar">
                                        {profileImage ? (
                                            <img
                                                src={profileImage}
                                                alt={`${authorName}'s profile`}
                                                onError={event => {
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

                                <div className="post-body">

                                    <div className="post-card-header">
                                        <div className="post-author-info">
                                            <Link
                                                to={`/profile/${authorId}`}
                                                className="post-author-link"
                                            >
                                                <h3>{authorName}</h3>
                                            </Link>

                                            <span className="post-handle">
                                                @user{authorId} · Post
                                            </span>
                                        </div>
                                    </div>

                                    {item.postText && (
                                        <div className="post-content">
                                            {item.postText}
                                        </div>
                                    )}

                                    {postImage && (
                                        <img
                                            className="post-image"
                                            src={postImage}
                                            alt="Post attachment"
                                            loading="lazy"
                                            onError={event => {
                                                event.currentTarget.style.display = "none";
                                            }}
                                        />
                                    )}

                                    {postId != null && (
                                        <div className="post-actions">

                                            <CommentButton postId={postId} />

                                            <LikeButton
                                                postId={postId}
                                                initialLikeCount={Number(item.likeCount ?? 0)}
                                                initialIsLiked={
                                                    Number(item.isLiked) === 1 ||
                                                    item.isLiked === true
                                                }
                                            />

                                            <div
                                                className="post-view-count"
                                                title="Total unique views"
                                            >
                                                <span>👁</span>
                                                <span>
                                                    {Number(item.viewCount ?? 0)} Views
                                                </span>
                                            </div>

                                        </div>
                                    )}

                                </div>
                            </article>
                        );
                    })
                )}

            </main>
        </div>
    );
}

export default TrendingDetails;
