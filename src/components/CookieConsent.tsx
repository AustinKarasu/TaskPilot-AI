/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CookieConsentProps {
  onNavigate: (view: string) => void;
  language: "en" | "hi";
}

export default function CookieConsent({ onNavigate, language }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("civiclens_cookie_consent");
    if (!consent) {
      // Delay showing the banner slightly for a premium, non-intrusive feel
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("civiclens_cookie_consent", "accepted");
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem("civiclens_cookie_consent", "declined");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  const isHi = language === "hi";

  return (
    <AnimatePresence>
      <div 
        className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50 text-left"
        role="dialog"
        aria-describedby="cookie-consent-desc"
        aria-labelledby="cookie-consent-title"
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-slate-950/90 dark:bg-slate-950/95 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col gap-4 relative overflow-hidden"
        >
          {/* Ambient light streak */}
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-cyan-500/10 rounded-full filter blur-xl pointer-events-none"></div>
          
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/10 shrink-0">
                <Cookie className="w-5 h-5 text-white" />
              </div>
              <h3 id="cookie-consent-title" className="font-display font-extrabold text-sm text-white tracking-wide uppercase">
                {isHi ? "कुकी प्राथमिकताएं" : "Cookie Consent Preferences"}
              </h3>
            </div>
            <button 
              type="button"
              onClick={handleDecline} 
              className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              aria-label={isHi ? "बैनर बंद करें" : "Close Banner"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p id="cookie-consent-desc" className="text-xs text-slate-400 leading-relaxed font-sans">
            {isHi 
              ? "हम आपके लॉगिन सत्र को सुरक्षित रखने, भाषा विकल्पों को सहेजने और विश्लेषण के लिए कुकीज़ का उपयोग करते हैं। सहमति देकर आप सर्वश्रेष्ठ अनुभव का आनंद ले सकते हैं।"
              : "We use essential cookies to maintain secure sign-in states, persist localization preferences, and gather anonymous system performance metrics. Read our "}
            <button 
              type="button"
              onClick={() => {
                onNavigate("privacy");
                setShowBanner(false);
              }}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline font-mono cursor-pointer bg-transparent border-none"
            >
              {isHi ? "गोपनीयता नीति पढ़ें" : "Privacy Policy"}
            </button>
            {!isHi && " for details."}
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-1.5 border-t border-slate-900">
            <button
              type="button"
              onClick={handleDecline}
              className="px-4 py-2 text-[10px] font-mono font-bold text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition rounded-xl cursor-pointer"
            >
              {isHi ? "अस्वीकार करें" : "Decline"}
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-4 py-2 text-[10px] font-mono font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white shadow-md transition rounded-xl cursor-pointer border-none"
            >
              {isHi ? "सभी स्वीकार करें" : "Accept All"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
