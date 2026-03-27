import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { pool } from './utils/db';

// Log visitor IP to database
async function logVisitorIP(request: NextRequest): Promise<void> {
  try {
    // Get IP address from various headers (handles proxies, load balancers, etc.)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    // Use the first available IP address
    const ipAddress = forwarded?.split(',')[0]?.trim() || realIP || cfConnectingIP || 'unknown';
    
    // Get other request metadata
    const userAgent = request.headers.get('user-agent') || null;
    const path = request.nextUrl.pathname;
    const referer = request.headers.get('referer') || null;
    
    // Generate unique ID for the log entry
    const id = crypto.randomUUID();
    
    // Insert into database (non-blocking, don't await to avoid slowing down requests)
    pool.query(
      `INSERT INTO gams_visitor_logs (id, ip_address, user_agent, path, referer)
       VALUES ($1, $2, $3, $4, $5);`,
      [id, ipAddress, userAgent, path, referer]
    ).catch(error => {
      // Silently fail - don't block requests for logging issues
      console.error('[middleware] Failed to log visitor IP:', error);
    });
  } catch (error) {
    // Silently fail - don't block requests for logging issues
    console.error('[middleware] Error in logVisitorIP:', error);
  }
}

export function middleware(request: NextRequest) {
  // Log visitor IP (non-blocking)
  logVisitorIP(request);
  
  // Continue with the request
  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  // Match all routes except static files and API routes that don't need logging
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (games, images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
