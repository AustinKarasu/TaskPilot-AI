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
  TrendingUp, 
  Menu, 
  X, 
  AlertCircle, 
  Check, 
  Activity, 
  FileText,
  Megaphone,
  MessageSquare
} from "lucide-react";

interface StaffPageProps {
  currentUser: User;
  onNavigate: (view: string) => void;
  language: "en" | "hi";
}

export default function StaffPage({ currentUser, onNavigate, language }: StaffPageProps) {
  const [activeTab, setActiveTab] = useState<"kanban" | "list" | "analytics" | "announcements" | "support_tickets">("kanban");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState("all");
  const [systemLogs, setSystemLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Secure terminal connection routed. Active clearance level: Level 1 Staff.`,
    `[${new Date().toLocaleTimeString()}] Assigned local sector bounds sync completed.`,
    `[${new Date().toLocaleTimeString()}] Live connection to central municipality database active.`
  ]);

  const [submissions, setSubmissions] = useState<{
    contactSubmissions: any[];
    newsletterSubscribers: any[];
    supportTickets: any[];
  }>({ contactSubmissions: [], newsletterSubscribers: [], supportTickets: [] });
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const [activeSupportTicketId, setActiveSupportTicketId] = useState<string | null>(null);
  const [supportReplyText, setSupportReplyText] = useState("");
  const [supportTicketMessages, setSupportTicketMessages] = useState<any[]>([]);
  const [sendingSupportReply, setSendingSupportReply] = useState(false);

  const dict = TRANSLATIONS[language];
  const isSigned = localStorage.getItem("civiclens_is_signed_in") === "true";
  const isStaff = isSigned && currentUser && (currentUser.role === "staff" || currentUser.role === "admin");

  const loadData = () => {
    if (!isSigned || !isStaff) return;
    setIssues(dbService.getIssues());
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

  // Real-time operations log feed
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeTab === "analytics" && isStaff) {
        const categories = ["Roads & Traffic", "Water & Sanitation", "Public Utilities", "Solid Waste Management"];
        const actions = [
          "Dispatched on-site inspector verification",
          "Updated field ticket status to IN_PROGRESS",
          "Logged contractor repair validation progress",
          "Synchronized sector coordinates with central dispatch"
        ];
        const randomCat = categories[Math.floor(Math.random() * categories.length)];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        const newLog = `[${new Date().toLocaleTimeString()}] Field: [${randomCat}] ${randomAction}.`;
        
        setSystemLogs(prev => [newLog, ...prev.slice(0, 5)]);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [activeTab, isStaff]);

  const addTerminalLog = (msg: string) => {
    setSystemLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
  };

  // Quick Action Dispatch
  const handleQuickAssignDepartment = (issueId: string, dept: string) => {
    dbService.adminUpdateIssue(
      issueId,
      { status: IssueStatus.ASSIGNED, assignedDepartment: dept },
      `Ticket assigned by field coordinator ${currentUser.name}. Area contractor notified.`
    );
    loadData();
    addTerminalLog(`Assigned department of ticket ${issueId.substring(0, 7)} to ${dept}.`);
  };

  const handleUpdateStatus = (issueId: string, status: IssueStatus) => {
    dbService.adminUpdateIssue(
      issueId,
      { status },
      `Ticket state transitioned to ${status.replace("_", " ")} by ${currentUser.name}.`
    );
    loadData();
    addTerminalLog(`Updated ticket ${issueId.substring(0, 7)} status to ${status}.`);
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

  useEffect(() => {
    if (activeTab === "support_tickets" && isStaff) {
      loadSubmissions();
    }
  }, [activeTab, isStaff]);

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

  const loadSupportTicketMessages = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, { headers: await getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSupportTicketMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeSupportTicketId && activeTab === "support_tickets" && isStaff) {
      loadSupportTicketMessages(activeSupportTicketId);
      const interval = setInterval(() => {
        loadSupportTicketMessages(activeSupportTicketId);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeSupportTicketId, activeTab, isStaff]);

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

  if (!isSigned) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center bg-theme-main text-theme-main font-sans">
        <div className="bg-theme-secondary border border-theme-main p-8 rounded-3xl shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Lock className="w-8 h-8 text-rose-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold font-sans tracking-tight mb-2">Access Unauthorized</h2>
          <p className="text-xs text-theme-muted leading-relaxed mb-6 font-mono">
            Requires staff or administrator authentication. Please sign in to access the field dispatch tools.
          </p>
          <button 
            onClick={() => onNavigate("auth")}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-mono text-xs font-bold uppercase rounded-xl transition shadow-md cursor-pointer border-0"
          >
            Go to authentication
          </button>
        </div>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center bg-theme-main text-theme-main font-sans">
        <div className="bg-theme-secondary border border-theme-main p-8 rounded-3xl shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Shield className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold font-sans tracking-tight mb-2">Clearance Level Insufficient</h2>
          <p className="text-xs text-theme-muted leading-relaxed mb-6 font-mono">
            This workspace contains municipal operations tools designated exclusively for registered municipal inspectors. Citizen roles are strictly restricted.
          </p>
          <button 
            onClick={() => onNavigate("landing")}
            className="px-6 py-2.5 bg-theme-tertiary border border-theme-main text-theme-main font-mono text-xs font-bold uppercase rounded-xl transition cursor-pointer"
          >
            Return to civic portal
          </button>
        </div>
      </div>
    );
  }

  // Filter issues
  const filteredQueue = issues.filter(issue => {
    const deptMatch = selectedDeptFilter === "all" || issue.assignedDepartment === selectedDeptFilter || issue.category.toLowerCase().includes(selectedDeptFilter.toLowerCase());
    const severityMatch = selectedSeverityFilter === "all" || issue.severity === selectedSeverityFilter;
    return deptMatch && severityMatch;
  });

  // KPI aggregation
  const totalTickets = issues.length;
  const resolvedTicketsCount = issues.filter(x => x.status === IssueStatus.RESOLVED).length;
  const activeIncidentsCount = issues.filter(x => x.status !== IssueStatus.RESOLVED && x.status !== IssueStatus.REJECTED).length;
  const slaCompliancePercent = totalTickets > 0 ? Math.round(((resolvedTicketsCount + issues.filter(x => x.status === IssueStatus.IN_PROGRESS).length * 0.4) / totalTickets) * 100) : 100;

  const kanbanColumns = [
    {
      id: "col_new",
      title: "New Incoming",
      colorTag: "bg-amber-500/20 text-[#FFB547] border-[#FFB547]/30",
      statuses: [IssueStatus.NEW, IssueStatus.REOPENED]
    },
    {
      id: "col_verified",
      title: "Verified Audits",
      colorTag: "bg-blue-500/20 text-[#21D4FD] border-[#21D4FD]/30",
      statuses: [IssueStatus.VERIFIED]
    },
    {
      id: "col_assigned",
      title: "Crews Active",
      colorTag: "bg-[#00DFFF]/20 text-[#00DFFF] border-[#00DFFF]/30",
      statuses: [IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS]
    },
    {
      id: "col_resolved",
      title: "Solved/Closed",
      colorTag: "bg-emerald-500/20 text-[#34D399] border-emerald-500/30",
      statuses: [IssueStatus.RESOLVED]
    }
  ];

  const staffTabs = [
    { id: "kanban", name: "Kanban Dispatcher", icon: Layers, color: "text-[#21D4FD]" },
    { id: "list", name: "Ledger Directory", icon: ListFilter, color: "text-[#00FFFF]" },
    { id: "analytics", name: "KPI & Performance", icon: TrendingUp, color: "text-[#34D399]" },
    { id: "announcements", name: "Publish Broadcasts", icon: Megaphone, color: "text-amber-500" },
    { id: "support_tickets", name: "Support Tickets", icon: FileText, color: "text-purple-400" }
  ];

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-6 text-left bg-theme-main text-theme-main font-sans pb-24 relative min-h-screen">
      
      {/* Tab Switcher Responsive Panel */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Toggle Hamburger Button for Mobile Viewports */}
        <div className="flex items-center justify-between w-full lg:hidden border-b border-slate-800 pb-4 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1 px-1.5 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono leading-none font-bold uppercase shrink-0">Field Ops</span>
            <h2 className="text-sm font-black text-theme-main font-sans uppercase tracking-tight truncate leading-none">Staff Desk</h2>
          </div>
          <button 
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className="p-2 border border-theme-main bg-theme-secondary text-theme-main rounded-xl focus:outline-none cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Menu className="w-4 h-4 text-[#21D4FD]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Select Panel</span>
          </button>
        </div>

        {/* Mobile slide-out drawer */}
        {isMobileDrawerOpen && (
          <div 
            className="fixed inset-0 bg-theme-main/80 backdrop-blur-sm z-50 lg:hidden flex justify-start justify-items-start"
            onClick={() => setIsMobileDrawerOpen(false)}
          >
            <div 
              className="w-72 bg-theme-secondary border-r border-theme-main h-full p-5 flex flex-col justify-between shrink-0 hover:shadow-2xl transition"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-mono text-[9px] text-theme-muted font-bold uppercase tracking-widest">Dashboard Modules</span>
                  <button 
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-1 rounded-lg border border-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {staffTabs.map((tab) => {
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
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Left Sidebar Panel */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 space-y-6">
          <div className="p-4 bg-theme-secondary border border-theme-main rounded-2xl text-left relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Shield className="w-16 h-16 text-theme-main" />
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <p className="text-[9px] font-mono font-bold tracking-wider text-emerald-400 uppercase leading-none">Level 1 Inspector</p>
            </div>

            <h3 className="text-sm font-bold text-theme-main mt-2.5 truncate">{currentUser.name}</h3>
            <p className="text-[10px] font-mono text-theme-muted mt-0.5 truncate">{currentUser.email}</p>

            <div className="mt-4 pt-3.5 border-t border-theme-main flex justify-between items-center text-[10px] font-mono">
              <span className="text-theme-muted">ACTIVE CLEARANCE</span>
              <span className="text-emerald-500 font-bold uppercase">APPROVED</span>
            </div>
          </div>

          <div className="p-2.5 bg-theme-secondary border border-theme-main rounded-2xl space-y-1">
            <p className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none mb-3 mt-1.5 px-3">Field Modules</p>
            {staffTabs.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition-all cursor-pointer ${
                    isActive 
                      ? "bg-theme-main border border-theme-main text-theme-main shadow-sm" 
                      : "text-theme-muted border border-transparent hover:bg-theme-tertiary hover:text-theme-main"
                  }`}
                >
                  <IconComp className={`w-4 h-4 shrink-0 ${tab.color}`} />
                  <span className="flex-1 truncate">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Central Operations Panel */}
        <div className="flex-1 min-w-0">
          
          <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-theme-main">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold tracking-wider">
                  Field Operations Desk
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-theme-main tracking-tight mt-1 flex items-center gap-2">
                {activeTab === "kanban" && "Kanban Dispute Dispatch"}
                {activeTab === "list" && "Municipal Incident Register"}
                {activeTab === "analytics" && "SLA Performance Telemetry"}
                {activeTab === "announcements" && "Publish Municipal Broadcasts"}
                {activeTab === "support_tickets" && "Support Tickets Board"}
              </h1>
              <p className="text-xs text-theme-muted mt-0.5">
                {activeTab === "kanban" && "Review verified citizen reports, update live repairing statuses, and execute site closures."}
                {activeTab === "list" && "Search, filter, and inspect comprehensive geo-coordinates list of local issues."}
                {activeTab === "analytics" && "Observe live average response indexes, restoration rates and field daemon telemetry."}
                {activeTab === "announcements" && "Publish official warnings, power outage notices, water restrictions or successful repair updates."}
                {activeTab === "support_tickets" && "Inspect resident-submitted contact forms and resolve support queries."}
              </p>
            </div>
          </header>

          {/* SHARED GLOBALLY: FILTER BOX FOR TICKET PIPELINE */}
          {(activeTab === "kanban" || activeTab === "list") && (
            <div className="bg-theme-secondary p-4 border border-theme-main rounded-2xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono uppercase text-theme-muted block font-bold mb-1.5">Department Specialty</label>
                <select 
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-theme-tertiary text-theme-main border border-theme-main focus:outline-none cursor-pointer"
                >
                  <option value="all">All Departments / Specialities</option>
                  <option value="Roads & Traffic">Roads & traffic (BBMP)</option>
                  <option value="Water & Sanitation">Water & sanitation (BWSSB)</option>
                  <option value="Public Utilities">Public Utilities (BESCOM)</option>
                  <option value="Solid Waste Management">Solid Waste (BBMP Unit)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-theme-muted block font-bold mb-1.5">Risk Severity Index</label>
                <select 
                  value={selectedSeverityFilter}
                  onChange={(e) => setSelectedSeverityFilter(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-theme-tertiary text-theme-main border border-theme-main focus:outline-none cursor-pointer"
                >
                  <option value="all">All Severity Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Risk</option>
                  <option value="critical">Critical Alarm</option>
                </select>
              </div>
            </div>
          )}

          {/* tab: KANBAN BOARD */}
          {activeTab === "kanban" && (
            <KanbanBoard
              filteredQueue={filteredQueue}
              kanbanColumns={kanbanColumns}
              onCardClick={(id) => onNavigate("issue/" + id)}
              showDescription={true}
              renderCardActions={(item) => (
                <div className="flex gap-1.5">
                  {/* Transition Buttons */}
                  {item.status === IssueStatus.NEW && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(item.id, IssueStatus.VERIFIED);
                      }}
                      className="px-2 py-1 bg-[#21D4FD] text-slate-950 hover:bg-[#21D4FD]/90 text-[9px] font-black uppercase rounded transition border-0 font-mono shadow-sm cursor-pointer"
                    >
                      Verify
                    </button>
                  )}

                  {item.status === IssueStatus.VERIFIED && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAssignDepartment(item.id, item.assignedDepartment || "Roads & Traffic");
                      }}
                      className="px-2 py-1 bg-[#21D4FD] text-slate-950 hover:bg-[#21D4FD]/90 text-[9px] font-black uppercase rounded transition border-0 font-mono shadow-sm cursor-pointer"
                    >
                      Dispatch Crew
                    </button>
                  )}

                  {item.status === IssueStatus.ASSIGNED && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(item.id, IssueStatus.IN_PROGRESS);
                      }}
                      className="px-2 py-1 bg-amber-500 text-slate-950 hover:bg-amber-600 text-[9px] font-black uppercase rounded transition border-0 font-mono shadow-sm cursor-pointer"
                    >
                      Start Work
                    </button>
                  )}

                  {(item.status === IssueStatus.IN_PROGRESS || item.status === IssueStatus.ASSIGNED) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Leads to uploading resolution images inside detail page
                        onNavigate("issue/" + item.id);
                      }}
                      className="px-2 py-1 bg-emerald-500 text-slate-950 hover:bg-emerald-600 text-[9px] font-black uppercase rounded transition border-0 font-mono shadow-sm cursor-pointer"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              )}
            />
          )}

          {/* tab: LIST LEDGER */}
          {activeTab === "list" && (
            <div className="bg-theme-secondary border border-theme-main rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-theme-main flex items-center justify-between">
                <span className="font-mono text-[10px] text-theme-muted uppercase tracking-widest">Active Incident Logs</span>
                <span className="text-xs bg-theme-tertiary px-3 py-1 font-mono rounded-xl border border-theme-main text-theme-secondary">
                  Count: <span className="font-bold text-theme-main">{filteredQueue.length}</span> entries
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-theme-tertiary text-theme-muted font-mono text-[10px] uppercase text-left border-b border-theme-main">
                      <th className="p-4">Ticket</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Severity</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4 text-center">Inspection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-main bg-theme-secondary">
                    {filteredQueue.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-theme-muted italic">No active ledger reports found with current filters.</td>
                      </tr>
                    ) : (
                      filteredQueue.map((item) => (
                        <tr key={item.id} className="hover:bg-theme-tertiary/40 transition">
                          <td className="p-4 font-mono font-bold text-theme-main">{item.id}</td>
                          <td className="p-4 min-w-[150px]">
                            <div className="text-xs font-bold text-theme-main line-clamp-1">{item.title}</div>
                            <div className="text-[10px] text-theme-muted font-mono mt-0.5 truncate">{item.landmark || "Coordinates loaded"}</div>
                          </td>
                          <td className="p-4 text-theme-muted text-xs truncate max-w-[150px]">{item.category}</td>
                          <td className="p-4">
                            <span className={`bg-theme-tertiary border px-2 py-0.5 text-[9px] font-mono font-bold rounded capitalize ${
                              item.severity === IssueSeverity.CRITICAL ? "text-red-500 border-red-500/20 bg-red-500/5 font-black uppercase animate-pulse" :
                              item.severity === IssueSeverity.HIGH ? "text-amber-500 border-amber-500/20 bg-amber-500/5" :
                              item.severity === IssueSeverity.MEDIUM ? "text-blue-500 border-blue-500/20 bg-blue-500/5" :
                              "text-slate-400 border-slate-500/20 bg-slate-500/5"
                            }`}>
                              {item.severity}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 border rounded text-[9px] font-mono font-bold leading-none capitalize ${
                              item.status === IssueStatus.RESOLVED ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                              item.status === IssueStatus.IN_PROGRESS ? "bg-amber-500/10 text-[#FFB547] border-[#FFB547]/20" :
                              item.status === IssueStatus.REJECTED ? "bg-red-500/10 text-red-400 border-red-500/20" :
                              item.status === IssueStatus.ASSIGNED ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                              "bg-slate-500/10 text-slate-400 border-slate-500/20"
                            }`}>
                              {item.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-[#FFB547] text-xs">{Math.round(item.priorityScore)}/100</td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => onNavigate("issue/" + item.id)}
                              className="p-1 px-2.5 rounded bg-theme-tertiary hover:bg-theme-main border border-theme-main text-theme-secondary hover:text-theme-main transition text-[10px] font-bold cursor-pointer"
                            >
                              Open Story
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* tab: PERFORMANCE KPI & TELEMETRY */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <AnalyticsBento
                totalTickets={totalTickets}
                resolvedTicketsCount={resolvedTicketsCount}
                activeIncidentsCount={activeIncidentsCount}
                slaCompliancePercent={slaCompliancePercent}
              />

              {/* LIVE STREAM DAEMON FEED */}
              <TerminalLogFeed
                logs={systemLogs}
                title="Live Sector Activity Logs"
                showActivityIcon={true}
                footnote="✦ Automated sector heartbeat active. Standard 5000ms logging rate."
                maxHeightClass="max-h-[220px]"
              />
            </div>
          )}

          {activeTab === "announcements" && (
            <div className="space-y-6 text-left animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* PUBLISHER FORM */}
                <div className="bg-theme-secondary border border-theme-main p-5 rounded-2xl self-start shadow-theme-main">
                  <h3 className="text-sm font-bold text-theme-main mb-3">Post Official Notice</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const fData = new FormData(form);
                    const title = fData.get("title") as string;
                    const content = fData.get("content") as string;
                    const category = fData.get("category") as any;
                    const department = fData.get("department") as string;

                    if (!title.trim() || !content.trim()) {
                      alert("Please fill in all details.");
                      return;
                    }

                    dbService.addAnnouncement({
                      title,
                      content,
                      category,
                      department,
                      authorName: currentUser.name
                    });

                    addTerminalLog(`Published municipal broadcast alert: "${title}"`);
                    form.reset();
                  }} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-mono text-theme-muted uppercase font-bold block mb-1">Notice Category</label>
                      <select name="category" className="w-full text-xs p-2.5 bg-theme-tertiary border border-theme-main rounded-lg text-theme-main focus:outline-none">
                        <option value="info">Info Advisory</option>
                        <option value="warning">Slight Delay / Warning</option>
                        <option value="alert">Critical Outage / Alert</option>
                        <option value="success">Success / Resolution</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-theme-muted uppercase font-bold block mb-1">Target Department</label>
                      <input name="department" type="text" placeholder="e.g. BESCOM Electricity Board" className="w-full text-xs p-2.5 bg-theme-tertiary border border-theme-main rounded-lg text-theme-main focus:outline-none" defaultValue="Municipal Works Division" required />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-theme-muted uppercase font-bold block mb-1">Notice Title</label>
                      <input name="title" type="text" placeholder="e.g. Area water shut off" className="w-full text-xs p-2.5 bg-theme-tertiary border border-theme-main rounded-lg text-theme-main focus:outline-none" required />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-theme-muted uppercase font-bold block mb-1">Details & Content</label>
                      <textarea name="content" rows={4} placeholder="Clearly describe any timelines, safety advices or scheduled contractor repairs..." className="w-full text-xs p-2.5 bg-theme-tertiary border border-theme-main rounded-lg text-theme-main focus:outline-none resize-none" required></textarea>
                    </div>

                    <button type="submit" className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 text-white font-bold text-xs rounded-lg transition-all shadow cursor-pointer">
                      Publish Live Advisory
                    </button>
                  </form>
                </div>

                {/* HISTORICAL BULLETINS */}
                <div className="lg:col-span-2 bg-theme-secondary border border-theme-main p-5 rounded-2xl shadow-theme-main">
                  <h3 className="text-sm font-bold text-theme-main mb-4 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-amber-500 fill-amber-500/10 rotate-[-12deg]" />
                    <span>Active Civic Publications ({dbService.getAnnouncements().length})</span>
                  </h3>

                  <div className="space-y-4">
                    {dbService.getAnnouncements().length === 0 ? (
                      <p className="text-xs text-theme-muted text-center py-12">No official announcements have been published yet.</p>
                    ) : (
                      dbService.getAnnouncements().map((ann) => (
                        <div key={ann.id} className="p-4 border border-theme-main bg-theme-tertiary/20 rounded-xl hover:bg-theme-tertiary/30 transition">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                              ann.category === "warning" ? "bg-amber-500/10 text-amber-500 border border-amber-500/10" :
                              ann.category === "alert" ? "bg-rose-500/10 text-rose-500 border border-rose-500/10" :
                              ann.category === "success" ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/10" :
                              "bg-[#21D4FD]/10 text-[#21D4FD] border border-[#21D4FD]/10"
                            }`}>
                              {ann.category} • {ann.department}
                            </span>
                            <span className="text-[10px] text-theme-muted font-mono">{new Date(ann.createdAt).toLocaleString()}</span>
                          </div>
                          <h4 className="text-xs font-bold text-theme-main mb-1 text-left">{ann.title}</h4>
                          <p className="text-[10px] text-theme-secondary leading-relaxed text-left">{ann.content}</p>
                          <div className="mt-3 pt-2 border-t border-theme-main/50 text-[9px] font-mono text-theme-muted flex justify-between items-center">
                            <span>Poster Identity: {ann.authorName}</span>
                            <span className="text-amber-500 font-bold uppercase shrink-0">Official Dispatch Terminal ✓</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === "support_tickets" && (
            <div className="space-y-6 text-left animate-fade-in">
              <div className="bg-theme-secondary border border-theme-main p-5 rounded-2xl shadow-theme-main">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <h3 className="font-sans font-bold text-sm sm:text-base text-theme-main uppercase tracking-wider">
                    Support Tickets & Form Submissions
                  </h3>
                </div>
                
                {loadingSubmissions ? (
                  <div className="p-8 text-center text-xs text-theme-muted italic">Loading submissions ledger from server...</div>
                ) : (
                  <div className="space-y-8">
                    {/* Support Tickets Section */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-theme-muted uppercase tracking-wider mb-3 font-mono">
                        Support Tickets ({submissions.supportTickets?.length || 0})
                      </h4>
                      
                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        {/* Left Side: Ticket Grid Table (Col span 7) */}
                        <div className="xl:col-span-7 overflow-x-auto rounded-xl border border-theme-main bg-theme-tertiary/10">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-theme-tertiary/40 text-theme-muted font-mono text-[9px] uppercase text-left border-b border-theme-main">
                                <th className="p-3 font-bold">Ticket</th>
                                <th className="p-3 font-bold">Subject</th>
                                <th className="p-3 font-bold">Status</th>
                                <th className="p-3 font-bold text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-theme-main text-xs">
                              {(!submissions.supportTickets || submissions.supportTickets.length === 0) ? (
                                <tr>
                                  <td colSpan={4} className="p-4 text-center text-theme-muted italic font-mono">No support tickets found.</td>
                                </tr>
                              ) : (
                                submissions.supportTickets.map((tkt: any) => {
                                  return (
                                    <tr key={tkt.id} className={`hover:bg-theme-tertiary/10 transition ${
                                      activeSupportTicketId === tkt.id ? "bg-theme-tertiary/20" : ""
                                    }`}>
                                      <td className="p-3">
                                        <span className="font-mono font-bold text-[#21D4FD] block">{tkt.id}</span>
                                        <span className="text-[10px] text-theme-main block">{tkt.name}</span>
                                        <span className="text-[9px] text-theme-muted font-mono block">{tkt.email}</span>
                                      </td>
                                      <td className="p-3 max-w-xs">
                                        <span className="font-semibold text-theme-secondary block truncate">{tkt.subject}</span>
                                        <span className="text-theme-muted text-[10px] block truncate">{tkt.message}</span>
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
                                          <span className="text-[8px] font-mono text-theme-muted block mt-1 text-center truncate">
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
                        <div className="xl:col-span-5 border border-theme-main bg-theme-secondary/40 rounded-xl p-4 flex flex-col h-[380px]">
                          {activeSupportTicketId ? (
                            <>
                              {/* Chat Header */}
                              <div className="flex justify-between items-center border-b border-theme-main pb-2.5 mb-3">
                                <div>
                                  <span className="font-mono text-cyan-400 font-bold block">{activeSupportTicketId}</span>
                                  <span className="text-theme-secondary text-[10px] block truncate max-w-[220px]">
                                    {submissions.supportTickets.find(t => t.id === activeSupportTicketId)?.subject}
                                  </span>
                                </div>
                                <span className="text-[8px] font-mono text-theme-muted bg-theme-tertiary/20 border border-theme-main px-2 py-0.5 rounded uppercase">
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
                                      <div className="bg-theme-tertiary border border-theme-main text-theme-secondary rounded-2xl rounded-bl-none px-3 py-2 text-[11px] max-w-[80%] leading-relaxed text-left">
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
                                          : "bg-theme-tertiary border border-theme-main text-theme-secondary rounded-bl-none"
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
                                  className="flex-1 bg-theme-secondary border border-theme-main focus:border-cyan-500/35 focus:outline-none rounded-xl text-xs py-2 px-3 text-theme-main font-sans"
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
                            <div className="flex-1 flex flex-col items-center justify-center text-theme-muted italic text-xs">
                              <MessageSquare className="w-8 h-8 text-cyan-500/20 mb-2 animate-bounce" />
                              <span>Select a ticket to launch support chat</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Form Submissions Section */}
                    <div>
                      <h4 className="text-xs font-bold text-theme-muted uppercase tracking-wider mb-3 font-mono">Contact Form Submissions ({submissions.contactSubmissions?.length || 0})</h4>
                      <div className="p-4 bg-theme-tertiary/20 border border-theme-main rounded-xl space-y-3 max-h-60 overflow-y-auto">
                        {(!submissions.contactSubmissions || submissions.contactSubmissions.length === 0) ? (
                          <div className="text-center text-xs text-theme-muted italic py-4">No submissions yet.</div>
                        ) : (
                          submissions.contactSubmissions.map((sub: any) => (
                            <div key={sub.id} className="p-3 bg-theme-secondary border border-theme-main rounded-lg text-xs space-y-1">
                              <div className="flex justify-between">
                                <span className="font-bold text-theme-main">{sub.name}</span>
                                <span className="text-[9px] font-mono text-theme-muted">{new Date(sub.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="text-theme-muted font-mono text-[10px]">{sub.email}</div>
                              <div className="text-theme-secondary font-semibold mt-1">{sub.subject}</div>
                              <p className="text-theme-muted text-[11px] leading-relaxed italic">{sub.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}