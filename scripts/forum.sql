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