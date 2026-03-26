"use server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { pool, logSecurityEvent } from "@/utils/db";

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("gams_session")?.value;
  
  // Get user before deleting session for logging
  let userId: string | null = null;
  if (sessionId) {
    const userResult = await pool.query(
      `SELECT user_id FROM gams_sessions WHERE id = $1 LIMIT 1;`,
      [sessionId]
    );
    userId = userResult.rows[0]?.user_id || null;
    
    // Log logout event
    if (userId) {
      await logSecurityEvent(userId, 'logout');
    }
    
    await pool.query(`DELETE FROM gams_sessions WHERE id = $1;`, [sessionId]);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("gams_session", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
