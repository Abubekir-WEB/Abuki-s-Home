
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { socket } from "../socket";
import './Notifications.css'
function Notifications() {
    const [list, setList] = useState([]);
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);

    const token = localStorage.getItem("token");

    let myid = null;

    try {
        if (token) {
            const decoded = jwtDecode(token);
            myid = decoded.id ?? decoded.userid ?? decoded.userId;
        }
    } catch (error) {
        console.error("Invalid token:", error);
    }

    useEffect(() => {
        if (!myid) return;

        function join() {
            console.log("Joining notification room:", myid);
            socket.emit("joinNotification", myid);
        }

        function handleMessage(msg) {
            console.log("Notification received:", msg);

            if (Number(msg.to) !== Number(myid)) return;

            setList((prev) => [msg, ...prev]);
            setUnread((count) => count + 1);
        }

        socket.on("connect", join);
        socket.on("newNotification", handleMessage);

        if (socket.connected) {
            join();
        }

        return () => {
            socket.off("connect", join);
            socket.off("newNotification", handleMessage);
        };
    }, [myid]);

    function toggle() {
        setOpen((prev) => {
            const next = !prev;

            if (next) {
                setUnread(0);
            }

            return next;
        });
    }

    return (
        <div className="notifications">
            <button
                type="button"
                className="notification-button"
                onClick={toggle}
                aria-label={`Notifications, ${unread} unread`}
                aria-expanded={open}
            >
                Notifications

                {unread > 0 && (
                    <span className="notification-badge">
                        {unread > 99 ? "99+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <ul className="notification-list">
                    {list.length === 0 ? (
                        <li className="empty-notifications">
                            No notifications yet
                        </li>
                    ) : (
                        list.map((notification, index) => (
                            <li
                                key={
                                    notification.id ??
                                    notification.notificationId ??
                                    `${notification.to}-${notification.text}-${index}`
                                }
                                className="notification-item"
                            >
                                {notification.text}
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}

export default Notifications;
