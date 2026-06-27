/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { Shield, Eye, Lock, Globe, ArrowLeft } from "lucide-react";

interface PrivacyPageProps {
  onNavigate: (view: string) => void;
  language: "en" | "hi";
}

export default function PrivacyPage({ onNavigate, language }: PrivacyPageProps) {
  useEffect(() => {
    document.title = language === "hi" ? "गोपनीयता नीति | CivicPulse" : "Privacy Policy | CivicPulse AI";
    // Set meta description dynamically
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Privacy Policy for CivicPulse AI metropolitan digital infrastructure auditing platform.");
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
          {isHi ? "गोपनीयता नीति" : "Privacy Policy"}
        </span>
      </nav>

      <div className="bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 sm:p-10 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/20 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black text-white font-display tracking-wide uppercase">
                {isHi ? "गोपनीयता नीति" : "Privacy Policy"}
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
              <Eye className="w-4 h-4 text-cyan-400" />
              <h2>{isHi ? "1. जानकारी जो हम एकत्र करते हैं" : "1. Information We Collect"}</h2>
            </div>
            <p className="mb-3">
              {isHi
                ? "हम आपके अनुभव को सुरक्षित और पारदर्शी बनाने के लिए निम्नलिखित जानकारी एकत्र करते हैं:"
                : "We collect information to provide a safe, secure, and transparent infrastructure auditing platform. This includes:"}
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1.5 font-mono text-xs text-slate-400">
              <li>{isHi ? "खाता विवरण: नाम, ईमेल पता और पासवर्ड।" : "Account Details: Name, email address, and security credentials."}</li>
              <li>{isHi ? "नागरिक रिपोर्टें: चित्र (फोटो), विवरण, समस्या श्रेणी और स्थान।" : "Citizen Reports: Images, descriptions, categories, and geocodes."}</li>
              <li>{isHi ? "सत्यापन डेटा: रिपोर्टों पर दिए गए आपके मत और समीक्षा टिप्पणियां।" : "Consensus Auditing: Votes and verifications cast on reported issues."}</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-2 text-white font-bold text-base mb-3">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h2>{isHi ? "2. स्थान डेटा का उपयोग" : "2. Geolocation & Privacy"}</h2>
            </div>
            <p className="mb-3">
              {isHi
                ? "नागरिक रिपोर्टों की सटीकता सुनिश्चित करने के लिए हम जीपीएस स्थानों का उपयोग करते हैं। आपकी गोपनीयता की रक्षा के लिए, सार्वजनिक मानचित्र पर 'अंदाज़ित स्थान' (Obfuscated Coordinates) विकल्प सक्षम किया जा सकता है।"
                : "To resolve civic issues, precise GPS coordinates are extracted from images. To protect your privacy, you can choose to obfuscate public coordinates using 'Approximate Location' settings before submitting."}
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 text-white font-bold text-base mb-3">
              <Lock className="w-4 h-4 text-cyan-400" />
              <h2>{isHi ? "3. डेटा सुरक्षा" : "3. Data Security & Storage"}</h2>
            </div>
            <p className="mb-3">
              {isHi
                ? "आपकी पासवर्ड जानकारी को सर्वर-साइड पर सुरक्षित रूप से हैश (SHA-256) किया जाता है। सभी प्रसारण एसएसएल/टीएलएस सुरक्षित चैनलों (HTTPS) के माध्यम से किए जाते हैं।"
                : "Your account security is protected using strong password hashing algorithms (SHA-256 with salts) and secure transport layers (HTTPS). Node-level rate limits prevent brute force and API scraping attacks."}
            </p>
          </section>

          <section className="border-t border-cyan-500/20 pt-6">
            <h2 className="text-white font-bold text-sm mb-2">{isHi ? "अधिक जानकारी के लिए संपर्क करें:" : "Contact Information Regarding Privacy:"}</h2>
            <p className="font-mono text-xs text-cyan-400">
              Email: aayankarasu@gmail.com | Phone: 8091726602
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
