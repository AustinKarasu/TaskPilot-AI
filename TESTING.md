# Testing Guide: CivicLens AI

CivicLens AI uses the `vitest` unit-testing framework alongside `supertest` for Express route integration and security validations.

## Prerequisites

Ensure all dependencies, including testing utilities, are installed:
```bash
npm install
```

## Running the Test Suite

To run all unit and integration/security tests in a single execution:
```bash
npm run test
```

## Test Directory Structure

The test files reside in `src/test/`:

- **`validations.test.ts`**: Verifies schema structures and input boundaries for users, issues, and Gemini JSON responses.
- **`chatbot.test.ts`**: Verifies response generation routing, system prompt injection checks, and Q&A fallback routing for the local chatbot.
- **`repository.test.ts`**: Evaluates data access structures (issues CRUD, score modifiers, and local migrations).
- **`security.test.ts`**: A comprehensive integration test suite verifying:
  - Cryptographic RS256 signature verification (forged, expired, wrong issuer, and wrong audience).
  - RBAC authorization middleware (denying citizens access to admin actions).
  - IDOR ownership guards on support tickets.
  - SSRF URL blocks (loopback and private subnets).
  - Strict rate-limiting behavior (verifying that the 6th call to sensitive endpoints returns `429`).

## Testing Security Implementations Mocking

- **JWKS Certificate Mocking**: The security test suite intercepts Google's public key endpoint fetches using `vi.spyOn(global, "fetch")` and signs test tokens using a dynamically generated RSA-2048 keypair.
- **SMTP Nodemailer Mocking**: Tests mock `nodemailer.createTransport` to resolve email delivery promises instantly, preventing SMTP handshakes from timing out.
