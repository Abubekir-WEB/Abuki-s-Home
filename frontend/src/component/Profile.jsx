
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import FollowButton from "./FollowButton";
import "./Profile.css";

const API_URL = "http://localhost:4000";
const PROFILE_API = `${API_URL}/user/profile`;

// Generate image URL
const getImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") {
    return null;
  }

  const path = imagePath.trim();

  if (!path) return null;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_URL}/${path.replace(/^\/+/, "")}`;
};

// Get logged-in user ID from JWT
const getCurrentUserId = (token) => {
  if (!token) return null;

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
  const currentUserId = getCurrentUserId(token);

  // Profile states
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit profile states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [bio, setBio] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Check whether this is the logged-in user's profile
  const isOwnProfile =
    currentUserId !== null &&
    profile?.userid != null &&
    String(currentUserId) === String(profile.userid);

  // Create and clean up image preview URL
  useEffect(() => {
    if (!selectedFile) {
      setPreviewImage(null);
      return;
    }

    const imageUrl = URL.createObjectURL(selectedFile);
    setPreviewImage(imageUrl);

    return () => {
      URL.revokeObjectURL(imageUrl);
    };
  }, [selectedFile]);

  // Fetch profile information
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
          throw new Error(
            "The server did not return profile information."
          );
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

  // Open edit profile modal
  const openEditProfile = () => {
    if (!profile || !isOwnProfile) return;

    setFirstname(profile.firstname || "");
    setLastname(profile.lastname || "");
    setBio(profile.bio || "");

    setSelectedFile(null);
    setEditError("");
    setEditSuccess("");

    setIsEditOpen(true);
  };

  // Close edit profile modal
  const closeEditProfile = () => {
    if (saving || uploadingPicture) return;

    setIsEditOpen(false);
    setSelectedFile(null);
    setEditError("");
    setEditSuccess("");
  };

  // Select profile picture
  const handlePictureChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setEditError("");
    setEditSuccess("");

    if (!file.type.startsWith("image/")) {
      setEditError("Please select a valid image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEditError("Image size must be less than 5MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  // Save profile information
  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!token) {
      setEditError("Please log in again.");
      return;
    }

    if (!firstname.trim() || !lastname.trim()) {
      setEditError("First name and last name are required.");
      return;
    }

    if (bio.trim().length > 500) {
      setEditError("Bio cannot exceed 500 characters.");
      return;
    }

    setSaving(true);
    setEditError("");
    setEditSuccess("");

    try {
      const updatedFirstname = firstname.trim();
      const updatedLastname = lastname.trim();
      const updatedBio = bio.trim();

      const response = await axios.put(
        PROFILE_API,
        {
          firstname: updatedFirstname,
          lastname: updatedLastname,
          bio: updatedBio,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setProfile((previous) => ({
          ...previous,
          firstname: updatedFirstname,
          lastname: updatedLastname,
          bio: updatedBio,
        }));

        setEditSuccess("Profile updated successfully!");
      } else {
        setEditError(
          response.data.message || "Unable to update your profile."
        );
      }
    } catch (err) {
      console.error("Profile update failed:", err);

      setEditError(
        err.response?.data?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // Upload profile picture
  const handleUploadPicture = async () => {
    if (!token) {
      setEditError("Please log in again.");
      return;
    }

    if (!selectedFile) {
      setEditError("Please select a picture first.");
      return;
    }

    setUploadingPicture(true);
    setEditError("");
    setEditSuccess("");

    try {
      const formData = new FormData();
      formData.append("profilePicture", selectedFile);

      const response = await axios.put(
        `${PROFILE_API}/picture`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setProfile((previous) => ({
          ...previous,
          profilePicture: response.data.profilePicture,
        }));

        setSelectedFile(null);
        setEditSuccess("Profile picture updated successfully!");
      } else {
        setEditError(
          response.data.message || "Unable to upload profile picture."
        );
      }
    } catch (err) {
      console.error("Picture upload failed:", err);

      setEditError(
        err.response?.data?.message ||
          "Unable to upload profile picture."
      );
    } finally {
      setUploadingPicture(false);
    }
  };

  // Navigate to messaging
  const handleMessage = () => {
    navigate("/messaging", {
      state: {
        selectedUser: profile,
      },
    });
  };

  // Loading screen
  if (loading) {
    return (
      <main className="profile-loading" aria-live="polite">
        <span className="profile-spinner" />
        <p>Loading profile...</p>
      </main>
    );
  }

  // Error screen
  if (error || !profile) {
    return (
      <main className="profile-error">
        <h2>Profile unavailable</h2>
        <p>{error || "This user could not be found."}</p>

        <button type="button" onClick={() => navigate("/")}>
          Go Home
        </button>
      </main>
    );
  }

  const profileImage = getImageUrl(profile.profilePicture);
  const coverImage = getImageUrl(profile.coverPicture);

  const followingCount = Number(profile.followingCount ?? 0);
  const followerCount = Number(profile.followerCount ?? 0);

  return (
    <main className="profile-page">

      {/* Profile Header */}
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

      {/* Cover Banner */}
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

      {/* Profile Information */}
      <section className="profile-information">

        {/* Profile Actions */}
        <div className="profile-actions">

          {/* Profile Avatar */}
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

          {/* Action Buttons */}
          {isOwnProfile ? (
            <button
              type="button"
              className="profile-edit-button"
              onClick={openEditProfile}
            >
              Edit profile
            </button>
          ) : (
            <div className="profile-action-buttons">
              <FollowButton
                userid={profile.userid}
                currentUserId={currentUserId}
              />

              <button
                type="button"
                className="profile-edit-button"
                onClick={handleMessage}
              >
                Message
              </button>
            </div>
          )}
        </div>

        {/* Profile Identity */}
        <div className="profile-identity">
          <h1>
            {profile.firstname} {profile.lastname}
          </h1>

          <p className="profile-handle">
            @user{profile.userid}
          </p>
        </div>

        {/* Bio */}
        <p className="profile-bio">
          {profile.bio?.trim() || "No bio yet."}
        </p>

        {/* Profile Location */}
        <div className="profile-meta">
          <span>📍 Ethiopia</span>
        </div>

        {/* Followers and Following */}
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

      {/* Profile Tabs */}
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

      {/* User Posts */}
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
                {/* Post Avatar */}
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

                {/* Post Content */}
                <div className="profile-post-body">
                  <div className="profile-post-author">
                    <strong>
                      {profile.firstname} {profile.lastname}
                    </strong>

                    <span>@user{profile.userid}</span>
                  </div>

                  {/* Post Text */}
                  {post.postText && (
                    <p className="profile-post-text">
                      {post.postText}
                    </p>
                  )}

                  {/* Post Image */}
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

      {/* EDIT PROFILE MODAL */}
      {isEditOpen && (
        <div
          className="edit-profile-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditProfile();
            }
          }}
        >
          <section
            className="edit-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
          >

            {/* Modal Header */}
            <div className="edit-profile-header">
              <button
                type="button"
                className="edit-profile-close"
                onClick={closeEditProfile}
                disabled={saving || uploadingPicture}
                aria-label="Close edit profile"
              >
                ×
              </button>

              <h2 id="edit-profile-title">
                Edit profile
              </h2>

              <button
                type="submit"
                form="edit-profile-form"
                className="edit-profile-save"
                disabled={saving || uploadingPicture}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>

            {/* Picture Section */}
            <div className="edit-picture-section">
              <div className="edit-picture-preview">
                {previewImage || profileImage ? (
                  <img
                    src={previewImage || profileImage}
                    alt="Profile preview"
                  />
                ) : (
                  <span>
                    {firstname.charAt(0).toUpperCase() || "U"}
                  </span>
                )}
              </div>

              <div className="edit-picture-actions">
                <label
                  htmlFor="profile-picture-input"
                  className="choose-picture-button"
                >
                  Choose picture
                </label>

                <input
                  id="profile-picture-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePictureChange}
                  hidden
                />

                <button
                  type="button"
                  className="upload-picture-button"
                  onClick={handleUploadPicture}
                  disabled={!selectedFile || uploadingPicture || saving}
                >
                  {uploadingPicture ? "Uploading..." : "Upload picture"}
                </button>
              </div>

              <small>
                JPG, PNG or other image formats. Maximum 5MB.
              </small>
            </div>

            {/* Profile Form */}
            <form
              id="edit-profile-form"
              onSubmit={handleSaveProfile}
              className="edit-profile-fields"
            >
              <label htmlFor="edit-firstname">
                First name
              </label>

              <input
                id="edit-firstname"
                type="text"
                value={firstname}
                onChange={(event) => setFirstname(event.target.value)}
                maxLength={100}
                required
                disabled={saving || uploadingPicture}
              />

              <label htmlFor="edit-lastname">
                Last name
              </label>

              <input
                id="edit-lastname"
                type="text"
                value={lastname}
                onChange={(event) => setLastname(event.target.value)}
                maxLength={100}
                required
                disabled={saving || uploadingPicture}
              />

              <label htmlFor="edit-bio">
                Bio
              </label>

              <textarea
                id="edit-bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Tell people about yourself..."
                disabled={saving || uploadingPicture}
              />

              <div className="bio-character-count">
                {bio.length}/500
              </div>

              {editError && (
                <p className="edit-profile-error" role="alert">
                  {editError}
                </p>
              )}

              {editSuccess && (
                <p className="edit-profile-success" role="status">
                  {editSuccess}
                </p>
              )}
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default Profile;
