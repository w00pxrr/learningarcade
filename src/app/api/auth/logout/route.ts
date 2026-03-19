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

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("gams_session")?.value;
  if (sessionId) {
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
