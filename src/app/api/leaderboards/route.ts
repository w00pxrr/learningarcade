"use server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { pool, ensureTables } from "@/utils/db";

async function getAuthenticatedUser(): Promise<{ id: string; username: string } | null> {
  await ensureTables();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("gams_session")?.value;
  if (!sessionId) return null;
  const result = await pool.query(
    `SELECT u.id, u.username
     FROM gams_sessions s
     JOIN gams_users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > NOW()
     LIMIT 1;`,
    [sessionId],
  );
  const row = result.rows[0];
  if (!row?.id || !row?.username) return null;
  return { id: row.id, username: row.username };
}

export async function GET(req: Request) {
  await ensureTables();
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("gameId")?.trim();
  const limitRaw = searchParams.get("limit");
  const limit = Math.min(50, Math.max(1, Number(limitRaw ?? "10") || 10));
  if (!gameId) {
    return NextResponse.json({ error: "Missing gameId" }, { status: 400 });
  }

  const user = await getAuthenticatedUser();
  const entriesResult = await pool.query(
    `SELECT u.username, MAX(l.score)::int AS score
     FROM gams_leaderboards l
     JOIN gams_users u ON u.id = l.user_id
     WHERE l.game_id = $1
     GROUP BY u.username
     ORDER BY score DESC
     LIMIT $2;`,
    [gameId, limit],
  );
  let meBest: number | null = null;
  if (user) {
    const best = await pool.query(
      `SELECT MAX(score)::int AS score
       FROM gams_leaderboards
       WHERE game_id = $1 AND user_id = $2;`,
      [gameId, user.id],
    );
    meBest = best.rows[0]?.score ?? null;
  }
  return NextResponse.json({
    entries: entriesResult.rows ?? [],
    meBest,
    user: user ? { username: user.username } : null,
  });
}

export async function POST(req: Request) {
  await ensureTables();
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  let payload: { gameId?: string; score?: number } | null = null;
  try {
    payload = (await req.json()) as { gameId?: string; score?: number };
  } catch {
    payload = null;
  }
  const gameId = payload?.gameId?.trim();
  const score = Number(payload?.score);
  if (!gameId || !Number.isFinite(score) || score < 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO gams_leaderboards (id, user_id, game_id, score)
     VALUES ($1, $2, $3, $4);`,
    [id, user.id, gameId, Math.round(score)],
  );
  return NextResponse.json({ ok: true });
}
