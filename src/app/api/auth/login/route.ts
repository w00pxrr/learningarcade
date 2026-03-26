"use server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { pool, ensureTables, logSecurityEvent } from "@/utils/db";

async function mergeAnonymousStorage(userId: string, anonId: string | null) {
  if (!anonId) return;
  await pool.query(
    `INSERT INTO gams_storage (user_id, key, value)
     SELECT $1, key, value FROM gams_storage
     WHERE user_id = $2
     ON CONFLICT (user_id, key)
     DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`,
    [userId, anonId],
  );
  await pool.query(`DELETE FROM gams_storage WHERE user_id = $1;`, [anonId]);
}

export async function POST(req: Request) {
  await ensureTables();
  let payload: { username?: string; password?: string } | null = null;
  try {
    payload = (await req.json()) as { username?: string; password?: string };
  } catch {
    payload = null;
  }
  const username = payload?.username?.trim() ?? "";
  const password = payload?.password ?? "";
  if (!username || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const result = await pool.query(
    `SELECT id, password_hash FROM gams_users WHERE username = $1 LIMIT 1;`,
    [username],
  );
  const row = result.rows[0];
  if (!row) {
    // Log failed login attempt - user not found
    await logSecurityEvent(null, 'login_failed', { username, reason: 'user_not_found' });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const ok = await compare(password, row.password_hash);
  if (!ok) {
    // Log failed login attempt - wrong password
    await logSecurityEvent(row.id, 'login_failed', { username, reason: 'wrong_password' });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Log successful login
  await logSecurityEvent(row.id, 'login_success', { username });

  const sessionId = crypto.randomUUID();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await pool.query(
    `INSERT INTO gams_sessions (id, user_id, expires_at)
     VALUES ($1, $2, $3);`,
    [sessionId, row.id, expires.toISOString()],
  );

  const cookieStore = await cookies();
  const anonId = cookieStore.get("gams_uid")?.value ?? null;
  await mergeAnonymousStorage(row.id, anonId);

  const response = NextResponse.json({ ok: true, username });
  response.cookies.set("gams_session", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
