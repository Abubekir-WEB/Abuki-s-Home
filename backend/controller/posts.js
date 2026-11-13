import connection from '../db/dbConnection.js';

export default function uploadfile(req, res) {
    try {
        const { text } = req.body;
        const filePath = req.file?.path;

        const userid =
            req.user?.id ||
            req.user?.userid ||
            req.user?.userId ||
            req.user?._id;

        if (!filePath || !userid) {
            return res.status(400).json({
                error: "File or user ID is missing"
            });
        }

        const query = `
            INSERT INTO userpost (postPicture, postText, userid)
            VALUES (?, ?, ?)
        `;

        connection.query(query, [filePath, text, userid], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    error: err.sqlMessage || "Database Error"
                });
            }

            return res.status(201).json({
                message: "File uploaded successfully",
                postId: result.insertId
            });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Server Error" });
    }
}

export function getFile(req, res) {
    const userId = Number(req.user?.id);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    const query = `
        SELECT
            p.*,
            u.firstname,
            u.lastname,
            u.profilePicture,
            COALESCE(l.likeCount, 0) AS likeCount,
            COALESCE(v.viewCount, 0) AS viewCount,
            EXISTS (
                SELECT 1
                FROM likes AS my_like
                WHERE my_like.post_id = p.postid
                AND my_like.user_id = ?
            ) AS isLiked
        FROM userpost AS p
        JOIN userregister AS u
            ON p.userid = u.userid
        LEFT JOIN (
            SELECT post_id, COUNT(*) AS likeCount
            FROM likes
            GROUP BY post_id
        ) AS l ON l.post_id = p.postid
        LEFT JOIN (
            SELECT post_id, COUNT(*) AS viewCount
            FROM post_views
            GROUP BY post_id
        ) AS v ON v.post_id = p.postid
        ORDER BY p.postid DESC
    `;

    connection.query(query, [userId], (err, rows) => {
        if (err) {
            console.error("Get posts database error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to retrieve posts"
            });
        }

        return res.status(200).json(rows);
    });
}
export function recordPostView(req, res) {
    const userId = Number(req.user?.id);
    const postId = Number(req.params.postId);

    // Validate authenticated user
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

    // Insert a view only if this user hasn't viewed this post before.
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
                    console.error(checkErr);

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

                // Existing view: return the current count.
                return getPostViewCount(postId, res);
            });
        }

        return getPostViewCount(postId, res);
    });
}

// Helper function to retrieve the current view count.
function getPostViewCount(postId, res) {
    const countQuery = `
        SELECT COUNT(*) AS viewCount
        FROM post_views
        WHERE post_id = ?
    `;

    connection.query(countQuery, [postId], (err, rows) => {
        if (err) {
            console.error("Failed to retrieve view count:", err);

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