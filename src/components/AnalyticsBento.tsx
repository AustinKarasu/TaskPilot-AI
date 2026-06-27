/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export interface AnalyticsBentoProps {
  totalTickets: number;
  resolvedTicketsCount: number;
  activeIncidentsCount: number;
  slaCompliancePercent: number;
}

export default function AnalyticsBento({
  totalTickets,
  resolvedTicketsCount,
  activeIncidentsCount,
  slaCompliancePercent,
}: AnalyticsBentoProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Card 1: Total Incidents */}
      <div className="p-4 bg-theme-secondary border border-theme-main rounded-2xl flex flex-col justify-between shadow-sm text-left">
        <span className="text-[10px] font-mono uppercase text-theme-muted font-bold block">
          Consolidated Incidents
        </span>
        <span className="text-2xl sm:text-3xl font-black text-theme-main font-mono mt-2">
          {totalTickets}
        </span>
        <span className="text-[9px] text-[#21D4FD] font-mono mt-1">★ Live telemetric count</span>
      </div>

      {/* Card 2: Solved Rate */}
      <div className="p-4 bg-theme-secondary border border-theme-main rounded-2xl flex flex-col justify-between shadow-sm text-left">
        <span className="text-[10px] font-mono uppercase text-theme-muted font-bold block">
          Restored Solved
        </span>
        <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-2">
          {resolvedTicketsCount}
        </span>
        <span className="text-[9px] text-emerald-400 font-mono mt-1">✓ Verified by Gemini AI</span>
      </div>

      {/* Card 3: Backlog */}
      <div className="p-4 bg-theme-secondary border border-theme-main rounded-2xl flex flex-col justify-between shadow-sm text-left">
        <span className="text-[10px] font-mono uppercase text-theme-muted font-bold block">
          Outstanding Backlog
        </span>
        <span className="text-2xl sm:text-3xl font-black text-amber-500 font-mono mt-2">
          {activeIncidentsCount}
        </span>
        <span className="text-[9px] text-amber-500 font-mono mt-1">⚠ Critical dispatch pending</span>
      </div>

      {/* Card 4: SLA Compliance */}
      <div className="p-4 bg-theme-secondary border border-theme-main rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-sm text-left">
        <span className="text-[10px] font-mono uppercase text-theme-muted font-bold block">
          SLA Compliance Rate
        </span>
        <span className="text-2xl sm:text-3xl font-black text-theme-main font-mono mt-2">
          {slaCompliancePercent}%
        </span>
        <div className="w-full bg-theme-tertiary h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full"
            style={{ width: `${slaCompliancePercent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
