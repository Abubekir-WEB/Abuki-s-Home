
import db from "../db/dbConnection.js";

export function getTrendingTopics(req, res) {

    const sql = `
        SELECT postid, postText
        FROM userpost
        WHERE postText IS NOT NULL
          AND postText <> ''
        ORDER BY postid DESC
        LIMIT 500
    `;

    db.query(sql, (err, posts) => {

        if (err) {
            console.error("Trending topics error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to load trending topics"
            });
        }

        // Store each hashtag and the number of posts containing it.
        const topics = Object.create(null);

        posts.forEach((post) => {

            if (typeof post.postText !== "string") {
                return;
            }

            // Extract all hashtags from this post.
            const hashtags =
                post.postText.match(/#[\p{L}\p{N}_]+/gu) || [];

            // Prevent counting the same hashtag twice in one post.
            const uniqueHashtags = new Set(
                hashtags.map((tag) => tag.toLowerCase())
            );

            uniqueHashtags.forEach((normalized) => {

                if (!topics[normalized]) {
                    topics[normalized] = {
                        hashtag: hashtags.find(
                            (tag) => tag.toLowerCase() === normalized
                        ),
                        count: 0
                    };
                }

                topics[normalized].count++;
            });
        });

        // Sort from most popular to least popular.
        const trending = Object.values(topics)
            .sort((a, b) => {
                if (b.count !== a.count) {
                    return b.count - a.count;
                }

                return a.hashtag.localeCompare(b.hashtag);
            })
            .slice(0, 5);

        return res.status(200).json({
            success: true,
            trends: trending
        });

    });
}
