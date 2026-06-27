/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { FileText, Award, Scale, HelpCircle, ArrowLeft } from "lucide-react";

interface TermsPageProps {
  onNavigate: (view: string) => void;
  language: "en" | "hi";
}

export default function TermsPage({ onNavigate, language }: TermsPageProps) {
  useEffect(() => {
    document.title = language === "hi" ? "नियम और शर्तें | CivicLens" : "Terms and Conditions | CivicLens AI";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Terms and Conditions for CivicLens AI hyperlocal auditing and points system.");
    }
  }, [language]);

  const isHi = language === "hi";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans" role="main">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-[10px] font-mono text-cyan-400/70 mb-6 uppercase tracking-wider" aria-label="Breadcrumb">
        <button type="button" onClick={() => onNavigate("landing")} className="hover:text-cyan-300 focus:underline focus:outline-none cursor-pointer">
          {isHi ? "मुख्य पृष्ठ" : "Home"}
        </button>
        <span>&gt;</span>
        <span className="text-slate-400" aria-current="page">
          {isHi ? "नियम और शर्तें" : "Terms & Conditions"}
        </span>
      </nav>

      <div className="bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 sm:p-10 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/20 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black text-white font-display tracking-wide uppercase">
                {isHi ? "नियम और शर्तें" : "Terms & Conditions"}
              </h1>
              <p className="text-[10px] font-mono text-cyan-400 tracking-widest mt-1">
                {isHi ? "अंतिम अद्यतन: 24 जून 2026" : "LAST UPDATED: JUNE 24, 2026"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("landing")}
            className="flex items-center gap-2 px-4 py-2 text-xs bg-slate-900 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 hover:text-white rounded-xl transition cursor-pointer focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono"
            aria-label={isHi ? "मुख्य पृष्ठ पर वापस जाएं" : "Return to Home Page"}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {isHi ? "वापस जाएं" : "Back to Home"}
          </button>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-slate-300 text-sm leading-relaxed text-left">
          <section>
            <div className="flex items-center gap-2 text-white font-bold text-base mb-3">
              <Scale className="w-4 h-4 text-cyan-400" />
              <h2>{isHi ? "1. मंच का उपयोग" : "1. Platform Usage & Rules"}</h2>
            </div>
            <p>
              {isHi
                ? "सिविक लेंस एआई एक सार्वजनिक उपयोगिता मंच है। उपयोगकर्ताओं को केवल वास्तविक और सटीक बुनियादी ढांचा समस्याओं (जैसे गड्ढे, पानी का रिसाव, कचरा ढेर) की रिपोर्ट करनी चाहिए। फर्जी या दुर्भावनापूर्ण रिपोर्ट दर्ज करने पर खाता निलंबित किया जा सकता है।"
                : "CivicLens AI is designed as a public utility to report neighborhood infrastructure problems. Users must only submit valid, accurate issues. Fabricating reports or submitting malicious information will lead to immediate account suspension."}
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 text-white font-bold text-base mb-3">
              <Award className="w-4 h-4 text-cyan-400" />
              <h2>{isHi ? "2. पुरस्कार और अंक प्रणाली" : "2. Rewards & Point Redemptions"}</h2>
            </div>
            <p>
              {isHi
                ? "रिपोर्ट दर्ज करने और सत्यापित करने पर आपको नागरिक अंक (Civic Points) प्रदान किए जाते हैं। इन अंकों का उपयोग कूपन कूपन भुनाने के लिए किया जा सकता है। अंक वितरण की अंतिम जिम्मेदारी नगर निकाय के प्रशासक के पास सुरक्षित है।"
                : "Civic Points are awarded for valid reported issues (+25) and consensus verifications (+10, pending resolution). Redeemed rewards and coupons are distributed at the sole discretion of municipal administrators and participating local vendor agreements."}
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 text-white font-bold text-base mb-3">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <h2>{isHi ? "3. जिम्मेदारी की सीमा" : "3. Liability Disclaimer"}</h2>
            </div>
            <p>
              {isHi
                ? "हम प्लेटफॉर्म के माध्यम से किसी भी भौतिक जोखिम को कम करने का प्रयास करते हैं, लेकिन सड़क और अन्य बुनियादी खतरों पर स्वयं नागरिकों की सतर्कता आवश्यक है। सिविक लेंस एआई किसी भी भौतिक क्षति या चोट के लिए जिम्मेदार नहीं होगा।"
                : "CivicLens AI functions as a crowdsourced ledger and dispatcher. While we provide safety recommendations based on AI hazard scanning, we assume no direct liability for physical damage, scooter crashes, or injuries occurring near reported public hazard sites."}
            </p>
          </section>

          <section className="border-t border-cyan-500/20 pt-6">
            <h2 className="text-white font-bold text-sm mb-2">{isHi ? "सहयोग और नियमों की पुष्टि के लिए धन्यवाद" : "Thank you for supporting community accountability."}</h2>
            <p className="font-mono text-xs text-slate-400">
              {isHi ? "सिविक लेंस एआई टीम, बेंगलुरु विभाग।" : "CivicLens AI Board, Municipal Works Division."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
