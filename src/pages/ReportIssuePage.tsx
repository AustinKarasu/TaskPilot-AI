import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Issue, IssueSeverity, IssueStatus, User } from "../types";
import { useRepository } from "../services/repository";
import { TRANSLATIONS } from "../i18n/translations";
import { getCategoryFallbackImage } from "./LandingPage";
import { Camera, MapPin, Sparkles, Mic, ChevronRight, ChevronLeft, Check, AlertOctagon, HelpCircle, Loader2, RefreshCw, Layers, Vote, Navigation } from "lucide-react";
import { getAppMode } from "../services/appMode";
import { analyzeIssueEvidence, improveIssueDescription } from "../lib/clientAi";

interface AddressSuggestion {
  id: string;
  label: string;
  detail: string;
  lat: number;
  lng: number;
}

interface ReportIssuePageProps {
  currentUser: User;
  onNavigate: (view: string) => void;
  presetLocation?: { lat: number; lng: number };
  onClearPresetLocation?: () => void;
  language: "en" | "hi";
}

export default function ReportIssuePage({
  currentUser,
  onNavigate,
  presetLocation,
  onClearPresetLocation,
  language
}: ReportIssuePageProps) {
  const repository = useRepository();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");

  // Form Fields
  const [evidenceFile, setEvidenceFile] = useState<string | null>(null);
  const [evidenceBase64, setEvidenceBase64] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const [latitude, setLatitude] = useState<number>(12.9716);
  const [longitude, setLongitude] = useState<number>(77.5946);
  const [landmark, setLandmark] = useState("");
  const [address, setAddress] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isLocatingForm, setIsLocatingForm] = useState(false);
  const [approxLocation, setApproxLocation] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "hi">(language);
  const [isRecording, setIsRecording] = useState(false);

  // Gemini Generated Structure
  const [aiResult, setAiResult] = useState<any>(null);

  // Duplicate Check
  const [duplicateMatches, setDuplicateMatches] = useState<Issue[]>([]);
  const [forceSubmit, setForceSubmit] = useState(false);

  const dict = TRANSLATIONS[language];
  const isSigned = localStorage.getItem("civiclens_is_signed_in") === "true";

  if (!isSigned) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center bg-theme-main text-theme-main font-sans">
        <div className="bg-theme-secondary border border-theme-main p-8 rounded-3xl shadow-theme-main relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500"></div>
          
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>

          <h2 className="text-xl font-bold font-sans tracking-tight text-theme-main mb-2 uppercase">
            {language === "en" ? "Authentication Required" : "प्रमाणीकरण आवश्यक है"}
          </h2>
          
          <p className="text-xs text-theme-secondary leading-relaxed mb-6 font-mono">
            {language === "en" 
              ? "Logging new civic reports requiring Gemini telemetry validation, coordinate duplicate checking, and department alerts requires an authenticated profile." 
              : "जैमिनी टेलीमेट्री सत्यापन, क्रेडेंशियल्स मिलान और स्थान दोहराव की जाँच करने वाले नए नागरिक रिपोर्टों को दर्ज करने के लिए एक सत्यापित प्रोफ़ाइल की आवश्यकता होती है।"}
          </p>

          <button
            onClick={() => onNavigate("auth")}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase font-mono"
          >
            <span>Access Sign In Portal</span>
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    );
  }

  // Load preset coordinates if clicked from map
  useEffect(() => {
    if (presetLocation) {
      setLatitude(presetLocation.lat);
      setLongitude(presetLocation.lng);
      setAddress(`Pinned GPS: ${presetLocation.lat.toFixed(5)}, ${presetLocation.lng.toFixed(5)}`);
      setStep(2); // Skip directly to position step
    }
  }, [presetLocation]);

  // Listen for judge demo autocompletion trigger
  useEffect(() => {
    const handleAutofill = () => {
      setEvidenceFile("https://images.unsplash.com/photo-1599740831146-80a6b7dbd931?auto=format&fit=crop&q=80&w=600");
      setLatitude(12.9272);
      setLongitude(77.6848);
      setAddress("Outside Block 3A, Green Glen Layout, Bellandur");
      setLandmark("Directly opposite Green Glen Primary School Entrance");
      setDescription("There is an extremely large and deep pothole right in front of the gate of Green Glen Primary School. School buses and parents keep swerving into oncoming traffic to avoid it. It is very risky during pickup/dropoff hours and filled with rainwater so kids can't see how deep it is.");
      setSelectedLanguage("en");
      setStep(3); // Go straight to step 3 so the judge can click "Gemini Neural Extraction Analysis"
    };

    window.addEventListener("civiclens_autofill_demo", handleAutofill);
    return () => {
      window.removeEventListener("civiclens_autofill_demo", handleAutofill);
    };
  }, []);

  // Speech Recognition unmount cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Handle real file upload via FileReader → base64
  const handleRealFileUpload = (file: File) => {
    // Enforce 10MB max and image MIME types
    const MAX_SIZE = 10 * 1024 * 1024;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Only JPEG, PNG, and WebP images are accepted.");
      return;
    }
    if (file.size > MAX_SIZE) {
      alert("File exceeds the 10MB size limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setEvidenceBase64(base64);
      setEvidenceFile(URL.createObjectURL(file));
      setStep(2);
    };
    reader.onerror = () => {
      alert("Failed to read the selected file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleRealFileUpload(file);
  };

  // Handle preset demo image selection (URL-based, for demo/judging)
  const handleFileSelect = (url: string) => {
    setEvidenceFile(url);
    setEvidenceBase64(null); // presets don't have base64 — server will fetch if needed
    setStep(2);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleRealFileUpload(file);
  };

  // AI Voice-to-Text Assist (Web Speech API integration)
  const triggerVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Failed to stop recognition:", e);
        }
      }
      setIsRecording(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = selectedLanguage === "hi" ? "hi-IN" : "en-IN";

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        if (resultText) {
          setDescription(prev => (prev ? prev + " " + resultText : resultText));
        }
      };

      rec.onerror = (err: any) => {
        console.error("Speech Recognition error:", err);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error("Failed to start Speech Recognition:", e);
      setIsRecording(false);
    }
  };

  // Detect and set current GPS location for the report form
  const handleUseCurrentLocationForm = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocatingForm(true);

    const applyPosition = (position: GeolocationPosition, label: string) => {
      const lat = parseFloat(position.coords.latitude.toFixed(6));
      const lng = parseFloat(position.coords.longitude.toFixed(6));
      setLatitude(lat);
      setLongitude(lng);
      setAddress(`${label}: ${lat}, ${lng}`);
    };

    let hasPosition = false;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        hasPosition = true;
        applyPosition(position, "Fast GPS location");
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 1200, maximumAge: 5 * 60 * 1000 }
    );

    navigator.geolocation.getCurrentPosition(
      (position) => {
        hasPosition = true;
        applyPosition(position, "High accuracy GPS location");
        setIsLocatingForm(false);
      },
      (error) => {
        console.warn("High accuracy GPS failed:", error.message);
        if (!hasPosition) {
          setAddress("Location unavailable. Search or enter address manually.");
        } else {
          setAddress(prev => prev.startsWith("Fast GPS location") ? prev.replace("Fast GPS location", "Approximate GPS location") : prev);
        }
        setIsLocatingForm(false);
      },
      { enableHighAccuracy: true, timeout: 7500, maximumAge: 0 }
    );
  };

  useEffect(() => {
    const query = address.trim();
    if (step !== 2 || query.length < 3 || query.toLowerCase().includes("gps location")) {
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
      return;
    }

    setIsSearchingAddress(true);
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}&limit=10`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Address search returned ${res.status}`);
        const data = await res.json();
        const remoteData = Array.isArray(data?.results) ? data.results : [];
        const suggestions: AddressSuggestion[] = remoteData
          .map((item: any, index: number) => ({
            id: String(item.id || index),
            label: item.label || "Search result",
            detail: item.detail || "OpenStreetMap result",
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lng)
          }))
          .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
          .slice(0, 10);
        setAddressSuggestions(suggestions);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Address search failed:", err);
        }
      } finally {
        setIsSearchingAddress(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [address, step]);

  const selectAddressSuggestion = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.detail);
    setLatitude(parseFloat(suggestion.lat.toFixed(6)));
    setLongitude(parseFloat(suggestion.lng.toFixed(6)));
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
  };

  // Rewrite Description using Gemini
  const handleEnhanceDescription = async () => {
    if (!description) return;
    setLoading(true);
    setLoadingStage("Enhancing submission language...");
    try {
      const improvedText = await improveIssueDescription(description, selectedLanguage);
      setDescription(improvedText);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Action: Trigger Gemini Vision Extraction
  const handleTriggerAiAnalysis = async () => {
    setLoading(true);
    setLoadingStage("Transmitting evidentiary photography...");
    
    // Simulate progression indicators for futuristic view
    setTimeout(() => setLoadingStage("Examining structural evidence..."), 1000);
    setTimeout(() => setLoadingStage("Tagging severity and municipal categories (BWSSB/PWD)..."), 2000);
    setTimeout(() => setLoadingStage("Synthesizing pediatric and traffic risk advice..."), 3000);

    // Use real base64 if available (user upload), otherwise fall back to preset URL
    const imagePayload = evidenceBase64 || evidenceFile || "";

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const payload = await analyzeIssueEvidence(imagePayload, description, controller.signal);
      clearTimeout(timeout);
      setAiResult(payload);
      setStep(4); // Advance to review Step
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Gemini image analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  // Action: Duplicate Search
  const handleSearchDuplicates = () => {
    // Scan coordinates within 250 meters (roughly ~0.0025 GPS diff)
    repository.getIssues().then((list) => {
      const overlaps = list.filter((item) => {
        const latDiff = Math.abs(item.location.lat - latitude);
        const lngDiff = Math.abs(item.location.lng - longitude);
        return latDiff < 0.003 && lngDiff < 0.003 && item.status !== IssueStatus.RESOLVED && item.status !== IssueStatus.REJECTED;
      });

      setDuplicateMatches(overlaps);
      if (overlaps.length > 0) {
        setStep(5); // Shift to duplicate verification sheet
      } else {
        finalizeSubmission();
      }
    });
  };

  // Action: Upvote existing instead of duplicate spamming
  const handleSupportExisting = (existingId: string) => {
    repository.verifyIssue(existingId, currentUser.id, "confirm", "Upvoted and supported this issue as a matching duplicate instead of submitting duplicate ticket.").then(() => {
      onNavigate(`issue/${existingId}`);
    });
  };

  // Action: Finalize registration on DB
  const finalizeSubmission = () => {
    const finalId = "issue_" + Math.random().toString(36).substr(2, 9);
    const newIssue: Issue = {
      id: finalId,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdByAvatar: currentUser.avatar,
      title: aiResult?.title || "Reported Civic Hazard",
      originalDescription: description,
      aiSummary: aiResult?.summary || "No automated summary generated.",
      category: aiResult?.category || "Roads & Traffic",
      subcategory: aiResult?.subcategory || "Potholes",
      severity: (aiResult?.severity || "medium") as IssueSeverity,
      priorityScore: aiResult?.severity === "critical" ? 85 : aiResult?.severity === "high" ? 65 : 45,
      aiConfidence: aiResult?.confidence || 0.88,
      location: {
        lat: latitude,
        lng: longitude,
        isApproximate: approxLocation
      },
      address: address || " Bengaluru command grid",
      landmark,
      evidence: [
        {
          url: evidenceBase64 || evidenceFile || "/assets/demo/pothole_preset.png",
          type: "image"
        }
      ],
      status: IssueStatus.NEW,
      assignedDepartment: aiResult?.suggestedDepartment || "Public Works & Highways (PWD)",
      verificationCount: 1, // Author confirms it
      inaccurateCount: 0,
      followerCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      safetyAdvice: aiResult?.citizenSafetyAdvice,
      possibleRisks: aiResult?.possibleRisks
    };

    repository.saveIssue(newIssue).then(() => {
      if (onClearPresetLocation) onClearPresetLocation();
      setStep(6); // submission success card!
      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#21D4FD", "#B721FF", "#10B981", "#3B82F6"]
        });
      } catch (e) {
        console.warn("Confetti trigger failed:", e);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 min-h-[calc(100vh-140px)] flex flex-col justify-center">
      
      {/* 1. PROGRESS BAR */}
      {step < 6 && (
        <div className="flex items-center justify-between gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1 flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold border transition-all ${
                  step === i
                    ? "bg-[#21D4FD] border-[#21D4FD] text-[#07111F] ring-4 ring-[#21D4FD]/15"
                    : step > i
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                    : "bg-slate-900 border-slate-850 text-slate-500"
                }`}
              >
                {step > i ? "✓" : i}
              </div>
              <div className="flex-1 h-0.5 bg-slate-800 rounded-full last:hidden">
                <div
                  className="h-full bg-[#21D4FD] transition-all"
                  style={{ width: step > i ? "100%" : "0%" }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. LOADING STATE OVERLAY */}
      {loading && (
        <div className="bg-theme-secondary/95 border border-theme-main rounded-2xl p-8 text-center shadow-xl animate-fade-in py-12 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#21D4FD] animate-spin" />
          <div className="text-sm font-bold text-theme-main tracking-wide">Gemini Model Thinking</div>
          <p className="text-xs text-theme-secondary mt-1 font-mono tracking-wider animate-pulse">{loadingStage}</p>
        </div>
      )}

      {!loading && (
        <div className="bg-theme-secondary border border-theme-main rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          
          {/* STEP 1: UPLOAD PHOTOS */}
          {step === 1 && (
            <div className="text-center">
              <h2 className="text-xl font-extrabold text-theme-main mb-2">{dict.evidenceStep}</h2>
              <p className="text-xs text-theme-secondary max-w-sm mx-auto mb-6">Select a realistic photograph of your local infrastructure failure. Tap below to choose presets.</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
                id="evidence-file-input"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed ${isDragging ? 'border-[#21D4FD] bg-[#21D4FD]/5' : 'border-theme-main hover:border-[#21D4FD]/40'} rounded-xl p-8 bg-theme-tertiary/30 cursor-pointer transition-all flex flex-col items-center justify-center gap-3`}
              >
                {evidenceFile ? (
                  <>
                    <img
                      src={evidenceFile}
                      alt="Selected evidence"
                      className="h-32 w-auto object-cover rounded-lg border border-theme-main"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getCategoryFallbackImage("default");
                      }}
                    />
                    <span className="text-xs font-semibold text-emerald-400">✓ Photo selected — click to change</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-12 h-12 text-[#9FB2C8]" />
                    <span className="text-xs font-semibold text-theme-secondary">{isDragging ? 'Drop your photo here' : 'Drag & drop or Click to capture'}</span>
                    <span className="text-[10px] text-theme-muted font-mono">JPEG, PNG, WebP up to 10MB</span>
                  </>
                )}
              </div>

              {/* Quick High quality presets for judges to test */}
              {getAppMode() === "demo" && (
                <div className="mt-8 text-left">
                  <p className="text-[10px] font-mono text-theme-muted uppercase font-bold mb-3">Demo Presets (for quick judging — or upload your own above):</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div
                      onClick={() => handleFileSelect("/assets/demo/pothole_preset.png")}
                      className="border border-theme-main bg-theme-tertiary/40 rounded-lg p-1.5 cursor-pointer hover:border-[#21D4FD]/40 transition text-center"
                    >
                      <img
                        src="/assets/demo/pothole_preset.png"
                        alt="Preset Pothole"
                        className="h-14 w-full object-cover rounded mb-1"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getCategoryFallbackImage("Roads & Traffic");
                        }}
                      />
                      <span className="text-[9px] text-theme-secondary font-mono font-bold truncate block">Deep Pothole</span>
                    </div>

                    <div
                      onClick={() => handleFileSelect("/assets/demo/pipe_leak_preset.png")}
                      className="border border-theme-main bg-theme-tertiary/40 rounded-lg p-1.5 cursor-pointer hover:border-[#21D4FD]/40 transition text-center"
                    >
                      <img
                        src="/assets/demo/pipe_leak_preset.png"
                        alt="Preset Pipe Leak"
                        className="h-14 w-full object-cover rounded mb-1"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getCategoryFallbackImage("Water & Sanitation");
                        }}
                      />
                      <span className="text-[9px] text-theme-secondary font-mono font-bold truncate block">Water Pipeline Leak</span>
                    </div>

                    <div
                      onClick={() => handleFileSelect("/assets/demo/manhole_preset.png")}
                      className="border border-theme-main bg-theme-tertiary/40 rounded-lg p-1.5 cursor-pointer hover:border-[#21D4FD]/40 transition text-center"
                    >
                      <img
                        src="/assets/demo/manhole_preset.png"
                        alt="Preset Manhole"
                        className="h-14 w-full object-cover rounded mb-1"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getCategoryFallbackImage("Water & Sanitation");
                        }}
                      />
                      <span className="text-[9px] text-theme-secondary font-mono font-bold truncate block">Open Sewer Cover</span>
                    </div>

                    <div
                      onClick={() => handleFileSelect("/assets/demo/broken_light_preset.png")}
                      className="border border-theme-main bg-theme-tertiary/40 rounded-lg p-1.5 cursor-pointer hover:border-[#21D4FD]/40 transition text-center"
                    >
                      <img
                        src="/assets/demo/broken_light_preset.png"
                        alt="Preset Broken Light"
                        className="h-14 w-full object-cover rounded mb-1"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getCategoryFallbackImage("Public Utilities");
                        }}
                      />
                      <span className="text-[9px] text-theme-secondary font-mono font-bold truncate block">Broken Streetlight</span>
                    </div>

                    <div
                      onClick={() => handleFileSelect("/assets/demo/garbage_preset.png")}
                      className="border border-theme-main bg-theme-tertiary/40 rounded-lg p-1.5 cursor-pointer hover:border-[#21D4FD]/40 transition text-center"
                    >
                      <img
                        src="/assets/demo/garbage_preset.png"
                        alt="Preset Garbage"
                        className="h-14 w-full object-cover rounded mb-1"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getCategoryFallbackImage("Solid Waste Management");
                        }}
                      />
                      <span className="text-[9px] text-theme-secondary font-mono font-bold truncate block">Garbage Accumulation</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DETAILS & LOCATION PINS */}
          {step === 2 && (
            <div className="text-left animate-fade-in text-theme-main">
              <h2 className="text-xl font-extrabold text-theme-main mb-2 flex items-center gap-2">
                <span className="text-[#21D4FD]">📍</span>
                <span>{dict.locationStep}</span>
              </h2>
              <p className="text-xs text-theme-muted mb-6">Confirm and adjust GPS coordinate parameters. You can add landmark descriptors for municipal crews.</p>

              <div className="flex items-end gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-[10px] font-mono text-theme-muted uppercase font-bold">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    className="w-full mt-1 p-2 bg-theme-tertiary border border-theme-main rounded-lg text-xs font-mono text-theme-main focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-mono text-theme-muted uppercase font-bold">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    className="w-full mt-1 p-2 bg-theme-tertiary border border-theme-main rounded-lg text-xs font-mono text-theme-main focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUseCurrentLocationForm}
                  disabled={isLocatingForm}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-500 text-cyan-400 hover:text-white rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 h-[34px] cursor-pointer transition focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  title="Detect current GPS location"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isLocatingForm ? "animate-spin" : ""}`} />
                  <span>{isLocatingForm ? "GPS..." : "GPS"}</span>
                </button>
              </div>

              <div className="mb-4 relative">
                <label className="text-[10px] font-mono text-theme-muted uppercase font-bold">Address / Street</label>
                <input
                  type="text"
                  placeholder="e.g. 12th Cross, Bellandur Road"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setShowAddressSuggestions(true);
                  }}
                  onFocus={() => setShowAddressSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && addressSuggestions.length > 0) {
                      e.preventDefault();
                      selectAddressSuggestion(addressSuggestions[0]);
                    }
                    if (e.key === "Escape") {
                      setShowAddressSuggestions(false);
                    }
                  }}
                  className="w-full mt-1 p-2.5 bg-theme-tertiary border border-theme-main rounded-lg text-xs text-theme-main focus:outline-none"
                />
                {showAddressSuggestions && address.trim().length >= 3 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 bg-theme-secondary border border-theme-main rounded-xl shadow-2xl max-h-72 overflow-y-auto p-1.5">
                    {isSearchingAddress && addressSuggestions.length === 0 ? (
                      <div className="px-3 py-2 text-[10px] font-mono text-theme-muted">Searching locations...</div>
                    ) : addressSuggestions.length > 0 ? (
                      addressSuggestions.slice(0, 10).map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectAddressSuggestion(suggestion)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-theme-tertiary transition cursor-pointer"
                        >
                          <span className="block text-[11px] font-bold text-theme-main line-clamp-1">{suggestion.label}</span>
                          <span className="block text-[9px] text-theme-muted line-clamp-1">{suggestion.detail}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-[10px] font-mono text-theme-muted">No matching locations found.</div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-mono text-theme-muted uppercase font-bold">Landmark (Optional helpful tag)</label>
                <input
                  type="text"
                  placeholder="e.g. Opposite Green Glen School Gate"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-theme-tertiary border border-theme-main rounded-lg text-xs text-theme-main focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 border border-theme-main p-3 rounded-xl bg-theme-tertiary/30 mb-6">
                <input
                  type="checkbox"
                  id="privacy-blur-check"
                  checked={approxLocation}
                  onChange={(e) => setApproxLocation(e.target.checked)}
                  className="rounded bg-theme-secondary text-[#21D4FD] border-theme-main cursor-pointer"
                />
                <label htmlFor="privacy-blur-check" className="text-xs text-theme-muted leading-tight cursor-pointer">
                  <span className="font-bold text-theme-main block">Obfuscate Exact Location</span>
                  Slightly blur coordinate decimals on public maps for household privacy protection.
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-theme-main rounded-lg text-xs text-theme-main bg-theme-tertiary hover:bg-theme-main transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 bg-[#21D4FD] hover:bg-[#21D4FD]/90 rounded-lg text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer border-0"
                >
                  Next Step (Description)
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: WRITING DESCRIPTION & VOICING DICTATION */}
          {step === 3 && (
            <div className="text-left">
              <h2 className="text-xl font-extrabold text-theme-main mb-2">{dict.descriptionStep}</h2>
              <p className="text-xs text-theme-secondary mb-6">Describe the emergency context. You are allowed to write/speak in standard Hindi or mixed English (Hinglish). Gemini will normalize it into administrative English.</p>

              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSelectedLanguage("en")}
                  className={`flex-1 py-1 text-[10px] font-mono border rounded ${selectedLanguage === "en" ? "bg-[#21D4FD]/20 border-[#21D4FD] text-theme-main" : "border-theme-main text-theme-secondary"}`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage("hi")}
                  className={`flex-1 py-1 text-[10px] font-mono border rounded ${selectedLanguage === "hi" ? "bg-[#21D4FD]/20 border-[#21D4FD] text-theme-main" : "border-theme-main text-theme-secondary"}`}
                >
                  Hindi / हिन्दी
                </button>
              </div>

              <div className="relative">
                <textarea
                  rows={4}
                  placeholder={selectedLanguage === "hi" ? "समस्या का विवरण दर्ज करें... (उदा. सड़क पर बड़ा गड्ढा है)" : "Enter complaint details... (e.g. leaking sewer pipeline flooding lane)"}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-theme-tertiary border border-theme-main rounded-lg text-xs text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-[#21D4FD]"
                  id="textarea-description"
                />

                {/* Audio Waveform recording overlay */}
                {isRecording && (
                  <div className="absolute inset-x-0 bottom-12 top-0 bg-theme-tertiary/95 flex flex-col items-center justify-center rounded-lg border border-red-500/30">
                    <div className="flex gap-1 mb-2">
                      <div className="w-1.5 h-6 bg-red-400 rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-10 bg-red-500 rounded-full animate-pulse delay-75"></div>
                      <div className="w-1.5 h-8 bg-red-500 rounded-full animate-pulse delay-100"></div>
                      <div className="w-1.5 h-4 bg-red-400 rounded-full animate-pulse delay-150"></div>
                    </div>
                    <span className="text-[10px] font-mono text-red-400 font-bold tracking-wider uppercase animate-pulse">Capturing voice audio...</span>
                  </div>
                )}

                {/* Dictaphone Micro-Trigger Button */}
                <div className="flex justify-between items-center mt-2">
                  <button
                    type="button"
                    onClick={triggerVoiceDictation}
                    className={`p-2.5 rounded-xl border flex items-center gap-1.5 transition-all text-[10px] font-bold ${
                      isRecording ? "bg-red-950 border-red-500/50 text-red-400" : "bg-theme-tertiary border border-theme-main text-theme-secondary hover:text-theme-main"
                    }`}
                    title="Start AI Voice-to-Text Input"
                  >
                    <Mic className={`w-4 h-4 ${isRecording ? "text-red-400 animate-pulse" : "text-theme-secondary"}`} />
                    <span>{isRecording ? "Listening..." : "AI Voice-to-Text Input"}</span>
                  </button>

                  {description && (
                    <button
                      type="button"
                      onClick={handleEnhanceDescription}
                      className="px-3 py-1.5 rounded-lg border border-indigo-500/40 hover:border-indigo-500 text-indigo-400 hover:text-theme-main text-[10px] font-bold flex items-center gap-1 bg-indigo-950/20"
                      id="btn-ai-enhance-description"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      <span>Gemini Formal Clean</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-theme-main rounded-lg text-xs bg-theme-secondary hover:bg-theme-tertiary text-theme-main transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleTriggerAiAnalysis}
                  disabled={!description}
                  className={`flex-1 py-2.5 rounded-lg text-[#07111F] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all ${
                    description ? "bg-[#21D4FD] hover:bg-[#21D4FD]/90" : "bg-theme-tertiary text-theme-muted opacity-60 cursor-not-allowed border-theme-main"
                  }`}
                  id="btn-analyze-evidence-step"
                >
                  <Sparkles className="w-4 h-4 text-[#07111F]" />
                  <span>Gemini Neural Extraction Analysis</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: GEMINI EXTRACTION PREVIEW SHEET */}
          {step === 4 && (
            <div className="text-left animate-fade-in">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full bg-[#21D4FD]/15 border border-[#21D4FD]/30">
                <Sparkles className="w-3.5 h-3.5 text-[#21D4FD]" />
                <span className="text-[10px] font-mono font-extrabold text-[#21D4FD] uppercase tracking-wider">Gemini Multimodal Forensic Extraction</span>
              </div>
              <h2 className="text-xl font-extrabold text-theme-main mb-2">Review AI Auditing Sheet</h2>
              <p className="text-xs text-theme-secondary mb-6">Review Gemini's extracted telemetry values. You have full administrative rights to adjust values manually before municipal dispatch.</p>

              <div className="border border-theme-main rounded-xl overflow-hidden mb-6 bg-theme-tertiary/40">
                <div className="p-4 bg-theme-tertiary/70 border-b border-theme-main">
                  <label className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Generated Title</label>
                  <input
                    type="text"
                    value={aiResult?.title || ""}
                    onChange={(e) => setAiResult({ ...aiResult, title: e.target.value })}
                    className="w-full mt-1 p-2 bg-theme-tertiary border border-theme-main rounded-lg text-xs text-theme-main focus:outline-none focus:border-[#21D4FD]"
                  />
                </div>

                <div className="p-4 grid grid-cols-2 gap-4 border-b border-theme-main/50">
                  <div>
                    <label className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Identified Category</label>
                    <select
                      value={aiResult?.category || ""}
                      onChange={(e) => setAiResult({ ...aiResult, category: e.target.value })}
                      className="w-full mt-1 p-2 bg-theme-tertiary border border-theme-main rounded-lg text-xs text-theme-main focus:outline-none focus:border-[#21D4FD]"
                    >
                      <option value="Roads & Traffic">Roads & Traffic</option>
                      <option value="Water & Sanitation">Water & Sanitation</option>
                      <option value="Solid Waste Management">Solid Waste Management</option>
                      <option value="Public Utilities">Public Utilities</option>
                      <option value="Environment & Safety">Environment & Safety</option>
                      <option value="Public Spaces">Public Spaces</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Urgency Severity</label>
                    <select
                      value={aiResult?.severity || ""}
                      onChange={(e) => setAiResult({ ...aiResult, severity: e.target.value })}
                      className="w-full mt-1 p-2 bg-theme-tertiary border border-theme-main rounded-lg text-xs text-theme-main uppercase focus:outline-none focus:border-[#21D4FD]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 border-b border-theme-main/50">
                  <label className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Gemini Issue Synthesis Summary</label>
                  <textarea
                    rows={2}
                    value={aiResult?.summary || ""}
                    onChange={(e) => setAiResult({...aiResult, summary: e.target.value})}
                    className="w-full mt-1 p-2 bg-theme-tertiary border border-theme-main rounded-lg text-xs text-theme-main focus:outline-none focus:border-[#21D4FD]"
                  />
                </div>

                <div className="p-4 bg-[#FFB547]/5 border-t border-[#FFB547]/10">
                  <label className="text-[9px] font-mono uppercase text-[#FFB547] font-bold tracking-wider">Suggested Public Safety Advice</label>
                  <input
                    type="text"
                    value={aiResult?.citizenSafetyAdvice || ""}
                    onChange={(e) => setAiResult({ ...aiResult, citizenSafetyAdvice: e.target.value })}
                    className="w-full mt-1 p-2 bg-theme-tertiary border border-[#FFB547]/20 rounded-lg text-xs text-[#FFB547] placeholder:text-orange-950 font-sans focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 border border-theme-main rounded-lg text-xs bg-theme-secondary hover:bg-theme-tertiary text-theme-main transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSearchDuplicates}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#21D4FD] to-[#009FFF] text-[#07111F] rounded-lg text-xs font-extrabold shadow-lg cursor-pointer border-0"
                  id="btn-duplicate-audit"
                >
                  Check Coordinates Duplicity (Next)
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: DUPLICATE INTERCEPT SHEET */}
          {step === 5 && (
            <div className="text-left animate-fade-in">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full bg-[#FFB547]/15 border border-[#FFB547]/30">
                <AlertOctagon className="w-4 h-4 text-[#FFB547]" />
                <span className="text-[10px] font-mono font-extrabold text-[#FFB547] uppercase tracking-wider">Duplicate Hazard Detected</span>
              </div>
              <h2 className="text-xl font-extrabold text-theme-main mb-2">Adjacent Match Identified</h2>
              <p className="text-xs text-theme-secondary mb-6">Our municipal database verifies another unresolved ticket reported at identical coordinate ranges. We recommend supporting the active ticket to speed up resolution.</p>

              <div className="flex flex-col gap-3 mb-6">
                {duplicateMatches.map((existing) => (
                  <div key={existing.id} className="border border-[#FFB547]/35 bg-theme-secondary rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-mono font-bold text-[#FFB547] bg-[#FFB547]/10 px-2 py-0.5 rounded uppercase">{existing.id}</span>
                        <span className="text-[10px] text-theme-muted font-mono">20m offset range</span>
                      </div>
                      <h4 className="text-xs font-bold text-theme-main tracking-wide">{existing.title}</h4>
                      <p className="text-[11px] text-theme-secondary mt-1 line-clamp-2">{existing.originalDescription}</p>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleSupportExisting(existing.id)}
                        className="flex-1 py-1.5 bg-[#FFB547]/20 hover:bg-[#FFB547] text-[#FFB547] hover:text-[#07111F] border border-[#FFB547]/40 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Vote className="w-4.5 h-4.5" />
                        <span>Upvote & Follow This Instead</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center gap-4 bg-theme-tertiary/30 border border-theme-main/80 p-3 rounded-xl mb-6 text-theme-secondary">
                <HelpCircle className="w-8 h-8 text-theme-muted shrink-0" />
                <div className="text-[10px]">
                  <p className="text-xs text-theme-main font-bold">Unrelated individual hazard?</p>
                  You can override checks if you verify this incident is structurally distinct (e.g. separate streetlight pole, separate pipeline hole).
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-4 py-2 border border-theme-main rounded-lg text-xs bg-theme-secondary hover:bg-theme-tertiary text-theme-main transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={finalizeSubmission}
                  className="flex-1 py-2.5 bg-theme-tertiary hover:bg-theme-secondary hover:text-[#FF6B6B] border border-theme-main rounded-lg text-xs font-bold transition-all cursor-pointer text-theme-secondary"
                >
                  Override & Submit As Separate Case
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* STEP 6: REGISTRATION SUCCESS CARD */}
      {step === 6 && (
        <div className="bg-theme-secondary border border-theme-main rounded-2xl p-8 text-center shadow-2xl animate-scale-up py-12">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/5">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>

          <h1 className="text-xl sm:text-2.5xl font-extrabold text-theme-main mb-2">{dict.submitSuccess}</h1>
          <p className="text-xs text-theme-secondary max-w-sm mx-auto leading-relaxed mb-8">
            Your telemetry incident ticket has been assigned to matching government distribution lines. Neighbors can now peer check on map grid indices to accelerate operations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate("map")}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#21D4FD] text-[#07111F] font-extrabold text-xs tracking-wider rounded-lg shadow-md cursor-pointer hover:opacity-95 transition-all border-0"
            >
              Track on Live Map
            </button>
            <button
              onClick={() => onNavigate("dashboard")}
              className="w-full sm:w-auto px-6 py-2.5 border border-theme-main bg-theme-tertiary/40 text-theme-main font-bold text-xs rounded-lg transition-all hover:bg-theme-tertiary/80 cursor-pointer"
            >
              Back To My Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
