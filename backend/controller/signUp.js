import bcrypt from 'bcryptjs';
import connection from '../db/dbConnection.js';

async function signUp(req, res) {
    try {
        const { firstname, lastname, email, password } = req.body;

        if (!firstname || !lastname || !email || !password) {
            return res.status(400).json("All fields are required");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO userregister
            (firstname, lastname, email, password)
            VALUES (?, ?, ?, ?)
        `;

        connection.query(
            query,
            [firstname, lastname, email, hashedPassword],
            (err, result) => {
                if (err) {
                    console.log(err);

                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json("Email already exists");
                    }

                    return res.status(500).json("Signup failed");
                }

                return res.status(201).json("Successfully registered");
            }
        );

    } catch (error) {
        console.log(error);
        return res.status(500).json("Signup failed");
    }
}

export default signUp;