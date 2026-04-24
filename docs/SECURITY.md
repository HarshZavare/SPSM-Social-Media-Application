# SPSM Security Documentation

## Overview

SPSM (Secure Privacy-focused Social Media) is a full-stack platform designed with security-first architecture. This document outlines the security measures, threat mitigations, and best practices implemented across the system.

---

## 1. Authentication Security

### Password Hashing
- **Algorithm**: bcrypt with 12 salt rounds
- **Why**: bcrypt is an adaptive hash function that is resistant to brute-force attacks. The high salt round count ensures computational cost scales with hardware improvements.

### JWT Tokens
- **Expiry**: 1 hour
- **Payload**: Minimal data (userId, email, username)
- **Transport**: `Authorization: Bearer <token>` header
- **Storage**: Client-side localStorage (consider HttpOnly cookies for higher security in production)

### Two-Factor Authentication (2FA)
- **Email OTP**: 6-digit numeric codes, bcrypt-hashed before storage, 5-minute expiry
- **TOTP (Authenticator App)**: HMAC-based, 30-second window with 1-step tolerance
- **Library**: [speakeasy](https://github.com/speakeasyjs/speakeasy)

### Account Lockout
- **Threshold**: 5 failed login attempts
- **Duration**: 30-minute lockout
- **Reset**: Successful password reset clears lockout

---

## 2. Encryption

### AES-256-GCM
All encryption uses AES-256 in GCM (Galois/Counter Mode):
- **Key Length**: 256 bits (32 bytes)
- **IV**: 16 bytes, randomly generated per operation
- **Authentication Tag**: 16 bytes (ensures integrity)

### Message Encryption
- Per-conversation symmetric keys derived using HKDF
- Key derivation: `HKDF(masterKey, SHA256(sortedUserIds), 'spsm-messaging', 32)`
- Messages never stored in plaintext

### File Encryption
- Per-file random 256-bit key
- Files encrypted in memory before disk write
- Encryption key stored in database (separate from file data)

---

## 3. API Security

### Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 requests | 15 minutes |
| Auth endpoints | 10 requests | 15 minutes |
| Password reset | 3 requests | 15 minutes |
| File upload | 10 requests | 1 hour |
| OTP verification | 5 requests | 5 minutes |

### Input Validation
- All inputs validated using `express-validator`
- Email normalization
- Password complexity requirements (8+ chars, upper, lower, number, special)
- Username alphanumeric only
- Message length limits (5000 chars)

### Security Headers (via Helmet)
- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`
- `Referrer-Policy: no-referrer`

### XSS Prevention
- Custom input sanitization middleware
- HTML entity encoding (`<`, `>`)
- `javascript:` protocol removal
- Event handler attribute stripping
- Password fields are excluded from sanitization

### CORS
- Explicit origin whitelist (no wildcards)
- Credentials mode enabled
- Limited HTTP methods (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`)

### SQL Injection Prevention
- All database queries use parameterized queries (`$1`, `$2`, etc.)
- No string concatenation in SQL
- PostgreSQL `pg` library handles escaping

---

## 4. Privacy Model

### Privacy Levels
| Level | Visibility |
|-------|-----------|
| PUBLIC | Anyone |
| FRIENDS_ONLY | Accepted friends |
| PRIVATE | Owner only |

### Enforcement
- Privacy checks executed server-side before returning data
- Default settings: Profile=PUBLIC, Posts=FRIENDS_ONLY, Contact=PRIVATE
- Friend relationship verified via database query

---

## 5. File Upload Security

1. **MIME Type Validation**: Whitelist of allowed types (images, PDF, DOC)
2. **Extension Validation**: Extension must match MIME type
3. **Size Limit**: 10MB maximum
4. **Directory Traversal Prevention**: `path.basename()` sanitization
5. **Unique Naming**: `crypto.randomUUID()` for stored filenames
6. **Memory Storage**: Files processed in memory, encrypted, then written
7. **ClamAV Integration**: Malware scanning (graceful fallback)

---

## 6. Incident Response

### Anomaly Detection
- **Multiple Failed Logins**: ≥3 attempts in 5 minutes triggers alert
- **New IP Detection**: Login from IP not seen in 30 days
- **Activity Frequency**: >50 actions per hour
- **Auto-Response**: Account lock + email notification for high severity

### Security Alerts
- Email notifications for account locks, new logins, password changes
- All alerts logged in `security_logs` table

---

## 7. Security Logging

### Event Types
- Authentication events (login, logout, register)
- Password operations (change, reset)
- File operations (upload, download)
- Privacy changes
- 2FA operations
- Account locks
- Suspicious activity

### Log Data
- User ID, event type, IP address, user agent, JSONB metadata, timestamp
- 30-day retention for statistics
- Filterable by event type and date range

---

## 8. Example API Requests

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","username":"johndoe","password":"SecurePass1!"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass1!"}'
```

### Send Encrypted Message
```bash
curl -X POST http://localhost:5000/api/messages/send \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"receiverId":"<USER_UUID>","content":"Hello, this is encrypted!"}'
```

### Upload File
```bash
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "file=@/path/to/image.png"
```

### Update Privacy Settings
```bash
curl -X PUT http://localhost:5000/api/privacy/settings \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"profile_visibility":"FRIENDS_ONLY","post_visibility":"PRIVATE","contact_visibility":"PRIVATE"}'
```

### Request Password Reset
```bash
curl -X POST http://localhost:5000/api/recovery/password-reset-request \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### Get Security Logs
```bash
curl -X GET http://localhost:5000/api/monitoring/logs?eventType=LOGIN_SUCCESS&limit=20 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 9. Production Recommendations

- [ ] Use HttpOnly cookies for JWT storage instead of localStorage
- [ ] Deploy ClamAV daemon for file scanning
- [ ] Use Redis for distributed rate limiting
- [ ] Enable PostgreSQL SSL connections
- [ ] Set up HTTPS with TLS 1.3
- [ ] Use environment-specific secrets management (Vault, AWS Secrets Manager)
- [ ] Implement refresh token rotation
- [ ] Add Content Security Policy reporting
- [ ] Set up log aggregation (ELK stack, Datadog)
- [ ] Regular security audits and penetration testing
