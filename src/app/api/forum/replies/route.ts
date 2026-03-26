"use server";

import { NextResponse } from "next/server";
import { pool, ensureTables, getCurrentUser } from "@/utils/db";

// GET - List replies in a thread
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("thread");
  
  if (!threadId) {
    return NextResponse.json({ error: "Thread required" }, { status: 400 });
  }
  
  await ensureTables();
  
  // Increment view count
  await pool.query(
    `UPDATE gams_forum_threads SET view_count = view_count + 1 WHERE id = $1`,
    [threadId]
  );
  
  const result = await pool.query(`
    SELECT 
      r.id, r.content, r.created_at, r.updated_at,
      u.username as author
    FROM gams_forum_replies r
    JOIN gams_users u ON u.id = r.user_id
    WHERE r.thread_id = $1
    ORDER BY r.created_at ASC
    LIMIT 100
  `, [threadId]);
  
  // Get thread info
  const threadResult = await pool.query(`
    SELECT id, title, content, is_locked, author
    FROM (
      SELECT t.id, t.title, t.content, t.is_locked, u.username as author
      FROM gams_forum_threads t
      JOIN gams_users u ON u.id = t.user_id
      WHERE t.id = $1
    ) AS thread
  `, [threadId]);
  
  return NextResponse.json({ 
    replies: result.rows,
    thread: threadResult.rows[0] || null
  });
}

// POST - Add a reply (requires login)
export async function POST(request: Request) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  
  let payload: { thread?: string; content?: string } | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }
  
  const threadId = payload?.thread;
  const content = payload?.content?.trim() ?? "";
  
  if (!threadId || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  
  if (content.length < 1 || content.length > 5000) {
    return NextResponse.json({ error: "Content must be 1-5000 characters" }, { status: 400 });
  }
  
  // Check if thread is locked
  const threadCheck = await pool.query(
    `SELECT is_locked FROM gams_forum_threads WHERE id = $1`,
    [threadId]
  );
  
  if (threadCheck.rows.length === 0) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }
  
  if (threadCheck.rows[0].is_locked) {
    return NextResponse.json({ error: "Thread is locked" }, { status: 403 });
  }
  
  const replyId = crypto.randomUUID();
  await pool.query(`
    INSERT INTO gams_forum_replies (id, thread_id, user_id, content)
    VALUES ($1, $2, $3, $4)
  `, [replyId, threadId, user.id, content]);
  
  // Update thread reply count and updated_at
  await pool.query(
    `UPDATE gams_forum_threads SET reply_count = reply_count + 1, updated_at = NOW() WHERE id = $1`,
    [threadId]
  );
  
  return NextResponse.json({ 
    ok: true, 
    reply: { id: replyId, content, author: user.username }
  });
}