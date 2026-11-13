
import { socket } from "../socket";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import "./Inbox.css";

const API_URL = "http://localhost:4000/user";

function getMyId() {
    try {
        const token = localStorage.getItem("token");
        return token ? Number(jwtDecode(token).id) : null;
    } catch {
        return null;
    }
}

function Inbox({ selectedUserId }) {
    const myid = getMyId();
    const userid = selectedUserId ? Number(selectedUserId) : null;

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    // 1. Load previous messages from MySQL.
    useEffect(() => {
        if (!myid || !userid) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        async function loadMessages() {
            setLoading(true);
            setError("");

            try {
                const token = localStorage.getItem("token");

                const response = await fetch(
                    `${API_URL}/messages/${userid}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to load messages"
                    );
                }

                if (!cancelled) {
                    setMessages(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Message loading error:", err);

                if (!cancelled) {
                    setError(err.message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadMessages();

        return () => {
            cancelled = true;
        };
    }, [myid, userid]);

    // 2. Join Socket.IO room and receive messages.
    useEffect(() => {
        if (!myid || !userid) return;

        function joinRoom() {
            socket.emit("join", myid);
        }

        function receiveMessage(msg) {
            const senderId = Number(msg.from ?? msg.sender_id);
            const receiverId = Number(msg.to ?? msg.receiver_id);

            const belongsToThisChat =
                (senderId === myid && receiverId === userid) ||
                (senderId === userid && receiverId === myid);

            if (!belongsToThisChat) return;

            setMessages(previous => {
                const messageId = msg.messageId ?? msg.message_id;

                if (
                    messageId &&
                    previous.some(
                        item =>
                            Number(item.messageId ?? item.message_id) ===
                            Number(messageId)
                    )
                ) {
                    return previous;
                }

                return [...previous, msg];
            });

            setSending(false);
        }

        function handleMessageError(data) {
            setSending(false);
            setError(data?.message || "Message could not be saved.");
        }

        socket.on("connect", joinRoom);
        socket.on("private", receiveMessage);
        socket.on("messageError", handleMessageError);

        if (socket.connected) {
            joinRoom();
        }

        return () => {
            socket.off("connect", joinRoom);
            socket.off("private", receiveMessage);
            socket.off("messageError", handleMessageError);
        };
    }, [myid, userid]);

    // 3. Send message.
    function sendMessage(e) {
        e.preventDefault();

        const messageText = text.trim();

        if (!messageText || !userid || !myid || sending) return;

        if (!socket.connected) {
            setError("Connection lost. Please try again.");
            return;
        }

        setError("");
        setSending(true);

        socket.emit("private", {
            from: myid,
            to: userid,
            text: messageText
        });

        setText("");
    }

    if (!myid) {
        return <p>Please log in to use messaging.</p>;
    }

    if (!userid) {
        return <p>Select a user to start chatting.</p>;
    }

    return (
        <main className="inbox-page">
            <section className="inbox-container">

                <header className="inbox-header">
                    <div>
                        <h1>Conversation</h1>
                        <p>Chat with user #{userid}</p>
                    </div>
                </header>

                <div className="inbox-messages" aria-live="polite">

                    {loading ? (
                        <p className="inbox-empty">
                            Loading messages...
                        </p>
                    ) : error ? (
                        <p className="inbox-error">{error}</p>
                    ) : messages.length === 0 ? (
                        <p className="inbox-empty">
                            No messages yet. Start the conversation!
                        </p>
                    ) : (
                        messages.map((chat, index) => {
                            const senderId = Number(
                                chat.from ?? chat.sender_id
                            );

                            const messageText =
                                chat.text ?? chat.message_text;

                            const isMine = senderId === myid;

                            return (
                                <div
                                    key={
                                        chat.messageId ??
                                        chat.message_id ??
                                        index
                                    }
                                    className={`message-row ${
                                        isMine ? "own-message" : ""
                                    }`}
                                >
                                    <p className="message-sender">
                                        {isMine ? "You" : `User #${senderId}`}
                                    </p>

                                    <div className="message-bubble">
                                        {messageText}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <form
                    className="inbox-form"
                    onSubmit={sendMessage}
                >
                    <input
                        className="inbox-input"
                        type="text"
                        placeholder="Write a message..."
                        value={text}
                        onChange={e => setText(e.target.value)}
                    />

                    <button
                        className="send-button"
                        type="submit"
                        disabled={!text.trim() || sending}
                    >
                        {sending ? "Sending..." : "Send"}
                    </button>
                </form>

            </section>
        </main>
    );
}

export default Inbox;
