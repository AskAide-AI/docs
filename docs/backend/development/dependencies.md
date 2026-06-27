# AskAide AI - Dependencies

**Last Updated:** 2026-06-26

---

## Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **express** | ^4.21.2 | Web framework for Node.js |
| **mongoose** | ^8.13.2 | MongoDB ODM with schemas and validation |
| **jsonwebtoken** | ^9.0.2 | JWT token generation and verification |
| **bcrypt** | ^5.1.1 | Password hashing with salt |
| **cors** | ^2.8.5 | Cross-Origin Resource Sharing middleware |
| **dotenv** | ^16.5.0 | Environment variable loading from .env |
| **helmet** | ^8.1.0 | Security headers middleware |
| **compression** | ^1.8.1 | Response compression (gzip) |

---

## Validation & Schema

| Package | Version | Purpose |
|---------|---------|---------|
| **joi** | ^18.0.2 | Request validation schemas |
| **mongoose** | ^8.13.2 | MongoDB schema definitions (already listed) |

---

## File Handling

| Package | Version | Purpose |
|---------|---------|---------|
| **multer** | ^2.0.2 | Multipart form-data handling (PDF uploads) |

---

## Logging

| Package | Version | Purpose |
|---------|---------|---------|
| **winston** | ^3.19.0 | Structured logging |
| **winston-daily-rotate-file** | ^5.0.0 | Log rotation by date |

---

## Email & Notifications

| Package | Version | Purpose |
|---------|---------|---------|
| **nodemailer** | ^6.10.1 | Email sending (OTP, notifications) |

---

## API Documentation

| Package | Version | Purpose |
|---------|---------|---------|
| **swagger-jsdoc** | ^6.2.8 | Generate Swagger docs from JSDoc comments |
| **swagger-ui-express** | ^5.0.1 | Serve Swagger UI for API documentation |

---

## Security & Rate Limiting

| Package | Version | Purpose |
|---------|---------|---------|
| **express-rate-limit** | ^7.5.1 | Request rate limiting to prevent abuse |
| **helmet** | ^8.1.0 | Security headers middleware |
| **bcrypt** | ^5.1.1 | Password hashing (already listed) |

---

## External Services

| Package | Version | Purpose |
|---------|---------|---------|
| **googleapis** | ^150.0.1 | Google APIs (Sheets for feedback) |
| **google-auth-library** | ^10.9.0 | Google authentication |
| **node-fetch** | ^3.3.2 | HTTP client for external API calls |
| **puppeteer-core** | ^24.41.0 | Headless browser for PDF generation |
| **@sparticuz/chromium** | ^133.0.0 | Chromium binary for serverless PDF gen |

---

## Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| **otp-generator** | ^4.0.1 | Generate random OTP codes |
| **jsdom** | ^26.1.0 | DOM parsing for HTML processing |
| **node-cron** | ^4.2.0 | Scheduled job execution |
| **express-list-endpoints** | ^7.1.1 | List all registered routes |

---

## Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **nodemon** | ^3.0.3 | Auto-restart server on file changes |
| **jest** | ^30.2.0 | Test framework |
| **eslint** | ^9.39.2 | Linting |
| **@eslint/js** | ^9.39.2 | ESLint JS config |
| **globals** | ^17.0.0 | ESLint global variables |
| **prisma** | ^6.4.1 | Database toolkit (installed but not primary) |
| **@prisma/client** | ^6.4.1 | Prisma client (installed but not primary) |

---

## Dependency Notes

### Why Express?
Industry-standard Node.js framework with robust middleware ecosystem, extensive documentation, and large community support.

### Why Mongoose over Prisma?
Project uses Mongoose as the primary ODM. Prisma is installed but not actively used. Consider consolidating to one ORM to reduce bundle size.

### Why bcrypt?
Secure password hashing with configurable salt rounds. Industry standard for password storage.

### Why Puppeteer-core + @sparticuz/chromium?
Uses `puppeteer-core` (not the full `puppeteer` package) with `@sparticuz/chromium` for serverless-compatible PDF generation on Render. This avoids downloading Chromium during deployment.

---

## Security Audit

Run regularly to check for vulnerabilities:
```bash
npm audit

# Fix automatically where possible
npm audit fix

# Force fix (may include breaking changes)
npm audit fix --force
```

---

## Update Strategy

### Safe Updates
```bash
# Check for outdated packages
npm outdated

# Update patch versions only (safest)
npm update
```

### Major Updates
1. Check changelog for breaking changes
2. Update in development first
3. Run tests (when implemented)
4. Test critical flows manually
5. Deploy to staging before production

---

## Unused/Legacy Dependencies

> Review and consider removing:

| Package | Reason |
|---------|--------|
| `@prisma/client` | Not used (Mongoose is primary) |
| `prisma` | Not used (Mongoose is primary) |

```bash
# To remove
npm uninstall @prisma/client prisma
```

---

*Keep this document updated when adding/removing dependencies.*
