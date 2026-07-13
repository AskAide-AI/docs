# Backend Troubleshooting Guide

Common issues and solutions when working with the AskAideAI backend.

## Server Startup Issues

### Server crashes on start
**Symptoms:** Process exits immediately with error
**Solutions:**
1. Check MongoDB is running: `mongosh --eval "db.version()"`
2. Verify `DATABASE_URL` in `.env` is correct
3. Check `PORT` is not in use
4. Look for syntax errors in startup logs

### MongoDB connection fails
**Symptoms:** `MongooseServerSelectionError`, connection timeout
**Solutions:**
1. Verify `DATABASE_URL` format: `mongodb://host:port/dbname`
2. Check network access (IP whitelist for Atlas)
3. Ensure MongoDB service is running
4. For Atlas: check user credentials and cluster status

## API Issues

### All routes return 404
**Symptoms:** Every request returns `{"success":false,"message":"Route not found"}`
**Solutions:**
1. Check `routes/v1/index.js` for missing route mounts
2. Verify the route file exports a valid router
3. Ensure route paths match what the frontend calls

### Rate limiting blocks requests
**Symptoms:** 429 Too Many Requests
**Solutions:**
1. Global rate limit is 500 req/5min (configurable in `index.js`); login is stricter at 10 req/15min
2. Check if you're hitting the limit during testing
3. `localhost` requests skip the global rate limiter (but **not** the login limiter)

### JWT authentication fails
**Symptoms:** 401 Unauthorized on protected routes
**Solutions:**
1. Verify `JWT_SECRET` matches between frontend and backend
2. Check token expiration
3. Ensure `Authorization: Bearer <token>` header is set
4. Verify the token was signed with the same secret

## Database Issues

### Mongoose validation errors
**Symptoms:** 400 with validation error messages
**Solutions:**
1. Check required fields in the request body
2. Verify field types match the schema
3. Look for enum constraints on string fields

### Duplicate key errors
**Symptoms:** 409 with E11000 error
**Solutions:**
1. Check unique index constraints on the collection
2. User email must be unique
3. Clear duplicate data from the database

### Slow queries
**Solutions:**
1. Check if indexes exist: run `createIndexes.js` script
2. Use `.explain()` to analyze query performance
3. Add `.lean()` for read-only queries
4. Avoid N+1 queries by using `.populate()` or aggregation

## AI Integration Issues

### AI Service returns connection refused
**Symptoms:** Backend cannot reach AI Service endpoints
**Solutions:**
1. Verify AI Service is running on port 8000
2. Check `AI_ENDPOINT` in `.env` (should be `http://localhost:8000`)
3. Verify network connectivity between services

### Question generation timeouts
**Symptoms:** Question generation requests hang or timeout after 600s
**Solutions:**
1. Check AI Service logs for LLM errors
2. Verify `AI_QUESTION_REQ_URL` is set correctly
3. Check if LLM provider API key is valid
4. Reduce `QUESTION_HARD_CAP` (currently 300)

### Document upload fails
**Symptoms:** PDF upload returns errors
**Solutions:**
1. Check file size is within limits
2. Verify PDF is not password-protected or corrupted
3. Check AI Service upload endpoint is reachable
4. Look for FormData parsing errors in multer

## Testing Issues

### Jest fails with ESM import errors
**Solutions:**
1. Use `NODE_OPTIONS=--experimental-vm-modules` flag
2. Mock ESM modules with `jest.unstable_mockModule`
3. Import modules dynamically after mocking
4. See existing tests in `src/modules/*/tests/` for examples

### Mocking Mongoose models
**Solutions:**
1. Mock the model file path directly
2. Use `jest.unstable_mockModule` before the dynamic import
3. Return a mock object with the methods your service calls

## Environment Issues

### Environment variables not loading
**Solutions:**
1. `.env` file must be in project root
2. `dotenv` is loaded in `config/server.config.js`
3. Restart the server after changing `.env`
4. Check for typos in variable names
