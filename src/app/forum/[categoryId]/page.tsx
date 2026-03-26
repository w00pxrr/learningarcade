"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PrimaryNav } from "../../../components/PrimaryNav";

type Thread = {
  id: string;
  title: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: string;
  reply_count: string;
  created_at: string;
  author: string;
  category_name: string;
};

type User = { username: string } | null;

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.categoryId as string;
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/forum/threads?category=${encodeURIComponent(categoryId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.threads) {
          setThreads(data.threads);
        }
      })
      .catch(() => {
        setError("Failed to load threads");
      })
      .finally(() => setLoading(false));

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, [categoryId]);

  const handleCreateThread = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: categoryId,
          title: newTitle,
          content: newContent,
        }),
      });
      
      if (res.ok) {
        setShowNewThread(false);
        setNewTitle("");
        setNewContent("");
        // Refresh threads
        const data = await fetch(`/api/forum/threads?category=${encodeURIComponent(categoryId)}`).then(r => r.json());
        setThreads(data.threads || []);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create thread");
      }
    } catch {
      setError("Failed to create thread");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="ui-page">
      <PrimaryNav />
      <main className="ui-container ui-container-md">
        <section className="panel">
          <div className="panel-header">
            <div>
              <Link href="/forum" className="muted">← Forum</Link>
              <h2 className="panel-heading">Threads</h2>
            </div>
            {user && (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowNewThread(!showNewThread)}
              >
                {showNewThread ? "Cancel" : "New Thread"}
              </button>
            )}
          </div>
        </section>

        {showNewThread && user && (
          <section className="panel">
            <div className="ui-stack">
              <label className="input-label">
                Title
                <input
                  className="input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter thread title"
                  maxLength={200}
                />
              </label>
              <label className="input-label">
                Content
                <textarea
                  className="input"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your post..."
                  rows={6}
                  maxLength={10000}
                />
              </label>
              <button 
                className="btn btn-primary"
                onClick={handleCreateThread}
                disabled={submitting || !newTitle.trim() || !newContent.trim()}
              >
                {submitting ? "Creating..." : "Create Thread"}
              </button>
            </div>
          </section>
        )}

        {loading ? (
          <div className="panel">
            <p className="muted">Loading...</p>
          </div>
        ) : error ? (
          <div className="panel">
            <p className="muted">{error}</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="panel">
            <p className="muted">No threads yet. Be the first to start a discussion!</p>
          </div>
        ) : (
          <div className="forum-threads">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/forum/thread/${thread.id}`}
                className={`forum-thread-card ${thread.is_pinned ? 'pinned' : ''}`}
              >
                <div className="forum-thread-info">
                  <h3 className="forum-thread-title">
                    {thread.is_pinned && <span className="badge">📌</span>}
                    {thread.is_locked && <span className="badge">🔒</span>}
                    {thread.title}
                  </h3>
                  <p className="forum-thread-meta">
                    by {thread.author} • {formatDate(thread.created_at)}
                  </p>
                </div>
                <div className="forum-thread-stats">
                  <span className="stat">{thread.reply_count} replies</span>
                  <span className="stat">{thread.view_count} views</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!user && (
          <section className="panel">
            <p className="muted">
              <Link href="/account" className="link">Sign in</Link> to post threads.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}