
import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./WhoToFollow.css";

const API_URL = "http://localhost:4000/user";
const SERVER_URL = "http://localhost:4000";

function getProfileImage(image) {
    if (!image) return null;

    if (image.startsWith("http")) return image;

    const normalized = image.replace(/\\/g, "/");

    if (normalized.startsWith("/")) {
        return `${SERVER_URL}${normalized}`;
    }

    return `${SERVER_URL}/uploads/${normalized}`;
}

function WhoToFollow() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState([]);
    const [error, setError] = useState("");

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${API_URL}/recommendations`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setUsers(response.data.recommendations || []);
            } else {
                setError("Couldn't load suggestions.");
            }

        } catch (err) {
            console.error("Recommendation error:", err.response?.data || err.message);

            setError(
                err.response?.data?.message ||
                "Couldn't load suggestions."
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, []);

    // Follow a user
    const handleFollow = async (userId) => {
        if (following.includes(userId)) return;

        try {
            const token = localStorage.getItem("token");

            setFollowing(prev => [...prev, userId]);

            const response = await axios.post(
                `${API_URL}/follow`,
                {
                    userid: userId
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                // Remove user after successful follow
                setUsers(prev =>
                    prev.filter(user => user.userid !== userId)
                );
            }

        } catch (err) {
            console.error("Follow error:", err.response?.data || err.message);

            setError(
                err.response?.data?.message ||
                "Couldn't follow this user. Please try again."
            );

        } finally {
            setFollowing(prev =>
                prev.filter(id => id !== userId)
            );
        }
    };

    return (
        <div className="who-follow-card">

            <h3 className="who-follow-title">
                Who to follow
            </h3>

            {loading && (
                <p className="who-follow-message">
                    Loading suggestions...
                </p>
            )}

            {!loading && error && (
                <p className="who-follow-error">
                    {error}
                </p>
            )}

            {!loading && !error && users.length === 0 && (
                <p className="who-follow-message">
                    No suggestions available right now.
                </p>
            )}

            {!loading && users.map(user => {
                const image = getProfileImage(user.profilePicture);

                return (
                    <div
                        className="who-follow-user"
                        key={user.userid}
                    >
                        <Link
                            to={`/profile/${user.userid}`}
                            className="who-follow-avatar"
                        >
                            {image ? (
                                <img
                                    src={image}
                                    alt={`${user.firstname}'s profile`}
                                    onError={(e) => {
                                        console.error("Profile image failed:", e.target.src);
                                        e.target.style.display = "none";
                                    }}
                                />
                            ) : (
                                <span>
                                    {user.firstname?.charAt(0)?.toUpperCase() || "?"}
                                </span>
                            )}
                        </Link>

                        <div className="who-follow-info">
                            <Link
                                to={`/profile/${user.userid}`}
                                className="who-follow-name"
                            >
                                {user.firstname} {user.lastname}
                            </Link>

                            <span className="who-follow-count">
                                {Number(user.followerCount || 0).toLocaleString()} followers
                            </span>
                        </div>

                        <button
                            className="who-follow-button"
                            onClick={() => handleFollow(user.userid)}
                            disabled={following.includes(user.userid)}
                        >
                            {following.includes(user.userid)
                                ? "Following..."
                                : "Follow"}
                        </button>
                    </div>
                );
            })}

            <button
                className="who-follow-refresh"
                onClick={fetchRecommendations}
                disabled={loading}
            >
                {loading ? "Loading..." : "Show more"}
            </button>

        </div>
    );
}

export default WhoToFollow;
