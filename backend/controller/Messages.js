
import connection from "../db/dbConnection.js";

// Get messages between the logged-in user and another user.
export function getMessages(req, res) {
    const currentUserId = Number(req.user?.id);
    const otherUserId = Number(req.params.userid);

    // Validate logged-in user.
    if (!Number.isSafeInteger(currentUserId) || currentUserId <= 0) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    // Validate selected user.
    if (!Number.isSafeInteger(otherUserId) || otherUserId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
    }

    if (currentUserId === otherUserId) {
        return res.status(400).json({
            success: false,
            message: "You cannot open a conversation with yourself"
        });
    }

    const query = `
        SELECT
            message_id,
            sender_id,
            receiver_id,
            message_text,
            created_at
        FROM messages
        WHERE
            (sender_id = ? AND receiver_id = ?)
            OR
            (sender_id = ? AND receiver_id = ?)
        ORDER BY message_id ASC
        LIMIT 200
    `;

    connection.query(
        query,
        [currentUserId, otherUserId, otherUserId, currentUserId],
        (err, rows) => {
            if (err) {
                console.error("Get messages error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to retrieve messages"
                });
            }

            return res.status(200).json(rows);
        }
    );
}


// Get all conversations belonging to the logged-in user.
export function getConversations(req, res) {
    const userId = Number(req.user?.id);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    const query = `
        SELECT
            u.userid,
            u.firstname,
            u.lastname,
            u.profilePicture,
            m.message_text AS lastMessage,
            m.created_at AS lastMessageAt,
            m.sender_id AS lastSenderId
        FROM (
            SELECT
                CASE
                    WHEN sender_id = ? THEN receiver_id
                    ELSE sender_id
                END AS otherUserId,
                MAX(message_id) AS latestMessageId
            FROM messages
            WHERE sender_id = ? OR receiver_id = ?
            GROUP BY otherUserId
        ) AS conversations

        JOIN messages AS m
            ON m.message_id = conversations.latestMessageId

        JOIN userregister AS u
            ON u.userid = conversations.otherUserId

        ORDER BY m.message_id DESC
    `;

    connection.query(query, [userId, userId, userId], (err, rows) => {
        if (err) {
            console.error("Get conversations error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to retrieve conversations"
            });
        }

        return res.status(200).json(rows);
    });
}
