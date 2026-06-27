/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";

// Zod schemas matching types in types.ts

export const IssueSeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export const IssueStatusSchema = z.enum([
  "New",
  "Verified",
  "Assigned",
  "In Progress",
  "Resolved",
  "Reopened",
  "Rejected"
]);

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string(),
  role: z.enum(["citizen", "admin", "staff"]),
  language: z.enum(["en", "hi"]),
  civicScore: z.number(),
  trustScore: z.number().min(0).max(100),
  badges: z.array(z.string()),
  joinedAt: z.string(),
  pendingApproval: z.boolean().optional(),
  approved: z.boolean().optional(),
  denied: z.boolean().optional()
});

export const EvidenceSchema = z.object({
  url: z.string(),
  type: z.enum(["image", "video"]),
  thumbnailUrl: z.string().optional()
});

export const IssueSchema = z.object({
  id: z.string(),
  createdBy: z.string(),
  createdByName: z.string().optional(),
  createdByAvatar: z.string().optional(),
  title: z.string().max(120),
  originalDescription: z.string().max(2000),
  aiSummary: z.string(),
  category: z.string(),
  subcategory: z.string(),
  severity: IssueSeveritySchema,
  priorityScore: z.number().min(0).max(100),
  aiConfidence: z.number().min(0.0).max(1.0),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    isApproximate: z.boolean()
  }),
  address: z.string(),
  landmark: z.string(),
  evidence: z.array(EvidenceSchema),
  status: IssueStatusSchema,
  assignedDepartment: z.string(),
  verificationCount: z.number(),
  inaccurateCount: z.number(),
  followerCount: z.number(),
  duplicateOf: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  resolvedAt: z.string().optional(),
  safetyAdvice: z.string().optional(),
  possibleRisks: z.array(z.string()).optional(),
  visibleEvidence: z.array(z.string()).optional(),
  resolutionDetails: z.object({
    beforeImageUrl: z.string().optional(),
    afterImageUrl: z.string().optional(),
    adminNotes: z.string().optional(),
    resolvedAt: z.string().optional(),
    communityConfirmed: z.boolean().optional(),
    geminiAnalysis: z.string().optional()
  }).optional()
});

export const VerificationSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  userId: z.string(),
  username: z.string(),
  type: z.enum(["confirm", "dispute"]),
  comment: z.string().optional(),
  evidenceUrl: z.string().optional(),
  createdAt: z.string()
});

export const StatusUpdateSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  previousStatus: IssueStatusSchema,
  newStatus: IssueStatusSchema,
  updatedBy: z.string(),
  updatedByName: z.string(),
  publicMessage: z.string(),
  internalNote: z.string().optional(),
  evidenceUrl: z.string().optional(),
  createdAt: z.string()
});

export const DepartmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  contact: z.string(),
  activeIssues: z.number(),
  resolvedIssues: z.number(),
  averageResolutionTime: z.string()
});

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["submit", "verify", "assign", "progress", "resolved", "critical", "badge"]),
  issueId: z.string().optional(),
  title: z.string(),
  message: z.string(),
  read: z.boolean(),
  createdAt: z.string()
});

export const AuditLogSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  action: z.string(),
  performedBy: z.string(),
  performedByName: z.string(),
  metadata: z.record(z.string(), z.any()),
  createdAt: z.string()
});

export const CommunityInsightSchema = z.object({
  id: z.string(),
  title: z.string(),
  insight: z.string(),
  category: z.string(),
  location: z.string().optional(),
  confidence: z.number(),
  suggestedAction: z.string(),
  timestamp: z.string()
});

export const AnnouncementSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
  category: z.enum(["alert", "info", "warning", "success"]),
  department: z.string(),
  authorName: z.string()
});

// Gemini APIs Schemas

export const GeminiAnalysisSchema = z.object({
  title: z.string(),
  category: z.string(),
  description: z.string(),
  severity: z.number().int(),
  publicRisk: z.number().int(),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  confidence: z.number(),
  suggestedDepartment: z.string(),
  visibleEvidence: z.array(z.string()),
  safetyAdvice: z.string(),
  missingInformation: z.array(z.string()),
  clarifyingQuestion: z.string().nullable(),
  possibleDuplicateKeywords: z.array(z.string()),
  recommendedActions: z.array(z.string())
});

export const GeminiVerificationSchema = z.object({
  confidence: z.number().int(),
  notes: z.string(),
  resolved: z.boolean()
});
