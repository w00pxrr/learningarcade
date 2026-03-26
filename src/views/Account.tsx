"use client";

import React, { useEffect, useState } from "react";
import { PrimaryNav } from "../components/PrimaryNav";
import { hydrateAuthStorage, hydrateServerStorage } from "../utils/storage";

type User = { 
  username: string;
  display_name?: string;
  school?: string;
  bio?: string;
  role?: string;
  post_count?: number;
} | null;

export default function AccountPage() {
  const [user, setUser] = useState<User>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [school, setSchool] = useState("");
  const [bio, setBio] = useState("");

  const loadMe = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = (await res.json()) as { user: User };
      setUser(data.user);
      if (data.user) {
        setDisplayName(data.user.display_name || "");
        setSchool(data.user.school || "");
        setBio(data.user.bio || "");
      }
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
      await hydrateAuthStorage();
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

  const handleUpdateProfile = async () => {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          school: school,
          bio: bio,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error || "Failed to update profile.");
        return;
      }
      setStatus("Profile updated.");
      setEditingProfile(false);
      await loadMe();
    } catch {
      setStatus("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAvatarUrl = () => {
    return '/img/Screenshot 2026-03-26 at 15-52-54 Startpage Search Results.png';
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      owner: "badge-owner",
      moderator: "badge-moderator",
      contributor: "badge-contributor",
      member: "badge-member",
      newbie: "badge-newbie",
    };
    return roleColors[role] || "badge-member";
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
          <p className="muted">Log in if you do not have account.</p>
        </section>

        <section className="panel">
          {user ? (
            <div className="ui-stack">
              <div className="profile-header">
                <img
                  src={getDefaultAvatarUrl()}
                  alt={`${user.username}'s avatar`}
                  className="profile-avatar"
                />
                <div className="profile-info">
                  <div className="chip chip-accent">Signed in as {user.username}</div>
                  {user.role && (
                    <span className={`badge ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  )}
                </div>
              </div>

              {!editingProfile ? (
                <div className="ui-stack">
                  {user.display_name && (
                    <div className="profile-field">
                      <span className="profile-field-label">Display Name:</span>
                      <span className="profile-field-value">{user.display_name}</span>
                    </div>
                  )}
                  {user.school && (
                    <div className="profile-field">
                      <span className="profile-field-label">School:</span>
                      <span className="profile-field-value">{user.school}</span>
                    </div>
                  )}
                  {user.bio && (
                    <div className="profile-field">
                      <span className="profile-field-label">Bio:</span>
                      <span className="profile-field-value">{user.bio}</span>
                    </div>
                  )}
                  <button 
                    className="btn btn-outline" 
                    onClick={() => setEditingProfile(true)}
                  >
                    Edit Profile
                  </button>
                  <button className="btn btn-outline" onClick={handleLogout} disabled={loading}>
                    Log out
                  </button>
                </div>
              ) : (
                <div className="ui-stack">
                  <label className="input-label">
                    Display Name
                    <input
                      className="input"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="Your display name"
                      maxLength={50}
                    />
                  </label>
                  <label className="input-label">
                    School
                    <input
                      className="input"
                      value={school}
                      onChange={(event) => setSchool(event.target.value)}
                      placeholder="Your school"
                      maxLength={100}
                    />
                  </label>
                  <label className="input-label">
                    Bio
                    <textarea
                      className="input"
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      maxLength={500}
                    />
                  </label>
                  <div className="ui-row">
                    <button 
                      className="btn btn-primary" 
                      onClick={handleUpdateProfile}
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => setEditingProfile(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
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
