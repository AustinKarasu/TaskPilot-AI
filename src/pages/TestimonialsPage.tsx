/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Star, MessageSquare, Plus, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getAuthHeaders } from "../lib/api";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  rating: number;
  content: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface TestimonialsPageProps {
  onNavigate: (view: string) => void;
  language: "en" | "hi";
}

export default function TestimonialsPage({ onNavigate, language }: TestimonialsPageProps) {
  const auth = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isHi = language === "hi";

  const fetchTestimonials = async () => {
    try {
      const res = await fetch("/api/testimonials");
      if (res.ok) {
        const data = await res.json();
        setTestimonials(data);
      }
    } catch (err) {
      console.error("Failed to load testimonials:", err);
    }
  };

  useEffect(() => {
    document.title = isHi ? "प्रशंसापत्र और समीक्षाएं | CivicLens" : "Reviews & Testimonials | CivicLens AI";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Citizen reviews and testimonials for CivicLens AI platform.");
    }
    fetchTestimonials();
  }, [language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.user) {
      setSubmitError(isHi ? "समीक्षा सबमिट करने के लिए आपको लॉगिन करना होगा।" : "You must be signed in to submit a testimonial.");
      return;
    }
    if (!content.trim()) {
      setSubmitError(isHi ? "समीक्षा विवरण भरना आवश्यक है।" : "Testimonial content cannot be empty.");
      return;
    }

    setIsLoading(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: {
          ...authHeaders
        },
        body: JSON.stringify({
          name: auth.user.name,
          role: auth.user.role === "admin" ? "Administrator" : auth.user.role === "staff" ? "Municipal Crew" : "Citizen Auditor",
          rating,
          content: content.trim(),
          userId: auth.user.id
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit testimonial");
      }

      setSubmitSuccess(true);
      setContent("");
      setRating(5);
      fetchTestimonials();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const approvedTestimonials = testimonials.filter(t => t.status === "approved");
  const avgRating = approvedTestimonials.length > 0
    ? (approvedTestimonials.reduce((sum, t) => sum + t.rating, 0) / approvedTestimonials.length).toFixed(1)
    : "5.0";

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 font-sans" role="main">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-mono text-cyan-400/70 mb-6 uppercase tracking-wider" aria-label="Breadcrumb">
        <button type="button" onClick={() => onNavigate("landing")} className="hover:text-cyan-300 focus:underline focus:outline-none cursor-pointer">
          {isHi ? "मुख्य पृष्ठ" : "Home"}
        </button>
        <span>&gt;</span>
        <span className="text-slate-400" aria-current="page">
          {isHi ? "प्रशंसापत्र" : "Testimonials"}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Add Review Form */}
        <div className="space-y-6 lg:col-span-1">
          {/* Average Stats Card */}
          <div className="bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 shadow-xl text-center">
            <h2 className="text-sm font-bold text-slate-400 font-mono tracking-wider uppercase mb-2">
              {isHi ? "औसत रेटिंग" : "Average Rating"}
            </h2>
            <div className="text-5xl font-black text-white font-display mb-2">{avgRating}</div>
            <div className="flex justify-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${
                    s <= Math.round(Number(avgRating)) ? "text-amber-400 fill-amber-400" : "text-slate-700"
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              {isHi ? `${approvedTestimonials.length} स्वीकृत समीक्षाओं के आधार पर` : `Based on ${approvedTestimonials.length} approved reviews`}
            </p>
          </div>

          {/* Submission Form Card */}
          <div className="bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 shadow-xl text-left">
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-4 border-b border-cyan-500/10 pb-2">
              {isHi ? "अपनी समीक्षा लिखें" : "Write a Testimonial"}
            </h3>

            {auth.user ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {submitSuccess && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      {isHi
                        ? "आपकी समीक्षा सबमिट हो गई है! यह एडमिन अनुमोदन के बाद लाइव दिखाई देगी।"
                        : "Review submitted successfully! It will appear online after admin approval."}
                    </span>
                  </div>
                )}

                {submitError && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    {isHi ? "रेटिंग" : "Rating"}
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setRating(s)}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="text-slate-500 hover:scale-110 active:scale-95 transition-all cursor-pointer focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            s <= (hoverRating ?? rating) ? "text-amber-400 fill-amber-400" : "text-slate-700"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="review-content" className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    {isHi ? "प्रशंसापत्र विवरण" : "Review Content"}
                  </label>
                  <textarea
                    id="review-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    placeholder={isHi ? "अपना अनुभव यहाँ लिखें..." : "Share your experience with CivicLens..."}
                    className="w-full bg-slate-900/60 border border-cyan-500/10 focus:border-cyan-500/40 focus:outline-none rounded-xl text-xs p-3 text-white placeholder-slate-500"
                    disabled={isLoading}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !content.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isHi ? "समीक्षा सबमिट करें" : "Submit Review"}
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {isHi ? "समीक्षा लिखने के लिए कृपया लॉगिन करें।" : "Please sign in to share your experience with the platform."}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate("auth")}
                  className="px-4 py-2 bg-slate-900 border border-cyan-500/20 text-cyan-400 hover:text-white rounded-xl text-xs font-mono transition cursor-pointer"
                >
                  {isHi ? "लॉगिन करें" : "Login Now"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Approved Testimonials Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cyan-500/10 pb-4 mb-6">
              <div className="text-left">
                <h1 className="text-xl font-black text-white uppercase font-display tracking-wide">
                  {isHi ? "नागरिक प्रतिक्रियाएं" : "Citizen Feedbacks"}
                </h1>
                <p className="text-xs text-slate-400">
                  {isHi ? "जानें पड़ोसियों का सिविक लेंस के बारे में क्या कहना है।" : "Read what other auditors say about CivicLens."}
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

            {/* Testimonials Feed Scroll */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {approvedTestimonials.length > 0 ? (
                approvedTestimonials.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 bg-slate-900/40 border border-cyan-500/5 rounded-2xl text-left space-y-2 hover:border-cyan-500/10 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-white">{t.name}</h4>
                        <span className="text-[9px] font-mono text-cyan-400/80 uppercase">{t.role}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= t.rating ? "text-amber-400 fill-amber-400" : "text-slate-800"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{t.content}</p>
                    <div className="text-[8px] text-slate-500 font-mono text-right">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-500 font-mono text-xs">
                  <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  {isHi ? "अभी तक कोई प्रशंसापत्र स्वीकृत नहीं हुआ है।" : "No testimonials have been approved yet."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
