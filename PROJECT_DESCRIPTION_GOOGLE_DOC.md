# CivicPulse AI - Project Description

Google Doc sharing note: After pasting this into Google Docs, set access to "Anyone with the link can view" before submitting.

GitHub Repository Link: https://github.com/AustinKarasu/CivicPulse

Deployed Application Link: [Paste deployed Google Cloud application link here]

---

## Problem Statement Selected

**Community Hero - Hyperlocal Problem Solver**

Communities frequently face local infrastructure and public safety issues such as potholes, broken streetlights, water leakages, open manholes, garbage dumping, damaged roads, blocked drains, and unsafe public spaces. These issues affect daily life, but the reporting and resolution process is often fragmented, slow, opaque, and difficult to trust.

Citizens usually do not know which department is responsible for a specific issue. Municipal teams often receive incomplete or duplicate complaints without enough evidence to prioritize work efficiently. Even when a repair is marked as complete, citizens may not have a transparent way to confirm whether the issue was genuinely resolved. This creates a gap between public reporting and public trust.

CivicPulse AI addresses this problem by building a hyperlocal civic issue platform where citizens can report problems with evidence, AI can structure and classify the complaint, the community can verify it, staff can act on it, and the final resolution can be checked with before-and-after evidence.

---

## Solution Overview

CivicPulse AI is an AI-powered civic reporting and accountability platform for citizens, municipal staff, and administrators. It transforms unstructured community complaints into structured, trackable, and verifiable civic action.

The platform allows citizens to submit reports with image evidence, location details, category information, and descriptions. Gemini AI analyzes the submitted evidence to understand the issue type, estimate severity, identify public risk, suggest the responsible department, and produce useful guidance. Once submitted, the issue becomes visible in the system for tracking, map exploration, community verification, staff review, and resolution.

The core idea is to create a complete civic trust loop:

```text
Citizen Report
      |
      v
AI Image Analysis
      |
      v
Community Verification
      |
      v
Priority and Department Routing
      |
      v
Staff Action and Status Updates
      |
      v
Before/After Resolution Evidence
      |
      v
AI-Assisted Resolution Verification
      |
      v
Public Accountability + Citizen Rewards
```

Unlike a basic complaint form, CivicPulse AI includes citizen reporting, AI analysis, public tracking, map-based visibility, staff workflows, admin controls, analytics, security rules, and gamified participation. The result is a polished civic technology product that improves transparency, reduces duplicate reporting, speeds prioritization, and encourages community participation.

---

## Key Features

### 1. Image and Evidence-Based Issue Reporting

Citizens can report civic issues such as potholes, garbage dumping, broken streetlights, water leaks, damaged manholes, and other hazards using visual evidence and location details. This makes reports more actionable than plain text complaints.

### 2. AI-Powered Issue Categorization

Gemini AI analyzes uploaded issue photos and generates structured information such as:

- Issue category
- Severity level
- Public safety risk
- Suggested responsible department
- Recommended action
- Citizen-facing safety guidance
- Confidence and reasoning

### 3. Community Verification

Nearby residents can verify or dispute reports. This adds a community trust layer, helps filter low-quality reports, and gives municipal staff stronger confidence that an issue is real and important.

### 4. Real-Time Issue Tracking

Reports move through a transparent lifecycle, such as submitted, verified, assigned, in progress, and resolved. Citizens can follow progress instead of submitting a complaint and never hearing back.

### 5. Interactive Civic Map

Issues can be viewed spatially on a map so citizens and staff can understand where problems are concentrated. Map-based visibility helps reveal hotspots and supports better civic planning.

### 6. Staff Dashboard

Municipal staff can inspect incoming reports, review severity and verification signals, update progress, add notes, and upload resolution evidence. This turns citizen complaints into an operational queue.

### 7. AI-Assisted Resolution Verification

When staff upload an after-repair photo, Gemini AI can compare before and after evidence to help determine whether the issue appears resolved. This strengthens accountability and reduces false closure.

### 8. Admin Controls

Administrators can monitor reports, users, announcements, analytics, and system activity. This supports governance-level oversight and judge-friendly demonstration of product completeness.

### 9. Impact Dashboards and Analytics

The platform includes dashboards for issue volume, categories, resolution patterns, and civic impact. These insights help communities and authorities understand what is improving and where attention is still needed.

