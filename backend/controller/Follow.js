
import connection from "../db/dbConnection.js";

function Follow(req, res) {
  // ID of the logged-in user, obtained from the verified JWT
  const myid = Number(req.user?.id);

  // ID of the user to follow, provided by the frontend
  const userid = Number(req.body.userid);

  if (!Number.isInteger(myid) || myid <= 0) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!Number.isInteger(userid) || userid <= 0) {
    return res.status(400).json({
      success: false,
      message: "A valid user ID is required",
    });
  }

  if (myid === userid) {
    return res.status(400).json({
      success: false,
      message: "You cannot follow yourself",
    });
  }

  const query = `
    INSERT INTO follows (follower_id, following_id)
    VALUES (?, ?)
  `;

  connection.query(query, [myid, userid], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          success: false,
          message: "You already follow this user",
        });
      }

      console.error("Follow error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to follow user",
      });
    }

    return res.status(201).json({
      success: true,
      following: true,
      message: "Successfully followed user",
    });
  });
}

export default Follow;
