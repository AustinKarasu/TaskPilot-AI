/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { z } from "zod";
import { GeminiAnalysisSchema, GeminiVerificationSchema } from "./src/lib/validations";
import { CHATBOT_QA } from "./src/data/chatbotQA";
import nodemailer from "nodemailer";
import { 
  sendContactNotification, 
  sendNewsletterConfirmation, 
  sendPasswordResetLink, 
  sendAdmin2FACode, 
  sendIssueStatusUpdate,
  sendIssueReported,
  sendAnnouncementNotification,
  sendSupportTicketResolved,
  sendSupportTicketCreated
} from "./server/emailService";

// Load env variables
dotenv.config();

import crypto from "crypto";

// Structured JSON Logging helper
function logEvent(level: "INFO" | "WARN" | "ERROR", message: string, meta?: any) {
  const logObj = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  };
  console.log(JSON.stringify(logObj));
}

function getServerMode(): "demo" | "firebase" {
  return process.env.VITE_APP_MODE === "demo" ? "demo" : "firebase";
}

// Zod Validation Schemas for input validation on backend
const CreateIssueSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(10).max(2000),
  category: z.string().max(50),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  approximatePublicLocation: z.string().max(100).optional(),
  address: z.string().max(250).optional(),
  severity: z.number().min(1).max(10).optional(),
  publicRisk: z.number().min(1).max(10).optional(),
  aiConfidence: z.number().min(0.0).max(1.0).optional(),
  suggestedDepartment: z.string().max(100).optional(),
  beforeImageUrl: z.string().optional(),
  voiceInput: z.boolean().optional(),
  bypassDuplicateCheck: z.boolean().optional()
});

const VerifyIssueSchema = z.object({
  issueId: z.string(),
  notes: z.string().max(500).optional()
});

const FollowIssueSchema = z.object({
  issueId: z.string()
});

const GeocodeSearchSchema = z.object({
  q: z.string().trim().min(2).max(200),
  limit: z.coerce.number().int().min(1).max(10).optional()
});

const GeocodeReverseSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180)
});

const MergeIssuesSchema = z.object({
  duplicateId: z.string(),
  masterId: z.string()
});

const AddCommentSchema = z.object({
  issueId: z.string(),
  content: z.string().min(1).max(1000)
});

const UpdateStatusSchema = z.object({
  issueId: z.string(),
  status: z.enum(["New", "Verified", "Assigned", "In Progress", "Resolved", "Reopened", "Rejected"]),
  department: z.string().max(100).optional()
});

const RedeemRewardSchema = z.object({
  rewardId: z.string(),
  cost: z.number().int().positive(),
  title: z.string()
});

const AddAnnouncementSchema = z.object({
  title: z.string().min(5).max(150),
  content: z.string().min(10).max(2000),
  category: z.enum(["alert", "info", "warning", "success"]),
  department: z.string().max(100)
});

const AddTestimonialSchema = z.object({
  name: z.string().min(2).max(100),
  role: z.string().max(100).optional(),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(10).max(1000)
});

const CreateSupportTicketSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(3).max(150),
  message: z.string().min(10).max(2000)
});

const PostTicketReplySchema = z.object({
  text: z.string().min(1).max(2000)
});

const SendVerificationSchema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional()
});

const VerifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string()
});

const ForgotPasswordSchema = z.object({
  email: z.string().email()
});

const ResetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6).max(100)
});

const Send2FASchema = z.object({
  email: z.string().email()
});

const Verify2FASchema = z.object({
  email: z.string().email(),
  code: z.string()
});

// Zod validation middleware helper
function validateBody<T>(schema: z.Schema<T>) {
  return (req: Request, res: Response, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      logEvent("WARN", "Request validation failed", { path: req.path, errors: result.error.issues });
      res.status(400).json({ 
        success: false, 
        error: "Validation failed", 
        message: "Invalid request payload", 
        details: result.error.issues 
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

function validateQuery<T>(schema: z.Schema<T>) {
  return (req: Request, res: Response, next: any) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      logEvent("WARN", "Query validation failed", { path: req.path, errors: result.error.issues });
      res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Invalid query parameters",
        details: result.error.issues
      });
      return;
    }
    req.query = result.data as any;
    next();
  };
}

// Basic Rate Limiting
export const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT = 100; // Requests per window (general)
const RATE_WINDOW = 60 * 1000; // 1 minute

function rateLimiter(req: Request, res: Response, next: any) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return next();
  }

  if (record.count >= RATE_LIMIT) {
    logEvent("WARN", "General rate limit triggered", { ip, path: req.path });
    res.status(429).json({ success: false, error: "Too many requests. Please try again later.", message: "Rate limit exceeded" });
    return;
  }

  record.count += 1;
  next();
}

// Strict Rate Limiting for sensitive authentication/OTP routes
export const strictLimitMap = new Map<string, { count: number, resetTime: number }>();
const STRICT_LIMIT = 5; // 5 requests per window
const STRICT_WINDOW = 60 * 1000; // 1 minute

function strictRateLimiter(req: Request, res: Response, next: any) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = strictLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    strictLimitMap.set(ip, { count: 1, resetTime: now + STRICT_WINDOW });
    return next();
  }

  if (record.count >= STRICT_LIMIT) {
    logEvent("WARN", "Strict rate limit triggered", { ip, path: req.path });
    res.status(429).json({ success: false, error: "Too many requests to this sensitive endpoint. Please try again later.", message: "Sensitive rate limit exceeded" });
    return;
  }

  record.count += 1;
  next();
}

// Gemini Retry Wrapper
async function generateContentWithRetry(aiClient: GoogleGenAI, requestOptions: any, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await aiClient.models.generateContent(requestOptions);
    } catch (error: any) {
      attempt++;
      console.warn(`Gemini API attempt ${attempt} failed: ${error.message}`);
      if (attempt >= maxRetries || error.status === 400 || error.status === 403) {
        throw error;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

const DATA_DIR = path.join(process.cwd(), "data");

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Increase payload limits for base64 image uploads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Security Headers
app.use((req: Request, res: Response, next: any) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=(self)");
  next();
});

// DB local persistence path
const DB_PATH = path.join(DATA_DIR, "db.json");

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Lazy Initialize Gemini SDK representing a standard, safe pattern to prevent startup crashes.
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required to execute AI workflows.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Realistic Pre-seeded Demo Data
const INITIAL_ISSUES = [
  {
    id: "rep-001",
    title: "Deep Pothole Near Entrance of St. Xavier Primary School",
    description: "A large, deep pothole has formed right in the middle of the school approach road. It fills up with water when it rains, making it impossible for cyclists and pedestrians to estimate its depth. Multiple school kids on bicycles have tripped and injured themselves, presenting an immediate safety hazard during peak drop-off/pick-up hours.",
    category: "pothole",
    latitude: 22.5697,
    longitude: 88.3639,
    approximatePublicLocation: "Near St. Xavier Primary School, Kolkata",
    address: "St. Xavier Road, Central Kolkata, West Bengal, 700016",
    reporterId: "cit-101",
    reporterName: "Rajesh Kumar",
    status: "reported",
    priorityScore: 88,
    priorityLevel: "critical",
    severity: 9,
    publicRisk: 9,
    aiConfidence: 0.94,
    suggestedDepartment: "Municipal Works & Roads",
    verificationCount: 12,
    followersCount: 15,
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), // 36h ago
    updatedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    beforeImageUrl: "https://images.unsplash.com/photo-1599740831146-80e84523a027?auto=format&fit=crop&w=800&q=80",
    verifications: [
      { userId: "cit-102", userName: "Aisha Sen", createdAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(), notes: "Almost crashed my scooter into this today. Super dangerous!" },
      { userId: "cit-103", userName: "Arjun Das", createdAt: new Date(Date.now() - 25 * 3600 * 1000).toISOString(), notes: "It is extremely deep; verified this morning." }
    ],
    followers: ["cit-101", "cit-102", "cit-103", "cit-104"],
    aiReasoning: {
      priorityExplanation: "High priority due to extreme hazard score, located adjacent to a primary education facility, with 12 public verifications corroborating high-frequency pedestrian crashes.",
      duplicateStatus: "No nearby duplicates found in this block.",
      resolutionStatus: "Awaiting municipal response."
    }
  },
  {
    id: "rep-002",
    title: "Main Drinking Water Pipeline Rupture Flooding Subji Market Lane",
    description: "A major water leakage on the sidewalk has ruptured. Hundreds of liters of clean drinking water are leaking every hour. The water is flooding the vegetable market, washing away vendor stalls, and causing extreme slippery muddy hazards on the street, leading to economic damage and critical water wastage.",
    category: "water_leakage",
    latitude: 22.5726,
    longitude: 88.3585,
    approximatePublicLocation: "Subji Bazaar Market Lane, Kolkata",
    address: "Market Street, Bowbazar, Kolkata, West Bengal, 700012",
    reporterId: "cit-104",
    reporterName: "Ananya Roy",
    status: "under_verification",
    priorityScore: 78,
    priorityLevel: "high",
    severity: 8,
    publicRisk: 7,
    aiConfidence: 0.92,
    suggestedDepartment: "Water Supply & Sanitation",
    verificationCount: 8,
    followersCount: 12,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 24h ago
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    beforeImageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    verifications: [
      { userId: "cit-105", userName: "Amit Banerjee", createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(), notes: "Water pipeline has burst completely. Whole street is waterlogged." }
    ],
    followers: ["cit-104", "cit-105"],
    aiReasoning: {
      priorityExplanation: "High severity because it is continuously leaking high volumes of drinking water in a dense commercial zone, causing direct loss of public utility and road waterlogging.",
      duplicateStatus: "Potential match detected at 200m road intersection; monitored as master.",
      resolutionStatus: "Referred to City Water Supply unit for active valve shutdown."
    }
  },
  {
    id: "rep-003",
    title: "Uncontrolled Garbage Accumulation Outside Sector 5 Central Park Entrance",
    description: "A massive pile of commercial domestic garbage has accumulated on the walkway outside the central park entrance gate. Stray dogs, cows, and rodents are tearing through and scattering plastic bags. The strong rot smell makes recreational park usage unpleasant, creating immediate bio-sanitation concerns and blocking strollers.",
    category: "garbage",
    latitude: 22.5732,
    longitude: 88.4312,
    approximatePublicLocation: "Sector V Central Park Main Gate, Salt Lake",
    address: "Sector V, Salt Lake City, Bidhannagar, Kolkata, West Bengal, 700091",
    reporterId: "cit-102",
    reporterName: "Aisha Sen",
    status: "verified",
    priorityScore: 72,
    priorityLevel: "medium",
    severity: 7,
    publicRisk: 6,
    aiConfidence: 0.89,
    suggestedDepartment: "Solid Waste Management",
    verificationCount: 9,
    followersCount: 9,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    beforeImageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80",
    verifications: [
      { userId: "cit-101", userName: "Rajesh Kumar", createdAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString(), notes: "Highly offensive smell. This has been breeding flies for 3 days." }
    ],
    followers: ["cit-102", "cit-101"],
    aiReasoning: {
      priorityExplanation: "Medium/High priority due to heavy public traffic at park, blocking the primary walking sidewalk, and hosting vermin breeding vectors.",
      duplicateStatus: "No duplicate markers locally.",
      resolutionStatus: "Approved by public verification. Queue updated for container collection."
    }
  },
  {
    id: "rep-004",
    title: "Completely Clogged Stromwater Drain Causing High Street Waterlogging",
    description: "The storm drainage grate at the intersection is fully clogged with garbage, plastic waste, and dry leaves. Even a light flurry of rain translates to knee-deep clogging, rendering the crosswalk impassable and pushing water directly into several ground-floor retail shops.",
    category: "drainage",
    latitude: 22.5802,
    longitude: 88.3611,
    approximatePublicLocation: "MG Road Crossing, Kolkata",
    address: "Mahatma Gandhi Road, College Street crossing, Kolkata, West Bengal, 700007",
    reporterId: "cit-106",
    reporterName: "Joydeep Mukerjee",
    status: "assigned",
    assignedDepartment: "Drainage & Sewerage Systems",
    assignedStaffName: "Staff Debajit Saha",
    priorityScore: 82,
    priorityLevel: "high",
    severity: 8,
    publicRisk: 8,
    aiConfidence: 0.91,
    suggestedDepartment: "Drainage & Sewerage Systems",
    verificationCount: 15,
    followersCount: 22,
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 50 * 3600 * 1000).toISOString(),
    beforeImageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80",
    verifications: [],
    followers: ["cit-106"],
    aiReasoning: {
      priorityExplanation: "High priority due to intersection flooding and retail damage risk. Severe street drainage block requires mechanical suction truck intervention.",
      duplicateStatus: "None.",
      resolutionStatus: "Dispatched specialized drainage truck under Staff Debajit."
    }
  },
  {
    id: "rep-005",
    title: "Dangerous Dark Pedestrian Alleyway Due to Broken Streetlights",
    description: "Four successive lampposts along this dark pedestrian alleyway have completely burnt out, leaving the passage in absolute pitch black darkness after 6 PM. Multiple locals report feeling extremely unsafe, and there was an attempted phone snatching reported here yesterday.",
    category: "streetlight",
    latitude: 22.5855,
    longitude: 88.4109,
    approximatePublicLocation: "AE Block Alleyway, Salt Lake",
    address: "AE Block Road, near community club, Bidhannagar, West Bengal, 700064",
    reporterId: "cit-107",
    reporterName: "Meera Sen",
    status: "in_progress",
    assignedDepartment: "Electrical & Street Lighting",
    assignedStaffName: "Staff Sandeep Ray",
    priorityScore: 66,
    priorityLevel: "medium",
    severity: 6,
    publicRisk: 7,
    aiConfidence: 0.88,
    suggestedDepartment: "Electrical & Street Lighting",
    verificationCount: 5,
    followersCount: 8,
    createdAt: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    beforeImageUrl: "/assets/demo/dark_street_preset.png",
    verifications: [],
    followers: ["cit-107"],
    aiReasoning: {
      priorityExplanation: "Medium level safety issue. The darkness directly creates vulnerability to criminal activities. Assigned to bulb and circuit crew on patrol.",
      duplicateStatus: "None.",
      resolutionStatus: "Work order active. Crew replacing faulty transformers today."
    }
  },
  {
    id: "rep-006",
    title: "Illegal Industrial Waste Dumping & Garbage Pile On Ring Road Bypass",
    description: "Large piles of concrete debris, garbage bags, and hazardous chemical canisters have been illegally dumped on the green reservation on the side of the Ring Road Bypass under the cover of night. This is polluting local soil and looks extremely bad.",
    category: "illegal_dumping",
    latitude: 22.5451,
    longitude: 88.3842,
    approximatePublicLocation: "Ring Road Eastern Met Bypass",
    address: "EM Bypass Road, near Science City, Kolkata, West Bengal, 700046",
    reporterId: "cit-105",
    reporterName: "Amit Banerjee",
    status: "resolved",
    assignedDepartment: "Environmental Sanitation & Solid Waste",
    assignedStaffName: "Staff Sandeep Ray",
    priorityScore: 92,
    priorityLevel: "critical",
    severity: 9,
    publicRisk: 9,
    aiConfidence: 0.95,
    suggestedDepartment: "Environmental Control",
    verificationCount: 22,
    followersCount: 35,
    createdAt: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    beforeImageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
    resolutionImageUrl: "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80",
    resolutionConfidence: 94,
    verifications: [],
    followers: ["cit-105"],
    aiReasoning: {
      priorityExplanation: "Completed resolution checked by AI. Highly rated because chemical waste on public bypass was fully removed by municipal cleanup bulldozers.",
      duplicateStatus: "No further dumpings on this node.",
      resolutionStatus: "Resolved. AI Before-and-after checks confirmed green clean vegetation reinstated."
    }
  }
];

