/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { TRANSLATIONS } from "../i18n/translations";
import { Camera, MapPin, FileText, Cpu, Users, CheckCircle, ArrowRight } from "lucide-react";

interface HowItWorksPageProps {
  onNavigate: (view: string) => void;
  language: "en" | "hi";
}

export default function HowItWorksPage({ onNavigate, language }: HowItWorksPageProps) {
  const dict = TRANSLATIONS[language];

  const steps = [
    {
      num: "01",
      icon: Camera,
      title: dict.evidenceStep,
      desc: language === "en" 
        ? "Citizens capture and upload real photo evidence of potholed roads, garbage heaps, broken street lights, or burst water mains. Stock presets are also available for quick sandbox testing."
        : "नागरिक गड्ढों वाली सड़कों, कचरे के ढेर, टूटी स्ट्रीट लाइटों या फटे पानी के पाइपों के वास्तविक फोटो प्रमाण अपलोड करते हैं। त्वरित सैंडबॉक्स परीक्षण के लिए स्टॉक प्रीसेट भी उपलब्ध हैं।",
      color: "text-[#21D4FD] border-[#21D4FD]/20"
    },
    {
      num: "02",
      icon: MapPin,
      title: dict.locationStep,
      desc: language === "en"
        ? "Pinpoint coordinates are resolved using geographic telemetry. If approximate obfuscation is toggled, coordinates are securely rounded to a 100m grid to protect reporter privacy."
        : "भौगोलिक टेलीमेट्री का उपयोग करके सटीक निर्देशांक निर्धारित किए जाते हैं। यदि अनुमानित स्थान चुना गया है, तो रिपोर्टर की गोपनीयता की रक्षा के लिए निर्देशांक 100 मीटर ग्रिड में बदल दिए जाते हैं।",
      color: "text-blue-400 border-blue-400/20"
    },
    {
      num: "03",
      icon: FileText,
      title: dict.descriptionStep,
      desc: language === "en"
        ? "Provide descriptive comments and landmark references. Our platform seamlessly records descriptions in either English or Hindi, serving diverse urban communities."
        : "वर्णनात्मक टिप्पणी और ऐतिहासिक स्थल संदर्भ प्रदान करें। हमारा प्लेटफ़ॉर्म विविध शहरी समुदायों की सेवा करते हुए अंग्रेजी या हिंदी में आसानी से विवरण दर्ज करता है।",
      color: "text-purple-400 border-purple-400/20"
    },
    {
      num: "04",
      icon: Cpu,
      title: dict.aiVerifyStep,
      desc: language === "en"
        ? "Gemini Multimodal AI processes the evidence to verify its authenticity, summarize descriptions, predict department routing, assess severity risk scores, and check for duplicates."
        : "जेमिनी मल्टीमॉडल एआई प्रमाणों को सत्यापित करता है, विवरण सारांशित करता है, उचित विभाग को सौंपने का अनुमान लगाता है, गंभीरता जोखिम स्कोर का आकलन करता है, और डुप्लिकेट की जांच करता है।",
      color: "text-emerald-400 border-emerald-400/20"
    },
    {
      num: "05",
      icon: Users,
      title: language === "en" ? "Community Verification" : "सामुदायिक सत्यापन",
      desc: language === "en"
        ? "Neighbors review nearby issues. By confirming or disputing reports, they build trust networks. Verifiers earn Civic Score points and unlock special badges."
        : "पड़ोसी आस-पास के मुद्दों की समीक्षा करते हैं। रिपोर्ट की पुष्टि या विवाद करके, वे विश्वास नेटवर्क बनाते हैं। सत्यापनकर्ता नागरिक अंक अर्जित करते हैं और विशेष बिल्ला अनलॉक करते हैं।",
      color: "text-[#FFB547] border-[#FFB547]/20"
    },
    {
      num: "06",
      icon: CheckCircle,
      title: language === "en" ? "Dispatch & Resolution" : "प्रेषण और समाधान",
      desc: language === "en"
        ? "Field crews verify issues on site, execute repairs, and upload before-and-after photo certifications. Operations are audited transparently in the public ledger."
        : "फील्ड क्रू साइट पर मुद्दों का सत्यापन करते हैं, मरम्मत करते हैं, और समाधान से पूर्व और बाद का तुलनात्मक फोटो विश्लेषण अपलोड करते हैं। सभी कार्य सार्वजनिक बही में सुरक्षित रहते हैं।",
      color: "text-rose-400 border-rose-400/20"
    }
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 text-left bg-theme-main text-theme-main font-sans">
      {/* Title & Header */}
      <div className="text-center mb-16 relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
          <h1 className="text-8xl font-black font-mono tracking-widest uppercase">FLOW</h1>
        </div>
        <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 px-3 py-1 rounded-full font-bold tracking-widest">
          {dict.howItWorks}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-theme-main uppercase tracking-tight mt-4 mb-2">
          {dict.tagline}
        </h1>
        <p className="text-xs sm:text-sm text-theme-muted max-w-xl mx-auto leading-relaxed">
          {language === "en"
            ? "CivicPulse AI combines community crowd-sourcing, Gemini multimodal vision models, and a decentralized ledger of dispatches to accelerate urban civic repairs."
            : "सिविक लेंस एआई शहरी नागरिक मरम्मत को तेज करने के लिए सामुदायिक क्राउड-सोर्सिंग, जेमिनी मल्टीमॉडल विज़न मॉडल और एक पारदर्शी नगरपालिका बही का संयोजन करता है।"}
        </p>
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((step) => {
          const IconComp = step.icon;
          return (
            <div
              key={step.num}
              className="p-6 bg-theme-secondary border border-theme-main hover:border-slate-500/40 rounded-3xl transition duration-300 relative group flex flex-col justify-between overflow-hidden shadow-sm"
            >
              {/* Corner Accent badge number */}
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30 transition font-mono text-3xl font-extrabold select-none">
                {step.num}
              </div>

              <div>
                {/* Icon Box */}
                <div className={`w-12 h-12 rounded-2xl bg-theme-tertiary border flex items-center justify-center mb-5 ${step.color}`}>
                  <IconComp className="w-6 h-6" />
                </div>

                <h3 className="text-sm font-extrabold text-theme-main uppercase tracking-wider mb-2 leading-tight">
                  {step.title}
                </h3>
                <p className="text-xs text-theme-muted leading-relaxed font-sans mb-4">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Call to Actions at the bottom */}
      <div className="mt-16 p-8 bg-gradient-to-r from-cyan-950/20 to-indigo-950/20 border border-theme-main/60 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-indigo-500"></div>
        <div className="text-left">
          <h3 className="text-base font-extrabold text-theme-main uppercase tracking-wide">
            {language === "en" ? "Ready to make an impact?" : "प्रभाव डालने के लिए तैयार हैं?"}
          </h3>
          <p className="text-xs text-theme-muted leading-relaxed mt-1 max-w-lg">
            {language === "en"
              ? "Report a new incident, check the live map, or log in to verify outstanding complaints near your neighborhood."
              : "एक नए मुद्दे की रिपोर्ट करें, लाइव मानचित्र की जांच करें, या अपने पड़ोस के पास शिकायतों को सत्यापित करने के लिए लॉग इन करें।"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={() => onNavigate("map")}
            className="px-5 py-2.5 bg-theme-secondary border border-theme-main text-theme-main hover:bg-theme-tertiary transition text-xs font-extrabold uppercase rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>{dict.exploreBtn}</span>
          </button>
          <button
            onClick={() => onNavigate("report")}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-extrabold uppercase rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md border-0"
          >
            <span>{dict.reportBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
