/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { User } from "../types";
import { ShieldAlert, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  currentUser: User;
  allow: Array<"citizen" | "admin" | "staff">;
  children: React.ReactNode;
  onNavigate: (view: string) => void;
  language: "en" | "hi";
}

export default function ProtectedRoute({
  currentUser,
  allow,
  children,
  onNavigate,
  language
}: ProtectedRouteProps) {
  const auth = useAuth();

  if (auth.status === "initializing") {
    return (
      <div className="min-h-[50vh] bg-slate-950 text-cyan-400 flex flex-col items-center justify-center font-mono text-xs gap-3">
        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        <span>Initializing Security Desk Auth...</span>
      </div>
    );
  }

  const isSigned = auth.status === "authenticated" && auth.user !== null;

  if (!isSigned) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center bg-theme-main text-theme-main font-sans">
        <div className="bg-theme-secondary border border-theme-main p-8 rounded-3xl shadow-theme-main relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500"></div>
          
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <ShieldAlert className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>

          <h2 className="text-xl font-bold font-sans tracking-tight text-theme-main mb-2 uppercase">
            {language === "en" ? "Authentication Required" : "प्रमाणीकरण आवश्यक है"}
          </h2>
          
          <p className="text-xs text-theme-secondary leading-relaxed mb-6 font-mono">
            {language === "en" 
              ? "Accessing this section requires an authenticated profile. Please sign in to verify credentials." 
              : "इस अनुभाग तक पहुँचने के लिए एक प्रमाणित प्रोफ़ाइल की आवश्यकता होती है। क्रेडेंशियल सत्यापित करने के लिए कृपया साइन इन करें।"}
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

  const activeUser = auth.user!;
  const hasAccess = allow.includes(activeUser.role);

  if (!hasAccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center bg-theme-main text-theme-main font-sans">
        <div className="bg-theme-secondary border border-theme-main p-8 rounded-3xl shadow-theme-main relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500"></div>
          
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>

          <h2 className="text-xl font-bold font-sans tracking-tight text-theme-main mb-2 uppercase">
            {language === "en" ? "Access Level Required" : "पहुंच स्तर आवश्यक"}
          </h2>
          
          <p className="text-xs text-theme-secondary leading-relaxed mb-6 font-mono">
            {language === "en" 
              ? `This section is restricted. Your profile role ("${activeUser.role}") does not match authorization clearances.` 
              : `यह अनुभाग प्रतिबंधित है। आपकी प्रोफ़ाइल भूमिका ("${activeUser.role}") प्राधिकरण अनुमति से मेल नहीं खाती है।`}
          </p>

          <button
            onClick={() => onNavigate("landing")}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase font-mono"
          >
            <span>Return to Home</span>
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
