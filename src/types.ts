/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum IssueSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

export enum IssueStatus {
  NEW = "New",
  VERIFIED = "Verified",
  ASSIGNED = "Assigned",
  IN_PROGRESS = "In Progress",
  RESOLVED = "Resolved",
  REOPENED = "Reopened",
  REJECTED = "Rejected"
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "citizen" | "admin" | "staff";
  language: "en" | "hi";
  civicScore: number;
  trustScore: number; // 0 to 100
  badges: string[];
  joinedAt: string;
  pendingApproval?: boolean;
  approved?: boolean;
  denied?: boolean;
}

export interface Issue {
  id: string;
  createdBy: string;
  createdByName?: string;
  createdByAvatar?: string;
  title: string;
  originalDescription: string;
  aiSummary: string;
  category: string;
  subcategory: string;
  severity: IssueSeverity;
  priorityScore: number; // 0 to 100
  aiConfidence: number; // 0.0 to 1.0
  location: {
    lat: number;
    lng: number;
    isApproximate: boolean;
  };
  address: string;
  landmark: string;
  evidence: {
    url: string;
    type: "image" | "video";
    thumbnailUrl?: string;
  }[];
  status: IssueStatus;
  assignedDepartment: string;
  verificationCount: number;
  inaccurateCount: number;
  followerCount: number;
  duplicateOf?: string; // id of parent issue if duplicate
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  safetyAdvice?: string;
  possibleRisks?: string[];
  visibleEvidence?: string[];
  resolutionDetails?: {
    beforeImageUrl?: string;
    afterImageUrl?: string;
    adminNotes?: string;
    resolvedAt?: string;
    communityConfirmed?: boolean;
    geminiAnalysis?: string;
  };
}

export interface Verification {
  id: string;
  issueId: string;
  userId: string;
  username: string;
  type: "confirm" | "dispute";
  comment?: string;
  evidenceUrl?: string;
  createdAt: string;
}

export interface StatusUpdate {
  id: string;
  issueId: string;
  previousStatus: IssueStatus;
  newStatus: IssueStatus;
  updatedBy: string;
  updatedByName: string;
  publicMessage: string;
  internalNote?: string;
  evidenceUrl?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  contact: string;
  activeIssues: number;
  resolvedIssues: number;
  averageResolutionTime: string; // e.g. "24 hours"
}

export interface Notification {
  id: string;
  userId: string;
  type: "submit" | "verify" | "assign" | "progress" | "resolved" | "critical" | "badge";
  issueId?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  issueId: string;
  action: string;
  performedBy: string;
  performedByName: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface CommunityInsight {
  id: string;
  title: string;
  insight: string;
  category: string;
  location?: string;
  confidence: number;
  suggestedAction: string;
  timestamp: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  category: "alert" | "info" | "warning" | "success";
  department: string;
  authorName: string;
}
