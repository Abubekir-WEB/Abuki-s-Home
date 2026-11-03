
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./Profile.css";

const API_URL = "http://localhost:4000";
const PROFILE_API = `${API_URL}/user/profile`;

const getImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") {
    return null;
  }

  const path = imagePath.trim();

  if (!path) {
    return null;
  }

  // Preserve absolute image URLs.
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Avoid adding the server URL twice.
  return `${API_URL}/${path.replace(/^\/+/, "")}`;
};

const getCurrentUserId = (token) => {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode(token);

    const id =
      decoded.id ??
      decoded.userid ??
      decoded.userId ??
      decoded._id;

    return id == null ? null : String(id);
  } catch (error) {
    console.error("Unable to decode JWT:", error);
    return null;
  }
};

function Profile() {
  const { userid } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUserId = getCurrentUserId(token);

  const isOwnProfile =
    currentUserId !== null &&
    userid !== undefined &&
    currentUserId === String(userid);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      if (!userid) {
        setError("No user ID was provided.");
        setProfile(null);
        setPosts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await axios.get(
          `${PROFILE_API}/${encodeURIComponent(userid)}`,
          {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : {},
          }
        );

        if (cancelled) return;

        const data = response.data;

        if (!data || !data.user) {
          throw new Error("The server did not return profile information.");
        }

        setProfile(data.user);
        setPosts(Array.isArray(data.posts) ? data.posts : []);
      } catch (err) {
        if (cancelled) return;

        console.error("Unable to load profile:", err);

        const status = err.response?.status;

        let message =
          err.response?.data?.message ||
          (typeof err.response?.data === "string"
            ? err.response.data
            : "") ||
          err.message ||
          "Unable to load this profile.";

        if (status === 404) {
          message = "This user profile could not be found.";
        } else if (status === 401) {
          message = "Your session has expired. Please log in again.";
        } else if (!err.response) {
          message =
            "Cannot connect to the server. Check whether your backend is running.";
        }

        setError(message);
        setProfile(null);
        setPosts([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [userid, token]);

  if (loading) {
    return (
      <main className="profile-loading" aria-live="polite">
        <span className="profile-spinner" />
        <p>Loading profile...</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="profile-error">
        <h2>Profile unavailable</h2>
        <p>{error || "This user could not be found."}</p>

        <button
          type="button"
          onClick={() => navigate("/")}
        >
          Go Home
        </button>
      </main>
    );
  }

  const profileImage = getImageUrl(profile.profilePicture);
  const coverImage = getImageUrl(profile.coverPicture);

  const followingCount = Number(profile.followingCount ?? 0);
  const followerCount = Number(profile.followerCount ?? 0);

  const handleMessage = () => {
    navigate("/messaging", {
      state: {
        selectedUser: profile,
      },
    });
  };

  return (
    <main className="profile-page">
      {/* Profile header */}
      <header className="profile-topbar">
        <button
          type="button"
          className="profile-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ←
        </button>

        <div>
          <h2>
            {profile.firstname} {profile.lastname}
          </h2>

          <span>{posts.length} posts</span>
        </div>
      </header>

      {/* Cover banner */}
      <div className="profile-cover">
        {coverImage && (
          <img
            src={coverImage}
            alt="Profile cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        )}
      </div>

      {/* Profile details */}
      <section className="profile-information">
        <div className="profile-actions">
          <div className="profile-avatar">
            {profileImage ? (
              <img
                src={profileImage}
                alt={`${profile.firstname || "User"}'s profile`}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span>
                {profile.firstname?.charAt(0).toUpperCase() || "U"}
              </span>
            )}
          </div>

          {isOwnProfile ? (
            <button
              type="button"
              className="profile-edit-button"
              onClick={() => navigate("/edit-profile")}
            >
              Edit profile
            </button>
          ) : (
            <button
              type="button"
              className="profile-edit-button"
              onClick={handleMessage}
            >
              Message
            </button>
          )}
        </div>

        <div className="profile-identity">
          <h1>
            {profile.firstname} {profile.lastname}
          </h1>

          <p className="profile-handle">
            @user{profile.userid}
          </p>
        </div>

        <p className="profile-bio">
          {profile.bio?.trim() || "No bio yet."}
        </p>

        <div className="profile-meta">
          <span>📍 Ethiopia</span>
        </div>

        {/* Followers and following */}
        <div className="profile-stats">
          <button
            type="button"
            onClick={() =>
              navigate("/follow", {
                state: { userid: profile.userid },
              })
            }
          >
            <strong>{followingCount}</strong>
            <span>Following</span>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/follower", {
                state: { userid: profile.userid },
              })
            }
          >
            <strong>{followerCount}</strong>
            <span>Followers</span>
          </button>
        </div>
      </section>

      {/* Profile tabs */}
      <nav className="profile-tabs" aria-label="Profile sections">
        <button type="button" className="active">
          Posts
        </button>

        <button type="button" disabled>
          Replies
        </button>

        <button type="button" disabled>
          Media
        </button>

        <button type="button" disabled>
          Likes
        </button>
      </nav>

      {/* Posts */}
      <section className="profile-posts" aria-label="User posts">
        {posts.length === 0 ? (
          <div className="profile-empty">
            <h2>Nothing to see here — yet</h2>

            <p>
              When this user posts, their posts will appear here.
            </p>
          </div>
        ) : (
          posts.map((post, index) => {
            const postImage = getImageUrl(post.postPicture);

            return (
              <article
                className="profile-post"
                key={post.postid ?? index}
              >
                <div className="profile-post-avatar">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span>
                      {profile.firstname?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                </div>

                <div className="profile-post-body">
                  <div className="profile-post-author">
                    <strong>
                      {profile.firstname} {profile.lastname}
                    </strong>

                    <span>@user{profile.userid}</span>
                  </div>

                  {post.postText && (
                    <p className="profile-post-text">
                      {post.postText}
                    </p>
                  )}

                  {postImage && (
                    <img
                      className="profile-post-image"
                      src={postImage}
                      alt="Post attachment"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}

export default Profile;
