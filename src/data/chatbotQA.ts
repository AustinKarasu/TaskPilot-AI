/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface QAEntry {
  id: number;
  keywords: string[];
  answer: string;
}

export const CHATBOT_QA: QAEntry[] = [
  // 1. DEVELOPER & CREATOR DETAILS
  {
    id: 1,
    keywords: ["maker", "creator", "developer", "built", "made", "author", "aayan", "parmar", "karasu", "who made", "who created", "who built", "owner", "portfolio", "contact", "email", "phone", "developer details"],
    answer: "This website was developed by Aayan Parmar (Aayan Karasu).\n\nDetails:\n- Portfolio: aayankarasu.fun\n- Contact Number: 8091726602\n- Email: aayankarasu@gmail.com\n\nFeel free to reach out for collaborations or inquiries!"
  },
  // 2. PLATFORM BASICS
  {
    id: 2,
    keywords: ["what is civiclens", "what is civic lens", "how does it help", "purpose", "concept", "mission", "goal", "platform", "civiclens", "civic lens"],
    answer: "CivicPulse AI is a hyperlocal infrastructure auditing and civic problem resolution platform.\n\nIt empowers citizens to report public hazards (such as potholes, broken streetlights, or waste accumulation) and collaborates with municipal authorities for verified resolution.\n\nKey capabilities include:\n1. Multimodal AI Analysis: Gemini AI automatically categorizes and estimates the priority of reported hazards.\n2. Peer Verification: Local residents confirm or dispute reports to build community consensus.\n3. Forensic Resolution Verification: AI compares 'Before' and 'After' photos to certify that repairs were successfully completed."
  },
  {
    id: 3,
    keywords: ["how does it work", "process", "workflow", "remediation flow", "steps"],
    answer: "The platform follows a 4-step lifecycle:\n1. Report: Citizens upload a photo and brief description of an issue.\n2. AI Extraction: Gemini extracts details, department, and priority.\n3. Verify: Neighbors vote/confirm the report.\n4. Resolve: Staff post resolution photo proof, which Gemini forensically checks to close."
  },
  {
    id: 4,
    keywords: ["is it free", "cost", "charge", "payment", "free of cost"],
    answer: "Yes, CivicPulse AI is completely free for citizens to use. It is designed as a public utility to improve neighborhood safety and governance."
  },
  {
    id: 5,
    keywords: ["cities", "supported locations", "where does it work", "bengaluru", "kolkata"],
    answer: "CivicPulse AI currently supports major metropolitan layouts including Bengaluru (Bellandur, Indiranagar, Sarjapur) and Kolkata (Central, Bowbazar, Bidhannagar) for demo and production sensor feeds."
  },
  {
    id: 6,
    keywords: ["who is it for", "target audience", "citizens", "authorities", "users"],
    answer: "CivicPulse AI is designed for three main user groups:\n1. Citizens: To report and audit local issues.\n2. Municipal Staff: To inspect and resolve dispatched tickets.\n3. Administrators: To manage announcements, user trust, and distribute rewards."
  },
  {
    id: 7,
    keywords: ["mobile app", "android", "ios", "play store", "app store"],
    answer: "CivicPulse AI is built as a fully responsive Web App using modern HTML5, CSS3, and React. It runs seamlessly on all mobile, tablet, and desktop browsers without requiring a separate app store download."
  },
  {
    id: 8,
    keywords: ["why was it built", "inspiration", "problem solved", "infrastructure issues"],
    answer: "It was built to solve the lack of transparency, duplicate report bloat, and slow response times in traditional municipal ticketing by using AI metadata extraction, location clustering, and forensic visual checks."
  },
  {
    id: 9,
    keywords: ["benefits", "why use it", "advantages", "value proposition"],
    answer: "Using CivicPulse AI increases public accountability, speeds up municipal resolution times (SLA tracking), prevents duplicate ticketing, and rewards citizen contribution with points and community badges."
  },
  {
    id: 10,
    keywords: ["real-time", "telemetry", "sensor", "live updates", "updates rate"],
    answer: "Yes, the platform features a real-time simulator that adjusts priority scores, verification counts, and injects telemetry reports on a continuous polling cycle (every 4-12 seconds)."
  },

  // 3. DESIGN SYSTEM & THEME
  {
    id: 11,
    keywords: ["theme", "dark mode", "design", "aesthetics", "glassmorphism", "look", "styling", "ui", "colors", "light mode"],
    answer: "CivicPulse AI features a premium dark glassmorphism styling layout, translucent cards, subtle glow states, and typography. The accent color system uses Cyan (technology/sensors), Indigo (infrastructure), and Emerald (resolutions)."
  },
  {
    id: 12,
    keywords: ["cyan", "cyan color", "cyan gradient", "accent color cyan"],
    answer: "Cyan represents active AI sensors, telemetry updates, and diagnostic features in CivicPulse AI. It maps to the CSS color variable `--text-highlight` in dark mode."
  },
  {
    id: 13,
    keywords: ["indigo", "indigo color", "indigo gradient", "accent color indigo"],
    answer: "Indigo represents municipal authority, staff actions, and database ledgers. It is used as a primary gradient color for reporting and dashboard navigation buttons."
  },
  {
    id: 14,
    keywords: ["emerald", "emerald color", "emerald gradient", "green color"],
    answer: "Emerald (or green) represents resolved, clean states. It is used to draw resolved heat map pulses, indicate fully remedied case studies, and mark completed audits."
  },
  {
    id: 15,
    keywords: ["typography", "fonts", "inter", "space grotesk", "jetbrains mono"],
    answer: "CivicPulse AI uses Google Fonts:\n- Display headers: 'Space Grotesk' (futuristic geometric sans-serif)\n- UI body: 'Inter' (high-legibility neutral sans-serif)\n- Telemetry & Logs: 'JetBrains Mono' (highly readable monospaced font)"
  },
  {
    id: 16,
    keywords: ["glassmorphism details", "translucent", "backdrop-blur", "card style"],
    answer: "The card style uses `bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30` which simulates frosted glass, letting glowing background halos pass through for a high-end look."
  },
  {
    id: 17,
    keywords: ["responsive layout", "mobile screen support", "viewport grid"],
    answer: "The UI uses a mobile-first flexbox and grid structure. Sections like the case study, map explorer, and dashboards adapt seamlessly from 320px mobile screens to large desktop monitors."
  },
  {
    id: 18,
    keywords: ["glowing effect", "blur halo", "cyberpunk styling"],
    answer: "We use absolute-positioned radial gradient divs with high CSS blur filters (`filter blur-[100px]`) behind text elements to create soft glowing background halos."
  },
  {
    id: 19,
    keywords: ["light theme vs dark theme", "toggle theme", "how to change mode"],
    answer: "You can toggle the application theme by clicking the Sun/Moon icon in the right side of the navigation header. The system updates CSS variables dynamically on the root HTML element."
  },
  {
    id: 20,
    keywords: ["css implementation", "vanilla css", "custom theme variables"],
    answer: "Styling is built with Tailwind CSS v4 and vanilla custom property variables defined in `:root` and `.dark` blocks in [index.css](file:///c:/CivicPlusAI/src/index.css)."
  },

  // 4. CITIZEN REPORTING FLOW
  {
    id: 21,
    keywords: ["how to report", "file a complaint", "submit ticket", "report a pothole", "report an issue"],
    answer: "Click 'Report Issue' in the header, upload a photo, let the AI scan it, verify coordinates on the map, and click submit."
  },
  {
    id: 22,
    keywords: ["pothole report", "pothole category", "roads department"],
    answer: "Potholes are categorized under 'Roads & Traffic' and routed to the Public Works Department (PWD) for patching."
  },
  {
    id: 23,
    keywords: ["broken streetlight report", " streetlight", "dark alley"],
    answer: "Broken streetlights are categorized under 'Public Utilities' and routed to the Electricity Board (BESCOM) for bulb replacements."
  },
  {
    id: 24,
    keywords: ["water leakage report", "water leakage", "pipeline burst"],
    answer: "Pipeline ruptures are categorized under 'Water & Sanitation' and routed to the Sewerage Board (BWSSB) to stop flooding."
  },
  {
    id: 25,
    keywords: ["garbage pile report", "garbage dump", "solid waste"],
    answer: "Garbage accumulation is categorized under 'Solid Waste Management' and routed to the SWM department for container collection."
  },
  {
    id: 26,
    keywords: ["open manhole report", "open manhole", "manhole cover"],
    answer: "Open manholes are treated as critical public safety hazards and routed to BWSSB for immediate lid replacement."
  },
  {
    id: 27,
    keywords: ["image upload size limit", "photo size", "upload restriction", "size limits"],
    answer: "The platform supports base64 image transmissions up to a limit of 10MB to prevent server payload bloat."
  },
  {
    id: 28,
    keywords: ["voice dictation", "hindi input", "english voice input", "microphone", "speak issue"],
    answer: "You can click the Microphone icon in the description field to dictate details. The simulator pre-fills voice transcripts in either English or Hindi."
  },
  {
    id: 29,
    keywords: ["geolocation coordinates", "gps accuracy", "coordinate pins"],
    answer: "The platform extracts GPS metadata from your photo. If missing, it uses your browser location or allows you to pin it manually on the Leaflet map."
  },
  {
    id: 30,
    keywords: ["anonymous reporting", "guest submission", "identity protection"],
    answer: "To ensure accountability and prevent fraud, you must sign in to submit a report. However, coordinates can be obfuscated to protect privacy."
  },

  // 5. GEMINI AI INTEGRATION
  {
    id: 31,
    keywords: ["gemini features", "ai features", "how is ai used", "artificial intelligence"],
    answer: "Gemini AI is integrated in four ways:\n1. Image analysis (details & category)\n2. Description enhancement\n3. Duplicate checking\n4. Forensic visual verification on resolution."
  },
  {
    id: 32,
    keywords: ["model name", "what model", "model version", "gemini-2.5-flash"],
    answer: "The platform uses Google's 'gemini-2.5-flash' model for fast response times and accurate multimodal scanning."
  },
  {
    id: 33,
    keywords: ["how ai scans photos", "image scanning", "multimodal check"],
    answer: "Gemini takes the uploaded image base64, identifies the defect (pothole, garbage, etc.), suggests a title, tags severity, and estimates public safety risks."
  },
  {
    id: 34,
    keywords: ["description improver", "enhance description", "improve writing", "ai rewrite"],
    answer: "The 'Enhance Description' button calls Gemini to refine citizen wording into formal engineering descriptions, supporting both English and Hindi."
  },
  {
    id: 35,
    keywords: ["duplicate checks", "duplicate prevention", "duplicate warning"],
    answer: "Gemini identifies duplicate reports by analyzing descriptions and image similarity within a 50-meter radius, prompting the user to join the existing report instead."
  },
  {
    id: 36,
    keywords: ["how does gemini ai verify completed repairs", "visual forensics", "before after checks", "resolution proof", "verify repairs", "remedy proof", "forensic verification", "after photo"],
    answer: "CivicPulse AI employs Google's Gemini multimodal model to perform forensic visual verification of resolved issues:\n\n1. Image Comparison: When municipal crew members upload an 'After' photo, the AI analyzes it alongside the original 'Before' photo submitted by the citizen.\n2. Defect Inspection: The model checks for structural differences to confirm the issue (e.g., a pothole filled, a street light turned on, or garbage removed) has been resolved.\n3. Confidence Rating: Gemini returns a confidence percentage. If the rating is high, the ticket status changes to 'Resolved'. Otherwise, it is sent back for secondary inspection."
  },
  {
    id: 37,
    keywords: ["severity score", "ai severity rating", "severity metrics"],
    answer: "Gemini rates issue severity from 1 (minor cosmetic defect) to 10 (critical structural danger, like a deep pothole on a school approaching road)."
  },
  {
    id: 38,
    keywords: ["risk evaluation", "risk factors", "safety advice"],
    answer: "Gemini assesses risk factors (pedestrian danger, vehicle damage) and provides real-time safety advice (e.g., 'Expect vehicle constraints. Avoid crossing on foot when dark')."
  },
  {
    id: 39,
    keywords: ["ai confidence", "confidence metrics", "ai accuracy"],
    answer: "Gemini returns a confidence score (0.0 to 1.0) indicating its certainty on the category, severity, and duplicate check evaluations."
  },
  {
    id: 40,
    keywords: ["gemini offline fallback", "what if gemini fails", "ai offline check"],
    answer: "If the Gemini API key is missing or invalid, CivicPulse AI surfaces a real Gemini configuration error so judges and developers can fix the credential instead of seeing a fake AI response."
  },

  // 6. CONSENSUS & PEER AUDITING
  {
    id: 41,
    keywords: ["how are reports validated by the community", "validated by the community", "what is consensus", "consensus system", "community consensus", "how are reports validated"],
    answer: "CivicPulse AI uses a decentralized community verification process to ensure report integrity and prevent fake submissions:\n\n1. Nearby Alerts: When a new issue is filed, local residents receive notification alerts on their map dashboard.\n2. Verification Votes: Neighbors can visit the spot to 'Confirm' (agree it exists) or 'Dispute' (assert it is resolved, duplicate, or inaccurate).\n3. Auto-Escalation: Once a report receives 5 or more confirmation votes, the system automatically escalates its status to 'Verified', which raises its municipal routing priority.\n4. Trust Integration: Confirmed reports increase the reporter's trust rating, while disputed reports lower it."
  },
  {
    id: 42,
    keywords: ["how to verify", "voting on issue", "confirming issue"],
    answer: "Open an issue detail page, click the 'Verify Report' button, select 'Confirm' or 'Dispute', leave a brief comment, and submit."
  },
  {
    id: 43,
    keywords: ["dispute issue", "dispute vote", "inaccurate report"],
    answer: "If a citizen reports that the defect is gone or fake, they can cast a 'Dispute' vote, raising the 'Inaccurate Count' in the dashboard."
  },
  {
    id: 44,
    keywords: ["merging duplicates", "master issue", "linking issues"],
    answer: "Administrators can merge duplicate tickets under a single 'Master' issue. All followers are consolidated and receive sync progress updates."
  },
  {
    id: 45,
    keywords: ["consensus threshold", "auto escalation", "verified status"],
    answer: "Once a report receives 5+ confirm votes, it is auto-promoted to 'VERIFIED' status, escalating its priority and notifying departments."
  },
  {
    id: 46,
    keywords: ["following an issue", "notifications follow", "stay updated"],
    answer: "Click the 'Follow' button on any issue detail page to receive notification alerts on status changes, assignments, or comments."
  },
  {
    id: 47,
    keywords: ["comments system", "discussing issue", "chat about issue"],
    answer: "Citizens can write comments on the issue detail page to share localized details (e.g., 'Water is spilling onto the major driving lane')."
  },
  {
    id: 48,
    keywords: ["who can comment", "gated comment", "comment restriction"],
    answer: "To prevent spam, only registered, signed-in users can write comments or submit consensus verifications."
  },
  {
    id: 49,
    keywords: ["trust score", "citizen trust rating", "reporter credibility"],
    answer: "Every citizen starts with a 90% Trust Score. Getting reports disputed or flagged decreases trust, while successful resolutions increase it."
  },
  {
    id: 50,
    keywords: ["community audit", "neighborhood auditing", "infrastructure ledger"],
    answer: "Every reported issue creates a permanent municipal ledger record, preventing local authorities from deleting or ignoring citizen reports."
  },

  // 7. CIVIC POINTS & REWARDS
  {
    id: 51,
    keywords: ["how to earn points", "points system", "civic points", "getting points", "how do i earn points & claim rewards", "earn points & claim rewards", "rewards system"],
    answer: "CivicPulse AI features a Civic Gamification Framework to incentivize active citizenship:\n\n1. Earning Points:\n   - Submit a Report: +25 Civic Points (granted upon successful validation).\n   - Verify/Peer Audit: +10 Civic Points (credited once the issue is officially resolved).\n   - Streak Multiplier: Reporting issues on consecutive days triggers a bonus of (streak_days * 15) points.\n\n2. Redeeming Rewards:\n   - Accumulate points and visit the 'Profile' dashboard.\n   - Choose from municipal benefits like free transit passes, public parking vouchers, or property tax discounts.\n   - Claiming a reward generates a unique digital voucher to present to local municipal vendors."
  },
  {
    id: 52,
    keywords: ["reporting points", "points for report", "pothole points"],
    answer: "Submitting a new, valid report awards you +25 Civic Points instantly."
  },
  {
    id: 53,
    keywords: ["verification points", "points for verification", "points pending"],
    answer: "Verifying an issue lists +10 points as pending. They are awarded once the issue is resolved to prevent spamming votes."
  },
  {
    id: 54,
    keywords: ["streak bonus", "daily streak", "submission streak"],
    answer: "Reporting issues on consecutive days triggers a streak multiplier. You receive `streak_days * 15` bonus points."
  },
  {
    id: 55,
    keywords: ["rejection penalty", "points deduction", "fake report penalty"],
    answer: "If an administrator rejects your report as fake, spam, or abusive, -30 Civic Points are deducted from your account balance."
  },
  {
    id: 56,
    keywords: ["how to redeem rewards", "redeem points", "reward items"],
    answer: "Go to your Profile tab, view available rewards, click 'Redeem', and the system will deduct points and generate a coupon voucher."
  },
  {
    id: 57,
    keywords: ["coupon code", "reward voucher", "claim reward"],
    answer: "Redeeming a reward generates a code (e.g., `CP-482015`). Present this digital voucher to participating local municipal vendors."
  },
  {
    id: 58,
    keywords: ["monthly points limit", "maximum points", "points decay"],
    answer: "Citizens can earn up to 1000 points per month. Unused points rollover, but monthly rankings reset for fair leaderboard competition."
  },
  {
    id: 59,
    keywords: ["rewards list", "what rewards are there", "free coupons"],
    answer: "Available rewards include:\n- 1 month free public transit pass (300 PTS)\n- 10% discount on property tax (500 PTS)\n- Municipal parking voucher (150 PTS)"
  },
  {
    id: 60,
    keywords: ["badges list", "earn badge", "badges definition"],
    answer: "Badges are unlocked at milestones:\n- 'First Responder': 1st report\n- 'Neighborhood Guardian': 5 verifications\n- 'Resolution Champion': 10 resolved issues"
  },

  // 8. LEADERBOARD & RANKINGS
  {
    id: 61,
    keywords: ["leaderboard details", "ranking list", "top citizens", "civic standings"],
    answer: "The Leaderboard sorts citizens by their total civic points. You can view user avatars, names, point totals, and active badges."
  },
  {
    id: 62,
    keywords: ["leaderboard rewards", "monthly prize", "top 3 performers"],
    answer: "The top 3 performers on the monthly leaderboard receive bonus points: 1st place (+150 PTS), 2nd place (+100 PTS), 3rd place (+50 PTS)."
  },
  {
    id: 63,
    keywords: ["who distributes rewards", "admin distribution", "distribute points button"],
    answer: "Administrators manually distribute monthly prizes using the 'Distribute Rewards' dashboard tool in the L2 Dispatcher portal."
  },
  {
    id: 64,
    keywords: ["how rank is decided", "rank rules", "tie breakers"],
    answer: "Ranks are decided by total civic score. If scores match, the citizen with the higher Trust Score is ranked higher."
  },
  {
    id: 65,
    keywords: ["leaderboard visibility", "who can see leaderboard", "public ranking"],
    answer: "The leaderboard page is public, allowing all visitors to see top-performing community members and foster positive engagement."
  },
  {
    id: 66,
    keywords: ["system admin madara", "madara score", "top user admin"],
    answer: "SysAdmin Madara is the top administrator, pre-seeded with 1000 points and the 'Community Guardian' badge."
  },
  {
    id: 67,
    keywords: ["arjun score", "priya score", "vikram score"],
    answer: "Pre-seeded users:\n- Vikram Malhotra: 450 PTS\n- Arjun Mehta: 360 PTS\n- Priya Sharma: 180 PTS"
  },
  {
    id: 68,
    keywords: ["citizen search", "find user on leaderboard", "user stats"],
    answer: "You can find your rank highlighted at the top of the leaderboard screen, detailing your current points, rank, and badge collection."
  },
  {
    id: 69,
    keywords: ["cheating prevention", "leaderboard security", "points verification"],
    answer: "Points are checked by audit trails. Attempting to spam fake verifications is blocked by the consensus validation algorithm."
  },
  {
    id: 70,
    keywords: ["performance statistics", "leaderboard history", "past months winners"],
    answer: "Past monthly winners are archived and listed in the 'Honor Roll' section of the Impact Page."
  },

  // 9. ANNOUNCEMENTS DESK
  {
    id: 71,
    keywords: ["what are announcements", "announcements banner", "site bulletins"],
    answer: "Announcements are urgent alerts posted by city administrators at the top of all pages (e.g. road closures or emergency repairs)."
  },
  {
    id: 72,
    keywords: ["static announcements", "v2code announcement", "aayan parmar announcement"],
    answer: "The blue banner at the top displays static announcements (e.g., 'Announcements') that cannot be dismissed or closed."
  },
  {
    id: 73,
    keywords: ["dynamic announcements", "admin notice banner", "close announcement"],
    answer: "Admin notices have a close button (✕) and can be dismissed. The system only renders the single latest dynamic notice."
  },
  {
    id: 74,
    keywords: ["who creates announcements", "publishing notices", "new notice"],
    answer: "Only users with the 'admin' role can publish notices using the 'Announcements Control' dashboard."
  },
  {
    id: 75,
    keywords: ["announcements database", "notice database path", "storing notices"],
    answer: "Announcements are stored in the database json (`data/db.json` / `localStorage`) under the key `civiclens_announcements`."
  },
  {
    id: 76,
    keywords: ["notice categories", "bulletin types", "alert category"],
    answer: "Notices are categorized into:\n- `info`: General updates\n- `warning`: Crucial blocks\n- `success`: Completed projects\n- `alert`: Emergency situations"
  },
  {
    id: 77,
    keywords: ["dismiss notice", "hiding notice banner", "how to close notice"],
    answer: "Click the small '✕' icon on the right side of the dynamic announcement bar to close and hide it for your session."
  },
  {
    id: 78,
    keywords: ["announcements limit", "latest notice only", "notice slice"],
    answer: "To prevent visual clutter, the app applies a `.slice(0, 1)` filter to render only the single latest announcement."
  },
  {
    id: 79,
    keywords: ["delete announcement", "remove notice", "delete notice button"],
    answer: "Administrators can delete notices in the admin panel, which instantly removes them from all active client viewports."
  },
  {
    id: 80,
    keywords: ["announcement details", "notice text", "broadcast messages"],
    answer: "Notices detail the category, scope (e.g. 'All Departments'), contents, date of publish, and logged author metadata."
  },

  // 10. EXPLORE MAP & HEATMAP
  {
    id: 81,
    keywords: ["explore map details", "map controls", "view issues map"],
    answer: "The Explore Map displays active tickets as color-coded pins (Red: Critical, Orange: High, Yellow: Medium, Blue: Low, Green: Resolved)."
  },
  {
    id: 82,
    keywords: ["heatmap details", "how heatmap works", "flame toggle"],
    answer: "Click the Flame button to show a canvas-based heatmap overlay. It displays glowing heat zones representing issue density."
  },
  {
    id: 83,
    keywords: ["flame button", "activate heatmap", "heat layer switch"],
    answer: "The floating Flame button toggles the heatmap on the map grid. When active, the icon pulses red."
  },
  {
    id: 84,
    keywords: ["heatmap canvas layer", "canvas rendering map", "map drawing"],
    answer: "We draw the heatmap on a transparent canvas positioned below interactive pins, keeping pins clickable."
  },
  {
    id: 90,
    keywords: ["map pins", "marker colors", "click pin"],
    answer: "Click a map pin to show a popup card detailing the issue title, status, severity, and a link to view details."
  },
  {
    id: 85,
    keywords: ["red heat zones", "critical density", "severe hotspots"],
    answer: "Red heat zones show severe, unresolved hazards (severity rating 9-10) like deep school potholes or open manholes."
  },
  {
    id: 86,
    keywords: ["orange heat zones", "high density", "medium hotspots"],
    answer: "Orange heat zones show high-severity issues (rating 6-8) such as main pipeline ruptures and clogged drainage lanes."
  },
  {
    id: 87,
    keywords: ["green heat zones", "resolved areas", "cleared hotspots"],
    answer: "Green heat zones show completed resolutions, illustrating areas where repairs have been verified by Gemini."
  },
  {
    id: 88,
    keywords: ["map zoom controls", "fit bounds", "recenter map"],
    answer: "Use the standard '+' and '-' buttons to zoom, or click the search box to find specific sectors."
  },
  {
    id: 89,
    keywords: ["leaflet map integration", "leaflet library", "offline maps"],
    answer: "We use the Leaflet open-source library, configured with static layout containers to prevent rendering collapse."
  },

  // 11. AUTHORITY & RESOLUTIONS
  {
    id: 91,
    keywords: ["authority panel", "staff panel", "technician desk", "dispatch seat"],
    answer: "Crews view assigned tickets in the Staff Panel, select a ticket to view coordinates, complete repairs, and submit proof."
  },
  {
    id: 92,
    keywords: ["assign department", "assigning technician", "dispatch crew"],
    answer: "Administrators dispatch tickets to departments (PWD, BESCOM, BWSSB) and log the technician's name."
  },
  {
    id: 93,
    keywords: ["resolution image", "after photo", "remedy proof"],
    answer: "Crews must submit a photo of the completed repair. Gemini compares this 'After' photo to the 'Before' photo."
  },
  {
    id: 94,
    keywords: ["reopen ticket", "reopening issue", "reopen button"],
    answer: "If a repair is incomplete or fails, admins can reopen the ticket to reset its status and dispatch a new crew."
  },
  {
    id: 95,
    keywords: ["sla duration", "resolution SLA", "response timing"],
    answer: "SLA response targets are:\n- Critical: 6 hours\n- High: 24 hours\n- Medium: 48 hours"
  },
  {
    id: 96,
    keywords: ["audit logs", "system ledger", "admin logs list"],
    answer: "The system logs every action (reports, verifications, dispatches, resolutions) in the Audit Log tab in [AdminPage.tsx](file:///c:/CivicPlusAI/src/pages/AdminPage.tsx#L40)."
  },
  {
    id: 97,
    keywords: ["reject issue", "rejecting ticket", "spam complaint"],
    answer: "Admins can reject spam or fake tickets. The reporter is penalized -30 points, and the ticket is closed as rejected."
  },
  {
    id: 98,
    keywords: ["escalation rules", "unresolved ticket", "overdue SLA"],
    answer: "Tickets unresolved past the SLA deadline receive a priority boost and are flagged red on the dispatcher board."
  },
  {
    id: 99,
    keywords: ["officer sandeep", "kamal staff", "crew profiles"],
    answer: "Staff users include Officer Sandeep Ray (Electrical BESCOM) and Inspector Kamal (Water BWSSB)."
  },
  {
    id: 100,
    keywords: ["resolution notes", "admin notes", "closing notes"],
    answer: "Crews must write closing notes (e.g. 'Sodium lights replaced with LED fixtures. Operational glow verified on site')."
  },

  // 12. MISCELLANEOUS QUESTIONS
  {
    id: 101,
    keywords: ["forgot password", "password reset", "recover account"],
    answer: "Click 'Forgot Password?' on the login screen. In demo mode, it retrieves and displays your pre-seeded password instantly."
  },
  {
    id: 102,
    keywords: ["how to login", "sign in credentials", "demo accounts"],
    answer: "Use these demo credentials:\n- Citizen: citizen@civiclens.demo / Citizen@2026\n- Admin: admin@civiclens.demo / CivicPulse@2026\n- Staff: staff@civiclens.demo / Staff@2026"
  },
  {
    id: 103,
    keywords: ["impact metrics", "impact page", "carbon offset", "clean water saved"],
    answer: "The Impact Page displays metrics like total reports resolved, average resolution time, and estimated carbon offset."
  },
  {
    id: 104,
    keywords: ["security desk", "auth context", "token security"],
    answer: "The authorization manager handles session tokens. Production mode validates Firebase credential claims, while demo mode resolves credentials locally for seamless preview."
  },
  {
    id: 105,
    keywords: ["how is my privacy and location protected", "privacy and location protected", "coordinate obfuscation", "privacy mode", "isapproximate map", "location protected", "privacy safeguards"],
    answer: "CivicPulse AI prioritizes user privacy and data security through several built-in mechanisms:\n\n1. Location Obfuscation: When filing a report, you can enable 'Approximate Location'. This applies a random geographic offset to the coordinates on the public map, hiding your exact address while retaining general municipal mapping visibility.\n2. Identity Safeguards: Public dashboards and notifications display only your display name, hiding critical contact details like email addresses or phone numbers.\n3. Cryptographic Session Management: All user logins are protected by secure session tokens (and optional two-factor authentication) to safeguard your profile and accumulated points."
  },

  // 13. ADDITIONAL QUESTIONS TO REACH 105+
  {
    id: 106,
    keywords: ["how to sign up", "create account", "register citizen"],
    answer: "Click 'Sign In' in the header, click 'Register here', enter your details (name, email, password), and click 'Register Account'."
  },
  {
    id: 107,
    keywords: ["what categories are there", "issue types", "reporting categories"],
    answer: "CivicPulse AI supports 5 primary categories:\n1. Roads & Traffic\n2. Water & Sanitation\n3. Public Utilities\n4. Solid Waste Management\n5. Environment & Safety"
  },
  {
    id: 108,
    keywords: ["how is severity graded", "severity level meaning"],
    answer: "Severity levels:\n- Critical (9-10): Immediate hazard (open manhole, blocked traffic)\n- High (7-8): Serious issue (flooded street, broken streetlight)\n- Medium (4-6): Moderate concern (pothole in alley, waste pile)\n- Low (1-3): Minor cosmetic (chipped sidewalk)"
  },
  {
    id: 109,
    keywords: ["can i dispute a report", "fake report claim", "flagging issue"],
    answer: "Yes, you can select 'Dispute' during verification to flag an issue as inaccurate, resolved prematurely, or duplicate."
  },
  {
    id: 110,
    keywords: ["carbon offset calculations", "clean environment metrics"],
    answer: "Resolved environment issues calculate carbon offsets based on tree branch clearance and debris removal multipliers (e.g. +145 kg CO2 offset)."
  }
];
