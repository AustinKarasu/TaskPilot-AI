/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, Issue, IssueStatus, Announcement } from "../types";
import { dbService } from "../services/db";
import { TRANSLATIONS } from "../i18n/translations";
import { Award, Flame, CheckCircle, ShieldAlert, Navigation, ArrowRight, Star, Heart, Clock, Check, Lock, Shield, Megaphone } from "lucide-react";

interface DashboardPageProps {
  currentUser: User;
  onNavigate: (view: string) => void;
  language: "en" | "hi";
}

export default function DashboardPage({ currentUser, onNavigate, language }: DashboardPageProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [personalReports, setPersonalReports] = useState<Issue[]>([]);
  const [recommended, setRecommended] = useState<Issue[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const dict = TRANSLATIONS[language];
  const isSigned = localStorage.getItem("civiclens_is_signed_in") === "true";

  // Badges catalog
  const BADGES = [
    { name: "First Reporter", desc: "Awarded for submitting your initial verified community audit.", unlocked: (currentUser.badges || []).includes("First Reporter") || (currentUser.badges || []).includes("First Responder") || currentUser.civicScore >= 100, score: 100 },
    { name: "Community Verifier", desc: "Awarded for completing 15+ peer verifications with consensus matches.", unlocked: (currentUser.badges || []).includes("Community Verifier") || currentUser.civicScore >= 250, score: 250 },
    { name: "Neighborhood Guardian", desc: "Attained level designation of 350+ civic points.", unlocked: (currentUser.badges || []).includes("Neighborhood Guardian") || currentUser.civicScore >= 350, score: 350 },
    { name: "Resolution Champion", desc: "Confirmed resolution visual check. True civic hero.", unlocked: (currentUser.badges || []).includes("Resolution Champion") || currentUser.civicScore >= 450, score: 450 }
  ];

  const loadData = () => {
    if (!isSigned) return;
    const allIssues = dbService.getIssues();
    setIssues(allIssues);
    
    // Personal reports
    const mine = allIssues.filter(x => x.createdBy === currentUser.id);
    setPersonalReports(mine);

    // Recommended adjacent verification targets
    const recommendations = allIssues.filter(
      x => x.createdBy !== currentUser.id && 
      x.status === IssueStatus.NEW && 
      !dbService.hasUserVerified(x.id, currentUser.id).verified
    ).slice(0, 3);
    setRecommended(recommendations);

    // Load Announcements
    setAnnouncements(dbService.getAnnouncements());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("civiclens_user_changed", loadData);
    window.addEventListener("civiclens_data_changed", loadData);
    return () => {
      window.removeEventListener("civiclens_user_changed", loadData);
      window.removeEventListener("civiclens_data_changed", loadData);
    };
  }, [currentUser.id]);

  if (!isSigned) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center bg-theme-main text-theme-main font-sans">
        <div className="bg-theme-secondary border border-theme-main p-8 rounded-3xl shadow-theme-main relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-amber-500"></div>
          
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Lock className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>

          <h2 className="text-xl font-bold font-sans tracking-tight text-theme-main mb-2">
            {language === "en" ? "Dashboard Access Restricted" : "डैशबोर्ड पहुंच प्रतिबंधित है"}
          </h2>
          
          <p className="text-xs text-theme-muted leading-relaxed mb-6 font-mono">
            {language === "en" 
              ? "You are currently viewing as a guest. Authenticate your civic identity to sync reported audits, earn gamified rep badges, and track your local community impact." 
              : "आप वर्तमान में एक अतिथि के रूप में देख रहे हैं। रिपोर्ट किए गए ऑडिट को सिंक करने, गेमिफाइड बैज अर्जित करने और अपने स्थानीय प्रभाव को ट्रैक करने के लिए प्रमाणित करें।"}
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-theme-tertiary/60 rounded-xl border border-theme-main text-left">
              <Award className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="font-sans">
                <p className="text-xs font-bold text-theme-main">Gamified Badges</p>
                <p className="text-[10px] text-theme-secondary leading-tight">Unlock First Reporter and Neighborhood Guardian accolades.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-theme-tertiary/60 rounded-xl border border-theme-main text-left">
              <Flame className="w-5 h-5 text-rose-500 shrink-0" />
              <div className="font-sans">
                <p className="text-xs font-bold text-theme-main">Daily Streaks</p>
                <p className="text-[10px] text-theme-secondary leading-tight">Maintain consistency in peer auditing and reporting.</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate("auth")}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase font-mono"
          >
            <span>Sign In Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const solvedCount = personalReports.filter(x => x.status === IssueStatus.RESOLVED).length;

  // Compute real streak: count consecutive days with at least one submission (backwards from today)
  const computeStreak = () => {
    if (personalReports.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const submissionDates = new Set(
      personalReports.map(r => {
        const d = new Date(r.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      if (submissionDates.has(checkDate.getTime())) {
        streak++;
      } else if (i > 0) {
        break; // gap found
      }
    }
    return streak;
  };
  const streakDays = computeStreak();

  // Compute real consensus rate from verification/inaccurate counts
  const computeConsensusRate = () => {
    const withVotes = personalReports.filter(r => r.verificationCount + r.inaccurateCount > 0);
    if (withVotes.length === 0) return 0;
    const totalConfirms = withVotes.reduce((s, r) => s + r.verificationCount, 0);
    const totalDisputes = withVotes.reduce((s, r) => s + r.inaccurateCount, 0);
    const total = totalConfirms + totalDisputes;
    return total > 0 ? Math.round((totalConfirms / total) * 100) : 0;
  };
  const consensusRate = computeConsensusRate();

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 text-left bg-theme-main text-theme-main font-sans pb-24">
      
      {/* 1. CITIZEN OVERVIEW HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-theme-secondary border border-theme-main p-6 rounded-2xl shadow-theme-main">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-16 h-16 rounded-full border-2 border-[#21D4FD] object-cover"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-theme-main tracking-tight">{currentUser.name}</h1>
            <p className="text-xs text-theme-muted capitalize">Role: {currentUser.role} Inspector (Bengaluru Urban Area)</p>
            <div className="flex gap-2 mt-2">
              {currentUser.badges.slice(0, 3).map((badgeName) => (
                <span key={badgeName} className="text-[9px] font-mono font-bold bg-[#FFB547]/10 text-[#FFB547] border border-[#FFB547]/15 px-2 py-0.5 rounded leading-none">
                  🏅 {badgeName}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 shrink-0 w-full md:w-auto mt-4 md:mt-0">
          <div className="flex-1 md:flex-initial bg-theme-tertiary border border-theme-main px-4 py-3 rounded-xl text-center">
            <p className="text-xs font-mono text-theme-muted uppercase tracking-wider">{dict.civicScore}</p>
            <p className="text-2xl font-extrabold text-[#21D4FD] font-mono mt-1">{currentUser.civicScore}</p>
          </div>
          <div className="flex-1 md:flex-initial bg-theme-tertiary border border-theme-main px-4 py-3 rounded-xl text-center">
            <p className="text-xs font-mono text-theme-muted uppercase tracking-wider">{dict.streak}</p>
            <p className="text-2xl font-extrabold text-amber-500 font-mono mt-1 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 text-amber-500 animate-pulse fill-amber-500" />
              <span>{streakDays} Day{streakDays !== 1 ? 's' : ''}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT/CENTER COLUMN: BADGERS ARCHIVE & HISTORY */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* BADGES METROPOLITAN SHELF */}
          <div className="bg-theme-secondary border border-theme-main p-5 rounded-2xl shadow-theme-main">
            <h3 className="text-sm font-bold text-theme-main mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#FFB547]" />
              <span>My Gamified Badges Locker</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BADGES.map((b) => (
                <div
                  key={b.name}
                  className={`border rounded-xl p-4 flex items-start gap-3 transition-all ${
                    b.unlocked
                      ? "bg-theme-tertiary/40 border-[#FFB547]/30"
                      : "bg-theme-tertiary/10 border-theme-main opacity-40 grayscale"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${b.unlocked ? "bg-[#FFB547]/10" : "bg-theme-tertiary"}`}>
                    {b.unlocked ? "🏅" : "🔒"}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-theme-main mb-1">{b.name}</h4>
                    <p className="text-[10px] text-theme-secondary leading-snug">{b.desc}</p>
                    <p className="text-[9px] font-mono text-theme-muted mt-2 font-bold uppercase tracking-wider">
                      {b.unlocked ? "✓ Unlocked" : `Requires ${b.score} Points`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COMPLAINT INDEX HISTORY */}
          <div className="bg-theme-secondary border border-theme-main p-5 rounded-2xl shadow-theme-main">
            <h3 className="text-sm font-bold text-theme-main mb-4">My Submitted Auditing Log ({personalReports.length})</h3>

            {personalReports.length === 0 ? (
              <div className="text-center p-8 text-xs text-theme-muted">
                You have not registered any physical infrastructure audits yet.
                <button
                  onClick={() => onNavigate("report")}
                  className="mt-3 block mx-auto text-xs text-[#21D4FD] font-bold"
                >
                  Submit your first audit (+20 Points)
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {personalReports.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate(`issue/${item.id}`)}
                    className="border border-theme-main bg-theme-tertiary/30 hover:bg-theme-tertiary/60 rounded-xl p-3 flex justify-between items-center cursor-pointer transition-all border-l-3 border-l-[#21D4FD]"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-theme-main line-clamp-1">{item.title}</h4>
                      <p className="text-[10px] text-theme-muted mt-0.5 font-mono">ID: {item.id} • Assigned: {item.assignedDepartment.split(" ")[0]}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono leading-none border uppercase ${
                        item.status === IssueStatus.RESOLVED ? "bg-emerald-500/10 border-emerald-500/20 text-[#34D399]" : "bg-[#FFB547]/10 border-[#FFB547]/15 text-[#FFB547]"
                      }`}>
                        {item.status}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-550" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RECOMMENDATIONS & SIDE STATISTICS */}
        <div className="flex flex-col gap-6">
          
          {/* NEIGHBORHOOD VERIFICATION PROMPTS */}
          <div className="bg-theme-secondary border border-theme-main p-5 rounded-2xl shadow-theme-main">
            <h3 className="text-sm font-bold text-theme-main mb-1.5 flex items-center gap-2">
              <Star className="w-4 h-4 text-emerald-400" />
              <span>Recommended Audits Near You</span>
            </h3>
            <p className="text-[10px] text-theme-muted mb-4">Validate your neighborhood infrastructure to secure community audit safety and secure +10 Civic Points.</p>

            {recommended.length === 0 ? (
              <div className="text-center p-4 text-xs text-theme-muted">
                Excellent! All neighborhood tickets have been peer checked by you.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recommended.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => onNavigate(`issue/${rec.id}`)}
                    className="border border-theme-main bg-theme-tertiary/50 hover:bg-theme-tertiary p-3 rounded-xl cursor-pointer transition text-left"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-mono text-[#21D4FD] bg-[#21D4FD]/10 px-1.5 rounded">{rec.category}</span>
                      <span className="text-[9px] text-theme-muted font-mono">📍 {rec.address.split(",")[0]}</span>
                    </div>

                    <h4 className="text-xs font-bold text-theme-main line-clamp-1">{rec.title}</h4>
                    <p className="text-[10px] text-theme-secondary line-clamp-2 mt-0.5 leading-normal">{rec.originalDescription}</p>

                    <div className="mt-3 flex justify-between items-center text-[9px] font-mono text-emerald-400 font-bold">
                      <span>👤 {(rec.createdByName || "Community").split(" ")[0]}</span>
                      <span className="bg-emerald-500/10 px-1.5 py-0.5 rounded leading-none">+10 PTS AUDIT</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MUNICIPAL ANNOUNCEMENTS BOARD */}
          <div className="bg-theme-secondary border border-theme-main p-5 rounded-2xl shadow-theme-main">
            <h3 className="text-sm font-bold text-theme-main mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-cyan-400 rotate-[-12deg]" />
                <span>Municipal Alert Desk</span>
              </div>
              <span className="text-[10px] bg-cyan-500/10 px-2 py-0.5 rounded-full text-cyan-400 font-mono font-bold uppercase animate-pulse">Live</span>
            </h3>
            <p className="text-[10px] text-theme-muted mb-4">Official advisories, infrastructure work plans, and power/water notifications.</p>

            {announcements.length === 0 ? (
              <p className="text-xs text-theme-muted text-center py-4">No active notices published at this moment.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {announcements.slice(0, 3).map((ann) => (
                  <div
                    key={ann.id}
                    className="border border-theme-main bg-theme-tertiary/20 p-3.5 rounded-xl text-left hover:bg-theme-tertiary/40 transition duration-150 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        ann.category === "warning" ? "bg-amber-500/10 text-amber-550 border border-amber-500/10" :
                        ann.category === "alert" ? "bg-rose-500/10 text-rose-500 border border-rose-500/10" :
                        ann.category === "success" ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/10" :
                        "bg-[#21D4FD]/10 text-[#21D4FD] border border-[#21D4FD]/10"
                      }`}>
                        {ann.category} • {ann.department}
                      </span>
                      <span className="text-[8px] text-theme-muted font-mono">{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>

                    <h4 className="text-xs font-extrabold text-theme-main leading-tight mb-1">{ann.title}</h4>
                    <p className="text-[10px] text-theme-secondary leading-relaxed line-clamp-3">{ann.content}</p>

                    <div className="mt-2 text-[8px] font-mono text-theme-muted flex justify-between items-center bg-theme-tertiary/40 px-2 py-1 rounded">
                      <span>Issued by: {ann.authorName}</span>
                      <span>Verified Authority ✓</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CITIZEN STATS BREAKDOWN */}
          <div className="bg-theme-secondary border border-theme-main p-5 rounded-xl text-left shadow-theme-main">
            <h4 className="text-xs font-bold text-theme-main mb-3 uppercase tracking-wider font-mono">My Civic Metrics</h4>
            <div className="divide-y divide-theme-main flex flex-col">
              <div className="py-2.5 flex justify-between text-xs">
                <span className="text-theme-secondary">Total Audits Completed</span>
                <span className="font-bold text-theme-main font-mono">{personalReports.length}</span>
              </div>
              <div className="py-2.5 flex justify-between text-xs">
                <span className="text-theme-secondary">Crews Dispatched Resolving Cases</span>
                <span className="font-bold text-[#34D399] font-mono">{solvedCount}</span>
              </div>
              <div className="py-2.5 flex justify-between text-xs">
                <span className="text-theme-secondary">Verification Consensus Rate</span>
                <span className="font-bold text-[#21D4FD] font-mono">{consensusRate}%</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
