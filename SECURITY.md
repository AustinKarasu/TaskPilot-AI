# Security Policy: CivicLens AI

This document details the security model, configuration guidelines, and reporting practices for the CivicLens AI platform.

## Reporting a Vulnerability

We take the security of CivicLens AI seriously. If you identify any security vulnerability, please do not disclose it publicly. Contact the core engineering team directly at `aayankarasu@gmail.com` with:
- A descriptive title and summary of the issue.
- Detailed steps to reproduce the vulnerability (proof of concept).
- Potential impact and scope of exploitation.

We aim to acknowledge reports within 24 hours and issue a patch within 7 days.

## Security Architecture & Protections

CivicLens AI implements several defense-in-depth mechanisms:

### 1. Cryptographic Authentication & Verification (RS256 JWT validation)
- In production mode (`VITE_APP_MODE=firebase`), the backend cryptographically verifies all Firebase ID tokens.
- We pull Google's dynamic public certificates mapping `kid` identifiers to PEM formats from the verified endpoint: `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`.
- RSA-SHA256 signature verification is performed using Node's native `crypto.createVerify`.
- Claims verified:
  - Audience (`aud` must match `FIREBASE_PROJECT_ID`).
  - Issuer (`iss` must match `https://securetoken.google.com/<projectId>`).
  - Expiration time (`exp` must be in the future).
  - Issue time (`iat` must be in the past).

### 2. Role-Based Access Control (RBAC)
- All administrative and municipal crew endpoints are guarded by `requireRole` check middleware.
- Restricted administrative scopes:
  - Backups and restorations: Admin role only.
  - Testimonial approvals: Admin role only.
  - System announcements posting and deletion: Admin role only.
  - Ticket claims and status assignments: Admin and Staff roles only.

### 3. Resource Ownership and IDOR Prevention
- **Support Tickets**: Citizens can only view or reply to tickets where `ticket.userId` matches the authenticated `req.user.uid` token context. Staff/Admins can view and claim all.
- **Redemptions**: Points redemption requests enforce `userId` extraction directly from the verified credentials context (`req.user.uid`) instead of relying on client-supplied parameters.

### 4. Input Sanitization & Validation (Zod Schemas)
- Strict validation schemas are declared for all payload write routes using `zod`.
- Invalid request structures trigger 400 Bad Request, preventing mass-assignments, parameter injection, and payload overflow.

### 5. Server-Side Request Forgery (SSRF) Guard
- The multimodal image scans fetch-helper (`fetchSafeImage`) intercepts and resolves URL requests to prevent scanning of internal subnets and loopbacks.
- Rejects requests resolving to loopbacks (`localhost`, `127.0.0.1`, `0.0.0.0`) and private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) when running in production.

### 6. Rate Limiting
- **General Rate Limit**: 100 requests per minute per IP for standard API calls.
- **Strict Rate Limit**: 5 requests per minute per IP for sensitive routes (OTP, 2FA, contact support, password resets).

### 7. Structured JSON Logging
- Production systems output logs in a structured JSON format, mapping timestamps, severity levels, messages, and security-relevant metadata (e.g. rate-limit hits, signature validation failures) for automated security information and event management (SIEM) monitoring.
