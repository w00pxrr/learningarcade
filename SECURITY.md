# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please open an issue or pull request.

## Security Best Practices for Deployment

### Required Environment Variables

```env
# Database connection (required)
POSTGRES_URL=postgres://user:pass@host:port/database

# Optional: Analytics
UMAMI_WEBSITE_ID=your-umami-id

# Optional: Authentication secrets (generate with: openssl rand -base64 32)
AUTH_SECRET=your-secret-key-here
```

### Database Security

- Use a strong database password
- Enable SSL/TLS for database connections
- Restrict database user permissions to only what's needed
- Consider using a connection pool with timeout limits

### API Security

The API endpoints include:

- `/api/storage` - User data storage (uses parameterized queries)
- `/api/leaderboards` - Game leaderboards (authenticated)

### Rate Limiting

Consider adding rate limiting at the deployment level (Vercel, Cloudflare, etc.)

### Content Security Policy

The site includes basic protections but for production, add:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
```

### Recommendations for Public Deployment

1. **Remove sensitive data** before publishing:
   - `.env.local` - Contains secrets
   - Any database with real user data

2. **Audit external dependencies**:
   - Check `package.json` for known vulnerabilities: `npm audit`

3. **Monitor for vulnerabilities**:
   - Enable GitHub security alerts
   - Use Dependabot for updates
