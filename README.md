# CivicPulse AI

**Community issues. Visible action.**

CivicPulse AI is a production-grade civic technology platform that empowers citizens to identify, report, validate, track, and help resolve local community issues through collaboration, data, transparency, accountability, and intelligent automation.

## 🌟 Key Features

- **AI-Powered Issue Analysis**: Upload a photo of a civic issue and Gemini AI will analyze it, categorize it, assess severity, and recommend the responsible department
- **Community Verification**: Nearby residents can verify reports and add supporting evidence, dynamically boosting priority
- **Real-Time Tracking**: Follow issues through their complete lifecycle from report to verified resolution
- **Resolution Verification**: When staff claim an issue is fixed, Gemini compares before/after photos to verify the fix
- **Role-Based Access**: Citizens, Staff, and Administrators each have tailored interfaces
- **Gamification**: Earn points and badges for reporting issues and verifying community reports
- **Interactive Map**: Google Maps-powered community map with clustered markers and filters
- **Dark/Light Mode**: Full theme support with system preference detection

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4 |
| **Backend** | Express.js, Node.js |
| **AI** | Google Gemini (multimodal analysis, resolution verification) |
| **Maps** | Google Maps Platform (@vis.gl/react-google-maps) |
| **Auth** | Firebase Authentication (Email/Password, Google SSO) |
| **Database** | Firebase Firestore (with JSON fallback for development) |
| **Storage** | Firebase Storage (issue evidence, avatars) |
| **Charts** | Chart.js + react-chartjs-2 |
| **Animations** | Framer Motion (motion) |
| **Icons** | Lucide React |
| **Validation** | Zod |
| **Build** | Vite, ESBuild |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Google AI Studio account with a Gemini API key
- A Firebase project (optional for development — app runs with JSON fallback)
- A Google Maps API key (optional — map shows placeholder without it)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd CivicPlusAI

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

### Environment Variables

See [.env.example](.env.example) for the complete list. At minimum, you need:

```
GEMINI_API_KEY=your-gemini-key
```

### Available Scripts

| Script | Description |
|--------|------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run lint` | TypeScript type checking |
| `npm run clean` | Remove build artifacts |

## 📁 Project Structure

```
CivicPlusAI/
├── src/
│   ├── components/        # React components
│   │   ├── AIAnalysisPanel.tsx    # AI analysis display
│   │   ├── AdminDashboard.tsx     # Admin management
│   │   ├── AnalyticsView.tsx      # Analytics & charts
│   │   ├── AnnouncementBanner.tsx # System announcements
│   │   ├── AuthorityDashboard.tsx # Staff dashboard
│   │   ├── CivicCitySimulation.tsx# 3D city visualization
│   │   ├── CommunityMap.tsx       # Google Maps view
│   │   ├── CookieConsent.tsx      # GDPR consent
│   │   ├── IssueDetails.tsx       # Issue detail view
│   │   ├── Navbar.tsx             # Navigation bar
│   │   ├── NotificationCenter.tsx # Notifications
│   │   ├── PublicLanding.tsx      # Landing page
│   │   ├── ReportWizard.tsx       # Issue reporting
│   │   ├── RewardsPanel.tsx       # Gamification
│   │   ├── ShareModal.tsx         # Social sharing
│   │   └── UserProfile.tsx        # User profile
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.tsx        # Authentication
│   │   └── ThemeContext.tsx        # Theme management
│   ├── lib/               # Utilities
│   │   ├── firebase.ts            # Firebase init
│   │   ├── firestore.ts           # Firestore helpers
│   │   └── validations.ts         # Zod schemas
│   ├── pages/             # Route pages
│   │   ├── SignIn.tsx
│   │   ├── SignUp.tsx
│   │   └── ForgotPassword.tsx
│   ├── App.tsx            # Main application
│   ├── index.css          # Design system
│   ├── main.tsx           # Entry point
│   └── types.ts           # TypeScript types
├── server.ts              # Express backend
├── firestore.rules        # Firestore security rules
├── storage.rules          # Storage security rules
├── public/
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # Service worker
├── docs/                  # Documentation
└── .env.example           # Environment template
```

## 🔒 Security

- Firebase Authentication with role-based access control
- Firestore security rules with field-level validation
- Storage rules with file type and size restrictions
- Server-side rate limiting on AI endpoints
- Zod schema validation for all Gemini responses
- Security headers (X-Content-Type-Options, X-Frame-Options, CSP, etc.)
- Input sanitization with DOMPurify

## 📱 Progressive Web App

CivicPulse AI supports PWA installation with:
- Offline app shell caching
- Installable on mobile devices
- Theme-aware status bar

## 📄 License

Apache-2.0