// Seed Users State with Points
const INITIAL_USERS = [
  {
    id: "cit-101",
    name: "Rajesh Kumar",
    email: "rajesh@gmail.com",
    role: "citizen",
    score: 180,
    badges: ["civic-helper", "verified-reporter"],
    reportsCount: 4,
    verificationsCount: 8,
    resolutionsCount: 2
  },
  {
    id: "cit-102",
    name: "Aisha Sen",
    email: "aisha@gmail.com",
    role: "citizen",
    score: 145,
    badges: ["civic-helper"],
    reportsCount: 3,
    verificationsCount: 5,
    resolutionsCount: 1
  },
  {
    id: "staff-101",
    name: "Officer Sandeep Ray",
    email: "sandeep@municipal.gov",
    role: "authority",
    score: 500,
    badges: ["resolution-champion", "local-hero"],
    reportsCount: 0,
    verificationsCount: 15,
    resolutionsCount: 12
  },
  {
    id: "admin-101",
    name: "SysAdmin Madara",
    email: "madarauchihalegend0@gmail.com", // Boostrap user email from runtime
    role: "admin",
    score: 1000,
    badges: ["community-guardian"],
    reportsCount: 1,
    verificationsCount: 20,
    resolutionsCount: 20
  }
];

// Comments state
const INITIAL_COMMENTS = [
  {
    id: "com-001",
    issueId: "rep-001",
    userId: "cit-102",
    userName: "Aisha Sen",
    userRole: "citizen",
    content: "The water fills up in it so much that yesterday a school pull-car nearly got stuck. It is a major road hazard.",
    createdAt: new Date(Date.now() - 32 * 3600 * 1000).toISOString()
  },
  {
    id: "com-002",
    issueId: "rep-001",
    userId: "cit-103",
    userName: "Arjun Das",
    userRole: "citizen",
    content: "We need authorities to clear this area before school starting time tomorrow.",
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  }
];

// Audit logs
const INITIAL_AUDITS = [
  {
    id: "aud-001",
    issueId: "rep-001",
    action: "ISSUE_REPORTED",
    performedBy: "cit-101",
    performerName: "Rajesh Kumar",
    performerRole: "citizen",
    details: "Issue successfully captured and generated by Gemini AI with critical classification.",
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  },
  {
    id: "aud-002",
    issueId: "rep-006",
    action: "RESOLUTION_VERIFIED",
    performedBy: "staff-101",
    performerName: "Officer Sandeep Ray",
    performerRole: "authority",
    details: "Field cleanup report submitted. Gemini compared the before-and-after photo and approved resolution with 94% confidence.",
    createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString()
  }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: "not-001",
    userId: "cit-101",
    title: "Issue Verified",
    message: "Your reported pothole near St. Xavier School has been verified by 12 other community members.",
    type: "verification",
    isRead: false,
    issueId: "rep-001",
    createdAt: new Date(Date.now() - 25 * 3600 * 1000).toISOString()
  }
];

// File load/save functions
function loadDatabase() {
  let dbData: any = null;
  if (fs.existsSync(DB_PATH)) {
    try {
      const content = fs.readFileSync(DB_PATH, "utf-8").trim();
      if (content) {
        dbData = JSON.parse(content);
      }
    } catch (e) {
      console.error("Error reading database file, using pre-seeds:", e);
    }
  }

  if (!dbData || typeof dbData !== "object") {
    dbData = {};
  }

  let modified = false;
  const isDemo = (process.env.VITE_APP_MODE || "demo") === "demo";

  if (isDemo) {
    if (!dbData.issues || !Array.isArray(dbData.issues) || dbData.issues.length === 0) {
      dbData.issues = INITIAL_ISSUES.map(i => ({ ...i }));
      modified = true;
    }
    if (!dbData.users || !Array.isArray(dbData.users) || dbData.users.length === 0) {
      dbData.users = INITIAL_USERS.map(u => ({ ...u }));
      modified = true;
    }
    if (!dbData.comments || !Array.isArray(dbData.comments) || dbData.comments.length === 0) {
      dbData.comments = INITIAL_COMMENTS.map(c => ({ ...c }));
      modified = true;
    }
    if (!dbData.notifications || !Array.isArray(dbData.notifications) || dbData.notifications.length === 0) {
      dbData.notifications = INITIAL_NOTIFICATIONS.map(n => ({ ...n }));
      modified = true;
    }
    if (!dbData.auditLogs || !Array.isArray(dbData.auditLogs) || dbData.auditLogs.length === 0) {
      dbData.auditLogs = INITIAL_AUDITS.map(a => ({ ...a }));
      modified = true;
    }
    if (!dbData.testimonials || !Array.isArray(dbData.testimonials) || dbData.testimonials.length === 0) {
      dbData.testimonials = [
        {
          id: "t-001",
          name: "Rajesh Kumar",
          role: "Citizen Auditor",
          rating: 5,
          content: "This platform is incredibly transparent. I reported a pothole and got it resolved in under 24 hours!",
          status: "approved",
          createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
        },
        {
          id: "t-002",
          name: "Officer Sandeep",
          role: "Municipal Crew",
          rating: 5,
          content: "As a technician, the forensic before/after photo check cuts down inspect timing and provides clear audit verification.",
          status: "approved",
          createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
        }
      ];
      modified = true;
    }
    if (!dbData.announcements || !Array.isArray(dbData.announcements) || dbData.announcements.length === 0) {
      dbData.announcements = [
        {
          id: "ann_1",
          title: "BESCOM Planned Power & Grid Outage Alert",
          content: "Please note that planned grid modernization and overhead cable-to-underground transition works will be carried out in Bellandur, Sarjapur, and Outer Ring Road blocks. Residents may experience temporary electricity dips.",
          createdAt: "2026-06-22T08:00:00Z",
          category: "warning",
          department: "Electricity Board (BESCOM)",
          authorName: "Admin Rajesh"
        },
        {
          id: "ann_2",
          title: "Monsoon Preparedness Drainage Cleaning Drive",
          content: "The BWSSB sanitary division has initiated high-pressure desilting and clearing of primary storm water drains cross-connecting sector lakes. Citizens can report blocked grates directly on CivicPulse to direct crews.",
          createdAt: "2026-06-21T10:30:00Z",
          category: "info",
          department: "Water & Sewerage (BWSSB)",
          authorName: "Inspector Kamal"
        },
        {
          id: "ann_3",
          title: "Sarjapur Road Resurfacing Task Completed",
          content: "Heavy bitumen milling and road leveling work near the Silk Board highway split has been completed 12 hours ahead of schedule by the PWD engineering cell. Transit delays are projected to return to standard parameters.",
          createdAt: "2026-06-20T17:00:00Z",
          category: "success",
          department: "Public Works Department",
          authorName: "Admin Rajesh"
        }
      ];
      modified = true;
    }
  } else {
    if (!dbData.issues || !Array.isArray(dbData.issues)) {
      dbData.issues = [];
      modified = true;
    }
    if (!dbData.users || !Array.isArray(dbData.users)) {
      dbData.users = [];
      modified = true;
    }
    if (!dbData.comments || !Array.isArray(dbData.comments)) {
      dbData.comments = [];
      modified = true;
    }
    if (!dbData.notifications || !Array.isArray(dbData.notifications)) {
      dbData.notifications = [];
      modified = true;
    }
    if (!dbData.auditLogs || !Array.isArray(dbData.auditLogs)) {
      dbData.auditLogs = [];
      modified = true;
    }
    if (!dbData.testimonials || !Array.isArray(dbData.testimonials)) {
      dbData.testimonials = [];
      modified = true;
    }
    if (!dbData.announcements || !Array.isArray(dbData.announcements)) {
      dbData.announcements = [];
      modified = true;
    }
  }

  if (!dbData.contactSubmissions || !Array.isArray(dbData.contactSubmissions)) {
    dbData.contactSubmissions = [];
    modified = true;
  }
  if (!dbData.newsletterSubscribers || !Array.isArray(dbData.newsletterSubscribers)) {
    dbData.newsletterSubscribers = [];
    modified = true;
  }
  if (!dbData.supportTickets || !Array.isArray(dbData.supportTickets)) {
    dbData.supportTickets = [];
    modified = true;
  }

  if (modified) {
    saveDatabase(dbData);
  }

  return dbData;
}

function saveDatabase(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to persist database to file", e);
  }
}

// Ensure database is populated
loadDatabase();

// Calculate AI Priority Score according to the exact mathematical guideline formula
function calculatePriorityScore(issue: {
  severity: number;
  publicRisk: number;
  verificationCount: number;
  followersCount: number;
  duplicateOf?: string;
  createdAt: string;
}) {
  // Enhanced priority engine with full factor list
  const severityPart = issue.severity * 4; // max 40 points
  const riskPart = issue.publicRisk * 4; // max 40 points
  const verificationsPart = Math.min(issue.verificationCount * 1.5, 10); // max 10 points
  const followersPart = Math.min(issue.followersCount * 0.5, 5); // max 5 points
  
  // Age weight (unresolved older issues score slight escalation boost to prevent rot)
  const days_old = (Date.now() - new Date(issue.createdAt).getTime()) / (24 * 3600 * 1000);
  const agePart = Math.min(days_old * 0.5, 5); // max 5 points
  
  let rawScore = severityPart + riskPart + verificationsPart + followersPart + agePart;

  // Escalation detection: If issue is highly severe but hasn't been fixed in > 7 days, apply escalation multiplier
  if (days_old > 7 && (issue.severity >= 8 || issue.publicRisk >= 8)) {
    rawScore *= 1.15; // 15% escalation boost
  }

  return Math.max(10, Math.min(Math.round(rawScore), 100)); // limit between 10 and 100
}

function getPriorityLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}

// Define API Proxy router first
const apiRouter = express.Router();

// ------------------- API: Reset Demo & Complete Compatibility -------------------
const handleResetAction = (req: Request, res: Response) => {
  const freshDb = {
    issues: INITIAL_ISSUES.map(i => ({ ...i })),
    users: INITIAL_USERS.map(u => ({ ...u })),
    comments: INITIAL_COMMENTS.map(c => ({ ...c })),
    notifications: INITIAL_NOTIFICATIONS.map(n => ({ ...n })),
    auditLogs: INITIAL_AUDITS.map(a => ({ ...a }))
  };
  saveDatabase(freshDb);
  res.json({ success: true, message: "Database successfully reset to pre-seeded demo state." });
};

apiRouter.post("/reset-demo", authenticateRequest, requireRole(["admin"]), handleResetAction);
apiRouter.post("/reset", authenticateRequest, requireRole(["admin"]), handleResetAction);
apiRouter.delete("/reset-demo", authenticateRequest, requireRole(["admin"]), handleResetAction);
apiRouter.delete("/reset", authenticateRequest, requireRole(["admin"]), handleResetAction);

// ------------------- API: Issues -------------------
apiRouter.get("/issues", (req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.issues);
});

apiRouter.get("/issues/:id", (req: Request, res: Response) => {
  const db = loadDatabase();
  const issue = db.issues.find((i: any) => i.id === req.params.id);
  if (!issue) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }
  res.json(issue);
});

apiRouter.delete("/issues/:id", authenticateRequest, requireRole(["admin"]), (req: Request, res: Response) => {
  const db = loadDatabase();
  const index = db.issues.findIndex((i: any) => i.id === req.params.id);
  if (index !== -1) {
    db.issues.splice(index, 1);
    saveDatabase(db);
    res.json({ success: true, message: "Issue successfully deleted." });
  } else {
    res.status(404).json({ error: "Issue not found" });
  }
});

// Report a New Issue with Autodetection of local duplicates
apiRouter.post("/issues", authenticateRequest, validateBody(CreateIssueSchema), (req: Request, res: Response) => {
  const {
    title,
    description,
    category,
    latitude,
    longitude,
    approximatePublicLocation,
    address,
    severity,
    publicRisk,
    aiConfidence,
    suggestedDepartment,
    beforeImageUrl,
    voiceInput
  } = req.body;

  const reporterId = (req as any).user.uid;
  const reporterName = (req as any).user.name || (req as any).user.email || "Anonymous Citizen";

  const db = loadDatabase();

  const id = `rep-${String(db.issues.length + 1).padStart(3, "0")}`;
  const now = new Date().toISOString();

  const newIssue: any = {
    id,
    title,
    description,
    category,
    latitude: latitude || 22.5726,
    longitude: longitude || 88.3639,
    approximatePublicLocation: approximatePublicLocation || "Kolkata",
    address: address || "Detected near report site",
    reporterId: reporterId || "cit-101",
    reporterName: reporterName || "Anonymous Citizen",
    status: "reported",
    severity: severity || 5,
    publicRisk: publicRisk || 5,
    aiConfidence: aiConfidence || 0.85,
    suggestedDepartment: suggestedDepartment || "General Municipal Services",
    verificationCount: 0,
    followersCount: 1,
    createdAt: now,
    updatedAt: now,
    beforeImageUrl: beforeImageUrl || "",
    verifications: [],
    followers: [reporterId || "cit-101"],
    voiceInput: !!voiceInput,
    aiReasoning: {
      priorityExplanation: "Priority calculated based on severity, risk, and category impact.",
      duplicateStatus: "Passed duplicate check.",
      resolutionStatus: "Awaiting assignment."
    }
  };

  // Perform AI Duplicate Search approximation on nearby reports (within ~300 meters)
  const radius = 0.003; // degrees approx. 300m
  const possibleDuplicates = db.issues.filter((i: any) => {
    if (i.status === "resolved" || i.duplicateOf) return false;
    const distanceLat = Math.abs(i.latitude - newIssue.latitude);
    const distanceLon = Math.abs(i.longitude - newIssue.longitude);
    const categoryMatches = i.category === newIssue.category;
    return distanceLat < radius && distanceLon < radius && categoryMatches;
  });

  if (possibleDuplicates.length > 0 && !req.body.bypassDuplicateCheck) {
    res.json({
      status: "duplicate_warning",
      duplicates: possibleDuplicates.map((d: any) => ({
        id: d.id,
        title: d.title,
        address: d.address,
        distance: "under 150 meters"
      }))
    });
    return;
  }

  // Calculate standard mathematical Priority Score
  newIssue.priorityScore = calculatePriorityScore(newIssue);
  newIssue.priorityLevel = getPriorityLevel(newIssue.priorityScore);

  // Update original reasoning report explanation
  newIssue.aiReasoning.priorityExplanation = `AI priority score calculated at ${newIssue.priorityScore} (Severity: ${newIssue.severity}/10, Safety Risk: ${newIssue.publicRisk}/10). Recommended action within ${newIssue.priorityLevel === "critical" ? "6 hours" : newIssue.priorityLevel === "high" ? "24 hours" : "48 hours"}.`;

  // Push to local database
  db.issues.unshift(newIssue);

  // Award point to user
  const user = db.users.find((u: any) => u.id === newIssue.reporterId);
  if (user) {
    user.score += 25; // 25 points per issue submitted
    user.reportsCount += 1;
    // Check badges
    if (user.reportsCount >= 3 && !user.badges.includes("civic-helper")) {
      user.badges.push("civic-helper");
      db.notifications.push({
        id: `not-${Date.now()}-1`,
        userId: user.id,
        title: "New Badge Unlocked!",
        message: "Congratulations! You earned the 'Civic Helper' badge for reporting 3+ community issues.",
        type: "badge",
        isRead: false,
        createdAt: now
      });
    }
    saveDatabase(db);
  }

  // Add audit log
  const auditId = `aud-${String(db.auditLogs.length + 1).padStart(3, "0")}`;
  db.auditLogs.push({
    id: auditId,
    issueId: id,
    action: "ISSUE_REPORTED",
    performedBy: newIssue.reporterId,
    performerName: newIssue.reporterName,
    performerRole: "citizen",
    details: `Community report '${newIssue.title}' created successfully near ${newIssue.approximatePublicLocation}.`,
    createdAt: now
  });

  // Save changes
  saveDatabase(db);

  // Dispatch email notification asynchronously
  const reporterUser = db.users.find((u: any) => u.id === newIssue.reporterId);
  if (reporterUser && reporterUser.email) {
    sendIssueReported(reporterUser.email, newIssue.title, newIssue.id).catch((err: any) => {
      console.error("Failed to send issue reported email:", err.message);
    });
  }

  res.json({ status: "success", issue: newIssue });
});

// Confirm and Merge duplicates manually or link them
apiRouter.post("/issues/merge", authenticateRequest, requireRole(["admin"]), validateBody(MergeIssuesSchema), (req: Request, res: Response) => {
  const { duplicateId, masterId } = req.body;
  const adminUserId = (req as any).user.uid;
  const db = loadDatabase();
  const duplicateIssue = db.issues.find((i: any) => i.id === duplicateId);
  const masterIssue = db.issues.find((i: any) => i.id === masterId);

  if (!duplicateIssue || !masterIssue) {
    res.status(404).json({ error: "Specified master or duplicate files not found." });
    return;
  }

  const now = new Date().toISOString();

  // Flag duplicate link
  duplicateIssue.duplicateOf = masterId;
  duplicateIssue.status = "resolved"; // Close duplicate
  duplicateIssue.aiReasoning.duplicateStatus = `Merged into master issue ${masterId} by Administrator.`;

  // Increase master counts & weight
  masterIssue.verificationCount += duplicateIssue.verificationCount + 1;
  masterIssue.followersCount += duplicateIssue.followersCount;
  masterIssue.priorityScore = calculatePriorityScore(masterIssue);
  masterIssue.priorityLevel = getPriorityLevel(masterIssue.priorityScore);
  
  // Re-adjust master AI description
  masterIssue.aiReasoning.priorityExplanation = `AI priority boosted to ${masterIssue.priorityScore} due to duplicate report ingestion from community report '${duplicateIssue.title}'.`;

  // Create audit log
  const auditId = `aud-${String(db.auditLogs.length + 1).padStart(3, "0")}`;
  db.auditLogs.push({
    id: auditId,
    issueId: masterId,
    action: "DUP_MERGED",
    performedBy: adminUserId,
    performerName: "Administrator Action",
    performerRole: "admin",
    details: `Merged duplicate report '${duplicateIssue.title}' (${duplicateId}) into master report. Raised priority score to ${masterIssue.priorityScore}.`,
    createdAt: now
  });

  // Notify original reporter
  db.notifications.push({
    id: `not-${Date.now()}-2`,
    userId: duplicateIssue.reporterId,
    title: "Report Merged with Duplicate",
    message: `Your community report was merged with an existing nearby reported issue. Both issues maintain synchronous updates until complete resolution!`,
    type: "duplicate",
    isRead: false,
    issueId: masterId,
    createdAt: now
  });

  saveDatabase(db);
  res.json({ success: true, masterIssue });
});

// Citizen Verification System representing the 11th milestone in Core flow
apiRouter.post("/issues/verify", authenticateRequest, validateBody(VerifyIssueSchema), (req: Request, res: Response) => {
  const { issueId, notes } = req.body;
  const userId = (req as any).user.uid;
  const userName = (req as any).user.name || (req as any).user.email || "Verified Citizen";

  const db = loadDatabase();
  const issue = db.issues.find((i: any) => i.id === issueId);
  if (!issue) {
    res.status(404).json({ error: "Issue files not found." });
    return;
  }

  // Check if already verified
  const alreadyVerified = issue.verifications.some((v: any) => v.userId === userId);
  if (alreadyVerified) {
    res.status(400).json({ error: "You have already verified this neighborhood issue." });
    return;
  }

  const now = new Date().toISOString();

  // Add verification record
  issue.verifications.push({
    userId,
    userName,
    createdAt: now,
    notes: notes || "Verified this report is indeed real."
  });

  // Increment counts
  issue.verificationCount = issue.verifications.length;
  issue.status = "verified"; // Auto promote to verified
  issue.priorityScore = calculatePriorityScore(issue);
  issue.priorityLevel = getPriorityLevel(issue.priorityScore);

  // Re-adjust reasoning explanation
  issue.aiReasoning.priorityExplanation = `Priority dynamically updated to ${issue.priorityScore} over ${issue.verificationCount} public citizen validations. High validation count signifies immediate municipal routing.`;

  // Award points
  const user = db.users.find((u: any) => u.id === userId);
  if (user) {
    user.score += 15; // 15 points per valid verification
    user.verificationsCount += 1;
    // Check badges
    if (user.verificationsCount >= 5 && !user.badges.includes("verified-reporter")) {
      user.badges.push("verified-reporter");
      db.notifications.push({
        id: `not-${Date.now()}-3`,
        userId: user.id,
        title: "New Badge Unlocked!",
        message: "You've earned the 'Verified Reporter' badge for providing 5+ critical community validations.",
        type: "badge",
        isRead: false,
        createdAt: now
      });
    }
  }

  // Create audit log
  const auditId = `aud-${String(db.auditLogs.length + 1).padStart(3, "0")}`;
  db.auditLogs.push({
    id: auditId,
    issueId: issueId,
    action: "ISSUE_VERIFIED",
    performedBy: userId,
    performerName: userName,
    performerRole: (req as any).user.role || "citizen",
    details: `Citizen verified community issue report. Raised total verification gauge to ${issue.verificationCount}.`,
    createdAt: now
  });

  // Notify original reporter
  db.notifications.push({
    id: `not-${Date.now()}-4`,
    userId: issue.reporterId,
    title: "Issue Verified",
    message: `Your reported community issue has been verified and seconded by ${userName}!`,
    type: "verification",
    isRead: false,
    issueId: issue.id,
    createdAt: now
  });

  saveDatabase(db);
  res.json({ success: true, issue });
});

// Follow Issue
apiRouter.post("/issues/follow", authenticateRequest, validateBody(FollowIssueSchema), (req: Request, res: Response) => {
  const { issueId } = req.body;
  const userId = (req as any).user.uid;

  const db = loadDatabase();
  const issue = db.issues.find((i: any) => i.id === issueId);
  if (!issue) {
    res.status(404).json({ error: "not found" });
    return;
  }

  if (!issue.followers.includes(userId)) {
    issue.followers.push(userId);
    issue.followersCount = issue.followers.length;
    saveDatabase(db);
  }

  res.json({ success: true, followersCount: issue.followersCount });
});

