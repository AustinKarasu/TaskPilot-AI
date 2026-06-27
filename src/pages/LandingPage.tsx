/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Issue, IssueStatus } from "../types";
import { TRANSLATIONS } from "../i18n/translations";
import { Eye, ShieldAlert, ArrowRight, CheckCircle, TrendingUp, Users, Zap, Map, FileCode } from "lucide-react";
import { motion } from "motion/react";

export const getCategoryFallbackImage = (category: string): string => {
  const c = category.toLowerCase();
  if (c.includes("road") || c.includes("traffic")) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100" fill="%231e293b"><rect width="100" height="100" fill="%23334155"/><path d="M50 10v20M50 40v20M50 70v20" stroke="%23facc15" stroke-width="6" stroke-dasharray="10 10"/></svg>`;
  }
  if (c.includes("water") || c.includes("sanitation") || c.includes("drain")) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100" fill="%231e3a8a"><rect width="100" height="100" fill="%231d4ed8"/><path d="M50 15 C50 15, 25 45, 25 65 A 25 25 0 0 0 75 65 C 75 45, 50 15, 50 15 Z" fill="%2360a5fa"/></svg>`;
  }
  if (c.includes("waste") || c.includes("garbage") || c.includes("trash")) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100" fill="%23064e3b"><rect width="100" height="100" fill="%23047857"/><rect x="35" y="30" width="30" height="50" rx="3" fill="%23a7f3d0"/><path d="M30 30h40M45 20h10" stroke="%23a7f3d0" stroke-width="4" stroke-linecap="round"/></svg>`;
  }
  if (c.includes("utilit") || c.includes("light") || c.includes("power") || c.includes("electric")) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100" fill="%2378350f"><rect width="100" height="100" fill="%23d97706"/><path d="M55 15 L30 50 L50 50 L45 85 L70 50 L50 50 Z" fill="%23fef08a"/></svg>`;
  }
  if (c.includes("environ") || c.includes("safet") || c.includes("park") || c.includes("space") || c.includes("tree")) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100" fill="%2314532d"><rect width="100" height="100" fill="%2316a34a"/><circle cx="50" cy="40" r="25" fill="%23bbf7d0"/><rect x="46" y="65" width="8" height="20" fill="%2378350f"/></svg>`;
  }
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100" fill="%23374151"><rect width="100" height="100" fill="%234b5563"/><circle cx="50" cy="50" r="20" stroke="%239ca3af" stroke-width="4" fill="none"/></svg>`;
};

interface LandingPageProps {
  issues: Issue[];
  onNavigate: (view: string) => void;
  language: "en" | "hi";
}

