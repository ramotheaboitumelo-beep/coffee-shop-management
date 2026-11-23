
import React, { useState } from "react";
import "./App.css";

function AdminLogin({ onLogin, onBack }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (event) => {
        event.preventDefault();

        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                "http://localhost:5000/api/admin/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ username, password })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed.");
            }

            onLogin(data.token);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login">
            <h2>Admin Login</h2>
            <p>Sign in to manage Coffee Corner.</p>

            <form onSubmit={handleLogin}>
                <label>Username</label>

                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter admin username"
                    required
                />

                <label>Password</label>

                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                />

                {error && <p className="error">{error}</p>}

                <button
                    type="submit"
                    className="order-button"
                    disabled={loading}
                >
                    {loading ? "Signing in..." : "Login"}
                </button>
            </form>

            <button
                type="button"
                className="cancel-button"
                onClick={onBack}
            >
                Back to Menu
            </button>
        </div>
    );
}

export default AdminLogin;
