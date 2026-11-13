import connection from '../db/dbConnection.js';

function Unfollow(req, res) {
    const followerId = req.user?.id;
    const followingId = Number(req.params.userid);
  
    // Validate authentication
    if (!followerId) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    // Validate target user ID
    if (!Number.isInteger(followingId) || followingId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID."
        });
    }

    // Prevent unfollowing yourself
    if (Number(followerId) === followingId) {
        return res.status(400).json({
            success: false,
            message: "You cannot unfollow yourself."
        });
    }

    const sql = `
        DELETE FROM follows
        WHERE follower_id = ?
        AND following_id = ?
    `;

    connection.query(
        sql,
        [followerId, followingId],
        (err, result) => {
            if (err) {
                console.error("Unfollow Error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to unfollow user."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "You are not following this user."
                });
            }

            return res.status(200).json({
                success: true,
                message: "Successfully unfollowed user."
            });
        }
    );
}

export default Unfollow;