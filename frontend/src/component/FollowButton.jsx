
import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:4000/user";

function FollowButton({ userid, currentUserId }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const targetUserId = Number(userid);
  const loggedInUserId = Number(currentUserId);

  const isOwnProfile =
    Number.isInteger(loggedInUserId) &&
    loggedInUserId > 0 &&
    loggedInUserId === targetUserId;

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    let cancelled = false;

    if (
      !token ||
      !Number.isInteger(targetUserId) ||
      targetUserId <= 0 ||
      isOwnProfile
    ) {
      setChecking(false);
      return;
    }

    setChecking(true);

    axios
      .get(`${API_URL}/follower`, config)
      .then((response) => {
        if (cancelled) return;

        const following = Array.isArray(response.data?.following)
          ? response.data.following
          : [];

        const alreadyFollowing = following.some((user) => {
          const followedId =
            user.userid ?? user.userId ?? user.following_id;

          return Number(followedId) === targetUserId;
        });

        setIsFollowing(alreadyFollowing);
      })
      .catch((err) => {
        console.error("Failed to check following status:", err);

        if (!cancelled) {
          setError("Couldn't check follow status.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setChecking(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, targetUserId, isOwnProfile]);

  function handleFollow() {
    if (!token) {
      setError("Please log in first.");
      return;
    }

    if (isOwnProfile || loading) return;

    setLoading(true);
    setError("");

    const request = isFollowing
      ? axios.delete(`${API_URL}/follow/${targetUserId}`, config)
      : axios.post(
          `${API_URL}/follow`,
          { userid: targetUserId },
          config
        );

    request
      .then(() => {
        setIsFollowing((previous) => !previous);
      })
      .catch((err) => {
        console.error(
          "Follow action failed:",
          err.response?.data || err.message
        );

        setError(
          err.response?.data?.message ||
            (err.response?.status === 401
              ? "Please log in again."
              : "Unable to update follow status.")
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }

  if (isOwnProfile) return null;

  return (
    <div className="follow-button-wrapper">
      <button
        type="button"
        onClick={handleFollow}
        disabled={loading || checking}
        className={`follow-button ${
          isFollowing ? "following" : "not-following"
        }`}
      >
        {checking
          ? "Loading..."
          : loading
            ? "Please wait..."
            : isFollowing
              ? "Following"
              : "Follow"}
      </button>

      {error && (
        <small className="follow-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}

export default FollowButton;