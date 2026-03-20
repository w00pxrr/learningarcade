"use server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";

type StorageAction = "get" | "set" | "remove" | "bulk_get" | "bulk_all" | "bulk_set";

type StorageRequest = {
  action: StorageAction;
  key?: string;
  value?: string;
  keys?: string[];
  entries?: Record<string, string>;
};

const pool = new Pool({
  connectionString:
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    "",
});

let tableReady: Promise<void> | null = null;
let authTablesReady: Promise<void> | null = null;

async function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = pool
      .query(
        `CREATE TABLE IF NOT EXISTS gams_storage (
          user_id TEXT NOT NULL,
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, key)
        );`,
      )
      .then(() => undefined);
  }
  return tableReady;
}

async function ensureAuthTables(): Promise<void> {
  if (!authTablesReady) {
    authTablesReady = pool
      .query(
        `CREATE TABLE IF NOT EXISTS gams_users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
      )
      .then(() =>
        pool.query(
          `CREATE TABLE IF NOT EXISTS gams_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES gams_users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL
          );`,
        ),
      )
      .then(() => undefined);
  }
  return authTablesReady;
}

async function getOrCreateUserId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get("gams_uid")?.value;
  if (existing) return { id: existing, isNew: false };
  const id = crypto.randomUUID();
  return { id, isNew: true };
}

async function getAuthenticatedUserId(): Promise<string | null> {
  await ensureAuthTables();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("gams_session")?.value;
  if (!sessionId) return null;
  const result = await pool.query(
    `SELECT user_id FROM gams_sessions
     WHERE id = $1 AND expires_at > NOW()
     LIMIT 1;`,
    [sessionId],
  );
  return result.rows[0]?.user_id ?? null;
}

export async function POST(req: Request) {
  await ensureTable();
  const authUserId = await getAuthenticatedUserId();
  const { id: anonId, isNew } = await getOrCreateUserId();
  const userId = authUserId ?? anonId;
  let payload: StorageRequest | null = null;
  try {
    payload = (await req.json()) as StorageRequest;
  } catch {
    payload = null;
  }
  if (!payload || !payload.action) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const response = NextResponse.json(
    await handleAction(userId, payload),
    { status: 200 },
  );
  if (!authUserId && isNew) {
    response.cookies.set("gams_uid", anonId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

async function handleAction(userId: string, payload: StorageRequest) {
  switch (payload.action) {
    case "get": {
      if (!payload.key) return { value: null };
      const result = await pool.query(
        `SELECT value FROM gams_storage
         WHERE user_id = $1 AND key = $2
         LIMIT 1;`,
        [userId, payload.key],
      );
      return { value: result.rows[0]?.value ?? null };
    }
    case "set": {
      if (!payload.key || typeof payload.value !== "string") {
        return { ok: false };
      }
      await pool.query(
        `INSERT INTO gams_storage (user_id, key, value)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, key)
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`,
        [userId, payload.key, payload.value],
      );
      return { ok: true };
    }
    case "remove": {
      if (!payload.key) return { ok: false };
      await pool.query(
        `DELETE FROM gams_storage WHERE user_id = $1 AND key = $2;`,
        [userId, payload.key],
      );
      return { ok: true };
    }
    case "bulk_get": {
      const keys = Array.isArray(payload.keys) ? payload.keys : [];
      if (keys.length === 0) return { entries: {} };
      const result = await pool.query(
        `SELECT key, value FROM gams_storage
         WHERE user_id = $1 AND key = ANY($2);`,
        [userId, keys],
      );
      const entries: Record<string, string> = {};
      for (const row of result.rows) {
        if (row.key && typeof row.value === "string") {
          entries[row.key] = row.value;
        }
      }
      return { entries };
    }
    case "bulk_all": {
      const result = await pool.query(
        `SELECT key, value FROM gams_storage
         WHERE user_id = $1;`,
        [userId],
      );
      const entries: Record<string, string> = {};
      for (const row of result.rows) {
        if (row.key && typeof row.value === "string") {
          entries[row.key] = row.value;
        }
      }
      return { entries };
    }
    case "bulk_set": {
      const entries = payload.entries;
      if (!entries || typeof entries !== "object") return { ok: false };
      const keys = Object.keys(entries);
      if (keys.length === 0) return { ok: true };
      const values = keys.map((key) => entries[key] ?? "");
      await pool.query(
        `INSERT INTO gams_storage (user_id, key, value)
         SELECT $1, key, value
         FROM UNNEST($2::text[], $3::text[]) AS t(key, value)
         ON CONFLICT (user_id, key)
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`,
        [userId, keys, values],
      );
      return { ok: true };
    }
    default:
      return { ok: false };
  }
}
