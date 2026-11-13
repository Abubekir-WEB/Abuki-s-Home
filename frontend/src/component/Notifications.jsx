import { useState, useEffect, useMemo, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { Bell, Heart, MessageCircle, UserPlus, Mail, Repeat2, X } from "lucide-react";
import { socket } from "../socket";
import "./Notifications.css";

// X-style short time: "now", "5m", "3h", "2d", then "Nov 10"
function timeAgo(date, now) {
    const s = Math.max(0, Math.floor((now - date) / 1000));
    if (s < 60) return "now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const TYPE_ICONS = {
    like: { Icon: Heart, tone: "like", filled: true },
    comment: { Icon: MessageCircle, tone: "blue" },
    reply: { Icon: MessageCircle, tone: "blue" },
    follow: { Icon: UserPlus, tone: "blue" },
    message: { Icon: Mail, tone: "blue" },
    repost: { Icon: Repeat2, tone: "repost" },
};

function NotificationIcon({ type }) {
    const { Icon, tone, filled } = TYPE_ICONS[type] ?? { Icon: Bell, tone: "blue" };
    return (
        <div className={`notification-icon notification-icon--${tone}`}>
            <Icon
                strokeWidth={2}
                fill={filled ? "currentColor" : "none"}
                aria-hidden="true"
            />
        </div>
    );
}

/**
 * size: "default" (370px) | "wide" (600px) | "full" (screen width)
 */
function Notifications({ size = "default" }) {
    const [list, setList] = useState([]);
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [tab, setTab] = useState("all");
    const [now, setNow] = useState(() => Date.now());

    const modalRef = useRef(null);

    const myid = useMemo(() => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return null;

            const decoded = jwtDecode(token);
            return decoded.id ?? decoded.userid ?? decoded.userId ?? null;
        } catch {
            return null;
        }
    }, []);

    // Live notifications
    useEffect(() => {
        if (!myid) return;

        const join = () => {
            socket.emit("joinNotification", myid);
        };

        const handleNotification = (msg) => {
            const recipientId = msg.to ?? msg.recipient_id;
            if (String(recipientId) !== String(myid)) return;

            const item = {
                ...msg,
                _key:
                    msg.notificationId ??
                    msg.messageId ??
                    `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                _receivedAt: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now(),
                _read: false,
            };

            setList(prev => [item, ...prev]);
            setUnread(count => count + 1);
        };

        socket.on("connect", join);
        socket.on("newNotification", handleNotification);

        if (socket.connected) join();

        return () => {
            socket.off("connect", join);
            socket.off("newNotification", handleNotification);
        };
    }, [myid]);

    // Keep "5m" / "2h" labels fresh while the panel is open
    useEffect(() => {
        if (!open) return;
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(timer);
    }, [open]);

    // Close on outside click or Escape
    useEffect(() => {
        if (!open) return;

        function handleOutsideClick(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setOpen(false);
            }
        }

        function handleEscape(event) {
            if (event.key === "Escape") setOpen(false);
        }

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [open]);

    const toggleModal = () => {
        setOpen(prev => !prev);
        setUnread(0);
    };

    const markRead = (key) => {
        setList(prev => prev.map(n => (n._key === key ? { ...n, _read: true } : n)));
    };

    const unreadItems = list.filter(n => !n._read);
    const visible = tab === "unread" ? unreadItems : list;

    const sizeClass =
        size === "wide" ? " notification-modal--wide" :
        size === "full" ? " notification-modal--full" : "";

    return (
        <div className="notification-wrapper" ref={modalRef}>
            <button
                type="button"
                className="notification-trigger"
                onClick={toggleModal}
                aria-label={`Notifications, ${unread} unread`}
                aria-expanded={open}
            >
                <Bell className="bell-icon" strokeWidth={1.8} aria-hidden="true" />

                {unread > 0 && (
                    <span className="notification-badge">
                        {unread > 99 ? "99+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className={`notification-modal${sizeClass}`}
                    role="dialog"
                    aria-label="Notifications"
                >
                    <div className="notification-header">
                        <h3>Notifications</h3>

                        <button
                            type="button"
                            className="close-notification"
                            onClick={() => setOpen(false)}
                            aria-label="Close notifications"
                        >
                            <X aria-hidden="true" />
                        </button>
                    </div>

                    <div className="notification-tabs" role="tablist">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === "all"}
                            className={tab === "all" ? "active" : ""}
                            onClick={() => setTab("all")}
                        >
                            All
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === "unread"}
                            className={tab === "unread" ? "active" : ""}
                            onClick={() => setTab("unread")}
                        >
                            Unread{unreadItems.length > 0 ? ` (${unreadItems.length})` : ""}
                        </button>
                    </div>

                    <div className="notification-content">
                        {visible.length === 0 ? (
                            <div className="notification-empty">
                                <span>
                                    <Bell aria-hidden="true" />
                                </span>
                                {tab === "unread" && list.length > 0 ? (
                                    <>
                                        <h4>You're all caught up</h4>
                                        <p>New notifications will show up here.</p>
                                    </>
                                ) : (
                                    <>
                                        <h4>Nothing to see here — yet</h4>
                                        <p>
                                            When someone interacts with you,
                                            you'll see it here.
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            visible.map(item => (
                                <div
                                    className={`notification-item${item._read ? "" : " notification-item--unread"}`}
                                    key={item._key}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => markRead(item._key)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            markRead(item._key);
                                        }
                                    }}
                                >
                                    <NotificationIcon type={item.type} />

                                    <div className="notification-details">
                                        <p>
                                            {item.text ??
                                             item.message ??
                                             "You have a new notification"}
                                        </p>
                                        <span>{timeAgo(item._receivedAt, now)}</span>
                                    </div>

                                    {!item._read && (
                                        <span className="notification-unread-dot" aria-label="Unread" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="notification-footer">
                        Notifications from your community
                    </div>
                </div>
            )}
        </div>
    );
}

export default Notifications;