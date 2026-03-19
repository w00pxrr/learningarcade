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

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("gams_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ user: null });
  }
  const result = await pool.query(
    `SELECT u.username
     FROM gams_sessions s
     JOIN gams_users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > NOW()
     LIMIT 1;`,
    [sessionId],
  );
  const username = result.rows[0]?.username ?? null;
  return NextResponse.json({ user: username ? { username } : null });
}
