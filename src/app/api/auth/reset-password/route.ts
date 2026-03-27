"use server";

import { NextResponse } from "next/server";
import { pool, ensureTables } from "@/utils/db";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  await ensureTables();
  
  let payload: { phoneNumber?: string; code?: string; newPassword?: string } | null = null;
  try {
    payload = (await req.json()) as { phoneNumber?: string; code?: string; newPassword?: string };
  } catch {
    payload = null;
  }

  const phoneNumber = payload?.phoneNumber?.trim() ?? "";
  const code = payload?.code?.trim() ?? "";
  const newPassword = payload?.newPassword ?? "";
  
  if (!phoneNumber || !code || !newPassword) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  try {
    // Find the reset token and user
    const result = await pool.query(
      `SELECT pr.user_id, pr.reset_token, pr.reset_token_expires
       FROM gams_password_resets pr
       JOIN gams_user_phones up ON pr.user_id = up.user_id
       WHERE pr.code = $1 AND pr.reset_token_expires > NOW()
       LIMIT 1;`,
      [code]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    const userId = result.rows[0].user_id;

    // Hash the new password
    const passwordHash = await hash(newPassword, 12);

    // Update the password
    await pool.query(
      `UPDATE gams_users SET password_hash = $1 WHERE id = $2;`,
      [passwordHash, userId]
    );

    // Delete the reset token
    await pool.query(
      `DELETE FROM gams_password_resets WHERE user_id = $1;`,
      [userId]
    );

    return NextResponse.json({ 
      ok: true, 
      message: "Password reset successful" 
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "An error occurred. Please try again." }, { status: 500 });
  }
}