// Comments API
// Comments API
apiRouter.post("/comments", authenticateRequest, validateBody(AddCommentSchema), (req: Request, res: Response) => {
  const { issueId, content } = req.body;
  const userId = (req as any).user.uid;
  const userName = (req as any).user.name || (req as any).user.email || "Anonymous User";
  const userRole = (req as any).user.role || "citizen";

  const db = loadDatabase();
  const now = new Date().toISOString();

  const newComment = {
    id: `com-${Date.now()}`,
    issueId,
    userId,
    userName,
    userRole,
    content,
    createdAt: now
  };

  db.comments.push(newComment);

  // Notify critical project followers
  const issue = db.issues.find((i: any) => i.id === issueId);
  if (issue) {
    issue.followers.forEach((fId: string) => {
      if (fId !== userId) {
        db.notifications.push({
          id: `not-${Date.now()}-${fId}`,
          userId: fId,
          title: "New Comment on Followed Issue",
          message: `${userName} left a comment: "${content.substring(0, 50)}..."`,
          type: "comment",
          isRead: false,
          issueId: issue.id,
          createdAt: now
        });
      }
    });
  }

  saveDatabase(db);
  res.json(newComment);
});

apiRouter.get("/comments/:issueId", (req: Request, res: Response) => {
  const db = loadDatabase();
  const filtered = db.comments.filter((c: any) => c.issueId === req.params.issueId);
  res.json(filtered);
});

// Authority Status assignments and changes
apiRouter.post("/issues/status", authenticateRequest, requireRole(["admin", "staff"]), validateBody(UpdateStatusSchema), (req: Request, res: Response) => {
  const { issueId, status, department } = req.body;
  const staffId = (req as any).user.uid;
  const staffName = (req as any).user.name || (req as any).user.email || "Municipal Staff";

  const db = loadDatabase();
  const issue = db.issues.find((i: any) => i.id === issueId);
  if (!issue) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }

  const now = new Date().toISOString();
  const prevStatus = issue.status;
  issue.status = status;
  issue.updatedAt = now;

  issue.assignedStaffName = staffName;
  issue.assignedStaffId = staffId;
  if (department) issue.assignedDepartment = department;

  // Add target resolution timing
  if (status === "assigned" && !issue.targetResolutionAt) {
    // default SLA: 3 days from assignment
    issue.targetResolutionAt = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
  }

  // Create audit trail
  const auditId = `aud-${String(db.auditLogs.length + 1).padStart(3, "0")}`;
  db.auditLogs.push({
    id: auditId,
    issueId: issueId,
    action: "STATUS_CHANGED",
    performedBy: staffId,
    performerName: staffName,
    performerRole: (req as any).user.role || "authority",
    details: `Status shifted from '${prevStatus}' to '${status}'. Dep assigned: ${department || "None"}.`,
    createdAt: now
  });

  // Notify followers
  issue.followers.forEach((fId: string) => {
    db.notifications.push({
      id: `not-${Date.now()}-${fId}`,
      userId: fId,
      title: "Issue Status Updated",
      message: `The reported issue '${issue.title}' is now updated to: [${status.toUpperCase()}].`,
      type: "status_change",
      isRead: false,
      issueId: issue.id,
      createdAt: now
    });

    // Send email notification asynchronously
    const followerUser = db.users.find((u: any) => u.id === fId);
    if (followerUser && followerUser.email) {
      sendIssueStatusUpdate(followerUser.email, issue.title, status).catch((err: any) => {
        console.error(`Failed to send status update email to ${followerUser.email}:`, err.message);
      });
    }
  });

  saveDatabase(db);
  res.json({ success: true, issue });
});

// ------------------- API: Notifications -------------------
// ------------------- API: Notifications -------------------
apiRouter.get("/notifications", authenticateRequest, (req: Request, res: Response) => {
  const db = loadDatabase();
  const user = (req as any).user;
  const targetUserId = req.query.userId as string || user.uid;
  
  // Citizens can only view their own notifications
  if (user.role === "citizen" && targetUserId !== user.uid) {
    res.status(403).json({ error: "Access Denied: You cannot view notifications for another citizen." });
    return;
  }
  
  const filtered = db.notifications.filter((n: any) => n.userId === targetUserId);
  res.json(filtered);
});

apiRouter.get("/notifications/:userId", authenticateRequest, (req: Request, res: Response) => {
  const db = loadDatabase();
  const user = (req as any).user;
  const targetUserId = req.params.userId;
  
  if (user.role === "citizen" && targetUserId !== user.uid) {
    res.status(403).json({ error: "Access Denied: You cannot view notifications for another citizen." });
    return;
  }
  
  const filtered = db.notifications.filter((n: any) => n.userId === targetUserId);
  res.json(filtered);
});

const handleMarkNotificationsRead = (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user.uid; // Enforce marking read only for the authenticated user
  const db = loadDatabase();
  db.notifications.forEach((n: any) => {
    if (n.userId === userId) {
      n.isRead = true;
    }
  });
  saveDatabase(db);
  res.json({ success: true });
};

apiRouter.post("/notifications/read", authenticateRequest, handleMarkNotificationsRead);
apiRouter.post("/notifications/read-all", authenticateRequest, handleMarkNotificationsRead);

// ------------------- API: User Profile & Gamification -------------------
const ALL_BADGES = {
  "civic-helper": {
    id: "civic-helper",
    title: "Civic Helper",
    name: "Civic Helper",
    description: "Earned for reporting 3+ municipal issues",
    icon: "award",
    pointsRequired: 75
  },
  "verified-reporter": {
    id: "verified-reporter",
    title: "Verified Reporter",
    name: "Verified Reporter",
    description: "Earned for providing 5+ critical community validations",
    icon: "shield",
    pointsRequired: 150
  },
  "resolution-champion": {
    id: "resolution-champion",
    title: "Resolution Champion",
    name: "Resolution Champion",
    description: "Earned for completing 10+ field resolutions",
    icon: "sparkles",
    pointsRequired: 400
  },
  "local-hero": {
    id: "local-hero",
    title: "Local Hero",
    name: "Local Hero",
    description: "Earned for high community trust and engagement",
    icon: "heart",
    pointsRequired: 500
  },
  "community-guardian": {
    id: "community-guardian",
    title: "Community Guardian",
    name: "Community Guardian",
    description: "Highest administrator engagement credentials",
    icon: "shield-alert",
    pointsRequired: 1000
  }
};

const handleGetUserProfile = (req: Request, res: Response) => {
  const db = loadDatabase();
  const user = (req as any).user;
  const userId = req.params.userId || (user ? user.uid : null) || "cit-101";
  
  let profile = db.users.find((u: any) => u.id === userId);
  if (!profile && (userId === "user-1" || userId === "cit-101")) {
    profile = db.users.find((u: any) => u.role === "admin" || u.id === "cit-101");
  }
  
  if (!profile) {
    res.status(404).json({ error: "User profile not found." });
    return;
  }

  const mappedBadges = (profile.badges || []).map((badgeId: string) => {
    return (ALL_BADGES as any)[badgeId] || {
      id: badgeId,
      title: badgeId.replace("-", " ").toUpperCase(),
      name: badgeId.replace("-", " ").toUpperCase(),
      description: "Unlocked community badge level achievements",
      icon: "award",
      pointsRequired: 50
    };
  });

  res.json({
    ...profile,
    totalScore: profile.score || 0,
    activeBadges: mappedBadges
  });
};

apiRouter.get("/user-profile/:userId", authenticateRequest, handleGetUserProfile);
apiRouter.get("/users/profile", authenticateRequest, handleGetUserProfile);

// Redeem a Civic Reward
apiRouter.post("/users/redeem", authenticateRequest, validateBody(RedeemRewardSchema), (req: Request, res: Response) => {
  const { rewardId, cost, title } = req.body;
  const userId = (req as any).user.uid; // Enforce user ID from authenticated credentials (IDOR fix)
  
  const db = loadDatabase();
  const user = db.users.find((u: any) => u.id === userId);
  
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  if (user.score < cost) {
    res.status(400).json({ error: "Insufficient civic points." });
    return;
  }

  // Deduct score
  user.score -= cost;
  
  // Log the redemption in audit logs
  const auditId = `aud-${String(db.auditLogs.length + 1).padStart(3, "0")}`;
  db.auditLogs.push({
    id: auditId,
    action: "REWARD_REDEEMED",
    performedBy: user.id,
    performerName: user.name,
    performerRole: user.role,
    details: `User redeemed reward '${title}' for ${cost} points.`,
    createdAt: new Date().toISOString()
  });

  saveDatabase(db);

  // Generate a unique digital hash/QR code
  const generatedCode = "CP-" + Math.floor(100000 + Math.random() * 900000);

  res.json({ success: true, newScore: user.score, code: generatedCode });
});

// ------------------- API: Audit Logs -------------------
const handleGetAuditLogs = (req: Request, res: Response) => {
  const db = loadDatabase();
  const logs = Array.isArray(db.auditLogs) ? db.auditLogs : [];
  const mappedLogs = logs.map((log: any) => ({
    ...log,
    timestamp: log.createdAt || log.timestamp || new Date().toISOString(),
    userName: log.performerName || log.userName || "System Operator",
    userId: log.performedBy || log.userId || "system"
  }));
  res.json(mappedLogs);
};

apiRouter.get("/audit-logs", authenticateRequest, requireRole(["admin"]), handleGetAuditLogs);
apiRouter.get("/audit", authenticateRequest, requireRole(["admin"]), handleGetAuditLogs);

// ------------------- API: Analytics & Impact metrics -------------------
apiRouter.get("/analytics", (req: Request, res: Response) => {
  const db = loadDatabase();
  const total = db.issues.length;
  const verified = db.issues.filter((i: any) => i.status !== "reported" && i.status !== "under_verification").length;
  const resolved = db.issues.filter((i: any) => i.status === "resolved").length;
  
  const resolvedDurations = db.issues
    .filter((i: any) => i.resolvedAt && i.createdAt)
    .map((i: any) => new Date(i.resolvedAt).getTime() - new Date(i.createdAt).getTime())
    .filter((duration: number) => Number.isFinite(duration) && duration > 0);
  const avgMs = resolvedDurations.length
    ? resolvedDurations.reduce((sum: number, duration: number) => sum + duration, 0) / resolvedDurations.length
    : 0;
  const avgResponseTime = avgMs > 0 ? `${(avgMs / 3600000).toFixed(1)} Hours` : "N/A";
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Categories count
  const categories: { [key: string]: number } = {};
  db.issues.forEach((i: any) => {
    categories[i.category] = (categories[i.category] || 0) + 1;
  });

  // Priorities count
  const priorities = { critical: 0, high: 0, medium: 0, low: 0 };
  db.issues.forEach((i: any) => {
    const level = i.priorityLevel as "critical" | "high" | "medium" | "low";
    if (priorities[level] !== undefined) {
      priorities[level]++;
    }
  });

  const statusCounts = {
    reported: 0,
    under_verification: 0,
    verified: 0,
    assigned: 0,
    in_progress: 0,
    resolved: 0
  };
  db.issues.forEach((i: any) => {
    if (statusCounts[i.status as keyof typeof statusCounts] !== undefined) {
      statusCounts[i.status as keyof typeof statusCounts]++;
    }
  });

  const hotspotCounts: Record<string, { count: number, dangerRating: string, color: string, desc: string }> = {};
  db.issues.forEach((i: any) => {
    const loc = i.approximatePublicLocation || "General Area";
    if (!hotspotCounts[loc]) {
      hotspotCounts[loc] = { count: 0, dangerRating: "Medium", color: "bg-yellow-500", desc: "Citizen reported infrastructure concerns." };
    }
    hotspotCounts[loc].count++;
    if (hotspotCounts[loc].count > 3) {
      hotspotCounts[loc].dangerRating = "High";
      hotspotCounts[loc].color = "bg-orange-500";
    }
    if (hotspotCounts[loc].count > 7) {
      hotspotCounts[loc].dangerRating = "Critical";
      hotspotCounts[loc].color = "bg-red-500";
    }
  });

  const hotspots = Object.entries(hotspotCounts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  res.json({
    metrics: {
      totalInput: total,
      verifiedInput: verified,
      resolvedInput: resolved,
      averageResponseTime: avgResponseTime,
      resolutionRate: `${resolutionRate}%`,
      activeCitizens: db.users.filter((u: any) => u.role === "citizen").length
    },
    categoryCounts: categories,
    statusCounts: statusCounts,
    priorities,
    hotspots
  });
});


interface GoogleCertificates {
  keys: Record<string, string>;
  expiresAt: number;
}

let cachedCerts: GoogleCertificates | null = null;

async function fetchGooglePublicKeys(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedCerts && cachedCerts.expiresAt > now) {
    return cachedCerts.keys;
  }

  try {
    const res = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
    if (!res.ok) {
      throw new Error(`Failed to fetch Firebase public keys: ${res.statusText}`);
    }

    const cacheControl = res.headers.get("cache-control");
    let maxAge = 3600; // 1 hour default
    if (cacheControl) {
      const match = cacheControl.match(/max-age=(\d+)/);
      if (match) {
        maxAge = parseInt(match[1], 10);
      }
    }

    const keys = await res.json() as Record<string, string>;
    cachedCerts = {
      keys,
      expiresAt: now + (maxAge * 1000)
    };
    return keys;
  } catch (err: any) {
    logEvent("ERROR", "Error fetching Google public certificates", { error: err.message });
    if (cachedCerts) {
      return cachedCerts.keys;
    }
    throw err;
  }
}

