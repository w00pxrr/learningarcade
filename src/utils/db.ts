import { Pool } from "@neondatabase/serverless";

// Create a shared pool instance for database connections
const connectionString =
  process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || "";

// Debug log for connection string presence (not the actual value)
if (!connectionString) {
  console.warn(
    "[db.ts] WARNING: No database connection string found! Environment variables POSTGRES_URL, DATABASE_URL, and POSTGRES_PRISMA_URL are all empty/undefined.",
  );
} else {
  console.log("[db.ts] Database connection string is configured");
}

export const pool = new Pool({
  connectionString,
});

// Ensure required tables exist
export async function ensureTables(): Promise<void> {
  // Users table - add profile fields to existing table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gams_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      school TEXT,
      bio TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      post_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Add new columns to existing users table if they don't exist
  try {
    await pool.query(`ALTER TABLE gams_users ADD COLUMN IF NOT EXISTS display_name TEXT;`);
    await pool.query(`ALTER TABLE gams_users ADD COLUMN IF NOT EXISTS school TEXT;`);
    await pool.query(`ALTER TABLE gams_users ADD COLUMN IF NOT EXISTS bio TEXT;`);
    await pool.query(
      `ALTER TABLE gams_users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';`,
    );
    await pool.query(
      `ALTER TABLE gams_users ADD COLUMN IF NOT EXISTS post_count INTEGER NOT NULL DEFAULT 0;`,
    );
  } catch {
    // Columns may already exist, ignore
  }

  // Sessions table (already exists from auth)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gams_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES gams_users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );
  `);

  // Storage table (already exists from auth)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gams_storage (
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, key)
    );
  `);

  // Security logs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gams_security_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES gams_users(id) ON DELETE SET NULL,
      event_type TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      details JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // User phones table for encrypted phone numbers
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gams_user_phones (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES gams_users(id) ON DELETE CASCADE,
      phone_encrypted TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id)
    );
  `);

  // Password resets table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gams_password_resets (
      user_id TEXT PRIMARY KEY REFERENCES gams_users(id) ON DELETE CASCADE,
      phone_encrypted TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      reset_token TEXT,
      reset_token_expires TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Visitor IP logs table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gams_visitor_logs (
      id TEXT PRIMARY KEY,
      ip_address TEXT NOT NULL,
      user_agent TEXT,
      path TEXT,
      referer TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Create indexes for performance
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_security_logs_user ON gams_security_logs(user_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_security_logs_created ON gams_security_logs(created_at);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_phones_user ON gams_user_phones(user_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_password_resets_user ON gams_password_resets(user_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_visitor_logs_ip ON gams_visitor_logs(ip_address);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_visitor_logs_created ON gams_visitor_logs(created_at);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_visitor_logs_path ON gams_visitor_logs(path);
  `);
}

// Log security events
export async function logSecurityEvent(
  userId: string | null,
  eventType: string,
  details: Record<string, unknown> = {},
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
      ],
    );
  } catch (error) {
    // Silently fail - don't block operations for logging issues
    console.error("[logSecurityEvent] Failed to log security event:", error);
  }
}

// Get current user from session
export async function getCurrentUser(): Promise<{
  id: string;
  username: string;
  display_name?: string;
  school?: string;
  bio?: string;
  role: string;
  post_count: number;
} | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("gams_session")?.value;

  if (!sessionId) return null;

  const result = await pool.query(
    `SELECT u.id, u.username, u.display_name, u.school, u.bio, u.role, u.post_count
     FROM gams_sessions s
     JOIN gams_users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > NOW()
     LIMIT 1;`,
    [sessionId],
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

// Get user role based on username and post count
export async function getUserRole(username: string, postCount: number): Promise<string> {
  // Owner for psolo
  if (username.toLowerCase() === "psolo") return "owner";

  // Role based on post count
  if (postCount >= 100) return "moderator";
  if (postCount >= 50) return "contributor";
  if (postCount >= 10) return "member";
  return "newbie";
}

// Update user's post count and role
export async function updateUserPostCount(userId: string): Promise<void> {
  try {
    const result = await pool.query(`SELECT username FROM gams_users WHERE id = $1`, [userId]);

    if (result.rows.length === 0) return;

    const username = result.rows[0].username;
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM gams_forum_threads WHERE user_id = $1
       UNION ALL
       SELECT COUNT(*) as count FROM gams_forum_replies WHERE user_id = $1`,
      [userId],
    );

    const totalPosts = countResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const role = getUserRole(username, totalPosts);

    await pool.query(`UPDATE gams_users SET post_count = $1, role = $2 WHERE id = $3`, [
      totalPosts,
      role,
      userId,
    ]);
  } catch (error) {
    console.error("[updateUserPostCount] Failed to update post count:", error);
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  data: { display_name?: string; school?: string; bio?: string },
): Promise<void> {
  try {
    const updates: string[] = [];
    const values: (string | null)[] = [];
    let paramIndex = 1;

    if (data.display_name !== undefined) {
      updates.push(`display_name = ${paramIndex++}`);
      values.push(data.display_name || null);
    }
    if (data.school !== undefined) {
      updates.push(`school = ${paramIndex++}`);
      values.push(data.school || null);
    }
    if (data.bio !== undefined) {
      updates.push(`bio = ${paramIndex++}`);
      values.push(data.bio || null);
    }

    if (updates.length === 0) return;

    values.push(userId);
    await pool.query(
      `UPDATE gams_users SET ${updates.join(", ")} WHERE id = ${paramIndex}`,
      values,
    );
  } catch (error) {
    console.error("[updateUserProfile] Failed to update user profile:", error);
    throw error; // Re-throw to allow caller to handle
  }
}
