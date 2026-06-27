/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Issue, IssueStatus, IssueSeverity, User, Department } from "../types";
import { dbService } from "../services/db";
import { getAuthHeaders } from "../lib/api";
import { TRANSLATIONS } from "../i18n/translations";
import KanbanBoard from "../components/KanbanBoard";
import AnalyticsBento from "../components/AnalyticsBento";
import TerminalLogFeed from "../components/TerminalLogFeed";
import { 
  Layers, 
  ListFilter, 
  AlertOctagon, 
  ArrowRight, 
  CheckCircle, 
  Landmark, 
  Eye, 
  ChevronRight, 
  Lock, 
  Shield, 
  Users, 
  TrendingUp, 
  Menu, 
  X, 
  Download, 
  Play, 
  AlertCircle, 
  Check, 
  UserX, 
  UserCheck, 
  Activity, 
  Star, 
  Award, 
  FileText,
  ShieldAlert,
  ShieldCheck,
  Megaphone,
  MessageSquare
} from "lucide-react";

interface AdminPageProps {
  currentUser: User;
  onNavigate: (view: string) => void;
  language: "en" | "hi";
}

export default function AdminPage({ currentUser, onNavigate, language }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<"kanban" | "list" | "users" | "submissions" | "testimonials_mod" | "moderators" | "announcements" | "analytics" | "audit" | "backup_control">("kanban");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [allUsers, setAllUsers] = useState<Record<string, User>>({});
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annCategory, setAnnCategory] = useState<"alert" | "info" | "warning" | "success">("info");
  const [annDept, setAnnDept] = useState("Public Works & Highways (PWD)");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState("all");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [systemLogs, setSystemLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Secure terminal connection routed. Active clearance level: Level 2 Admin.`,
    `[${new Date().toLocaleTimeString()}] Civic database schema verified (BWSSB, BESCOM, PWD bounds).`,
    `[${new Date().toLocaleTimeString()}] Automated SLA monitor daemon initialized. No anomalies detected.`
  ]);

  // Submission, Testimonial and Backup State
  const [submissions, setSubmissions] = useState<{
    contactSubmissions: any[];
    newsletterSubscribers: any[];
    supportTickets: any[];
  }>({ contactSubmissions: [], newsletterSubscribers: [], supportTickets: [] });
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [loadingTestimonials, setLoadingTestimonials] = useState(false);
  const [backupStatus, setBackupStatus] = useState("");
  const [restoreStatus, setRestoreStatus] = useState("");

  // Support Ticket Messaging/Claim/Delete States
  const [activeSupportTicketId, setActiveSupportTicketId] = useState<string | null>(null);
  const [supportTicketMessages, setSupportTicketMessages] = useState<any[]>([]);
  const [supportReplyText, setSupportReplyText] = useState("");
  const [sendingSupportReply, setSendingSupportReply] = useState(false);

  const loadSupportTicketMessages = async (tktId: string) => {
    try {
      const res = await fetch(`/api/tickets/${tktId}/messages`, { headers: await getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSupportTicketMessages(data);
      }
    } catch (err) {
      console.error("Failed to load ticket messages:", err);
    }
  };

  useEffect(() => {
    if (activeSupportTicketId && activeTab === "submissions") {
      loadSupportTicketMessages(activeSupportTicketId);
      const interval = setInterval(() => {
        loadSupportTicketMessages(activeSupportTicketId);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeSupportTicketId, activeTab]);

  const handleClaimTicket = async (ticketId: string) => {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/admin/tickets/${ticketId}/claim`, {
        method: "POST",
        headers: { ...authHeaders },
        body: JSON.stringify({ staffId: currentUser.id, staffName: currentUser.name })
      });
      if (res.ok) {
        addTerminalLog(`Claimed support ticket: ${ticketId}`);
        loadSubmissions();
      } else {
        alert("Failed to claim ticket");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Are you sure you want to permanently delete this support ticket?")) return;
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "DELETE",
        headers: await getAuthHeaders()
      });
      if (res.ok) {
        addTerminalLog(`Deleted support ticket: ${ticketId}`);
        if (activeSupportTicketId === ticketId) setActiveSupportTicketId(null);
        loadSubmissions();
      } else {
        alert("Failed to delete ticket");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendSupportReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportReplyText.trim() || !activeSupportTicketId) return;
    setSendingSupportReply(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/tickets/${activeSupportTicketId}/reply`, {
        method: "POST",
        headers: { ...authHeaders },
        body: JSON.stringify({
          text: supportReplyText,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          senderId: currentUser.id
        })
      });
      if (res.ok) {
        setSupportReplyText("");
        loadSupportTicketMessages(activeSupportTicketId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingSupportReply(false);
    }
  };

  const dict = TRANSLATIONS[language];
  const isSigned = localStorage.getItem("civiclens_is_signed_in") === "true";
  const isAdmin = isSigned && currentUser && currentUser.role === "admin";

  const loadData = () => {
    if (!isSigned || !isAdmin) return;
    setIssues(dbService.getIssues());
    setAllUsers(dbService.getUsers());
    setAnnouncements(dbService.getAnnouncements());
  };

  const loadSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const res = await fetch("/api/admin/submissions", { headers: await getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error("Failed to load admin submissions:", err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const loadTestimonials = async () => {
    setLoadingTestimonials(true);
    try {
      const res = await fetch("/api/testimonials?isAdmin=true", { headers: await getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTestimonials(data);
      }
    } catch (err) {
      console.error("Failed to load testimonials for moderation:", err);
    } finally {
      setLoadingTestimonials(false);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/resolve`, {
        method: "POST",
        headers: await getAuthHeaders()
      });
      if (res.ok) {
        addTerminalLog(`Resolved support ticket: ${ticketId}`);
        loadSubmissions();
      } else {
        alert("Failed to resolve support ticket");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveTestimonial = async (id: string) => {
    try {
      const res = await fetch(`/api/testimonials/${id}/approve`, {
        method: "PUT",
        headers: await getAuthHeaders()
      });
      if (res.ok) {
        addTerminalLog(`Approved testimonial ID: ${id}`);
        loadTestimonials();
      } else {
        alert("Failed to approve testimonial");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    try {
      const res = await fetch(`/api/testimonials/${id}`, {
        method: "DELETE",
        headers: await getAuthHeaders()
      });
      if (res.ok) {
        addTerminalLog(`Deleted/Rejected testimonial ID: ${id}`);
        loadTestimonials();
      } else {
        alert("Failed to delete testimonial");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBackupDatabase = async () => {
    setBackupStatus("Creating backup...");
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: await getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setBackupStatus("✓ Backup created successfully.");
        addTerminalLog("Manual database backup created successfully.");
      } else {
        setBackupStatus(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setBackupStatus(`Failed: ${err.message}`);
    }
  };

  const handleRestoreDatabase = async () => {
    if (!confirm("Are you sure you want to restore the database from backup? This will overwrite current tickets.")) {
      return;
    }
    setRestoreStatus("Restoring system...");
    try {
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        headers: await getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setRestoreStatus("✓ Restore completed successfully.");
        addTerminalLog("System database successfully restored from backup.");
        loadData();
      } else {
        setRestoreStatus(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setRestoreStatus(`Failed: ${err.message}`);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("civiclens_user_changed", loadData);
    window.addEventListener("civiclens_data_changed", loadData);
    return () => {
      window.removeEventListener("civiclens_user_changed", loadData);
      window.removeEventListener("civiclens_data_changed", loadData);
    };
  }, [currentUser.role, isSigned]);

  useEffect(() => {
    if (activeTab === "submissions") {
      loadSubmissions();
    }
    if (activeTab === "testimonials_mod") {
      loadTestimonials();
    }
  }, [activeTab]);

  // Periodic automatic generation of real-time telemetry logs in Analytics view
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeTab === "analytics") {
        const categories = ["Roads & Traffic", "Water & Sanitation", "Public Utilities", "Solid Waste Management"];
        const actions = [
          "Auto-categorized evidence via Gemini Vision",
          "Calculated priority index to high alarm",
          "Pre-sorted as duplicate of active ticket",
          "Updated contractor dispatch ETA to standard SLA window",
          "Calculated carbon compensation offsets"
        ];
        const randomCat = categories[Math.floor(Math.random() * categories.length)];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        const newLog = `[${new Date().toLocaleTimeString()}] Command AI: [${randomCat}] ${randomAction}.`;
        
        setSystemLogs(prev => [newLog, ...prev.slice(0, 7)]);
      }
    }, 4500);

    return () => clearInterval(timer);
  }, [activeTab]);

  const handleApproveModerator = (userId: string) => {
    dbService.approveModerator(userId);
    loadData();
    addTerminalLog(`Approved moderator credential access for user ${userId.substring(0, 7)}.`);
  };

  const handleDenyModerator = (userId: string) => {
    dbService.denyModerator(userId);
    loadData();
    addTerminalLog(`Rejected / revoked moderator privileges for user ${userId.substring(0, 7)}.`);
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    dbService.addAnnouncement({
      title: annTitle,
      content: annContent,
      category: annCategory,
      department: annDept,
      authorName: currentUser.name
    });
    setAnnTitle("");
    setAnnContent("");
    addTerminalLog(`Published system-wide announcement: "${annTitle}" under ${annCategory.toUpperCase()} category.`);
  };

  const handleDeleteAnnouncement = (id: string, title: string) => {
    dbService.deleteAnnouncement(id);
    addTerminalLog(`Deleted system announcement: "${title}".`);
  };

  const addTerminalLog = (message: string) => {
    setSystemLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  // Logical operations for USERS tab (adjust civic rating, badges, muting)
  const handleModifyUserTrust = (userId: string, newTrust: number) => {
    const users = dbService.getUsers();
    if (users[userId]) {
      users[userId].trustScore = Math.max(0, Math.min(100, Math.round(newTrust)));
      dbService.saveUser(users[userId]);
      loadData();
      addTerminalLog(`Modified trust capability index of user ${users[userId].name} to ${Math.round(newTrust)}%.`);
    }
  };

  const handleAdjustUserCivicPoints = (userId: string, delta: number) => {
    dbService.updateUserScore(userId, delta, `Administrative adjustment by ${currentUser.name}`);
    loadData();
    addTerminalLog(`Transmitted civic score balance adjustment (${delta > 0 ? "+" : ""}${delta} points) to user.`);
  };

  const handleToggleUserBadge = (userId: string, badgeName: string) => {
    const users = dbService.getUsers();
    if (users[userId]) {
      const badges = users[userId].badges || [];
      const hasBadge = badges.includes(badgeName);
      if (hasBadge) {
        users[userId].badges = badges.filter(b => b !== badgeName);
        addTerminalLog(`Revoked honorary badge "${badgeName}" from user ${users[userId].name}.`);
      } else {
        users[userId].badges = [...badges, badgeName];
        addTerminalLog(`Conferred honorary badge "${badgeName}" to user ${users[userId].name}.`);
      }
      dbService.saveUser(users[userId]);
      loadData();
    }
  };

  const handleToggleUserReportingMute = (userId: string) => {
    const users = dbService.getUsers();
    if (users[userId]) {
      // Toggle a dynamic property "blocked" on user object
      const isBlocked = !(users[userId] as any).blocked;
      (users[userId] as any).blocked = isBlocked;
      dbService.saveUser(users[userId]);
      loadData();
      addTerminalLog(`Citizen ${users[userId].name} submissions state updated to: ${isBlocked ? "SUSPENDED" : "UNRESTRICTED"}.`);
    }
  };

  // 100% Real Interactive CSV Spreadsheet Export Tool
  const handleExportCSV = () => {
    const headers = "Ticket ID,Incidence Title,Category,Severity,Priority Score,Assigned Department,Status,Latitude,Longitude,Address,Date Recorded\n";
    const dataRows = filteredQueue.map(item => {
      const cleanTitle = item.title.replace(/"/g, '""');
      const cleanAddr = item.address.replace(/"/g, '""');
      return `"${item.id}","${cleanTitle}","${item.category}","${item.severity}","${Math.round(item.priorityScore)}","${item.assignedDepartment}","${item.status}","${item.location.lat}","${item.location.lng}","${cleanAddr}","${new Date(item.createdAt).toLocaleDateString()}"`;
    }).join("\n");

    const blob = new Blob([headers + dataRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CivicPulse_Incident_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addTerminalLog(`Compiled and downloaded incident ledger spreadsheet containing ${filteredQueue.length} records.`);
  };

  // Sensor dispatch triggers to route immediate incidents and demonstrate system functionality
  const handleInjectRainfallEmergency = () => {
    const mockIssues: Issue[] = [
      {
        id: "issue_storm_" + Math.floor(Math.random() * 1000),
        createdBy: "user_admin_1",
        createdByName: "Automated Incident Sensor",
        createdByAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
        title: "[Sensor Alert] Severe Waterlogging & Silt Accumulation on Flyover Loop",
        originalDescription: "Sudden heavy rain gush resulted in 12 inches of water accumulation blocking the main highway exit flyover. Complete hazard for motorbikes.",
        aiSummary: "Rainfall runoff overload. Drainage vents clogged by plastic waste under elevated flyover intersection. Prompt clearance required.",
        category: "Water & Sanitation",
        subcategory: "Water Pipeline Leakage",
        severity: IssueSeverity.CRITICAL,
        priorityScore: 91,
        aiConfidence: 0.96,
        location: { lat: 12.9242, lng: 77.6748, isApproximate: false },
        address: "Outer Ring Road (ORR) elevated loop exit, Bellandur",
        landmark: "Flyover exit ramp opposite tech park",
        evidence: [{ url: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=600", type: "image" }],
        status: IssueStatus.NEW,
        assignedDepartment: "Water Supply & Sewerage Board (BWSSB)",
        verificationCount: 8,
        inaccurateCount: 0,
        followerCount: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        safetyAdvice: "Two wheelers strictly detour. Cars limit speeds to 20 km/h.",
        possibleRisks: ["Hydroplaning hazards", "Prolonged arterial high-density transit block"]
      },
      {
        id: "issue_storm_" + Math.floor(Math.random() * 1000 + 1000),
        createdBy: "user_admin_1",
        createdByName: "Automated Incident Sensor",
        createdByAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
        title: "[Sensor Alert] Massive Under-canopy Crater & Exposed Silt",
        originalDescription: "Heavy stormwater has washed off previous bitumen patching, creating a deep 2-meter crater in the lane center.",
        aiSummary: "Immediate asphalt failure. Road sub-base saturation triggered by localized storm drain backfill breach. Urgent municipal compaction patch required.",
        category: "Roads & Traffic",
        subcategory: "Potholes",
        severity: IssueSeverity.HIGH,
        priorityScore: 84,
        aiConfidence: 0.94,
        location: { lat: 12.9348, lng: 77.6892, isApproximate: false },
        address: "80 Feet Road Section, Koramangala 4th Block",
        landmark: "Beside neighborhood park parkway junction",
        evidence: [{ url: "https://images.unsplash.com/photo-1599740831146-80a6b7dbd931?auto=format&fit=crop&q=80&w=600", type: "image" }],
        status: IssueStatus.NEW,
        assignedDepartment: "Public Works & Highways (PWD)",
        verificationCount: 5,
        inaccurateCount: 0,
        followerCount: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        safetyAdvice: "Asphalt is unstable. Maintain distance with heavy carrier trucks.",
        possibleRisks: ["Sub-surface cave-in", "Severe heavy suspension impacts"]
      }
    ];

    mockIssues.forEach(issue => dbService.saveIssue(issue));
    dbService.addStatusUpdate({
      id: "su_" + Math.random().toString(36).substr(2, 9),
      issueId: mockIssues[0].id,
      previousStatus: IssueStatus.NEW,
      newStatus: IssueStatus.NEW,
      updatedBy: "system",
      updatedByName: "CivicPulse AI",
      publicMessage: "Emergency alert triggered by sensor network. Dispatched automatic telemetry alerts to BWSSB and PWD units.",
      createdAt: new Date().toISOString()
    });
    loadData();
    window.dispatchEvent(new Event("civiclens_data_changed"));
    addTerminalLog("Sensor Alert: Transmitted monsoon waterlogging and road cave-in records to PWD and BWSSB command rooms.");
  };

  const handleInjectPowerGridShutdown = () => {
    const mockIssue: Issue = {
      id: "issue_blackout_" + Math.floor(Math.random() * 1000),
      createdBy: "user_admin_1",
      createdByName: "Automated Incident Sensor",
      createdByAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
      title: "[Sensor Alert] Total Substation Local Blackout & Fallen High-Voltage Line",
      originalDescription: "High winds caused overhead transformer sparking and subsequent major local power blackout. Live high voltage wire dangling on walkway.",
      aiSummary: "Sub-assembly terminal breakdown. Snapped high-tension conductor wire creating lethal pedestrian and municipal hazard.",
      category: "Public Utilities",
      subcategory: "Broken Streetlight",
      severity: IssueSeverity.CRITICAL,
      priorityScore: 96,
      aiConfidence: 0.98,
      location: { lat: 12.9512, lng: 77.6412, isApproximate: false },
      address: "HAL Landmark Circle Intersection, Indiranagar",
      landmark: "Directly opposite defense enclave security gate",
      evidence: [{ url: "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&q=80&w=600", type: "image" }],
      status: IssueStatus.NEW,
      assignedDepartment: "Electricity Distribution (BESCOM)",
      verificationCount: 15,
      inaccurateCount: 0,
      followerCount: 32,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      safetyAdvice: "STAY CLEAR. Active high voltage shock hazard present on metal railings within 30 meters.",
      possibleRisks: ["Accidental lethal electrocution", "Substation transformer explosion risk"]
    };

    dbService.saveIssue(mockIssue);
    dbService.addStatusUpdate({
      id: "su_" + Math.random().toString(36).substr(2, 9),
      issueId: mockIssue.id,
      previousStatus: IssueStatus.NEW,
      newStatus: IssueStatus.NEW,
      updatedBy: "system",
      updatedByName: "CivicPulse AI",
      publicMessage: "Emergency alert triggered by sensor network. Dispatched priority alarms to BESCOM distribution safety line.",
      createdAt: new Date().toISOString()
    });
    loadData();
    window.dispatchEvent(new Event("civiclens_data_changed"));
    addTerminalLog("Sensor Alert: Transmitted inductive wire snap and terminal blackout alarms to BESCOM security dispatch.");
  };

  if (!isSigned) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center bg-theme-main text-theme-main font-sans">
        <div className="bg-theme-secondary border border-theme-main p-8 rounded-3xl shadow-theme-main relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500"></div>
          
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Lock className="w-8 h-8 text-rose-400 animate-pulse" />
          </div>

          <h2 className="text-xl font-bold font-sans tracking-tight text-theme-main mb-2 uppercase">
            {language === "en" ? "Moderation Desk Locked" : "मॉडरेशन डेस्क लॉक्ड है"}
          </h2>
          
          <p className="text-xs text-theme-secondary leading-relaxed mb-6 font-mono">
            {language === "en" 
              ? "This control room houses sensitive contractor dispatches, forensic Before-and-After photo certifiers, and escalation panels. Please authenticate under municipal credentials to view." 
              : "इस नियंत्रण कक्ष में संवेदनशील ठेकेदार प्रेषण, फॉरेंसिक पहले-और-बाद के फोटो प्रमाणितकर्ता और वृद्धि पैनल हैं। देखने के लिए क्रेडेंशियल्स के तहत प्रमाणित करें।"}
          </p>

          <button
            onClick={() => onNavigate("auth")}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase font-mono border-0"
          >
            <span>Access Administrator Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center bg-theme-main text-theme-main font-sans">
        <div className="bg-theme-secondary border border-theme-main p-8 rounded-3xl shadow-theme-main relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-cyan-500"></div>
          
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Shield className="w-8 h-8 text-amber-400" />
          </div>

          <h2 className="text-xl font-bold font-sans tracking-tight text-theme-main mb-2 uppercase">
            {language === "en" ? "Administrator Clearance Required" : "प्रशासक अनुमति आवश्यक है"}
          </h2>
          
          <p className="text-xs text-theme-secondary leading-relaxed mb-6 font-mono">
            {language === "en" 
              ? "Your current active profile is mapped as a Citizen. The dispatch moderation desk, department queues, and live duplicate override blocks are restricted to Municipal Field Inspectors." 
              : "आपका वर्तमान सक्रिय प्रोफ़ाइल नागरिक के रूप में मैप किया गया है। प्रेषण मॉडरेशन डेस्क, विभाग कतार और लाइव ओवरराइड ब्लॉक नगरपालिका फील्ड निरीक्षकों तक ही सीमित हैं।"}
          </p>

          <div className="p-3 bg-[#0D1B2A]/75 rounded-xl border border-slate-850 text-left mb-6 font-sans">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 text-center font-bold">Recommended Test Action</p>
            <p className="text-[11px] text-[#A5BBCE] text-center leading-normal">
              Go to the <span className="font-bold text-white">Sign In Portal</span>, click on the <span className="font-bold text-[#FFB547]">Inspector/Admin Quick Login</span> template card (Rajesh Kumar), and enjoy full dispatch authority.
            </p>
          </div>

          <button
            onClick={() => onNavigate("auth")}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase font-mono border-0"
          >
            <span>Switch to Admin Profile</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Filter queue for issues
  const filteredQueue = issues.filter((item) => {
    const matchesDept = selectedDeptFilter === "all" || item.assignedDepartment === selectedDeptFilter;
    const matchesSev = selectedSeverityFilter === "all" || item.severity === selectedSeverityFilter;
    return matchesDept && matchesSev;
  });

  const moderatorUsers = (Object.values(allUsers) as User[]).filter(
    (u: User) => u.role === "admin" && (u.pendingApproval || u.approved || u.denied)
  );

  const pendingModerators = moderatorUsers.filter((u: User) => u.pendingApproval);

  // Search citizen users
  const citizenUsers = (Object.values(allUsers) as User[]).filter((u: User) => u.role === "citizen");
  const filteredCitizens = citizenUsers.filter(u => 
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Rapid Quick status assigning for Demo Mode
  const handleQuickAssignDepartment = (issueId: string, dept: string) => {
    dbService.adminUpdateIssue(
      issueId,
      { status: IssueStatus.ASSIGNED, assignedDepartment: dept },
      `Ticket registered at municipal command center logs. Dispatched: ${dept}.`
    );
    loadData();
    addTerminalLog(`Dispatched ticket ${issueId.substring(0, 7)} to ${dept}.`);
  };

  // KPI calculations for Analytics bento
  const totalTickets = issues.length;
  const resolvedTicketsCount = issues.filter(x => x.status === IssueStatus.RESOLVED).length;
  const activeIncidentsCount = issues.filter(x => x.status !== IssueStatus.RESOLVED && x.status !== IssueStatus.REJECTED).length;
  const slaCompliancePercent = totalTickets > 0 ? Math.round(((resolvedTicketsCount + issues.filter(x => x.status === IssueStatus.IN_PROGRESS).length * 0.4) / totalTickets) * 100) : 100;

  // Status columns array for Kanban
  const kanbanColumns = [
    {
      id: "col_new",
      title: "New Incoming Reports",
      colorTag: "bg-amber-500/20 text-[#FFB547] border-[#FFB547]/30",
      statuses: [IssueStatus.NEW, IssueStatus.REOPENED]
    },
    {
      id: "col_verified",
      title: "Community Verified Audits",
      colorTag: "bg-blue-500/20 text-[#21D4FD] border-[#21D4FD]/30",
      statuses: [IssueStatus.VERIFIED]
    },
    {
      id: "col_assigned",
      title: "Crews Active on Site",
      colorTag: "bg-[#00DFFF]/20 text-[#00DFFF] border-[#00DFFF]/30",
      statuses: [IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS]
    },
    {
      id: "col_resolved",
      title: "Forensically Solved",
      colorTag: "bg-emerald-500/20 text-[#34D399] border-emerald-500/30",
      statuses: [IssueStatus.RESOLVED]
    }
  ];

  // Tab definitions
  const adminTabs = [
    { id: "kanban", name: "Kanban Dispatcher", icon: Layers, color: "text-[#21D4FD]" },
    { id: "list", name: "Ledger Directory", icon: ListFilter, color: "text-[#00FFFF]" },
    { id: "users", name: "Citizens & Trust Index", icon: Users, color: "text-[#FFB547]" },
    { id: "submissions", name: "Submissions & Subscribers", icon: FileText, color: "text-cyan-400" },
    { id: "testimonials_mod", name: "Testimonials Moderator", icon: Star, color: "text-[#FFB547]" },
    { id: "moderators", name: "Moderator Clearances", icon: Shield, color: "text-pink-400", badgeCount: pendingModerators.length },
    { id: "announcements", name: "Announcements Control", icon: Megaphone, color: "text-amber-400" },
    { id: "analytics", name: "KPI & Command Analytics", icon: TrendingUp, color: "text-[#34D399]" },
    { id: "audit", name: "Audit Security Logs", icon: ShieldAlert, color: "text-red-400" },
    { id: "backup_control", name: "Roles & Backup Control", icon: ShieldAlert, color: "text-rose-400" }
  ];

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-6 text-left bg-theme-main text-theme-main font-sans pb-24 relative min-h-screen">
      
      {/* 1. COMPREHENSIVE RESPONSIVE SUB-DECK (SIDEBAR DRAWER ON MOBILE, FLUID GRIDS) */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* SIDE BAR VIEW: COLLAPSIBLE HAMBURGER CONTROLLER */}
        {/* Toggle Hamburger Button for Mobile Viewports */}
        <div className="flex items-center justify-between w-full lg:hidden border-b border-slate-850 pb-4 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1 px-1.5 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono leading-none font-bold uppercase shrink-0">L2 Admin</span>
            <h2 className="text-sm font-black text-theme-main font-sans uppercase tracking-tight truncate leading-none">Command Center</h2>
          </div>
          <button 
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className="p-2 border border-theme-main bg-theme-secondary text-theme-main rounded-xl focus:outline-none cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Menu className="w-4 h-4 text-[#21D4FD]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Select Deck Panel</span>
          </button>
        </div>

        {/* Mobile slide-out drawer or overlay backdrop */}
        {isMobileDrawerOpen && (
          <div 
            className="fixed inset-0 bg-theme-main/80 backdrop-blur-sm z-50 lg:hidden flex justify-start justify-items-start"
            onClick={() => setIsMobileDrawerOpen(false)}
          >
            <div 
              className="w-72 bg-theme-secondary border-r border-theme-main h-full p-5 flex flex-col justify-between shrink-0 hover:shadow-2xl transition animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-mono text-[9px] text-[#A5BBCE] font-bold uppercase tracking-widest">Dashboard Modules</span>
                  <button 
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-1 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {adminTabs.map((tab) => {
                    const IconComp = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          setIsMobileDrawerOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition-all ${
                          isActive 
                            ? "bg-slate-800 border border-slate-700 text-white" 
                            : "text-slate-400 border border-transparent hover:bg-slate-900/40 hover:text-white"
                        }`}
                      >
                        <IconComp className={`w-4 h-4 shrink-0 ${tab.color}`} />
                        <span className="flex-1 truncate">{tab.name}</span>
                        {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                          <span className="bg-rose-500 text-white text-[9px] font-mono font-bold shrink-0 px-1.5 py-0.5 rounded-full leading-none pr-1">
                            {tab.badgeCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3.5 bg-[#0D1B2A]/90 border border-slate-850 rounded-2xl">
                <p className="text-[9px] font-mono font-bold text-slate-500 uppercase">Telemetry Triggers:</p>
                <div className="mt-2.5 space-y-1.5">
                  <button 
                    onClick={handleInjectRainfallEmergency}
                    className="w-full py-1 text-center bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-400 text-[9px] font-mono font-extrabold uppercase rounded-lg transition"
                  >
                    Trigger Flood Emergency
                  </button>
                  <button 
                    onClick={handleInjectPowerGridShutdown}
                    className="w-full py-1 text-center bg-amber-950 hover:bg-amber-900 border border-amber-800 text-[#FFB547] text-[9px] font-mono font-extrabold uppercase rounded-lg transition"
                  >
                    Trigger Grid Blackout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Persistent Left Desktop Control Deck */}
        <aside className="hidden lg:flex w-72 shrink-0 flex-col justify-between bg-[#122338]/90 border border-slate-800 rounded-2xl p-5 h-[calc(100vh-140px)] sticky top-24 select-none self-start overflow-y-auto pr-1">
          <div className="space-y-6">
            <div className="border-b border-slate-850 pb-3">
              <span className="text-[10px] font-mono bg-emerald-950 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Access Level 2 Dispatcher
              </span>
              <h2 className="text-base font-black text-white font-sans uppercase tracking-wider mt-2">Deck Control Room</h2>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Toggle dashboard scopes and trigger real-time telemetry inputs.</p>
            </div>

            <div className="space-y-1.5">
              {adminTabs.map((tab) => {
                const IconComp = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full p-3 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all ${
                      isActive 
                        ? "bg-slate-800 border border-slate-700 text-white shadow-md shadow-slate-900/40" 
                        : "text-slate-400 border border-transparent hover:bg-slate-900/20 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComp className={`w-4 h-4 shrink-0 ${tab.color}`} />
                      <span>{tab.name}</span>
                    </div>
                    {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                      <span className="bg-rose-500 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {tab.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-[#0D1B2A]/90 border border-slate-850 rounded-2xl">
            <p className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none mb-2 text-center">Telemetry Incident Triggers</p>
            <p className="text-[9px] text-[#9FB2C8] leading-normal text-center mb-3 italic">Dispatch automated alerts to route incidents to respective utility lines.</p>
            <div className="space-y-2">
              <button 
                onClick={handleInjectRainfallEmergency}
                className="w-full py-2 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-900/60 hover:border-blue-500 text-blue-400 text-[10px] font-mono font-black uppercase rounded-xl transition cursor-pointer"
              >
                Trigger Rainfall PWD Alert
              </button>
              <button 
                onClick={handleInjectPowerGridShutdown}
                className="w-full py-2 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-900/60 hover:border-amber-500 text-[#FFB547] text-[10px] font-mono font-black uppercase rounded-xl transition cursor-pointer"
              >
                Trigger Grid wire snap
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN COMPARTMENT DECK AREA */}
        <main className="flex-1 min-w-0">
          
          {/* HEADER TITLE FOR MAIN TAB */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                {activeTab === "kanban" && "Kanban Dispatch Queue"}
                {activeTab === "list" && "Municipal Incident Ledger"}
                {activeTab === "users" && "Citizen Trust & Verified gamification"}
                {activeTab === "moderators" && "Pending Moderator Registrar"}
                {activeTab === "announcements" && "Dynamic System Announcements"}
                {activeTab === "analytics" && "Urban Performance KPI Command"}
                {activeTab === "audit" && "Security & Operations Audit Ledger"}
              </h1>
              <p className="text-xs text-[#9FB2C8] mt-0.5">
                {activeTab === "kanban" && "Audit active reports, verify duplicate groupings, and dispatch crews instantly."}
                {activeTab === "list" && "Search, sort, filter and execute real CSV data warehouse exports."}
                {activeTab === "users" && "Calibrate citizen validation scores, reward premium badges, or mute reporting privileges."}
                {activeTab === "moderators" && "Review pending moderator registrations and toggle active officer security authorizations."}
                {activeTab === "announcements" && "Publish, filter, and manage municipal bulletin notices visible to all citizens."}
                {activeTab === "analytics" && "Observe dynamic SLA compliance ratings, ticket categories, and live telemetry daemon feeds."}
                {activeTab === "audit" && "Inspect immutable database logs, privilege escalations, and administrative overrides."}
              </p>
            </div>

            {/* Quick Export Button specifically in list view */}
            {activeTab === "list" && (
              <button
                onClick={handleExportCSV}
                className="py-2 px-4 bg-gradient-to-r from-cyan-500 to-teal-500 hover:opacity-95 text-[#07111F] font-bold text-xs font-mono uppercase rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border-0"
              >
                <Download className="w-4 h-4" />
                <span>Export to CSV Spreadsheet</span>
              </button>
            )}
          </div>

          {/* DYNAMIC LAYOUT BASED ON TABS */}

          {/* TAB 1: KANBAN DISPATCHER (existing logic enhanced with smooth wraps) */}
          {activeTab === "kanban" && (
            <div className="space-y-6">
              {/* LIVE SEVERE QUERIES FILTER */}
              <div className="bg-[#122338] border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-500 block font-bold">Department filter</label>
                    <select
                      value={selectedDeptFilter}
                      onChange={(e) => setSelectedDeptFilter(e.target.value)}
                      className="mt-1.5 p-2 bg-[#0D1B2A] border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-[#21D4FD]"
                    >
                      <option value="all">All Departments</option>
                      {dbService.getDepartments().map(d => (
                        <option key={d.id} value={d.name}>{d.name.split(" ")[0]} ({d.contact})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-500 block font-bold">Risk priority filter</label>
                    <select
                      value={selectedSeverityFilter}
                      onChange={(e) => setSelectedSeverityFilter(e.target.value)}
                      className="mt-1.5 p-2 bg-[#0D1B2A] border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none"
                    >
                      <option value="all">All risk levels</option>
                      <option value="low">Low safety risk</option>
                      <option value="medium">Medium</option>
                      <option value="high">High priority</option>
                      <option value="critical">Critical (Immediate dispatcher)</option>
                    </select>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-[#9FB2C8] bg-[#0d1b2a] px-3.5 py-1.5 rounded-xl border border-slate-850 md:self-end">
                  Filtered Queue: <span className="font-bold text-white font-mono">{filteredQueue.length}</span> tickets
                </div>
              </div>

              <KanbanBoard
                filteredQueue={filteredQueue}
                kanbanColumns={kanbanColumns}
                onCardClick={(id) => onNavigate(`issue/${id}`)}
                showAddress={true}
                splitCategory={true}
                renderCardActions={(item) => {
                  if (item.status !== IssueStatus.NEW) return null;
                  // Route to correct department based on category
                  const deptMap: Record<string, string> = {
                    "Roads & Traffic": "Public Works & Highways (PWD)",
                    "Water & Sanitation": "Water Supply & Sewerage Board (BWSSB)",
                    "Solid Waste Management": "Municipal Solid Waste (SWM)",
                    "Public Utilities": "Electricity Distribution (BESCOM)",
                    "Environment & Safety": "Horticulture & Parks Department",
                    "Public Spaces": "Horticulture & Parks Department",
                  };
                  const targetDept = deptMap[item.category] || item.assignedDepartment || "Public Works & Highways (PWD)";
                  const shortDept = targetDept.match(/\(([^)]+)\)/)?.[1] || targetDept.split(" ")[0];
                  return (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAssignDepartment(item.id, targetDept);
                      }}
                      className="px-2 py-1 bg-[#21D4FD] leading-none text-[#07111F] text-[9px] font-mono font-bold rounded hover:opacity-95 cursor-pointer flex items-center gap-1 transition-all border-0 shadow-sm"
                    >
                      <span>Dispatch {shortDept}</span>
                      <ChevronRight className="w-2.5 h-2.5 text-[#07111F]" />
                    </button>
                  );
                }}
              />
            </div>
          )}

          {/* TAB 2: GRID INCIDENT LEDGER (Spreadsheet Database compliant) */}
          {activeTab === "list" && (
            <div className="space-y-6">
              {/* FILTERS AND QUEUE SEARCH */}
              <div className="bg-[#122338] border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-500 block font-bold">Category department</label>
                    <select
                      value={selectedDeptFilter}
                      onChange={(e) => setSelectedDeptFilter(e.target.value)}
                      className="mt-1.5 p-2 bg-[#0D1B2A] border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none"
                    >
                      <option value="all">All departments</option>
                      {dbService.getDepartments().map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-500 block font-bold">Severity level</label>
                    <select
                      value={selectedSeverityFilter}
                      onChange={(e) => setSelectedSeverityFilter(e.target.value)}
                      className="mt-1.5 p-2 bg-[#0D1B2A] border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none"
                    >
                      <option value="all">All severity grades</option>
                      <option value="low">Low Safety Risk</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Hazard</option>
                      <option value="critical">Critical Immediate Response</option>
                    </select>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-[#9FB2C8] bg-[#0d1b2a] px-3.5 py-1.5 rounded-xl border border-slate-850">
                  Spreadsheet entries count: <span className="font-bold text-white leading-none">{filteredQueue.length}</span> items
                </div>
              </div>

              {/* SPREADSHEET LIST SINK GRID */}
              <div className="bg-[#122338] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto w-full">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#0D1B2A]/70 text-slate-500 font-mono text-[10px] uppercase text-left border-b border-slate-800">
                        <th className="p-4 font-bold">Ticket ID</th>
                        <th className="p-4 font-bold">Report Title</th>
                        <th className="p-4 font-bold">Category</th>
                        <th className="p-4 font-bold">Urgency Score</th>
                        <th className="p-4 font-bold">Dispatch Department</th>
                        <th className="p-4 font-bold">SLA State</th>
                        <th className="p-4 font-bold text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-855 text-xs">
                      {filteredQueue.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => onNavigate(`issue/${item.id}`)}
                          className="hover:bg-slate-800/40 cursor-pointer transition"
                        >
                          <td className="p-4 font-mono font-bold text-slate-400">{item.id}</td>
                          <td className="p-4 font-bold text-white max-w-xs truncate">{item.title}</td>
                          <td className="p-4 text-slate-300 font-mono">{item.category}</td>
                          <td className="p-4">
                            <span className={`bg-slate-900 border px-2.5 py-1 text-[10px] font-mono font-bold rounded ${
                              item.severity === IssueSeverity.CRITICAL ? "border-red-500/30 text-red-400" : "border-slate-800 text-[#FFB547]"
                            }`}>
                              {Math.round(item.priorityScore)} PTS
                            </span>
                          </td>
                          <td className="p-4 text-slate-400 font-sans italic">{item.assignedDepartment}</td>
                          <td className="p-4 uppercase">
                            <span className={`px-2 py-0.5 border rounded text-[9px] font-mono font-bold leading-none ${
                              item.status === IssueStatus.RESOLVED 
                                ? "bg-emerald-500/10 border-emerald-500/15 text-emerald-400" 
                                : item.status === IssueStatus.REJECTED 
                                ? "bg-red-500/10 border-red-500/15 text-red-500"
                                : "bg-orange-500/20 border-orange-500/30 text-orange-400 animate-pulse"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => onNavigate(`issue/${item.id}`)}
                              className="p-1.5 border border-slate-800 bg-[#0d1b2a] rounded-lg hover:border-[#21D4FD] hover:text-[#21D4FD] transition cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-slate-400 hover:text-white" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CITIZEN REGISTRY & TRUST MANAGER (100% NEW PROPER WORKING FEATURE) */}
          {activeTab === "users" && (
            <div className="space-y-6">
              {/* MONTHLY REWARDS TOOLCARD */}
              <div className="bg-gradient-to-tr from-[#122338] to-[#1a365d] border border-[#FFB547]/30 p-5 rounded-2xl shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="absolute -right-16 -top-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl"></div>
                <div className="flex gap-4 items-start select-none">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Monthly Leaderboard Reward System</h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                      Award bonus points to the top 3 citizens on the leaderboard at the end of the month.
                      1st place gets <span className="font-bold text-amber-400 font-mono">+150 PTS</span>, 
                      2nd place gets <span className="font-bold text-slate-300 font-mono">+100 PTS</span>, and 
                      3rd place gets <span className="font-bold text-amber-600 font-mono">+50 PTS</span>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const citizens = Object.values(dbService.getUsers()).filter(u => u.role === "citizen");
                    const sorted = [...citizens].sort((a, b) => b.civicScore - a.civicScore);
                    if (sorted.length === 0) {
                      alert("No registered citizens found to reward.");
                      return;
                    }
                    const top1 = sorted[0];
                    const top2 = sorted[1];
                    const top3 = sorted[2];

                    if (top1) dbService.updateUserScore(top1.id, 150, "Monthly Leaderboard 1st Place Champion Reward!");
                    if (top2) dbService.updateUserScore(top2.id, 100, "Monthly Leaderboard 2nd Place Runner-up Reward!");
                    if (top3) dbService.updateUserScore(top3.id, 50, "Monthly Leaderboard 3rd Place Honor Reward!");

                    // Save Audit Log
                    dbService.saveAuditLog({
                      id: "al_monthly_rewards_" + Date.now(),
                      issueId: "system",
                      action: "Distribute Leaderboard Rewards",
                      performedBy: currentUser.id,
                      performedByName: currentUser.name,
                      metadata: {
                        firstPlace: top1 ? `${top1.name} (${top1.id})` : "N/A",
                        secondPlace: top2 ? `${top2.name} (${top2.id})` : "N/A",
                        thirdPlace: top3 ? `${top3.name} (${top3.id})` : "N/A"
                      },
                      createdAt: new Date().toISOString()
                    });

                    // Trigger alert/notification
                    let successMsg = `Monthly Leaderboard Rewards successfully processed and distributed:\n`;
                    if (top1) successMsg += `🥇 1st: ${top1.name} (+150 PTS)\n`;
                    if (top2) successMsg += `🥈 2nd: ${top2.name} (+100 PTS)\n`;
                    if (top3) successMsg += `🥉 3rd: ${top3.name} (+50 PTS)\n`;
                    alert(successMsg);

                    // Add log to terminal
                    addTerminalLog(`Distributed monthly rewards: 1st ${top1?.name || "N/A"} (+150), 2nd ${top2?.name || "N/A"} (+100), 3rd ${top3?.name || "N/A"} (+50).`);
                    
                    loadData();
                    window.dispatchEvent(new Event("civiclens_data_changed"));
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:opacity-95 text-slate-950 font-extrabold text-xs tracking-wider rounded-xl shadow-md border-0 transition duration-200 cursor-pointer shrink-0 uppercase font-mono"
                >
                  Distribute Rewards
                </button>
              </div>

              {/* SEARCH BOX */}
              <div className="bg-[#122338] border border-slate-800 p-4 rounded-2xl">
                <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-2">Search Citizen accounts</label>
                <input
                  type="text"
                  placeholder="Filter by name, email or ID..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full p-2.5 bg-[#0D1B2A] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FFB547]"
                />
              </div>

              {/* LIST OF REGISTERED CITIZENS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCitizens.map((user) => {
                  const isBlocked = (user as any).blocked === true;
                  return (
                    <div 
                      key={user.id} 
                      className={`p-5 bg-[#122338] border rounded-2xl flex flex-col justify-between hover:border-slate-700 transition relative overflow-hidden ${
                        isBlocked ? "border-red-900/40 bg-red-950/5" : "border-slate-800"
                      }`}
                    >
                      {/* Suspended Red Banner */}
                      {isBlocked && (
                        <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-mono font-bold uppercase px-3 py-0.5 rounded-bl">
                          Muted / Suspended
                        </div>
                      )}

                      <div>
                        {/* Avatar Info */}
                        <div className="flex items-center gap-3.5 mb-4">
                          <img src={user.avatar} className="w-12 h-12 rounded-2xl object-cover border border-slate-800 bg-[#0d1b2a]" alt={user.name} />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-black text-white uppercase">{user.name}</h4>
                              <span className="text-[8px] font-mono text-slate-500 bg-slate-900 px-1 py-0.5 rounded uppercase leading-none">{user.id}</span>
                            </div>
                            <p className="text-[11.5px] text-slate-400 font-mono mt-0.5">{user.email}</p>
                          </div>
                        </div>

                        {/* Gamified stats bar */}
                        <div className="grid grid-cols-2 gap-3 p-3 bg-[#0D1B2A]/90 border border-slate-850 rounded-xl mb-4 text-xs font-mono">
                          <div className="text-left">
                            <span className="text-[9px] text-slate-500 font-bold block uppercase">Civic Score Balance</span>
                            <span className="text-sm font-bold text-[#FFB547] pr-1">{user.civicScore} PTS</span>
                            <span className="text-[9px] text-slate-500">({user.badges.length} badges)</span>
                          </div>
                          <div className="text-left border-l border-slate-800 pl-3">
                            <span className="text-[9px] text-slate-500 font-bold block uppercase">Trust Score</span>
                            <span className={`text-sm font-black ${
                              user.trustScore >= 80 ? "text-emerald-400" : user.trustScore >= 50 ? "text-[#FFB547]" : "text-red-400"
                            }`}>{user.trustScore}%</span>
                            <span className="text-[9px] text-slate-500 block uppercase">Index rating</span>
                          </div>
                        </div>

                        {/* Trust slider component */}
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-slate-400 uppercase font-black">Calibrate Trust Index:</span>
                            <span className="text-white font-bold leading-none">{user.trustScore}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={user.trustScore}
                            onChange={(e) => handleModifyUserTrust(user.id, parseInt(e.target.value))}
                            className="w-full accent-[#FFB547] h-1.5 bg-slate-900 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Badges badges tag selection */}
                        <div className="mb-4 space-y-1.5 text-left">
                          <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-wider block">Admin Badges panel:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {["First Reporter", "Neighborhood Guardian", "Community Verifier", "Resolution Champion"].map(badge => {
                              const userHas = user.badges.includes(badge);
                              return (
                                <button
                                  key={badge}
                                  onClick={() => handleToggleUserBadge(user.id, badge)}
                                  className={`px-2 py-1 text-[9px] font-mono font-bold rounded-lg border transition ${
                                    userHas 
                                      ? "bg-slate-800 text-[#FFB547] border-[#FFB547]/45" 
                                      : "bg-transparent text-slate-500 border-slate-800 hover:border-slate-700"
                                  }`}
                                >
                                  {userHas ? "★ " : "☆ "}{badge.split(" ")[0]}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons (Mute/Point modifiers) */}
                      <div className="pt-3 border-t border-slate-850 flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-1 font-mono">
                          <button
                            onClick={() => handleAdjustUserCivicPoints(user.id, -25)}
                            className="p-1 px-2 border border-slate-800 bg-[#0d1b2a] hover:bg-slate-900 text-red-400 hover:text-red-500 rounded text-[10px] transition cursor-pointer font-bold leading-none"
                            title="Deduct -25 Civic Points"
                          >
                            -25 PTS
                          </button>
                          <button
                            onClick={() => handleAdjustUserCivicPoints(user.id, 50)}
                            className="p-1 px-2 border border-slate-800 bg-[#0d1b2a] hover:bg-slate-900 text-emerald-400 hover:text-emerald-500 rounded text-[10px] transition cursor-pointer font-bold leading-none"
                            title="Award +50 Civic Points"
                          >
                            +50 PTS
                          </button>
                        </div>

                        <button
                          onClick={() => handleToggleUserReportingMute(user.id)}
                          className={`p-1.5 rounded-xl text-[9px] font-mono font-extrabold uppercase flex items-center gap-1.5 transition cursor-pointer border ${
                            isBlocked 
                              ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-400 hover:bg-emerald-900" 
                              : "bg-red-950/40 border-red-500/20 text-red-400 hover:bg-red-900"
                          }`}
                        >
                          {isBlocked ? <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <UserX className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                          <span>{isBlocked ? "Unmute Reporting" : "Mute Reporting"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: MODERATORS (approved/pending registration queues list) */}
          {activeTab === "moderators" && (
            <div className="space-y-6">
              <div className="bg-[#122338] border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-[#21D4FD]" />
                  <h3 className="font-sans font-bold text-sm sm:text-base text-white uppercase tracking-wider">
                    Pending Moderator Registrations ({pendingModerators.length})
                  </h3>
                </div>

                {pendingModerators.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 italic bg-slate-900/10 border border-dashed border-slate-850 rounded-xl">
                    No pending moderator clearances at this moment.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingModerators.map((user) => (
                      <div key={user.id} className="p-4 bg-[#0D1B2A] border border-slate-850 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition">
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover border border-slate-800" alt="" />
                            <div>
                              <h4 className="text-xs font-bold text-white uppercase">{user.name}</h4>
                              <p className="text-[10px] text-slate-400 font-mono">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-[9px] font-mono uppercase bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded">
                              ROLE: MODERATOR CANDIDATE
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">
                              Applied: {new Date(user.joinedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 font-mono mt-2">
                          <button
                            onClick={() => handleDenyModerator(user.id)}
                            className="py-1.5 bg-red-900/20 hover:bg-red-900/30 text-red-500 hover:text-red-400 font-extrabold text-[10px] uppercase tracking-wider rounded-xl border border-red-500/20 transition cursor-pointer"
                          >
                            Deny / Reject
                          </button>
                          <button
                            onClick={() => handleApproveModerator(user.id)}
                            className="py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer border-0"
                          >
                            Approve Clearance
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#122338] border border-slate-800 p-5 rounded-2xl">
                <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-400 uppercase tracking-wider mb-4">
                  Authorized Municipal Officers Directory ({moderatorUsers.filter(u => !u.pendingApproval).length})
                </h3>

                <div className="overflow-x-auto w-full rounded-xl border border-slate-850">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#0D1B2A]/70 text-slate-500 font-mono text-[9px] uppercase text-left border-b border-slate-800">
                        <th className="p-3 font-bold">Officer Profile</th>
                        <th className="p-3 font-bold">Municipal Scope email</th>
                        <th className="p-3 font-bold">Clearance Recorded</th>
                        <th className="p-3 font-bold text-right">Access status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-[11px]">
                      {moderatorUsers.filter(u => !u.pendingApproval).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-500 italic font-mono">No approved moderator directory listing found.</td>
                        </tr>
                      ) : (
                        moderatorUsers.filter(u => !u.pendingApproval).map((mod) => (
                          <tr key={mod.id} className="hover:bg-slate-800/20 transition">
                            <td className="p-3 font-bold text-white flex items-center gap-2">
                              <img src={mod.avatar} className="w-6 h-6 rounded-lg object-cover" alt="" />
                              <span>{mod.name}</span>
                            </td>
                            <td className="p-3 text-slate-400 font-mono">{mod.email}</td>
                            <td className="p-3 text-slate-500 font-mono">{new Date(mod.joinedAt).toLocaleDateString()}</td>
                            <td className="p-3 text-right uppercase">
                              <button
                                onClick={() => {
                                  if (mod.denied) {
                                    handleApproveModerator(mod.id);
                                  } else {
                                    handleDenyModerator(mod.id);
                                  }
                                }}
                                className={`px-2 py-0.5 border rounded text-[9px] font-mono leading-none font-bold cursor-pointer transition ${
                                  mod.denied
                                    ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-emerald-950/20"
                                    : "bg-emerald-500/10 border-emerald-500/15 text-emerald-400 hover:bg-red-950/20"
                                }`}
                              >
                                {mod.denied ? "Revoked (Click Approve)" : "Active (Click Revoke)"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Live KPI & Command Analytics (BENTO DESIGN WITH REAL DATA-SVG METERS) */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              
              {/* Core KPI metrics row */}
              <AnalyticsBento
                totalTickets={totalTickets}
                resolvedTicketsCount={resolvedTicketsCount}
                activeIncidentsCount={activeIncidentsCount}
                slaCompliancePercent={slaCompliancePercent}
              />

              {/* BENTO ANALYTIC CARDS GRID (CUSTOM PURE SVG SECTIONS WITH ZERO EXTERNAL CRASH RISKS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Visual Category distribution SVG chart */}
                <div className="p-5 bg-[#122338] border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-[#21D4FD]" />
                    <h3 className="text-xs sm:text-sm font-bold text-white uppercase font-sans tracking-wide">Incidents category ledger</h3>
                  </div>

                  {/* Pure bar chart rendering */}
                  <div className="space-y-4">
                    {["Roads & Traffic", "Water & Sanitation", "Public Utilities", "Solid Waste Management", "Environment & Safety"].map((category) => {
                      const count = issues.filter(x => x.category === category).length;
                      const maxCount = Math.max(...["Roads & Traffic", "Water & Sanitation", "Public Utilities", "Solid Waste Management", "Environment & Safety"].map(c => issues.filter(x => x.category === c).length), 1);
                      const widthPct = Math.round((count / maxCount) * 100);
                      
                      return (
                        <div key={category} className="space-y-1.5 text-xs text-left">
                          <div className="flex justify-between font-mono text-[10px] text-slate-400">
                            <span>{category}</span>
                            <span className="font-bold text-white">{count} tickets</span>
                          </div>
                          <div className="w-full bg-slate-900/60 h-2.5 rounded-lg border border-slate-850 overflow-hidden relative">
                            <div 
                              className="bg-gradient-to-r from-[#21D4FD] to-[#00FFFF] h-full rounded-lg transition-all duration-500" 
                              style={{ width: `${widthPct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Realtime System Terminal Console */}
                <TerminalLogFeed
                  logs={systemLogs}
                  title="Live Command Ticker Console"
                  subtitle="Decentralized logs documenting civic evaluations, duplications, and clearances."
                />
              </div>

              {/* LIVE UNRESOLVED DEPARTMENT EFFICIENCY SLA SCORING */}
              <div className="bg-[#122338] border border-slate-800 p-5 rounded-2xl text-left">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-[#FFB547]" />
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase font-sans tracking-wide">Dispatch efficiency dashboard by departments</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                  {(() => {
                    const deptConfigs = [
                      { dept: "Public Works (PWD)", icon: Landmark, keyword: "PWD" },
                      { dept: "Water Sanitation (BWSSB)", icon: Activity, keyword: "BWSSB" },
                      { dept: "Electricity (BESCOM)", icon: AlertCircle, keyword: "BESCOM" },
                    ];
                    return deptConfigs.map(cfg => {
                      const deptIssues = issues.filter(x => x.assignedDepartment.includes(cfg.keyword));
                      const resolved = deptIssues.filter(x => x.status === IssueStatus.RESOLVED);
                      const active = deptIssues.filter(x => x.status !== IssueStatus.RESOLVED).length;
                      const efficiency = deptIssues.length > 0
                        ? `${Math.round((resolved.length / deptIssues.length) * 100)}%`
                        : "N/A";
                      const avgSpeed = (() => {
                        const withTime = resolved.filter(r => r.resolvedAt);
                        if (withTime.length === 0) return "N/A";
                        const totalHrs = withTime.reduce((s, r) => s + Math.max(0, new Date(r.resolvedAt!).getTime() - new Date(r.createdAt).getTime()) / (1000*60*60), 0);
                        return `${(totalHrs / withTime.length).toFixed(1)} hrs`;
                      })();
                      return { dept: cfg.dept, icon: cfg.icon, efficiency, speed: avgSpeed, active };
                    }).map((deptObj) => {
                    const DeptIcon = deptObj.icon;
                    return (
                      <div key={deptObj.dept} className="p-4 bg-[#0d1b2a] border border-slate-850 rounded-xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-bold text-white truncate max-w-[180px]">{deptObj.dept}</span>
                          <DeptIcon className="w-4 h-4 text-slate-500 shrink-0" />
                        </div>
                        <div className="space-y-1.5 text-xs text-left">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Dispatch Speed</span>
                            <span className="text-slate-200">{deptObj.speed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">SLA Resolution Rate</span>
                            <span className="text-emerald-400 font-bold">{deptObj.efficiency}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-800/80 pt-1.5 mt-1.5">
                            <span className="text-slate-400 uppercase font-black text-[9px]">Active incident queue</span>
                            <span className="text-[#FFB547] font-bold">{deptObj.active} Tickets</span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                  })()}
                </div>
              </div>

            </div>
          )}

          {activeTab === "audit" && (() => {
            const auditLogs = dbService.getAuditLogs();
            return (
              <div className="space-y-6">
                <div className="bg-[#122338] border border-slate-800 p-5 rounded-2xl">
                  <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-400 uppercase tracking-wider mb-4">
                    Security & Operations Audit Trail logs ({auditLogs.length})
                  </h3>

                  <div className="overflow-x-auto w-full rounded-xl border border-slate-850">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#0D1B2A]/70 text-slate-500 font-mono text-[9px] uppercase text-left border-b border-slate-800">
                          <th className="p-3 font-bold">Timestamp</th>
                          <th className="p-3 font-bold">Performed By</th>
                          <th className="p-3 font-bold">Action / Operation</th>
                          <th className="p-3 font-bold">Target Ticket</th>
                          <th className="p-3 font-bold">Metadata / Parameters</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-[11px]">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-500 italic font-mono">No security logs recorded in the ledger yet.</td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-800/20 transition">
                              <td className="p-3 text-slate-400 font-mono">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="p-3 font-bold text-white">
                                {log.performedByName} <span className="text-[9px] text-slate-500 font-mono font-normal">({log.performedBy.substring(0, 8)})</span>
                              </td>
                              <td className="p-3 text-slate-200 font-mono uppercase text-[10px]">
                                {log.action}
                              </td>
                              <td className="p-3">
                                <button
                                  onClick={() => onNavigate(`issue/${log.issueId}`)}
                                  className="text-cyan-400 hover:underline font-mono font-bold text-[10px] cursor-pointer bg-transparent border-0 p-0"
                                >
                                  {log.issueId}
                                </button>
                              </td>
                              <td className="p-3 text-slate-400 font-mono text-[10px] max-w-xs truncate" title={JSON.stringify(log.metadata)}>
                                {JSON.stringify(log.metadata)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 7: ANNOUNCEMENTS MANAGEMENT */}
          {activeTab === "announcements" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* CREATE ANNOUNCEMENT FORM */}
                <div className="xl:col-span-1 p-5 bg-[#122338] border border-slate-800 rounded-2xl text-left">
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                    <Megaphone className="w-5 h-5 text-amber-400" />
                    <h3 className="font-sans font-bold text-sm sm:text-base text-white uppercase tracking-wider">
                      Create Announcement
                    </h3>
                  </div>

                  <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold mb-1.5 font-sans">Announcement Title</label>
                      <input
                        type="text"
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                        placeholder="e.g. Planned BESCOM Outage Sarjapur"
                        className="w-full p-2.5 bg-[#0D1B2A] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-sans"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold mb-1.5">Category</label>
                      <select
                        value={annCategory}
                        onChange={(e) => setAnnCategory(e.target.value as any)}
                        className="w-full p-2.5 bg-[#0D1B2A] border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-amber-400"
                      >
                        <option value="info">Info (Blue)</option>
                        <option value="warning">Warning (Orange)</option>
                        <option value="success">Success (Green)</option>
                        <option value="alert">Alert (Red)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold mb-1.5">Assigned Department</label>
                      <select
                        value={annDept}
                        onChange={(e) => setAnnDept(e.target.value)}
                        className="w-full p-2.5 bg-[#0D1B2A] border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-amber-400"
                      >
                        {dbService.getDepartments().map(d => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                        <option value="Municipal Corporation">Municipal Corporation</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold mb-1.5">Content Description</label>
                      <textarea
                        value={annContent}
                        onChange={(e) => setAnnContent(e.target.value)}
                        placeholder="Detailed notice information for the citizens..."
                        rows={5}
                        className="w-full p-2.5 bg-[#0D1B2A] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-sans resize-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:opacity-95 text-slate-950 font-extrabold text-xs tracking-wider rounded-xl shadow-lg border-0 transition duration-200 cursor-pointer uppercase font-mono"
                    >
                      Publish Notice
                    </button>
                  </form>
                </div>

                {/* CURRENT ANNOUNCEMENTS LIST */}
                <div className="xl:col-span-2 p-5 bg-[#122338] border border-slate-800 rounded-2xl text-left">
                  <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-400 uppercase tracking-wider mb-4 font-sans">
                    Active Bulletins & Announcements ({announcements.length})
                  </h3>

                  <div className="space-y-4">
                    {announcements.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 italic bg-slate-900/10 border border-dashed border-slate-850 rounded-xl font-sans">
                        No active announcements published. Use the editor to submit a bulletin notice.
                      </div>
                    ) : (
                      announcements.map((ann) => {
                        const dateStr = new Date(ann.createdAt).toLocaleString();
                        const catColors = {
                          alert: "bg-red-500/10 border-red-500/20 text-red-400",
                          warning: "bg-amber-500/10 border-amber-500/20 text-[#FFB547]",
                          success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                          info: "bg-cyan-500/10 border-cyan-500/20 text-[#21D4FD]"
                        };
                        return (
                          <div 
                            key={ann.id} 
                            className="p-4 bg-[#0D1B2A] border border-slate-850 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2.5 mb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 border rounded text-[9px] font-mono font-bold leading-none uppercase ${catColors[ann.category as keyof typeof catColors] || catColors.info}`}>
                                  {ann.category}
                                </span>
                                <h4 className="text-xs font-bold text-white uppercase">{ann.title}</h4>
                              </div>
                              <span className="text-[9px] font-mono text-slate-500">{dateStr}</span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed font-sans mb-4">
                              {ann.content}
                            </p>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-850">
                              <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-slate-400">
                                <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded uppercase font-bold text-white">{ann.department}</span>
                                <span>Published by {ann.authorName}</span>
                              </div>

                              <button
                                onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                                className="py-1 px-3 bg-red-900/10 hover:bg-red-900/20 border border-red-500/20 text-red-400 hover:text-red-300 font-bold text-[9px] uppercase font-mono rounded-lg transition cursor-pointer"
                              >
                                Delete Banner
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: SUBMISSIONS & SUBSCRIBERS */}
          {activeTab === "submissions" && (
            <div className="space-y-6">
              <div className="bg-[#122338] border border-slate-800 p-5 rounded-2xl text-left space-y-6">
                {loadingSubmissions ? (
                  <div className="p-8 text-center text-xs text-slate-500 italic">Loading submissions and tickets...</div>
                ) : (
                  <div className="space-y-6">
                    {/* Support Tickets Section */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 font-mono">
                        Support Tickets ({submissions.supportTickets?.length || 0})
                      </h4>
                      
                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        {/* Left Side: Ticket Grid Table (Col span 7) */}
                        <div className="xl:col-span-7 overflow-x-auto rounded-xl border border-slate-850 bg-slate-900/10">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-[#0D1B2A]/70 text-slate-500 font-mono text-[9px] uppercase text-left border-b border-slate-800">
                                <th className="p-3 font-bold">Ticket</th>
                                <th className="p-3 font-bold">Subject</th>
                                <th className="p-3 font-bold">Status</th>
                                <th className="p-3 font-bold text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-855 text-xs">
                              {(!submissions.supportTickets || submissions.supportTickets.length === 0) ? (
                                <tr>
                                  <td colSpan={4} className="p-4 text-center text-slate-500 italic font-mono">No support tickets found.</td>
                                </tr>
                              ) : (
                                submissions.supportTickets.map((tkt: any) => {
                                  return (
                                    <tr key={tkt.id} className={`hover:bg-slate-800/10 transition ${
                                      activeSupportTicketId === tkt.id ? "bg-cyan-950/20" : ""
                                    }`}>
                                      <td className="p-3">
                                        <span className="font-mono font-bold text-[#21D4FD] block">{tkt.id}</span>
                                        <span className="text-[10px] text-white block">{tkt.name}</span>
                                        <span className="text-[9px] text-slate-400 font-mono block">{tkt.email}</span>
                                      </td>
                                      <td className="p-3 max-w-xs">
                                        <span className="font-semibold text-slate-200 block truncate">{tkt.subject}</span>
                                        <span className="text-slate-400 text-[10px] block truncate">{tkt.message}</span>
                                      </td>
                                      <td className="p-3">
                                        <span className={`px-2 py-0.5 border rounded text-[9px] font-mono font-bold uppercase block text-center ${
                                          tkt.status === "resolved" 
                                            ? "bg-emerald-500/10 border-emerald-500/15 text-emerald-400" 
                                            : tkt.status === "claimed"
                                            ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                                            : "bg-orange-500/20 border-orange-500/30 text-orange-400 animate-pulse"
                                        }`}>
                                          {tkt.status}
                                        </span>
                                        {tkt.claimedByName && (
                                          <span className="text-[8px] font-mono text-slate-500 block mt-1 text-center truncate">
                                            by {tkt.claimedByName.split(" ")[0]}
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-3 text-right space-y-1.5">
                                        <div className="flex flex-wrap gap-1 justify-end">
                                          {tkt.status === "open" && (
                                            <button
                                              onClick={() => handleClaimTicket(tkt.id)}
                                              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-[9px] uppercase rounded cursor-pointer border-none"
                                            >
                                              Claim
                                            </button>
                                          )}
                                          <button
                                            onClick={() => setActiveSupportTicketId(tkt.id)}
                                            className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-700 text-white font-mono font-bold text-[9px] uppercase rounded cursor-pointer border-none"
                                          >
                                            Chat
                                          </button>
                                          {tkt.status !== "resolved" && (
                                            <button
                                              onClick={() => handleResolveTicket(tkt.id)}
                                              className="px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-mono font-bold text-[9px] uppercase rounded cursor-pointer border-none"
                                            >
                                              Close
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handleDeleteTicket(tkt.id)}
                                            className="px-2 py-0.5 bg-red-950/40 hover:bg-red-900 border border-red-500/20 text-red-400 hover:text-white font-mono font-bold text-[9px] uppercase rounded cursor-pointer"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Right Side: Chat Window (Col span 5) */}
                        <div className="xl:col-span-5 border border-slate-800 bg-[#0d1b2a]/45 rounded-xl p-4 flex flex-col h-[380px]">
                          {activeSupportTicketId ? (
                            <>
                              {/* Chat Header */}
                              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-3">
                                <div>
                                  <span className="font-mono text-cyan-400 font-bold block">{activeSupportTicketId}</span>
                                  <span className="text-slate-300 text-[10px] block truncate max-w-[220px]">
                                    {submissions.supportTickets.find(t => t.id === activeSupportTicketId)?.subject}
                                  </span>
                                </div>
                                <span className="text-[8px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded uppercase">
                                  {submissions.supportTickets.find(t => t.id === activeSupportTicketId)?.status}
                                </span>
                              </div>

                              {/* Messages list */}
                              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 mb-3">
                                {/* Citizen's first request description */}
                                {(() => {
                                  const tkt = submissions.supportTickets.find(t => t.id === activeSupportTicketId);
                                  if (!tkt) return null;
                                  return (
                                    <div className="flex gap-2 justify-start">
                                      <div className="w-6.5 h-6.5 shrink-0 rounded-lg bg-cyan-950 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-[9px] font-mono font-bold uppercase">
                                        User
                                      </div>
                                      <div className="bg-[#122338] border border-slate-800 text-slate-200 rounded-2xl rounded-bl-none px-3 py-2 text-[11px] max-w-[80%] leading-relaxed text-left">
                                        <span className="block font-bold text-[9px] text-[#21D4FD] mb-0.5">{tkt.name} (Citizen Request)</span>
                                        {tkt.message}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Replies list */}
                                {supportTicketMessages.map((msg) => (
                                  <div
                                    key={msg.id}
                                    className={`flex gap-2 ${
                                      msg.senderRole === "citizen" ? "justify-start" : "justify-end"
                                    }`}
                                  >
                                    {msg.senderRole === "citizen" && (
                                      <div className="w-6.5 h-6.5 shrink-0 rounded-lg bg-cyan-950 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-[9px] font-mono font-bold uppercase">
                                        User
                                      </div>
                                    )}
                                    <div
                                      className={`rounded-2xl px-3 py-2 text-[11px] max-w-[80%] leading-relaxed text-left ${
                                        msg.senderRole !== "citizen"
                                          ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-br-none"
                                          : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
                                      }`}
                                    >
                                      <span className="block font-bold text-[9px] text-[#21D4FD] mb-0.5">
                                        {msg.senderName} ({msg.senderRole.toUpperCase()})
                                      </span>
                                      {msg.text}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Form reply input */}
                              <form onSubmit={handleSendSupportReply} className="flex gap-2">
                                <input
                                  type="text"
                                  value={supportReplyText}
                                  onChange={(e) => setSupportReplyText(e.target.value)}
                                  placeholder="Type support team reply..."
                                  required
                                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500/35 focus:outline-none rounded-xl text-xs py-2 px-3 text-white font-sans"
                                />
                                <button
                                  type="submit"
                                  disabled={sendingSupportReply}
                                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer border-none disabled:opacity-50"
                                >
                                  Send
                                </button>
                              </form>
                            </>
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 italic text-xs">
                              <MessageSquare className="w-8 h-8 text-cyan-500/20 mb-2 animate-bounce" />
                              <span>Select a ticket to launch support chat</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Newsletter Subscribers Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 font-mono">Newsletter Subscribers ({submissions.newsletterSubscribers?.length || 0})</h4>
                        <div className="p-4 bg-[#0d1b2a] border border-slate-850 rounded-xl space-y-2 max-h-60 overflow-y-auto">
                          {(!submissions.newsletterSubscribers || submissions.newsletterSubscribers.length === 0) ? (
                            <div className="text-center text-xs text-slate-500 italic font-mono py-4">No subscribers yet.</div>
                          ) : (
                            submissions.newsletterSubscribers.map((sub: string, index: number) => (
                              <div key={index} className="flex justify-between items-center py-1.5 border-b border-slate-800/40 text-xs text-slate-300 font-mono last:border-none">
                                <span>{sub}</span>
                                <span className="text-[9px] text-slate-500 uppercase font-bold">Active</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 font-mono">Contact Form Submissions ({submissions.contactSubmissions?.length || 0})</h4>
                        <div className="p-4 bg-[#0d1b2a] border border-slate-850 rounded-xl space-y-3 max-h-60 overflow-y-auto">
                          {(!submissions.contactSubmissions || submissions.contactSubmissions.length === 0) ? (
                            <div className="text-center text-xs text-slate-500 italic py-4">No submissions yet.</div>
                          ) : (
                            submissions.contactSubmissions.map((sub: any) => (
                              <div key={sub.id} className="p-3 bg-[#122338]/50 border border-slate-800/50 rounded-lg text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span className="font-bold text-white">{sub.name}</span>
                                  <span className="text-[9px] font-mono text-slate-500">{new Date(sub.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="text-slate-400 font-mono text-[10px]">{sub.email}</div>
                                <div className="text-slate-300 font-semibold mt-1">{sub.subject}</div>
                                <p className="text-slate-400 text-[11px] leading-relaxed italic">{sub.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: TESTIMONIALS MODERATOR */}
          {activeTab === "testimonials_mod" && (
            <div className="space-y-6">
              <div className="bg-[#122338] border border-slate-800 p-5 rounded-2xl text-left">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-amber-400" />
                  <h3 className="font-sans font-bold text-sm sm:text-base text-white uppercase tracking-wider">
                    Citizen Testimonials & Reviews Moderation
                  </h3>
                </div>

                {loadingTestimonials ? (
                  <div className="p-8 text-center text-xs text-slate-500 italic">Loading testimonials queue...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(!testimonials || testimonials.length === 0) ? (
                      <div className="col-span-2 p-8 text-center text-xs text-slate-500 italic border border-dashed border-slate-850 rounded-xl">
                        No testimonials registered in the system.
                      </div>
                    ) : (
                      testimonials.map((test: any) => (
                        <div key={test.id} className="p-4 bg-[#0D1B2A] border border-slate-850 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-xs font-bold text-white uppercase">{test.name}</h4>
                                <p className="text-[10px] text-slate-400 font-mono">{test.role}</p>
                              </div>
                              <div className="flex text-amber-400 gap-0.5">
                                {Array.from({ length: test.rating }).map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-sans mb-4 italic">
                              "{test.content}"
                            </p>
                            <div className="flex items-center gap-2 mb-4">
                              <span className={`px-2 py-0.5 border rounded text-[9px] font-mono font-bold uppercase ${
                                test.status === "approved"
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                  : "bg-amber-500/10 border-amber-500/20 text-[#FFB547] animate-pulse"
                              }`}>
                                {test.status}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500">
                                Submitted: {new Date(test.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 font-mono mt-2 pt-3 border-t border-slate-850/60">
                            <button
                              onClick={() => handleDeleteTestimonial(test.id)}
                              className="py-1.5 bg-red-900/10 hover:bg-red-900/20 text-red-500 hover:text-red-400 font-extrabold text-[9px] uppercase tracking-wider rounded-lg border border-red-500/20 transition cursor-pointer"
                            >
                              Delete / Reject
                            </button>
                            {test.status !== "approved" ? (
                              <button
                                onClick={() => handleApproveTestimonial(test.id)}
                                className="py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg shadow-md transition cursor-pointer border-none"
                              >
                                Approve
                              </button>
                            ) : (
                              <div className="py-1.5 text-center text-emerald-450 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                                <Check className="w-3.5 h-3.5 text-emerald-400" /> Approved
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: BACKUP & ROLES CONTROL */}
          {activeTab === "backup_control" && (
            <div className="space-y-6">
              {/* Backup & Checkpointing */}
              <div className="bg-[#122338] border border-slate-800 p-5 rounded-2xl text-left">
                <h3 className="font-sans font-bold text-sm sm:text-base text-white uppercase tracking-wider mb-2 font-sans">
                  Database Backup & System Recovery
                </h3>
                <p className="text-xs text-slate-400 mb-6 font-sans leading-relaxed">
                  Manage manual system snapshot checkpoints. Creating backups saves the current JSON state. Restoring reverts all tickets, verifications, and user points to the saved backup point.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-[#0d1b2a] border border-slate-850 rounded-xl space-y-4 flex flex-col items-start">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Save System Checkpoint</h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Takes a live snapshot of the complete ledger database state.
                    </p>
                    <button
                      onClick={handleBackupDatabase}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-mono font-bold text-xs uppercase rounded-xl border-none cursor-pointer shadow-md"
                    >
                      Trigger System Backup
                    </button>
                    {backupStatus && (
                      <div className="text-[10px] font-mono text-cyan-400 mt-2">{backupStatus}</div>
                    )}
                  </div>

                  <div className="p-4 bg-[#0d1b2a] border border-slate-850 rounded-xl space-y-4 flex flex-col items-start">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-rose-400 font-mono">Revert System State</h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Replaces all database entries with the previously saved system backup checkpoint.
                    </p>
                    <button
                      onClick={handleRestoreDatabase}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-xs uppercase rounded-xl border-none cursor-pointer shadow-md"
                    >
                      Restore Saved Checkpoint
                    </button>
                    {restoreStatus && (
                      <div className="text-[10px] font-mono text-rose-400 mt-2">{restoreStatus}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* System Roles Grid */}
              <div className="bg-[#122338] border border-slate-800 p-5 rounded-2xl text-left">
                <h3 className="font-sans font-bold text-sm sm:text-base text-white uppercase tracking-wider mb-4">
                  System Access Level Roles Directory
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#0d1b2a] border border-slate-850 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                      <span className="text-xs font-bold text-white uppercase font-mono">Administrator Role</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Clearance level mapping. Confers complete supervisor authorization. Governs backups, roles, newsletter, testimonials moderation, sitemaps, and database auditing logs.
                    </p>
                  </div>

                  <div className="p-4 bg-[#0d1b2a] border border-slate-850 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase font-mono">Authority Staff Role</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Clearance level mapping. Assigned to municipal inspectors. Can update incident SLA status states, assign departments, mobilise crews, and submit forensic resolved proof.
                    </p>
                  </div>

                  <div className="p-4 bg-[#0d1b2a] border border-slate-850 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-[#21D4FD]" />
                      <span className="text-xs font-bold text-white uppercase font-mono">Citizen Role</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Clearance level mapping. Standard neighborhood resident account. Can file new audit reports, add comment verifications, verify/dispute status, and redeem reward scores.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

      </div>

    </div>
  );
}
