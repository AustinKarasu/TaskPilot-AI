/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { HelpCircle, Search, ChevronDown, ChevronUp, Tag, ArrowLeft } from "lucide-react";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: "general" | "points" | "audits" | "security" | "dev";
}

interface FAQPageProps {
  onNavigate: (view: string) => void;
  language: "en" | "hi";
}

export default function FAQPage({ onNavigate, language }: FAQPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "general" | "points" | "audits" | "security" | "dev">("all");
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  useEffect(() => {
    document.title = language === "hi" ? "अक्सर पूछे जाने वाले प्रश्न | CivicPulse" : "FAQ Knowledge Base | CivicPulse AI";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Frequently Asked Questions about CivicPulse AI platform, rewards, auditing, and developer.");
    }
  }, [language]);

  const isHi = language === "hi";

  const faqs: FAQItem[] = [
    {
      id: 1,
      category: "general",
      question: isHi ? "सिविक लेंस एआई क्या है?" : "What is CivicPulse AI?",
      answer: isHi 
        ? "यह एक हाइपरलोकल इंफ्रास्ट्रक्चर ऑडिटिंग प्लेटफॉर्म है जो नागरिकों को बुनियादी ढांचा समस्याओं की रिपोर्ट करने और नगरपालिकाओं के साथ काम करके उनका समाधान करने में मदद करता है।" 
        : "CivicPulse AI is a hyperlocal infrastructure auditing and problem resolution platform. It coordinates citizen reports, peer verifications, and municipal resolution tracking using Gemini AI integrations."
    },
    {
      id: 2,
      category: "general",
      question: isHi ? "मैं एक नई समस्या की रिपोर्ट कैसे कर सकता हूँ?" : "How do I report a new infrastructure issue?",
      answer: isHi 
        ? "शीर्षलेख में 'रिपोर्ट समस्या' पर क्लिक करें, एक फोटो अपलोड करें, एआई द्वारा इसे स्कैन करने दें, पते और विवरणों की जांच करें और अंत में जमा करें।" 
        : "Click 'Report Issue' in the header navigation, upload an image of the defect, let Gemini analyze the category/severity, verify the location coordinates, and submit."
    },
    {
      id: 3,
      category: "general",
      question: isHi ? "लाइव हीटमैप क्या है?" : "What is the live telemetry heatmap?",
      answer: isHi 
        ? "यह मानचित्र पर एक पारदर्शी परत है जो समस्या की सघनता और तात्कालिकता को दर्शाती है (लाल: गंभीर, नारंगी: उच्च, हरा: हल किया हुआ)।" 
        : "It is a canvas-based overlay on the Leaflet map that displays glowing hotspots indicating issue density and urgency levels (Red: Critical, Orange: High, Green: Resolved)."
    },
    {
      id: 4,
      category: "points",
      question: isHi ? "मैं नागरिक अंक (Civic Points) कैसे कमा सकता हूँ?" : "How do I earn Civic Points?",
      answer: isHi 
        ? "आपको एक वैध रिपोर्ट जमा करने पर +25 अंक और अन्य रिपोर्टों को सत्यापित करने पर +10 अंक (सुलझने के बाद) मिलते हैं।" 
        : "You earn +25 Civic Points for submitting a valid report and +10 points for verifying peer issues (payout is credited once the issue is resolved to prevent spam)."
    },
    {
      id: 5,
      category: "points",
      question: isHi ? "दैनिक स्ट्रीक गुणक क्या है?" : "What is the daily streak multiplier?",
      answer: isHi 
        ? "लगातार दिनों में रिपोर्ट सबमिट करने पर आपको स्ट्रीक बोनस अंक (days * 15) प्रदान किए जाते हैं।" 
        : "Submitting reports on consecutive days triggers a streak multiplier. You receive an additional `streak_days * 15` bonus points."
    },
    {
      id: 6,
      category: "points",
      question: isHi ? "अंकों को कैसे भुनाया जा सकता है?" : "How can I redeem my civic points?",
      answer: isHi 
        ? "अपने प्रोफ़ाइल टैब पर जाएँ, 'पुरस्कार' अनुभाग देखें, और उपलब्ध वाउचर (जैसे बस पास या टैक्स छूट) को भुनाने के लिए क्लिक करें।" 
        : "Go to your Profile tab, view available rewards (like public transit passes or property tax discounts), and click 'Redeem' to generate a voucher code."
    },
    {
      id: 7,
      category: "audits",
      question: isHi ? "सामुदायिक आम सहमति (Consensus) क्या है?" : "What is the community consensus auditing system?",
      answer: isHi 
        ? "यह पड़ोसियों द्वारा रिपोर्ट की पुष्टि या विवाद करने का तरीका है। 5 से अधिक सत्यापित मत मिलने पर रिपोर्ट 'वेरिफाइड' हो जाती है।" 
        : "Consensus is the community validation system. Local residents vote to 'Confirm' or 'Dispute' a report. Reaching 5+ confirm votes automatically escalates the issue status to 'VERIFIED'."
    },
    {
      id: 8,
      category: "audits",
      question: isHi ? "फ़ोरेंसिक विज़ुअल सत्यापन कैसे काम करता है?" : "How does forensic visual verification work?",
      answer: isHi 
        ? "जब कर्मचारी समाधान फोटो अपलोड करते हैं, तो मिथुन एआई (Gemini) 'पहले' और 'बाद' की फोटो की तुलना करके सुनिश्चित करता है कि काम पूरा हो गया है।" 
        : "When a technician uploads a resolved photo proof, Gemini AI analyzes and compares it to the original 'Before' image to verify that the pothole is paved or trash is cleared."
    },
    {
      id: 9,
      category: "security",
      question: isHi ? "क्या मेरी पहचान सुरक्षित है?" : "Is my identity protected when reporting?",
      answer: isHi 
        ? "हाँ, आप मानचित्र पर अपनी सटीक स्थिति छिपाने के लिए 'अंदाज़ित स्थान' (Obfuscate Coordinates) विकल्प चुन सकते हैं।" 
        : "Yes, you can enable coordinate obfuscation before submitting. The system will offset coordinates slightly on the public map to protect your home privacy."
    },
    {
      id: 10,
      category: "security",
      question: isHi ? "मंच पर पासवर्ड कैसे सुरक्षित रखे जाते हैं?" : "How are user passwords secured?",
      answer: isHi 
        ? "सभी पासवर्ड्स को सर्वर पर SHA-256 एल्गोरिदम द्वारा सुरक्षित रूप से हैश करके स्टोर किया जाता है।" 
        : "Passwords are dynamically hashed using the cryptographic SHA-256 algorithm with unique salts on the backend before being written to disk, preventing plaintext exposure."
    },
    {
      id: 11,
      category: "security",
      question: isHi ? "क्या इस प्लेटफ़ॉर्म पर रेट लिमिट लागू है?" : "Is there API rate limiting?",
      answer: isHi 
        ? "हाँ, आईपी पते के आधार पर प्रति मिनट अधिकतम 50 अनुरोधों की सीमा है ताकि स्पैम और बॉट्स से सुरक्षा की जा सके।" 
        : "Yes, the server enforces rate limiting (maximum 50 requests per minute per IP address) on chatbot, auth, and support ticket submissions to prevent spam attacks."
    },
    {
      id: 12,
      category: "dev",
      question: isHi ? "इस वेबसाइट को किसने विकसित किया है?" : "Who made this website?",
      answer: isHi 
        ? "इस वेबसाइट को अयान परमार (अयान करासु) ने विकसित किया है। पोर्टफोलियो: aayankarasu.fun, संपर्क: 8091726602, ईमेल: aayankarasu@gmail.com।" 
        : "This website was developed by Aayan Parmar (Aayan Karasu). Details:\n- Portfolio: aayankarasu.fun\n- Contact Number: 8091726602\n- Email: aayankarasu@gmail.com\nFeel free to reach out for collaborations!"
    },
    {
      id: 13,
      category: "audits",
      question: isHi ? "क्या कोई रिपोर्ट अस्वीकार की जा सकती है?" : "Can a report be rejected?",
      answer: isHi 
        ? "हाँ, यदि प्रशासक को रिपोर्ट नकली या स्पैम लगती है, तो वे इसे अस्वीकार कर सकते हैं और रिपोर्टर के 30 अंक काट लिए जाते हैं।" 
        : "Yes, administrators can reject fake, duplicate, or spam reports. A rejection penalizes the reporter by deducting 30 points from their balance."
    },
    {
      id: 14,
      category: "general",
      question: isHi ? "क्या इस ऐप को इंस्टॉल करने की आवश्यकता है?" : "Do I need to download a mobile app?",
      answer: isHi 
        ? "नहीं, यह एक पूरी तरह से उत्तरदायी वेब ऐप है जो मोबाइल और डेस्कटॉप दोनों पर आसानी से चलता है।" 
        : "No, CivicPulse AI is built as a fully responsive progressive-style web application that runs directly in any modern mobile or desktop browser without downloads."
    },
    {
      id: 15,
      category: "security",
      question: isHi ? "क्या प्रशासक खाते में टू-फैक्टर ऑथेंटिकेशन (2FA) है?" : "Does administrator login support 2FA?",
      answer: isHi 
        ? "हाँ, सुरक्षा डेस्क लॉगिन पर सुरक्षा कोड सीधे प्रशासक के पंजीकृत ईमेल पर भेजा जाता है।" 
        : "Yes, logging in as an administrator requires two-factor authentication (2FA), with a verification security code dispatched via SMTP to the administrator's registered email address."
    }
  ];

  const handleToggle = (id: number) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "all", name: isHi ? "सभी प्रश्न" : "All FAQs" },
    { id: "general", name: isHi ? "सामान्य" : "General" },
    { id: "points", name: isHi ? "अंक और पुरस्कार" : "Points & Rewards" },
    { id: "audits", name: isHi ? "ऑडिटिंग" : "Auditing" },
    { id: "security", name: isHi ? "सुरक्षा" : "Security" },
    { id: "dev", name: isHi ? "डेवलपर" : "Developer" }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans" role="main">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-mono text-cyan-400/70 mb-6 uppercase tracking-wider" aria-label="Breadcrumb">
        <button type="button" onClick={() => onNavigate("landing")} className="hover:text-cyan-300 focus:underline focus:outline-none cursor-pointer">
          {isHi ? "मुख्य पृष्ठ" : "Home"}
        </button>
        <span>&gt;</span>
        <span className="text-slate-400" aria-current="page">FAQ</span>
      </nav>

      <div className="bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 sm:p-10 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/20 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black text-white font-display tracking-wide uppercase">
                {isHi ? "अक्सर पूछे जाने वाले प्रश्न" : "FAQ Knowledge Base"}
              </h1>
              <p className="text-xs text-slate-400">
                {isHi ? "त्वरित समाधान और मंच की जानकारी प्राप्त करें।" : "Find quick answers and guides about the CivicPulse platform."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("landing")}
            className="flex items-center gap-2 px-4 py-2 text-xs bg-slate-900 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 hover:text-white rounded-xl transition cursor-pointer focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {isHi ? "वापस जाएं" : "Back to Home"}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isHi ? "यहाँ प्रश्न या विषय खोजें..." : "Search FAQs by keyword..."}
            className="w-full bg-slate-900/60 border border-cyan-500/10 focus:border-cyan-500/40 focus:outline-none rounded-xl text-xs py-3 pl-10 pr-4 text-white placeholder-slate-500 transition-colors"
            aria-label="Search FAQ database"
          />
        </div>

        {/* Categories Tab Bar */}
        <div className="flex flex-wrap gap-1.5 mb-8 border-b border-cyan-500/10 pb-4 justify-start">
          {categories.map(cat => (
            <button
              type="button"
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wide uppercase transition cursor-pointer border focus:ring-2 focus:ring-cyan-500 focus:outline-none ${
                activeCategory === cat.id
                  ? "bg-cyan-950/80 border-cyan-400 text-cyan-300"
                  : "bg-slate-900/30 border-cyan-500/10 text-slate-400 hover:border-cyan-500/30 hover:text-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Accordions Scroller */}
        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map(faq => {
              const isExpanded = expandedIds.includes(faq.id);
              return (
                <div
                  key={faq.id}
                  className="bg-slate-950/60 border border-cyan-500/10 hover:border-cyan-500/20 rounded-2xl overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(faq.id)}
                    aria-expanded={isExpanded}
                    className="w-full p-4 flex justify-between items-center text-left text-xs font-bold text-white hover:text-cyan-300 transition-colors focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <span className="text-cyan-400 shrink-0 ml-4">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-cyan-500/5 text-xs text-slate-300 whitespace-pre-line text-left leading-relaxed font-sans">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-500 font-mono text-xs">
              {isHi ? "कोई प्रश्न नहीं मिला।" : "No FAQs match your search criteria."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
