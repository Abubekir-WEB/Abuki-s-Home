import connection from "../db/dbConnection.js";

function getUsers(req, res) {
  const currentUserId = req.user.id;

  const sql = `
    SELECT userid, firstname, lastname, profilePicture
    FROM userregister
    WHERE userid != ?
    ORDER BY firstname ASC
  `;

  connection.query(sql, [currentUserId], (err, results) => {
    if (err) {
      console.error("Get users error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to load users",
      });
    }

    return res.status(200).json({
      success: true,
      users: results,
    });
  });
}

export default getUsers;