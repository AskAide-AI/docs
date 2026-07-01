# AskAide AI - Authentication

**Last Updated:** 2026-07-01

---

## Authentication Strategy

**Primary Method:** JWT (access + refresh token pair)
**Secondary Method:** Google OAuth  
**OTP:** Email verification via OTP during signup

---

## Token Structure

### Access Token
- **Type:** JWT
- **Expiry:** 2 hours
- **Payload:**
  ```json
  {
    "userId": "ObjectId",
    "email": "user@example.com",
    "role": "student",
    "iat": 1704384000,
    "exp": 1704470400
  }
  ```

### Refresh Token
- **Type:** JWT
- **Expiry:** 7 days
- **Usage:** Rotated on each `/refresh` call — old token invalidated, new one issued
- **Max active:** 5 per user (multi-device support)
- **Storage:** SHA-256 hashed in MongoDB

---

## Authentication Flows

### Email/Password Login

```
1. Client sends POST /api/v1/authenticate/login
   Body: { userName, password }
           │
           ▼
2. Server validates credentials
   - Find user by email or userName
   - Compare password hash (bcrypt)
           │
           ▼
3. Generate token pair
   - accessToken (2h) + refreshToken (7d)
           │
           ▼
4. Return tokens to client
   { success: true, user: {...}, tokens: { accessToken, refreshToken, expiresIn } }
           │
           ▼
5. Client stores token
   - accessToken in memory
   - refreshToken in localStorage
           │
           ▼
6. Client includes token in requests
   Authorization: Bearer <accessToken>
```

### Token Refresh

```
1. Client detects 401 on accessToken expiry
           │
           ▼
2. Client sends POST /api/v1/authenticate/refresh
   Body: { refreshToken }
           │
           ▼
3. Server verifies & rotates:
   - Find hashed refreshToken in DB
   - Issue new accessToken + new refreshToken
   - Invalidate old refreshToken
           │
           ▼
4. Return new token pair (same shape as login)
```

### Google OAuth

```
1. Client sends POST /api/v1/authenticate/google
   Body: { idToken }  (Google ID token)
           │
           ▼
2. Server verifies with Google
   - Finds user by googleId
   - OR links by matching email
   - OR auto-creates a Student account
           │
           ▼
3. Return { user, tokens } — same shape as login
```

### Password Change

```
POST /api/v1/authenticate/changepassword
Body: { oldPassword, newPassword, confirmNewPassword }
- Revokes ALL refresh tokens → forces re-login on all devices
```

### Email Verification

```
POST /api/v1/authenticate/verify-email
Body: { email, otp }    (OTP TTL: 5 min)
```

---

## Protected Routes

### Middleware: `src/shared/middleware/auth.js`

JWT is accepted from **any** of:
- **Cookie:** `token=<jwt>`
- **Header:** `Authorization: Bearer <token>`
- **Body:** `{ token: "<jwt>" }`

### Available Role Guards (all also allow `SuperAdmin`)

| Guard | Required `accountType` |
|-------|----------------------|
| `auth` (bare) | Any authenticated user |
| `isStudent` | `Student` |
| `isTeacher` | `Teacher` |
| `isPrincipal` | `Principal` |
| `isParent` | `Parent` |
| `isTeacherOrPrincipal` | `Teacher` or `Principal` |
| `isNormalUser` | `NormalUser` |

---

## Role-Based Access Control (RBAC)

### Available Roles
| Role | Description | Access Level |
|------|-------------|--------------|
| `SuperAdmin` | System administrator | Full access |
| `Principal` | School principal | School-level access |
| `Teacher` | Teacher | Class/section access |
| `Student` | Student | Personal data only |
| `Parent` | Parent/guardian | Child's data only |

---

## Password Security

### Hashing
- **Algorithm:** bcrypt
- **Salt Rounds:** 10

### Password Requirements
- Minimum 8 characters
- Must include uppercase, lowercase, number, and special character (`!@#$%^&*`)

### Password Field Behavior
- `password` has `select: false` — must use `.select('+password')` to read
- `email` has `unique: true` — duplicate returns 409

---

## API Endpoints

All under `/api/v1/authenticate/`:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/login` | POST | Rate-limited | `{ userName, password }` → `{ user, tokens }` |
| `/signup` | POST | Rate-limited | `{ name, email, password, role }` → `{ user, tokens }` |
| `/google` | POST | Rate-limited | Google ID token auth → `{ user, tokens }` |
| `/refresh` | POST | None | `{ refreshToken }` → new token pair |
| `/logout` | POST | None | `{ refreshToken }` → revoke token |
| `/changepassword` | POST | auth | Password change (revokes all refresh tokens) |
| `/reset-password-token` | POST | None | Send reset email |
| `/reset-password` | POST | None | `{ token, password }` — revokes all refresh tokens |
| `/verify-email` | POST | None | `{ email, otp }` — OTP TTL: 5 min |

---

## Security Best Practices

1. **Never log tokens** — Exclude from API logger
2. **Use HTTPS** in production
3. **Short access token expiry** (2h) with refresh token rotation
4. **Password change/reset revokes all sessions**
5. **Rate limiting:** login 5 req/15min, signup 3 req/hour

---

*See [Security doc](./security) for additional security measures.*
