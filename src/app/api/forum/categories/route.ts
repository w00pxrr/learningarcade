"use server";

import { NextResponse } from "next/server";
import { pool, ensureTables, getCurrentUser } from "@/utils/db";

// GET - List all categories
export async function GET() {
  await ensureTables();
  
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
  
  const response = NextResponse.json({ categories: result.rows });
  // Cache for 5 minutes - categories don't change often
  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  return response;
}