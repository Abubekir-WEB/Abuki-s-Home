import connection from "../db/dbConnection.js";

function likePost(req, res) {
    const userId = req.user?.id;
    const postId = Number(req.params.postId);
   
    
    // 1. Check authentication
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    // 2. Validate the post ID
    if (!Number.isSafeInteger(postId) || postId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid post ID"
        });
    }

    // 3. Insert the like
    const sql = `
        INSERT INTO likes (user_id, post_id)
        VALUES (?, ?)
    `;

    connection.query(sql, [userId, postId], (err, result) => {
        if (err) {
            // The user already liked this post
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(200).json({
                    success: true,
                    isLiked: true,
                    message: "Post already liked"
                });
            }

            // The post or user does not exist
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

        return res.status(201).json({
            success: true,
            isLiked: true,
            message: "Post liked successfully"
        });
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