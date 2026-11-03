
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import "./chat.css";

function getLoggedInUser() {
  try {
    const token = localStorage.getItem("token");
    return token ? jwtDecode(token) : null;
  } catch (error) {
    console.error("Invalid token", error);
    return null;
  }
}

function Chat({ onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const me = getLoggedInUser();
  const myid = me ? Number(me.id) : null;

  useEffect(() => {
    fetch("http://localhost:4000/user/profile")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load users");
        }
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("Invalid user data");
        }
        setUsers(data);
      })
      .catch((err) => {
        console.error(err);
        setError(
          "Unable to load users. Check your connection."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (!me) {
    return (
      <p className="chat-status">
        Please log in to see people.
      </p>
    );
  }

  const people = users.filter(
    (u) => Number(u.userid) !== myid
  );

  const filteredUsers = people.filter((u) =>
    `${u.firstname || ""} ${u.lastname || ""}`
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

        {/* User list and states */}
        {loading ? (
          <p className="chat-status">
            Loading users...
          </p>
        ) : error ? (
          <p className="chat-error">{error}</p>
        ) : filteredUsers.length === 0 ? (
          <p className="chat-status">
            No users found.
          </p>
        ) : (
          <ul className="chat-user-list">
            {filteredUsers.map((u) => {
              const name =
                [u.firstname, u.lastname]
                  .filter(Boolean)
                  .join(" ") || "Unknown user";

              return (
                <li key={u.userid}>
                  <button
                    type="button"
                    className="chat-user"
                    onClick={() =>
                      onSelectUser?.({
                        userid: Number(u.userid),
                        firstname: u.firstname,
                        lastname: u.lastname,
                      })
                    }
                  >
                    <div className="user-avatar">
                      {name.charAt(0).toUpperCase()}
                    </div>

                    <div className="user-info">
                      <h3>{name}</h3>
                      <p>Start a conversation</p>
                    </div>

                    <span className="user-arrow">›</span>
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
