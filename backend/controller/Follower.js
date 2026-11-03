
import connection from "../db/dbConnection.js";
import jwt from "jsonwebtoken";

function Follower(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization token is required",
    });
  }

  const token = authHeader.split(" ")[1];

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  const userId = decoded.id ?? decoded.userid ?? decoded.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User ID not found in token",
    });
  }

  // Find people who follow the logged-in user
  const followersQuery = `
    SELECT
      u.userid,
      u.firstname,
      u.lastname,
      u.profilePicture
    FROM follows AS f
    JOIN userregister AS u
      ON f.follower_id = u.userid
    WHERE f.following_id = ?
  `;

  connection.execute(followersQuery, [userId], (err, followers) => {
    if (err) {
      console.error("Followers query error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve followers",
      });
    }

    // Find people the logged-in user follows
    const followingQuery = `
      SELECT
        u.userid,
        u.firstname,
        u.lastname,
        u.profilePicture
      FROM follows AS f
      JOIN userregister AS u
        ON f.following_id = u.userid
      WHERE f.follower_id = ?
    `;

    connection.execute(followingQuery, [userId], (err, following) => {
      if (err) {
        console.error("Following query error:", err);

        return res.status(500).json({
          success: false,
          message: "Failed to retrieve following",
        });
      }

      return res.status(200).json({
        success: true,
        followers,
        following,
      });
    });
  });
}

export default Follower;
