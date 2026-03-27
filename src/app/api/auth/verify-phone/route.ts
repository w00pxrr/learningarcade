"use server";

import { NextResponse } from "next/server";
import { pool, ensureTables } from "@/utils/db";
import crypto from "crypto";

// Encryption key from environment variable
const ENCRYPTION_KEY = process.env.PHONE_ENCRYPTION_KEY || "default-encryption-key-32-chars!!";
const IV_LENGTH = 16;

// Encrypt phone number
function encryptPhoneNumber(phoneNumber: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)),
    iv
  );
  let encrypted = cipher.update(phoneNumber, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

export async function POST(req: Request) {
  await ensureTables();
  
  let payload: { phoneNumber?: string; code?: string } | null = null;
  try {
    payload = (await req.json()) as { phoneNumber?: string; code?: string };
  } catch {
    payload = null;
  }

  const phoneNumber = payload?.phoneNumber?.trim() ?? "";
  const code = payload?.code?.trim() ?? "";
  
  if (!phoneNumber || !code) {
    return NextResponse.json({ error: "Phone number and code are required" }, { status: 400 });
  }

  try {
    // Encrypt phone number for lookup
    const encryptedPhone = encryptPhoneNumber(phoneNumber);

    // Find the verification code
    const result = await pool.query(
      `SELECT pr.user_id, pr.code, pr.expires_at
       FROM gams_password_resets pr
       WHERE pr.phone_encrypted = $1 AND pr.code = $2 AND pr.expires_at > NOW()
       LIMIT 1;`,
      [encryptedPhone, code]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    // Code is valid - generate a verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    // Store verification token
    await pool.query(
      `UPDATE gams_password_resets 
       SET reset_token = $1, reset_token_expires = $2
       WHERE user_id = $3;`,
      [verificationToken, expiresAt.toISOString(), result.rows[0].user_id]
    );

    return NextResponse.json({ 
      ok: true, 
      verificationToken,
      message: "Phone number verified successfully" 
    });
  } catch (error) {
    console.error("Verify phone error:", error);
    return NextResponse.json({ error: "An error occurred. Please try again." }, { status: 500 });
  }
}
