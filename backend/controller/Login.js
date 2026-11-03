import connection from '../db/dbConnection.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function Login(req, res) {
    console.log("1. Login request received");

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json("Email and password are required");
    }

    const query = 'SELECT * FROM userregister WHERE email = ?';

    connection.query(query, [email], async (err, result) => {
        console.log("2. Database query completed");

        if (err) {
            console.log("Database error:", err);
            return res.status(500).json("Login failed");
        }

        if (result.length === 0) {
            console.log("3. User not found");
            return res.status(404).json("User Not Found");
        }

        try {
            const user = result[0];

            console.log("3. User found:", user.email);
            console.log("4. Comparing passwords...");

            const isMatch = await bcrypt.compare(
                password,
                user.password
            );

            console.log("5. Password comparison:", isMatch);

            if (!isMatch) {
                return res.status(401).json("Invalid credential");
            }

            const jwtSecretKey = process.env.JWT_SECRET_KEY;

            if (!jwtSecretKey) {
                console.error("JWT_SECRET_KEY is missing");
                return res.status(500).json("Server configuration error");
            }

            const data = {
                id: user.userid,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname
            };

            const token = jwt.sign(data, jwtSecretKey, {
                expiresIn: '7d'
            });

            console.log("6. Token generated successfully");

            return res.status(200).json(token);

        } catch (error) {
            console.error("Login error:", error);
            return res.status(500).json("Login failed");
        }
    });
}

export default Login;