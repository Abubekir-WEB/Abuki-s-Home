import db from "../db/dbConnection.js";

export function getRecommendations(req, res) {
    const currentUserId = req.user.id;

    const sql = `
        SELECT
            u.userid,
            u.firstname,
            u.lastname,
            u.profilePicture,
            u.bio,

            COALESCE(fc.follower_count, 0) AS followerCount,

            COALESCE(mc.mutual_count, 0) AS mutualCount

        FROM userregister u

        LEFT JOIN (
            SELECT
                following_id,
                COUNT(*) AS follower_count
            FROM follows
            GROUP BY following_id
        ) fc ON fc.following_id = u.userid

        LEFT JOIN (
            SELECT
                candidate.following_id,
                COUNT(*) AS mutual_count
            FROM follows my_following
            JOIN follows candidate
                ON candidate.follower_id = my_following.following_id
            WHERE my_following.follower_id = ?
            GROUP BY candidate.following_id
        ) mc ON mc.following_id = u.userid

        WHERE u.userid <> ?

        AND NOT EXISTS (
            SELECT 1
            FROM follows existing
            WHERE existing.follower_id = ?
              AND existing.following_id = u.userid
        )

        ORDER BY mutualCount DESC, followerCount DESC
        LIMIT 5
    `;

    db.query(
        sql,
        [currentUserId, currentUserId, currentUserId],
        (err, users) => {
            if (err) {
                console.error("Recommendations error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to load recommendations"
                });
            }

            return res.status(200).json({
                success: true,
                recommendations: users
            });
        }
    );
}