"use client";

import React, { useEffect, useState } from "react";
import { PrimaryNav } from "../components/PrimaryNav";
import { hydrateServerStorage } from "../utils/storage";

type User = { username: string } | null;

export default function AccountPage() {
  const [user, setUser] = useState<User>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const loadMe = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = (await res.json()) as { user: User };
      setUser(data.user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    hydrateServerStorage();
    void loadMe();
  }, []);

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
      await loadMe();
      hydrateServerStorage();
    } catch {
      setStatus("Request failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setStatus("");
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setStatus("Logged out.");
      setUser(null);
    } catch {
      setStatus("Logout failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-page">
      <PrimaryNav />
      <main className="ui-container ui-container-md">
        <section className="panel">
          <h2 className="panel-heading">Account</h2>
          <p className="muted">
            Create a username and password to sync preferences across devices.
          </p>
        </section>

        <section className="panel">
          {user ? (
            <div className="ui-stack">
              <div className="chip chip-accent">Signed in as {user.username}</div>
              <button className="btn btn-outline" onClick={handleLogout} disabled={loading}>
                Log out
              </button>
            </div>
          ) : (
            <div className="ui-stack">
              <label className="input-label">
                Username
                <input
                  className="input"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
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
                />
              </label>
              <div className="ui-row">
                <button
                  className="btn btn-primary"
                  onClick={() => handleAuth("login")}
                  disabled={loading}
                >
                  Log in
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => handleAuth("register")}
                  disabled={loading}
                >
                  Create account
                </button>
              </div>
            </div>
          )}
          {status ? <p className="muted small">{status}</p> : null}
        </section>
      </main>
    </div>
  );
}
