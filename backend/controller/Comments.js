import connection from "../db/dbConnection.js";



export function addComment(req, res) {
    const userId = req.user?.id;
    const postId = Number(req.params.postId);
    const commentText =
        typeof req.body?.commentText === "string"
            ? req.body.commentText.trim()
            : "";

    // Validate authentication
    if (!userId) {
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

    // Validate comment
    if (!commentText || commentText.length > 2000) {
        return res.status(400).json({
            success: false,
            message: "Comment must contain between 1 and 2000 characters"
        });
    }

    console.log("Adding comment:", {
        userId,
        postId
    });

    const sql = `
        INSERT INTO comments (user_id, post_id, comment_text)
        VALUES (?, ?, ?)
    `;

    connection.query(
        sql,
        [userId, postId, commentText],
        (err, result) => {
            if (err) {
                console.error("Comment insert failed:", {
                    code: err.code,
                    message: err.message,
                    userId,
                    postId
                });

                if (err.code === "ER_NO_REFERENCED_ROW_2") {
                    return res.status(404).json({
                        success: false,
                        message: "User or post not found"
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Unable to add comment"
                });
            }

            return res.status(201).json({
                success: true,
                message: "Comment added successfully",
                commentId: result.insertId
            });
        }
    );
}

export function getComments(req, res) {
    const postId = Number(req.params.postId);

    if (!Number.isSafeInteger(postId) || postId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid post ID"
        });
    }

    const sql = `
        SELECT
            c.comment_id,
            c.post_id,
            c.user_id,
            c.comment_text,
            c.created_at,
            u.firstname,
            u.lastname,
            u.profilePicture
        FROM comments AS c
        JOIN userregister AS u
            ON c.user_id = u.userid
        WHERE c.post_id = ?
        ORDER BY c.created_at DESC, c.comment_id DESC
    `;

    connection.query(sql, [postId], (err, rows) => {
        if (err) {
            console.error("Get comments error:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to retrieve comments"
            });
        }

        return res.status(200).json(rows);
    });
}