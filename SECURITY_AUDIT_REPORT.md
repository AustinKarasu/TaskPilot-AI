# Security Audit & Remediation Report: CivicLens AI

## Executive Summary

CivicLens AI is a full-stack citizen reporting application. A comprehensive security review of the codebase identified several critical security vulnerabilities, including authentication bypasses, sensitive credentials leaks, SSRF, missing input validation, and lack of rate limiting. 

This report outlines the discovered vulnerabilities, their remediation, and the post-fix validation metrics. **All identified vulnerabilities have been successfully repaired, verified via automated test suites, and type-checked with zero compilation errors.**

---

## Vulnerability Metrics Summary

| Vulnerability ID | Description | Severity (Before) | Status (After) | Remediation Applied |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Unverified Firebase ID Token Signatures (Session Forgery) | **CRITICAL** | **RESOLVED** | Implemented RS256 signature verification against Google's dynamic JWKS certs. |
| **SEC-02** | Hardcoded SMTP Gmail Credentials | **HIGH** | **RESOLVED** | Extracted credentials to environment variables; fallback support configured. |
| **SEC-03** | Server-Side Request Forgery (SSRF) in Image Scan | **HIGH** | **RESOLVED** | Loopback and private IP blocks blocked in production for resolved URL requests. |
| **SEC-04** | IDOR and Impersonation in Points/Ticket Endpoints | **HIGH** | **RESOLVED** | Restrict citizen resource reads to token UID; redeem user overridden with token UID. |
| **SEC-05** | Lack of Input Validation (Mass Assignment risk) | **MEDIUM** | **RESOLVED** | Added strict validation middleware using Zod schemas for all write routes. |
| **SEC-06** | Lack of Rate Limiting (DOS & Bruteforce risk) | **MEDIUM** | **RESOLVED** | Implemented IP rate-limiters (100 req/min general; 5 req/min strict for OTP/tickets). |
| **SEC-07** | Missing HTTP Security Headers | **LOW** | **RESOLVED** | Implemented secure CSP, HSTS, XSS, Frame Options, and nosniff headers. |

---

## Detailed Vulnerability Analysis & Remediations

### SEC-01: Unverified Firebase ID Token Signatures (Session Forgery)
- **Original State**: The backend middleware decoded the JWT body but bypassed cryptographic validation of the RS256 signature, allowing arbitrary token construction and full system impersonation (including admin privileges).
- **Remediation**:
  - Implemented `verifyFirebaseIdToken` utilizing Node's native `crypto` module.
  - Dynamically fetches Google's public JWKS keys from Google's secure endpoint and caches them in memory.
  - Enforces RS256 signature verify and validates audience (`aud`), issuer (`iss`), expiration (`exp`), and issued-at (`iat`) claims.

### SEC-02: Hardcoded SMTP Gmail Credentials
- **Original State**: Hostmail SMTP credentials (`zevrylofficial@gmail.com` and app passcode) were hardcoded in `server.ts` and `server/emailService.ts`.
- **Remediation**:
  - Extracted to env variables (`SMTP_USER`, `SMTP_PASS`).
  - Set secure defaults in environment loads with instructions to rotate immediately in `.env.example`.

### SEC-03: Server-Side Request Forgery (SSRF) in Image Scan
- **Original State**: The AI image scanner helper resolved before-image URLs without restricting local loopbacks or private network subnets, introducing vulnerability to internal network scan mapping.
- **Remediation**:
  - Added robust validation to `fetchSafeImage`.
  - Blocked all private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) and local loopbacks (`localhost`, `127.0.0.1`, `0.0.0.0`) in production mode.

### SEC-04: IDOR and Impersonation in Points/Ticket Endpoints
- **Original State**: Points redemption accepted arbitrary client-side `userId` inputs. Comments, reports, and ticket replies allowed manual author names/IDs, opening up IDOR points-theft and citizen impersonation.
- **Remediation**:
  - Bound comments, verifications, and redemptions to the verified `req.user.uid` context.
  - Enforces support ticket message access only to the owning citizen (`ticket.userId === user.uid`) or authorized staff/admin.

### SEC-05: Lack of Input Validation
- **Original State**: Backend endpoints did not sanitize or validate payload structures, risking prototype pollution or crash scenarios on corrupt bodies.
- **Remediation**:
  - Created strict validation schemas for all write routes using `zod`.
  - Created `validateBody` Express middleware to sanitize body inputs.

### SEC-06: Lack of Rate Limiting
- **Original State**: Bruteforcing OTP verification and flooding support queues had no limits.
- **Remediation**:
  - Added IP rate-limiting middleware.
  - Sensitive endpoints (newsletter, OTP, reset password, support tickets) are strictly capped at 5 requests/minute.

### SEC-07: Missing HTTP Security Headers
- **Original State**: Missing standard production headers.
- **Remediation**:
  - Configured `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and custom Content-Security-Policy (CSP) headers on the express middleware.

---

## Verification & Compliance

Remediations have been verified using a comprehensive automated integration and security test suite:
- **Test Command**: `npm run test`
- **Result**: All 22 tests across 4 test suites passed successfully.
- **Type Safety**: Evaluated with `npx tsc --noEmit` which completed with zero type errors.
- **Build Status**: Verified via `npm run build` which generated full client bundles and compiled Node backend files correctly.
