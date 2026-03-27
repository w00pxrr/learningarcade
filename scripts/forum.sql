-- Forum Database Schema for GAMS
-- This script creates all necessary tables for the forum functionality
-- 
-- DEPLOYMENT OPTIONS:
--
-- Option 1 - Vercel (RECOMMENDED):
--   The tables are automatically created when the app first runs via ensureTables() in db.ts.
--   Just visit any forum page and the tables will be created automatically.
--
-- Option 2 - Using psql CLI:
--   Get your connection string from Vercel dashboard > Storage > your Neon project
--   psql "postgresql://user:password@host.neon.tech/dbname?sslmode=require" -f scripts/forum.sql
--
-- Option 3 - Using Neon Dashboard:
--   Go to your Neon project > SQL Editor > paste this script and run
--
-- Option 4 - Using npx:
--   npx psql "postgresql://user:password@host.neon.tech/dbname?sslmode=require" -f scripts/forum.sql

-- Users table with OAuth provider tracking
CREATE TABLE IF NOT EXISTS gams_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  school TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  post_count INTEGER NOT NULL DEFAULT 0,
  oauth_provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add oauth_provider column to existing users table if it doesn't exist
ALTER TABLE gams_users ADD COLUMN IF NOT EXISTS oauth_provider TEXT;

-- User phones table for encrypted phone numbers
CREATE TABLE IF NOT EXISTS gams_user_phones (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES gams_users(id) ON DELETE CASCADE,
  phone_encrypted TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Password resets table
CREATE TABLE IF NOT EXISTS gams_password_resets (
  user_id TEXT PRIMARY KEY REFERENCES gams_users(id) ON DELETE CASCADE,
  phone_encrypted TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS gams_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES gams_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Storage table
CREATE TABLE IF NOT EXISTS gams_storage (
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, key)
);

-- Security logs table
CREATE TABLE IF NOT EXISTS gams_security_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES gams_users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Forum categories table
CREATE TABLE IF NOT EXISTS gams_forum_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Forum threads table
CREATE TABLE IF NOT EXISTS gams_forum_threads (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES gams_forum_categories(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES gams_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  view_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Forum replies table
CREATE TABLE IF NOT EXISTS gams_forum_replies (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES gams_forum_threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES gams_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for forum performance
CREATE INDEX IF NOT EXISTS idx_forum_threads_category ON gams_forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_user ON gams_forum_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_thread ON gams_forum_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_user ON gams_forum_replies(user_id);

-- Visitor IP logs table
CREATE TABLE IF NOT EXISTS gams_visitor_logs (
  id TEXT PRIMARY KEY,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  path TEXT,
  referer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for visitor logs performance
CREATE INDEX IF NOT EXISTS idx_visitor_logs_ip ON gams_visitor_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_created ON gams_visitor_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_path ON gams_visitor_logs(path);

-- Insert default categories if none exist
INSERT INTO gams_forum_categories (id, name, description, display_order)
SELECT gen_random_uuid(), 'General Discussion', 'Talk about anything and everything', 1
WHERE NOT EXISTS (SELECT 1 FROM gams_forum_categories);

INSERT INTO gams_forum_categories (id, name, description, display_order)
SELECT gen_random_uuid(), 'Game Reviews', 'Share your thoughts on games', 2
WHERE NOT EXISTS (SELECT 1 FROM gams_forum_categories WHERE name = 'Game Reviews');

INSERT INTO gams_forum_categories (id, name, description, display_order)
SELECT gen_random_uuid(), 'Help & Support', 'Get help with games or account issues', 3
WHERE NOT EXISTS (SELECT 1 FROM gams_forum_categories WHERE name = 'Help & Support');

INSERT INTO gams_forum_categories (id, name, description, display_order)
SELECT gen_random_uuid(), 'Suggestions', 'Suggest new games or features', 4
WHERE NOT EXISTS (SELECT 1 FROM gams_forum_categories WHERE name = 'Suggestions');