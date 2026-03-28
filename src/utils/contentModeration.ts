// Content moderation utilities for GAMS
// Includes profanity filter and rate limiting

// Common slurs and inappropriate words (case-insensitive regex pattern)
// This is a basic list - expand as needed
// Pre-compiled regex patterns for better performance
const SLUR_PATTERNS: RegExp[] = [
  // Racial slurs
  /\b(n[i1!l]gg[e3]r|n[i1!l]gga|n[i1!l]gg[a@]s)\b/i,
  /\b(f[a@]g(g[o0]t|g[e3]t)?)\b/i,
  /\b(r[e3]t[a@]rd)\b/i,
  /\b(sp[i1!l]c)\b/i,
  /\b(ch[i1!l]nk)\b/i,
  /\b(w[e3]tb[a@]ck)\b/i,
  /\b(k[i1!l]k[e3])\b/i,
  /\b(t[o0]w[e3]lh[e3]ad)\b/i,
  /\b(c[o0]0n)\b/i,
  /\b(d[a@]rk[i1!l]e)\b/i,
  /\b(g[o0]0k)\b/i,
  /\b(h[e3]eb)\b/i,
  /\b(j[i1!l]g[a@]b[o0]0)\b/i,
  /\b(n[i1!l]ppl[e3])\b/i,
  /\b(p[a@]k[i1!l])\b/i,
  /\b(r[a@]g[h3]e[a@]d)\b/i,
  /\b(s[a@]ndn[i1!l]gg[e3]r)\b/i,
  /\b(s[l1]ant[e3]y[e3])\b/i,
  /\b(w[o0]g)\b/i,
  /\b(z[i1!l]p[h3]e[a@]d)\b/i,
  
  // Homophobic slurs
  /\b(h[o0]m[o0])\b/i,
  /\b(qu[e3][e3]r)\b/i,
  /\b(l[e3]sb[i1!l][a@]n)\b/i,
  /\b(tr[a@]nn[yi])\b/i,
  /\b(sh[e3]m[a@]l[e3])\b/i,
  
  // Sexist slurs
  /\b(b[i1!l]tch)\b/i,
  /\b(c[u@]nt)\b/i,
  /\b(wh[o0]r[e3])\b/i,
  /\b(sl[u@]t)\b/i,
  /\b(th[o0]t)\b/i,
  
  // Other offensive terms
  /\b(n[a@]z[i1!l])\b/i,
  /\b(h[i1!l]tl[e3]r)\b/i,
  /\b(kkk)\b/i,
  /\b(t[e3]rr[o0]r[i1!l]st)\b/i,
  /\b(j[i1!l]h[a@]d)\b/i,
];

// Rate limiting configuration
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit windows (in milliseconds)
const RATE_LIMITS = {
};

/**
 * Check if content contains slurs or inappropriate language
 * @param content - The text content to check
 * @returns true if content is clean, false if it contains slurs
 */
export function isContentClean(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return true;
  }
  
  // Normalize the content to catch leetspeak and variations
  const normalizedContent = content
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/\+/g, 't');
  
  // Check against all slur patterns
  for (const pattern of SLUR_PATTERNS) {
    if (pattern.test(content) || pattern.test(normalizedContent)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get a user-friendly error message for content that violates policy
 * @returns Error message string
 */
export function getContentViolationMessage(): string {
  return "Your message contains inappropriate language. Please revise and try again.";
}
