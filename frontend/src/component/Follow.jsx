
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import LikeButton from "./LikeButton";
import CommentButton from "./CommentButton";

import "./Follow.css";

const API_URL = "http://localhost:4000/user";
const SERVER_URL = "http://localhost:4000";

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
        .map((segment) => encodeURIComponent(segment))
        .join("/");

    return `${SERVER_URL}/${encodedPath}`;
}

function Follow() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchFollowingPosts = useCallback(async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            setError("Please log in to view your Following feed.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/following-feed`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = response.data;

            const fetchedPosts = Array.isArray(data)
                ? data
                : Array.isArray(data?.posts)
                    ? data.posts
                    : null;

            if (!fetchedPosts) {
                throw new Error(
                    "The server returned an invalid posts format."
                );
            }

            setPosts(fetchedPosts);
        } catch (err) {
            console.error(
                "Failed to fetch Following feed:",
                err.response?.data ?? err.message
            );

            setError(
                err.response?.data?.message ??
                "Failed to load your Following feed."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFollowingPosts();
    }, [fetchFollowingPosts]);

    return (
        <div className="following-page">
            {/* Header */}
            <header className="following-header">
                <h1>Home</h1>
            </header>

            {/* X-style feed tabs */}
            <div className="following-tabs">
                <Link to="/" className="following-tab">
                    For you
                </Link>

                <div className="following-tab active">
                    Following
                </div>
            </div>

            {/* Feed */}
            <main className="following-feed">
                {loading ? (
                    <div className="following-message">
                        Loading posts from people you follow...
                    </div>
                ) : error ? (
                    <div className="following-message">
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={fetchFollowingPosts}
                        >
                            Try again
                        </button>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="following-empty">
                        <h2>Your Following feed is empty</h2>

                        <p>
                            Posts from people you follow will appear here.
                            Follow some people to get started!
                        </p>
                    </div>
                ) : (
                    posts.map((post, index) => {
                        const postId = post.postid ?? post.postId;

                        const authorId = Number(
                            post.userid ?? post.userId
                        );

                        const validAuthorId =
                            Number.isInteger(authorId) &&
                            authorId > 0;

                        const authorName = [
                            post.firstname || "User",
                            post.lastname || "",
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .trim();

                        const profileImage = getImageUrl(
                            post.profilePicture
                        );

                        const postImage = getImageUrl(
                            post.postPicture
                        );

                        return (
                            <article
                                className="following-post"
                                key={postId ?? `post-${index}`}
                            >
                                {/* Author avatar */}
                                <Link
                                    to={
                                        validAuthorId
                                            ? `/profile/${authorId}`
                                            : "#"
                                    }
                                    className="following-avatar-link"
                                    aria-label={`View ${authorName}'s profile`}
                                >
                                    {profileImage ? (
                                        <img
                                            className="following-avatar"
                                            src={profileImage}
                                            alt={`${authorName}'s profile`}
                                            onError={(event) => {
                                                event.currentTarget.style.display =
                                                    "none";
                                            }}
                                        />
                                    ) : (
                                        <div className="following-avatar-placeholder">
                                            {(post.firstname || "U")
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                    )}
                                </Link>

                                {/* Post content */}
                                <div className="following-post-content">
                                    <div className="following-author">
                                        <Link
                                            to={
                                                validAuthorId
                                                    ? `/profile/${authorId}`
                                                    : "#"
                                            }
                                            className="following-author-name"
                                        >
                                            {authorName}
                                        </Link>

                                        <span className="following-handle">
                                            @user{authorId}
                                        </span>
                                    </div>

                                    {post.postText && (
                                        <p className="following-post-text">
                                            {post.postText}
                                        </p>
                                    )}

                                    {postImage && (
                                        <img
                                            className="following-post-image"
                                            src={postImage}
                                            alt="Post attachment"
                                            loading="lazy"
                                            onError={(event) => {
                                                console.error(
                                                    "Post image failed:",
                                                    event.currentTarget.src
                                                );
                                            }}
                                        />
                                    )}

                                    {/* Post actions */}
                                    {postId != null && (
                                        <div className="following-post-actions">
                                            <CommentButton
                                                postId={postId}
                                            />

                                            <LikeButton
                                                postId={postId}
                                                initialLikeCount={Number(
                                                    post.likeCount ?? 0
                                                )}
                                                initialIsLiked={
                                                    Number(post.isLiked) === 1 ||
                                                    post.isLiked === true
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
        </div>
    );
}

export default Follow;
