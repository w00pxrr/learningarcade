"use server";

import { NextResponse } from "next/server";
import { pool, ensureTables, getCurrentUser } from "@/utils/db";

// POST - Update user profile
export async function POST(request: Request) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  
  let payload: { display_name?: string; school?: string; bio?: string } | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }
  
  const displayName = payload?.display_name?.trim() ?? null;
  const school = payload?.school?.trim() ?? null;
  const bio = payload?.bio?.trim() ?? null;
  
  await ensureTables();
  
  // Build dynamic update query
  const updates: string[] = [];
  const values: (string | null)[] = [];
  let paramIndex = 1;
  
  if (displayName !== null) {
    updates.push(`display_name = $${paramIndex++}`);
    values.push(displayName);
  }
  if (school !== null) {
    updates.push(`school = $${paramIndex++}`);
    values.push(school);
  }
  if (bio !== null) {
    updates.push(`bio = $${paramIndex++}`);
    values.push(bio);
  }
  
  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }
  
  values.push(user.id);
  await pool.query(
    `UPDATE gams_users SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
    values
  );
  
  return NextResponse.json({ ok: true });
}
