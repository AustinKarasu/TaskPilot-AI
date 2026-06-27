/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useRepository } from "./services/repository";
import { getAppMode } from "./services/appMode";
import { User, Issue, IssueSeverity, IssueStatus } from "./types";

import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import ExploreMapPage from "./pages/ExploreMapPage";
import ReportIssuePage from "./pages/ReportIssuePage";
import IssueDetailPage from "./pages/IssueDetailPage";
import DashboardPage from "./pages/DashboardPage";
import ImpactPage from "./pages/ImpactPage";
import AdminPage from "./pages/AdminPage";
import StaffPage from "./pages/StaffPage";
import AuthPage from "./pages/AuthPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import JudgeTourCompanion from "./components/JudgeTourCompanion";
import ProtectedRoute from "./components/ProtectedRoute";
import LeaderboardPage from "./pages/LeaderboardPage";
import AIChatbot from "./components/AIChatbot";
import FAQPage from "./pages/FAQPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import CreditsPage from "./pages/CreditsPage";
import NotFoundPage from "./pages/NotFoundPage";
import CookieConsent from "./components/CookieConsent";
import CivicScene3D from "./components/CivicScene3D";
import { ArrowUp, Send, Loader2 } from "lucide-react";

const FALLBACK_GUEST_USER: User = {
  id: "anonymous_guest",
  name: "Anonymous Visitor",
  email: "",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
  role: "citizen",
  language: "en",
  civicScore: 0,
  trustScore: 90,
  badges: [],
  joinedAt: "2026-06-23T00:00:00Z"
};

