import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    async function handlesubmit(e) {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:4000/user/login",
                {
                    email,
                    password
                }
            );

            console.log(response.data);

            // Save JWT token
            localStorage.setItem("token", response.data);

            // Navigate after successful login
            navigate("/posts");

        } catch (error) {
            console.error("Login Error:", error);

            setError(
                error.response?.data || "Login failed. Please try again."
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <form onSubmit={handlesubmit}>

                <label>Enter Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                />

                <label>Enter Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                />

                {error && <p style={{ color: "red" }}>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>

            </form>

            <p>
                Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
        </div>
    );
}

export default Login;