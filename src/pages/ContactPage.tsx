/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, CheckCircle, AlertCircle, ArrowLeft, Bot, User as UserIcon, Lock, ShieldCheck } from "lucide-react";
import { User } from "../types";
import { getAuthHeaders } from "../lib/api";

interface ContactPageProps {
  onNavigate: (view: string) => void;
  language: "en" | "hi";
  currentUser: User;
}

export default function ContactPage({ onNavigate, language, currentUser }: ContactPageProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Simple Math CAPTCHA
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaError, setCaptchaError] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Tickets & Chat States
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isHi = language === "hi";
  const isGuest = !currentUser || currentUser.id === "anonymous_guest";

  useEffect(() => {
    generateCaptcha();
    document.title = isHi ? "संपर्क करें | CivicLens" : "Contact Support Desk | CivicLens AI";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Contact CivicLens support desk. File support tickets and get assistance.");
    }
  }, [language]);

  // Load User Tickets when logged in
  const loadUserTickets = async () => {
    if (isGuest) return;
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/tickets?userId=${currentUser.id}`, {
        headers: {
          ...authHeaders
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUserTickets(data);
      }
    } catch (err) {
      console.error("Failed to load user tickets:", err);
    }
  };

  useEffect(() => {
    loadUserTickets();
  }, [currentUser.id, isGuest]);

  // Load Ticket Messages when a ticket is opened
  const loadTicketMessages = async (ticketId: string) => {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        headers: {
          ...authHeaders
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTicketMessages(data);
      }
    } catch (err) {
      console.error("Failed to load ticket messages:", err);
    }
  };

  useEffect(() => {
    if (activeTicketId) {
      loadTicketMessages(activeTicketId);
      const interval = setInterval(() => {
        loadTicketMessages(activeTicketId);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeTicketId]);

  // Auto-scroll chat window
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticketMessages]);

  const generateCaptcha = () => {
    setNum1(Math.floor(Math.random() * 9) + 1);
    setNum2(Math.floor(Math.random() * 9) + 1);
    setCaptchaAnswer("");
    setCaptchaError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) return;

    setSubmitSuccess(false);
    setSubmitError(null);

    // Validate CAPTCHA
    const expected = num1 + num2;
    if (parseInt(captchaAnswer, 10) !== expected) {
      setCaptchaError(true);
      return;
    }

    setIsLoading(true);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { 
          ...authHeaders
        },
        body: JSON.stringify({ 
          name: currentUser.name, 
          email: currentUser.email, 
          subject, 
          message,
          userId: currentUser.id 
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit ticket");
      }

      setSubmitSuccess(true);
      setSubject("");
      setMessage("");
      generateCaptcha();
      loadUserTickets();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicketId) return;

    setSendingReply(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/tickets/${activeTicketId}/reply`, {
        method: "POST",
        headers: { 
          ...authHeaders
        },
        body: JSON.stringify({
          text: replyText,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          senderId: currentUser.id
        })
      });

      if (res.ok) {
        setReplyText("");
        loadTicketMessages(activeTicketId);
        loadUserTickets(); // Refresh ticket status if reopened
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 font-sans" role="main">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-mono text-cyan-400/70 mb-6 uppercase tracking-wider" aria-label="Breadcrumb">
        <button type="button" onClick={() => onNavigate("landing")} className="hover:text-cyan-300 focus:underline focus:outline-none cursor-pointer">
          {isHi ? "मुख्य पृष्ठ" : "Home"}
        </button>
        <span>&gt;</span>
        <span className="text-slate-400" aria-current="page">
          {isHi ? "संपर्क करें" : "Contact Us"}
        </span>
      </nav>

      {/* Main Support Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* Left Side: Contact info (Col span 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="border-b border-cyan-500/10 pb-3">
              <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                {isHi ? "कार्यालय विवरण" : "Support Center"}
              </h2>
            </div>

            <div className="flex gap-3.5 items-start">
              <MapPin className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-bold text-white mb-0.5">{isHi ? "पता" : "HQ Location"}</h4>
                <p className="text-slate-400 font-mono">Nanaon, Palampur, Kangra</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <Mail className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-bold text-white mb-0.5">{isHi ? "ईमेल समर्थन" : "Email Support"}</h4>
                <p className="text-slate-400 font-mono">aayankarasu@gmail.com</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <Phone className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-bold text-white mb-0.5">{isHi ? "हेल्पलाइन" : "Helpline"}</h4>
                <p className="text-slate-400 font-mono">+91 8091726602</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <Clock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-bold text-white mb-0.5">{isHi ? "कार्यालय समय" : "Service Hours"}</h4>
                <p className="text-slate-400 font-mono">Mon - Fri: 9:00 AM - 6:00 PM</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider">
              {isHi ? "त्वरित सहायता" : "Need Quick Response?"}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isHi
                ? "हमारी तकनीकी टीम सहायता टिकटों का उत्तर 12 घंटे के भीतर देती है।"
                : "Our technicians actively monitor contact submissions and ticket queues, maintaining a response time of under 12 hours."}
            </p>
            <a
              href="https://wa.me/918091726602"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            >
              <Phone className="w-4 h-4" />
              {isHi ? "व्हाट्सएप सपोर्ट चैट" : "WhatsApp Quick Chat"}
            </a>
          </div>
        </div>

        {/* Right Side: Form & Live Chat (Col span 8) */}
        <div className="lg:col-span-8 space-y-6">
          {isGuest ? (
            /* Restricted State for Guests */
            <div className="bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-8 shadow-xl text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-black text-white uppercase font-display tracking-wide">
                  {isHi ? "लॉगिन आवश्यक है" : "Authentication Required"}
                </h1>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  {isHi 
                    ? "सुरक्षा कारणों से, केवल लॉग इन किए हुए उपयोगकर्ता ही समर्थन टिकट बना सकते हैं। कृपया पहले अपने क्रेडेंशियल्स के साथ साइन इन करें।" 
                    : "For security and accountability, you must be logged in to register support tickets and chat with administrators. Please log in first."}
                </p>
              </div>
              <button
                onClick={() => onNavigate("auth")}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs tracking-wider rounded-xl shadow-lg transition-all cursor-pointer uppercase font-mono"
              >
                Sign In / Register
              </button>
            </div>
          ) : (
            /* Authenticated State */
            <div className="space-y-6">
              {/* Submission Form */}
              <div className="bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
                <div className="flex justify-between items-center border-b border-cyan-500/10 pb-4 mb-6">
                  <div>
                    <h1 className="text-xl font-black text-white uppercase font-display tracking-wide">
                      {isHi ? "समर्थन अनुरोध फ़ॉर्म" : "Send Support Ticket"}
                    </h1>
                    <p className="text-xs text-slate-400">
                      {isHi ? "अपनी समस्या के निवारण के लिए टिकट बनाएं।" : "File a support ticket or inquiry."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate("landing")}
                    className="flex items-center gap-2 px-3 py-1.5 text-[10px] bg-slate-900 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 hover:text-white rounded-lg transition cursor-pointer font-mono"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    {isHi ? "होमपेज" : "Back to Home"}
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitSuccess && (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        {isHi
                          ? "आपका टिकट सफलतापूर्वक दर्ज हो गया है! नीचे आपके टिकटों की सूची में देखें।"
                          : "Support ticket registered successfully! Check your tickets section below."}
                      </span>
                    </div>
                  )}

                  {submitError && (
                    <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-bold">
                        {isHi ? "आपका नाम" : "Your Name"}
                      </label>
                      <input
                        type="text"
                        value={currentUser.name}
                        disabled
                        className="w-full bg-slate-900/60 border border-cyan-500/10 rounded-xl text-xs py-2.5 px-3 text-slate-400 cursor-not-allowed font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-bold">
                        {isHi ? "ईमेल" : "Email Address"}
                      </label>
                      <input
                        type="email"
                        value={currentUser.email}
                        disabled
                        className="w-full bg-slate-900/60 border border-cyan-500/10 rounded-xl text-xs py-2.5 px-3 text-slate-400 cursor-not-allowed font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                      {isHi ? "विषय" : "Subject"}
                    </label>
                    <input
                      type="text"
                      id="contact-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      placeholder="What is the ticket regarding?"
                      className="w-full bg-slate-900/60 border border-cyan-500/10 focus:border-cyan-500/40 focus:outline-none rounded-xl text-xs py-2.5 px-3 text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                      {isHi ? "विवरण / संदेश" : "Message Detail"}
                    </label>
                    <textarea
                      id="contact-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={4}
                      placeholder="Describe your issue or feedback in detail..."
                      className="w-full bg-slate-900/60 border border-cyan-500/10 focus:border-cyan-500/40 focus:outline-none rounded-xl text-xs p-3 text-white"
                    ></textarea>
                  </div>

                  {/* CAPTCHA */}
                  <div className="border border-cyan-500/10 bg-slate-900/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-300">
                      <span className="font-mono text-cyan-400 font-bold mr-1">CAPTCHA:</span>
                      {isHi ? `सुरक्षा के लिए हल करें: ${num1} + ${num2} = ?` : `Solve for security: ${num1} + ${num2} = ?`}
                    </div>
                    <div className="w-full sm:w-auto">
                      <input
                        type="text"
                        value={captchaAnswer}
                        onChange={(e) => {
                          setCaptchaAnswer(e.target.value);
                          setCaptchaError(false);
                        }}
                        required
                        placeholder="Answer"
                        className="w-full sm:w-28 text-center bg-slate-900 border border-cyan-500/15 focus:border-cyan-500/40 focus:outline-none rounded-xl text-xs py-2 px-3 text-white"
                      />
                      {captchaError && (
                        <div className="text-[10px] text-red-400 font-mono mt-1 text-center sm:text-right">
                          {isHi ? "गलत उत्तर" : "Incorrect Answer"}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none border-none"
                  >
                    <Send className="w-4 h-4" />
                    {isHi ? "टिकट भेजें" : "Submit Support Ticket"}
                  </button>
                </form>
              </div>

              {/* USER'S TICKETS & LIVE CHAT VIEW */}
              <div className="bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider border-b border-cyan-500/10 pb-3 mb-4">
                  {isHi ? "आपके समर्थन टिकट" : "Your Support Tickets"}
                </h3>

                {userTickets.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-6 text-center">
                    {isHi ? "आपके पास कोई सक्रिय समर्थन टिकट नहीं है।" : "You have not registered any support tickets yet."}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Ticket List side (Col span 5) */}
                    <div className="md:col-span-5 space-y-2 max-h-[350px] overflow-y-auto pr-2">
                      {userTickets.map((tkt) => (
                        <button
                          key={tkt.id}
                          onClick={() => setActiveTicketId(tkt.id)}
                          className={`w-full p-3.5 rounded-xl border text-left transition flex flex-col gap-1.5 focus:outline-none cursor-pointer ${
                            activeTicketId === tkt.id
                              ? "bg-cyan-950/40 border-cyan-400 text-white"
                              : "bg-slate-900/40 border-cyan-500/10 hover:border-cyan-500/35 text-slate-300"
                          }`}
                        >
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="font-bold text-cyan-400">{tkt.id}</span>
                            <span className={`px-1.5 py-0.5 rounded uppercase ${
                              tkt.status === "resolved"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : tkt.status === "claimed"
                                ? "bg-blue-500/15 text-blue-400 animate-pulse"
                                : "bg-orange-500/15 text-orange-400"
                            }`}>
                              {tkt.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold truncate">{tkt.subject}</h4>
                          {tkt.claimedByName && (
                            <span className="text-[9px] font-mono text-slate-400">
                              Claimed by: {tkt.claimedByName}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Live Ticket Chat Pane (Col span 7) */}
                    <div className="md:col-span-7 border border-cyan-500/10 bg-slate-900/30 rounded-2xl p-4 flex flex-col h-[350px]">
                      {activeTicketId ? (
                        <>
                          {/* Chat Header */}
                          <div className="flex justify-between items-center border-b border-cyan-500/10 pb-2 mb-3">
                            <div className="text-xs">
                              <span className="font-mono text-cyan-400 font-bold block">{activeTicketId}</span>
                              <span className="text-slate-400 text-[10px] font-sans truncate block max-w-[200px]">
                                {userTickets.find(t => t.id === activeTicketId)?.subject}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-500">
                              Auto-updates active
                            </span>
                          </div>

                          {/* Message List Area */}
                          <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 mb-3">
                            {/* Original message as first bubble */}
                            {(() => {
                              const tkt = userTickets.find(t => t.id === activeTicketId);
                              if (!tkt) return null;
                              return (
                                <div className="flex gap-2 justify-start">
                                  <div className="w-6.5 h-6.5 shrink-0 rounded-lg bg-cyan-950 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-[10px]">
                                    <UserIcon className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="bg-[#0D1B2A]/80 border border-theme-main text-slate-200 rounded-2xl rounded-bl-none px-3 py-2 text-[11px] max-w-[80%] leading-relaxed text-left">
                                    <span className="block font-bold text-[9px] text-cyan-400 mb-1">{tkt.name} (Original Request)</span>
                                    {tkt.message}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Ticket replies list */}
                            {ticketMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex gap-2 ${
                                  msg.senderRole !== "citizen" ? "justify-start" : "justify-end"
                                }`}
                              >
                                {msg.senderRole !== "citizen" && (
                                  <div className="w-6.5 h-6.5 shrink-0 rounded-lg bg-indigo-950 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px]">
                                    <Bot className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                <div
                                  className={`rounded-2xl px-3 py-2 text-[11px] max-w-[80%] leading-relaxed text-left ${
                                    msg.senderRole === "citizen"
                                      ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-br-none"
                                      : "bg-slate-900 border border-cyan-500/10 text-slate-200 rounded-bl-none"
                                  }`}
                                >
                                  <span className="block font-bold text-[9px] text-cyan-400 mb-1">
                                    {msg.senderName} ({msg.senderRole.toUpperCase()})
                                  </span>
                                  {msg.text}
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>

                          {/* Reply submission form */}
                          <form onSubmit={handleSendReply} className="flex gap-2">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type support reply message..."
                              required
                              className="flex-1 bg-slate-950 border border-cyan-500/10 focus:border-cyan-500/35 focus:outline-none rounded-xl text-xs py-2 px-3 text-white"
                            />
                            <button
                              type="submit"
                              disabled={sendingReply}
                              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50 cursor-pointer border-none"
                            >
                              Send
                            </button>
                          </form>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 italic text-xs">
                          <MessageSquare className="w-8 h-8 text-cyan-500/20 mb-2 animate-bounce" />
                          <span>Select a ticket to launch support chat</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
