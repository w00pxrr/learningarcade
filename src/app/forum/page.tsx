"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PrimaryNav } from "../../components/PrimaryNav";

type Category = {
  id: string;
  name: string;
  description: string;
  display_order: number;
  thread_count: string;
  reply_count: string;
};

type User = { username: string } | null;

export default function ForumPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    // Fetch categories
    fetch("/api/forum/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
        }
      })
      .catch(() => {
        setError("Failed to load forum");
      })
      .finally(() => setLoading(false));

    // Check auth status
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  return (
    <div className="ui-page">
      <PrimaryNav />
      <main className="ui-container ui-container-md">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-heading">Forum</h2>
              <p className="muted">Discuss games, share tips, and connect with other players.</p>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="panel">
            <p className="muted">Loading...</p>
          </div>
        ) : error ? (
          <div className="panel">
            <p className="muted">{error}</p>
          </div>
        ) : (
          <div className="forum-categories">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/forum/${category.id}`}
                className="forum-category-card"
              >
                <div className="forum-category-info">
                  <h3 className="forum-category-name">{category.name}</h3>
                  <p className="forum-category-desc">{category.description}</p>
                </div>
                <div className="forum-category-stats">
                  <span className="stat">{parseInt(category.thread_count) || 0} threads</span>
                  <span className="stat">{parseInt(category.reply_count) || 0} replies</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!user && (
          <section className="panel">
            <p className="muted">
              <Link href="/account" className="link">Sign in</Link> to post threads and replies.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}