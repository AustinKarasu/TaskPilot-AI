/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useRepository } from "../services/repository";
import { Issue, IssueStatus, IssueSeverity, User } from "../types";
import { Sparkles, ArrowRight, Shield, Play, RotateCcw, AlertTriangle, Check, Layers, ChevronDown, ChevronUp, UserCheck } from "lucide-react";

interface JudgeTourCompanionProps {
  onNavigate: (view: string) => void;
  language: "en" | "hi";
}

export default function JudgeTourCompanion({ onNavigate, language }: JudgeTourCompanionProps) {
  const repository = useRepository();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<number>(() => {
    const isCopilot = sessionStorage.getItem("civiclens_copilot_nav") === "true";
    sessionStorage.removeItem("civiclens_copilot_nav");
    if (!isCopilot) {
      localStorage.setItem("civiclens_demo_step", "1");
      return 1;
    }
    return parseInt(localStorage.getItem("civiclens_demo_step") || "1", 10);
  });
  const [latestCreatedId, setLatestCreatedId] = useState<string>("issue_101");

  useEffect(() => {
    localStorage.setItem("civiclens_demo_step", step.toString());
  }, [step]);

  // Find latest reported demo issue to ensure dynamic targeting
  useEffect(() => {
    repository.getIssues().then(issues => {
      const demoIssue = issues.find(x => x.id === "issue_demo_pothole") || issues[0];
      if (demoIssue) {
        setLatestCreatedId(demoIssue.id);
      }
    });
  }, [step, repository]);

  const triggerCopilotNavigate = (view: string) => {
    sessionStorage.setItem("civiclens_copilot_nav", "true");
    onNavigate(view);
  };

  const resetAllDemoStates = () => {
    repository.resetDemoData().then(() => {
      setStep(1);
      triggerCopilotNavigate("landing");
    });
  };

  // Automated Action Triggers
  const handleStep1Start = () => {
    repository.resetDemoData().then(() => {
      repository.setCurrentUser("user_citizen_1").then(() => {
        localStorage.setItem("civiclens_is_signed_in", "true");
        setStep(2);
        triggerCopilotNavigate("report");
      });
    });
  };

  const handleStep2Autofill = () => {
    // Dispatch custom DOM event that ReportIssuePage listens to
    window.dispatchEvent(new Event("civiclens_autofill_demo"));
  };

  const handleStep2SimulateSubmit = () => {
    const demoId = "issue_demo_pothole";
    
    const newDemoPothole: Issue = {
      id: demoId,
      createdBy: "user_citizen_1",
      createdByName: "Arjun Mehta",
      createdByAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      title: "Extremely Deep Pothole Near Primary School",
      originalDescription: "There is an extremely large and deep pothole right in front of the gate of Green Glen Primary School. School buses and parents keep swerving into oncoming traffic to avoid it. It is very risky during pickup/dropoff hours and filled with rainwater so kids can't see how deep it is.",
      aiSummary: "AI Multimodal model analysis identifies a hazardous road breach (diameter ~1.2m, depth ~15cm) directly obstructing the school drop-off zone. Deep structural wear aggravated by monsoon drainage runoff presents immediate vehicular and pedestrian tripping hazards.",
      category: "Roads & Traffic",
      subcategory: "Potholes",
      severity: IssueSeverity.CRITICAL,
      priorityScore: 88,
      aiConfidence: 0.95,
      location: { lat: 12.9272, lng: 77.6848, isApproximate: false },
      address: "Outside Block 3A, Green Glen Layout, Bellandur",
      landmark: "Directly opposite Green Glen Primary School Entrance",
      evidence: [
        {
          url: "/assets/demo/pothole_preset.png",
          type: "image"
        }
      ],
      status: IssueStatus.NEW,
      assignedDepartment: "Public Works & Highways (PWD)",
      verificationCount: 1, 
      inaccurateCount: 0,
      followerCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      safetyAdvice: "Vehicles should slow to under 10 km/h. High-risk zone for low-slung sedans and two-wheelers. Avoid crossing on foot when dark.",
      possibleRisks: ["Two-wheeler skidding", "Pedestrian ankle injury", "Child safety during school dismissal", "Severe wheel alignment damage"]
    };

    repository.saveIssue(newDemoPothole).then(() => {
      setLatestCreatedId(demoId);
      setStep(3);
      triggerCopilotNavigate(`issue/${demoId}`);
    });
  };

  const handleStep3To4 = () => {
    setStep(4);
  };

  const handleStep4To5 = () => {
    setStep(5);
  };

  const handleStep5SimulateVote = () => {
    Promise.all([
      repository.verifyIssue(
        latestCreatedId,
        "user_citizen_3",
        "confirm",
        "I cross this spot every morning taking my kids to school. The pothole is extremely deep and dangerous. Please dispatch crews immediately!"
      ),
      repository.verifyIssue(
        latestCreatedId,
        "user_citizen_2",
        "confirm",
        "Water accumulates here making the crater completely invisible. Ridden into this twice on my moped, very hazardous!"
      )
    ]).then(() => {
      repository.setCurrentUser("user_admin_1").then(() => {
        setStep(6);
        localStorage.setItem("civiclens_is_signed_in", "true");
        triggerCopilotNavigate("admin");
      });
    });
  };

  const handleStep6SimulateDispatch = () => {
    repository.adminUpdateIssue(
      latestCreatedId,
      { status: IssueStatus.IN_PROGRESS, assignedDepartment: "Public Works & Highways (PWD)" },
      "PWD Engineering division dispatched. Crew Leader: Assistant Engineer Shanmugam. Immediate cold-mix asphalt overlay authorized.",
      "PWD crew on route. Slated resolution time window: 12 hours max. Priority status logged."
    ).then(() => {
      setStep(7);
      triggerCopilotNavigate(`issue/${latestCreatedId}`);
    });
  };

  const handleStep7SimulateResolve = () => {
    const repairedPhoto = "/assets/demo/pothole_preset.png";
    
    const updatedFields: Partial<Issue> = {
      status: IssueStatus.RESOLVED,
      resolvedAt: new Date().toISOString(),
      resolutionDetails: {
        beforeImageUrl: "/assets/demo/pothole_preset.png",
        afterImageUrl: repairedPhoto,
        adminNotes: "PWD crew finished leveling concrete block layers and hot asphalt sealant. Surface leveled cleanly aligned with sidewalk kerb. Complete restoration certified.",
        resolvedAt: new Date().toISOString(),
        communityConfirmed: true,
        geminiAnalysis: "A sequential comparative analysis validates complete structural clearance. Before image exhibits deep water-clogged road indentation. After image displays premium flat asphalt leveled to municipal parameters. High-contrast white lanes paint and aggregate adhesion confirmed completely, eliminating public road danger."
      },
      evidence: [
        { url: "/assets/demo/pothole_preset.png", type: "image" },
        { url: repairedPhoto, type: "image" }
      ]
    };

    repository.adminUpdateIssue(
      latestCreatedId,
      updatedFields,
      "Gemini Forensic Resolution Audit: Visual comparative check yields 100% compliance. High-performance asphalt coverage leveling is fully confirmed.",
      "Muncipal resolution confirmed via Gemini visual audit. Contract payout approved."
    ).then(() => {
      setStep(8);
      triggerCopilotNavigate("impact");
    });
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 sm:w-96 font-sans">
      {/* MINIMIZED BARS */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-full shadow-2xl transition hover:opacity-95 text-xs font-bold ring-4 ring-cyan-500/10 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
          <span>Launch Judge Tour (Step {step}/8)</span>
        </button>
      )}

      {/* FULL CAPSULE WIDGET */}
      {isOpen && (
        <div className="bg-[#0D1B2A]/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-3xl overflow-hidden transition-all duration-300 animate-scale-up">
          
          {/* HEADER TRAIL */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-[#122338] border-b border-cyan-500/30 flex justify-between items-center text-left">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              <div>
                <h4 className="text-xs font-black tracking-widest text-white uppercase">Judge Co-Pilot Panel</h4>
                <p className="text-[9px] font-mono text-cyan-300 uppercase mt-0.5">CivicPulse AI — Judge Demo</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetAllDemoStates}
                className="text-slate-400 hover:text-[#FF6B6B] transition p-1"
                title="Reset Database Seed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* INNER WALKTHROUGH STEPS */}
          <div className="p-5 text-left">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-wider">DEMO LIFECYCLE PHASE</span>
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                STEP {step} OF 8
              </span>
            </div>

            {/* STEP 1: WELCOME & START TRIAL */}
            {step === 1 && (
              <div>
                <h3 className="text-sm font-extrabold text-white mb-2 tracking-tight">CivicPulse AI Trial Journey</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Welcome, Hackathon Judge. This co-pilot guides you through a full **7-phase community issue lifecycle**. Witness how AI-powered evidence analysis, geolocation clustering, and visual audit comparisons accelerate urban governance and prevent duplicate complaints.
                </p>
                <div className="bg-cyan-950/30 border border-cyan-500/20 p-3 rounded-xl mb-4 text-[11px] leading-relaxed text-cyan-200">
                  <p className="font-bold mb-1">🔍 Why we built this Companion:</p>
                  So you can see every single advanced feature in action without having to type or search coordinates manually!
                </div>
                <button
                  onClick={handleStep1Start}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs tracking-wider rounded-xl shadow-lg shadow-cyan-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 text-white" />
                  <span>START DEMO TOUR</span>
                </button>
              </div>
            )}

            {/* STEP 2: REPORT A POTHOLE */}
            {step === 2 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/20 text-[#FFB547] uppercase font-mono text-[9px] font-extrabold mb-2.5 w-fit">
                  <UserCheck className="w-3 h-3" />
                  <span>CITIZEN IDENT: Arjun Mehta</span>
                </div>
                <h3 className="text-sm font-extrabold text-white mb-1.5 tracking-tight">Step 2: Submitting a Problem</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Let's log an active pothole hazard outside Green Glen School entrance. You can write in clean English or Hindi voice-dictation.
                </p>

                <div className="space-y-2 mb-4">
                  <button
                    onClick={handleStep2Autofill}
                    className="w-full py-2 bg-[#122338] hover:bg-slate-800 text-cyan-300 border border-cyan-500/20 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>⚡ Autofill Pothole Form State</span>
                  </button>
                  <p className="text-[10px] text-center text-slate-500">
                    (Once autofilled, click 'Gemini Neural Extraction' in the form)
                  </p>
                  
                  <div className="relative flex items-center my-3">
                    <div className="flex-grow border-t border-slate-800"></div>
                    <span className="flex-shrink mx-2 text-[9px] font-mono text-slate-500 uppercase">OR INSTANTLY SKIP</span>
                    <div className="flex-grow border-t border-slate-800"></div>
                  </div>

                  <button
                    onClick={handleStep2SimulateSubmit}
                    className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg text-xs font-extrabold transition hover:opacity-95 cursor-pointer shadow-md"
                  >
                     Submit & Advance to Detail
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: GEMINI EXTRACTION PREVIEW */}
            {step === 3 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#21D4FD]/15 border border-[#21D4FD]/20 text-[#21D4FD] uppercase font-mono text-[9px] font-extrabold mb-2.5 w-fit">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  <span>Gemini Multimodal Model</span>
                </div>
                <h3 className="text-sm font-extrabold text-white mb-1.5 tracking-tight">Step 3: Neural Metadata Extraction</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Look at the detail screen! Gemini has analyzed our raw description and photograph server-side. It structured the title, assigned the PWD agency, suggested immediate safety instructions, and quantified potential public works risks.
                </p>
                <div className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl text-[10px] text-[#9FB2C8] leading-relaxed mb-4">
                  <p className="font-bold text-white mb-1 font-mono text-[11px]">🧠 Gemini Synthesis Insight:</p>
                  "A hazardous road rupture directly obstructing school drop-off... Possible Risks: Child safety during dismissal, two-wheeler skidding."
                </div>
                
                <button
                  onClick={handleStep3To4}
                  className="w-full py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Verify Duplication Protection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* STEP 4: DUPLICATE PREVENTION CHANNELS */}
            {step === 4 && (
              <div>
                <h3 className="text-sm font-extrabold text-white mb-1.5 tracking-tight">Step 4: Duplicate Clusters Block</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Municipal centers are drowned in identical complaints. CivicPulse AI automatically groups tickets within 50m of active reports. If you test reporting the school pothole again, CivicPulse blocks duplicates and redirects votes!
                </p>
                
                <button
                  onClick={handleStep4To5}
                  className="w-full py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Next: Community Peer Audit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* STEP 5: DEMOCRATIC COMMUNITY VERIFICATION */}
            {step === 5 && (
              <div>
                <h3 className="text-sm font-extrabold text-white mb-1.5 tracking-tight">Step 5: Peer Auditing & Trust</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Traditional tracking decays due to unverified inputs. We empower neighbors to verify reports on the map! Local verifications escalate the SLA Priority. Watch Arjun and Vikram cast votes below to raise the priority dynamically.
                </p>

                <button
                  onClick={handleStep5SimulateVote}
                  className="w-full py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🗳️ Cast Simulated Community Votes</span>
                </button>
                <span className="text-[9px] text-slate-400 block mt-2 text-center">
                  (Simulated votes will boost the priority and switch you to Admin Desk)
                </span>
              </div>
            )}

            {/* STEP 6: ADMINISTRATIVE DISPATCH SEAT */}
            {step === 6 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 uppercase font-mono text-[9px] font-extrabold mb-2.5 w-fit">
                  <Shield className="w-3 h-3" />
                  <span>ADMIN DESK: Inspector Rajesh</span>
                </div>
                <h3 className="text-sm font-extrabold text-white mb-1.5 tracking-tight">Step 6: Board Dispatch Desk</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Welcome to the Government Admin Panel. We see the school pothole listed in the incoming queue! We need to dispatch a Public Works & Highways (PWD) repair unit.
                </p>
                
                <button
                  onClick={handleStep6SimulateDispatch}
                  className="w-full py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-1 cursor-pointer font-sans"
                >
                  <span>🔧 Dispatch PWD Repair Unit</span>
                </button>
              </div>
            )}

            {/* STEP 7: PHOTOGRAPHIC BEFORE/AFTER COMPARISON */}
            {step === 7 && (
              <div>
                <h3 className="text-sm font-extrabold text-white mb-1.5 tracking-tight">Step 7: Before/After AI Audit</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  The PWD crew filed repairs! To ensure contractors don't cheat, we run a comparative visual ledger check. Uploading the repaired 'After' photo triggers Gemini to visually certify compliant aggregate laying and debris clearance.
                </p>
                
                <button
                  onClick={handleStep7SimulateResolve}
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95 text-white font-extrabold text-xs tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-white animate-spin" />
                  <span>Certify Repair with Gemini Visual check</span>
                </button>
              </div>
            )}

            {/* STEP 8: MUNICIPAL ANALYTICS & REWARD LEADERBOARDS */}
            {step === 8 && (
              <div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-sm font-extrabold text-white mb-1.5 text-center tracking-tight">Successful Audit! 🎉</h3>
                <p className="text-xs text-slate-300 leading-relaxed text-center mb-4">
                  The pothole is solved! Look at the **Public Impact Dashboard**. Every chart, SLA response timeline, and leader badge updates in real time based on this resolved issue.
                </p>

                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-[10px] text-[#9FB2C8] leading-relaxed mb-4">
                  <p className="font-bold text-white mb-1 font-mono text-[11px] text-center">🎯 Dynamic Metrics Updated:</p>
                  - SLA Response Duration (PWD reduces to 36hrs)<br />
                  - Total Verified Community Audits<br />
                  - Citizen Civic Leaderboard (Arjun receives +50 civic points!)
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={resetAllDemoStates}
                    className="flex-1 py-2 border border-slate-800 bg-[#122338] text-slate-300 font-bold text-xs rounded-lg transition hover:text-white hover:bg-slate-800 cursor-pointer text-center"
                  >
                    Reset Seed
                  </button>
                  <button
                    onClick={() => {
                      setStep(1);
                      onNavigate("landing");
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-extrabold text-xs rounded-lg transition hover:opacity-95 cursor-pointer text-center"
                  >
                    Restart Tour
                  </button>
                </div>
              </div>
            )}

            {/* STEPS PREVIEW TRACKER */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-between gap-1 items-center">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <div
                  key={s}
                  onClick={() => setStep(s)}
                  className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all ${
                    s === step
                      ? "bg-cyan-400"
                      : s < step
                      ? "bg-cyan-600/40"
                      : "bg-slate-900"
                  }`}
                  title={`Jump to step ${s}`}
                ></div>
              ))}
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
