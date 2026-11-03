import connection from "../db/dbConnection.js";

export function viewPost(req, res) {
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
        INSERT INTO post_views (user_id, post_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
            viewed_at = viewed_at
    `;

    connection.query(sql, [userId, postId], (err) => {
        if (err) {
            console.error("View error:", err);

            if (err.code === "ER_NO_REFERENCED_ROW_2") {
                return res.status(404).json({
                    success: false,
                    message: "User or post not found"
                });
            }

            return res.status(500).json({
                success: false,
                message: "Unable to record view"
            });
        }

        const countSql = `
            SELECT COUNT(*) AS viewCount
            FROM post_views
            WHERE post_id = ?
        `;

        connection.query(countSql, [postId], (countErr, rows) => {
            if (countErr) {
                console.error("View count error:", countErr);

                return res.status(500).json({
                    success: false,
                    message: "Unable to retrieve view count"
                });
            }

            return res.status(200).json({
                success: true,
                viewCount: rows[0].viewCount
            });
        });
    });
}