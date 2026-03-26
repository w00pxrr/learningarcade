"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (endpoint: "login" | "register") => {
    if (!username || !password) {
      setStatus("Enter a username and password.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch(`/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error || "Request failed.");
        return;
      }
      setStatus(endpoint === "login" ? "Logged in." : "Account created.");
      setPassword("");
      // Redirect to forum after successful login
      router.push("/forum");
    } catch {
      setStatus("Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">GAMS Forum</h1>
          <p className="login-subtitle">Sign in to access the forum</p>
        </div>

        <div className="login-form">
          <label className="input-label">
            Username
            <input
              className="input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="Enter your username"
            />
          </label>
          <label className="input-label">
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
            />
          </label>
          <div className="login-buttons">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => handleAuth("login")}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={() => handleAuth("register")}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
          {status ? <p className="login-status">{status}</p> : null}
        </div>
      </div>
    </div>
  );
}
