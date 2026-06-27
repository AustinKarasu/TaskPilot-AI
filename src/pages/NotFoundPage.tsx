/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { AlertTriangle, Home, Search, ArrowLeft } from "lucide-react";

interface NotFoundPageProps {
  onNavigate: (view: string) => void;
  language: "en" | "hi";
}

export default function NotFoundPage({ onNavigate, language }: NotFoundPageProps) {
  useEffect(() => {
    document.title = language === "hi" ? "पृष्ठ नहीं मिला | CivicPulse" : "404 Page Not Found | CivicPulse AI";
  }, [language]);

  const isHi = language === "hi";

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center font-sans" role="main">
      <div className="bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 p-8 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] space-y-6">
        {/* Animated warning icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 relative shadow-lg shadow-red-500/5 animate-pulse">
            <AlertTriangle className="w-10 h-10" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full font-black">
              404
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-xl font-black text-white font-display tracking-wide uppercase mb-2">
            {isHi ? "पृष्ठ नहीं मिला" : "Page Not Found"}
          </h1>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            {isHi 
              ? "क्षमा करें, आपके द्वारा खोजा गया पृष्ठ CivicPulse AI डेटाबेस में मौजूद नहीं है या हटा दिया गया है।" 
              : "The requested route does not exist or has been archived outside the active municipal audit grid."}
          </p>
        </div>

        {/* Suggestion links */}
        <div className="bg-slate-900/30 border border-cyan-500/5 p-4 rounded-2xl text-left space-y-2.5">
          <h3 className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
            {isHi ? "सुझाए गए स्थान" : "Suggested Paths"}
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-400 font-mono">
            <li>
              <button type="button" onClick={() => onNavigate("landing")} className="hover:text-cyan-300 transition focus:outline-none focus:underline cursor-pointer flex items-center gap-2">
                <span>•</span> {isHi ? "मुख्य लैंडिंग पृष्ठ" : "Main Landing Page"}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate("explore")} className="hover:text-cyan-300 transition focus:outline-none focus:underline cursor-pointer flex items-center gap-2">
                <span>•</span> {isHi ? "नक्शा एक्सप्लोरर" : "Map Grid Explorer"}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate("faq")} className="hover:text-cyan-300 transition focus:outline-none focus:underline cursor-pointer flex items-center gap-2">
                <span>•</span> {isHi ? "एफएक्यू ज्ञानकोष" : "FAQ Knowledge Base"}
              </button>
            </li>
          </ul>
        </div>

        {/* Back buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={() => onNavigate("landing")}
            className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          >
            <Home className="w-3.5 h-3.5" />
            {isHi ? "होमपेज पर जाएं" : "Return to Home"}
          </button>
        </div>
      </div>
    </div>
  );
}
