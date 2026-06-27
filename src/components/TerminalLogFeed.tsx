/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Play, Activity } from "lucide-react";

export interface TerminalLogFeedProps {
  logs: string[];
  title?: string;
  subtitle?: string;
  footnote?: string;
  showActivityIcon?: boolean;
  maxHeightClass?: string;
}

export default function TerminalLogFeed({
  logs,
  title = "Live Command Console",
  subtitle,
  footnote,
  showActivityIcon = false,
  maxHeightClass = "max-h-[180px]",
}: TerminalLogFeedProps) {
  return (
    <div className="p-5 bg-theme-secondary border border-theme-main rounded-2xl flex flex-col justify-between h-full min-h-[280px]">
      <div>
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-theme-main/40">
          <div className="flex items-center gap-2">
            {showActivityIcon ? (
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : (
              <Play className="w-4 h-4 text-emerald-400 animate-pulse" />
            )}
            <h3 className="text-xs sm:text-sm font-bold text-theme-main uppercase font-sans tracking-wide">
              {title}
            </h3>
          </div>
          {showActivityIcon && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>}
        </div>
        {subtitle && (
          <p className="text-[10px] text-theme-muted mb-4 italic leading-tight">
            {subtitle}
          </p>
        )}
      </div>

      <div
        className={`flex-1 bg-slate-950 p-4 border border-theme-main/50 rounded-xl font-mono text-[10.5px] text-[#34D399] space-y-2.5 overflow-y-auto ${maxHeightClass} text-left`}
      >
        {logs.map((log, index) => (
          <div key={index} className="leading-snug break-all font-mono">
            <span className="text-slate-500 font-mono pr-1.5">❯</span>
            <span>{log}</span>
          </div>
        ))}
        {footnote && (
          <div className="text-[10px] text-slate-500 italic pt-1 font-mono">
            {footnote}
          </div>
        )}
      </div>
    </div>
  );
}
