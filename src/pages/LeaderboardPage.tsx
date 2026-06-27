/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User } from "../types";
import { useRepository } from "../services/repository";
import { TRANSLATIONS } from "../i18n/translations";
import { Trophy, Crown, Medal, Star, TrendingUp, Award, ArrowLeft, ArrowUp, Sparkles } from "lucide-react";

interface LeaderboardPageProps {
  onNavigate: (view: string) => void;
  language: "en" | "hi";
  currentUser: User;
}

export default function LeaderboardPage({ onNavigate, language, currentUser }: LeaderboardPageProps) {
  const repository = useRepository();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const dict = TRANSLATIONS[language];

  useEffect(() => {
    repository.getUsers()
      .then(usersMap => {
        // Filter out admin and staff roles, keep only citizens
        const citizens = Object.values(usersMap).filter(u => u.role === "citizen");
        // Sort descending by civicScore
        const sorted = citizens.sort((a, b) => b.civicScore - a.civicScore);
        setUsersList(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load users for leaderboard:", err);
        setLoading(false);
      });
  }, [repository]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center font-mono text-xs text-cyan-400 gap-3">
        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        <span>Retrieving leaderboard standings...</span>
      </div>
    );
  }

  // Top 3 for the podium
  const podiumUsers = usersList.slice(0, 3);

  // Position order for podium display (2nd, 1st, 3rd)
  const podiumOrder = [];
  if (podiumUsers[1]) podiumOrder.push({ user: podiumUsers[1], rank: 2, color: "text-slate-350 border-slate-700/55 bg-slate-900/40", badgeColor: "bg-slate-300/10 text-slate-300", glow: "shadow-slate-500/5" });
  if (podiumUsers[0]) podiumOrder.push({ user: podiumUsers[0], rank: 1, color: "text-amber-400 border-amber-500/55 bg-amber-950/20 scale-105 sm:scale-110", badgeColor: "bg-amber-400/10 text-amber-400", glow: "shadow-amber-400/10 ring-2 ring-amber-400/25" });
  if (podiumUsers[2]) podiumOrder.push({ user: podiumUsers[2], rank: 3, color: "text-amber-600 border-amber-700/45 bg-amber-950/5", badgeColor: "bg-amber-600/10 text-amber-600", glow: "shadow-amber-700/5" });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 font-sans min-h-[calc(100vh-140px)] text-left animate-fade-in">
      
      {/* Back to Home Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => onNavigate("landing")}
          className="p-2 border border-theme-main bg-theme-secondary hover:bg-theme-tertiary text-theme-secondary hover:text-theme-main rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold uppercase"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </button>
        <span className="text-xs text-theme-muted font-mono">/ community-leaderboard</span>
      </div>

      {/* Header text */}
      <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6 border-b border-theme-main pb-8">
        <div>
          <h1 className="font-sans font-extrabold text-3xl sm:text-4xl tracking-tight text-theme-main flex items-center justify-center sm:justify-start gap-2.5">
            <Trophy className="w-9 h-9 text-amber-400 drop-shadow-md" />
            <span>{language === "hi" ? "नागरिक लीडरबोर्ड" : "Civic Leaderboard"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-theme-secondary mt-2 max-w-xl">
            {language === "hi" 
              ? "हमारे शीर्ष पड़ोस चैंपियनों और हाइपरलोकल समस्या समाधानकर्ताओं का सम्मान।" 
              : "Celebrating our top neighborhood champions and hyperlocal problem solvers who report, verify, and resolve issues."}
          </p>
        </div>
        
        {/* Rule Banner Card */}
        <div className="bg-gradient-to-tr from-cyan-950/20 to-indigo-950/20 border border-cyan-500/25 p-4 rounded-2xl max-w-sm text-left shadow-md flex gap-3 items-start backdrop-blur-sm">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono mb-1">Monthly Reward Pool</h4>
            <p className="text-[10px] text-theme-secondary leading-normal">
              {language === "hi"
                ? "शीर्ष 3 नागरिकों को उनके प्रदर्शन के आधार पर मासिक बोनस अंक मिलते हैं: प्रथम स्थान (+150 अंक), द्वितीय (+100 अंक), और तृतीय (+50 अंक)!"
                : "The top 3 citizens on the monthly leaderboard are awarded bonus points (1st: +150, 2nd: +100, 3rd: +50) based on their civic performance at the end of each month!"}
            </p>
          </div>
        </div>
      </div>

      {/* 1. PODIUM GRID */}
      {podiumUsers.length > 0 && (
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto px-4">
            {podiumOrder.map(({ user, rank, color, badgeColor, glow }) => {
              const isCurrentUser = user.id === currentUser.id;
              return (
                <div 
                  key={user.id} 
                  className={`border rounded-3xl p-5 flex flex-col items-center text-center transition-all duration-300 relative shadow-lg ${color} ${glow} ${
                    rank === 1 ? "order-1 md:order-2 my-4 md:my-0" : rank === 2 ? "order-2 md:order-1" : "order-3"
                  }`}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-slate-900 border border-theme-main flex items-center justify-center shadow-md">
                    {rank === 1 ? (
                      <Crown className="w-6 h-6 text-amber-400 drop-shadow-sm" />
                    ) : rank === 2 ? (
                      <Medal className="w-5 h-5 text-slate-350" />
                    ) : (
                      <Medal className="w-5 h-5 text-amber-700" />
                    )}
                  </div>

                  <div className="relative mt-2 mb-4">
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className={`w-16 h-16 rounded-2xl object-cover border-2 shadow-inner ${
                        rank === 1 ? "border-amber-400" : rank === 2 ? "border-slate-500" : "border-amber-700"
                      }`}
                    />
                    <span className="absolute -bottom-2 -right-2 px-1.5 py-0.5 text-[9px] font-mono font-black bg-slate-950 border border-theme-main rounded-md text-white">
                      #{rank}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-theme-main line-clamp-1 flex items-center gap-1">
                    {user.name}
                    {isCurrentUser && (
                      <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-1 py-0.5 rounded uppercase font-extrabold leading-none">You</span>
                    )}
                  </h3>
                  <span className="text-[10px] text-theme-muted font-mono truncate max-w-[150px]">@{user.email.split("@")[0]}</span>

                  <div className="mt-3 py-1.5 px-4 rounded-xl bg-slate-950/40 border border-theme-main w-full flex items-center justify-between font-mono">
                    <span className="text-[10px] uppercase text-theme-muted">Civic Score</span>
                    <span className="text-sm font-black text-theme-main">{user.civicScore}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 justify-center mt-4 min-h-[30px]">
                    {user.badges.slice(0, 2).map(b => (
                      <span key={b} className={`text-[8.5px] px-1.5 py-0.5 rounded font-mono font-bold leading-none ${badgeColor} border border-transparent`}>
                        {b}
                      </span>
                    ))}
                    {user.badges.length > 2 && (
                      <span className="text-[8.5px] px-1.5 py-0.5 rounded font-mono font-bold leading-none bg-slate-900 text-theme-muted">
                        +{user.badges.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. LEADERBOARD LIST TABLE */}
      <div className="bg-theme-secondary/90 border border-theme-main rounded-2xl shadow-theme-main overflow-hidden">
        <div className="p-4 border-b border-theme-main bg-theme-secondary flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-theme-muted">Rank Standings</span>
          <span className="text-[10px] text-theme-muted font-mono flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Updated live from municipal ledger</span>
          </span>
        </div>

        <div className="divide-y divide-slate-800/40 font-sans">
          <div className="grid grid-cols-12 gap-2 px-6 py-3 text-[10px] font-mono text-theme-muted uppercase font-bold bg-slate-950/20">
            <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
            <div className="col-span-6 sm:col-span-5">Citizen</div>
            <div className="col-span-4 sm:col-span-3">Badges & Titles</div>
            <div className="col-span-2 text-center sm:block hidden">Trust</div>
            <div className="col-span-4 sm:col-span-1 text-right">Civic Score</div>
          </div>

          {usersList.map((user, i) => {
            const rank = i + 1;
            const isCurrentUser = user.id === currentUser.id;
            return (
              <div 
                key={user.id} 
                className={`grid grid-cols-12 gap-2 px-6 py-4 items-center transition hover:bg-theme-tertiary/15 ${
                  isCurrentUser ? "bg-cyan-500/[0.02] border-l-2 border-l-cyan-500" : ""
                }`}
              >
                <div className="col-span-2 sm:col-span-1 flex justify-center font-mono">
                  {rank === 1 ? (
                    <span className="w-6 h-6 rounded-full bg-amber-400/10 border border-amber-500/40 text-amber-450 flex items-center justify-center font-bold text-xs">1</span>
                  ) : rank === 2 ? (
                    <span className="w-6 h-6 rounded-full bg-slate-500/10 border border-slate-500/40 text-slate-355 flex items-center justify-center font-bold text-xs">2</span>
                  ) : rank === 3 ? (
                    <span className="w-6 h-6 rounded-full bg-amber-700/10 border border-amber-700/40 text-amber-600 flex items-center justify-center font-bold text-xs">3</span>
                  ) : (
                    <span className="text-xs text-theme-secondary font-bold font-mono">#{rank}</span>
                  )}
                </div>

                <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-lg object-cover border border-theme-main shadow-sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-theme-main truncate flex items-center gap-1.5">
                      <span>{user.name}</span>
                      {isCurrentUser && (
                        <span className="text-[8px] font-mono bg-cyan-500/10 text-cyan-400 px-1 py-0.5 rounded uppercase font-bold leading-none">You</span>
                      )}
                    </p>
                    <p className="text-[10px] text-theme-muted font-mono truncate">@{user.email.split("@")[0]}</p>
                  </div>
                </div>

                <div className="col-span-4 sm:col-span-3 flex flex-wrap gap-1">
                  {user.badges.slice(0, 2).map(b => (
                    <span key={b} className="text-[8.5px] font-mono bg-theme-badge text-theme-badge border border-theme-main px-1.5 py-0.5 rounded leading-none">
                      {b}
                    </span>
                  ))}
                  {user.badges.length > 2 && (
                    <span className="text-[8.5px] font-mono bg-slate-900 text-slate-400 border border-theme-main px-1.5 py-0.5 rounded leading-none font-bold">
                      +{user.badges.length - 2}
                    </span>
                  )}
                  {user.badges.length === 0 && (
                    <span className="text-[9px] font-sans text-slate-500 italic">No badges unlocked</span>
                  )}
                </div>

                <div className="col-span-2 text-center sm:block hidden font-mono">
                  <span className={`text-xs font-black ${
                    user.trustScore >= 95 ? "text-emerald-400" : user.trustScore >= 90 ? "text-cyan-400" : "text-amber-500"
                  }`}>{user.trustScore}%</span>
                </div>

                <div className="col-span-4 sm:col-span-1 text-right font-mono font-black text-xs text-theme-main">
                  {user.civicScore}
                </div>
              </div>
            );
          })}

          {usersList.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500 font-sans">
              No citizen standings recorded.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
