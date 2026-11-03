import connection from "../db/dbConnection.js";

function FollowingFeed(req, res) {
    // 1. Get authenticated user's ID from JWT
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "User authentication required."
        });
    }

    // 2. SQL query to retrieve posts from followed users
    const sql = `
        SELECT
            p.*,
            u.firstname,
            u.lastname,
            u.profilePicture
        FROM userpost AS p

        INNER JOIN follows AS f
            ON f.following_id = p.userid

        INNER JOIN userregister AS u
            ON u.userid = p.userid

        WHERE f.follower_id = ?

        ORDER BY p.postid DESC
    `;

    // 3. Execute query using callback
    connection.query(sql, [userId], (err, posts) => {

        if (err) {
            console.error("Following Feed Error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to load Following feed."
            });
        }

        // 4. Return posts
        return res.status(200).json({
            success: true,
            message: "Following feed loaded successfully.",
            count: posts.length,
            posts: posts
        });
    });
}

export default FollowingFeed;