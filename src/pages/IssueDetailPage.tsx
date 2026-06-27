/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Issue, IssueStatus, IssueSeverity, User, Verification } from "../types";
import { dbService } from "../services/db";
import { TRANSLATIONS } from "../i18n/translations";
import { getCategoryFallbackImage } from "./LandingPage";
import { Check, AlertTriangle, MessageSquare, ThumbsUp, ThumbsDown, Calendar, Landmark, MapPin, Award, CheckCircle, ShieldAlert, Sparkles, Loader2, ArrowLeft, RefreshCw, Lock } from "lucide-react";
import { getAuthHeaders } from "../lib/api";
import { getAppMode } from "../services/appMode";

interface IssueDetailPageProps {
  issueId: string;
  currentUser: User;
  onNavigate: (view: string) => void;
  language: "en" | "hi";
}

export default function IssueDetailPage({
  issueId,
  currentUser,
  onNavigate,
  language
}: IssueDetailPageProps) {
  const [issue, setIssue] = useState<Issue | undefined>(undefined);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVoteType, setUserVoteType] = useState<"confirm" | "dispute" | undefined>(undefined);
  
  // Verification input
  const [comment, setComment] = useState("");
  const [generalComment, setGeneralComment] = useState("");
  const [votedSuccess, setVotedSuccess] = useState(false);

  // Admin comparative resolution
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [selectedAfterPhoto, setSelectedAfterPhoto] = useState<string | null>(null);
  const [afterPhotoBase64, setAfterPhotoBase64] = useState<string | null>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [adminActionActive, setAdminActionActive] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  
  const dict = TRANSLATIONS[language];

  const loadData = () => {
    const isObj = dbService.getIssue(issueId);
    setIssue(isObj);
    if (isObj) {
      setVerifications(dbService.getVerificationsForIssue(issueId));
      const myVote = dbService.hasUserVerified(issueId, currentUser.id);
      setHasVoted(myVote.verified);
      setUserVoteType(myVote.type);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh check
    window.addEventListener("civiclens_user_changed", loadData);
    window.addEventListener("civiclens_data_changed", loadData);
    return () => {
      window.removeEventListener("civiclens_user_changed", loadData);
      window.removeEventListener("civiclens_data_changed", loadData);
    };
  }, [issueId, currentUser.id]);

  if (!issue) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-slate-500 font-sans min-h-[calc(100vh-140px)]">
        <ArrowLeft className="w-5 h-5 mx-auto mb-4 cursor-pointer text-slate-400 hover:text-white" onClick={() => onNavigate("map")} />
        <p className="text-sm">Ticket ID {issueId} could not be located in our municipal command indexing system.</p>
        <button onClick={() => onNavigate("map")} className="mt-4 px-4 py-2 bg-[#122338] text-xs font-bold rounded-lg border border-slate-850">
          Return to map grid
        </button>
      </div>
    );
  }

  // Handle peer checking submission
  const handleVerify = (type: "confirm" | "dispute") => {
    const isSigned = localStorage.getItem("civiclens_is_signed_in") === "true";
    if (!isSigned) {
      alert("Please sign in to confirm status.");
      return;
    }
    const ok = dbService.verifyIssue(issue.id, currentUser.id, type, comment);
    if (ok) {
      setComment("");
      setVotedSuccess(true);
      setTimeout(() => setVotedSuccess(false), 3000);
      loadData();
    }
  };

  const handlePostGeneralComment = () => {
    const isSigned = localStorage.getItem("civiclens_is_signed_in") === "true";
    if (!isSigned) {
      alert("Please sign in to publish commentary.");
      return;
    }
    if (!generalComment.trim()) return;
    const ok = dbService.addComment(issue.id, currentUser.id, generalComment);
    if (ok) {
      setGeneralComment("");
      loadData();
    }
  };

  // Admin Forensic Resolution Comparison action
  const handleAdminVerifyResolution = async () => {
    if (!selectedAfterPhoto) return;
    setIsComparing(true);

    try {
      const res = await fetch("/api/gemini/compare-before-after", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          beforeImageBase64: issue.evidence[0]?.url || "",
          afterImageBase64: afterPhotoBase64 || selectedAfterPhoto || "",
          adminNotes: adminNoteInput
        })
      });
      const data = await res.json();
      
      // Save changes on database
      const confidence = data.confidence !== undefined ? data.confidence : 100;
      const notes = data.notes || "Visual alignment confirmed completely. Issue fully cleared.";
      const isResolved = (data.resolved === true) && (confidence >= 75);
      const finalAnalysis = `[Gemini Verification - Confidence: ${confidence}%] ${notes}`;

      const updatedFields: Partial<Issue> = {
        status: isResolved ? IssueStatus.RESOLVED : IssueStatus.IN_PROGRESS,
        resolvedAt: isResolved ? new Date().toISOString() : undefined,
        resolutionDetails: {
          beforeImageUrl: issue.evidence[0]?.url || "",
          afterImageUrl: selectedAfterPhoto,
          adminNotes: adminNoteInput,
          resolvedAt: new Date().toISOString(),
          communityConfirmed: isResolved,
          geminiAnalysis: finalAnalysis
        }
      };

      if (isResolved) {
        // Store resolved photos
        updatedFields.evidence = [
          ...issue.evidence,
          { url: selectedAfterPhoto, type: "image" }
        ];
      }

      dbService.adminUpdateIssue(
        issue.id,
        updatedFields,
        isResolved 
          ? `Forensic visual resolution analysis completed by Gemini: '${finalAnalysis.slice(0, 100)}...'`
          : `AI verification failed (Confidence: ${confidence}%). Sent back for secondary inspection: '${notes.slice(0, 100)}...'`,
        adminNoteInput
      );

      setAdminActionActive(false);
      setSelectedAfterPhoto(null);
      setAdminNoteInput("");
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsComparing(false);
    }
  };

  const handleAdminReject = () => {
    if (!adminNoteInput.trim()) {
      alert("Please provide a rejection reason in the inspector comments field.");
      return;
    }
    dbService.adminUpdateIssue(
      issue.id,
      { status: IssueStatus.REJECTED },
      `Ticket administratively rejected: ${adminNoteInput}`,
      adminNoteInput
    );
    setAdminNoteInput("");
    loadData();
  };

  const handleAdminReopen = () => {
    if (!reopenReason.trim()) {
      alert("Please provide a reason for reopening this ticket.");
      return;
    }
    dbService.adminUpdateIssue(
      issue.id,
      { status: IssueStatus.REOPENED },
      `Ticket reopened by administration: ${reopenReason}`,
      reopenReason
    );
    setReopenReason("");
    loadData();
  };

  const statusTimeline = dbService.getStatusUpdatesForIssue(issue.id);

  // Styling helpers
  const sevColors = {
    [IssueSeverity.LOW]: "bg-blue-500/10 text-blue-400 border-blue-500/15",
    [IssueSeverity.MEDIUM]: "bg-[#FFB547]/10 text-[#FFB547] border-[#FFB547]/15",
    [IssueSeverity.HIGH]: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    [IssueSeverity.CRITICAL]: "bg-[#FF6B6B]/15 text-[#FF6B6B] border-[#FF6B6B]/30 animate-pulse"
  };

  const statusLabels = {
    [IssueStatus.NEW]: "New Reporting",
    [IssueStatus.VERIFIED]: "Community Confirmed",
    [IssueStatus.ASSIGNED]: "Assigned to Department",
    [IssueStatus.IN_PROGRESS]: "Repair Unit Dispatched",
    [IssueStatus.RESOLVED]: "Forensic Resolved Check",
    [IssueStatus.REOPENED]: "Reopened Case",
    [IssueStatus.REJECTED]: "Administratively Overruled"
  };

  const isSigned = localStorage.getItem("civiclens_is_signed_in") === "true";

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10 text-left bg-theme-main text-theme-main font-sans pb-24">
      {/* 1. HEADER CONTROLS */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => onNavigate("map")}
          className="px-3 py-1.5 rounded-lg border border-theme-main bg-theme-secondary text-theme-secondary hover:text-theme-main hover:border-cyan-500/30 transition-all text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Grid Map</span>
        </button>

        <span className="text-xs font-mono font-bold text-theme-muted bg-theme-tertiary px-2.5 py-1 border border-theme-main rounded">
          TICKET: {issue.id}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: VISUAL GALLERIES & INFRASTRUCTURE DATA */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-theme-secondary border border-theme-main p-5 rounded-2xl shadow-theme-main">
            
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[10px] font-mono font-bold text-[#21D4FD] bg-[#21D4FD]/15 px-2.5 py-0.5 rounded leading-none uppercase tracking-wide">
                {issue.category}
              </span>
              <span className={`text-[9px] font-semibold font-mono tracking-wider px-2 py-0.5 border rounded uppercase ${sevColors[issue.severity]}`}>
                {issue.severity}
              </span>
              {issue.location.isApproximate && (
                <span className="text-[9px] text-[#FFB547] bg-[#FFB547]/10 font-mono border border-[#FFB547]/15 px-1.5 py-0.5 rounded leading-none">
                  Approx Location Privacy Blur Enabled
                </span>
              )}
            </div>

            <h1 className="font-sans font-extrabold text-lg sm:text-2xl text-theme-main tracking-tight leading-tight mb-4">
              {issue.title}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-theme-main py-4 bg-theme-tertiary px-3 rounded-lg text-theme-secondary text-xs mb-6">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#21D4FD]" />
                <span>📍 {issue.landmark || issue.address}</span>
              </p>
              <p className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#FFB547]" />
                <span>🏢 {issue.assignedDepartment}</span>
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#34D399]" />
                <span>📅 Reported {new Date(issue.createdAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#21D4FD]" />
                <span>👥 Creator: {issue.createdByName || "Community Inspector"}</span>
              </p>
            </div>

            <div className="mb-6 text-left">
              <h4 className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider mb-2">Original Citizen Complaint Details</h4>
              <p className="text-xs sm:text-sm text-[#F4F8FC] leading-relaxed italic bg-slate-950/40 p-3 rounded-lg border border-slate-850/60">
                "{issue.originalDescription}"
              </p>
            </div>

            {/* Photo comparison containers */}
            <h4 className="text-[10px] font-mono uppercase text-theme-muted font-bold tracking-wider mb-2">Evidence photography</h4>
            <div className={`grid ${issue.status === IssueStatus.RESOLVED ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
              <div className="bg-theme-main rounded-xl border border-theme-main overflow-hidden relative group">
                <img
                  src={issue.evidence[0].url}
                  alt="Incident Visual Evidence"
                  className="w-full h-44 sm:h-64 object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getCategoryFallbackImage(issue.category);
                  }}
                />
                <span className="absolute bottom-3 left-3 bg-[#FF6B6B] text-white text-[9px] font-mono uppercase font-bold tracking-widest px-2 py-0.5 rounded shadow-sm">
                  Baseline (Before State)
                </span>
              </div>

              {issue.status === IssueStatus.RESOLVED && issue.evidence.length > 1 && (
                <div className="bg-theme-main rounded-xl border border-theme-main overflow-hidden relative group">
                  <img
                    src={issue.evidence[1].url}
                    alt="Remedied Forensic Verification"
                    className="w-full h-44 sm:h-64 object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getCategoryFallbackImage(issue.category);
                    }}
                  />
                  <span className="absolute bottom-3 left-3 bg-emerald-500 text-slate-950 text-[9px] font-mono uppercase font-bold tracking-widest px-2 py-0.5 rounded shadow-sm">
                    Remedied (After Case)
                  </span>
                </div>
              )}
            </div>

            {/* Explainable Priority Score dial */}
            <div className="mt-6 border border-theme-main p-4 rounded-xl bg-theme-tertiary/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-theme-main mb-1">Duo-Verification Priority Velocity Score</p>
                <p className="text-[11px] text-theme-secondary leading-tight max-w-sm">
                  Weighted metric scoring algorithm considering AI raw severity, density coordinate risk models, and active neighborhood confirmations.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="relative w-16 h-16 rounded-full border-4 border-theme-main flex items-center justify-center bg-theme-main shadow-inner">
                  <div className="text-center">
                    <p className="text-sm font-extrabold text-[#21D4FD] font-mono leading-none">{Math.round(issue.priorityScore)}</p>
                    <p className="text-[7px] text-theme-muted uppercase tracking-wider font-mono mt-0.5">Grade</p>
                  </div>
                  <div
                    className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-transparent transition-all duration-500"
                    style={{
                      borderColor: issue.priorityScore > 75 ? "#FF6B6B" : issue.priorityScore > 45 ? "#FFB547" : "#21D4FD",
                      transform: `rotate(${issue.priorityScore * 3.6}deg)`
                    }}
                  ></div>
                </div>

                <div className="text-left font-sans text-[10px]">
                  <p className="text-theme-main font-bold">Severity: {issue.severity.toUpperCase()}</p>
                  <p className="text-theme-secondary">{issue.verificationCount} neighborhood confirmations</p>
                </div>
              </div>
            </div>

          </div>

          {/* 2. CHRONOLOGICAL GRAPHICS TIMELINE UPDATE */}
          <div className="bg-theme-secondary border border-theme-main p-5 rounded-2xl shadow-theme-main">
            <h3 className="font-sans font-bold text-sm sm:text-base text-theme-main mb-4">Chronological Administrative Status Timeline</h3>
            <div className="relative border-l border-theme-main pl-4 ml-2 flex flex-col gap-6">
              
              {statusTimeline.map((item, index) => {
                const isSystem = item.updatedBy === "system";
                const isLatest = index === statusTimeline.length - 1;

                return (
                  <div key={item.id} className="relative text-left">
                    {/* Circle Node indicator */}
                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 bg-slate-950 ${
                      item.newStatus === IssueStatus.RESOLVED
                        ? "border-[#34D399]"
                        : item.newStatus === IssueStatus.REJECTED
                        ? "border-red-400"
                        : "border-[#21D4FD]"
                    }`}>
                      {isLatest && (
                        <span className="absolute -inset-1 rounded-full border border-[#21D4FD]/60 animate-ping"></span>
                      )}
                    </div>

                    <div className="flex justify-between items-start gap-4 mb-1">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#9FB2C8] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">
                          {statusLabels[item.newStatus] || item.newStatus}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-2">by {item.updatedByName}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-[#9FB2C8] leading-relaxed font-sans">{item.publicMessage}</p>
                    {item.internalNote && currentUser.role === "admin" && (
                      <div className="mt-1.5 p-2 bg-[#FFB547]/5 border border-[#FFB547]/20 rounded text-[10px] font-mono text-[#FFB547]">
                        Internal Admin Memo: {item.internalNote}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. NEIGHBORHOOD VOICE & DISCUSSIONS */}
          <div className="bg-theme-secondary border border-theme-main p-5 rounded-2xl shadow-theme-main">
            <div className="flex items-center justify-between mb-4 border-b border-theme-main pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <h3 className="font-sans font-bold text-sm sm:text-base text-theme-main">Neighbor Comments & Discussion Grid</h3>
              </div>
              <span className="text-[10px] font-mono text-[#21D4FD] bg-[#21D4FD]/10 border border-[#21D4FD]/20 px-2.5 py-0.5 rounded-full uppercase font-bold">
                {verifications.filter(v => v.comment).length} Comments
              </span>
            </div>

            {/* Existing comments stream list */}
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {verifications.filter(v => v.comment).length === 0 ? (
                <div className="text-center py-6 text-theme-muted text-xs">
                  <p>No neighboring citizens have added comments to this audit ticket yet.</p>
                  <p className="mt-1 text-[10px] text-theme-muted">Be the first to confirm status or add a voice memo in the panel below!</p>
                </div>
              ) : (
                verifications.filter(v => v.comment).map((v) => (
                  <div key={v.id} className="p-3.5 bg-theme-tertiary/60 border border-theme-main rounded-xl text-left hover:border-cyan-500/30 transition-all">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-theme-main text-xs">{v.username}</span>
                        <span className={`text-[8.5px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                          v.type === "confirm" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/15" : "bg-red-500/10 text-red-400 border-red-500/15"
                        }`}>
                          {v.type === "confirm" ? "Verified" : "Disputed"}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-theme-muted">{new Date(v.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                    </div>
                    <p className="text-theme-secondary leading-relaxed text-xs">"{v.comment}"</p>
                  </div>
                ))
              )}
            </div>

            {/* Quick general commentary poster */}
            <div className="mt-5 pt-4 border-t border-theme-main">
              <label className="text-[10px] font-mono font-bold text-theme-secondary block mb-1.5 uppercase tracking-wide">Publish General Commentary Note</label>
              {!isSigned ? (
                <div className="p-4 bg-theme-tertiary/40 border border-dashed border-theme-main rounded-2xl text-center flex flex-col items-center gap-2">
                  <Lock className="w-5 h-5 text-cyan-500 animate-pulse" />
                  <p className="text-[11px] text-theme-secondary leading-normal">
                    You must be signed in to post comments.
                  </p>
                  <button
                    onClick={() => onNavigate("auth")}
                    className="mt-1 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                  >
                    Sign In to Comment
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Share a general comment or coordinate check with neighbors..."
                    value={generalComment}
                    onChange={(e) => setGeneralComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handlePostGeneralComment();
                    }}
                    className="flex-1 bg-theme-main border border-theme-main rounded-xl px-3 py-2 text-xs text-theme-main placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                  />
                  <button
                    onClick={handlePostGeneralComment}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white text-xs font-mono font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    Post Comment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PEER AUDIT & ADMINISTRATIVE CONTROLS */}
        <div className="flex flex-col gap-6">
          
          {/* PEER-AUDITING CARD */}
          {issue.status !== IssueStatus.RESOLVED && issue.status !== IssueStatus.REJECTED && (
            <div className="bg-theme-secondary border border-theme-main p-5 rounded-2xl shadow-theme-main">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-[#21D4FD]" />
                <h3 className="font-sans font-bold text-sm sm:text-base text-theme-main">Democratic Peer Auditing</h3>
              </div>

              <p className="text-xs text-theme-secondary mb-4 leading-normal">
                Check this reported failure. If the issue physically exists at the designated coord parameters, verify it as active. If it belongs elsewhere or is resolved, dispute it.
              </p>

              {!isSigned ? (
                <div className="p-4 bg-theme-tertiary/40 border border-dashed border-theme-main rounded-2xl text-center flex flex-col items-center gap-2">
                  <Lock className="w-5 h-5 text-cyan-500 animate-pulse" />
                  <p className="text-[11px] text-theme-secondary leading-normal">
                    You must be signed in to verify this reported hazard.
                  </p>
                  <button
                    onClick={() => onNavigate("auth")}
                    className="mt-1 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                  >
                    Sign In to Verify
                  </button>
                </div>
              ) : hasVoted ? (
                <div className="p-3 bg-theme-tertiary border border-theme-main rounded-xl text-center">
                  <p className="text-xs font-bold text-theme-main mb-1">✓ Verification Registered</p>
                  <p className="text-[10px] text-theme-muted">
                    You have verified this issue as <span className="font-bold text-[#21D4FD] uppercase">{userVoteType}</span>. You will receive +10 Civic Points when this issue is resolved!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <textarea
                    rows={2}
                    placeholder="Provide neighborhood notes or visual confirmations here..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full mt-1 p-2 bg-theme-tertiary border border-theme-main rounded-lg text-xs text-theme-main placeholder:text-theme-muted"
                  />

                  {votedSuccess && (
                    <div className="p-2 border border-emerald-500/20 text-emerald-400 bg-emerald-500/5 text-center text-[10px] uppercase font-bold tracking-wider rounded font-mono">
                      ✓ Vote Logged! Points pending resolution.
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleVerify("confirm")}
                      className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer hover:opacity-90 shadow-md"
                      id="btn-confirm-peer"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{dict.verifyConfirm}</span>
                    </button>
                    <button
                      onClick={() => handleVerify("dispute")}
                      className="flex-1 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer hover:opacity-90 shadow-md"
                      id="btn-dispute-peer"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>{dict.verifyDispute}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DUAL MODE DISCLAIMER PANEL */}
          <div className="p-4 bg-[#FFB547]/5 border border-[#FFB547]/20 rounded-xl">
            <ShieldAlert className="w-5 h-5 text-[#FFB547] mb-2" />
            <p className="text-[10px] leading-relaxed text-[#FFB547] font-sans">
              {dict.disclaimer}
            </p>
          </div>

          {/* OFFICIAL HIGH-FIDELITY RESOLUTION FORENSIC PANEL (ADMIN ROLE REVEAL) */}
          {currentUser.role === "admin" && issue.status !== IssueStatus.RESOLVED && issue.status !== IssueStatus.REJECTED && (
            <div className="bg-theme-secondary border border-emerald-500/30 p-5 rounded-2xl shadow-theme-main">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#34D399]" />
                <h3 className="font-sans font-bold text-sm sm:text-base text-theme-main">Forensic Repair Dispatch</h3>
              </div>

              <p className="text-xs text-theme-secondary mb-4">
                Administrators upload repaired visual evidence and call the Gemini Comparative Model to verify complete debris clearance and work standards.
              </p>

              {isComparing ? (
                <div className="p-4 rounded-xl border border-dashed border-[#34D399]/40 bg-theme-tertiary/40 text-center flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-[#34D399] animate-spin" />
                  <span className="text-xs text-[#34D399] font-mono font-bold animate-pulse">Gemini forensic analysis compiling before-and-after checks...</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="text-left">
                    <label className="text-[9px] font-mono text-theme-muted uppercase tracking-widest font-bold block mb-1">
                      {getAppMode() === "demo" ? "Upload resolution photo or select a demo preset:" : "Upload resolution photo:"}
                    </label>
                    <input
                      ref={afterFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) { alert("File exceeds 10MB."); return; }
                        const reader = new FileReader();
                        reader.onload = () => {
                          setAfterPhotoBase64(reader.result as string);
                          setSelectedAfterPhoto(URL.createObjectURL(file));
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => afterFileInputRef.current?.click()}
                      className="w-full mb-2 py-2 border-2 border-dashed border-theme-main hover:border-[#34D399]/40 rounded-lg text-xs text-theme-secondary font-semibold cursor-pointer transition-all bg-theme-tertiary/30"
                    >
                      {afterPhotoBase64 ? '✓ Photo uploaded — click to change' : '📷 Upload Resolution Photo'}
                    </button>
                    {getAppMode() === "demo" && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div
                          onClick={() => setSelectedAfterPhoto("https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&q=80&w=300")}
                          className={`p-1.5 border rounded-lg cursor-pointer transition text-center ${selectedAfterPhoto === "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&q=80&w=300" ? "border-[#34D399]" : "border-theme-main"}`}
                        >
                          <img src="https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&q=80&w=200" alt="Repair Clean Preset" className="h-10 w-full object-cover rounded" />
                          <span className="text-[9px] text-theme-muted mt-1 block">Clean Road Asphalt</span>
                        </div>

                        <div
                          onClick={() => setSelectedAfterPhoto("https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=300")}
                          className={`p-1.5 border rounded-lg cursor-pointer transition text-center ${selectedAfterPhoto === "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=300" ? "border-[#34D399]" : "border-theme-main"}`}
                        >
                          <img src="https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=200" alt="Repair Pipe Preset" className="h-10 w-full object-cover rounded" />
                          <span className="text-[9px] text-theme-muted mt-1 block">Remedied Utility Vault</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[9px] font-mono text-theme-muted uppercase font-bold block mb-1">Inspector Repair Comments</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Cleared pipeline blockages, asphalt layer hot-sealed..."
                      value={adminNoteInput}
                      onChange={(e) => setAdminNoteInput(e.target.value)}
                      className="w-full p-2 bg-theme-tertiary border border-theme-main rounded text-xs text-theme-main placeholder:text-theme-muted"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleAdminReject}
                      className="flex-1 py-2.5 bg-red-950/20 hover:bg-red-900/30 text-red-500 hover:text-red-400 font-extrabold text-xs uppercase tracking-wider rounded-lg border border-red-500/20 transition cursor-pointer"
                    >
                      Reject Ticket
                    </button>
                    <button
                      onClick={handleAdminVerifyResolution}
                      disabled={!selectedAfterPhoto}
                      className={`flex-1 py-2.5 rounded-lg text-slate-950 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 ${
                        selectedAfterPhoto ? "bg-[#34D399] hover:bg-[#34D399]/90 cursor-pointer" : "bg-theme-tertiary text-theme-muted opacity-65 cursor-not-allowed"
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Run Forensic Resolve</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HISTORICAL FAILED VERIFICATION ANALYSIS REPORT (SENT BACK FOR SECONDARY INSPECTION) */}
          {issue.status !== IssueStatus.RESOLVED && issue.resolutionDetails && issue.resolutionDetails.communityConfirmed === false && (
            <div className="bg-theme-secondary border border-red-500/30 p-5 rounded-2xl shadow-theme-main text-left mb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-500/15 border border-red-500/20 text-red-500 text-[9px] font-mono uppercase tracking-widest font-extrabold mb-3">
                AI Verification Failed — Sent back for Secondary Inspection
              </div>
              <h4 className="text-sm font-bold text-theme-main mb-2">Audit Verification Report</h4>
              <p className="text-xs text-theme-secondary leading-relaxed mb-3">
                The uploaded resolution photo did not pass the AI verification check. The ticket status remains/has been reverted to <strong>In Progress</strong> and sent back for secondary inspection.
              </p>
              <div className="text-xs text-red-400 font-mono bg-theme-tertiary/40 p-3 rounded-lg border border-theme-main leading-relaxed">
                {issue.resolutionDetails.geminiAnalysis || "Resolution failed to verify. Manual crew validation required."}
              </div>
            </div>
          )}

          {/* HISTORICAL RESOLVED VERIFICATION ANALYSIS REPORT (IF CLOSED) */}
          {issue.status === IssueStatus.RESOLVED && (
            <div className="bg-theme-secondary border border-emerald-500/30 p-5 rounded-2xl shadow-theme-main text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/20 text-[#34D399] text-[9px] font-mono uppercase tracking-widest font-extrabold mb-3">
                Audit Clearance Report
              </div>
              <h4 className="text-sm font-bold text-theme-main mb-2">{dict.beforeAfter}</h4>
              <p className="text-xs text-theme-secondary leading-relaxed">
                Repaired photograph visual alignment matching verified successfully. Final verification notes:
              </p>
              <p className="text-xs text-[#34D399] font-mono bg-theme-tertiary/40 p-3 rounded-lg border border-theme-main mt-3 leading-relaxed">
                {issue.resolutionDetails?.geminiAnalysis || "A digital comparative evaluation validates structural clearance. No secondary road flow hazards identified."}
              </p>
            </div>
          )}

          {currentUser.role === "admin" && (issue.status === IssueStatus.RESOLVED || issue.status === IssueStatus.REJECTED) && (
            <div className="bg-theme-secondary border border-red-500/30 p-5 rounded-2xl shadow-theme-main text-left">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-5 h-5 text-red-500" />
                <h3 className="font-sans font-bold text-sm sm:text-base text-theme-main">Administrative Actions</h3>
              </div>
              <p className="text-xs text-theme-secondary mb-4">
                Reopen this case if municipal audit parameters or neighboring citizen peer disputes indicate that repairs were incomplete or insufficient.
              </p>
              <div className="flex flex-col gap-3">
                <textarea
                  rows={2}
                  placeholder="Provide a mandatory reason for reopening this ticket..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full p-2 bg-theme-tertiary border border-theme-main rounded text-xs text-theme-main placeholder:text-theme-muted"
                />
                <button
                  onClick={handleAdminReopen}
                  className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-95 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reopen Incident Ticket</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