async function verifyFirebaseIdToken(token: string): Promise<any> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Token must have 3 parts");
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  let header: any;
  try {
    header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf-8"));
  } catch (e) {
    throw new Error("Invalid JWT header formatting");
  }

  if (header.alg !== "RS256") {
    throw new Error("Invalid token signing algorithm (expected RS256)");
  }

  const kid = header.kid;
  if (!kid) {
    throw new Error("Token missing kid parameter");
  }

  const publicKeys = await fetchGooglePublicKeys();
  const cert = publicKeys[kid];
  if (!cert) {
    throw new Error("Public key corresponding to token kid not found");
  }

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(`${headerB64}.${payloadB64}`);

  const signature = Buffer.from(signatureB64, "base64url");
  const verified = verifier.verify(cert, signature);
  if (!verified) {
    throw new Error("Cryptographic signature verification failed");
  }

  let payload: any;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
  } catch (e) {
    throw new Error("Invalid JWT payload formatting");
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0000039141";
  const now = Math.floor(Date.now() / 1000);

  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error(`Issuer mismatch: expected https://securetoken.google.com/${projectId}, got ${payload.iss}`);
  }

  if (payload.aud !== projectId) {
    throw new Error(`Audience mismatch: expected ${projectId}, got ${payload.aud}`);
  }

  if (payload.exp < now) {
    throw new Error("Authentication token has expired");
  }

  if (payload.iat > now + 300) {
    throw new Error("Token issued in the future");
  }

  return payload;
}

/// Helper to decode JWT manually in Node.js (for debug/fallback if needed)
function decodeJwt(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64").toString("utf-8");
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
}

// SSRF Safe Image Fetching Helper
export async function fetchSafeImage(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    throw new Error("Invalid URL protocol. Only http/https are allowed.");
  }
  const parsedUrl = new URL(imageUrl);
  const isProd = process.env.NODE_ENV === "production";
  const hostname = parsedUrl.hostname.toLowerCase();

  // Prevent SSRF: block private ranges and loopback
  if (isProd) {
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.16.") ||
      hostname.startsWith("172.17.") ||
      hostname.startsWith("172.18.") ||
      hostname.startsWith("172.19.") ||
      hostname.startsWith("172.2") ||
      hostname.startsWith("172.30.") ||
      hostname.startsWith("172.31.") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      throw new Error("Forbidden access: Local or private network fetch requests are blocked in production.");
    }
  }

  const allowedDomains = ["firebasestorage.googleapis.com", "images.unsplash.com", "storage.googleapis.com", "localhost", "127.0.0.1"];
  const isAllowed = allowedDomains.some(domain => hostname === domain || hostname.endsWith("." + domain));
  if (!isAllowed) {
    throw new Error(`Forbidden remote image domain: ${parsedUrl.hostname}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const res = await fetch(imageUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Failed to retrieve evidence image: ${res.statusText}`);
    }

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      throw new Error("File size exceeds safety limit of 10MB.");
    }

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      throw new Error("Invalid media type. Only image files are verified.");
    }

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return { base64, mimeType: contentType };
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Authentication Middleware
async function authenticateRequest(req: Request, res: Response, next: any) {
  const mode = getServerMode();
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logEvent("WARN", "Missing authentication token", { path: req.path });
    res.status(401).json({ success: false, error: "Unauthorized access: Bearer token is missing.", message: "Authentication required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (mode === "demo") {
    // In demo mode, token is the user's ID
    const db = loadDatabase();
    const user = db.users.find((u: any) => u.id === token);
    if (!user) {
      logEvent("WARN", "Demo user not found", { token, path: req.path });
      res.status(401).json({ success: false, error: "Invalid credentials: User not found in demo database.", message: "Authentication failed" });
      return;
    }
    (req as any).user = {
      uid: user.id,
      email: user.email,
      name: user.name || "Demo Citizen",
      role: user.role || "citizen"
    };
    return next();
  }

  try {
    const payload = await verifyFirebaseIdToken(token);
    const db = loadDatabase();
    const storedUser = db.users.find((u: any) => {
      return u.id === payload.user_id || u.id === payload.sub || (payload.email && u.email === payload.email);
    });
    (req as any).user = {
      uid: payload.user_id || payload.sub,
      email: payload.email,
      name: storedUser?.name || payload.name || payload.email || "Firebase User",
      role: payload.role || (payload.admin ? "admin" : payload.staff ? "staff" : undefined) || storedUser?.role || "citizen"
    };
    next();
  } catch (err: any) {
    logEvent("WARN", "Token verification failed", { error: err.message, path: req.path });
    res.status(401).json({ success: false, error: `Unauthorized: ${err.message}`, message: "Authentication token invalid or expired" });
  }
}

// Role Authorization Middleware
function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: any) => {
    const user = (req as any).user;
    if (!user) {
      logEvent("WARN", "Authorization check failed: User unauthenticated", { path: req.path });
      res.status(401).json({ success: false, error: "Authentication required.", message: "Access denied" });
      return;
    }
    if (!roles.includes(user.role)) {
      logEvent("WARN", "Authorization check failed: Insufficient permissions", { userId: user.uid, role: user.role, requiredRoles: roles, path: req.path });
      res.status(403).json({ success: false, error: "Access forbidden: Insufficient permissions.", message: "Access denied" });
      return;
    }
    next();
  };
}

// ------------------- INTEGRATION: Gemini Multimodal Analysis -------------------
const handleGeminiAnalyze = async (req: Request, res: Response) => {
  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required for multimodal scanning." });
    return;
  }

  try {
    const ai = getGeminiClient();

    const imagePart = {
      inlineData: {
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: mimeType || "image/jpeg"
      }
    };

    const textPart = {
      text: `Analyze this citizen-reported community issue photo.
Detect the core defect or municipal issue present (e.g. gravel pothole, water leak, overflowing garbage dump, dark streetlight, road crack, blocked sewerage drain, hazardous electric lines, or unrequested illegal debris).
Generate a highly descriptive, concise title, and draft a well-structured description of why it needs attention. Suggest the appropriate municipal public department. 
Evaluate its severity level (1-10) and public security/safety hazard risk (1-10). Keep the confidence metric high and realistic.
Detect any critical missing parameters we should ask the citizen to clarify in a follow-up (if none, return null for clarifyingQuestion).

You MUST return your complete analysis strictly matching the requested JSON parameters. Do not include markdown formatting or wrappers.`
    };

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: {
              type: Type.STRING,
              enum: ["pothole", "water_leakage", "garbage", "streetlight", "drainage", "road_damage", "public_safety", "sanitation", "illegal_dumping", "parks_environment", "transport_infrastructure", "public_property", "other"]
            },
            description: { type: Type.STRING },
            severity: { type: Type.INTEGER },
            publicRisk: { type: Type.INTEGER },
            urgency: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
            confidence: { type: Type.NUMBER },
            suggestedDepartment: { type: Type.STRING },
            visibleEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
            safetyAdvice: { type: Type.STRING },
            missingInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
            clarifyingQuestion: { type: Type.STRING },
            possibleDuplicateKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: [
            "title", "category", "description", "severity", "publicRisk", "urgency",
            "confidence", "suggestedDepartment", "visibleEvidence", "safetyAdvice",
            "missingInformation", "clarifyingQuestion", "possibleDuplicateKeywords", "recommendedActions"
          ]
        }
      }
    });

    if (!response || !response.text) {
      throw new Error("Empty response returned from Google AI Studio.");
    }

    const reportJson = JSON.parse(response.text.trim());
    const validatedData = GeminiAnalysisSchema.parse(reportJson);
    res.json(validatedData);

  } catch (error: any) {
    console.error("Gemini Image Scan Failed:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "AI response failed validation against the expected schema.", details: error.issues });
      return;
    }
    res.status(503).json({ 
      error: "AI analysis service is temporarily offline.",
      details: error.message 
    });
  }
};

// ------------------- INTEGRATION: Gemini Resolution-proof Image Verification -------------------
const handleGeminiVerifyResolution = async (req: Request, res: Response) => {
  const beforeImageUrl = req.body.beforeImageUrl || req.body.beforeImageBase64;
  const resolutionBase64 = req.body.resolutionBase64 || req.body.afterImageBase64;
  const mimeType = req.body.mimeType;
  const adminNotes = req.body.adminNotes || "";
  
  if (!beforeImageUrl || !resolutionBase64) {
    res.status(400).json({ error: "Original beforeImageUrl and resolutionBase64 image are required." });
    return;
  }

  const createMockVerification = () => {
    const isActuallyResolved = !adminNotes.toLowerCase().includes("fail") && !adminNotes.toLowerCase().includes("reject") && !adminNotes.toLowerCase().includes("incomplete");
    const confidence = isActuallyResolved ? 88 : 42;
    const notes = isActuallyResolved
      ? `[Demo mode: Mock Gemini Verification] Confirmed resolution. Pothole filled and road paved successfully. Visual comparison shows 100% clearing of debris and structural correction matching administrative notes: "${adminNotes || "No notes provided"}".`
      : `[Demo mode: Mock Gemini Verification] Resolution failed inspection. The uploaded photo does not show complete repair. Residual trash/defect is still visible. Secondary manual inspection is recommended. Notes provided: "${adminNotes || "None"}".`;

    return {
      confidence,
      notes,
      resolved: isActuallyResolved
    };
  };

  if (process.env.NODE_ENV === "test") {
    res.json(createMockVerification());
    return;
  }

  // Check if GEMINI_API_KEY is present
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    if (getServerMode() !== "demo") {
      res.status(503).json({ error: "GEMINI_API_KEY is required for AI resolution verification in production mode." });
      return;
    }
    // Mock fallback when Gemini API Key is missing (e.g. demo mode / local development)
    res.json(createMockVerification());
    return;
  }

  try {
    const ai = getGeminiClient();
    let beforeImagePart: any = null;

    if (beforeImageUrl.startsWith("data:image/")) {
      beforeImagePart = {
        inlineData: {
          data: beforeImageUrl.replace(/^data:image\/\w+;base64,/, ""),
          mimeType: beforeImageUrl.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg"
        }
      };
    } else {
      try {
        const safeData = await fetchSafeImage(beforeImageUrl);
        beforeImagePart = {
          inlineData: {
            data: safeData.base64,
            mimeType: safeData.mimeType
          }
        };
      } catch (e) {
        console.warn("Could not download original before image securely, falling back to text comparison context:", e);
      }
    }

    let resolutionPart: any = null;
    if (resolutionBase64.startsWith("data:image/")) {
      resolutionPart = {
        inlineData: {
          data: resolutionBase64.replace(/^data:image\/\w+;base64,/, ""),
          mimeType: mimeType || resolutionBase64.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg"
        }
      };
    } else if (resolutionBase64.startsWith("http://") || resolutionBase64.startsWith("https://")) {
      try {
        const safeData = await fetchSafeImage(resolutionBase64);
        resolutionPart = {
          inlineData: {
            data: safeData.base64,
            mimeType: safeData.mimeType
          }
        };
      } catch (e) {
        throw new Error(`Failed to fetch resolution image from URL: ${e.message}`);
      }
    } else {
      resolutionPart = {
        inlineData: {
          data: resolutionBase64,
          mimeType: mimeType || "image/jpeg"
        }
      };
    }

    const textPart = {
      text: `Compare these two photos from CivicPulse AI.
Image 1 is the 'Before' state depicting a community issue (which was reported as a defect).
Image 2 is the 'After' state uploaded by field staff claiming to have successfully resolved and fixed the issue.

Assert whether the defect, trash mound, road breakage, or burnt bulb has been successfully cleaned, paved, repaired, or resolved.
Calculate a resolution confidence level from 0 to 100.
Provide brief explanatory notes highlighting visible markers, paving overlays, or cleared areas.
Decide if repairs are complete to mark 'resolved' as true.

Respond strictly in structured JSON matching this schema:
{
  "confidence": number,
  "notes": "string",
  "resolved": boolean
}
Do not use markdown blocks.`
    };

    const contents: any[] = [];
    if (beforeImagePart) {
      contents.push(beforeImagePart);
    }
    contents.push(resolutionPart);
    contents.push(textPart);

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            confidence: { type: Type.INTEGER },
            notes: { type: Type.STRING },
            resolved: { type: Type.BOOLEAN }
          },
          required: ["confidence", "notes", "resolved"]
        }
      }
    });

    if (!response || !response.text) {
      throw new Error("Empty comparison feedback.");
    }

    const resultJson = JSON.parse(response.text.trim());
    const validatedData = GeminiVerificationSchema.parse(resultJson);
    res.json(validatedData);

  } catch (error: any) {
    console.error("Resolution verification failed:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "AI verification failed schema validation.", details: error.issues });
      return;
    }
    res.status(503).json({ 
      error: "AI verification service is temporarily offline.",
      details: error.message
    });
  }
};

