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

// Generate verification code
function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(req: Request) {
  await ensureTables();
  
  let payload: { phoneNumber?: string; purpose?: string } | null = null;
  try {
    payload = (await req.json()) as { phoneNumber?: string; purpose?: string };
  } catch {
    payload = null;
  }

  const phoneNumber = payload?.phoneNumber?.trim() ?? "";
  const purpose = payload?.purpose?.trim() ?? "verification"; // "verification", "login", "registration"
  
  if (!phoneNumber) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  // Validate phone number format (basic validation)
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ""))) {
    return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
  }

  try {
    // Encrypt phone number for storage
    const encryptedPhone = encryptPhoneNumber(phoneNumber);

    // Check if phone number exists in database
    const result = await pool.query(
      `SELECT user_id FROM gams_user_phones WHERE phone_encrypted = $1 LIMIT 1;`,
      [encryptedPhone]
    );

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    if (result.rows.length > 0) {
      // Phone number exists - update verification code
      const userId = result.rows[0].user_id;
      await pool.query(
        `INSERT INTO gams_password_resets (user_id, phone_encrypted, code, expires_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) 
         DO UPDATE SET code = $3, expires_at = $4, created_at = NOW();`,
        [userId, encryptedPhone, verificationCode, expiresAt.toISOString()]
      );
    } else {
      // Phone number doesn't exist - create temporary entry
      const tempUserId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO gams_password_resets (user_id, phone_encrypted, code, expires_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) 
         DO UPDATE SET code = $3, expires_at = $4, created_at = NOW();`,
        [tempUserId, encryptedPhone, verificationCode, expiresAt.toISOString()]
      );
    }

    // In a real application, you would send the verification code via SMS
    // For now, we'll just return success
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`Verification code for ${phoneNumber} (${purpose}): ${verificationCode}`);

    return NextResponse.json({ 
      ok: true, 
      message: "Verification code sent successfully",
      purpose
    });
  } catch (error) {
    console.error("Send verification error:", error);
    return NextResponse.json({ error: "An error occurred. Please try again." }, { status: 500 });
  }
}