### 10. Gamification for Citizen Engagement

Citizens can earn points, build trust, and appear on a leaderboard for useful reports and verification activity. This encourages people to participate consistently in improving their neighborhoods.

### 11. AI Chatbot and Guided Demo Experience

The website includes an AI assistant and judge-tour-style guidance to explain the platform, its theme, features, reporting flow, verification system, and civic impact.

### 12. Security and Reliability

CivicPulse AI includes authentication, role-based flows, input validation, Firestore and Storage security rules, server-side safeguards, sanitization, structured AI response validation, and automated tests.

---

## Technologies Used

| Area | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express.js, TSX, ESBuild |
| AI Integration | Google Gemini via `@google/genai` |
| Authentication | Firebase Authentication |
| Database | Firebase Firestore and local demo repository fallback |
| Storage | Firebase Storage for issue evidence and user assets |
| Maps and Location | Google Maps Platform support, map-based issue visualization |
| Validation | Zod schemas and structured response validation |
| Visualization | Chart.js, react-chartjs-2, Three.js, React Three Fiber |
| User Experience | Framer Motion, Lucide React, responsive PWA-style interface |
| Security | DOMPurify, security headers, rate limiting, Firestore rules, Storage rules |
| Testing | Vitest, Supertest, TypeScript checking |
| Deployment Readiness | Vite production build, bundled Express server, environment-based configuration |

---

## Google Technologies Utilized

### 1. Google Gemini AI

Gemini is the core intelligence layer of CivicPulse AI. It is used for multimodal image understanding and structured civic issue analysis.

Main Gemini use cases:

- Analyze issue photos submitted by citizens.
- Classify infrastructure problems into meaningful categories.
- Estimate severity and public safety risk.
- Recommend the department or authority that should handle the issue.
- Generate actionable guidance for citizens and staff.
- Compare before and after images for AI-assisted resolution verification.
- Return structured output that can be validated and used by the application.

### 2. Google AI Studio / Gemini API

The project uses the Gemini API through Google AI Studio credentials. The backend sends image and text context to Gemini and receives structured responses for use inside the reporting and verification workflow.

### 3. Firebase Authentication

Firebase Authentication supports secure user access and role-based user flows for citizens, staff, and administrators. This helps protect sensitive workflows and keeps civic actions tied to authenticated identities.

### 4. Firebase Firestore

Firestore is used as the production-ready database layer for reports, users, comments, notifications, issue status, and civic activity. It supports scalable storage for real-time civic data.

### 5. Firebase Storage

Firebase Storage supports uploaded evidence such as report images, profile assets, and resolution photos. Storage rules help control file access, file type expectations, and upload safety.

### 6. Firebase Security Rules

The project includes Firestore and Storage security rules to protect user data, reports, and uploaded evidence. These rules are important for responsible civic technology because public participation systems must protect user privacy and prevent abuse.

### 7. Google Maps Platform

Google Maps support enables issue location, map-based visualization, and geospatial context. This helps citizens and authorities understand where civic problems are happening and identify local patterns.

---

## Why CivicPulse AI Is A Strong Project

CivicPulse AI is built around real social impact and technical completeness. It does not stop at reporting; it creates an accountability pipeline from the moment a citizen sees a problem to the moment the community can verify that the issue was fixed.

The project demonstrates strong alignment with the evaluation focus:

- **Problem Solving and Impact:** It addresses real neighborhood infrastructure problems and improves transparency.
- **Agentic Depth:** Gemini is used for analysis, classification, reasoning, and verification rather than only a simple chatbot.
- **Innovation and Creativity:** The platform combines civic reporting, community verification, AI-assisted resolution proof, rewards, maps, and dashboards.
- **Usage of Google Technologies:** It uses Gemini, Firebase, and Google Maps in meaningful product workflows.
- **Product Experience and Design:** The website includes a polished responsive interface, dashboards, guided demo flow, and civic impact storytelling.
- **Technical Implementation:** It includes frontend, backend, AI endpoints, validation, security rules, data repositories, tests, and deployment preparation.
- **Completeness and Usability:** The app covers citizens, staff, admins, and judges with end-to-end workflows.

In short, CivicPulse AI is a civic trust engine: it helps communities report better, helps authorities respond smarter, and helps everyone verify that public problems are actually being solved.
