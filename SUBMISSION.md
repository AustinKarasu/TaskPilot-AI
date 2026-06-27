# CivicPulse AI — Submission

## Project Name
**CivicPulse AI** — Community issues. Visible action.

## Problem Statement
**Community Hero — Hyperlocal Problem Solver**

Citizens encounter civic infrastructure problems daily — potholes, broken streetlights, water leaks, garbage dumping — but lack an effective channel to report, track, and ensure resolution of these issues. Municipal authorities need structured data to prioritize work orders, and communities need transparency to hold them accountable.

## Solution

CivicPulse AI is a civic technology platform that enables citizens to:

1. **Report** issues by capturing photo/video evidence
2. **Analyze** with Gemini AI for automatic categorization, severity assessment, and department routing
3. **Verify** through community consensus — nearby citizens validate reports
4. **Track** issues through a transparent lifecycle with audit trails
5. **Resolve** with AI-verified before/after photo comparison to prevent false claims

## Google AI Technologies Used

### Gemini AI (Core Integration)
- **Multimodal Image Analysis** (`/api/gemini/analyze`): Citizens submit photos, Gemini analyzes the infrastructure defect, generates structured JSON with category, severity, public risk, department suggestion, safety advice, and recommended actions
- **Resolution Verification** (`/api/gemini/verify-resolution`): Before/after photo comparison to verify that reported issues have actually been fixed, preventing false resolution claims
- **Structured Output**: Both endpoints use Gemini's `responseSchema` feature for reliable JSON structured output
- **Model**: `gemini-2.5-flash` with retry logic and exponential backoff

### Google Maps Platform
- Interactive community map with issue markers
- Geocoding for address resolution
- Places Autocomplete for search

### Firebase
- **Authentication**: Email/password + Google SSO
- **Firestore**: Real-time database for issues, comments, users, notifications
- **Storage**: Issue evidence photos and resolution evidence

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   React SPA  │────▶│  Express API │────▶│  Gemini AI   │
│  (Vite/TS)  │     │  (server.ts) │     │  (Analysis)  │
└──────┬──────┘     └──────┬───────┘     └──────────────┘
       │                   │
       ▼                   ▼
┌──────────────┐   ┌──────────────┐
│ Google Maps  │   │   Firebase   │
│  Platform    │   │ Auth/DB/Stor │
└──────────────┘   └──────────────┘
```

## Demo Flow

1. Open the landing page → See live impact metrics
2. Click "Report an Issue" → Camera capture
3. Photo analyzed by Gemini → Auto-categorized with AI reasoning
4. Submit → Issue appears on community map
5. Other citizens verify the report → Priority escalates
6. Staff dashboard → Assign to department
7. Staff uploads "after" photo → Gemini verifies resolution
8. Issue marked resolved → Community notified

## How to Run

```bash
npm install
cp .env.example .env
# Add GEMINI_API_KEY to .env
npm run dev
# Open http://localhost:3000
```

## Team
Built with ❤️ for the community.
