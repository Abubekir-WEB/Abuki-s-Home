import { socket } from "../socket";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import "./Inbox.css";

function getMyId() {
  try {
    const token = localStorage.getItem("token");
    return token ? Number(jwtDecode(token).id) : null;
  } catch {
    return null; // bad or expired token
  }
}

function Inbox({ selectedUserId }) {
  const myid = getMyId();
  const userid = selectedUserId ? Number(selectedUserId) : null;

  const [message, setMessage] = useState([]);
  const [text, setText] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followError, setFollowError] = useState("");

  async function Follow() {
    if (!myid || !userid || myid === userid) return;
    setFollowError("");

    try {
      const res = await fetch("http://localhost:4000/user/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ myid, userid }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFollowError(data.message);
        return;
      }
      setIsFollowing(true); // only after the server says OK
    } catch {
      setFollowError("Could not reach the server");
    }
  }

  function send(e) {
    e.preventDefault();
    if (!text.trim() || !userid) return;

    socket.emit("private", { from: myid, to: userid, text: text.trim() });
    setText("");
  }

  useEffect(() => {
    if (!myid) return;
    socket.emit("join", myid);

    function handleMessage(msg) {
      setMessage((prev) => [...prev, msg]);
    }
    socket.on("private", handleMessage);

    return () => socket.off("private", handleMessage);
  }, [myid]);

  // Hooks are all above, so returning early here is safe
  if (!myid) return <p>Please log in to use the inbox.</p>;
  if (!userid) return <p>Select a user to start chatting.</p>;

  return (
    <main className="inbox-page">
      <section className="inbox-container">
        <header className="inbox-header">
          <div>
            <h1>Conversation</h1>
            <p>Chat with user #{userid}</p>
            {followError && <p className="inbox-error">{followError}</p>}
          </div>

          <button
            type="button"
            className="follow-button"
            onClick={Follow}
            disabled={isFollowing || myid === userid}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        </header>

        <div className="inbox-messages" aria-live="polite">
          {message.length === 0 ? (
            <p className="inbox-empty">No messages yet. Start the conversation!</p>
          ) : (
            message.map((chat, index) => {
              const isMine = Number(chat.from) === myid;
            
              return (
                <div
                  key={index}
                  className={`message-row ${isMine ? "own-message" : ""}`}
                >
                  <p className="message-sender">
                    {isMine ? "You" : `User #${chat.from}`}
                  </p>
                  <div className="message-bubble">{chat.text}</div>
                </div>
              );
            })
          )}
        </div>

        <form className="inbox-form" onSubmit={send}>
          <input
            className="inbox-input"
            type="text"
            placeholder="Write a message..."
            aria-label="Write a message"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="send-button" type="submit" disabled={!text.trim()}>
            Send
          </button>
        </form>
      </section>
    </main>
  );
}

export default Inbox;