export default function App() {
  const auth = useAuth();
  const repository = useRepository();
  const navigate = useNavigate();
  const location = useLocation();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);
  const [language, setLanguage] = useState<"en" | "hi">(
    () => (localStorage.getItem("civiclens_language") as "en" | "hi") || "en"
  );
  
  // Theme state: defaults to "light" theme
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("civiclens_theme") as "light" | "dark") || "light"
  );

  // Location preset bridge (clicked on map -> auto fill in reporting flow)
  const [presetLocation, setPresetLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Back to top & newsletter states
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterStatus("loading");
    setNewsletterMessage("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail })
      });
      if (res.ok) {
        setNewsletterStatus("success");
        setNewsletterEmail("");
        setNewsletterMessage(language === "hi" ? "सदस्यता की पुष्टि हो गई है!" : "Subscription confirmed!");
      } else {
        const data = await res.json();
        throw new Error(data.error || "Subscription failed");
      }
    } catch (err: any) {
      setNewsletterStatus("error");
      setNewsletterMessage(err.message || "An error occurred");
    }
  };

  // Sync theme with document class list
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("civiclens_theme", theme);
  }, [theme]);

  // Load issues reactively
  const loadIssuesList = () => {
    repository.getIssues()
      .then(setIssues)
      .catch(err => console.error("Failed to load issues:", err));
  };

  // Load announcements reactively
  const loadAnnouncements = () => {
    repository.getAnnouncements()
      .then(setAnnouncements)
      .catch(err => console.error("Failed to load announcements:", err));
  };

  const loadData = () => {
    loadIssuesList();
    loadAnnouncements();
  };

  useEffect(() => {
    loadData();

    // 1. Polling interval to pull actual real-time changes from database
    const pollInterval = setInterval(() => {
      loadData();
    }, 4000);

    // 2. Real-time Telemetry Simulator (runs in local demo mode only)
    const mode = getAppMode();
    let simInterval: any;

    if (mode === "demo") {
      simInterval = setInterval(() => {
        try {
          repository.getIssues().then((currentIssues) => {
            if (!currentIssues || currentIssues.length === 0) return;

            const updatedIssues = [...currentIssues];
            const randomIndex = Math.floor(Math.random() * updatedIssues.length);
            const issue = { ...updatedIssues[randomIndex] };

            // Exclude already resolved/rejected issues from simulation to keep it logical
            if (issue.status === IssueStatus.RESOLVED || issue.status === IssueStatus.REJECTED) return;

            const randType = Math.random();
            if (randType < 0.45) {
              // 2.1 Simulate citizen confirming an issue
              issue.verificationCount += 1;
              issue.followerCount += Math.floor(Math.random() * 2) + 1;
              issue.priorityScore = Math.min(100, issue.priorityScore + 2);
              
              updatedIssues[randomIndex] = issue;
              localStorage.setItem("civiclens_demo_issues", JSON.stringify(updatedIssues));
              window.dispatchEvent(new Event("civiclens_data_changed"));
              console.log(`[Real-time Telemetry] Citizen verified issue ${issue.id}. Total verifications: ${issue.verificationCount}`);
            } else if (randType < 0.75) {
              // 2.2 Simulate priority score telemetry adjustment
              const delta = Math.random() > 0.5 ? 3 : -3;
              issue.priorityScore = Math.max(10, Math.min(100, issue.priorityScore + delta));
              
              updatedIssues[randomIndex] = issue;
              localStorage.setItem("civiclens_demo_issues", JSON.stringify(updatedIssues));
              window.dispatchEvent(new Event("civiclens_data_changed"));
              console.log(`[Real-time Telemetry] Telemetry sensor updated priority weight for issue ${issue.id} to ${issue.priorityScore}`);
            } else {
              // 2.3 Inject a new simulated temporary report
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
              const newIssue: Issue = {
                id: newIssueId,
                createdBy: "system_telemetry",
                createdByName: "City Telemetry Sensor",
                title: `[Live Telemetry] ${selectedInfo.title}`,
                originalDescription: "Automated alert received from municipal monitoring sensor network.",
                aiSummary: "Telemetry sensor trigger. Automated queue routing active.",
                category: selectedInfo.cat,
                subcategory: selectedInfo.sub,
                severity: Math.random() > 0.6 ? IssueSeverity.HIGH : IssueSeverity.MEDIUM,
                priorityScore: Math.floor(Math.random() * 40) + 40,
                aiConfidence: 0.95,
                location: {
                  lat: 12.9716 + latOffset,
                  lng: 77.5946 + lngOffset,
                  isApproximate: false
                },
                address: "Bengaluru Urban Telemetry Grid",
                landmark: "Sensor Zone " + Math.floor(Math.random() * 100),
                evidence: [{ url: "/assets/demo/pothole_preset.png", type: "image" }],
                status: IssueStatus.NEW,
                assignedDepartment: "Public Works Department",
                verificationCount: 1,
                inaccurateCount: 0,
                followerCount: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };

              // Limit simulated list size to keep localStorage clean (max 3 simulated issues at once)
              const simIssues = updatedIssues.filter(i => i.id.startsWith("rep-sim-"));
              if (simIssues.length >= 3) {
                let oldestSimIndex = -1;
                for (let k = updatedIssues.length - 1; k >= 0; k--) {
                  if (updatedIssues[k].id.startsWith("rep-sim-")) {
                    oldestSimIndex = k;
                    break;
                  }
                }
                if (oldestSimIndex !== -1) updatedIssues.splice(oldestSimIndex, 1);
              }

              updatedIssues.unshift(newIssue);
              localStorage.setItem("civiclens_demo_issues", JSON.stringify(updatedIssues));
              window.dispatchEvent(new Event("civiclens_data_changed"));
              console.log(`[Real-time Telemetry] Injected new sensor alert ${newIssueId}`);
            }
          });
        } catch (err) {
          console.warn("Real-time telemetry simulation tick failed:", err);
        }
      }, 10000);
    }

    window.addEventListener("civiclens_data_changed", loadData);
    window.addEventListener("civiclens_user_changed", loadData);
    
    return () => {
      clearInterval(pollInterval);
      if (simInterval) clearInterval(simInterval);
      window.removeEventListener("civiclens_data_changed", loadData);
      window.removeEventListener("civiclens_user_changed", loadData);
    };
  }, [repository]);

  const handleLanguageChange = (lang: "en" | "hi") => {
    setLanguage(lang);
    localStorage.setItem("civiclens_language", lang);
  };

  const handleAuthSuccess = () => {
    loadData();
  };

  const handleNavigate = (view: string) => {
    if (view === "landing") navigate("/");
    else if (view === "map") navigate("/explore");
    else if (view === "report") navigate("/app/report");
    else if (view === "dashboard") navigate("/app");
    else if (view === "impact") navigate("/impact");
    else if (view === "admin") navigate("/admin");
    else if (view === "staff") navigate("/staff");
    else if (view === "auth") navigate("/login");
    else if (view === "how-it-works") navigate("/how-it-works");
    else if (view === "leaderboard") navigate("/leaderboard");
    else if (view === "faq") navigate("/faq");
    else if (view === "testimonials") navigate("/testimonials");
    else if (view === "contact") navigate("/contact");
    else if (view === "privacy") navigate("/privacy");
    else if (view === "terms") navigate("/terms");
    else if (view === "credits") navigate("/credits");
    else if (view.startsWith("issue/")) {
      const id = view.replace("issue/", "");
      navigate(`/issues/${id}`);
    } else {
      navigate(view);
    }
  };

  const getNavbarView = () => {
    const path = location.pathname;
    if (path === "/") return "landing";
    if (path === "/explore") return "map";
    if (path === "/app/report") return "report";
    if (path === "/app") return "dashboard";
    if (path === "/impact") return "impact";
    if (path === "/admin") return "admin";
    if (path === "/staff") return "staff";
    if (path === "/login" || path === "/register") return "auth";
    if (path === "/how-it-works") return "how-it-works";
    if (path === "/leaderboard") return "leaderboard";
    if (path === "/faq") return "faq";
    if (path === "/testimonials") return "testimonials";
    if (path === "/contact") return "contact";
    if (path === "/privacy") return "privacy";
    if (path === "/terms") return "terms";
    if (path === "/credits") return "credits";
    return "";
  };

  const currentView = getNavbarView();
  const currentUser = auth.user || FALLBACK_GUEST_USER;

  if (auth.status === "initializing") {
    return (
      <div className="min-h-screen bg-slate-950 text-cyan-400 flex flex-col items-center justify-center font-mono text-xs gap-3">
        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        <span>Initializing Security Desk Auth...</span>
      </div>
    );
  }

  const activeAnnouncements = announcements.filter(ann => !dismissedAnnouncements.includes(ann.id));

  const handleDismissAnnouncement = (id: string) => {
    setDismissedAnnouncements(prev => [...prev, id]);
  };

  return (
    <div className={`min-h-screen bg-theme-main text-theme-main selection:bg-cyan-500/20 flex flex-col antialiased transition-colors`}>
      <CivicScene3D theme={theme} />

      {/* 0. ANNOUNCEMENTS DESK TOP-BARS */}
      <div className="w-full flex flex-col shrink-0">
        {/* Static Discount Announcement without close option */}
        <div className="w-full bg-blue-600 text-white text-[11px] font-medium py-1.5 px-4 text-center leading-none tracking-wide select-none">
          Announcements
        </div>
        {/* Dynamic Admin Announcements with close options - only showing the latest announcement */}
        {activeAnnouncements.slice(0, 1).map(ann => (
          <div key={ann.id} className="w-full bg-cyan-900/90 text-cyan-100 text-[11px] py-1.5 px-4 flex items-center justify-between border-b border-cyan-850">
            <span className="flex-1 text-center font-sans">
              <span className="font-bold uppercase mr-1.5">[{ann.category}]</span> {ann.content}
            </span>
            <button 
              onClick={() => handleDismissAnnouncement(ann.id)} 
              className="text-cyan-400 hover:text-cyan-200 ml-2 cursor-pointer font-bold font-mono transition text-xs"
              title="Close announcement banner"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* 1. STICKY DUAL PERSPECTIVE HEADER NAVBAR */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        language={language}
        onLanguageChange={handleLanguageChange}
        currentUser={currentUser}
        onUserChange={handleAuthSuccess}
        theme={theme}
        onThemeToggle={() => setTheme(prev => prev === "light" ? "dark" : "light")}
      />

      {/* 2. CORE VIEW SWITCH DESK */}
      <main className="flex-1 app-page-surface">
        <Routes>
          <Route path="/" element={
            <LandingPage
              issues={issues}
              onNavigate={handleNavigate}
              language={language}
            />
          } />

          <Route path="/explore" element={
            <ExploreMapPage
              issues={issues}
              onSelectIssue={(id) => handleNavigate(`issue/${id}`)}
              onNavigate={handleNavigate}
              onPresetReportLocation={(lat, lng) => setPresetLocation({ lat, lng })}
              language={language}
              theme={theme}
            />
          } />

          <Route path="/map" element={<Navigate to="/explore" replace />} />
          <Route path="/dashboard" element={<Navigate to="/app" replace />} />
          <Route path="/report" element={<Navigate to="/app/report" replace />} />

          <Route path="/impact" element={
            <ImpactPage
              language={language}
            />
          } />

          <Route path="/how-it-works" element={
            <HowItWorksPage
              onNavigate={handleNavigate}
              language={language}
            />
          } />

          <Route path="/leaderboard" element={
            <LeaderboardPage
              onNavigate={handleNavigate}
              language={language}
              currentUser={currentUser}
            />
          } />

          <Route path="/issues/:issueId" element={
            <IssueDetailRouteWrapper
              currentUser={currentUser}
              onNavigate={handleNavigate}
              language={language}
            />
          } />

          <Route path="/login" element={
            auth.status === "authenticated" ? (
              <Navigate to="/app" replace />
            ) : (
              <AuthPage
                onAuthSuccess={handleAuthSuccess}
                onNavigate={handleNavigate}
                language={language}
              />
            )
          } />

          <Route path="/register" element={
            auth.status === "authenticated" ? (
              <Navigate to="/app" replace />
            ) : (
              <AuthPage
                onAuthSuccess={handleAuthSuccess}
                onNavigate={handleNavigate}
                language={language}
              />
            )
          } />

          {/* Protected Routes */}
          <Route path="/app" element={
            <ProtectedRoute allow={["citizen", "staff", "admin"]} currentUser={currentUser} onNavigate={handleNavigate} language={language}>
              <DashboardPage
                currentUser={currentUser}
                onNavigate={handleNavigate}
                language={language}
              />
            </ProtectedRoute>
          } />

          <Route path="/app/report" element={
            <ProtectedRoute allow={["citizen", "staff", "admin"]} currentUser={currentUser} onNavigate={handleNavigate} language={language}>
              <ReportIssuePage
                currentUser={currentUser}
                onNavigate={handleNavigate}
                presetLocation={presetLocation || undefined}
                onClearPresetLocation={() => setPresetLocation(null)}
                language={language}
              />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allow={["admin"]} currentUser={currentUser} onNavigate={handleNavigate} language={language}>
              <AdminPage
                currentUser={currentUser}
                onNavigate={handleNavigate}
                language={language}
              />
            </ProtectedRoute>
          } />

          <Route path="/staff" element={
            <ProtectedRoute allow={["staff", "admin"]} currentUser={currentUser} onNavigate={handleNavigate} language={language}>
              <StaffPage
                currentUser={currentUser}
                onNavigate={handleNavigate}
                language={language}
              />
            </ProtectedRoute>
          } />

          <Route path="/unauthorized" element={
            <div className="max-w-md mx-auto px-4 py-20 text-center">
              <div className="bg-theme-secondary border border-theme-main p-8 rounded-3xl shadow-theme-main">
                <div className="text-6xl mb-4">⛔</div>
                <h2 className="text-xl font-extrabold text-theme-main mb-2">Access Denied</h2>
                <p className="text-xs text-theme-muted mb-6 font-mono">
                  You do not have the required permissions to access this section of CivicPulse AI.
                </p>
                <button
                  onClick={() => handleNavigate("landing")}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            </div>
          } />

          <Route path="/faq" element={
            <FAQPage
              onNavigate={handleNavigate}
              language={language}
            />
          } />

          <Route path="/testimonials" element={
            <TestimonialsPage
              onNavigate={handleNavigate}
              language={language}
            />
          } />

          <Route path="/contact" element={
            <ContactPage
              onNavigate={handleNavigate}
              language={language}
              currentUser={currentUser}
            />
          } />

          <Route path="/privacy" element={
            <PrivacyPage
              onNavigate={handleNavigate}
              language={language}
            />
          } />

          <Route path="/terms" element={
            <TermsPage
              onNavigate={handleNavigate}
              language={language}
            />
          } />

          <Route path="/credits" element={
            <CreditsPage
              onNavigate={handleNavigate}
              language={language}
            />
          } />

          <Route path="/404" element={
            <NotFoundPage
              onNavigate={handleNavigate}
              language={language}
            />
          } />

          {/* 404 Fallback */}
          <Route path="*" element={
            <NotFoundPage
              onNavigate={handleNavigate}
              language={language}
            />
          } />
        </Routes>
      </main>

      {/* 3. INTERACTIVE JUDGE SCENARIO COMPANION */}
      {auth.mode === "demo" && (
        <JudgeTourCompanion onNavigate={handleNavigate} language={language} />
      )}

      {/* 3.5 AI CHATBOT FLOAT */}
      <AIChatbot language={language} theme={theme} currentUser={currentUser} />

      {/* 3.7 COOKIES CONSENT BANNER */}
      <CookieConsent onNavigate={handleNavigate} language={language} />

      {/* 4. SOLID TRANSPARENT FOOTER BAR */}
      <footer className="border-t border-theme-main bg-[#030712] py-12 text-left text-xs text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: About */}
          <div className="space-y-4">
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-[#21D4FD] to-indigo-600 p-0.5 flex items-center justify-center shadow-md overflow-hidden">
                <img 
                  src="/favicon.png" 
                  alt="CivicPulse Logo" 
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
              <span className="font-extrabold text-white tracking-widest text-sm font-display">CIVICLENS AI</span>
            <p className="text-slate-400 leading-relaxed text-xs">
              CivicPulse AI is a hyperlocal infrastructure auditing and problem resolution platform, empowering citizens to audit, verify, and resolve neighborhood hazards in real-time.
            </p>
            <div className="flex flex-wrap gap-3 text-slate-500">
              <a href="mailto:aayankarasu@gmail.com" className="hover:text-cyan-400 transition-colors" aria-label="Email CivicPulse">Email</a>
              <a href="https://wa.me/918091726602" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors" aria-label="Open WhatsApp contact">WhatsApp</a>
              <button type="button" onClick={() => handleNavigate("privacy")} className="hover:text-cyan-400 transition-colors cursor-pointer" aria-label="Open privacy policy">Privacy</button>
              <button type="button" onClick={() => handleNavigate("credits")} className="hover:text-cyan-400 transition-colors cursor-pointer" aria-label="Open credits">Credits</button>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-4 text-left">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs font-mono">Important Links</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button type="button" onClick={() => handleNavigate("map")} className="hover:text-cyan-400 transition-colors cursor-pointer focus:outline-none focus:underline">
                  Explore Issues Map
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNavigate("leaderboard")} className="hover:text-cyan-400 transition-colors cursor-pointer focus:outline-none focus:underline">
                  Civic Leaderboard
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNavigate("how-it-works")} className="hover:text-cyan-400 transition-colors cursor-pointer focus:outline-none focus:underline">
                  How It Works
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNavigate("faq")} className="hover:text-cyan-400 transition-colors cursor-pointer focus:outline-none focus:underline">
                  FAQ Knowledge Base
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNavigate("testimonials")} className="hover:text-cyan-400 transition-colors cursor-pointer focus:outline-none focus:underline">
                  Testimonials & Reviews
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNavigate("contact")} className="hover:text-cyan-400 transition-colors cursor-pointer focus:outline-none focus:underline">
                  Support Tickets & Chat
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Hours */}
          <div className="space-y-4 text-left text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs font-mono">Contact Info</h4>
            <p className="text-slate-400">
              <strong className="text-slate-300">HQ:</strong> VPO Nanaon, Teh Palampur, Distt Kangra
            </p>
            <p className="text-slate-400">
              <strong className="text-slate-300">Phone:</strong> +91 8091726602
            </p>
            <p className="text-slate-400">
              <strong className="text-slate-300">Email:</strong> aayankarasu@gmail.com
            </p>
            <p className="text-slate-400 pt-2 border-t border-slate-900">
              <strong className="text-slate-300">Hours:</strong> Mon - Fri: 9:00 AM - 6:00 PM
            </p>
          </div>

          {/* Col 4: Newsletter */}
          <div className="space-y-4 text-left">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs font-mono">Newsletter</h4>
            <p className="text-slate-400 text-xs">
              Subscribe to receive weekly infrastructure reports and points multiplier streak events.
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                  className="bg-slate-900 border border-cyan-500/10 focus:border-cyan-500/40 focus:outline-none rounded-xl text-xs py-2 px-3 text-white flex-1"
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === "loading"}
                  className="px-3 bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:opacity-90 text-white rounded-xl flex items-center justify-center transition cursor-pointer disabled:opacity-50"
                  aria-label="Subscribe"
                >
                  {newsletterStatus === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {newsletterMessage && (
                <div className={`text-[10px] font-mono mt-1 ${
                  newsletterStatus === "success" ? "text-emerald-400" : "text-red-400"
                }`}>
                  {newsletterMessage}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="max-w-7xl mx-auto px-6 border-t border-slate-900 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono tracking-wider">
          <div className="flex gap-4">
            <button type="button" onClick={() => handleNavigate("privacy")} className="hover:text-cyan-400 transition-colors cursor-pointer focus:outline-none focus:underline">
              Privacy Policy
            </button>
            <span>|</span>
            <button type="button" onClick={() => handleNavigate("terms")} className="hover:text-cyan-400 transition-colors cursor-pointer focus:outline-none focus:underline">
              Terms & Conditions
            </button>
            <span>|</span>
            <button type="button" onClick={() => handleNavigate("credits")} className="hover:text-cyan-400 transition-colors cursor-pointer focus:outline-none focus:underline">
              Credits & Open Source
            </button>
          </div>
          <span>© 2026 CIVICLENS METROPOLITAN DIGITAL AUDIT PLATFORM</span>
        </div>
      </footer>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-24 left-6 z-50 w-10 h-10 bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-cyan-400 hover:text-white rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center cursor-pointer focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          title="Back to Top"
          aria-label="Back to Top"
        >
          <ArrowUp className="w-5 h-5 animate-bounce" />
        </button>
      )}
    </div>
  );
}

function IssueDetailRouteWrapper({ currentUser, onNavigate, language }: any) {
  const { issueId } = useParams();
  return <IssueDetailPage issueId={issueId || ""} currentUser={currentUser} onNavigate={onNavigate} language={language} />;
}
