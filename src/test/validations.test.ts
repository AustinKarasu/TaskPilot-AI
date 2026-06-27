/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { 
  UserSchema, 
  IssueSchema, 
  VerificationSchema, 
  GeminiAnalysisSchema, 
  GeminiVerificationSchema 
} from "../lib/validations";

describe("CivicLens Zod Schemas Validation", () => {
  it("validates a correct User structure", () => {
    const validUser = {
      id: "usr-101",
      name: "Rohan Das",
      email: "rohan@gmail.com",
      avatar: "avatar_url",
      role: "citizen",
      language: "en",
      civicScore: 120,
      trustScore: 95,
      badges: ["First Responder"],
      joinedAt: "2026-06-01T00:00:00Z"
    };

    const parsed = UserSchema.safeParse(validUser);
    expect(parsed.success).toBe(true);
  });

  it("fails on invalid email structure for User", () => {
    const invalidUser = {
      id: "usr-101",
      name: "Rohan Das",
      email: "not-an-email",
      avatar: "avatar_url",
      role: "citizen",
      language: "en",
      civicScore: 120,
      trustScore: 95,
      badges: [],
      joinedAt: "2026-06-01T00:00:00Z"
    };

    const parsed = UserSchema.safeParse(invalidUser);
    expect(parsed.success).toBe(false);
  });

  it("validates a correct GeminiAnalysis structure", () => {
    const validAnalysis = {
      title: "Broken Water Pipe Leak Bowbazar Road",
      category: "water_leakage",
      description: "Severe sidewalk flooding from primary sub-line pipe leakage.",
      severity: 8,
      publicRisk: 7,
      urgency: "high",
      confidence: 0.95,
      suggestedDepartment: "BWSSB Water Division",
      visibleEvidence: ["pond water", "sidewalk cracks"],
      safetyAdvice: "Keep clear of pooling mud.",
      missingInformation: [],
      clarifyingQuestion: null,
      possibleDuplicateKeywords: ["Bowbazar Water"],
      recommendedActions: ["Dispatch valves inspector", "pavement isolation"]
    };

    const parsed = GeminiAnalysisSchema.safeParse(validAnalysis);
    expect(parsed.success).toBe(true);
  });

  it("validates a correct GeminiVerification structure", () => {
    const validVerification = {
      confidence: 94,
      notes: "Bitumen paving is complete and dry.",
      resolved: true
    };

    const parsed = GeminiVerificationSchema.safeParse(validVerification);
    expect(parsed.success).toBe(true);
  });

  it("fails verification validation on missing properties", () => {
    const invalidVerification = {
      confidence: 94,
      resolved: true
    };

    const parsed = GeminiVerificationSchema.safeParse(invalidVerification);
    expect(parsed.success).toBe(false);
  });
});
