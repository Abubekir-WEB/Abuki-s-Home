
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

  useEffect(() => {
    let cancelled = false;

    async function checkFollowing() {
      if (
        !token ||
        !Number.isInteger(targetUserId) ||
        targetUserId <= 0 ||
        isOwnProfile
      ) {
        setChecking(false);
        return;
      }

      try {
        setChecking(true);

        const response = await axios.get(
          `${API_URL}/follower`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const following = Array.isArray(response.data?.following)
          ? response.data.following
          : [];

        const alreadyFollowing = following.some((user) => {
          const followedId =
            user.userid ??
            user.userId ??
            user.following_id;

          return Number(followedId) === targetUserId;
        });

        if (!cancelled) {
          setIsFollowing(alreadyFollowing);
        }
      } catch (err) {
        console.error("Failed to check following status:", err);

        if (!cancelled) {
          setError("Couldn't check follow status.");
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    checkFollowing();

    return () => {
      cancelled = true;
    };
  }, [token, targetUserId, isOwnProfile]);

  async function handleFollow() {
    if (!token) {
      setError("Please log in first.");
      return;
    }

    if (isOwnProfile || loading) return;

    setLoading(true);
    setError("");

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (isFollowing) {
        await axios.delete(
          `${API_URL}/follow/${targetUserId}`,
          config
        );

        setIsFollowing(false);
      } else {
        await axios.post(
          `${API_URL}/follow`,
          { userid: targetUserId },
          config
        );

        setIsFollowing(true);
      }
    } catch (err) {
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
    } finally {
      setLoading(false);
    }
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
