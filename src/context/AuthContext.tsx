/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types";
import { useRepository } from "../services/repository";
import { getAppMode } from "../services/appMode";
import { getClientFirebaseConfig } from "../lib/firebaseConfig";

export interface AuthContextType {
  status: "initializing" | "authenticated" | "anonymous" | "error";
  user: User | null;
  role: "citizen" | "admin" | "staff" | null;
  mode: "demo" | "firebase";
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, role: "citizen" | "admin" | "staff") => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  googleSignIn: () => Promise<void>;
  hasFirebase: boolean;
  enable2FA: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const repository = useRepository();
  const [status, setStatus] = useState<AuthContextType["status"]>("initializing");
  const [user, setUser] = useState<User | null>(null);
  const [hasFirebase, setHasFirebase] = useState(false);
  const [enable2FA, setEnable2FA] = useState(false);
  const [firebaseConfig, setFirebaseConfig] = useState<any>(null);
  const [firebaseAuth, setFirebaseAuth] = useState<any>(null);
  
  const mode = getAppMode();

  const buildFirebaseUserProfile = (firebaseUser: any): User => ({
    id: firebaseUser.uid,
    name: firebaseUser.displayName || "Google Citizen",
    email: firebaseUser.email || "",
    avatar: firebaseUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
    role: "citizen",
    language: "en",
    civicScore: 0,
    trustScore: 90,
    badges: [],
    joinedAt: new Date().toISOString()
  });

  const applyAuthenticatedUser = (profile: User) => {
    setUser(profile);
    setStatus("authenticated");
    localStorage.setItem("civiclens_current_user_id", profile.id);
    localStorage.setItem("civiclens_is_signed_in", "true");
    window.dispatchEvent(new Event("civiclens_user_changed"));
  };

  useEffect(() => {
    const previousAuthMode = localStorage.getItem("civiclens_auth_mode");
    if (previousAuthMode !== mode) {
      localStorage.setItem("civiclens_auth_mode", mode);
      if (mode === "demo") {
        localStorage.setItem("civiclens_is_signed_in", localStorage.getItem("civiclens_demo_is_signed_in") === "true" ? "true" : "false");
      }
    }

    const fallbackTimeout = setTimeout(() => {
      setStatus(currentStatus => {
        if (currentStatus === "initializing") {
          console.warn("Auth initialization timed out.");
          return mode === "firebase" ? "error" : "anonymous";
        }
        return currentStatus;
      });
    }, 4000);

    const clientFirebaseConfig = getClientFirebaseConfig();
    const initializeAuth = async (data: any) => {
        const isFirebaseAvailable = !!(data && data.hasFirebase && data.firebaseConfig);
        setHasFirebase(isFirebaseAvailable);
        setFirebaseConfig(data.firebaseConfig);
        setEnable2FA(!!(data && data.enable2FA));

        if (mode === "firebase" && !isFirebaseAvailable) {
          console.error("Firebase mode is enabled but Firebase browser configuration is unavailable.");
          setStatus("error");
          return;
        }

        if (mode === "firebase" && isFirebaseAvailable) {
          try {
            // Lazy load Firebase Auth client-side
            const { initializeApp, getApps, getApp } = await import("firebase/app");
            const { getAuth, onAuthStateChanged, browserLocalPersistence, setPersistence } = await import("firebase/auth");

            const app = !getApps().length ? initializeApp(data.firebaseConfig) : getApp();
            const auth = getAuth(app);
            await setPersistence(auth, browserLocalPersistence);
            setFirebaseAuth(auth);

            // Subscribe to Firebase auth observer
            onAuthStateChanged(auth, async (firebaseUser) => {
              if (firebaseUser) {
                applyAuthenticatedUser(buildFirebaseUserProfile(firebaseUser));
                try {
                  // Resolve user details from database repository
                  const userProfile = await repository.getUser(firebaseUser.uid);
                  if (userProfile) {
                    applyAuthenticatedUser(userProfile);
                    // Sync the current user ID to local storage for standard integrations
                    localStorage.setItem("civiclens_current_user_id", firebaseUser.uid);
                    localStorage.setItem("civiclens_is_signed_in", "true");
                  } else {
                    // Create minimal citizen profile on first login if it doesn't exist
                    const defaultProfile = buildFirebaseUserProfile(firebaseUser);
                    await repository.setCurrentUser(firebaseUser.uid);
                    // Save to Firestore manually if not present
                    try {
                      const { getFirestore, doc, setDoc } = await import("firebase/firestore");
                      const db = getFirestore();
                      await setDoc(doc(db, "users", firebaseUser.uid), defaultProfile);
                    } catch (err) {
                      console.error("Failed to write first-login user profile to Firestore:", err);
                    }
                    setUser(defaultProfile);
                    setStatus("authenticated");
                    localStorage.setItem("civiclens_current_user_id", firebaseUser.uid);
                    localStorage.setItem("civiclens_is_signed_in", "true");
                  }
                } catch (err) {
                  console.warn("Failed to fetch user profile from Firestore, using authenticated Firebase profile:", err);
                  const defaultProfile = buildFirebaseUserProfile(firebaseUser);
                  setUser(defaultProfile);
                  setStatus("authenticated");
                  localStorage.setItem("civiclens_current_user_id", firebaseUser.uid);
                  localStorage.setItem("civiclens_is_signed_in", "true");
                } finally {
                  window.dispatchEvent(new Event("civiclens_user_changed"));
                }
              } else {
                setUser(null);
                setStatus("anonymous");
                localStorage.setItem("civiclens_is_signed_in", "false");
                window.dispatchEvent(new Event("civiclens_user_changed"));
              }
            });
          } catch (err) {
            console.error("Firebase Auth Init Failed:", err);
            setStatus("error");
          }
        } else {
          // 2. Demo Auth Flow Initializer
          const isSigned = localStorage.getItem("civiclens_demo_is_signed_in") === "true";
          const currentUserId = localStorage.getItem("civiclens_demo_current_user_id");
          
          if (isSigned && currentUserId) {
            try {
              const profile = await repository.getCurrentUser();
              setUser(profile);
              setStatus("authenticated");
              localStorage.setItem("civiclens_is_signed_in", "true");
            } catch (err) {
              console.warn("Demo user fetch failed, resetting to anonymous:", err);
              setUser(null);
              setStatus("anonymous");
              localStorage.setItem("civiclens_demo_is_signed_in", "false");
              localStorage.setItem("civiclens_is_signed_in", "false");
            }
          } else {
            setUser(null);
            setStatus("anonymous");
            localStorage.setItem("civiclens_is_signed_in", "false");
          }
        }
    };

    const configPromise = clientFirebaseConfig
      ? Promise.resolve({
          hasFirebase: true,
          firebaseConfig: clientFirebaseConfig,
          enable2FA: false
        })
      : fetch("/api/config")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }
        const text = await res.text();
        if (!text) {
          throw new Error("Configuration response body is empty.");
        }
        return JSON.parse(text);
      });
    configPromise
      .then(initializeAuth)
      .catch((err) => {
        console.warn("Failed to load backend config:", err);
        if (mode === "firebase") {
          setHasFirebase(false);
          setFirebaseConfig(null);
          setEnable2FA(false);
          setUser(null);
          setStatus("error");
          localStorage.setItem("civiclens_is_signed_in", "false");
          return;
        }
        setHasFirebase(false);
        setFirebaseConfig(null);
        setEnable2FA(false);
        
        // Execute Demo Auth Flow Initializer
        const isSigned = localStorage.getItem("civiclens_demo_is_signed_in") === "true";
        const currentUserId = localStorage.getItem("civiclens_demo_current_user_id");
        
        if (isSigned && currentUserId) {
          repository.getCurrentUser()
            .then((profile) => {
              setUser(profile);
              setStatus("authenticated");
              localStorage.setItem("civiclens_is_signed_in", "true");
            })
            .catch((repoErr) => {
              console.warn("Demo user fetch failed on fallback, resetting to anonymous:", repoErr);
              setUser(null);
              setStatus("anonymous");
              localStorage.setItem("civiclens_demo_is_signed_in", "false");
              localStorage.setItem("civiclens_is_signed_in", "false");
            });
        } else {
          setUser(null);
          setStatus("anonymous");
          localStorage.setItem("civiclens_is_signed_in", "false");
        }
      });

    return () => {
      clearTimeout(fallbackTimeout);
    };
  }, [repository, mode]);

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const signIn = async (email: string, password: string) => {
    if (mode === "firebase" && firebaseAuth) {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } else {
      // Demo authentication handler
      const formattedEmail = email.trim().toLowerCase();
      const demoUsers = await repository.getUsers();
      const matchedUser = Object.values(demoUsers).find((u) => u.email.toLowerCase() === formattedEmail);

      if (!matchedUser) {
        throw new Error("No account found registered under this email address in demo mode.");
      }

      const retrievedPass = await repository.retrievePassword(email);
      const hashedPassword = await hashPassword(password);
      if (retrievedPass !== password && retrievedPass !== hashedPassword) {
        throw new Error("Invalid password credentials. Please verify your sandbox keys.");
      }

      await repository.setCurrentUser(matchedUser.id);
      setUser(matchedUser);
      setStatus("authenticated");
      localStorage.setItem("civiclens_demo_is_signed_in", "true");
      localStorage.setItem("civiclens_is_signed_in", "true");
      window.dispatchEvent(new Event("civiclens_user_changed"));
    }
  };

  const signUp = async (name: string, email: string, password: string, selectedRole: "citizen" | "admin" | "staff") => {
    if (mode === "firebase" && firebaseAuth) {
      const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await updateProfile(cred.user, { displayName: name });
      
      const defaultProfile: User = {
        id: cred.user.uid,
        name,
        email,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
        role: "citizen", // Always citizen on signup
        language: "en",
        civicScore: 0,
        trustScore: 90,
        badges: [],
        joinedAt: new Date().toISOString()
      };

      try {
        const { getFirestore, doc, setDoc } = await import("firebase/firestore");
        const db = getFirestore();
        await setDoc(doc(db, "users", cred.user.uid), defaultProfile);
      } catch (err) {
        console.error("Failed to write user profile to Firestore:", err);
      }

      await repository.setCurrentUser(cred.user.uid);
      setUser(defaultProfile);
      setStatus("authenticated");
      localStorage.setItem("civiclens_is_signed_in", "true");
    } else {
      // Demo Registration
      const demoUsers = await repository.getUsers();
      const emailExists = Object.values(demoUsers).some(u => u.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        throw new Error("Email address already registered in this local sandbox.");
      }

      const uid = "demo_user_" + Math.random().toString(36).substr(2, 9);
      const newUser: User = {
        id: uid,
        name,
        email,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
        role: selectedRole, // Allow role selection in demo mode only
        language: "en",
        civicScore: 0,
        trustScore: 90,
        badges: [],
        joinedAt: new Date().toISOString()
      };

      const users = { ...demoUsers, [uid]: newUser };
      localStorage.setItem("civiclens_demo_users", JSON.stringify(users));

      const hashedPassword = await hashPassword(password);
      const creds = JSON.parse(localStorage.getItem("civiclens_demo_credentials") || "{}");
      creds[email.trim().toLowerCase()] = { password: hashedPassword, userId: uid };
      localStorage.setItem("civiclens_demo_credentials", JSON.stringify(creds));

      await repository.setCurrentUser(uid);
      setUser(newUser);
      setStatus("authenticated");
      localStorage.setItem("civiclens_demo_is_signed_in", "true");
      localStorage.setItem("civiclens_is_signed_in", "true");
      window.dispatchEvent(new Event("civiclens_user_changed"));
    }
  };

  const signOut = async () => {
    if (mode === "firebase" && firebaseAuth) {
      const { signOut } = await import("firebase/auth");
      await signOut(firebaseAuth);
    }
    
    setUser(null);
    setStatus("anonymous");
    if (mode === "demo") {
      localStorage.removeItem("civiclens_demo_current_user_id");
      localStorage.setItem("civiclens_demo_is_signed_in", "false");
      localStorage.setItem("civiclens_is_signed_in", "false");
    } else {
      localStorage.removeItem("civiclens_current_user_id");
      localStorage.setItem("civiclens_is_signed_in", "false");
    }
    localStorage.setItem("civiclens_auth_mode", mode);
    window.dispatchEvent(new Event("civiclens_user_changed"));
  };

  const sendPasswordReset = async (email: string) => {
    if (mode === "firebase" && firebaseAuth) {
      const { sendPasswordResetEmail } = await import("firebase/auth");
      await sendPasswordResetEmail(firebaseAuth, email);
    } else {
      const retrievedPass = await repository.retrievePassword(email);
      if (!retrievedPass) {
        throw new Error("No sandbox account registered under this email.");
      }
      
      // Trigger backend reset email dispatch
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to trigger recovery email.");
      }
    }
  };

  const googleSignIn = async () => {
    if (mode === "firebase" && firebaseAuth && hasFirebase) {
      const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account"
      });
      const credential = await signInWithPopup(firebaseAuth, provider);
      const profile = buildFirebaseUserProfile(credential.user);
      applyAuthenticatedUser(profile);

      void (async () => {
        try {
          await repository.setCurrentUser(credential.user.uid);
          const { getFirestore, doc, setDoc } = await import("firebase/firestore");
          const db = getFirestore();
          await setDoc(doc(db, "users", credential.user.uid), profile, { merge: true });
        } catch (err) {
          console.error("Failed to sync Google user profile to Firestore:", err);
        }
      })();
    } else {
      if (mode === "firebase") {
        throw new Error("Firebase Google sign-in is not configured. Check Firebase web config and authorized domains.");
      }
      const demoEmail = "google-citizen@gmail.com";
      const demoName = "Arjun Google (Demo)";
      
      const demoUsers = await repository.getUsers();
      let matchedUser = Object.values(demoUsers).find(u => u.email === demoEmail);
      
      if (!matchedUser) {
        const uid = "demo_google_user";
        matchedUser = {
          id: uid,
          name: demoName,
          email: demoEmail,
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
          role: "citizen",
          language: "en",
          civicScore: 120,
          trustScore: 90,
          badges: ["First Responder"],
          joinedAt: new Date().toISOString()
        };
        const users = { ...demoUsers, [uid]: matchedUser };
        localStorage.setItem("civiclens_demo_users", JSON.stringify(users));
      }

      await repository.setCurrentUser(matchedUser.id);
      setUser(matchedUser);
      setStatus("authenticated");
      localStorage.setItem("civiclens_demo_is_signed_in", "true");
      localStorage.setItem("civiclens_is_signed_in", "true");
      window.dispatchEvent(new Event("civiclens_user_changed"));
    }
  };

  return (
    <AuthContext.Provider value={{
      status,
      user,
      role: user ? user.role : null,
      mode,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      googleSignIn,
      hasFirebase,
      enable2FA
    }}>
      {children}
    </AuthContext.Provider>
  );
};
