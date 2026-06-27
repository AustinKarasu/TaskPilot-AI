/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Issue, CommunityInsight, IssueStatus } from "../types";
import { dbService } from "../services/db";
import { TRANSLATIONS } from "../i18n/translations";
import { Sparkles, BarChart2, TrendingUp, AlertTriangle, Cpu, Loader2, ArrowUpRight, HelpCircle, RefreshCw } from "lucide-react";
import { getAuthHeaders } from "../lib/api";

interface ImpactPageProps {
  language: "en" | "hi";
}

export default function ImpactPage({ language }: ImpactPageProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [insights, setInsights] = useState<CommunityInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const dict = TRANSLATIONS[language];

  const loadData = () => {
    setIssues(dbService.getIssues());
    setInsights(dbService.getInsights());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recalculate insights using real Gemini analysis
  const handleRegenerateInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch("/api/gemini/generate-insights", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ currentIssuesArray: issues })
      });
      const data = await res.json();
      if (data && data.insights) {
        dbService.saveInsights(data.insights);
        setInsights(data.insights);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Compile statistics for custom high-fidelity visual bars
  const total = issues.length;
  const resolved = issues.filter(x => x.status === IssueStatus.RESOLVED).length;
  const inProgress = issues.filter(x => x.status === IssueStatus.ASSIGNED || x.status === IssueStatus.IN_PROGRESS).length;
  const newReports = issues.filter(x => x.status === IssueStatus.NEW || x.status === IssueStatus.VERIFIED).length;

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Breakdown by Category
  const categories = ["Roads & Traffic", "Water & Sanitation", "Solid Waste Management", "Public Utilities", "Environment & Safety", "Public Spaces"];
  const categoryStats = categories.map((cat) => {
    const list = issues.filter(x => x.category === cat);
    const solved = list.filter(x => x.status === IssueStatus.RESOLVED).length;
    return {
      name: cat,
      count: list.length,
      solved,
      rate: list.length > 0 ? Math.round((solved / list.length) * 100) : 0
    };
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 text-left bg-theme-main text-theme-main font-sans pb-24">
      
      {/* HEADER SECTION */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-main tracking-tight leading-tight uppercase">COMMUNITY TRANSPARENCY & IMPACT</h1>
        <p className="text-xs sm:text-sm text-theme-secondary mt-1.5 max-w-xl">
          Complete structural analysis of civic remediations and neighborhood consensus audits across Bengaluru Metro districts.
        </p>
      </div>

      {/* 1. SEED CHARTS MUNICIPAL OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-theme-secondary border border-theme-main p-5 rounded-xl text-center shadow-theme-main">
          <p className="text-xs font-mono text-theme-muted uppercase tracking-widest">Total Audited Hazards</p>
          <p className="text-3xl font-extrabold text-theme-main font-mono mt-1">{total}</p>
          <p className="text-[10px] text-theme-muted mt-2">100% logged coordinates</p>
        </div>

        <div className="bg-theme-secondary border border-theme-main p-5 rounded-xl text-center shadow-theme-main">
          <p className="text-xs font-mono text-theme-muted uppercase tracking-widest">Verified Resolutions</p>
          <p className="text-3xl font-extrabold text-[#34D399] font-mono mt-1">{resolved}</p>
          <p className="text-[10px] text-emerald-500 mt-2">✓ Forensic match confirmed</p>
        </div>

        <div className="bg-theme-secondary border border-theme-main p-5 rounded-xl text-center shadow-theme-main">
          <p className="text-xs font-mono text-theme-muted uppercase tracking-widest">Active Dispatch Works</p>
          <p className="text-3xl font-extrabold text-cyan-400 font-mono mt-1">{inProgress}</p>
          <p className="text-[10px] text-theme-muted mt-2">Crews currently on site</p>
        </div>

        <div className="bg-theme-secondary border border-emerald-500/30 p-5 rounded-xl text-center bg-gradient-to-tr from-theme-secondary to-emerald-950/20 shadow-theme-main">
          <p className="text-[10px] font-mono text-[#34D399] uppercase tracking-widest font-extrabold">Remediation SLA Ratio</p>
          <p className="text-3xl font-extrabold text-[#34D399] font-mono mt-1">{resolutionRate}%</p>
          <p className="text-[10px] text-emerald-400 mt-1.5 font-bold uppercase">Succeeding Standard Limits</p>
        </div>
      </div>

      {/* 2. BAR CHART GRID */}
      <h3 className="text-sm font-bold text-theme-main mb-4 uppercase tracking-wider font-mono">Civic Category Sinks</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Category lists card */}
        <div className="bg-theme-secondary border border-theme-main p-5 rounded-2xl flex flex-col justify-between shadow-theme-main">
          <div>
            <h4 className="text-xs font-bold text-theme-main mb-4">Total Incidents Raised vs Resolved</h4>
            <div className="flex flex-col gap-4">
              {categoryStats.map((stat) => (
                <div key={stat.name} className="text-left font-sans text-xs">
                  <div className="flex justify-between font-medium text-theme-secondary mb-1">
                    <span>{stat.name} ({stat.count})</span>
                    <span className="font-mono text-[10px] font-bold text-[#21D4FD]">{stat.solved} Solved ({stat.rate}%)</span>
                  </div>
                  <div className="w-full h-2 bg-theme-tertiary rounded-full overflow-hidden relative">
                    <div
                      className="absolute left-0 top-0 h-full bg-[#1EA7C4]/35"
                      style={{ width: `${stat.count > 0 ? (stat.count / total) * 100 : 0}%` }}
                    ></div>
                    <div
                      className="absolute left-0 top-0 h-full bg-[#34D399]"
                      style={{ width: `${stat.count > 0 ? (stat.solved / total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic trends visual graph */}
        <div className="bg-theme-secondary border border-theme-main p-5 rounded-2xl flex flex-col justify-between shadow-theme-main">
          <div>
            <h4 className="text-xs font-bold text-theme-muted uppercase tracking-wider font-mono mb-2">Response Velocity Distributions</h4>
            <p className="text-[11px] text-theme-muted leading-normal mb-4">
              Daily response averages measured from citizen timestamp registration to official administrative close auditing.
            </p>

            <div className="bg-theme-tertiary rounded-xl p-4 border border-theme-main flex items-end justify-between h-48 gap-3 pt-6">
              {(() => {
                // Compute real response velocity by day-of-week from resolved issues
                const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const dayTotals: Record<number, { totalHrs: number; count: number }> = {};
                for (let d = 0; d < 7; d++) dayTotals[d] = { totalHrs: 0, count: 0 };
                
                issues.filter(i => i.status === IssueStatus.RESOLVED && i.resolvedAt).forEach(issue => {
                  const created = new Date(issue.createdAt);
                  const resolved = new Date(issue.resolvedAt!);
                  const hrs = Math.max(1, Math.round((resolved.getTime() - created.getTime()) / (1000 * 60 * 60)));
                  const dayOfWeek = created.getDay();
                  dayTotals[dayOfWeek].totalHrs += hrs;
                  dayTotals[dayOfWeek].count += 1;
                });

                const chartData = [1, 2, 3, 4, 5, 6, 0].map(d => ({
                  label: dayNames[d],
                  hr: dayTotals[d].count > 0 ? Math.round(dayTotals[d].totalHrs / dayTotals[d].count) : 0
                }));
                const maxHr = Math.max(...chartData.map(d => d.hr), 1);

                return chartData.map((item) => (
                <div key={item.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[9px] font-mono text-[#21D4FD] leading-none mb-1">{item.hr}h</span>
                  <div
                    className="w-full bg-gradient-to-t from-[#21D4FD] to-[#B721FF] rounded-t-md transition-all duration-500"
                    style={{ height: `${(item.hr / maxHr) * 100}%`, minHeight: item.hr > 0 ? '4px' : '0' }}
                  ></div>
                  <span className="text-[10px] text-theme-muted font-mono leading-none mt-1">{item.label}</span>
                </div>
              ));
              })()}
            </div>
          </div>
        </div>

      </div>

      {/* 3. GEMINI COMMUNITY INSIGHTS SECTION */}
      <div className="bg-gradient-to-b from-theme-secondary to-theme-tertiary border border-theme-main p-6 rounded-2xl shadow-theme-main">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-1.5 rounded-full bg-[#21D4FD]/15 border border-[#21D4FD]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#21D4FD] animate-pulse" />
              <span className="text-[10px] font-mono font-extrabold text-[#21D4FD] uppercase tracking-wider">Gemini Civic LLM Analytics Model</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-theme-main">Gemini Preventive Infrastructure Patterns</h3>
            <p className="text-xs text-theme-muted">AI parses the localized database coordinate matrix to flag critical repeat damage, drainage hazards, or pipeline failures.</p>
          </div>

          <button
            onClick={handleRegenerateInsights}
            disabled={loadingInsights}
            className={`px-4 py-2 bg-[#21D4FD] hover:bg-[#21D4FD]/90 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loadingInsights ? "opacity-60 cursor-not-allowed" : ""
            }`}
            id="btn-regenerate-insights"
          >
            {loadingInsights ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <RefreshCw className="w-4 h-4 text-slate-950" />
            )}
            <span>Regenerate Insights Grid</span>
          </button>
        </div>

        {/* Gemini computed boxes */}
        {loadingInsights ? (
          <div className="p-12 border border-theme-main bg-theme-tertiary/10 rounded-xl text-center text-xs text-theme-muted font-mono py-16 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-theme-muted" />
            <span>AI analyzing geographic coordination trends...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins, index) => (
              <div key={ins.id || `insight_${ins.title || index}`} className="border border-theme-main bg-theme-tertiary/20 rounded-xl p-5 text-left flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-mono text-[#FFB547] bg-[#FFB547]/10 px-2 py-0.5 rounded border border-[#FFB547]/20 uppercase">
                      {ins.category} • {ins.location}
                    </span>
                    <span className="text-[9px] text-[#21D4FD] font-mono font-bold uppercase tracking-wider bg-[#21D4FD]/10 px-1.5 rounded">
                      Confidence: {Math.round(ins.confidence * 100)}%
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-theme-main mb-2 tracking-wide leading-tight">{ins.title}</h4>
                  <p className="text-xs text-theme-secondary leading-relaxed mb-4">{ins.insight}</p>
                </div>

                <div className="pt-4 border-t border-theme-main bg-theme-tertiary/40 p-3 rounded-lg border border-theme-main">
                  <p className="text-[9px] font-mono text-theme-muted font-bold uppercase tracking-widest leading-none mb-1">Preventive Administrative Advice</p>
                  <p className="text-xs text-theme-secondary leading-normal">{ins.suggestedAction}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
