/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRepository } from "../services/repository";
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ShieldCheck, UserCheck, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useSearchParams } from "react-router-dom";

interface AuthPageProps {
  onAuthSuccess: () => void;
  onNavigate: (view: string) => void;
  language: "en" | "hi";
}

const getErrorFromResponse = async (res: Response, fallbackMsg: string): Promise<string> => {
  try {
    const text = await res.text();
    if (text) {
      const data = JSON.parse(text);
      return data.error || fallbackMsg;
    }
  } catch (e) {
    // Ignore parse error
  }
  return `${fallbackMsg} (Status ${res.status})`;
};

export default function AuthPage({ onAuthSuccess, onNavigate, language }: AuthPageProps) {
  const auth = useAuth();
  const repository = useRepository();
  const [hasFirebase, setHasFirebase] = useState(auth.hasFirebase);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setHasFirebase(auth.hasFirebase);
  }, [auth.hasFirebase]);

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"citizen" | "admin" | "staff">("citizen");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Verification state variables
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const [tempRegisterData, setTempRegisterData] = useState<{
    name: string;
    email: string;
    password: string;
    role: "citizen" | "admin" | "staff";
  } | null>(null);

  const [tempLoginData, setTempLoginData] = useState<{
    email: string;
    password: string;
  } | null>(null);

  // Recovery state variables
  const resetToken = searchParams.get("resetToken");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password rules validation logic
  const passwordRules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  const isPasswordStrong = passwordRules.length && passwordRules.upper && passwordRules.number && passwordRules.special;

  const newPasswordRules = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
  };
  const isNewPasswordStrong = newPasswordRules.length && newPasswordRules.upper && newPasswordRules.number && newPasswordRules.special;

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setGoogleLoading(true);
    try {
      await auth.googleSignIn();
      setSuccessMsg("Welcome! Authenticated via Google.");
      setTimeout(() => {
        onAuthSuccess();
        onNavigate("landing");
      }, 150);
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      setErrorMsg(err.message || "Failed to authenticate with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          setErrorMsg("Please enter your full name.");
          setIsLoading(false);
          return;
        }
        if (!email.trim() || !password) {
          setErrorMsg("Please fill out all credentials.");
          setIsLoading(false);
          return;
        }
        if (!isPasswordStrong) {
          setErrorMsg("Password does not meet the safety requirements.");
          setIsLoading(false);
          return;
        }

        // Email Verification trigger
        const res = await fetch("/api/auth/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name })
        });

        if (!res.ok) {
          const errMsg = await getErrorFromResponse(res, "Failed to send email verification code.");
          throw new Error(errMsg);
        }

        setTempRegisterData({ name, email, password, role });
        setVerifyingEmail(true);
        setSuccessMsg("Verification code dispatched to your email address!");
      } else {
        if (!email.trim() || !password) {
          setErrorMsg("Please provide both email and password.");
          setIsLoading(false);
          return;
        }

        // Check if admin to trigger 2FA code
        const formattedEmail = email.trim().toLowerCase();
        const demoUsers = await repository.getUsers();
        const matchedUser = Object.values(demoUsers).find(u => u.email.toLowerCase() === formattedEmail);

        if (!matchedUser) {
          throw new Error("No account found registered under this email address.");
        }

        const retrievedPass = await repository.retrievePassword(email);
        const hashedPassword = await hashPassword(password);
        if (retrievedPass !== password && retrievedPass !== hashedPassword) {
          throw new Error("Invalid password credentials.");
        }

        if (matchedUser.role === "admin" || matchedUser.role === "staff") {
          if (matchedUser.pendingApproval) {
            throw new Error("Officer user is pending administrator clearance. Standard login blocked.");
          }
          if (matchedUser.denied) {
            throw new Error("Officer user account application was denied by the administrator.");
          }
        }

        if (matchedUser.role === "admin" && auth.enable2FA) {
          const res = await fetch("/api/auth/2fa-send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formattedEmail })
          });

          if (!res.ok) {
            const errMsg = await getErrorFromResponse(res, "Failed to dispatch 2FA code.");
            throw new Error(errMsg);
          }

          setTempLoginData({ email: formattedEmail, password });
          setVerifying2FA(true);
          setSuccessMsg("Security verification: 6-digit 2FA code sent to your email!");
        } else {
          await auth.signIn(email, password);
          setSuccessMsg("Welcome back! Authentication confirmed.");
          setTimeout(() => {
            onAuthSuccess();
            onNavigate("landing");
          }, 150);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!verificationCode) {
      setErrorMsg("Please enter the 4-digit verification code.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: tempRegisterData?.email, code: verificationCode })
      });

      if (!res.ok) {
        const errMsg = await getErrorFromResponse(res, "Invalid verification code.");
        throw new Error(errMsg);
      }

      if (tempRegisterData) {
        await auth.signUp(tempRegisterData.name, tempRegisterData.email, tempRegisterData.password, tempRegisterData.role);
        setSuccessMsg("Account registered successfully! Redirecting...");
        setTimeout(() => {
          onAuthSuccess();
          onNavigate("landing");
        }, 150);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Email verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FACode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!twoFactorCode) {
      setErrorMsg("Please enter the 2FA code.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/2fa-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: tempLoginData?.email, code: twoFactorCode })
      });

      if (!res.ok) {
        const errMsg = await getErrorFromResponse(res, "Invalid 2FA code.");
        throw new Error(errMsg);
      }

      if (tempLoginData) {
        await auth.signIn(tempLoginData.email, tempLoginData.password);
        setSuccessMsg("Verification success! Access granted.");
        setTimeout(() => {
          onAuthSuccess();
          onNavigate("landing");
        }, 150);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "2FA Verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!newPassword || !confirmPassword) {
      setErrorMsg("Please fill out all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (!isNewPasswordStrong) {
      setErrorMsg("New password does not meet the safety requirements.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword })
      });

      if (!res.ok) {
        const errMsg = await getErrorFromResponse(res, "Password reset failed.");
        throw new Error(errMsg);
      }

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      const userEmail = data.email;

      // Sync credentials local storage block
      const creds = JSON.parse(localStorage.getItem("civiclens_credentials") || "{}");
      if (creds[userEmail]) {
        const hashed = await hashPassword(newPassword);
        creds[userEmail].password = hashed;
        localStorage.setItem("civiclens_credentials", JSON.stringify(creds));
      }

      setSuccessMsg("Your password has been successfully reset! Redirecting to login...");
      setTimeout(() => {
        setSearchParams({});
        setIsRegister(false);
        setSuccessMsg("");
      }, 150);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (emailVal: string, passVal: string) => {
    setEmail(emailVal);
    setPassword(passVal);
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const demoUsers = await repository.getUsers();
      const matchedUser = Object.values(demoUsers).find(u => u.email.toLowerCase() === emailVal.toLowerCase());

      if (matchedUser && matchedUser.role === "admin" && auth.enable2FA) {
        const res = await fetch("/api/auth/2fa-send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailVal })
        });

        if (!res.ok) {
          const errMsg = await getErrorFromResponse(res, "Failed to dispatch 2FA code.");
          throw new Error(errMsg);
        }

        setTempLoginData({ email: emailVal, password: passVal });
        setVerifying2FA(true);
        setSuccessMsg("Security verification: 6-digit 2FA code sent to your email!");
      } else {
        await auth.signIn(emailVal, passVal);
        setSuccessMsg(`Welcome, ${emailVal}! Access granted.`);
        setTimeout(() => {
          onAuthSuccess();
          onNavigate("landing");
        }, 150);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Quick login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    if (!email.trim()) {
      setErrorMsg("Please enter your registered email address first.");
      return;
    }
    try {
      await auth.sendPasswordReset(email);
      setSuccessMsg("A password reset email containing a recovery link has been dispatched to your email.");
    } catch (err: any) {
      setErrorMsg(err.message || "No account found registered under this email address.");
    }
  };

  // 1. Password Reset View
  if (resetToken) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 relative font-sans">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-theme-card border border-theme-main shadow-theme-main rounded-3xl p-8 relative z-10 text-left"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-4">
              <Lock className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-display font-black tracking-tight text-theme-main">Reset Password</h2>
            <p className="text-xs text-theme-secondary mt-2 leading-relaxed">
              Enter your new secure password below. Password strength requirements must be satisfied.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 mb-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-rose-500 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 mb-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 text-left">
              <UserCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-bold text-theme-secondary mb-1.5 font-mono uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-theme-muted">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl text-xs bg-theme-tertiary text-theme-main placeholder-theme-muted border border-theme-main focus:outline-none focus:ring-2 focus:ring-cyan-500/40 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-theme-muted hover:text-theme-main transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">Requirements Check:</p>
                  <ul className="text-[10px] space-y-0.5 font-mono">
                    <li className={newPasswordRules.length ? "text-emerald-400" : "text-slate-500"}>
                      {newPasswordRules.length ? "✓" : "✗"} At least 8 characters
                    </li>
                    <li className={newPasswordRules.upper ? "text-emerald-400" : "text-slate-500"}>
                      {newPasswordRules.upper ? "✓" : "✗"} At least 1 uppercase letter
                    </li>
                    <li className={newPasswordRules.number ? "text-emerald-400" : "text-slate-500"}>
                      {newPasswordRules.number ? "✓" : "✗"} At least 1 number
                    </li>
                    <li className={newPasswordRules.special ? "text-emerald-400" : "text-slate-500"}>
                      {newPasswordRules.special ? "✓" : "✗"} At least 1 special char
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-theme-secondary mb-1.5 font-mono uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-theme-muted">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-theme-tertiary text-theme-main placeholder-theme-muted border border-theme-main focus:outline-none focus:ring-2 focus:ring-cyan-500/40 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white text-[11px] font-bold font-mono uppercase tracking-wider shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 border-none"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <span>Update Password</span>
              )}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // 2. Email Verification View
  if (verifyingEmail) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 relative font-sans">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-theme-card border border-theme-main shadow-theme-main rounded-3xl p-8 relative z-10 text-left"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-4">
              <Mail className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-display font-black tracking-tight text-theme-main">Verify Your Email</h2>
            <p className="text-xs text-theme-secondary mt-2 leading-relaxed">
              We have sent a 4-digit verification code to <span className="font-bold text-theme-main">{tempRegisterData?.email}</span>. Please enter it below to complete registration.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 mb-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-rose-500 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 mb-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 text-left">
              <UserCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerifyEmailCode} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-bold text-theme-secondary mb-1.5 font-mono uppercase tracking-wider text-center">
                Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={4}
                placeholder="e.g. 1234"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center tracking-[12px] py-2.5 rounded-2xl text-lg font-bold bg-theme-tertiary text-theme-main border border-theme-main focus:outline-none focus:ring-2 focus:ring-cyan-500/40 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white text-[11px] font-bold font-mono uppercase tracking-wider shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 border-none"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <span>Verify & Register</span>
              )}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-theme-main flex justify-between items-center text-xs">
            <button
              onClick={() => {
                setVerifyingEmail(false);
                setVerificationCode("");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="text-slate-400 hover:text-white font-extrabold font-mono tracking-wide flex items-center gap-0.5 cursor-pointer bg-transparent border-none"
            >
              <span>← Go Back</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 3. Admin 2FA Code View
  if (verifying2FA) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 relative font-sans">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-theme-card border border-theme-main shadow-theme-main rounded-3xl p-8 relative z-10 text-left"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4">
              <Lock className="w-6 h-6 text-rose-400" />
            </div>
            <h2 className="text-2xl font-display font-black tracking-tight text-theme-main">Admin 2FA Verification</h2>
            <p className="text-xs text-theme-secondary mt-2 leading-relaxed text-center">
              A login attempt is detected for <span className="font-bold text-theme-main">{tempLoginData?.email}</span>. A 6-digit administrator 2FA verification code has been dispatched.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 mb-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-rose-500 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 mb-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 text-left">
              <UserCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerify2FACode} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-bold text-theme-secondary mb-1.5 font-mono uppercase tracking-wider text-center">
                2FA Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 123456"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center tracking-[12px] py-2.5 rounded-2xl text-lg font-bold bg-theme-tertiary text-theme-main border border-theme-main focus:outline-none focus:ring-2 focus:ring-rose-500/40 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:opacity-95 text-white text-[11px] font-bold font-mono uppercase tracking-wider shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 border-none"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <span>Confirm 2FA Login</span>
              )}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-theme-main flex justify-between items-center text-xs">
            <button
              onClick={() => {
                setVerifying2FA(false);
                setTwoFactorCode("");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="text-slate-400 hover:text-white font-extrabold font-mono tracking-wide flex items-center gap-0.5 cursor-pointer bg-transparent border-none"
            >
              <span>← Cancel Login</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 4. Default Login / Register Forms
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 relative font-sans">
      
      {/* Background neon ambient blur lights */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>

      {/* Floating Back Navigation Button */}
      <button
        onClick={() => onNavigate("landing")}
        className="absolute top-12 left-4 md:left-12 px-4 py-2 border border-theme-main bg-theme-secondary text-theme-main hover:bg-theme-tertiary font-bold text-xs font-mono rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer z-20 group"
      >
        <ArrowLeft className="w-4 h-4 text-theme-secondary group-hover:text-cyan-500 group-hover:-translate-x-0.5 transition-all" />
        <span>Back to Home</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md bg-theme-card border border-theme-main shadow-theme-main rounded-3xl p-6 sm:p-8 relative z-10 text-left"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white mb-4 shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-display font-black tracking-tight text-theme-main text-center">
            {isRegister ? "Join CivicPulse AI" : "Access Security Desk"}
          </h2>
          <p className="text-xs text-theme-secondary mt-2 leading-relaxed max-w-[340px] mx-auto text-center">
            {isRegister 
              ? "Register your secure citizen profile to log audits, audit community verifications, and claim rewards."
              : "Sign in with your registered account credentials or use our sandbox pilot login keys below."}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 mb-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-rose-500 dark:text-rose-400 animate-fade-in text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 mb-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 animate-fade-in text-left">
            <UserCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google Auth Button */}
        <div className="mb-5">
          <button
            type="button"
            disabled={googleLoading || isLoading}
            onClick={handleGoogleLogin}
            className="w-full py-2.5 border border-theme-main bg-theme-secondary text-theme-main font-bold hover:bg-theme-tertiary text-xs rounded-2xl shadow-sm hover:shadow transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-theme-main border-t-cyan-500 rounded-full animate-spin"></span>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-[1px] bg-theme-main"></div>
            <span className="text-[10px] font-mono text-theme-muted uppercase tracking-widest leading-none">or sign in with email</span>
            <div className="flex-1 h-[1px] bg-theme-main"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {isRegister && (
            <div>
              <label className="block text-[10px] font-bold text-theme-secondary mb-1.5 font-mono uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-theme-muted">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Mehta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-theme-tertiary text-theme-main placeholder-theme-muted border border-theme-main focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-theme-secondary mb-1.5 font-mono uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-theme-muted">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-theme-tertiary text-theme-main placeholder-theme-muted border border-theme-main focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-theme-secondary font-mono uppercase tracking-wider">
                Secret Password
              </label>
              {!isRegister && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] text-cyan-500 hover:text-cyan-600 font-extrabold font-mono uppercase tracking-wide cursor-pointer hover:underline bg-transparent border-none"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-theme-muted">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl text-xs bg-theme-tertiary text-theme-main placeholder-theme-muted border border-theme-main focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-theme-muted hover:text-theme-main transition cursor-pointer bg-transparent border-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {isRegister && password && (
              <div className="mt-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">Password Security Requirements:</p>
                <ul className="text-[10px] space-y-1 font-mono">
                  <li className={passwordRules.length ? "text-emerald-400" : "text-slate-500"}>
                    {passwordRules.length ? "✓" : "✗"} Minimum 8 characters
                  </li>
                  <li className={passwordRules.upper ? "text-emerald-400" : "text-slate-500"}>
                    {passwordRules.upper ? "✓" : "✗"} At least 1 uppercase letter
                  </li>
                  <li className={passwordRules.number ? "text-emerald-400" : "text-slate-500"}>
                    {passwordRules.number ? "✓" : "✗"} At least 1 number
                  </li>
                  <li className={passwordRules.special ? "text-emerald-400" : "text-slate-500"}>
                    {passwordRules.special ? "✓" : "✗"} At least 1 special character (!@#$%^&*)
                  </li>
                </ul>
              </div>
            )}
          </div>

          {isRegister && (
            <div>
              <label className="block text-[10px] font-bold text-theme-secondary mb-1.5 font-mono uppercase tracking-wider">
                Select Scope Range
              </label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setRole("citizen")}
                  className={`py-2 px-1.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer text-[10px] font-bold ${
                    role === "citizen"
                      ? "bg-cyan-500/10 border-cyan-500 text-cyan-600 dark:text-cyan-400"
                      : "border-theme-main hover:bg-theme-tertiary text-theme-secondary bg-theme-tertiary"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Citizen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("staff")}
                  className={`py-2 px-1.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer text-[10px] font-bold ${
                    role === "staff"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : "border-theme-main hover:bg-theme-tertiary text-theme-secondary bg-theme-tertiary"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Staff</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`py-2 px-1.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer text-[10px] font-bold ${
                    role === "admin"
                      ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-theme-main hover:bg-theme-tertiary text-theme-secondary bg-theme-tertiary"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (isRegister && !isPasswordStrong)}
            className="w-full py-3 mt-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white text-[11px] font-bold font-mono uppercase tracking-wider shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 border-none"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <span>{isRegister ? "Submit Registration" : "Sign In Client Portal"}</span>
            )}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-theme-main flex justify-between items-center text-xs">
          <span className="text-theme-muted">
            {isRegister ? "Already registered?" : "Need a trial wallet profile?"}
          </span>
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className="text-cyan-500 hover:text-cyan-600 font-extrabold font-mono tracking-wide flex items-center gap-0.5 cursor-pointer hover:underline bg-transparent border-none"
          >
            <span>{isRegister ? "Login instead" : "Create Account"}</span>
          </button>
        </div>

        {/* SECURE DOCK FOR QUICK DEMO LOGINS */}
        {auth.mode === "demo" && (
          <div className="mt-8 pt-5 border-t border-theme-main text-left">
            <div className="flex items-center gap-1.5 mb-3.5">
              <Sparkles className="w-3.5 h-3.5 text-[#21D4FD] animate-pulse" />
              <span className="text-[10px] font-mono font-black text-theme-muted uppercase tracking-widest leading-none">
                Sandbox Fast-Track Logins
              </span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleQuickLogin("admin@civiclens.demo", "CivicPulse@2026")}
                className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-slate-900/40 to-slate-800/20 border border-theme-main hover:border-indigo-500/50 transition-all text-left text-xs flex items-center justify-between group cursor-pointer shadow-sm hover:translate-x-0.5"
              >
                <div>
                  <div className="font-extrabold text-theme-main flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span>Demo Admin: Admin Rajesh (Demo)</span>
                  </div>
                  <div className="text-[10px] text-theme-muted font-mono mt-0.5">admin@civiclens.demo / CivicPulse@2026</div>
                </div>
                <ChevronRightIcon />
              </button>

              <button
                onClick={() => handleQuickLogin("staff@civiclens.demo", "Staff@2026")}
                className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-slate-900/40 to-slate-800/20 border border-theme-main hover:border-amber-500/50 transition-all text-left text-xs flex items-center justify-between group cursor-pointer shadow-sm hover:translate-x-0.5"
              >
                <div>
                  <div className="font-extrabold text-theme-main flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>Demo Staff: Inspector Kamal</span>
                  </div>
                  <div className="text-[10px] text-theme-muted font-mono mt-0.5">staff@civiclens.demo / Staff@2026</div>
                </div>
                <ChevronRightIcon />
              </button>

              <button
                onClick={() => handleQuickLogin("citizen@civiclens.demo", "Citizen@2026")}
                className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-slate-900/40 to-slate-800/20 border border-theme-main hover:border-emerald-500/50 transition-all text-left text-xs flex items-center justify-between group cursor-pointer shadow-sm hover:translate-x-0.5"
              >
                <div>
                  <div className="font-extrabold text-[#21D4FD] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#21D4FD]"></span>
                    <span>Demo Citizen: Arjun Mehta (Demo)</span>
                  </div>
                  <div className="text-[10px] text-theme-muted font-mono mt-0.5">citizen@civiclens.demo / Citizen@2026</div>
                </div>
                <ChevronRightIcon />
              </button>

              <div className="mt-3 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-bold">⚡ Demo Mode — These accounts are for local demonstration only</span>
              </div>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <span className="w-6 h-6 rounded-xl bg-theme-secondary border border-theme-main text-theme-muted flex items-center justify-center group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-all">
      <ArrowRight className="w-3.5 h-3.5" />
    </span>
  );
}
