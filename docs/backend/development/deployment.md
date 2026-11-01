---
title: "AskAide AI - Deployment"
description: "How the backend ships: the build process, environment configuration, hosting on Render, pre- and post-deployment checklists, and monitoring."
sidebar_position: 410
---

# AskAide AI - Deployment

**Last Updated:** 2026-11-01 (Redis caching removed — it is not a dependency of the backend)

---

## Build Process

### Production Start
```bash
# No build step required (plain Node.js)
npm start
```

### Environment Setup
Ensure all environment variables are set (see [SETUP.md](./setup)):
- `NODE_ENV=production`
- `DATABASE_URL` (production database)
- `JWT_SECRET` (strong, unique secret)

Token lifetimes also come from env: `ACCESS_TOKEN_EXPIRY` (default `2h`), `REFRESH_TOKEN_EXPIRY` (default `30d`) and `MAX_REFRESH_TOKENS` (default 10). A deployment may override all three — the API contract documents the code defaults.

---

## Deployment Options

### Option 1: Traditional VPS (DigitalOcean, AWS EC2)

```bash
# 1. Clone repository
git clone <repo-url>
cd backend

# 2. Install dependencies
npm ci --production

# 3. Set environment variables
export NODE_ENV=production
export DATABASE_URL=<production-uri>
# ... other env vars

# 4. Start with PM2 (recommended)
npm install -g pm2
pm2 start index.js --name askaide-api

# 5. Setup PM2 to restart on reboot
pm2 startup
pm2 save
```

### Option 2: Docker

**Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 4000

CMD ["node", "index.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
  
  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

**Commands:**
```bash
docker-compose up -d
docker-compose logs -f api
```

### Option 3: Platform as a Service (Railway, Render, Heroku)

1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy with auto-detect (Node.js)
4. Enable auto-deploy on push to main

---

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] MongoDB production database accessible
- [ ] JWT_SECRET is unique and secret
- [ ] SENDGRID_API_KEY and EMAIL (a SendGrid verified sender) configured for email features
- [ ] FRONTEND_URL set, so reset, invite and challenge links point at the live site
- [ ] AI_ENDPOINT (base URL only) and AI_SERVICE_API_KEY configured
- [ ] QUESTION_PREFETCH_AHEAD, QUESTION_MIN_NEW_PER_RUN, QUESTION_LOW_YIELD_LIMIT, QUESTION_HARD_CAP configured for question generation
- [ ] Rate limiting configured appropriately
- [ ] CORS origins updated for production domains

---

## Post-Deployment Steps

### Check Database Indexes
The server builds all schema indexes itself after it connects to MongoDB (`ensureIndexes()` in `index.js`). No manual script is needed. Check the startup log for `MongoDB indexes ensured`, or for `Some MongoDB indexes could not be built` with the failing models.

```bash
pm2 logs askaide-api | grep -i "indexes"
```

### Monitor Performance Metrics
- API response time (P95 should be < 1s)
- Error rate (should be < 0.1%)
- Database query time (average should be < 50ms)

---

## Monitoring

### Health Check Endpoint
```
GET /ping
```

### PM2 Monitoring
```bash
pm2 status        # Check running processes
pm2 logs          # View logs
pm2 monit         # Real-time monitoring
```

### Recommended Tools
- **Uptime Monitoring**: UptimeRobot, BetterUptime
- **Error Tracking**: Sentry, LogRocket
- **APM**: New Relic, Datadog

---

## Rollback Procedure

### Git-based Rollback
```bash
# Find previous working commit
git log --oneline -10

# Rollback to specific commit
git checkout <commit-hash>
npm ci

# Restart server
pm2 restart askaide-api
```

### Docker Rollback
```bash
# List previous images
docker images

# Run previous version
docker run -d --name askaide-api-rollback \
  -e NODE_ENV=production \
  askaide-api:<previous-tag>
```

---

## Database Migrations

### Running Migrations
Currently no migration system. Schema changes via Mongoose are automatic.

### Recommended: Add Migration System
Consider `migrate-mongo` for controlled schema changes:
```bash
npm install migrate-mongo
npx migrate-mongo init
npx migrate-mongo up
```

---

## Security Hardening

### Already in place
`index.js` sets `trust proxy 1`, applies `helmet()` and turns `X-Powered-By` off unconditionally — no per-environment wiring needed. Rate limiting and the explicit CORS allowlist are configured in the app; check them when adding a new deployment domain.

### SSL/TLS
- Use reverse proxy (nginx) with SSL certificates
- Or platform-provided SSL (Railway, Render, etc.)

---

## Scaling Considerations

### Horizontal Scaling
- App is stateless (JWT-based auth)
- Can run multiple instances behind load balancer
- Ensure MongoDB can handle connection pool

### Vertical Scaling
- Monitor memory usage
- Consider memory limits for large PDF uploads

---

