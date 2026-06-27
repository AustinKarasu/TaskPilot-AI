/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext } from "react";
import { Issue, User, Verification, StatusUpdate, Department, Notification, AuditLog, CommunityInsight, Announcement } from "../types";

export interface CivicRepository {
  getIssues(): Promise<Issue[]>;
  getIssue(id: string): Promise<Issue | undefined>;
  saveIssue(issue: Issue): Promise<void>;
  getUsers(): Promise<Record<string, User>>;
  getUser(userId: string): Promise<User | undefined>;
  getCurrentUser(): Promise<User>;
  setCurrentUser(userId: string): Promise<void>;
  isUserBlocked(userId: string): Promise<boolean>;
  updateUserScore(userId: string, scoreDelta: number, reason: string): Promise<User | undefined>;
  getVerifications(): Promise<Verification[]>;
  getVerificationsForIssue(issueId: string): Promise<Verification[]>;
  hasUserVerified(issueId: string, userId: string): Promise<{ verified: boolean; type?: "confirm" | "dispute" }>;
  verifyIssue(issueId: string, userId: string, type: "confirm" | "dispute", comment?: string): Promise<boolean>;
  addComment(issueId: string, userId: string, comment: string): Promise<boolean>;
  getStatusUpdates(): Promise<StatusUpdate[]>;
  getStatusUpdatesForIssue(issueId: string): Promise<StatusUpdate[]>;
  addStatusUpdate(update: StatusUpdate): Promise<void>;
  getNotifications(userId: string): Promise<Notification[]>;
  addNotification(userId: string, type: any, issueId: string | null, title: string, message: string): Promise<void>;
  markNotificationsAsRead(userId: string): Promise<void>;
  getAuditLogs(): Promise<AuditLog[]>;
  getAuditLogsForIssue(issueId: string): Promise<AuditLog[]>;
  saveAuditLog(log: AuditLog): Promise<void>;
  getDepartments(): Promise<Department[]>;
  getInsights(): Promise<CommunityInsight[]>;
  saveInsights(insights: CommunityInsight[]): Promise<void>;
  getAnnouncements(): Promise<Announcement[]>;
  addAnnouncement(ann: Omit<Announcement, "id" | "createdAt">): Promise<void>;
  deleteAnnouncement(id: string): Promise<void>;
  adminUpdateIssue(issueId: string, updates: Partial<Issue>, adminMsg: string, internalNote?: string): Promise<void>;
  retrievePassword(email: string): Promise<string | null>;
  resetDemoData(): Promise<void>;
}

export const RepositoryContext = createContext<CivicRepository | null>(null);

export function useRepository(): CivicRepository {
  const repo = useContext(RepositoryContext);
  if (!repo) {
    throw new Error("useRepository must be used within a RepositoryProvider");
  }
  return repo;
}

import { getAppMode } from "./appMode";
export { getAppMode };

export const RepositoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [repo, setRepo] = React.useState<CivicRepository | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const setLocalDemoRepository = () => {
      import("./LocalDemoRepository").then(({ LocalDemoRepository }) => {
        if (!cancelled) {
          setRepo(new LocalDemoRepository());
        }
      });
    };

    const mode = getAppMode();
    if (mode === "firebase") {
      // Clear production local storage caches when entering firebase mode to prevent local demo data leak
      localStorage.removeItem("civiclens_issues");
      localStorage.removeItem("civiclens_verifications");
      localStorage.removeItem("civiclens_status_updates");
      localStorage.removeItem("civiclens_announcements");
      localStorage.removeItem("civiclens_users");
      localStorage.removeItem("civiclens_insights");
      localStorage.removeItem("civiclens_notifications");
      localStorage.removeItem("civiclens_audit_logs");

      import("./FirebaseRepository").then(({ FirebaseRepository, ensureFirebaseInitialized, getFirestoreInstance }) => {
        ensureFirebaseInitialized().then(() => {
          if (cancelled) return;
          setRepo(new FirebaseRepository());
          const db = getFirestoreInstance();
          if (db) {
            import("firebase/firestore").then(({ collection, onSnapshot }) => {
              onSnapshot(collection(db, "issues"), (snapshot) => {
                const list: any[] = [];
                snapshot.forEach(doc => {
                  list.push({ id: doc.id, ...doc.data() });
                });
                localStorage.setItem("civiclens_issues", JSON.stringify(list));
                window.dispatchEvent(new Event("civiclens_data_changed"));
              });
              
              onSnapshot(collection(db, "verifications"), (snapshot) => {
                const list: any[] = [];
                snapshot.forEach(doc => {
                  list.push({ id: doc.id, ...doc.data() });
                });
                localStorage.setItem("civiclens_verifications", JSON.stringify(list));
                window.dispatchEvent(new Event("civiclens_data_changed"));
              });

              onSnapshot(collection(db, "status_updates"), (snapshot) => {
                const list: any[] = [];
                snapshot.forEach(doc => {
                  list.push({ id: doc.id, ...doc.data() });
                });
                localStorage.setItem("civiclens_status_updates", JSON.stringify(list));
                window.dispatchEvent(new Event("civiclens_data_changed"));
              });

              onSnapshot(collection(db, "announcements"), (snapshot) => {
                const list: any[] = [];
                snapshot.forEach(doc => {
                  list.push({ id: doc.id, ...doc.data() });
                });
                localStorage.setItem("civiclens_announcements", JSON.stringify(list));
                window.dispatchEvent(new Event("civiclens_data_changed"));
              });

              onSnapshot(collection(db, "users"), (snapshot) => {
                const users: Record<string, any> = {};
                snapshot.forEach(doc => {
                  users[doc.id] = { id: doc.id, ...doc.data() };
                });
                localStorage.setItem("civiclens_users", JSON.stringify(users));
                window.dispatchEvent(new Event("civiclens_user_changed"));
              });

              onSnapshot(collection(db, "insights"), (snapshot) => {
                const list: any[] = [];
                snapshot.forEach(doc => {
                  list.push({ id: doc.id, ...doc.data() });
                });
                localStorage.setItem("civiclens_insights", JSON.stringify(list));
                window.dispatchEvent(new Event("civiclens_data_changed"));
              });

              onSnapshot(collection(db, "audit_logs"), (snapshot) => {
                const list: any[] = [];
                snapshot.forEach(doc => {
                  list.push({ id: doc.id, ...doc.data() });
                });
                localStorage.setItem("civiclens_audit_logs", JSON.stringify(list));
                window.dispatchEvent(new Event("civiclens_data_changed"));
              });
            });
          }
        }).catch(err => {
          console.warn("FirebaseRepository unavailable, falling back to LocalDemoRepository:", err.message);
          setLocalDemoRepository();
        });
      }).catch(err => {
        console.error("Failed to initialize FirebaseRepository, falling back to LocalDemoRepository:", err);
        setLocalDemoRepository();
      });
    } else {
      setLocalDemoRepository();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  if (!repo) {
    return React.createElement(
      "div",
      { className: "min-h-screen bg-slate-950 text-cyan-400 flex flex-col items-center justify-center font-mono text-xs gap-3" },
      React.createElement("div", { className: "w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" }),
      React.createElement("span", null, "Initializing CivicPulse Repository...")
    );
  }

  return React.createElement(
    RepositoryContext.Provider,
    { value: repo },
    children
  );
};
