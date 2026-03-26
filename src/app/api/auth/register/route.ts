"use server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";

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
    // Silently fail - don't block registration for logging issues
  }
}

async function ensureAuthTables(): Promise<void> {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS gams_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      school TEXT,
      bio TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,
  );
  await pool.query(
    `CREATE TABLE IF NOT EXISTS gams_storage (
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, key)
    );`,
  );
  await pool.query(
    `CREATE TABLE IF NOT EXISTS gams_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES gams_users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );`,
  );
  // Ensure security logs table exists
  await pool.query(
    `CREATE TABLE IF NOT EXISTS gams_security_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES gams_users(id) ON DELETE SET NULL,
      event_type TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      details JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,
  );
}

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
  await ensureAuthTables();
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
    `INSERT INTO gams_users (id, username, password_hash, display_name, school, bio)
     VALUES ($1, $2, $3, $4, $5, $6);`,
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
  return response;
}
