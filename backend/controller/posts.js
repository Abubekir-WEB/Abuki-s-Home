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
    const userId = req.user?.id;

    // Ensure the user is authenticated
    if (!userId) {
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
            SELECT
                post_id,
                COUNT(*) AS likeCount
            FROM likes
            GROUP BY post_id
        ) AS l
            ON l.post_id = p.postid

        ORDER BY p.postid DESC
    `;

    connection.query(query, [userId], (err, rows) => {
        if (err) {
            console.error("Failed to fetch posts:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch posts"
            });
        }

        return res.status(200).json(rows);
    });
}