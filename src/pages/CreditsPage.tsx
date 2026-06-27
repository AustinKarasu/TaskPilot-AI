/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { 
  Award, 
  ArrowLeft, 
  Map, 
  Sparkles, 
  BarChart3, 
  ShieldCheck, 
  Flame, 
  Mail, 
  FileCheck, 
  ExternalLink,
  Code,
  Gift
} from "lucide-react";

interface CreditsPageProps {
  onNavigate: (view: string) => void;
  language: "en" | "hi";
}

interface DependencyCredit {
  name: string;
  category: string;
  icon: React.ComponentType<any>;
  descriptionEn: string;
  descriptionHi: string;
  license: string;
  url: string;
}

export default function CreditsPage({ onNavigate, language }: CreditsPageProps) {
  useEffect(() => {
    document.title = language === "hi" ? "ओपन सोर्स क्रेडिट | CivicPulse" : "Open Source Credits | CivicPulse AI";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Credits and acknowledgments for the open source software powering CivicPulse AI.");
    }
  }, [language]);

  const isHi = language === "hi";

  const dependencies: DependencyCredit[] = [
    {
      name: "Leaflet & OpenStreetMap",
      category: "Geospatial & Mapping",
      icon: Map,
      descriptionEn: "Powers our interactive community map grid, coordinate plotting, and density heatmaps.",
      descriptionHi: "हमारे इंटरैक्टिव समुदाय मानचित्र ग्रिड, निर्देशांक अंकन और घनत्व हीटमैप को शक्ति प्रदान करता है।",
      license: "BSD 2-Clause / ODbL",
      url: "https://leafletjs.com"
    },
    {
      name: "Chart.js & React Chartjs 2",
      category: "Data Visualization",
      icon: BarChart3,
      descriptionEn: "HTML5 canvas charting engine for real-time dashboard priority analytics and issue metrics.",
      descriptionHi: "वास्तविक समय डैशबोर्ड प्राथमिकता विश्लेषण और समस्या मीट्रिक के लिए चार्टिंग इंजन।",
      license: "MIT License",
      url: "https://www.chartjs.org"
    },
    {
      name: "Lucide Icons",
      category: "Iconography Assets",
      icon: Sparkles,
      descriptionEn: "Clean and modular vector symbols providing beautiful, accessible visual indicators.",
      descriptionHi: "स्वच्छ और मॉड्यूलर वेक्टर प्रतीक जो सुंदर, सुलभ दृश्य संकेतक प्रदान करते हैं।",
      license: "ISC License",
      url: "https://lucide.dev"
    },
    {
      name: "Framer Motion",
      category: "UI Animations",
      icon: Flame,
      descriptionEn: "Drives fluid interface transitions, micro-animations, and bento grid interactive card entries.",
      descriptionHi: "तरल इंटरफ़ेस संक्रमण, सूक्ष्म एनिमेशन और बेंटो ग्रिड कार्ड प्रविष्टियों को चलाता है।",
      license: "MIT License",
      url: "https://motion.dev"
    },
    {
      name: "DOMPurify",
      category: "Security & Sanitization",
      icon: ShieldCheck,
      descriptionEn: "High-performance HTML sanitization library preventing cross-site scripting (XSS) in reported descriptions and logs.",
      descriptionHi: "उच्च-प्रदर्शन HTML सैनिटाइजेशन लाइब्रेरी जो रिपोर्ट किए गए विवरणों और लॉग में क्रॉस-साइट स्क्रिप्टिंग (XSS) को रोकती है।",
      license: "Apache 2.0 / MPL 2.0",
      url: "https://github.com/cure53/DOMPurify"
    },
    {
      name: "Nodemailer",
      category: "Email Services",
      icon: Mail,
      descriptionEn: "SMTP mail agent handling priority alerts for issue creation, status changes, and admin verification.",
      descriptionHi: "एसएमटीपी मेल एजेंट जो समस्या निर्माण, स्थिति परिवर्तन और व्यवस्थापक सत्यापन के लिए अलर्ट भेजता है।",
      license: "MIT License",
      url: "https://nodemailer.com"
    },
    {
      name: "Zod Schema Validation",
      category: "Backend Validation",
      icon: FileCheck,
      descriptionEn: "Handles server payload verification, ensuring strict type-safety and endpoint request boundaries.",
      descriptionHi: "सर्वर पेलोड सत्यापन को संभालता है, सख्त प्रकार-सुरक्षा और अनुरोध सीमाओं को सुनिश्चित करता है।",
      license: "MIT License",
      url: "https://zod.dev"
    },
    {
      name: "Canvas Confetti",
      category: "UI Interactions & Gamification",
      icon: Gift,
      descriptionEn: "Highly efficient canvas-based performance confetti particle generator created by Kiril Vatev (catdad) on GitHub.",
      descriptionHi: "गिटहब पर किरिल वाटेव (catdad) द्वारा निर्मित अत्यधिक कुशल कैनवास-आधारित प्रदर्शन कंफ़ेद्दी कण जनरेटर।",
      license: "MIT License",
      url: "https://github.com/catdad/canvas-confetti"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 font-sans" role="main">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-[10px] font-mono text-cyan-400/70 mb-6 uppercase tracking-wider" aria-label="Breadcrumb">
        <button type="button" onClick={() => onNavigate("landing")} className="hover:text-cyan-300 focus:underline focus:outline-none cursor-pointer">
          {isHi ? "मुख्य पृष्ठ" : "Home"}
        </button>
        <span>&gt;</span>
        <span className="text-slate-400" aria-current="page">
          {isHi ? "ओपन सोर्स क्रेडिट" : "Open Source Credits"}
        </span>
      </nav>

      <div className="bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 sm:p-10 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/20 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Code className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black text-white font-display tracking-wide uppercase">
                {isHi ? "ओपन सोर्स क्रेडिट" : "Open Source Credits"}
              </h1>
              <p className="text-[10px] font-mono text-cyan-400 tracking-widest mt-1">
                {isHi ? "लाइसेंस और एट्रिब्यूशन" : "LICENSES & ATTRIBUTIONS"}
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

        {/* Introduction */}
        <div className="mb-10 text-left">
          <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <span>{isHi ? "ओपन सोर्स सॉफ़्टवेयर को आभार" : "Empowering Civic Tech through Open Source"}</span>
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            {isHi
              ? "सिविक लेंस एआई दुनिया के बेहतरीन ओपन-सोर्स सॉफ्टवेयर रिपॉजिटरी और समुदायों के कंधों पर खड़ा है। ये विश्वसनीय पुस्तकालय हमें वास्तविक समय मानचित्रण, कृत्रिम बुद्धिमत्ता, और सुरक्षित संचार बुनियादी ढांचा प्रदान करने में सक्षम बनाते हैं। हम उनके योगदानकर्ताओं को धन्यवाद देते हैं।"
              : "CivicPulse AI is built upon the foundational work of the global open source community. By utilizing industry-standard, robust libraries, we ensure maximum reliability, security, and rendering performance for critical municipal operations. Below are the core open-source repositories integrated into our architecture."}
          </p>
        </div>

        {/* Dependency Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dependencies.map((dep, index) => {
            const IconComp = dep.icon;
            return (
              <div 
                key={index} 
                className="bg-slate-900/50 hover:bg-slate-900/80 border border-cyan-500/10 hover:border-cyan-500/30 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between text-left group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:text-cyan-300 group-hover:border-cyan-500/40 transition">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-950/40 border border-cyan-900 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {dep.license}
                    </span>
                  </div>

                  <h3 className="text-white font-bold text-sm tracking-wide mb-1 font-display group-hover:text-cyan-300 transition font-sans">
                    {dep.name}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-500 mb-3 uppercase tracking-wider">
                    {dep.category}
                  </p>
                  
                  <p className="text-slate-400 text-xs leading-relaxed mb-6 font-sans">
                    {isHi ? dep.descriptionHi : dep.descriptionEn}
                  </p>
                </div>

                <a 
                  href={dep.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 transition cursor-pointer self-start group/link focus:outline-none focus:underline"
                >
                  <span>{isHi ? "रिपॉजिटरी देखें" : "View Repository"}</span>
                  <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            );
          })}
        </div>

        {/* Footer Acknowledgement */}
        <div className="border-t border-cyan-500/20 pt-8 mt-12 text-left">
          <h4 className="text-white font-bold text-sm mb-2">
            {isHi ? "लाइसेंस सूचना" : "Open Source Compliance"}
          </h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            {isHi
              ? "इस मंच पर उपयोग किए गए सभी घटक अपने संबंधित ओपन सोर्स लाइसेंस (जैसे एमआईटी, अपाचे 2.0 और बीएसडी) के तहत लाइसेंस प्राप्त हैं। पूर्ण लाइसेंस ग्रंथों को उनके संबंधित कोड रिपॉजिटरी या उत्पाद बंडलों में देखा जा सकता है।"
              : "All packages documented on this page are licensed under their respective copyright holder agreements (MIT, Apache 2.0, BSD, ISC, or ODbL). Full license texts can be retrieved from each package repository or public source distribution."}
          </p>
        </div>
      </div>
    </div>
  );
}
