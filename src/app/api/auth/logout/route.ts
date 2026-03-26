"use server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({
  connectionString:
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    "",
});

// Log security events
async function logSecurityEvent(
  userId: string | null,
  eventType: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO gams_security_logs (id, user_id, event_type, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6);`,
      [
        id,
        userId,
        eventType,
        details.ip_address || null,
        details.user_agent || null,
        JSON.stringify(details),
      ]
    );
  } catch {
    // Silently fail - don't block logout for logging issues
  }
}

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
