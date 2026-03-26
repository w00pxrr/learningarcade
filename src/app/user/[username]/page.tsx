"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PrimaryNav } from "../../../components/PrimaryNav";

type UserProfile = {
  id: string;
  username: string;
  display_name: string | null;
  school: string | null;
  bio: string | null;
  role: string;
  post_count: number;
  created_at: string;
  thread_count: number;
  reply_count: number;
};

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/user/${encodeURIComponent(username)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setProfile(data.user);
        } else {
          setError(data.error || "User not found");
        }
      })
      .catch(() => {
        setError("Failed to load user profile");
      })
      .finally(() => setLoading(false));
  }, [username]);

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="ui-page">
      <PrimaryNav />
      <main className="ui-container ui-container-md">
        <section className="panel">
          <div className="panel-header">
            <Link href="/forum" className="muted">← Back to Forum</Link>
          </div>
        </section>

        {loading ? (
          <div className="panel">
            <p className="muted">Loading profile...</p>
          </div>
        ) : error ? (
          <div className="panel">
            <p className="muted">{error}</p>
          </div>
        ) : profile ? (
          <>
            <section className="panel">
              <div className="profile-header">
                <img
                  src={getDefaultAvatarUrl()}
                  alt={`${profile.username}'s avatar`}
                  className="profile-avatar"
                />
                <div className="profile-info">
                  <h2 className="profile-username">{profile.display_name || profile.username}</h2>
                  <span className={`badge ${getRoleBadge(profile.role)}`}>
                    {profile.role}
                  </span>
                  {profile.school && (
                    <p className="profile-school">{profile.school}</p>
                  )}
                  <p className="muted">Member since {formatDate(profile.created_at)}</p>
                </div>
              </div>
            </section>

            {profile.bio && (
              <section className="panel">
                <h3 className="panel-title">Bio</h3>
                <p className="profile-bio">{profile.bio}</p>
              </section>
            )}

            <section className="panel">
              <h3 className="panel-title">Statistics</h3>
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-value">{profile.thread_count}</span>
                  <span className="stat-label">Threads</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{profile.reply_count}</span>
                  <span className="stat-label">Replies</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{profile.post_count}</span>
                  <span className="stat-label">Total Posts</span>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
