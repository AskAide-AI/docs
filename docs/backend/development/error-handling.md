# AskAide AI - Error Handling

**Last Updated:** 2026-06-26

---

## Error Response Format

All API errors follow this structure:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical details (dev mode only)"
}
```

---

## HTTP Status Codes

| Code | Name | When Used |
|------|------|-----------|
| `200` | OK | Successful GET, PUT, PATCH |
| `201` | Created | Successful POST (resource created) |
| `400` | Bad Request | Validation errors, missing fields |
| `401` | Unauthorized | Missing or invalid JWT token |
| `403` | Forbidden | Valid auth but insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource (e.g., email exists) |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server errors |

---

## Common Error Scenarios

### Validation Errors (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Email is required",
    "Password must be at least 8 characters"
  ]
}
```

### Authentication Errors (401)
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

```json
{
  "success": false,
  "message": "Invalid or expired token."
}
```

### Authorization Errors (403)
```json
{
  "success": false,
  "message": "Admin access required"
}
```

### Not Found Errors (404)
```json
{
  "success": false,
  "message": "Chapter not found"
}
```

### Conflict Errors (409)
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

### Rate Limit Errors (429)
```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

---

## Current Error Handling Implementation

The project uses a centralized error handling system with three components:

### 1. `AppError` Custom Class
Located in `src/shared/middleware/errorHandler.js`:
```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Usage
throw new AppError('Chapter not found', 404);
```

### 2. `asyncHandler` Wrapper
Exported from `src/shared/middleware/errorHandler.js`:
```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage in routes
router.get('/:id', asyncHandler(async (req, res) => {
  const chapter = await Chapter.findById(req.params.id);
  if (!chapter) throw new AppError('Not found', 404);
  sendSuccess(res, 'Chapter found', chapter);
}));
```

### 3. Global Error Middleware
Registered last in `index.js` middleware chain:
```javascript
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational 
    ? err.message 
    : 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, error: err.message })
  });
};
```

### 4. Response Helper
All successful responses use `sendSuccess()` from `src/shared/utils/responseHandler.js`:
```javascript
sendSuccess(res, message, data, statusCode);
// Output: { success: true, message: "...", data: ... }
```

---

## Mongoose-Specific Errors

### CastError (Invalid ObjectId)
```javascript
// Thrown when: findById('invalid-id')
{
  "success": false,
  "message": "Invalid ID format"
}
```

### ValidationError (Schema Validation)
```javascript
// Thrown when: required field missing
{
  "success": false,
  "message": "Validation failed",
  "errors": ["email is required"]
}
```

### Duplicate Key Error (E11000)
```javascript
// Thrown when: unique constraint violated
{
  "success": false,
  "message": "Duplicate field value"
}
```

---

## Error Logging

### Current Implementation
- Winston logger with daily rotate file transport (`winston-daily-rotate-file`)
- Custom `apiLogger` middleware logs all requests: method, URL, status code, response body, duration
- API logs buffered via `apiLogBuffer.js` and flushed on shutdown (SIGTERM/SIGINT)
- Correlation IDs tracked per request via `requestContext.js`
- Log files stored in `logs/` directory

### Recommendations
1. **Exclude sensitive data** (passwords, tokens) from logs
2. **Log errors to stdout** for container/cloud collection

---

## Client-Side Error Handling

### Recommended Approach
```javascript
// API client wrapper
const api = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data;
  } catch (error) {
    // Handle network errors
    if (!error.message) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
};
```

---

*See [SECURITY.md](./SECURITY.md) for security-related error handling.*
