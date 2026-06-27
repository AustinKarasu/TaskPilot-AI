/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, Sparkles, AlertCircle } from "lucide-react";
import { User } from "../types";

interface Message {
  role: "user" | "assistant";
  text: string;
  isError?: boolean;
}

interface AIChatbotProps {
  language: "en" | "hi";
  theme: "light" | "dark";
  currentUser?: User;
}

export default function AIChatbot({ language, theme, currentUser }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text:
        language === "hi"
          ? "नमस्ते! मैं सिविक लेंस AI सहायक हूँ। मैं इस प्लेटफॉर्म, इसके डार्क थीम, शिकायत दर्ज करने, नागरिक सत्यापन, और पुरस्कारों से संबंधित प्रश्नों के उत्तर दे सकता हूँ। मैं आपकी आज कैसे मदद कर सकता हूँ?"
          : "Hello! I am the CivicLens AI assistant. I can answer questions about the CivicLens platform, its features, dark glassmorphism design, reporting, verification, and points/leaderboard. How can I help you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: Message = { role: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const history = messages
        .slice(1) // skip the initial greeting
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, history, userId: currentUser?.id || "anonymous_guest" })
      });

      if (!res.ok) {
        throw new Error("Chatbot API response error");
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (err) {
      console.error("Failed to fetch chatbot response:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            language === "hi"
              ? "क्षमा करें, AI असिस्टेंट सेवा वर्तमान में ऑफ़लाइन है। कृपया कुछ समय बाद पुनः प्रयास करें।"
              : "I'm sorry, the AI chatbot service is temporarily offline. Please try again in a few moments.",
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const suggestions =
    language === "hi"
      ? [
          "सिविक लेंस क्या है और यह कैसे मदद करता है?",
          "Gemini AI पूर्ण मरम्मत को कैसे सत्यापित करता है?",
          "समुदाय द्वारा रिपोर्टों को कैसे सत्यापित किया जाता है?",
          "मैं अंक कैसे कमाऊं और पुरस्कारों का दावा कैसे करूं?",
          "मेरी गोपनीयता और स्थान कैसे सुरक्षित हैं?"
        ]
      : [
          "What is CivicLens AI & how does it help?",
          "How does Gemini AI verify completed repairs?",
          "How are reports validated by the community?",
          "How do I earn points & claim rewards?",
          "How is my privacy and location protected?"
        ];

  return (
    <>
      {/* FLOATING CHAT TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 hover:scale-105 active:scale-95 text-white rounded-full shadow-[0_8px_30px_rgb(6,182,212,0.3)] transition-all duration-300 flex items-center justify-center cursor-pointer group"
        id="ai-chatbot-trigger"
        title="CivicLens AI Chatbot"
      >
        <div className="relative">
          {isOpen ? (
            <X className="w-6 h-6 transition-transform duration-300 rotate-90" />
          ) : (
            <>
              <Bot className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" />
              <span className="absolute -top-1.5 -right-1.5 bg-[#FF6B6B] w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-950 animate-ping"></span>
              <span className="absolute -top-1.5 -right-1.5 bg-[#FF6B6B] w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-950"></span>
            </>
          )}
        </div>
      </button>

      {/* CONVERSATION PANEL */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[92vw] sm:w-[380px] h-[520px] max-h-[75vh] sm:max-h-[80vh] bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col animate-scale-up font-sans"
          id="ai-chatbot-panel"
        >
          {/* HEADER HEADER */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-[#122338] border-b border-cyan-500/20 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* Premium Gradient circular AI avatar */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center text-white relative shadow-md shadow-cyan-500/10">
                <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900"></span>
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black tracking-widest text-white uppercase font-display">CivicLens AI Agent</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span className="text-[9px] font-mono text-cyan-300 uppercase tracking-wide">Online Support</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition p-1 hover:bg-slate-800/50 rounded-lg cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* CHAT BUBBLES SCROLLER */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 shrink-0 rounded-lg bg-slate-900 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed text-left ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-cyan-900/10"
                      : msg.isError
                      ? "bg-red-500/10 border border-red-500/20 text-red-300 rounded-bl-none flex items-start gap-2"
                      : "bg-[#0D1B2A]/80 border border-theme-main text-slate-200 rounded-bl-none"
                  }`}
                >
                  {msg.isError && <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                  <span className="whitespace-pre-line">{msg.text}</span>
                </div>
              </div>
            ))}

            {/* AI Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 shrink-0 rounded-lg bg-slate-900 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-[#0D1B2A]/80 border border-theme-main text-slate-200 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 items-center shadow-md">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-200"></span>
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-300"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* QUICK SUGGESTIONS BARS */}
          {messages.length === 1 && !isLoading && (
            <div className="p-3 bg-slate-900/30 border-t border-slate-900 flex flex-wrap gap-1.5 justify-center">
              {suggestions.map((sug, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => handleSuggestClick(sug)}
                  className="px-2.5 py-1 text-[10px] text-cyan-400 bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-500/20 rounded-full cursor-pointer hover:border-cyan-400/50 transition-all font-mono"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* INPUT FORM FOOTER */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="p-3 bg-gradient-to-t from-slate-950 to-slate-900 border-t border-cyan-500/20 flex gap-2 items-center"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                language === "hi"
                  ? "वेबसाइट के बारे में प्रश्न पूछें..."
                  : "Ask about the website features..."
              }
              className="bg-slate-950/60 border border-cyan-500/10 focus:border-cyan-500/40 focus:outline-none rounded-xl text-xs py-2.5 px-3 text-white flex-1 font-sans placeholder-slate-500 transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:scale-102 active:scale-98 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
