
import { useEffect, useState } from "react";
import axios from "axios";
import "./TrendingTopics.css";
import { useNavigate } from "react-router-dom";
const API_URL = "http://localhost:4000/user";

function TrendingTopics() {

    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refresh, setRefresh] = useState(0);
    const navigate = useNavigate();
    useEffect(() => {

        let isMounted = true;

        const fetchTrends = async () => {

            setLoading(true);
            setError("");

            try {

                const token = localStorage.getItem("token");

                if (!token) {
                    throw new Error("Please log in to view trending topics.");
                }

                const response = await axios.get(
                    `${API_URL}/trending`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (isMounted && response.data.success) {
                    setTrends(
                        Array.isArray(response.data.trends)
                            ? response.data.trends
                            : []
                    );
                }

            } catch (err) {

                console.error(
                    "Failed to fetch trending topics:",
                    err.response?.data || err.message
                );

                if (isMounted) {
                    setError(
                        err.response?.data?.message ||
                        err.message ||
                        "Unable to load trending topics."
                    );
                }

            } finally {

                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchTrends();

        return () => {
            isMounted = false;
        };

    }, [refresh]);

    return (
        <aside className="trending-card">

            <div className="trending-header">
                <h3>
                    <span className="trending-icon">↗</span>
                    What's happening
                </h3>

                <button
                    className="trending-refresh"
                    onClick={() => setRefresh(value => value + 1)}
                    title="Refresh trends"
                    aria-label="Refresh trending topics"
                >
                    ↻
                </button>
            </div>

            {loading ? (

                <div className="trending-message">
                    Loading trending topics...
                </div>

            ) : error ? (

                <div className="trending-message trending-error">
                    <p>{error}</p>

                    <button
                        onClick={() => setRefresh(value => value + 1)}
                    >
                        Try again
                    </button>
                </div>

            ) : trends.length === 0 ? (

                <div className="trending-message">
                    No trending topics yet.
                    <p>Start a conversation using hashtags!</p>
                </div>

            ) : (

                <div className="trending-list">

                    {trends.map((topic, index) => (

                       <div
    className="trending-item"
    key={topic.hashtag.toLowerCase()}
    onClick={() => {
        console.log("Clicked trending topic:", topic.hashtag);

        navigate(
            `/trending/${encodeURIComponent(topic.hashtag.replace(/^#/, ""))}`
        );
    }}
>

                            <span className="trending-position">
                                Trending · {index + 1}
                            </span>

                            <h4>{topic.hashtag}</h4>

                            <span className="trending-count">
                                {topic.count}{" "}
                                {topic.count === 1 ? "post" : "posts"}
                            </span>

                        </div>

                    ))}

                </div>
            )}

            <div className="trending-footer">
                Based on recent posts
            </div>

        </aside>
    );
}

export default TrendingTopics;
