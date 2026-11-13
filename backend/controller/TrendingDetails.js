
import db from "../db/dbConnection.js";

export function getTrendingDetails(req, res) {
    const hashtag = req.params.hashtag;
    const currentUserId = req.user.id;

    // Only allow valid hashtag characters.
    if (!/^[\p{L}\p{N}_]+$/u.test(hashtag)) {
        return res.status(400).json({
            success: false,
            message: "Invalid hashtag"
        });
    }

    const sql = `
        SELECT
            p.postid,
            p.postText,
            p.postPicture,
            p.userid,
            u.firstname,
            u.lastname,
            u.profilePicture,

            (SELECT COUNT(*)
             FROM likes l
             WHERE l.post_id = p.postid) AS likeCount,

            (SELECT COUNT(*)
             FROM likes l
             WHERE l.post_id = p.postid
               AND l.user_id = ?) AS isLiked,

            (SELECT COUNT(*)
             FROM post_views v
             WHERE v.post_id = p.postid) AS viewCount

        FROM userpost p

        JOIN userregister u
            ON p.userid = u.userid

        WHERE p.postText LIKE ?

        ORDER BY p.postid DESC
    `;

    db.query(
        sql,
        [currentUserId, `%#${hashtag}%`],
        (err, posts) => {
            if (err) {
                console.error("Trending details error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to load trending posts"
                });
            }

            const escapedHashtag = hashtag.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            const hashtagRegex = new RegExp(
                `#${escapedHashtag}(?![\\p{L}\\p{N}_])`,
                "iu"
            );

            const filteredPosts = posts.filter(post =>
                hashtagRegex.test(post.postText || "")
            );

            return res.status(200).json({
                success: true,
                hashtag: `#${hashtag}`,
                count: filteredPosts.length,
                posts: filteredPosts
            });
        }
    );
}
