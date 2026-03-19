"use server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { hash } from "bcryptjs";

const pool = new Pool({
  connectionString:
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    "",
});

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
    `INSERT INTO gams_users (id, username, password_hash)
     VALUES ($1, $2, $3);`,
    [userId, username, passwordHash],
  );

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
  return response;
}
