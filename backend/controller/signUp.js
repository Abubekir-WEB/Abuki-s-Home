
import bcrypt from 'bcryptjs';
import connection from '../db/dbConnection.js';
import validator from 'validator';

async function signUp(req, res) {
    try {
        const { firstname, lastname, email, password } = req.body;

        // 1. Check required fields
        if (!firstname || !lastname || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // 2. Ensure inputs are strings
        if (
            typeof firstname !== 'string' ||
            typeof lastname !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string'
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input types'
            });
        }

        // 3. Trim unnecessary whitespace
        const cleanFirstname = firstname.trim();
        const cleanLastname = lastname.trim();
        const cleanEmail = email.trim().toLowerCase();

        // 4. Validate names
        if (
            cleanFirstname.length < 2 ||
            cleanFirstname.length > 50 ||
            cleanLastname.length < 2 ||
            cleanLastname.length > 50
        ) {
            return res.status(400).json({
                success: false,
                message: 'Names must be between 2 and 50 characters'
            });
        }

        // 5. Validate email format
        if (!validator.isEmail(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // 6. Validate password length
        if (password.length < 8 || password.length > 72) {
            return res.status(400).json({
                success: false,
                message: 'Password must be between 8 and 72 characters'
            });
        }

        // 7. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 8. Insert user using parameterized SQL
        const query = `
            INSERT INTO userregister
            (firstname, lastname, email, password)
            VALUES (?, ?, ?, ?)
        `;

        connection.query(
            query,
            [
                cleanFirstname,
                cleanLastname,
                cleanEmail,
                hashedPassword
            ],
            (err, result) => {

                // 9. Handle database errors
                if (err) {
                    console.error('Signup database error:', err.code);

                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({
                            success: false,
                            message: 'Email already exists'
                        });
                    }

                    return res.status(500).json({
                        success: false,
                        message: 'Signup failed'
                    });
                }

                // 10. Successful registration
                return res.status(201).json({
                    success: true,
                    message: 'Successfully registered'
                });
            }
        );

    } catch (error) {
        console.error('Signup error:', error);

        return res.status(500).json({
            success: false,
            message: 'Signup failed'
        });
    }
}

export default signUp;
