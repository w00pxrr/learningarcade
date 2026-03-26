"use server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { compare } from "bcryptjs";
import { ensureTables } from "@/utils/db";

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
    // Silently fail - don't block login for logging issues
  }
}
async function ensureAuthTables(): Promise<void> {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS gams_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
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
