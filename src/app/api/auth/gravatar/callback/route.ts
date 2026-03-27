"use server";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool, ensureTables, logSecurityEvent } from "@/utils/db";

const GRAVATAR_CLIENT_ID = process.env.GRAVATAR_CLIENT_ID || "";
const GRAVATAR_CLIENT_SECRET = process.env.GRAVATAR_CLIENT_SECRET || "";
const GRAVATAR_REDIRECT_URI = process.env.GRAVATAR_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || "https://learningarcade.vercel.app"}/api/auth/gravatar/callback`;

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

export async function GET(req: Request) {
  await ensureTables();

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.json({ error: "Authorization code missing" }, { status: 400 });
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://public-api.wordpress.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GRAVATAR_CLIENT_ID,
        client_secret: GRAVATAR_CLIENT_SECRET,
        redirect_uri: GRAVATAR_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return NextResponse.json({ error: "Failed to get access token" }, { status: 400 });
    }

    // Get user info from WordPress/Gravatar
    const userResponse = await fetch("https://public-api.wordpress.com/rest/v1/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userResponse.json();

    if (!userData.email) {
      return NextResponse.json({ error: "Failed to get user info" }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await pool.query(
      `SELECT id, username FROM gams_users WHERE username = $1 LIMIT 1;`,
      [userData.email]
    );

    let userId: string;
    let username: string;

    if (existingUser.rows.length > 0) {
      // User exists
      userId = existingUser.rows[0].id;
      username = existingUser.rows[0].username;
    } else {
      // Create new user
      userId = crypto.randomUUID();
      username = userData.email;
      const displayName = userData.display_name || userData.email.split("@")[0];

      await pool.query(
        `INSERT INTO gams_users (id, username, password_hash, display_name, role, oauth_provider)
         VALUES ($1, $2, $3, $4, 'member', 'gravatar');`,
        [userId, username, "oauth_gravatar", displayName]
      );

      // Log account creation
      await logSecurityEvent(userId, "account_created", { provider: "gravatar", email: userData.email });
    }

    // Log successful login
    await logSecurityEvent(userId, "login_success", { provider: "gravatar" });

    // Create session
    const sessionId = crypto.randomUUID();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await pool.query(
      `INSERT INTO gams_sessions (id, user_id, expires_at)
       VALUES ($1, $2, $3);`,
      [sessionId, userId, expires.toISOString()]
    );

    const cookieStore = await cookies();
    const anonId = cookieStore.get("gams_uid")?.value ?? null;
    await mergeAnonymousStorage(userId, anonId);

    // Redirect to home page
    const response = NextResponse.redirect(new URL("/", req.url));
    response.cookies.set("gams_session", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Gravatar OAuth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