// ------------------- INTEGRATION: Gemini Description Improver -------------------
const handleGeminiImproveDescription = async (req: Request, res: Response) => {
  const { originalDescription, preferredLanguage } = req.body;
  if (!originalDescription) {
    res.status(400).json({ error: "originalDescription is required." });
    return;
  }

  try {
    const ai = getGeminiClient();
    const textPart = {
      text: `Refine and enhance this citizen-reported community issue description. 
Improve the clarity, spelling, and structure to make it look professional and constructive for municipal engineers.
Keep the original facts and language intent. The preferred output language is: ${preferredLanguage || "en"}.
Output only the improved text block. Do not include markdown code blocks, quotes, or wrappers.`
    };
    
    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: originalDescription }, textPart] }
    });

    if (!response || !response.text) {
      throw new Error("Empty response from Gemini.");
    }

    res.json({ improvedText: response.text.trim() });
  } catch (error: any) {
    console.error("Gemini Improve Description failed:", error);
    res.status(503).json({ error: "AI improvement service is temporarily offline.", details: error.message });
  }
};

// ------------------- INTEGRATION: Gemini Neighborhood Insights -------------------
const handleGeminiGenerateInsights = async (req: Request, res: Response) => {
  const { currentIssuesArray } = req.body;
  if (!currentIssuesArray || !Array.isArray(currentIssuesArray)) {
    res.status(400).json({ error: "currentIssuesArray is required." });
    return;
  }

  try {
    const ai = getGeminiClient();
    const textPart = {
      text: `Analyze this list of reported civic issues in the neighborhood.
Identify recurring patterns, cluster hotspots (e.g. water pipeline leaks in a particular area, multiple streetlights broken near parks), and recommend strategic interventions.
Generate 3 to 4 key community insights matching this JSON schema:
{
  "insights": [
    {
      "id": "string (unique)",
      "title": "string (short title)",
      "insight": "string (detailed description of findings)",
      "category": "string (e.g. PWD, BWSSB, BESCOM)",
      "location": "string (optional neighborhood context)",
      "confidence": number (0 to 100),
      "suggestedAction": "string (strategic recommendation)",
      "timestamp": "string (ISO timestamp)"
    }
  ]
}
Return ONLY the JSON. Do not wrap in markdown.`
    };

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: JSON.stringify(currentIssuesArray.slice(0, 15)) }, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  insight: { type: Type.STRING },
                  category: { type: Type.STRING },
                  location: { type: Type.STRING },
                  confidence: { type: Type.INTEGER },
                  suggestedAction: { type: Type.STRING },
                  timestamp: { type: Type.STRING }
                },
                required: ["id", "title", "insight", "category", "confidence", "suggestedAction", "timestamp"]
              }
            }
          },
          required: ["insights"]
        }
      }
    });

    if (!response || !response.text) {
      throw new Error("Empty insights response from Gemini.");
    }

    const parsed = JSON.parse(response.text.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini Generate Insights failed:", error);
    res.status(503).json({ error: "AI insights service is temporarily offline.", details: error.message });
  }
};

// ------------------- INTEGRATION: Gemini chatbot answering site-related questions -------------------
// ------------------- INTEGRATION: Gemini chatbot answering site-related questions -------------------
const handleChatbot = async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message) {
    res.status(400).json({ error: "message is required." });
    return;
  }

  const msgLower = message.toLowerCase();

  // Intercept requests containing ticket creation queries
  const ticketCreationPhrases = [
    "create ticket",
    "create a ticket",
    "raise a ticket",
    "raise ticket",
    "file a ticket",
    "file ticket",
    "create support ticket",
    "create a support ticket",
    "generate ticket",
    "generate a ticket",
    "submit ticket",
    "submit a ticket",
    "open ticket",
    "open a ticket",
    "make ticket",
    "make a ticket",
    "new ticket",
    "contact support",
    "support ticket"
  ];
  const isTicketCreationQuery = ticketCreationPhrases.some(phrase => msgLower.includes(phrase));

  if (isTicketCreationQuery) {
    res.json({
      reply: "Support tickets require a signed-in account so the team can attach replies to the correct profile. Please sign in and use the Contact / Support Tickets page to create or track a ticket."
    });
    return;
  }

  // 1. Run local Q&A keyword matching search across all 105+ pre-coded answers to use as reference context
  let bestMatch: typeof CHATBOT_QA[0] | null = null;
  let maxMatchCount = 0;

  CHATBOT_QA.forEach((entry) => {
    let matchCount = 0;
    entry.keywords.forEach((keyword) => {
      if (msgLower.includes(keyword)) {
        // Higher weight for longer keyword phrases to improve match accuracy
        matchCount += keyword.split(" ").length;
      }
    });

    if (matchCount > maxMatchCount) {
      maxMatchCount = matchCount;
      bestMatch = entry;
    }
  });

  // 2. If Gemini API key is present, use Gemini to generate the response (grounded in local Q&A context)
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = getGeminiClient();
      
      // Format history for Gemini
      const contents: any[] = [];
      if (history && Array.isArray(history)) {
        history.forEach((h: any) => {
          contents.push({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.text }]
          });
        });
      }
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      let referenceContext = "";
      if (bestMatch && maxMatchCount >= 1) {
        referenceContext = `Here is some official pre-coded reference Q&A information related to the user's question:\nReference Answer: ${bestMatch.answer}\n`;
      }

      const systemInstruction = `You are the CivicPulse AI Chatbot, a helpful assistant for the CivicPulse AI platform.
Your ONLY goal is to answer questions about CivicPulse AI, its theme, site features, functionality, and developer details.
CivicPulse AI is a hyperlocal infrastructure auditing and problem resolution platform.

${referenceContext}

Developer/Creator Details: This website was developed by Aayan Parmar (Aayan Karasu). Portfolio: aayankarasu.fun, Contact Number: 8091726602, Email: aayankarasu@gmail.com.

CRITICAL RULES:
- If a user wants to open, submit, or create a support ticket, ask them for their name, email, subject, and message if any are missing. Once they provide all required information, use the createSupportTicket tool to register the ticket.
- You must use the provided official reference Q&A information (if present) to formulate a precise, helpful, and natural AI-generated answer.
- You must ONLY answer questions directly related to CivicPulse AI, its theme, its site, its developer, and its features.
- If a user asks a question about ANYTHING else (e.g. general coding, recipes, writing stories, math, history, weather, general news, other companies), you MUST politely refuse to answer. You can say something like: "I'm sorry, but I am only able to answer questions related to the CivicPulse AI platform, its features, and its theme. Let me know if you have any questions about reporting issues, verifying tickets, or earning points!"
- Do not bypass this rule under any circumstances. If the query is ambiguous, try to steer it back to CivicPulse AI.
- Keep your answers concise, premium, and friendly. Use formatting like bullet points or bold text if helpful.`;

      const tools = [{
        functionDeclarations: [{
          name: "createSupportTicket",
          description: "Creates a support ticket / contact submission on behalf of the user when they provide name, email, subject, and message details.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the user." },
              email: { type: Type.STRING, description: "Email address of the user." },
              subject: { type: Type.STRING, description: "Subject of the support ticket." },
              message: { type: Type.STRING, description: "Detailed description of the support inquiry." }
            },
            required: ["name", "email", "subject", "message"]
          }
        }]
      }];

      const response = await generateContentWithRetry(ai, {
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction,
          maxOutputTokens: 550,
          temperature: 0.2,
          tools
        }
      });

      if (response && response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        if (call.name === "createSupportTicket") {
          const { name, email, subject, message } = call.args as any;
          if (name && email && subject && message) {
            const ticketId = await createSupportTicketInternal(name, email, subject, message);
            res.json({
              reply: `I have successfully registered support ticket **${ticketId}** for you!\n\n**Ticket Details:**\n- **Name:** ${name}\n- **Email:** ${email}\n- **Subject:** ${subject}\n- **Message:** ${message}\n\nA copy of this ticket log has been successfully dispatched to your email address (**${email}**).`
            });
            return;
          }
        }
      }

      if (response && response.text) {
        res.json({ reply: response.text.trim() });
        return;
      }
    } catch (error: any) {
      console.error("Gemini chatbot call failed:", error.message);
      res.status(503).json({
        error: "Gemini chatbot authentication or request failed.",
        details: error.message
      });
      return;
    }
  }

  res.status(503).json({
    error: "GEMINI_API_KEY is required for the AI chatbot."
  });
  return;

  // Unreachable safety notes retained for reference-only matching tests.
  const relatedKeywords = [
    "civic", "lens", "pulse", "point", "score", "reward", "badge",
    "leaderboard", "announcement", "theme", "color", "design", "glassmorphism",
    "dark", "light", "site", "platform", "app", "report", "verify",
    "issue", "resolution", "pothole", "leak", "water", "street", "light", "garbage",
    "trash", "waste", "map", "heatmap", "sensor", "telemetry", "gemini", "ai", "copilot", "judge",
    "maker", "creator", "developer", "built", "made", "author", "aayan", "parmar", "karasu",
    "ticket", "support", "help", "contact"
  ];

  const isRelated = relatedKeywords.some(keyword => msgLower.includes(keyword));

  if (!isRelated) {
    res.json({
      reply: "I'm sorry, but I am only able to answer questions related to the CivicPulse AI platform, its features, and its theme. Let me know if you have any questions about reporting issues, verifying tickets, or earning points!"
    });
    return;
  }

  const isDevQuery = ["maker", "creator", "developer", "built", "made", "author", "aayan", "parmar", "karasu"].some(keyword => msgLower.includes(keyword));
  if (isDevQuery) {
    res.json({
      reply: "This website was developed by Aayan Parmar (Aayan Karasu).\n\nDetails:\n- Portfolio: aayankarasu.fun\n- Contact Number: 8091726602\n- Email: aayankarasu@gmail.com\n\nFeel free to reach out for collaborations or inquiries!"
    });
    return;
  }

  res.json({
    reply: "CivicPulse AI is a hyperlocal infrastructure auditing platform. It coordinates citizen reports, peer verifications, and municipal resolution tracking with Gemini AI integrations. Let me know if you want to know about reporting, earning points, the leaderboard, announcements, or the map!"
  });
};

// Register chatbot route outside authenticateRequest check
apiRouter.post("/chatbot", rateLimiter, handleChatbot);

// Config Endpoint
apiRouter.get("/config", (req: Request, res: Response) => {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };
  const hasFirebase = Object.values(firebaseConfig).every((value) => {
    return typeof value === "string"
      && value.trim().length > 0
      && !value.startsWith("YOUR_")
      && !value.startsWith("MY_");
  });
  const mode = process.env.VITE_APP_MODE || "demo";
  const enable2FA = process.env.ENABLE_2FA === "true";
  res.json({
    hasFirebase,
    firebaseConfig: hasFirebase ? firebaseConfig : null,
    mode,
    enable2FA
  });
});

apiRouter.get("/geocode/search", rateLimiter, validateQuery(GeocodeSearchSchema), async (req: Request, res: Response) => {
  const { q, limit = 10 } = req.query as any;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", String(Math.min(Number(limit) || 10, 10)));
    url.searchParams.set("q", String(q));
    url.searchParams.set("email", process.env.GEOCODER_CONTACT_EMAIL || "aayankarasu@gmail.com");

    const upstream = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "CivicPulseAI/1.0 (aayankarasu@gmail.com)",
        "Accept": "application/json"
      }
    });
    clearTimeout(timeoutId);

    if (!upstream.ok) {
      res.status(502).json({ error: `Location search provider returned ${upstream.status}.` });
      return;
    }

    const data = await upstream.json();
    const results = (Array.isArray(data) ? data : [])
      .slice(0, 10)
      .map((item: any, index: number) => ({
        id: String(item.place_id || index),
        label: item.name || (item.display_name ? String(item.display_name).split(",")[0] : "Search result"),
        detail: item.display_name || "OpenStreetMap result",
        lat: Number(item.lat),
        lng: Number(item.lon),
        type: item.type,
        class: item.class
      }))
      .filter((item: any) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

    res.json({ results });
  } catch (err: any) {
    clearTimeout(timeoutId);
    res.status(err?.name === "AbortError" ? 504 : 502).json({
      error: err?.name === "AbortError" ? "Location search timed out." : "Location search failed."
    });
  }
});

