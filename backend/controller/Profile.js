
import connection from "../db/dbConnection.js";

// Get a user's profile and posts
function Profile(req, res) {
  const userid = Number(req.params.userid);

  console.log("Profile controller reached:", req.params.userid);

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
        console.error(
          "Profile posts query failed:",
          postErr.code,
          postErr.message
        );

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


// Update the logged-in user's profile details
export function updateProfile(req, res) {
  const userid = req.user?.id;

  if (!userid) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const { firstname, lastname, bio } = req.body;

  if (
    typeof firstname !== "string" ||
    typeof lastname !== "string" ||
    typeof bio !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "First name, last name and bio are required",
    });
  }

  const cleanFirstname = firstname.trim();
  const cleanLastname = lastname.trim();
  const cleanBio = bio.trim();

  if (!cleanFirstname || !cleanLastname) {
    return res.status(400).json({
      success: false,
      message: "First name and last name cannot be empty",
    });
  }

  if (cleanFirstname.length > 100 || cleanLastname.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Names must be 100 characters or fewer",
    });
  }

  if (cleanBio.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Bio must be 500 characters or fewer",
    });
  }

  const sql = `
    UPDATE userregister
    SET firstname = ?, lastname = ?, bio = ?
    WHERE userid = ?
  `;

  connection.query(
    sql,
    [cleanFirstname, cleanLastname, cleanBio, userid],
    (err, result) => {
      if (err) {
        console.error("Profile update failed:", err);

        return res.status(500).json({
          success: false,
          message: "Failed to update profile",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
      });
    }
  );
}


// Upload or replace the logged-in user's profile picture
export function uploadProfilePicture(req, res) {
  const userid = req.user?.id;

  if (!userid) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please select a profile picture",
    });
  }

  const profilePicture = `uploads/${req.file.filename}`;

  const sql = `
    UPDATE userregister
    SET profilePicture = ?
    WHERE userid = ?
  `;

  connection.query(
    sql,
    [profilePicture, userid],
    (err, result) => {
      if (err) {
        console.error("Profile picture update failed:", err);

        return res.status(500).json({
          success: false,
          message: "Failed to update profile picture",
        });
      }

   

      return res.status(200).json({
        success: true,
        message: "Profile picture updated successfully",
        profilePicture,
      });
    }
  );
}

export default Profile;
