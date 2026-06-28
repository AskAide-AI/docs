# AskAide AI - Security

**Last Updated:** 2026-06-27

---

## Security Measures in Place

### Authentication
| Measure | Implementation | Status |
|---------|----------------|--------|
| Password Hashing | bcrypt (10 rounds) | ✅ Active |
| JWT Tokens | 24h expiry | ✅ Active |
| OTP Login | 6-digit, 10min expiry | ✅ Active |
| Protected Routes | Auth middleware | ✅ Active |

### API Protection
| Measure | Implementation | Status |
|---------|----------------|---------|
| Rate Limiting | 100 req/15min | ✅ Active |
| CORS | Configured origins | ✅ Active |
| Input Validation | Joi schemas + Mongoose | ✅ Active |
| Secure Cookies | httpOnly, secure, sameSite | ✅ Active |

---

## Known Vulnerabilities

> ⚠️ **Action Required:** Review and address these items from the audit.

### Resolved
| Issue | Fix | Date |
|-------|-----|------|
| No auth on leaderboard + feedback routes | `auth` middleware added | 2026-06-27 |
| No auth on progress module (sessions, answers, topic-progress, streaks, dashboards, daily-challenges, badges, session-feedback) | `auth` middleware added to all 7 route files | 2026-06-27 |
| IDOR via `:userId` in topic-progress URLs | Routes changed to use `req.user.id` from JWT | 2026-06-27 |
| Password reset token stored in plaintext | SHA-256 hashed before DB storage | 2026-06-27 |
| NoSQL injection via `$regex` in log search | Input escaped with `escapeRegex()` | 2026-06-27 |
| Source maps exposed in frontend production build | `sourcemap: false` in vite.config.ts | 2026-06-27 |
| AI Service has no auth | API key middleware added (`AI_SERVICE_API_KEY`) | 2026-06-27 |
| AI Service has no rate limiting | 200 req/60s rate limiter added | 2026-06-27 |

### Critical (Remaining)
| Issue | Risk | Remediation |
|-------|------|-------------|
| Google JSON key in repo | Credential exposure | Remove file, add to .gitignore, rotate credentials |
| School/section CRUD routes have no auth | Unauthorized data access | Add `auth` + `isPrincipal` / `isSuperAdmin` guards |
| Student create/get-all routes have no auth | Unauthorized data access | Add `auth` + `isTeacherOrPrincipal` guards |

### Medium (Remaining)
| Issue | Risk | Remediation |
|-------|------|-------------|
| Raw error messages in AI Service | Information disclosure | Replace `str(e)` with generic messages |
| No input sanitization lib | NoSQL injection risk | Install express-mongo-sanitize |
| No security headers | Various web attacks | Install helmet middleware |

---

## Security Best Practices

### Password Security
```javascript
// Current implementation ✅
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const hash = await bcrypt.hash(password, SALT_ROUNDS);
const isValid = await bcrypt.compare(password, hash);
```

### JWT Handling
```javascript
// ✅ Token verification
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// ❌ Never log tokens
console.log(token); // BAD

// ✅ Short expiry (consider implementing)
const token = jwt.sign(payload, secret, { expiresIn: '15m' });
```

### Environment Variables
```bash
# ✅ Use .env for secrets
JWT_SECRET=your-secret-here

# ❌ Never commit secrets
# Add to .gitignore:
.env
*.json # service account keys
```

---

## Recommended Security Enhancements

### 1. Install Security Middleware
```bash
npm install helmet express-mongo-sanitize xss-clean
```

```javascript
// index.js
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
```

### 2. Implement HTTPS
```javascript
// For production behind load balancer
app.set('trust proxy', 1);

// Or force HTTPS redirect
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});
```

### 3. Content Security Policy
```javascript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"]
  }
}));
```

---

## Data Protection

### Sensitive Fields
These fields should never be exposed in API responses:
- `password` / `passwordHash`
- `otp`
- JWT tokens in logs

### Mongoose Field Exclusion
```javascript
// In schema
password: {
  type: String,
  select: false  // Never returned by default
}

// Or in query
User.findById(id).select('-password -__v');
```

---

## Rate Limiting

### Current Configuration
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: { 
    success: false, 
    message: 'Too many requests' 
  }
});

app.use(limiter);
```

### Recommendations
- Stricter limits on auth endpoints (10 req/15min)
- Higher limits for authenticated users
- Separate limits for different endpoint categories

---

## Security Checklist

### Before Every Deployment
- [ ] No secrets in code or commits
- [ ] .env not in version control
- [ ] Dependencies updated (`npm audit`)
- [ ] Error messages don't expose internals
- [ ] CORS origins correctly configured
- [ ] Rate limiting enabled

### Periodic Review
- [ ] Rotate JWT_SECRET quarterly
- [ ] Review API logs for anomalies
- [ ] Check for dependency vulnerabilities
- [ ] Verify backup procedures
- [ ] Test authentication flows

---

## Incident Response

### If Credentials Exposed
1. **Immediately** rotate affected secrets
2. Invalidate all current JWT tokens (change JWT_SECRET)
3. Review access logs for unauthorized access
4. Notify affected users if data compromised

### If API Abused
1. Check rate limiting is active
2. Block offending IPs (firewall or middleware)
3. Review logs to understand attack vector
4. Implement additional protection if needed

---

*See [AUTHENTICATION.md](./authentication) for auth-specific security.*
