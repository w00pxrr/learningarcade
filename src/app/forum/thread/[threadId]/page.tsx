"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PrimaryNav } from "../../../../components/PrimaryNav";

type Reply = {
  id: string;
  content: string;
  created_at: string;
  author: string;
};

type Thread = {
  id: string;
  title: string;
  content: string;
  is_locked: boolean;
  author: string;
};

type User = { username: string } | null;

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.threadId as string;
  
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User>(null);
  const [newReply, setNewReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/forum/replies?thread=${encodeURIComponent(threadId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.thread) {
          setThread(data.thread);
          setReplies(data.replies || []);
        }
      })
      .catch(() => {
        setError("Failed to load thread");
      })
      .finally(() => setLoading(false));

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, [threadId]);

  const handleReply = async () => {
    if (!newReply.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/forum/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread: threadId,
          content: newReply,
        }),
      });
      
      if (res.ok) {
        setNewReply("");
        // Refresh replies
        const data = await fetch(`/api/forum/replies?thread=${encodeURIComponent(threadId)}`).then(r => r.json());
        setReplies(data.replies || []);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to post reply");
      }
    } catch {
      setError("Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        ) : thread ? (
          <>
            <section className="panel">
              <h2 className="panel-heading">
                {thread.is_locked && <span className="badge">🔒</span>}
                {thread.title}
              </h2>
              <p className="muted">by {thread.author}</p>
              <div className="forum-post-content">
                {thread.content}
              </div>
            </section>

            <section className="panel">
              <h3 className="panel-title">Replies ({replies.length})</h3>
              
              {replies.length === 0 ? (
                <p className="muted">No replies yet.</p>
              ) : (
                <div className="forum-replies">
                  {replies.map((reply) => (
                    <div key={reply.id} className="forum-reply">
                      <div className="forum-reply-header">
                        <span className="forum-reply-author">{reply.author}</span>
                        <span className="forum-reply-date">{formatDate(reply.created_at)}</span>
                      </div>
                      <div className="forum-reply-content">
                        {reply.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {user && !thread.is_locked ? (
              <section className="panel">
                <div className="ui-stack">
                  <label className="input-label">
                    Reply
                    <textarea
                      className="input"
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      placeholder="Write your reply..."
                      rows={4}
                      maxLength={5000}
                    />
                  </label>
                  <button 
                    className="btn btn-primary"
                    onClick={handleReply}
                    disabled={submitting || !newReply.trim()}
                  >
                    {submitting ? "Posting..." : "Post Reply"}
                  </button>
                </div>
              </section>
            ) : !user ? (
              <section className="panel">
                <p className="muted">
                  <Link href="/account" className="link">Sign in</Link> to reply.
                </p>
              </section>
            ) : thread.is_locked ? (
              <section className="panel">
                <p className="muted">This thread is locked.</p>
              </section>
            ) : null}
          </>
        ) : (
          <div className="panel">
            <p className="muted">Thread not found.</p>
          </div>
        )}
      </main>
    </div>
  );
}