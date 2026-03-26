"use server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { pool } from "@/utils/db";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("gams_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ user: null });
  }
  const result = await pool.query(
    `SELECT u.username, u.display_name, u.school, u.bio, u.role, u.post_count
     FROM gams_sessions s
     JOIN gams_users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > NOW()
     LIMIT 1;`,
    [sessionId],
  );
  const user = result.rows[0] ?? null;
  return NextResponse.json({ user });
}
