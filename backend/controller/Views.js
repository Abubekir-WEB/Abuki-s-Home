import connection from "../db/dbConnection.js";

export function viewPost(req, res) {
    const userId = Number(req.user?.id);
    const postId = Number(req.params.postId);

    // Validate user authentication
    if (!Number.isSafeInteger(userId) || userId <= 0) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    // Validate post ID
    if (!Number.isSafeInteger(postId) || postId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid post ID"
        });
    }

    // Insert a unique view for this user and post.
    const insertQuery = `
        INSERT IGNORE INTO post_views (user_id, post_id)
        SELECT ?, postid
        FROM userpost
        WHERE postid = ?
    `;

    connection.query(insertQuery, [userId, postId], (err, result) => {
        if (err) {
            console.error("Failed to record post view:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to record post view"
            });
        }

        // Check whether the post exists.
        if (result.affectedRows === 0) {
            const checkQuery = `
                SELECT postid
                FROM userpost
                WHERE postid = ?
            `;

            return connection.query(checkQuery, [postId], (checkErr, rows) => {
                if (checkErr) {
                    console.error("Post check error:", checkErr);

                    return res.status(500).json({
                        success: false,
                        message: "Failed to check post"
                    });
                }

                if (rows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Post not found"
                    });
                }

                return getPostViewCount(postId, res);
            });
        }

        return getPostViewCount(postId, res);
    });
}

function getPostViewCount(postId, res) {
    const countQuery = `
        SELECT COUNT(*) AS viewCount
        FROM post_views
        WHERE post_id = ?
    `;

    connection.query(countQuery, [postId], (err, rows) => {
        if (err) {
            console.error("View count error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to retrieve view count"
            });
        }

        return res.status(200).json({
            success: true,
            viewCount: Number(rows[0].viewCount)
        });
    });
}