"use server";

import { NextResponse } from "next/server";
import { pool, ensureTables, getCurrentUser, updateUserPostCount } from "@/utils/db";
import { checkRateLimit, getRateLimitMessage, isContentClean, getContentViolationMessage } from "@/utils/contentModeration";

// GET - List threads in a category
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("category");
  
  if (!categoryId) {
    return NextResponse.json({ error: "Category required" }, { status: 400 });
  }
  
  await ensureTables();
  
  const result = await pool.query(`
    SELECT 
      t.id, t.title, t.is_pinned, t.is_locked, t.view_count, t.reply_count, t.created_at, t.updated_at,
      u.username as author,
      c.name as category_name
    FROM gams_forum_threads t
    JOIN gams_users u ON u.id = t.user_id
    JOIN gams_forum_categories c ON c.id = t.category_id
    WHERE t.category_id = $1
    ORDER BY t.is_pinned DESC, t.updated_at DESC
    LIMIT 50
  `, [categoryId]);
  
  const response = NextResponse.json({ threads: result.rows });
  // Cache for 1 minute - threads update frequently
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  return response;
}

// POST - Create a new thread (requires login)
export async function POST(request: Request) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  
  let payload: { category?: string; title?: string; content?: string } | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }
  
  const categoryId = payload?.category;
  const title = payload?.title?.trim() ?? "";
  const content = payload?.content?.trim() ?? "";
  
  if (!categoryId || !title || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (title.length < 3 || title.length > 200) {
    return NextResponse.json({ error: "Title must be 3-200 characters" }, { status: 400 });
  }
  
  if (content.length < 1 || content.length > 10000) {
    return NextResponse.json({ error: "Content must be 1-10000 characters" }, { status: 400 });
  }
  
  // Check rate limit for thread creation
  if (!checkRateLimit(user.id, 'threadCreation')) {
    return NextResponse.json({ error: getRateLimitMessage('threadCreation') }, { status: 429 });
  }
  
  // Check for profanity in title and content
  if (!isContentClean(title)) {
    return NextResponse.json({ error: getContentViolationMessage() }, { status: 400 });
  }
  
  if (!isContentClean(content)) {
    return NextResponse.json({ error: getContentViolationMessage() }, { status: 400 });
  }
  
  const threadId = crypto.randomUUID();
  await pool.query(`
    INSERT INTO gams_forum_threads (id, category_id, user_id, title, content)
    VALUES ($1, $2, $3, $4, $5)
  `, [threadId, categoryId, user.id, title, content]);
  
  // Update user's post count
  await updateUserPostCount(user.id);
  
  return NextResponse.json({ 
    ok: true, 
    thread: { id: threadId, title, content, author: user.username }
  });
}