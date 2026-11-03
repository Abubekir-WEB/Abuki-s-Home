
import connection from "../db/dbConnection.js";

// Get a user's profile and posts
function Profile(req, res) {
  const userid = Number(req.params.userid);

  console.log("Profile controller reached:", req.params.userid);

  // Validate the user ID
  if (!Number.isSafeInteger(userid) || userid <= 0) {
    return res.status(400).json({
      success: false,
      message: "A valid user ID is required",
    });
  }

  const userQuery = `
    SELECT
      u.userid,
      u.firstname,
      u.lastname,
      u.profilePicture,
      u.bio,

      (
        SELECT COUNT(*)
        FROM follows AS f
        WHERE f.follower_id = u.userid
      ) AS followingCount,

      (
        SELECT COUNT(*)
        FROM follows AS f
        WHERE f.following_id = u.userid
      ) AS followerCount

    FROM userregister AS u
    WHERE u.userid = ?
  `;

  connection.query(userQuery, [userid], (err, users) => {
    if (err) {
      console.error("Profile query failed:", err.code, err.message);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve profile",
      });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const postQuery = `
      SELECT *
      FROM userpost
      WHERE userid = ?
      ORDER BY postid DESC
    `;

    connection.query(postQuery, [userid], (postErr, posts) => {
      if (postErr) {
        console.error("Profile posts query failed:", postErr.code, postErr.message);

        return res.status(500).json({
          success: false,
          message: "Failed to retrieve user posts",
        });
      }

      return res.status(200).json({
        success: true,
        user: users[0],
        posts: posts || [],
      });
    });
  });
}

export default Profile;
