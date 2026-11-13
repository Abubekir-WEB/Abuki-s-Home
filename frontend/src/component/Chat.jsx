
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import "./chat.css";

const SERVER_URL = "http://localhost:4000";

// Get logged-in user from JWT.
function getLoggedInUser() {
  try {
    const token = localStorage.getItem("token");
    return token ? jwtDecode(token) : null;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}

// Generate the correct profile image URL.
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

  const encodedPath = imagePathWithFolder
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${SERVER_URL}/${encodedPath}`;
}

function Chat({ onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const me = getLoggedInUser();

  const myid = me
    ? Number(me.id ?? me.userid ?? me.userId)
    : null;

  useEffect(() => {
    if (!me) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    let cancelled = false;

    fetch("http://localhost:4000/user/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            res.status === 401
              ? "Your session has expired. Please log in again."
              : "Failed to load users."
          );
        }

        return res.json();
      })
      .then((data) => {
        console.log("Backend response:", data);

        if (!Array.isArray(data.users)) {
          throw new Error("Invalid user data received.");
        }

        if (!cancelled) {
          setUsers(data.users);
        }
      })
      .catch((err) => {
        console.error("Chat users error:", err);

        if (!cancelled) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!me) {
    return (
      <p className="chat-status">
        Please log in to see people.
      </p>
    );
  }

  // Exclude the logged-in user.
  const people = users.filter(
    (user) => Number(user.userid) !== myid
  );

  // Search users by first and last name.
  const filteredUsers = people.filter((user) =>
    `${user.firstname || ""} ${user.lastname || ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  return (
    <main className="chat-page">
      <section className="chat-container">

        {/* Header */}
        <header className="chat-header">
          <div className="chat-heading-info">
            <h1>{me.firstname || "Me"}</h1>
            <p>Connect with people</p>
          </div>

          <span className="user-count">
            {people.length} users
          </span>
        </header>

        {/* Search */}
        <div className="chat-search">
          <span className="search-icon">⌕</span>

          <input
            type="search"
            placeholder="Search people..."
            aria-label="Search people"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* People heading */}
        <div className="chat-list-heading">
          <h2>People</h2>
        </div>

        {loading ? (
          <p className="chat-status">
            Loading users...
          </p>
        ) : error ? (
          <p className="chat-error">
            {error}
          </p>
        ) : filteredUsers.length === 0 ? (
          <p className="chat-status">
            No users found.
          </p>
        ) : (
          <ul className="chat-user-list">
            {filteredUsers.map((user) => {
              const name =
                [user.firstname, user.lastname]
                  .filter(Boolean)
                  .join(" ") || "Unknown user";

              const profileImage = getImageUrl(
                user.profilePicture
              );

              return (
                <li key={user.userid}>
                  <button
                    type="button"
                    className="chat-user"
                    onClick={() =>
                      onSelectUser?.({
                        userid: Number(user.userid),
                        firstname: user.firstname,
                        lastname: user.lastname,
                        profilePicture: user.profilePicture,
                      })
                    }
                  >

                    {/* Profile picture */}
                    <div className="user-avatar">
                      {profileImage && (
                        <img
                          src={profileImage}
                          alt={`${name}'s profile`}
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      )}

                      {/* Fallback initials */}
                      <span>
                        {name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* User information */}
                    <div className="user-info">
                      <h3>{name}</h3>
                      <p>Start a conversation</p>
                    </div>

                    <span className="user-arrow">
                      ›
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

export default Chat;