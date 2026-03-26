"use server";

import { NextResponse } from "next/server";
import { pool, ensureTables, getCurrentUser } from "@/utils/db";

// GET - List all categories
export async function GET() {
  console.log("[categories/GET] Fetching forum categories...");
  await ensureTables();
  console.log("[categories/GET] Tables ensured, querying categories...");
  
  const result = await pool.query(`
    SELECT 
      c.id, c.name, c.description, c.display_order, c.created_at,
      COUNT(t.id) as thread_count,
      COALESCE(SUM(t.reply_count), 0) as reply_count
    FROM gams_forum_categories c
    LEFT JOIN gams_forum_threads t ON t.category_id = c.id
    GROUP BY c.id
    ORDER BY c.display_order ASC
  `);
  
  return NextResponse.json({ categories: result.rows });
}