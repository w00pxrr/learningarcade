"use server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { pool, ensureTables, logSecurityEvent } from "@/utils/db";
import { checkRateLimit, getRateLimitMessage } from "@/utils/contentModeration";

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
  
  // Get IP address for rate limiting
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0] || 'unknown';
  
  // Check rate limit for registration
  if (!checkRateLimit(ip, 'registration')) {
    return NextResponse.json({ error: getRateLimitMessage('registration') }, { status: 429 });
  }
  
  let payload: { username?: string; password?: string; display_name?: string; school?: string; bio?: string } | null = null;
  try {
    payload = (await req.json()) as { username?: string; password?: string; display_name?: string; school?: string; bio?: string };
  } catch {
    payload = null;
  }
  const username = payload?.username?.trim() ?? "";
  const password = payload?.password ?? "";
  const displayName = payload?.display_name?.trim() ?? username;
  const school = payload?.school?.trim() ?? null;
  const bio = payload?.bio?.trim() ?? null;
  if (!username || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }
  if (username.length < 3 || username.length > 32) {
    return NextResponse.json({ error: "Username length invalid" }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: "Password too short" }, { status: 400 });
  }

  const existing = await pool.query(
    `SELECT 1 FROM gams_users WHERE username = $1 LIMIT 1;`,
    [username],
  );
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: "Username taken" }, { status: 409 });
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hash(password, 10);
  await pool.query(
    `INSERT INTO gams_users (id, username, password_hash, display_name, school, bio, oauth_provider)
     VALUES ($1, $2, $3, $4, $5, $6, 'local');`,
    [userId, username, passwordHash, displayName, school, bio],
  );

  // Log successful registration
  await logSecurityEvent(userId, 'register_success', { username });

  const sessionId = crypto.randomUUID();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await pool.query(
    `INSERT INTO gams_sessions (id, user_id, expires_at)
     VALUES ($1, $2, $3);`,
    [sessionId, userId, expires.toISOString()],
  );

  const cookieStore = await cookies();
  const anonId = cookieStore.get("gams_uid")?.value ?? null;
  await mergeAnonymousStorage(userId, anonId);

  const response = NextResponse.json({ ok: true, username });
  response.cookies.set("gams_session", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}
