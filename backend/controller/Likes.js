
import connection from "../db/dbConnection.js";

function likePost(req, res) {
    const userId = req.user?.id;
    const postId = Number(req.params.postId);

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    if (!Number.isSafeInteger(postId) || postId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid post ID"
        });
    }

    const sql = `
        INSERT INTO likes (user_id, post_id)
        VALUES (?, ?)
    `;

    connection.query(sql, [userId, postId], (err, result) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(200).json({
                    success: true,
                    isLiked: true,
                    message: "Post already liked"
                });
            }

            if (err.code === "ER_NO_REFERENCED_ROW_2") {
                return res.status(404).json({
                    success: false,
                    message: "User or post not found"
                });
            }

            console.error("Like error:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to like post"
            });
        }

        // Find the post owner and the name of the person who liked it.
        const notificationQuery = `
            SELECT
                p.userid AS recipientId,
                u.firstname,
                u.lastname
            FROM userpost p
            JOIN userregister u ON u.userid = ?
            WHERE p.postid = ?
        `;

        connection.query(
            notificationQuery,
            [userId, postId],
            (notificationErr, rows) => {

                if (notificationErr) {
                    console.error("Like notification error:", notificationErr);
                } else if (rows.length > 0) {
                    const postOwnerId = rows[0].recipientId;

                    // Don't notify someone about liking their own post.
                    if (String(postOwnerId) !== String(userId)) {
                        const io = req.app.get("io");

                        const notification = {
                            type: "like",
                            from: userId,
                            to: postOwnerId,
                            postId: postId,
                            text: `${rows[0].firstname} ${rows[0].lastname} liked your post`
                        };

                        if (io) {
                            io.to(`notification${postOwnerId}`)
                                .emit("newNotification", notification);
                        }
                    }
                }

                return res.status(201).json({
                    success: true,
                    isLiked: true,
                    message: "Post liked successfully"
                });
            }
        );
    });
}

function unlikePost(req, res) {
    const userId = req.user?.id;
    const postId = Number(req.params.postId);

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    if (!Number.isSafeInteger(postId) || postId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid post ID"
        });
    }

    const sql = `
        DELETE FROM likes
        WHERE user_id = ?
          AND post_id = ?
    `;

    connection.query(sql, [userId, postId], (err, result) => {
        if (err) {
            console.error("Unlike error:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to unlike post"
            });
        }

        return res.status(200).json({
            success: true,
            isLiked: false,
            message: "Post unliked successfully"
        });
    });
}

export { likePost, unlikePost };
