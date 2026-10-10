# AskAide AI - Authentication

**Last Updated:** 2026-10-10

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
    "id": "ObjectId",
    "email": "user@example.com",
    "accountType": "Student",
    "iat": 1704384000,
    "exp": 1704391200
  }
  ```

### Refresh Token
- **Type:** JWT
- **Expiry:** 7 days
- **Usage:** Single-use. Each `/refresh` call claims the token and revokes it in one atomic database update, then issues a new pair. A second request with the same token (even one sent at the same moment) gets `401 REFRESH_TOKEN_REVOKED`
- **Max active:** 5 per user (multi-device support)
- **Storage:** SHA-256 hashed in MongoDB; a TTL index removes records after `expiresAt`

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
   - Claim the hashed refreshToken in one atomic update
     (match: not revoked → set revoked); no match → 401
   - If the claimed token has expired → 401
   - Issue new accessToken + new refreshToken
           │
           ▼
4. Return new token pair (same shape as login)
```

### Google OAuth

```
1. Client sends POST /api/v1/authenticate/google
   Body: { idToken, referralCode?, accountType?, acquisition? }
           │
           ▼
2. Server verifies with Google
   - Finds user by googleId
   - OR links by matching email
   - OR auto-creates an account: a Teacher if accountType is
     'Teacher', otherwise a Student
           │
           ▼
3. For a new account only: store acquisition details and credit
   the account to the owner of referralCode (never fails the login)
           │
           ▼
4. Return { user, tokens, isNewUser, referral } — same shape as login
```

### Signup

```
POST /api/v1/authenticate/signup
Body: { userName, email, password, confirmPassword, name,
        accountType?, contactNumber?, referralCode?, acquisition? }
- accountType: Student (default) or Teacher (Teachers can sign up
  on their own and create class join links). Any other value gets
  400 "Account type must be Student or Teacher"
  (INVALID_ACCOUNT_TYPE). Principals are created by an admin and
  linked to a school; parents come through the parent module
- New accounts are created with approved: true
- A valid referralCode credits the new account to its inviter;
  a bad or stale code is ignored and never fails the signup
- Returns { user, tokens, referral } (auto-login)
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

### Changing the Login Email

```
POST /api/v1/profile/email/request-change   Body: { email }
  - Emails a 6-digit code to the NEW address; the account is unchanged
POST /api/v1/profile/email/confirm-change   Body: { code }
  - Switches the login email and tells the old address
```

- Code: SHA-256 hash only, expires after 10 minutes, 5 wrong tries, re-send once a minute
- Both routes: 10 requests per 15 minutes per IP
- The new address is re-checked for uniqueness (case-insensitive) at confirm time
- Google sign-in matches by Google ID, so it keeps working after the change

---

## Protected Routes

### Middleware: `src/shared/middleware/auth.js`

JWT is accepted from either of:
- **Header:** `Authorization: Bearer <token>` (what the frontend uses)
- **Cookie:** `token=<jwt>` (read only if a cookie parser has populated `req.cookies`; the server never sets this cookie)

On success, `auth` also records the user as active today: one `useractivitydays` row per user per IST day plus `User.lastActiveAt`. The write happens at most once per user every 15 minutes, is not awaited, and a failure never fails the request. `optionalAuth` (used by public routes such as challenge play) does not record activity.

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

`isSuperAdmin` admits only `SuperAdmin`.

### Ownership Guards and Helpers

A role alone doesn't give access to another user's records. These checks tie a request to the caller:

| Guard / helper | Behaviour | Used on |
|----------------|-----------|---------|
| `isSelfOrSuperAdmin(param)` | Continues only when `req.params[param]` is the caller's own id, or the caller is a `SuperAdmin`. Otherwise `403` with `code: "NOT_YOUR_DATA"` | `/teacher-dashboard/:teacherId/...`; `/streaks/:userId` and `use-freeze`; `/daily-challenge/:userId`, `complete` and `history`; `/progress/user/:userId`; `/user-answers/user/:userId`; `/badges/:userId`; `/session-feedback/nps/check/:userId` |
| `principalSchoolScope` | Runs after `isPrincipal`. Sets `req.schoolScope` to the principal's school; a `SuperAdmin` gets no limit. A principal with no school linked gets `403` with `code: "NO_SCHOOL"` | Principal routes for teachers (`/teacher`), school update (`PUT /school/:id`) and section writes (`/sections`) |
| `canAccessUser(reqUser, ownerId)` (`src/shared/utils/access.js`) | `true` for the owner or a `SuperAdmin` | Sessions (`/sessions/user/:userId`, `/sessions/last-incomplete/:userId`, a single session, ending one, share cards) |

Teachers, principals and parents see students only through their own dashboards (`/teacher-dashboard`, `/principal`, `/parent-dashboard`), which check the teacher–student, school or parent–child link.

---

## Role-Based Access Control (RBAC)

### Available Roles
| Role | Description | Access Level |
|------|-------------|--------------|
| `SuperAdmin` | System administrator | Full access |
| `Principal` | School principal | Their own school only |
| `Teacher` | Teacher | Their own dashboard and assigned students |
| `Student` | Student | Personal data only |
| `Parent` | Parent/guardian | Child's data only |

---

## Password Security

### Hashing
- **Algorithm:** bcrypt
- **Salt Rounds:** 10

### Password Requirements
- Minimum 8 characters
- Must include at least one letter and one number (any other characters allowed)

### Password Field Behavior
- `password` has `select: false` — must use `.select('+password')` to read
- `email` has `unique: true` — duplicate returns 409

---

## API Endpoints

All under `/api/v1/authenticate/`:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/login` | POST | Rate-limited | `{ userName, password }` → `{ user, tokens }` |
| `/signup` | POST | Rate-limited | `{ userName, email, password, confirmPassword, name, accountType?, referralCode?, acquisition? }` → `{ user, tokens, referral }` |
| `/google` | POST | Rate-limited | `{ idToken, referralCode?, accountType?, acquisition? }` → `{ user, tokens, isNewUser, referral }` |
| `/refresh` | POST | None | `{ refreshToken }` → new token pair (each refresh token works once) |
| `/logout` | POST | None | `{ refreshToken }` → revoke token |
| `/changepassword` | POST | auth | Password change (revokes all refresh tokens) |
| `/reset-password-token` | POST | None | Send reset email |
| `/reset-password` | POST | None | `{ token, password, confirmPassword }` — revokes all refresh tokens |
| `/verify-email` | POST | None | `{ email, otp }` — OTP TTL: 5 min |

---

## Security Best Practices

1. **Never log tokens** — Exclude from API logger
2. **Use HTTPS** in production
3. **Short access token expiry** (2h) with single-use, rotating refresh tokens
4. **Password change/reset revokes all sessions**
5. **Rate limiting:** login 10 req/15min, signup 10 req/hour

---

