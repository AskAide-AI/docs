# AskAide AI - Authentication

**Last Updated:** 2026-01-11

---

## Authentication Strategy

**Primary Method:** JWT (JSON Web Tokens)  
**Secondary Method:** OTP (One-Time Password) via Email

---

## Token Structure

### Access Token
- **Type:** JWT
- **Expiry:** 24 hours (configurable via `JWT_EXPIRY`)
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

---

## Authentication Flows

### Email/Password Login

```
1. Client sends POST /api/v1/user/login
   Body: { email, password }
           │
           ▼
2. Server validates credentials
   - Find user by email
   - Compare password hash (bcrypt)
           │
           ▼
3. Generate JWT token
   - Sign with JWT_SECRET
   - Include userId, email, role
           │
           ▼
4. Return token to client
   { success: true, token: "eyJ...", user: {...} }
           │
           ▼
5. Client stores token
   - localStorage (web)
   - SecureStorage (mobile)
           │
           ▼
6. Client includes token in requests
   Authorization: Bearer <token>
```

### OTP Login

```
1. Client sends POST /api/v1/user/request-otp
   Body: { email }
           │
           ▼
2. Server generates 6-digit OTP
   - Create OTP record (expires in 10 min)
   - Send email via Nodemailer
           │
           ▼
3. Client receives OTP via email
           │
           ▼
4. Client sends POST /api/v1/user/verify-otp
   Body: { email, otp }
           │
           ▼
5. Server verifies OTP
   - Check expiration
   - Mark as verified
   - Generate JWT token
           │
           ▼
6. Return token (same as password flow)
```

---

## Protected Routes

### Middleware: `auth.middleware.js`

```javascript
// Extracts and verifies JWT from Authorization header
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token.' 
    });
  }
};
```

### Using in Routes

```javascript
import { auth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validators/auth.validator.js';

// Protected route
router.get('/profile', auth, getProfile);

// Public route with validation
router.post('/login', validate(loginSchema), login);
```

---

## Role-Based Access Control (RBAC)

### Available Roles
| Role | Description | Access Level |
|------|-------------|--------------|
| `admin` | System administrator | Full access |
| `principal` | School principal | School-level access |
| `teacher` | Teacher | Class/section access |
| `student` | Student | Personal data only |
| `parent` | Parent/guardian | Child's data only |

### Role Checking (Current Pattern)
```javascript
// In controller
if (req.user.role !== 'admin') {
  return res.status(403).json({ 
    success: false, 
    message: 'Admin access required' 
  });
}
```

### Recommended Pattern (Future)
```javascript
// Role middleware
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Insufficient permissions' 
    });
  }
  next();
};

// Usage
router.post('/school', auth, requireRole('admin'), createSchool);
```

---

## Password Security

### Hashing
- **Algorithm:** bcrypt
- **Salt Rounds:** 10
- **Implementation:**
  ```javascript
  import bcrypt from 'bcrypt';
  
  // Hash password (registration)
  const hash = await bcrypt.hash(password, 10);
  
  // Verify password (login)
  const isValid = await bcrypt.compare(password, user.password);
  ```

### Password Requirements
- Minimum 8 characters
- (Future: Add complexity requirements)

---

## Token Storage Recommendations

### Web Applications
```javascript
// Store in localStorage (simple but XSS vulnerable)
localStorage.setItem('token', token);

// Or httpOnly cookie (more secure, requires server setup)
// Set by server in response header
```

### Mobile Applications
- Use platform-specific secure storage
- React Native: `@react-native-async-storage/async-storage` with encryption
- Flutter: `flutter_secure_storage`

---

## Security Best Practices

1. **Never log tokens** - Exclude from API logger
2. **Use HTTPS** in production
3. **Short token expiry** - Consider 15min access + refresh token
4. **Validate on every request** - Middleware checks
5. **Logout invalidation** - (Future: Token blacklist with Redis)

---

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/user/signup` | POST | No | Register new user |
| `/api/v1/user/login` | POST | No | Email/password login |
| `/api/v1/user/request-otp` | POST | No | Request OTP email |
| `/api/v1/user/verify-otp` | POST | No | Verify OTP and login |
| `/api/v1/user/logout` | POST | Yes | Logout session |
| `/api/v1/user/profile` | GET | Yes | Get user profile |

---

*See [SECURITY.md](./SECURITY.md) for additional security measures.*