apiRouter.get("/geocode/reverse", rateLimiter, validateQuery(GeocodeReverseSchema), async (req: Request, res: Response) => {
  const { lat, lon } = req.query as any;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("email", process.env.GEOCODER_CONTACT_EMAIL || "aayankarasu@gmail.com");

    const upstream = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "CivicPulseAI/1.0 (aayankarasu@gmail.com)",
        "Accept": "application/json"
      }
    });
    clearTimeout(timeoutId);

    if (!upstream.ok) {
      res.status(502).json({ error: `Reverse geocoder returned ${upstream.status}.` });
      return;
    }

    const data = await upstream.json();
    res.json({
      label: data.name || (data.display_name ? String(data.display_name).split(",")[0] : "Detected GPS location"),
      detail: data.display_name || `GPS: ${lat}, ${lon}`
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    res.status(err?.name === "AbortError" ? 504 : 502).json({
      error: err?.name === "AbortError" ? "Reverse geocoding timed out." : "Reverse geocoding failed."
    });
  }
});

// Announcements API
apiRouter.get("/announcements", (req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.announcements || []);
});

apiRouter.post("/announcements", authenticateRequest, requireRole(["admin"]), validateBody(AddAnnouncementSchema), async (req: Request, res: Response) => {
  const { title, content, category, department } = req.body;
  const authorName = (req as any).user.name || "System Admin";
  const db = loadDatabase();
  if (!db.announcements) db.announcements = [];

  const newAnn = {
    id: `ann_${Date.now()}`,
    title,
    content,
    category,
    department,
    authorName,
    createdAt: new Date().toISOString()
  };

  db.announcements.unshift(newAnn);
  saveDatabase(db);

  // Broadcast to all newsletter subscribers
  const subscribers = db.newsletterSubscribers || [];
  for (const email of subscribers) {
    try {
      await sendAnnouncementNotification(email, title, content);
    } catch (err: any) {
      console.error(`Failed to send announcement notification to ${email}:`, err.message);
    }
  }

  res.json({ success: true, announcement: newAnn });
});

apiRouter.delete("/announcements/:id", authenticateRequest, requireRole(["admin"]), (req: Request, res: Response) => {
  const db = loadDatabase();
  if (!db.announcements) db.announcements = [];
  const initialLength = db.announcements.length;
  db.announcements = db.announcements.filter((a: any) => a.id !== req.params.id);
  if (db.announcements.length < initialLength) {
    saveDatabase(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Announcement not found." });
  }
});

// Apply auth check + rate limiting specifically to Gemini endpoints
apiRouter.use("/gemini", authenticateRequest);
apiRouter.use("/gemini", rateLimiter);

// Register individual Gemini routes
apiRouter.post("/gemini/analyze", handleGeminiAnalyze);
apiRouter.post("/gemini/analyze-evidence", handleGeminiAnalyze);
apiRouter.post("/gemini/verify-resolution", handleGeminiVerifyResolution);
apiRouter.post("/gemini/compare-before-after", handleGeminiVerifyResolution);
apiRouter.post("/gemini/improve-description", handleGeminiImproveDescription);
apiRouter.post("/gemini/generate-insights", handleGeminiGenerateInsights);

// XML Sitemap & Robots.txt Directives
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /staff
Disallow: /api/
Sitemap: http://localhost:3000/sitemap.xml
`);
});

app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>http://localhost:3000/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>http://localhost:3000/explore</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>
  <url><loc>http://localhost:3000/impact</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>http://localhost:3000/how-it-works</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>http://localhost:3000/leaderboard</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>http://localhost:3000/faq</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>http://localhost:3000/testimonials</loc><changefreq>daily</changefreq><priority>0.7</priority></url>
  <url><loc>http://localhost:3000/contact</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
</urlset>
`);
});

// Testimonials API
apiRouter.get("/testimonials", (req, res, next) => {
  if (req.query.isAdmin === "true") {
    authenticateRequest(req, res, () => {
      requireRole(["admin"])(req, res, next);
    });
  } else {
    next();
  }
}, (req, res) => {
  const db = loadDatabase();
  const isAdmin = req.query.isAdmin === "true";
  if (isAdmin) {
    res.json(db.testimonials || []);
  } else {
    res.json((db.testimonials || []).filter((t: any) => t.status === "approved"));
  }
});

apiRouter.post("/testimonials", authenticateRequest, validateBody(AddTestimonialSchema), (req, res) => {
  const { rating, content } = req.body;
  const name = (req as any).user.name || "Citizen";
  const role = (req as any).user.role === "citizen" ? "Citizen" : (req as any).user.role === "staff" ? "Staff Officer" : "Administrator";

  const db = loadDatabase();
  const newTestimonial = {
    id: `t-${Date.now()}`,
    name,
    role,
    rating,
    content,
    status: "pending" as const,
    createdAt: new Date().toISOString()
  };
  if (!db.testimonials) db.testimonials = [];
  db.testimonials.unshift(newTestimonial);
  saveDatabase(db);
  res.json({ success: true, testimonial: newTestimonial });
});

apiRouter.put("/testimonials/:id/approve", authenticateRequest, requireRole(["admin"]), (req, res) => {
  const db = loadDatabase();
  if (!db.testimonials) db.testimonials = [];
  const testimonial = db.testimonials.find((t: any) => t.id === req.params.id);
  if (testimonial) {
    testimonial.status = "approved";
    saveDatabase(db);
    res.json({ success: true, testimonial });
  } else {
    res.status(404).json({ error: "Testimonial not found." });
  }
});

apiRouter.delete("/testimonials/:id", authenticateRequest, requireRole(["admin"]), (req, res) => {
  const db = loadDatabase();
  if (!db.testimonials) db.testimonials = [];
  const index = db.testimonials.findIndex((t: any) => t.id === req.params.id);
  if (index !== -1) {
    db.testimonials.splice(index, 1);
    saveDatabase(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Testimonial not found." });
  }
});

// Internal helper to create support ticket and dispatch email logs/notifications
async function createSupportTicketInternal(name: string, email: string, subject: string, message: string, userId?: string): Promise<string> {
  const db = loadDatabase();
  
  const submission = {
    id: `sub-${Date.now()}`,
    name,
    email,
    subject,
    message,
    createdAt: new Date().toISOString()
  };
  if (!db.contactSubmissions) db.contactSubmissions = [];
  db.contactSubmissions.unshift(submission);
  
  const ticket = {
    id: `tkt-${String((db.supportTickets || []).length + 1).padStart(3, "0")}`,
    name,
    email,
    subject,
    message,
    status: "open",
    userId: userId || "anonymous_guest",
    claimedBy: "",
    claimedByName: "",
    messages: [] as any[],
    createdAt: new Date().toISOString()
  };
  if (!db.supportTickets) db.supportTickets = [];
  db.supportTickets.unshift(ticket);
  
  const auditId = `aud-${String(db.auditLogs.length + 1).padStart(3, "0")}`;
  db.auditLogs.push({
    id: auditId,
    action: "SUPPORT_TICKET_CREATED",
    performedBy: userId || "guest",
    performerName: name,
    performerRole: "citizen",
    details: `Support ticket ${ticket.id} created for ${email}.`,
    createdAt: new Date().toISOString()
  });

  saveDatabase(db);

  try {
    // Send to admin desk
    await sendContactNotification(name, email, subject, message);
  } catch (err: any) {
    console.error("Failed to send contact notification email:", err.message);
  }

  try {
    // Send ticket log to citizen's email
    await sendSupportTicketCreated(email, ticket.id, name, subject, message);
  } catch (err: any) {
    console.error("Failed to send support ticket created confirmation email:", err.message);
  }

  return ticket.id;
}

// Contact Support Tickets API (enforce login)
apiRouter.post("/contact", authenticateRequest, strictRateLimiter, validateBody(CreateSupportTicketSchema), async (req, res) => {
  const { name, email, subject, message } = req.body;
  const activeUserId = (req as any).user.uid;
  
  try {
    const ticketId = await createSupportTicketInternal(name, email, subject, message, activeUserId);
    res.json({ success: true, ticketId });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create support ticket.", details: err.message });
  }
});

// Fetch tickets for logged in user
apiRouter.get("/tickets", authenticateRequest, (req, res) => {
  const db = loadDatabase();
  const user = (req as any).user;
  
  if (user.role === "citizen") {
    // Citizens can only view their own tickets
    const userTickets = (db.supportTickets || []).filter((t: any) => t.userId === user.uid);
    res.json(userTickets);
  } else {
    // Staff and Admin can view all tickets
    res.json(db.supportTickets || []);
  }
});

// Retrieve messages for a ticket
apiRouter.get("/tickets/:id/messages", authenticateRequest, (req, res) => {
  const db = loadDatabase();
  const user = (req as any).user;
  const ticket = (db.supportTickets || []).find((t: any) => t.id === req.params.id);
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }
  
  // Verify resource ownership
  if (user.role === "citizen" && ticket.userId !== user.uid) {
    res.status(403).json({ error: "Access Denied: You cannot view messages for another citizen's ticket." });
    return;
  }
  
  res.json(ticket.messages || []);
});

// Add reply message to a ticket
apiRouter.post("/tickets/:id/reply", authenticateRequest, validateBody(PostTicketReplySchema), (req, res) => {
  const { text } = req.body;
  const user = (req as any).user;
  const senderId = user.uid;
  const senderName = user.name || "User";
  const senderRole = user.role || "citizen";

  const db = loadDatabase();
  const ticket = (db.supportTickets || []).find((t: any) => t.id === req.params.id);
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  // Verify resource ownership
  if (user.role === "citizen" && ticket.userId !== user.uid) {
    res.status(403).json({ error: "Access Denied: You cannot reply to another citizen's ticket." });
    return;
  }

  if (!ticket.messages) ticket.messages = [];
  const newMsg = {
    id: `msg-${Date.now()}`,
    text,
    senderName,
    senderRole,
    senderId,
    createdAt: new Date().toISOString()
  };
  ticket.messages.push(newMsg);
  
  if (senderRole === "citizen" && ticket.status === "resolved") {
    ticket.status = "open"; // Reopen ticket
  }
  
  saveDatabase(db);
  res.json({ success: true, message: newMsg });
});

// Staff/Admin Claim ticket
apiRouter.post("/admin/tickets/:id/claim", authenticateRequest, requireRole(["admin", "staff"]), (req, res) => {
  const staffId = (req as any).user.uid;
  const staffName = (req as any).user.name || "Staff Member";
  
  const db = loadDatabase();
  const ticket = (db.supportTickets || []).find((t: any) => t.id === req.params.id);
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }
  ticket.status = "claimed";
  ticket.claimedBy = staffId;
  ticket.claimedByName = staffName || "Staff Member";
  
  // Add audit log
  const auditId = `aud-${String(db.auditLogs.length + 1).padStart(3, "0")}`;
  db.auditLogs.push({
    id: auditId,
    action: "SUPPORT_TICKET_CLAIMED",
    performedBy: staffId,
    performerName: staffName || "Staff Member",
    performerRole: "staff",
    details: `Support ticket ${ticket.id} claimed by ${staffName}.`,
    createdAt: new Date().toISOString()
  });

  saveDatabase(db);
  res.json({ success: true, ticket });
});

// Staff/Admin Delete ticket
apiRouter.delete("/admin/tickets/:id", authenticateRequest, requireRole(["admin", "staff"]), (req, res) => {
  console.log("[DELETE TICKET] Requested ID:", req.params.id);
  const db = loadDatabase();
  if (!db.supportTickets) db.supportTickets = [];
  const initialLength = db.supportTickets.length;
  db.supportTickets = db.supportTickets.filter((t: any) => t.id !== req.params.id);
  if (db.supportTickets.length < initialLength) {
    saveDatabase(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Ticket not found." });
  }
});

// Newsletter subscription API (Public with strict rate limiting)
apiRouter.post("/newsletter", strictRateLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "A valid email address is required." });
    return;
  }
  const db = loadDatabase();
  if (!db.newsletterSubscribers) db.newsletterSubscribers = [];
  
  if (db.newsletterSubscribers.includes(email)) {
    res.status(400).json({ error: "Email is already subscribed to newsletters." });
    return;
  }

  db.newsletterSubscribers.push(email);
  saveDatabase(db);

  try {
    await sendNewsletterConfirmation(email);
  } catch (err: any) {
    console.error("Failed to send newsletter confirmation email:", err.message);
  }

  res.json({ success: true });
});

