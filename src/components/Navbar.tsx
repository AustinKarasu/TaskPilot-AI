/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRepository } from "../services/repository";
import { User, Notification } from "../types";
import { 
  Bell, 
  Menu, 
  X, 
  Eye, 
  CheckCircle2, 
  ShieldAlert, 
  Shield, 
  ArrowLeftRight, 
  Languages, 
  BookOpen, 
  Map, 
  Landmark, 
  Award, 
  Sun, 
  Moon, 
  Lock, 
  LogOut,
  Settings,
  Info,
  Trophy,
  ChevronRight,
  FileText
} from "lucide-react";
import { TRANSLATIONS } from "../i18n/translations";

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  language: "en" | "hi";
  onLanguageChange: (lang: "en" | "hi") => void;
  currentUser: User;
  onUserChange?: () => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
}

export default function Navbar({
  currentView,
  onNavigate,
  language,
  onLanguageChange,
  currentUser,
  onUserChange,
  theme,
  onThemeToggle
}: NavbarProps) {
  const auth = useAuth();
  const repository = useRepository();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [preferencesDropdownOpen, setPreferencesDropdownOpen] = useState(false);
  const isSigned = auth.status === "authenticated" && auth.user !== null;
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  // PWA App download/installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if currently running in standalone PWA mode
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA installation outcome: ${outcome}`);
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  // Auto-close open dropdowns and panels when currentView changes
  useEffect(() => {
    setShowNotifications(false);
    setPreferencesDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [currentView]);

  // Click outside to auto-close preferences and notifications
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#preferences-container")) {
        setPreferencesDropdownOpen(false);
      }
      if (!target.closest("#notifications-container")) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load real in-app notifications
  useEffect(() => {
    if (!isSigned) {
      setNotifications([]);
      return;
    }

    const handleStatusLoad = () => {
      repository.getNotifications(currentUser.id).then(setNotifications);
    };

    handleStatusLoad();
    
    window.addEventListener("civiclens_user_changed", handleStatusLoad);
    window.addEventListener("civiclens_data_changed", handleStatusLoad);
    
    return () => {
      window.removeEventListener("civiclens_user_changed", handleStatusLoad);
      window.removeEventListener("civiclens_data_changed", handleStatusLoad);
    };
  }, [currentUser.id, repository, isSigned]);

  const unreadCount = notifications.filter(x => !x.read).length;

  const handleMarkAllRead = () => {
    if (!isSigned) return;
    repository.markNotificationsAsRead(currentUser.id).then(() => {
      repository.getNotifications(currentUser.id).then(setNotifications);
    });
  };

  const dict = TRANSLATIONS[language];

  const handleMobileNav = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  const clearAuthForModeSwitch = () => {
    localStorage.setItem("civiclens_is_signed_in", "false");
    localStorage.setItem("civiclens_demo_is_signed_in", "false");
    localStorage.removeItem("civiclens_current_user_id");
    localStorage.removeItem("civiclens_demo_current_user_id");
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-theme-nav/95 border-b border-theme-main shadow-theme-main backdrop-blur-md transition-all px-4 sm:px-6 py-3 md:py-4">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        
        {/* Brand Logo and Slogan */}
        <div 
          onClick={() => handleMobileNav("landing")} 
          className="flex items-center gap-2.5 cursor-pointer group"
          id="brand-logo"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-[#21D4FD] to-indigo-600 p-0.5 flex items-center justify-center shadow-md group-hover:scale-105 transition-all overflow-hidden">
            <img 
              src="/favicon.png" 
              alt="CivicPulse Logo" 
              className="w-full h-full object-cover rounded-lg z-10"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                const fallback = parent?.querySelector(".fallback-icon") as HTMLElement;
                if (fallback) fallback.style.display = "block";
              }}
            />
            <Eye className="w-5 h-5 text-white fallback-icon z-10" style={{ display: "none" }} />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 blur opacity-35 group-hover:opacity-75 transition-all"></div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-sans font-extrabold text-lg sm:text-xl tracking-tight text-theme-main">CivicPulse</span>
              <span className="text-xs font-mono font-extrabold text-cyan-600 dark:text-[#21D4FD]">AI</span>
            </div>
            <p className="text-[9px] text-theme-muted tracking-widest font-mono uppercase leading-none mt-0.5 hidden sm:block">
              {dict.tagline}
            </p>
          </div>
        </div>

        {/* Toolbar controls + Hamburger toggle */}
        <div className="flex items-center gap-2">
          {/* Quick Demo Mode toggler for judges */}
          <button
            onClick={() => {
              const targetMode = auth.mode === "demo" ? "false" : "true";
              clearAuthForModeSwitch();
              localStorage.setItem("civiclens_demo_mode", targetMode);
              const url = new URL(window.location.href);
              url.searchParams.set("demo", targetMode);
              window.location.href = url.toString();
            }}
            className={`px-2.5 py-1.5 rounded-xl border transition-all text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer h-[34px] ${
              auth.mode === "demo"
                ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/15"
                : "border-theme-main bg-theme-tertiary hover:bg-theme-main text-theme-secondary hover:text-cyan-400"
            }`}
            title="Toggle between Production (Firebase) and Local Demo mode"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${auth.mode === "demo" ? "bg-cyan-400 animate-pulse" : "bg-slate-400"}`}></span>
            <span>{auth.mode === "demo" ? "Demo ON" : "Demo OFF"}</span>
          </button>

          {/* Quick theme toggler */}
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-xl border border-theme-main bg-theme-tertiary hover:bg-theme-main text-theme-secondary hover:text-theme-main transition cursor-pointer"
            title="Toggle Visual Theme"
          >
            {theme === "light" ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
          
          {/* Notifications Dropdown Bell */}
          {isSigned && (
            <div className="relative" id="notifications-container">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) handleMarkAllRead();
                }}
                className="p-2 border border-theme-main bg-theme-tertiary hover:bg-theme-main rounded-xl text-theme-secondary hover:text-cyan-500 transition relative cursor-pointer"
                id="btn-notification"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500 shadow-sm"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-theme-card border border-theme-main shadow-theme-main z-50 overflow-hidden ring-1 ring-black/10">
                  <div className="p-3 border-b border-theme-main flex items-center justify-between bg-theme-tertiary">
                    <span className="text-xs font-bold text-theme-main tracking-wide font-mono uppercase">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-cyan-600 font-bold hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-theme-main">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-theme-muted">
                        No recent notifications
                      </div>
                    ) : (
                      notifications.map((not) => (
                        <div
                          key={not.id}
                          onClick={() => {
                            if (not.issueId) {
                              onNavigate(`issue/${not.issueId}`);
                            }
                            setShowNotifications(false);
                          }}
                          className={`p-3 text-left hover:bg-theme-tertiary transition cursor-pointer ${
                            !not.read ? "bg-cyan-500/5" : ""
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-theme-main">
                              {not.title}
                            </span>
                            <span className="text-[9px] text-theme-muted font-mono">
                              {new Date(not.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-theme-secondary mt-1 leading-normal">
                            {not.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Avatar - restricted to when signed in */}
          {isSigned && (
            <div className="flex items-center pl-2 border-l border-theme-main">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full border border-theme-main object-cover bg-theme-tertiary"
                title={`${currentUser.name} (${currentUser.role})`}
              />
            </div>
          )}

          {/* Main hamburger selector toggle */}
          <button
            type="button"
            onClick={() => {
              console.log("Hamburger toggle clicked! Current state:", mobileMenuOpen);
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="p-2 rounded-xl border border-theme-main text-theme-secondary hover:bg-theme-tertiary transition relative shrink-0 cursor-pointer"
            aria-label="Toggle Navigation Options"
            id="hamburger-toggle"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-theme-main" /> : <Menu className="w-5 h-5 text-theme-main" />}
            {isSigned && unreadCount > 0 && !mobileMenuOpen && (
              <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-rose-500"></span>
            )}
          </button>
        </div>

      </div>
      </header>

      {/* Universal Slide-over Drawer Panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop Blur Overlay */}
          <div 
            onClick={() => {
              console.log("Backdrop clicked! Closing drawer...");
              setMobileMenuOpen(false);
            }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
            id="drawer-backdrop"
          />

          {/* Drawer Content Panel */}
          <div 
            className="relative w-full sm:w-[420px] h-full bg-theme-secondary border-l border-theme-main shadow-2xl z-50 flex flex-col justify-between overflow-y-auto p-6 animate-slide-in-right"
            id="drawer-panel"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-theme-main">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 flex items-center justify-center">
                  <img src="/favicon.png" alt="Logo" className="w-full h-full object-cover rounded-md" />
                </div>
                <div>
                  <span className="font-sans font-extrabold text-base tracking-tight text-theme-main">CivicPulse</span>
                  <span className="text-xs font-mono font-extrabold text-cyan-600 dark:text-[#21D4FD]">AI</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  console.log("Close button clicked! Closing drawer...");
                  setMobileMenuOpen(false);
                }}
                className="p-1.5 rounded-xl border border-theme-main text-theme-secondary hover:bg-theme-tertiary transition cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-theme-main" />
              </button>
            </div>

            {/* Profile Block (if signed in) */}
            {isSigned && (
              <div className="mt-6 p-4 bg-theme-tertiary rounded-2xl border border-theme-main flex items-center justify-between font-sans">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-11 h-11 rounded-full border border-theme-main object-cover bg-theme-main"
                  />
                  <div className="text-left">
                    <p className="text-sm font-bold text-theme-main leading-tight">{currentUser.name}</p>
                    <p className="text-[10.5px] text-theme-muted truncate max-w-[180px]">{currentUser.email}</p>
                  </div>
                </div>

                {currentUser.role === "citizen" ? (
                  <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-[#21D4FD] rounded-lg border border-cyan-500/20">
                    🛡️ {currentUser.civicScore} PTS
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/20">
                    OFFICIAL
                  </span>
                )}
              </div>
            )}

            {/* Navigation Links list */}
            <div className="flex-1 my-6 space-y-2.5">
              <span className="text-[9px] font-mono font-bold text-theme-muted uppercase tracking-widest block mb-2 px-1">Navigation Scopes</span>
              <div className="grid grid-cols-1 gap-1.5 max-h-[320px] overflow-y-auto pr-1">
                {[
                  { view: "landing", label: "Home", icon: BookOpen },
                  { view: "map", label: "Map Grid", icon: Map },
                  { view: "report", label: dict.reportBtn, icon: ShieldAlert, alert: true },
                  { view: "dashboard", label: dict.dashboard, icon: Award },
                  { view: "impact", label: dict.impactLink, icon: Landmark },
                  { view: "leaderboard", label: dict.leaderboardLink, icon: Trophy },
                  { view: "contact", label: "Support Tickets", icon: FileText },
                  { view: "how-it-works", label: dict.howItWorks, icon: Info }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.view;
                  return (
                    <button
                      key={item.view}
                      onClick={() => handleMobileNav(item.view)}
                      className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between border text-left cursor-pointer transition-all ${
                        isActive
                          ? item.alert 
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : "bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30"
                          : item.alert
                            ? "text-amber-600 dark:text-amber-400 border-transparent hover:bg-amber-500/5 hover:border-amber-500/30"
                            : "text-theme-secondary border-transparent hover:bg-theme-tertiary"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4.5 h-4.5 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </button>
                  );
                })}

                {isSigned && (currentUser.role === "admin" || currentUser.role === "staff") && (
                  <button
                    onClick={() => handleMobileNav("staff")}
                    className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between border text-left cursor-pointer transition-all ${
                      currentView === "staff"
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                        : "text-emerald-600 dark:text-emerald-400 border-transparent hover:bg-emerald-500/5 hover:border-emerald-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-emerald-500" />
                      <span>Staff Desk</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                )}

                {isSigned && currentUser.role === "admin" && (
                  <button
                    onClick={() => handleMobileNav("admin")}
                    className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between border text-left cursor-pointer transition-all ${
                      currentView === "admin"
                        ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40"
                        : "text-rose-600 dark:text-rose-400 border-transparent hover:bg-rose-500/5 hover:border-rose-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4.5 h-4.5 shrink-0 text-rose-500" />
                      <span>Admin Board</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Settings Configuration Block */}
            <div className="p-4 rounded-2xl border border-theme-main bg-theme-tertiary text-left space-y-3 mb-4">
              <p className="text-[9.5px] font-mono font-bold text-theme-muted uppercase tracking-widest border-b border-theme-main pb-1.5">Settings Configuration</p>
              
              {/* Language Selector */}
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-bold text-theme-secondary font-mono uppercase tracking-wider block">Language option</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => onLanguageChange("en")}
                    className={`py-1.5 px-2 rounded-xl border text-center transition font-mono font-bold text-[10px] cursor-pointer ${
                      language === "en"
                        ? "bg-cyan-500/10 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold"
                        : "border-theme-main bg-theme-main text-theme-muted"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => onLanguageChange("hi")}
                    className={`py-1.5 px-2 rounded-xl border text-center transition font-mono font-bold text-[10px] cursor-pointer ${
                      language === "hi"
                        ? "bg-cyan-500/10 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold"
                        : "border-theme-main bg-theme-main text-theme-muted"
                    }`}
                  >
                    हिन्दी
                  </button>
                </div>
              </div>

              {/* Theme Selector */}
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-bold text-theme-secondary font-mono uppercase tracking-wider block">Visual interface</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => { if (theme !== "light") onThemeToggle(); }}
                    className={`py-1.5 px-2 rounded-xl border text-center transition font-mono font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer ${
                      theme === "light"
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-600 font-bold"
                        : "border-theme-main bg-theme-main text-theme-muted"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Light</span>
                  </button>
                  <button
                    onClick={() => { if (theme !== "dark") onThemeToggle(); }}
                    className={`py-1.5 px-2 rounded-xl border text-center transition font-mono font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer ${
                      theme === "dark"
                        ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400 font-bold"
                        : "border-theme-main bg-theme-main text-theme-muted"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Dark</span>
                  </button>
                </div>
              </div>

              {/* Platform Mode Selector */}
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-bold text-theme-secondary font-mono uppercase tracking-wider block">Platform Mode</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      if (auth.mode !== "firebase") {
                        clearAuthForModeSwitch();
                        localStorage.setItem("civiclens_demo_mode", "false");
                        const url = new URL(window.location.href);
                        url.searchParams.set("demo", "false");
                        window.location.href = url.toString();
                      }
                    }}
                    className={`py-1.5 px-2 rounded-xl border text-center transition font-mono font-bold text-[10px] cursor-pointer ${
                      auth.mode === "firebase"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                        : "border-theme-main bg-theme-main text-theme-muted hover:border-emerald-500/30"
                    }`}
                  >
                    Production
                  </button>
                  <button
                    onClick={() => {
                      if (auth.mode !== "demo") {
                        clearAuthForModeSwitch();
                        localStorage.setItem("civiclens_demo_mode", "true");
                        const url = new URL(window.location.href);
                        url.searchParams.set("demo", "true");
                        window.location.href = url.toString();
                      }
                    }}
                    className={`py-1.5 px-2 rounded-xl border text-center transition font-mono font-bold text-[10px] cursor-pointer ${
                      auth.mode === "demo"
                        ? "bg-cyan-500/10 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold"
                        : "border-theme-main bg-theme-main text-theme-muted hover:border-cyan-500/30"
                    }`}
                  >
                    Judge Demo
                  </button>
                </div>
              </div>

              {/* App Download Option (PWA) */}
              <div className="space-y-2 text-left border-t border-theme-main pt-3">
                <span className="text-[10px] font-bold text-theme-secondary font-mono uppercase tracking-wider block">App Installation</span>
                {isInstallable ? (
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-2 px-3 bg-gradient-to-r from-[#21D4FD] to-[#B721FF] hover:opacity-90 rounded-xl text-center text-slate-950 font-sans font-bold text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>📲 Download Mobile App</span>
                  </button>
                ) : isInstalled ? (
                  <span className="text-[10px] font-bold text-[#34D399] font-mono uppercase tracking-wider block flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse"></span>
                    Running as Mobile App
                  </span>
                ) : (
                  <div className="p-3 bg-theme-secondary border border-cyan-500/20 rounded-xl space-y-1.5">
                    <p className="text-[10.5px] font-bold text-theme-main flex items-center gap-1">
                      <span>📲</span> How to Download App:
                    </p>
                    <ul className="text-[9.5px] text-theme-muted space-y-1 list-decimal list-inside leading-relaxed pl-0.5">
                      <li>Tap the <strong>Share</strong> button (Safari) or the <strong>Menu</strong> icon (Chrome/Edge).</li>
                      <li>Select <strong>Add to Home Screen</strong> or <strong>Install App</strong>.</li>
                      <li>Launch from your home screen just like a native app!</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications Preview inside drawer (if signed in) */}
            {isSigned && notifications.length > 0 && (
              <div className="py-3 border-t border-theme-main mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9.5px] font-bold text-theme-muted font-mono uppercase tracking-wider">Unread Alerts</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[9px] text-cyan-600 font-bold hover:underline">
                      Clear Alerts
                    </button>
                  )}
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1.5 bg-theme-tertiary p-2 rounded-xl border border-theme-main">
                  {notifications.slice(0, 3).map((not) => (
                    <div
                      key={not.id}
                      onClick={() => handleMobileNav(`issue/${not.issueId}`)}
                      className={`p-2 rounded-lg text-left text-[11px] hover:bg-theme-main transition cursor-pointer ${
                        !not.read ? "border-l-2 border-cyan-500 bg-cyan-500/5" : ""
                      }`}
                    >
                      <div className="font-bold text-theme-main">{not.title}</div>
                      <div className="text-theme-secondary text-[10px] leading-tight mt-0.5 line-clamp-2">{not.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drawer Bottom Portal Auth action button */}
            <div className="pt-2 border-t border-theme-main">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isSigned) {
                    setShowConfirmLogout(true);
                  } else {
                    onNavigate("auth");
                  }
                }}
                className="w-full py-2.5 border border-theme-main rounded-xl text-theme-secondary hover:text-theme-main bg-theme-tertiary hover:bg-theme-main text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isSigned ? <LogOut className="w-4.5 h-4.5 text-rose-500 animate-pulse" /> : <Lock className="w-4.5 h-4.5 text-cyan-400" />}
                <span>{isSigned ? "Secure Logout" : "Sign In Portal"}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {showConfirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#0D1B2A] border border-slate-800 p-6 rounded-3xl shadow-2xl overflow-hidden text-left font-sans">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-indigo-600"></div>
            
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4">
              <LogOut className="w-6 h-6 text-rose-400 animate-pulse" />
            </div>

            <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-2">
              Confirm Logout Session
            </h3>
            
            <p className="text-xs text-[#9FB2C8] leading-relaxed mb-6 font-mono">
              Are you sure you want to terminate your secure CivicPulse AI digital clearance session? Any temporary active drafts could be cleared from local cache.
            </p>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <button
                onClick={() => setShowConfirmLogout(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-[#9FB2C8] font-bold text-[10px] uppercase tracking-wider rounded-xl border border-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmLogout(false);
                  auth.signOut().then(() => {
                    if (onUserChange) onUserChange();
                    onNavigate("landing");
                  });
                }}
                className="w-full py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-95 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer border-0"
              >
                Sign Out Session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

