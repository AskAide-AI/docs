# AskAide AI - Deployment

**Last Updated:** 2026-05-04

---

## Build Process

### Production Start
```bash
# No build step required (plain Node.js)
npm start
```

### Environment Setup
Ensure all environment variables are set (see [SETUP.md](./SETUP.md)):
- `NODE_ENV=production`
- `DATABASE_URL` (production database)
- `JWT_SECRET` (strong, unique secret)
- `REDIS_URL` (optional, for caching)

---

## Redis Setup (Optional but Recommended)

### Why Redis?
Redis caching provides significant performance improvements:
- 95% faster for cached requests (~500ms → ~25ms)
- 60% reduction in database load
- Better scalability under high traffic

### Installation

#### Option 1: Docker (Recommended)
```bash
# Run Redis container
docker run -d -p 6379:6379 --name redis redis:alpine

# Verify Redis is running
docker ps | grep redis
```

#### Option 2: Local Installation

**Windows:**
```bash
# Download Redis for Windows
# https://github.com/microsoftarchive/redis/releases

# Or use Chocolatey
choco install redis-64
```

**Mac:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

#### Option 3: Managed Redis Service

**AWS ElastiCache:**
- Create Redis cluster in AWS Console
- Get endpoint URL
- Add to environment variables

**Azure Cache:**
- Create Azure Cache for Redis
- Get connection string
- Add to environment variables

**Render:**
- Add Redis instance in Render dashboard
- Get connection URL
- Add to environment variables

### Configuration

Add to `.env` file:
```bash
# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379

# Cache TTL Configuration (Optional - defaults provided)
CACHE_TTL_PROGRESS=300
CACHE_TTL_QUIZ=60
CACHE_TTL_QUESTIONS=1800
CACHE_TTL_HIERARCHY=3600
```

### Verification

Test Redis connection:
```bash
# Using redis-cli
redis-cli ping
# Should return: PONG

# Or test with Node.js
node -e "const Redis = require('ioredis'); const redis = new Redis('redis://localhost:6379'); redis.ping().then(console.log).catch(console.error);"
```

### Graceful Degradation

If Redis is not available:
- Application continues to work normally
- Cache operations return `null` for `get()`
- Cache operations do nothing for `set()` and `del()`
- No errors or crashes
- Performance degrades to non-cached speed

---

## Deployment Options

### Option 1: Traditional VPS (DigitalOcean, AWS EC2)

```bash
# 1. Clone repository
git clone <repo-url>
cd Backend

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
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
  
  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:
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
- [ ] MAIL_* and EMAIL credentials configured for email features
- [ ] AI_ENDPOINT and AI_QUESTION_REQ_URL configured
- [ ] QUESTION_PREFETCH_AHEAD, QUESTION_MIN_NEW_PER_RUN, QUESTION_LOW_YIELD_LIMIT, QUESTION_HARD_CAP configured for question generation
- [ ] Rate limiting configured appropriately
- [ ] CORS origins updated for production domains
- [ ] Redis server configured (optional but recommended)
- [ ] Database indexes created (run `node scripts/createIndexes.js`)
- [ ] Cache configuration verified (if using Redis)

---

## Post-Deployment Steps

### Create Database Indexes
```bash
# Create all optimized indexes
node scripts/createIndexes.js
```

### Verify Cache Connection (if using Redis)
```bash
# Test Redis connection
redis-cli ping

# Or check application logs for Redis connection status
pm2 logs askaide-api | grep -i redis
```

### Monitor Performance Metrics
- API response time (P95 should be < 1s)
- Error rate (should be < 0.1%)
- Cache hit rate (should be > 60% if using Redis)
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

### Production Settings
```javascript
// index.js additions for production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);  // If behind load balancer
  app.use(helmet());          // Security headers
}
```

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

*See [SECURITY.md](./SECURITY.md) for security hardening details.*
