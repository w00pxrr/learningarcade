"use server";

import { NextResponse } from "next/server";
import { pool, ensureTables } from "@/utils/db";

// GET - Get user profile by username
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  
  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }
  
  await ensureTables();
  
  const result = await pool.query(`
    SELECT 
      u.id, u.username, u.display_name, u.school, u.bio, u.role, u.post_count, u.oauth_provider, u.created_at,
      (SELECT COUNT(*) FROM gams_forum_threads WHERE user_id = u.id) as thread_count,
      (SELECT COUNT(*) FROM gams_forum_replies WHERE user_id = u.id) as reply_count
    FROM gams_users u
    WHERE u.username = $1
    LIMIT 1
  `, [username]);
  
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  
  return NextResponse.json({ user: result.rows[0] });
}
