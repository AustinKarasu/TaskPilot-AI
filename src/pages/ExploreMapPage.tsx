/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Issue, IssueSeverity, IssueStatus } from "../types";
import { TRANSLATIONS } from "../i18n/translations";
import CivicMap from "../components/CivicMap";
import { Search, Filter, AlertCircle, Sparkles, Plus, Navigation, ThumbsUp, Calendar, ArrowRight, Eye, Map, List } from "lucide-react";

interface ExploreMapPageProps {
  issues: Issue[];
  onSelectIssue: (id: string) => void;
  onNavigate: (view: string) => void;
  onPresetReportLocation?: (lat: number, lng: number) => void;
  language: "en" | "hi";
  theme?: "light" | "dark";
}

export default function ExploreMapPage({
  issues,
  onSelectIssue,
  onNavigate,
  onPresetReportLocation,
  language,
  theme
}: ExploreMapPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedIssueIdState, setSelectedIssueIdState] = useState<string | undefined>(undefined);
  const [activeMobileTab, setActiveMobileTab] = useState<"map" | "list">("map");

  const dict = TRANSLATIONS[language];

  // Auto select first issue on load for detailed sidebar preview (MG Road Open manhole is premium)
  useEffect(() => {
    if (issues.length > 0 && !selectedIssueIdState) {
      const bestDefault = issues.find(x => x.id === "issue_101") || issues[0];
      setSelectedIssueIdState(bestDefault.id);
    }
  }, [issues, selectedIssueIdState]);

  // Filter issues safely
  const filteredIssues = issues.filter((item) => {
    // Search terms check
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(query) ||
      item.originalDescription.toLowerCase().includes(query) ||
      item.address.toLowerCase().includes(query) ||
      item.landmark.toLowerCase().includes(query) ||
      (item.subcategory && item.subcategory.toLowerCase().includes(query));

    // Category check
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;

    // Severity check
    const matchesSeverity = selectedSeverity === "all" || item.severity === selectedSeverity;

    // Status check
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;

    // Verification check
    const matchesVerified = !verifiedOnly || (item.status !== IssueStatus.NEW && item.status !== IssueStatus.REJECTED);

    return matchesSearch && matchesCategory && matchesSeverity && matchesStatus && matchesVerified;
  });

  const activeSidebarIssue = issues.find(x => x.id === selectedIssueIdState);

  const handleMapClickReport = (lat: number, lng: number) => {
    if (onPresetReportLocation) {
      onPresetReportLocation(lat, lng);
    }
    onNavigate("report");
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-theme-main text-theme-main overflow-hidden">
      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden border-b border-theme-main bg-theme-secondary shrink-0">
        <button
          onClick={() => setActiveMobileTab("map")}
          className={`flex-1 py-3 text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 border-r border-theme-main transition ${
            activeMobileTab === "map"
              ? "bg-theme-tertiary text-cyan-500 font-extrabold"
              : "text-theme-secondary"
          }`}
        >
          <Map className="w-4 h-4 text-cyan-450" />
          <span>Map View</span>
        </button>
        <button
          onClick={() => setActiveMobileTab("list")}
          className={`flex-1 py-3 text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition ${
            activeMobileTab === "list"
              ? "bg-theme-tertiary text-cyan-500 font-extrabold"
              : "text-theme-secondary"
          }`}
        >
          <List className="w-4 h-4 text-cyan-450" />
          <span>List View</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* 1. FILTERING & SEARCH SIDEBAR QUEUE (LEFT ON DESKTOP) */}
        <div className={`w-full md:w-[380px] lg:w-[420px] bg-theme-secondary/90 border-r border-theme-main flex flex-col h-full overflow-hidden ${
          activeMobileTab === "list" ? "flex" : "hidden md:flex"
        }`}>
        
        {/* Search & Dynamic Filter Options */}
        <div className="p-4 border-b border-theme-main bg-theme-secondary flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
            <input
              type="text"
              placeholder={dict.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-theme-tertiary text-theme-main border border-theme-main rounded-lg focus:border-[#21D4FD]/80 focus:outline-none transition-all placeholder:text-slate-500"
              id="input-search-map"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] uppercase font-mono tracking-wider text-theme-muted">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full mt-1 p-1 bg-theme-tertiary border border-theme-main rounded text-[10px] text-theme-main focus:outline-none focus:border-[#21D4FD]"
              >
                <option value="all">All</option>
                <option value="Roads & Traffic">Roads</option>
                <option value="Water & Sanitation">Water/Sanit</option>
                <option value="Solid Waste Management">Waste</option>
                <option value="Public Utilities">Utilities</option>
                <option value="Environment & Safety">Safety</option>
                <option value="Public Spaces">Spaces</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] uppercase font-mono tracking-wider text-theme-muted">Severity</label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full mt-1 p-1 bg-theme-tertiary border border-theme-main rounded text-[10px] text-theme-main focus:outline-none"
              >
                <option value="all">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] uppercase font-mono tracking-wider text-theme-muted">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full mt-1 p-1 bg-theme-tertiary border border-theme-main rounded text-[10px] text-theme-main focus:outline-none"
              >
                <option value="all">All</option>
                <option value="New">New</option>
                <option value="Verified">Verified</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Reopened">Reopened</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <input
              type="checkbox"
              id="verify-only-check"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded bg-theme-tertiary border-theme-main text-[#21D4FD]"
            />
            <label htmlFor="verify-only-check" className="text-[10px] font-sans font-medium text-theme-secondary cursor-pointer">
              Hide system-rejected / unverified reports
            </label>
          </div>
        </div>

        {/* Scrollable Issue List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-800/40">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Matches ({filteredIssues.length})</span>
            <span className="text-[10px] font-sans text-slate-400 italic">Click coordinate to preview</span>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-sans">
              No reported cases match your filter criteria.
            </div>
          ) : (
            filteredIssues.map((item) => {
              const isSelected = selectedIssueIdState === item.id;
              
              // Color badges for Severity
              const sevColors = {
                [IssueSeverity.LOW]: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                [IssueSeverity.MEDIUM]: "bg-[#FFB547]/10 text-[#FFB547] border-[#FFB547]/20",
                [IssueSeverity.HIGH]: "bg-orange-500/10 text-orange-400 border-orange-500/20",
                [IssueSeverity.CRITICAL]: "bg-[#FF6B6B]/15 text-[#FF6B6B] border-[#FF6B6B]/30 animate-pulse"
              };

              // Status badges
              const statusColors = {
                [IssueStatus.NEW]: "bg-slate-700/25 text-slate-350 border-slate-700/40",
                [IssueStatus.VERIFIED]: "bg-[#21D4FD]/10 text-[#21D4FD] border-[#21D4FD]/20",
                [IssueStatus.ASSIGNED]: "bg-[#00DFFF]/10 text-[#00DFFF] border-[#00DFFF]/20",
                [IssueStatus.IN_PROGRESS]: "bg-[#00DFFF]/15 text-[#00DFFF] lg:border-[#00DFFF]/30",
                [IssueStatus.RESOLVED]: "bg-emerald-500/10 text-[#34D399] border-emerald-500/20",
                [IssueStatus.REOPENED]: "bg-[#FF6B6B]/10 text-[#FF6B6B] border-[#FF6B6B]/20",
                [IssueStatus.REJECTED]: "bg-red-950 text-red-400 border-red-900/40"
              };

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedIssueIdState(item.id)}
                  className={`p-3 text-left transition-all border rounded-lg mb-2 cursor-pointer ${
                    isSelected
                      ? "bg-theme-tertiary border-[#21D4FD]/40"
                      : "bg-theme-tertiary/40 border-theme-main hover:bg-theme-tertiary/35 hover:border-theme-main"
                  }`}
                  id={`list-item-${item.id}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-mono font-bold text-[#9FB2C8] bg-slate-900/60 px-1 py-0.5 rounded leading-none">
                      {item.id}
                    </span>
                    <span className={`text-[9px] font-semibold font-mono tracking-wider px-1.5 py-0.5 border rounded uppercase ${sevColors[item.severity]}`}>
                      {item.severity}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white mt-1.5 line-clamp-1 group-hover:text-[#21D4FD] leading-snug">
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                    {item.originalDescription}
                  </p>

                  <div className="flex items-center justify-between text-[9px] text-[#9FB2C8] font-mono mt-2.5">
                    <span className="truncate max-w-[130px]">{item.landmark || item.address}</span>
                    <span className={`px-1.5 py-0.5 border rounded leading-none uppercase text-[8px] font-bold ${statusColors[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

        {/* 2. DYNAMICAL GRAPHICAL MAP DRAWER (CENTER DESKTOP) */}
        <div className={`flex-1 flex flex-col h-full bg-theme-main ${
          activeMobileTab === "map" ? "flex" : "hidden md:flex"
        }`}>
        <div className="flex-1 p-3 flex flex-col min-h-0">
          <CivicMap
            issues={filteredIssues}
            selectedIssueId={selectedIssueIdState}
            onSelectIssue={(id) => setSelectedIssueIdState(id)}
            onMapClickReport={handleMapClickReport}
            centerCoordinates={activeSidebarIssue ? activeSidebarIssue.location : undefined}
            theme={theme}
          />
        </div>

        {/* 3. DYNAMIC INTERACTION CARD (FOOTER DESKTOP) */}
        {activeSidebarIssue && (
          <div className="p-4 bg-theme-secondary border-t border-theme-main flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all animate-fade-in shadow-2xl">
            <div className="flex-1 text-left">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold text-[#21D4FD] bg-[#21D4FD]/15 px-2 py-0.5 rounded leading-none lowercase">
                  {activeSidebarIssue.category}
                </span>
                <span className="text-[10px] text-theme-muted">
                  • Reported on {new Date(activeSidebarIssue.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </div>
              <h3 className="text-sm font-bold text-theme-main line-clamp-1">{activeSidebarIssue.title}</h3>
              <p className="text-xs text-theme-secondary line-clamp-1 mt-0.5 italic">📍 landmark: {activeSidebarIssue.landmark || activeSidebarIssue.address}</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="text-right sm:block hidden">
                <p className="text-[9px] font-mono text-theme-muted uppercase">Verification Progress</p>
                <p className="text-xs font-bold text-theme-main">{activeSidebarIssue.verificationCount} checks</p>
              </div>

              <button
                onClick={() => onNavigate(`issue/${activeSidebarIssue.id}`)}
                className="w-full sm:w-auto px-5 py-2 rounded-lg bg-theme-tertiary hover:bg-[#21D4FD]/10 border border-[#21D4FD]/30 hover:border-[#21D4FD] text-theme-main hover:text-[#21D4FD] font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                id="btn-inspect-ticket"
              >
                <Eye className="w-4 h-4" />
                <span>Audit & Verify</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

    </div>
  );
}