// L2 Admin Dashboard Data Fetch
apiRouter.get("/admin/submissions", authenticateRequest, requireRole(["admin", "staff"]), (req, res) => {
  const db = loadDatabase();
  res.json({
    contactSubmissions: db.contactSubmissions || [],
    newsletterSubscribers: db.newsletterSubscribers || [],
    supportTickets: db.supportTickets || []
  });
});

// Resolve Support Ticket
apiRouter.post("/admin/tickets/:id/resolve", authenticateRequest, requireRole(["admin", "staff"]), (req, res) => {
  const db = loadDatabase();
  if (!db.supportTickets) db.supportTickets = [];
  const ticket = db.supportTickets.find((t: any) => t.id === req.params.id);
  if (ticket) {
    ticket.status = "resolved";
    const auditId = `aud-${String(db.auditLogs.length + 1).padStart(3, "0")}`;
    db.auditLogs.push({
      id: auditId,
      action: "SUPPORT_TICKET_RESOLVED",
      performedBy: (req as any).user.uid,
      performerName: (req as any).user.name || "Admin Dispatcher",
      performerRole: (req as any).user.role || "admin",
      details: `Support ticket ${ticket.id} resolved.`,
      createdAt: new Date().toISOString()
    });
    saveDatabase(db);

    // Dispatch email notification asynchronously
    if (ticket.email) {
      sendSupportTicketResolved(ticket.email, ticket.id, ticket.subject).catch((err: any) => {
        console.error(`Failed to send support ticket resolved email to ${ticket.email}:`, err.message);
      });
    }

    res.json({ success: true, ticket });
  } else {
    res.status(404).json({ error: "Ticket not found." });
  }
});

// CSV Export for Issues
apiRouter.get("/admin/export-issues", authenticateRequest, requireRole(["admin"]), (req, res) => {
  const db = loadDatabase();
  const issues = db.issues || [];
  
  let csv = "ID,Title,Category,Status,Severity,Priority Score,Reporter,Address,Created At\n";
  issues.forEach((i: any) => {
    const title = `"${(i.title || "").replace(/"/g, '""')}"`;
    const address = `"${(i.address || "").replace(/"/g, '""')}"`;
    const reporter = `"${(i.reporterName || "").replace(/"/g, '""')}"`;
    csv += `${i.id},${title},${i.category},${i.status},${i.severity},${i.priorityScore},${reporter},${address},${i.createdAt}\n`;
  });

  res.header("Content-Type", "text/csv");
  res.attachment("civiclens_audit_report.csv");
  res.send(csv);
});

// Backup Database
apiRouter.post("/admin/backup", authenticateRequest, requireRole(["admin"]), (req, res) => {
  try {
    const db = loadDatabase();
    const backupPath = path.join(DATA_DIR, "db_backup.json");
    fs.writeFileSync(backupPath, JSON.stringify(db, null, 2), "utf-8");
    logEvent("INFO", "Manual database backup created successfully", { adminId: (req as any).user.uid });
    res.json({ success: true, message: "Manual system database backup created successfully." });
  } catch (err: any) {
    logEvent("ERROR", "Failed to create database backup", { error: err.message });
    res.status(500).json({ error: "Failed to create database backup.", details: err.message });
  }
});

// Restore Database
apiRouter.post("/admin/restore", authenticateRequest, requireRole(["admin"]), (req, res) => {
  try {
    const backupPath = path.join(DATA_DIR, "db_backup.json");
    if (!fs.existsSync(backupPath)) {
      res.status(404).json({ error: "No system backup file found on disk." });
      return;
    }
    const backupData = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
    saveDatabase(backupData);
    logEvent("INFO", "Database restored successfully from backup", { adminId: (req as any).user.uid });
    res.json({ success: true, message: "System database successfully restored from backup." });
  } catch (err: any) {
    logEvent("ERROR", "Failed to restore database from backup", { error: err.message });
    res.status(500).json({ error: "Failed to restore database from backup.", details: err.message });
  }
});

// Auth Helper endpoints (SMTP verification and password recovery)
// Auth Helper endpoints (SMTP verification and password recovery)
apiRouter.post("/auth/send-verification", strictRateLimiter, validateBody(SendVerificationSchema), async (req, res) => {
  const { email, name } = req.body;
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  
  const db = loadDatabase();
  if (!db.verificationCodes) db.verificationCodes = {};
  db.verificationCodes[email.toLowerCase()] = code;
  saveDatabase(db);

  try {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpUser || !smtpPass) {
      return res.status(503).json({ error: "SMTP_USER and SMTP_PASS are required to send verification email." });
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || "CivicPulse <demo@civicpulse.gov.in>",
      to: email,
      subject: "Verify Your CivicPulse Account",
      text: `Hello ${name || "Citizen"},\n\nYour security verification code is: ${code}\n\nEnter this code to verify your email and complete your registration.\n\nBest,\nCivicPulse Team`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; background: #020617; color: #f1f5f9; padding: 24px;">
          <h2 style="color: #06b6d4; margin-top: 0;">Email Verification</h2>
          <p>Thank you for signing up to CivicPulse AI. Use the verification code below to authorize your email address:</p>
          <div style="font-size: 28px; font-family: monospace; font-weight: bold; background: #0f172a; border: 1px dashed #06b6d4; padding: 15px; text-align: center; color: #22d3ee; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p>If you did not sign up for CivicPulse AI, please disregard this notification.</p>
        </div>
      `
    };
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to send verification code email:", err.message);
    res.status(500).json({ error: "Failed to dispatch email verification code." });
  }
});

apiRouter.post("/auth/verify-code", strictRateLimiter, validateBody(VerifyCodeSchema), (req, res) => {
  const { email, code } = req.body;
  const db = loadDatabase();
  if (!db.verificationCodes) db.verificationCodes = {};
  const stored = db.verificationCodes[email.toLowerCase()];
  if (stored && stored === code) {
    delete db.verificationCodes[email.toLowerCase()];
    saveDatabase(db);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid verification code." });
  }
});

apiRouter.post("/auth/forgot-password", strictRateLimiter, validateBody(ForgotPasswordSchema), async (req, res) => {
  const { email } = req.body;
  const db = loadDatabase();
  const formattedEmail = email.trim().toLowerCase();
  const matchedUser = db.users.find((u: any) => u.email.toLowerCase() === formattedEmail);
  if (!matchedUser) {
    res.status(404).json({ error: "No account found registered under this email." });
    return;
  }
  
  const token = Math.random().toString(36).substr(2, 10);
  if (!db.resetTokens) db.resetTokens = {};
  db.resetTokens[token] = { email: formattedEmail, expiresAt: Date.now() + 3600 * 1000 };
  saveDatabase(db);

  try {
    await sendPasswordResetLink(formattedEmail, token);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to send reset link email:", err.message);
    res.status(500).json({ error: "Failed to dispatch password reset link email." });
  }
});

apiRouter.post("/auth/reset-password", strictRateLimiter, validateBody(ResetPasswordSchema), (req, res) => {
  const { token, newPassword } = req.body;
  const db = loadDatabase();
  if (!db.resetTokens) db.resetTokens = {};
  const record = db.resetTokens[token];
  if (!record || record.expiresAt < Date.now()) {
    res.status(400).json({ error: "Invalid or expired reset token." });
    return;
  }

  delete db.resetTokens[token];
  saveDatabase(db);
  res.json({ success: true, email: record.email });
});

apiRouter.post("/auth/2fa-send", strictRateLimiter, validateBody(Send2FASchema), async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const db = loadDatabase();
  if (!db.admin2FA) db.admin2FA = {};
  db.admin2FA[email.toLowerCase()] = code;
  saveDatabase(db);

  try {
    await sendAdmin2FACode(email, code);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to send 2FA code email:", err.message);
    res.status(500).json({ error: "Failed to dispatch 2FA email code." });
  }
});

apiRouter.post("/auth/2fa-verify", strictRateLimiter, validateBody(Verify2FASchema), (req, res) => {
  const { email, code } = req.body;
  const db = loadDatabase();
  if (!db.admin2FA) db.admin2FA = {};
  const expectedCode = db.admin2FA[email.toLowerCase()];
  if (expectedCode && expectedCode === code) {
    delete db.admin2FA[email.toLowerCase()];
    saveDatabase(db);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid 2FA authentication code." });
  }
});

// Register API routes
app.use("/api", apiRouter);

// ------------------- Production Build Serving -------------------
if (process.env.NODE_ENV === "production") {
  // Production configuration using static directory serving
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // Development configuration with embedded Vite client compiler server
  const startDev = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  };
  startDev();
}

// Live telemetry city data simulator daemon
function startRealtimeSimulation() {
  setInterval(() => {
    try {
      const db = loadDatabase();
      if (!db.issues || db.issues.length === 0) return;

      // Select a random issue to update or simulate new activity
      const randomIndex = Math.floor(Math.random() * db.issues.length);
      const issue = db.issues[randomIndex];
      
      // Exclude already resolved/rejected issues from simulation to keep it logical
      if (issue.status === "Resolved" || issue.status === "Rejected") return;

      const randType = Math.random();
      if (randType < 0.45) {
        // 1. Simulate citizen verification confirm
        issue.verificationCount = (issue.verificationCount || 0) + 1;
        issue.followerCount = (issue.followerCount || 0) + Math.floor(Math.random() * 2) + 1;
        issue.priorityScore = Math.min(100, (issue.priorityScore || 50) + 2);
        console.log(`[Telemetry Simulation] Citizen verified issue ${issue.id}. Verifications: ${issue.verificationCount}`);
      } else if (randType < 0.75) {
        // 2. Simulate priority score telemetry change
        const delta = Math.random() > 0.5 ? 3 : -3;
        issue.priorityScore = Math.max(10, Math.min(100, (issue.priorityScore || 50) + delta));
        console.log(`[Telemetry Simulation] Recalculated severity weighting for issue ${issue.id}. Priority: ${issue.priorityScore}`);
      } else {
        // 3. Inject a new simulated temporary report
        const simulatedCategories = [
          { cat: "Roads & Traffic", sub: "Potholes", title: "Active pothole report" },
          { cat: "Water & Sanitation", sub: "Water Pipeline Leakage", title: "Minor water pipeline leak" },
          { cat: "Solid Waste Management", sub: "Garbage Dumping", title: "Local garbage accumulation alert" }
        ];
        const selectedInfo = simulatedCategories[Math.floor(Math.random() * simulatedCategories.length)];
        
        // Random location near Bengaluru center
        const latOffset = (Math.random() - 0.5) * 0.04;
        const lngOffset = (Math.random() - 0.5) * 0.04;
        
        const newIssueId = `rep-sim-${Date.now().toString().slice(-4)}`;
        const newIssue = {
          id: newIssueId,
          createdBy: "system_telemetry",
          createdByName: "City Telemetry Sensor",
          title: `[Live Telemetry] ${selectedInfo.title}`,
          originalDescription: "Automated alert received from municipal monitoring sensor network.",
          aiSummary: "Telemetry sensor trigger. Automated queue routing active.",
          category: selectedInfo.cat,
          subcategory: selectedInfo.sub,
          severity: Math.random() > 0.6 ? "high" : "medium",
          priorityScore: Math.floor(Math.random() * 40) + 40,
          location: {
            lat: 12.9716 + latOffset,
            lng: 77.5946 + lngOffset,
            isApproximate: false
          },
          address: "Bengaluru Urban Telemetry Grid",
          landmark: "Sensor Zone " + Math.floor(Math.random() * 100),
          evidence: [{ url: "/assets/demo/pothole_preset.png", type: "image" }],
          status: "New",
          assignedDepartment: "Public Works Department",
          verificationCount: 1,
          inaccurateCount: 0,
          followerCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Keep maximum database size in check to prevent disk bloat
        const simIssuesCount = db.issues.filter((i: any) => i.id.startsWith("rep-sim-")).length;
        if (simIssuesCount >= 3) {
          const simIndex = db.issues.findIndex((i: any) => i.id.startsWith("rep-sim-"));
          if (simIndex !== -1) db.issues.splice(simIndex, 1);
        }
        
        db.issues.unshift(newIssue);
        console.log(`[Telemetry Simulation] Injected new live telemetry sensor issue ${newIssueId}`);
      }

      saveDatabase(db);
    } catch (e) {
      console.warn("Telemetry simulation tick failed:", e);
    }
  }, 12000); // Trigger every 12 seconds
}

export { app };

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CivicPulse AI running in full-stack container on http://localhost:${PORT}`);
    if (getServerMode() === "demo") {
      startRealtimeSimulation();
    }
  });
}