export default function LandingPage({ issues, onNavigate, language }: LandingPageProps) {
  const dict = TRANSLATIONS[language];

  // Calculate live seed stats
  const activeCount = issues.filter(x => x.status !== IssueStatus.RESOLVED && x.status !== IssueStatus.REJECTED).length;
  const verifiedCount = issues.filter(x => x.status === IssueStatus.VERIFIED || x.status === IssueStatus.ASSIGNED || x.status === IssueStatus.IN_PROGRESS).length;
  const resolvedCountBySeedField = issues.filter(x => x.status === IssueStatus.RESOLVED).length;
  
  // Compute real average resolution time from resolved issues
  const computeAvgResolution = () => {
    const resolved = issues.filter(x => x.status === IssueStatus.RESOLVED && x.resolvedAt);
    if (resolved.length === 0) return "N/A";
    const totalMs = resolved.reduce((sum, r) => {
      const created = new Date(r.createdAt).getTime();
      const resolvedAt = new Date(r.resolvedAt!).getTime();
      return sum + Math.max(0, resolvedAt - created);
    }, 0);
    const avgHours = Math.round(totalMs / resolved.length / (1000 * 60 * 60));
    return avgHours < 1 ? "< 1 hour" : `${avgHours} hours`;
  };
  const averageResolutionHours = computeAvgResolution();

  return (
    <div className="min-h-screen text-theme-main bg-theme-main font-sans pb-16 transition-colors">
      {/* 1. HERO SECTION */}
      <section className="relative px-8 py-16 md:py-28 text-center max-w-[1400px] mx-auto overflow-hidden">
        
        {/* Subtle glowing halo backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-400/10 rounded-full filter blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/4 w-60 h-60 bg-indigo-500/10 rounded-full filter blur-[80px] pointer-events-none"></div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 rounded-full bg-theme-secondary/80 border border-theme-main backdrop-blur-md shadow-sm">
          <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-[#21D4FD]" />
          <span className="text-[10px] font-mono font-extrabold text-[#0D9488] dark:text-[#21D4FD] tracking-wider uppercase">Next-Gen Civic Infrastructure Command</span>
        </div>

        <h1 className="font-sans font-extrabold text-4xl sm:text-6xl tracking-tight text-theme-main leading-[1.1] mb-6 max-w-4xl mx-auto">
          Turn local problems into <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-sky-500 to-indigo-600 dark:from-[#21D4FD] dark:to-[#00F0FF]">visible action.</span>
        </h1>

        <p className="text-base sm:text-lg text-theme-secondary max-w-2xl mx-auto leading-relaxed mb-10">
          Supercharge your neighborhood with CivicLens AI. Snap physical safety hazards, let Gemini instantly extract telemetry details, trigger democratic verifications, and hold local municipalities strictly accountable.
        </p>

        {/* Primary Call to Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={() => onNavigate("report")}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-bold text-sm tracking-wide shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-2 group cursor-pointer"
            id="hero-report-btn"
          >
            <ShieldAlert className="w-4.5 h-4.5" />
            <span>{dict.reportBtn}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          
          <button
            onClick={() => onNavigate("map")}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-theme-secondary hover:bg-theme-tertiary border border-theme-main text-theme-main font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-theme-main"
            id="hero-map-btn"
          >
            <Map className="w-4.5 h-4.5 text-cyan-600 dark:text-[#21D4FD]" />
            <span>{dict.exploreBtn}</span>
          </button>
        </div>

        {/* 2. LIVE STATISTICS DOCK */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-[1400px] mx-auto border border-theme-main py-10 bg-theme-secondary rounded-2xl px-6 shadow-theme-main transition-colors">
          <div className="text-center p-2">
            <p className="text-3xl font-extrabold text-theme-main tracking-tight">{activeCount}</p>
            <p className="text-[11px] text-theme-muted uppercase font-mono tracking-wider mt-1">{dict.activeReports}</p>
          </div>
          <div className="text-center p-2 border-l border-theme-main">
            <p className="text-3xl font-extrabold text-cyan-600 dark:text-[#21D4FD] tracking-tight">{verifiedCount}</p>
            <p className="text-[11px] text-theme-muted uppercase font-mono tracking-wider mt-1">Verified Audit Nodes</p>
          </div>
          <div className="text-center p-2 border-l border-theme-main">
            <p className="text-3xl font-extrabold text-emerald-500 tracking-tight">{resolvedCountBySeedField}</p>
            <p className="text-[11px] text-theme-muted uppercase font-mono tracking-wider mt-1">Resolved Cases</p>
          </div>
          <div className="text-center p-2 border-l border-theme-main">
            <p className="text-3xl font-extrabold text-[#FFB547] tracking-tight">{averageResolutionHours}</p>
            <p className="text-[11px] text-theme-muted uppercase font-mono tracking-wider mt-1">SLA Resolution Speed</p>
          </div>
        </div>

      </section>

      {/* 3. CORE WORKFLOW STEPS */}
      <section className="max-w-[1400px] mx-auto px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3.5xl font-extrabold text-theme-main tracking-tight mb-3">Modern Intelligent Issue Lifecycle</h2>
          <p className="text-sm text-theme-secondary max-w-2xl mx-auto">Unlike traditional complaints channels, CivicLens AI wraps reports in geometric validations, preventing duplicates and establishing civic transparency.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="p-7 rounded-2xl bg-theme-card border border-theme-main relative shadow-theme-main">
            <div className="absolute top-4 right-4 text-xs font-mono font-bold text-cyan-600 dark:text-[#21D4FD]">01</div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-theme-main mb-2">1. Visual Report Capture</h3>
            <p className="text-xs text-theme-secondary leading-relaxed">Snapshot or upload image/video evidence, pinpointing location data. Bilingual text summaries are fully allowed.</p>
          </div>

          <div className="p-7 rounded-2xl bg-theme-card border border-theme-main relative shadow-theme-main">
            <div className="absolute top-4 right-4 text-xs font-mono font-bold text-cyan-600 dark:text-[#21D4FD]">02</div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-theme-main mb-2">2. Gemini Neural Extraction</h3>
            <p className="text-xs text-theme-secondary leading-relaxed">Gemini instantly extracts hazard categories, urgency grades, suggests safety advice, and searches for nearby duplicates.</p>
          </div>

          <div className="p-7 rounded-2xl bg-theme-card border border-theme-main relative shadow-theme-main">
            <div className="absolute top-4 right-4 text-xs font-mono font-bold text-cyan-600 dark:text-[#21D4FD]">03</div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-theme-main mb-2">3. Democratic Peer-Audit</h3>
            <p className="text-xs text-theme-secondary leading-relaxed">Local residents verify report existence on map grids. High consensus automatically triggers direct department escalation and boosts priority scores.</p>
          </div>

          <div className="p-7 rounded-2xl bg-theme-card border border-theme-main relative shadow-theme-main">
            <div className="absolute top-4 right-4 text-xs font-mono font-bold text-cyan-600 dark:text-[#21D4FD]">04</div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-4">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-theme-main mb-2">4. Forensic Verification</h3>
            <p className="text-xs text-theme-secondary leading-relaxed">Administrators dispatch crews and upload resolved photo proofs. Gemini runs a forensic visual check to confirm 100% resolution.</p>
          </div>
        </div>
      </section>

      {/* 4. CHRONOS METROPOLITAN CASE STUDY */}
      <section className="max-w-[1400px] mx-6 md:mx-auto p-8 md:p-12 bg-theme-secondary border border-theme-main rounded-2xl shadow-theme-main transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-4 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono border border-emerald-500/20 uppercase tracking-widest font-bold">
              Live Case Study
            </div>
            <h2 className="text-xl sm:text-2.5xl font-extrabold text-theme-main mb-4">Blind Commercial S-Bend Streetlight Resolved</h2>
            <p className="text-xs sm:text-sm text-theme-secondary leading-relaxed mb-6">
              Residents registered ticket <span className="font-mono text-cyan-600 dark:text-[#21D4FD] bg-theme-tertiary px-1 py-0.5 rounded">issue_103</span> reporting pitch-dark blind corners outside Kadubeesanahalli commercial district. Over 19 residents verified the hazard within 24 hours. The local distribution unit dispatched repairs within a day.
            </p>

            <div className="border-l-2 border-cyan-500 pl-4 py-1 italic text-xs text-theme-secondary">
              "Multiple burnouts replaced with white LED luminaires. Checked electrical connections on site. Restored visual safety across the blind bend." - Inspector Rajesh Kumar
            </div>
          </div>

          {/* Before & After comparison preview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-theme-main rounded-xl border border-theme-main overflow-hidden shadow-sm flex flex-col">
              <div className="relative h-28 sm:h-36 bg-slate-950">
                <img
                  src="/assets/demo/dark_street_preset.png"
                  alt="Before"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-60"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getCategoryFallbackImage("Public Utilities");
                  }}
                />
                <span className="absolute bottom-2 left-2 bg-[#FF6B6B] text-white text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded font-bold">
                  Before-Dark S-Curve
                </span>
              </div>
              <div className="p-2 border-t border-theme-main text-center bg-theme-tertiary">
                <p className="text-[10px] text-theme-secondary font-mono">0 Lux Illumination</p>
              </div>
            </div>

            <div className="bg-theme-main rounded-xl border border-theme-main overflow-hidden shadow-sm flex flex-col">
              <div className="relative h-28 sm:h-36 bg-slate-950">
                <img
                  src="/assets/demo/lit_street_preset.png"
                  alt="After"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getCategoryFallbackImage("Public Utilities");
                  }}
                />
                <span className="absolute bottom-2 left-2 bg-emerald-500 text-[#07111F] text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded font-bold">
                  Resolved-Clean LED
                </span>
              </div>
              <div className="p-2 border-t border-theme-main text-center bg-theme-tertiary">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">✓ Fully Remedied</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SEEDED RECENT ACTIVITY PREVIEW */}
      <section className="max-w-[1400px] mx-auto px-8 py-16 text-center">
        <h3 className="text-xl font-bold text-theme-main mb-6">Explore Civic Problems Near You</h3>
        <button
          onClick={() => onNavigate("map")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-cyan-500/40 text-cyan-600 dark:text-[#21D4FD] bg-cyan-500/5 hover:bg-cyan-500/10 transition-all text-sm font-extrabold cursor-pointer"
        >
          <span>Launch Command Map Panel</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}
