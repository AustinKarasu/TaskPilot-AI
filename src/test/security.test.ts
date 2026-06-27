/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

// Mock nodemailer before importing app to prevent actual SMTP connection timeouts/hangs during tests
vi.mock("nodemailer", () => {
  return {
    default: {
      createTransport: vi.fn().mockReturnValue({
        sendMail: vi.fn().mockResolvedValue({ messageId: "mock-id" }),
      }),
    },
  };
});

import request from "supertest";
import crypto from "crypto";
import { app, fetchSafeImage, strictLimitMap } from "../../server";

// Generate RSA key pair for cryptographic token signing
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

const publicKeyPem = publicKey.export({ type: "pkcs1", format: "pem" }).toString();

// Dynamic mock helper for global.fetch to intercept public certificates dynamic key retrieval
const originalFetch = global.fetch;

beforeAll(() => {
  vi.spyOn(global, "fetch").mockImplementation(async (url: any) => {
    if (url.includes("securetoken@system.gserviceaccount.com")) {
      return {
        ok: true,
        headers: {
          get: (name: string) => (name.toLowerCase() === "cache-control" ? "max-age=3600" : null),
        },
        json: async () => ({
          "test-kid": publicKeyPem,
        }),
      } as any;
    }
    return originalFetch(url);
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});

// Helper to construct a cryptographically signed RS256 Firebase ID token
function createToken(payload: any, header = { alg: "RS256", kid: "test-kid", typ: "JWT" }) {
  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${headerB64}.${payloadB64}`);
  const signatureB64 = sign.sign(privateKey, "base64url");
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

describe("CivicLens AI Security & Integrity Test Suite", () => {
  const projectId = process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0000039141";

  describe("Cryptographic Token Verification (Firebase Mode)", () => {
    beforeAll(() => {
      process.env.VITE_APP_MODE = "firebase";
    });

    afterAll(() => {
      process.env.VITE_APP_MODE = "demo";
    });

    it("allows access with a validly signed Firebase token", async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = createToken({
        iss: `https://securetoken.google.com/${projectId}`,
        aud: projectId,
        sub: "cit-101",
        user_id: "cit-101",
        email: "rajesh@gmail.com",
        name: "Rajesh Kumar",
        role: "citizen",
        exp: now + 3600,
        iat: now - 10,
      });

      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it("rejects forged token signatures", async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = createToken({
        iss: `https://securetoken.google.com/${projectId}`,
        aud: projectId,
        sub: "cit-101",
        user_id: "cit-101",
        email: "rajesh@gmail.com",
        role: "citizen",
        exp: now + 3600,
        iat: now - 10,
      });

      // Tamper with the signature
      const parts = token.split(".");
      const forgedToken = `${parts[0]}.${parts[1]}.forgedsignaturevalue`;

      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("signature verification failed");
    });

    it("rejects expired tokens", async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = createToken({
        iss: `https://securetoken.google.com/${projectId}`,
        aud: projectId,
        sub: "cit-101",
        user_id: "cit-101",
        email: "rajesh@gmail.com",
        role: "citizen",
        exp: now - 100, // Expired
        iat: now - 500,
      });

      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("expired");
    });

    it("rejects wrong project audience", async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = createToken({
        iss: `https://securetoken.google.com/${projectId}`,
        aud: "malicious-project-id",
        sub: "cit-101",
        user_id: "cit-101",
        email: "rajesh@gmail.com",
        role: "citizen",
        exp: now + 3600,
        iat: now - 10,
      });

      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("Audience mismatch");
    });
  });

  describe("Authentication and RBAC (Demo Mode)", () => {
    beforeAll(() => {
      process.env.VITE_APP_MODE = "demo";
    });

    it("authenticates registered demo user from local db.json database", async () => {
      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", "Bearer cit-101");

      expect(res.status).toBe(200);
    });

    it("rejects unregistered demo user id", async () => {
      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", "Bearer non-existent-citizen-id");

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("User not found");
    });

    it("enforces role requirements (403 Forbidden for insufficient permissions)", async () => {
      const res = await request(app)
        .post("/api/announcements")
        .set("Authorization", "Bearer cit-101") // Citizen role
        .send({
          title: "Unauthorized Alert",
          content: "A citizen trying to post an administrative announcement.",
          category: "alert",
          department: "Municipal Works & Roads",
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("Insufficient permissions");
    });
  });

  describe("IDOR and Support Ticket Ownership checks", () => {
    beforeAll(() => {
      process.env.VITE_APP_MODE = "demo";
    });

    it("allows ticket owner to view messages, but denies access to other citizens", async () => {
      // 1. Create a support ticket for cit-101 (Rajesh Kumar)
      const ticketRes = await request(app)
        .post("/api/contact")
        .set("Authorization", "Bearer cit-101")
        .send({
          name: "Rajesh Kumar",
          email: "rajesh@gmail.com",
          subject: "Water leak on school road",
          message: "There is still water logging near the main gate."
        });

      expect(ticketRes.status).toBe(200);
      const ticketId = ticketRes.body.ticketId;
      expect(ticketId).toBeDefined();

      // 2. Access the ticket messages authenticated as the owner (cit-101) -> Should be allowed (200)
      const ownerRes = await request(app)
        .get(`/api/tickets/${ticketId}/messages`)
        .set("Authorization", "Bearer cit-101");

      expect(ownerRes.status).toBe(200);

      // 3. Attempt to access the ticket messages authenticated as another citizen (cit-102) -> Should be denied (403)
      const strangerRes = await request(app)
        .get(`/api/tickets/${ticketId}/messages`)
        .set("Authorization", "Bearer cit-102");

      expect(strangerRes.status).toBe(403);
      expect(strangerRes.body.error).toContain("cannot view messages for another citizen");

      // 4. Access the ticket messages authenticated as staff (staff-101) -> Should be allowed (200)
      const staffRes = await request(app)
        .get(`/api/tickets/${ticketId}/messages`)
        .set("Authorization", "Bearer staff-101");

      expect(staffRes.status).toBe(200);
    });
  });

  describe("Server-Side Request Forgery (SSRF) Rejections", () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeAll(() => {
      process.env.NODE_ENV = "production";
    });

    afterAll(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it("rejects loopback address URLs", async () => {
      await expect(fetchSafeImage("http://127.0.0.1/pothole.png")).rejects.toThrow(
        "Forbidden access: Local or private network fetch requests are blocked in production."
      );
      await expect(fetchSafeImage("http://localhost:3000/some-file")).rejects.toThrow(
        "Forbidden access: Local or private network fetch requests are blocked in production."
      );
    });

    it("rejects private subnet addresses", async () => {
      await expect(fetchSafeImage("https://192.168.1.100/leak.jpg")).rejects.toThrow(
        "Forbidden access: Local or private network fetch requests are blocked in production."
      );
      await expect(fetchSafeImage("http://10.0.0.1/evidence.png")).rejects.toThrow(
        "Forbidden access: Local or private network fetch requests are blocked in production."
      );
    });

    it("rejects non-http/https protocols", async () => {
      await expect(fetchSafeImage("ftp://12.34.56.78/image.png")).rejects.toThrow(
        "Only http/https are allowed"
      );
      await expect(fetchSafeImage("file:///etc/passwd")).rejects.toThrow(
        "Only http/https are allowed"
      );
    });
  });

  describe("Strict Endpoint Rate Limiting", () => {
    it("allows 5 requests but returns 429 Too Many Requests on the 6th call within the rate limit window", async () => {
      // Clear the strict rate limit map state to ensure a clean start for the test execution
      strictLimitMap.clear();

      // Target a strict rate-limited endpoint like /api/auth/2fa-send
      // We will perform 5 valid requests
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post("/api/auth/2fa-send")
          .send({
            email: "rajesh@gmail.com"
          });
        // Should succeed (200)
        expect(res.status).toBe(200);
      }

      // The 6th request should fail with 429
      const res6 = await request(app)
        .post("/api/auth/2fa-send")
        .send({
          email: "rajesh@gmail.com"
        });

      expect(res6.status).toBe(429);
      expect(res6.body.error).toContain("Too many requests to this sensitive endpoint");
    });
  });

  describe("Gemini Forensic Image Resolution Verification Endpoint", () => {
    it("returns mock resolution details successfully and marks resolved true when admin notes do not contain negative words", async () => {
      const res = await request(app)
        .post("/api/gemini/compare-before-after")
        .set("Authorization", "Bearer admin-101")
        .send({
          beforeImageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7",
          resolutionBase64: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7",
          adminNotes: "Asphalt cleared and hot sealed"
        });

      expect(res.status).toBe(200);
      expect(res.body.resolved).toBe(true);
      expect(res.body.confidence).toBeGreaterThanOrEqual(75);
      expect(res.body.notes).toContain("Confirmed resolution");
    });

    it("returns mock resolution details with resolved false when admin notes contain reject/fail/incomplete", async () => {
      const res = await request(app)
        .post("/api/gemini/compare-before-after")
        .set("Authorization", "Bearer admin-101")
        .send({
          beforeImageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7",
          resolutionBase64: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7",
          adminNotes: "Work is incomplete and has failed standards"
        });

      expect(res.status).toBe(200);
      expect(res.body.resolved).toBe(false);
      expect(res.body.confidence).toBeLessThan(75);
      expect(res.body.notes).toContain("Resolution failed inspection");
    });
  });
});
