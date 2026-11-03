import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./CommentButton.css";

// ---- Adjust these to match your project ----
const API_URL = "http://localhost:4000/user"; // your Express server
const getToken = () => localStorage.getItem("token"); // where you store your JWT
const MAX_VISIBLE = 5; // max comments shown after expanding
const MAX_LENGTH = 2000; // matches backend validation
// --------------------------------------------

const avatarSrc = (pic) => {
  if (!pic) return null;
  if (/^https?:\/\//.test(pic)) return pic;
  return `${API_URL}/${String(pic).replace(/^\/+/, "")}`;
};

const timeAgo = (dateString) => {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (Number.isNaN(seconds)) return "";
  if (seconds < 60) return `${Math.max(seconds, 1)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

function Avatar({ user, size = 40 }) {
  const src = avatarSrc(user.profilePicture);
  const initial = (user.firstname?.[0] || "?").toUpperCase();
  return src ? (
    <img
      className="cm-avatar"
      src={src}
      alt=""
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="cm-avatar cm-avatar--fallback"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </div>
  );
}

function CommentItem({ comment, isLast }) {
  return (
    <article className="cm-item">
      <div className="cm-item__left">
        <Avatar user={comment} />
        {!isLast && <span className="cm-item__thread" />}
      </div>
      <div className="cm-item__body">
        <header className="cm-item__header">
          <span className="cm-item__name">
            {comment.firstname} {comment.lastname}
          </span>
          <span className="cm-item__dot">·</span>
          <time className="cm-item__time">{timeAgo(comment.created_at)}</time>
        </header>
        <p className="cm-item__text">{comment.comment_text}</p>
      </div>
    </article>
  );
}

export default function CommentButton({ postId, currentUser }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/posts/${postId}/comments`);
      if (!res.ok) throw new Error("Failed to load comments");
      setComments(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Load once so the count shows next to the icon
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Close on Escape + lock page scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && closeModal();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    textareaRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const openModal = (e) => {
    e?.stopPropagation();
    setError("");
    setOpen(true);
    fetchComments();
  };

  const closeModal = () => {
    setOpen(false);
    setExpanded(false);
  };

  const autoGrow = (el) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || posting) return;

    try {
      setPosting(true);
      setError("");
      const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ commentText: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to add comment");

      setText("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      await fetchComments();
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const remaining = MAX_LENGTH - text.length;
  const canPost = text.trim().length > 0 && remaining >= 0 && !posting;

  const visible = expanded ? comments.slice(0, MAX_VISIBLE) : comments.slice(0, 1);
  const hiddenCount = Math.min(comments.length, MAX_VISIBLE) - 1;
  const extraBeyondLimit = comments.length - MAX_VISIBLE;

  // Circular progress ring for the character counter
  const RADIUS = 10;
  const CIRC = 2 * Math.PI * RADIUS;
  const progress = Math.min(text.length / MAX_LENGTH, 1);
  const ringColor =
    remaining < 0 ? "#f4212e" : remaining <= 20 ? "#ffd400" : "#1d9bf0";

  return (
    <>
      {/* ---------- Reply button (X style) ---------- */}
      <button
        type="button"
        className="cm-trigger"
        onClick={openModal}
        aria-label="Reply"
      >
        <span className="cm-trigger__icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z" />
          </svg>
        </span>
        {comments.length > 0 && (
          <span className="cm-trigger__count">{comments.length}</span>
        )}
      </button>

      {/* ---------- Modal ---------- */}
      {open &&
        createPortal(
          <div className="cm-overlay" onMouseDown={closeModal}>
            <div
              className="cm-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Comments"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="cm-modal__top">
                <button
                  type="button"
                  className="cm-close"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z" />
                  </svg>
                </button>
              </div>

              <div className="cm-modal__scroll">
                {/* Comment list */}
                {loading && comments.length === 0 ? (
                  <div className="cm-state">
                    <span className="cm-spinner" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="cm-state cm-state--empty">
                    <h3>No replies yet</h3>
                    <p>Be the first to share your thoughts.</p>
                  </div>
                ) : (
                  <div className="cm-list">
                    {visible.map((c, i) => {
                      const isFirst = i === 0;
                      const clickable = isFirst && !expanded && hiddenCount > 0;
                      return (
                        <div
                          key={c.comment_id}
                          className={clickable ? "cm-clickable" : ""}
                          onClick={clickable ? () => setExpanded(true) : undefined}
                          role={clickable ? "button" : undefined}
                          tabIndex={clickable ? 0 : undefined}
                          onKeyDown={
                            clickable
                              ? (e) => e.key === "Enter" && setExpanded(true)
                              : undefined
                          }
                        >
                          <CommentItem
                            comment={c}
                            isLast={i === visible.length - 1 && !clickable}
                          />
                        </div>
                      );
                    })}

                    {!expanded && hiddenCount > 0 && (
                      <button
                        type="button"
                        className="cm-more"
                        onClick={() => setExpanded(true)}
                      >
                        Show {hiddenCount} more {hiddenCount === 1 ? "reply" : "replies"}
                      </button>
                    )}

                    {expanded && (
                      <div className="cm-footer-row">
                        {extraBeyondLimit > 0 && (
                          <span className="cm-limit-note">
                            Showing the latest {MAX_VISIBLE} of {comments.length} replies
                          </span>
                        )}
                        <button
                          type="button"
                          className="cm-more cm-more--collapse"
                          onClick={() => setExpanded(false)}
                        >
                          Show less
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Composer */}
              <form className="cm-composer" onSubmit={handleSubmit}>
                <Avatar user={currentUser || {}} />
                <div className="cm-composer__main">
                  <textarea
                    ref={textareaRef}
                    className="cm-composer__input"
                    placeholder="Post your reply"
                    value={text}
                    rows={1}
                    onChange={(e) => {
                      setText(e.target.value);
                      autoGrow(e.target);
                    }}
                  />
                  {error && <p className="cm-error">{error}</p>}
                  <div className="cm-composer__actions">
                    <div className="cm-counter">
                      {text.length > 0 && (
                        <>
                          <svg width="26" height="26" viewBox="0 0 26 26">
                            <circle cx="13" cy="13" r={RADIUS} className="cm-ring-bg" />
                            <circle
                              cx="13"
                              cy="13"
                              r={RADIUS}
                              className="cm-ring"
                              stroke={ringColor}
                              strokeDasharray={CIRC}
                              strokeDashoffset={CIRC * (1 - progress)}
                              transform="rotate(-90 13 13)"
                            />
                          </svg>
                          {remaining <= 20 && (
                            <span
                              className="cm-counter__num"
                              style={{ color: remaining < 0 ? "#f4212e" : undefined }}
                            >
                              {remaining}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <button type="submit" className="cm-post" disabled={!canPost}>
                      {posting ? "Posting…" : "Reply"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}