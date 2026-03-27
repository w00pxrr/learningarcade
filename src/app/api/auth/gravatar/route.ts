"use server";

import { NextResponse } from "next/server";

// Gravatar OAuth configuration
const GRAVATAR_CLIENT_ID = process.env.GRAVATAR_CLIENT_ID || "";
const GRAVATAR_REDIRECT_URI = process.env.GRAVATAR_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || "https://learningarcade.vercel.app"}/api/auth/gravatar/callback`;

export async function GET() {
  if (!GRAVATAR_CLIENT_ID) {
    return NextResponse.json({ error: "Gravatar OAuth not configured" }, { status: 500 });
  }

  // Generate state parameter for CSRF protection
  const state = crypto.randomUUID();

  // Build Gravatar OAuth URL
  const params = new URLSearchParams({
    client_id: GRAVATAR_CLIENT_ID,
    redirect_uri: GRAVATAR_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
  });

  const gravatarAuthUrl = `https://public-api.wordpress.com/oauth2/authorize?${params.toString()}`;

  // Redirect to Gravatar OAuth
  return NextResponse.redirect(gravatarAuthUrl);
}
