/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Issue, IssueSeverity, IssueStatus, User, Verification, StatusUpdate, Department, Notification, AuditLog, CommunityInsight, Announcement } from "../types";
import { SEEDED_ISSUES, DEFAULT_USERS, SEEDED_DEPARTMENTS, SEEDED_INSIGHTS } from "../data/seedData";
import { ensureFirebaseInitialized, getFirestoreInstance } from "./FirebaseRepository";
import { getAppMode } from "./appMode";

const STORAGE_KEYS = {
  get ISSUES() { return getAppMode() === "demo" ? "civiclens_demo_issues" : "civiclens_issues"; },
  get USERS() { return getAppMode() === "demo" ? "civiclens_demo_users" : "civiclens_users"; },
  get CREDENTIALS() { return getAppMode() === "demo" ? "civiclens_demo_credentials" : "civiclens_credentials"; },
  get VERIFICATIONS() { return getAppMode() === "demo" ? "civiclens_demo_verifications" : "civiclens_verifications"; },
  get STATUS_UPDATES() { return getAppMode() === "demo" ? "civiclens_demo_status_updates" : "civiclens_status_updates"; },
  get NOTIFICATIONS() { return getAppMode() === "demo" ? "civiclens_demo_notifications" : "civiclens_notifications"; },
  get AUDIT_LOGS() { return getAppMode() === "demo" ? "civiclens_demo_audit_logs" : "civiclens_audit_logs"; },
  get INSIGHTS() { return getAppMode() === "demo" ? "civiclens_demo_insights" : "civiclens_insights"; },
  get CURRENT_USER_ID() { return getAppMode() === "demo" ? "civiclens_demo_current_user_id" : "civiclens_current_user_id"; },
  get ANNOUNCEMENTS() { return getAppMode() === "demo" ? "civiclens_demo_announcements" : "civiclens_announcements"; }
};

function safeParseJSON<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`localStorage parse failed for key "${key}", resetting to default:`, err);
    return defaultValue;
  }
}

const isFirebaseMode = () => getAppMode() === "firebase";

async function syncToFirestore(collectionName: string, id: string, data: any): Promise<void> {
  if (!isFirebaseMode()) return;
  try {
    await ensureFirebaseInitialized();
    const firestore = getFirestoreInstance();
    if (firestore) {
      const { doc, setDoc, deleteDoc } = await import("firebase/firestore");
      if (data === null) {
        await deleteDoc(doc(firestore, collectionName, id));
      } else {
        await setDoc(doc(firestore, collectionName, id), data);
      }
    }
  } catch (err) {
    console.error(`Failed to sync to Firestore: ${collectionName}/${id}`, err);
  }
}

async function syncNotificationsRead(userId: string) {
  if (!isFirebaseMode()) return;
  try {
    await ensureFirebaseInitialized();
    const firestore = getFirestoreInstance();
    if (firestore) {
      const { query, collection, where, getDocs, writeBatch } = await import("firebase/firestore");
      const q = query(collection(firestore, "notifications"), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      const batch = writeBatch(firestore);
      snapshot.forEach(docSnap => {
        batch.update(docSnap.ref, { read: true });
      });
      await batch.commit();
    }
  } catch (err) {
    console.error("Failed to sync notifications read status", err);
  }
}

// Initialize localStorage with seed data if empty
function initializeStorage() {
  if (isFirebaseMode()) {
    return;
  }
  if (!localStorage.getItem(STORAGE_KEYS.ISSUES)) {
    localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(SEEDED_ISSUES));
  } else {
    // Migration: Update existing issue_103 in localStorage if it contains the old bad URLs
    try {
      const issuesStr = localStorage.getItem(STORAGE_KEYS.ISSUES);
      if (issuesStr) {
        const issues = JSON.parse(issuesStr) as Issue[];
        let updated = false;
        const migrated = issues.map(issue => {
          if (issue.id === "issue_103") {
            let itemUpdated = false;
            if (issue.evidence && issue.evidence[0]) {
              const oldUrl = issue.evidence[0].url;
              if (oldUrl.includes("photo-1518005020951") || oldUrl.includes("broken_light_preset") || oldUrl === "/assets/demo/broken_light_preset.png" || oldUrl.includes("photo-1509024644558")) {
                issue.evidence[0].url = "/assets/demo/dark_street_preset.png";
                itemUpdated = true;
              }
            }
            if (issue.resolutionDetails) {
              const oldBefore = issue.resolutionDetails.beforeImageUrl;
              if (oldBefore && (oldBefore.includes("photo-1518005020951") || oldBefore.includes("broken_light_preset") || oldBefore === "/assets/demo/broken_light_preset.png" || oldBefore.includes("photo-1509024644558"))) {
                issue.resolutionDetails.beforeImageUrl = "/assets/demo/dark_street_preset.png";
                itemUpdated = true;
              }
              const oldAfter = issue.resolutionDetails.afterImageUrl;
              if (oldAfter && (oldAfter.includes("photo-1473163928189") || oldAfter.includes("photo-1513829096960") || oldAfter.includes("unsplash"))) {
                issue.resolutionDetails.afterImageUrl = "/assets/demo/lit_street_preset.png";
                itemUpdated = true;
              }
            }
            if (itemUpdated) {
              updated = true;
            }
          }
          return issue;
        });
        if (updated) {
          localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(migrated));
        }
      }
    } catch (e) {
      console.warn("Failed to migrate localStorage issues for bad images:", e);
    }
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const initialUsers = { ...DEFAULT_USERS };
    initialUsers["demo_staff_user"] = {
      id: "demo_staff_user",
      name: "Inspector Kamal (Demo Staff)",
      email: "staff@civiclens.demo",
      avatar: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=150",
      role: "staff",
      language: "en",
      civicScore: 100,
      trustScore: 95,
      badges: ["Municipal Inspector"],
      joinedAt: "2026-06-01T00:00:00Z"
    };
    initialUsers["demo_citizen_user"] = {
      id: "demo_citizen_user",
      name: "Citizen Arjun (Demo)",
      email: "citizen@civiclens.demo",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
      role: "citizen",
      language: "en",
      civicScore: 120,
      trustScore: 90,
      badges: ["First Responder"],
      joinedAt: "2026-06-01T00:00:00Z"
    };
    initialUsers["demo_admin_user"] = {
      id: "demo_admin_user",
      name: "Admin Rajesh (Demo)",
      email: "admin@civiclens.demo",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150",
      role: "admin",
      language: "en",
      civicScore: 100,
      trustScore: 100,
      badges: ["Municipal Inspector"],
      joinedAt: "2026-06-01T00:00:00Z"
    };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
  } else {
    const currentUsers = safeParseJSON<Record<string, User>>(STORAGE_KEYS.USERS, {});
    let changed = false;

    if (!currentUsers["demo_staff_user"]) {
      currentUsers["demo_staff_user"] = {
        id: "demo_staff_user",
        name: "Inspector Kamal (Demo Staff)",
        email: "staff@civiclens.demo",
        avatar: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=150",
        role: "staff",
        language: "en",
        civicScore: 100,
        trustScore: 95,
        badges: ["Municipal Inspector"],
        joinedAt: "2026-06-01T00:00:00Z"
      };
      changed = true;
    }
    if (!currentUsers["demo_citizen_user"]) {
      currentUsers["demo_citizen_user"] = {
        id: "demo_citizen_user",
        name: "Citizen Arjun (Demo)",
        email: "citizen@civiclens.demo",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
        role: "citizen",
        language: "en",
        civicScore: 120,
        trustScore: 90,
        badges: ["First Responder"],
        joinedAt: "2026-06-01T00:00:00Z"
      };
      changed = true;
    }
    if (!currentUsers["demo_admin_user"]) {
      currentUsers["demo_admin_user"] = {
        id: "demo_admin_user",
        name: "Admin Rajesh (Demo)",
        email: "admin@civiclens.demo",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150",
        role: "admin",
        language: "en",
        civicScore: 100,
        trustScore: 100,
        badges: ["Municipal Inspector"],
        joinedAt: "2026-06-01T00:00:00Z"
      };
      changed = true;
    }
    if (changed) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(currentUsers));
    }
  }

  // Sync credentials in localStorage
  const creds = safeParseJSON<Record<string, any>>(STORAGE_KEYS.CREDENTIALS, {});
  let credsChanged = false;
  const initialCredMap: Record<string, {password: string, userId: string}> = {
    "citizen@civiclens.demo": { password: "Citizen@2026", userId: "demo_citizen_user" },
    "admin@civiclens.demo": { password: "CivicPulse@2026", userId: "demo_admin_user" },
    "staff@civiclens.demo": { password: "Staff@2026", userId: "demo_staff_user" }
  };
  for (const [em, val] of Object.entries(initialCredMap)) {
    if (!creds[em]) {
      creds[em] = val;
      credsChanged = true;
    }
  }
  if (credsChanged || !localStorage.getItem(STORAGE_KEYS.CREDENTIALS)) {
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(creds));
  }
  if (!localStorage.getItem(STORAGE_KEYS.VERIFICATIONS)) {
    const list: Verification[] = [
      {
        id: "v_1",
        issueId: "issue_101",
        userId: "user_citizen_2",
        username: "Priya Sharma",
        type: "confirm",
        comment: "I cross this spot every morning taking my child to school. The pothole is extremely dangerous, please fix it immediately!",
        createdAt: "2026-06-21T09:30:00Z"
      },
      {
        id: "v_2",
        issueId: "issue_102",
        userId: "user_citizen_3",
        username: "Vikram Malhotra",
        type: "confirm",
        comment: "Water is spilling onto the major driving lane. Vehicles are braking violently to avoid the splash.",
        createdAt: "2026-06-20T14:20:00Z"
      }
    ];
    localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(list));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STATUS_UPDATES)) {
    const updates: StatusUpdate[] = [
      {
        id: "su_1",
        issueId: "issue_103",
        previousStatus: IssueStatus.NEW,
        newStatus: IssueStatus.VERIFIED,
        updatedBy: "system",
        updatedByName: "CivicPulse AI",
        publicMessage: "Issue automatically escalated to verified status following confirmation from 10+ local citizens.",
        createdAt: "2026-06-16T10:00:00Z"
      },
      {
        id: "su_2",
        issueId: "issue_103",
        previousStatus: IssueStatus.VERIFIED,
        newStatus: IssueStatus.ASSIGNED,
        updatedBy: "user_admin_1",
        updatedByName: "Inspector Rajesh Kumar",
        publicMessage: "Ticket registered at electricity dispatch cell. Assignee crew leader: BESCOM Sub-Division 4.",
        createdAt: "2026-06-17T08:30:00Z"
      },
      {
        id: "su_3",
        issueId: "issue_103",
        previousStatus: IssueStatus.ASSIGNED,
        newStatus: IssueStatus.RESOLVED,
        updatedBy: "user_admin_1",
        updatedByName: "Inspector Rajesh Kumar",
        publicMessage: "Sodium lights replaced with LED fixtures. Operational glow verified on site.",
        createdAt: "2026-06-18T14:30:00Z"
      }
    ];
    localStorage.setItem(STORAGE_KEYS.STATUS_UPDATES, JSON.stringify(updates));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    const notifications: Notification[] = [
      {
        id: "not_1",
        userId: "user_citizen_1",
        type: "submit",
        issueId: "issue_101",
        title: "Report Submitted Successfully",
        message: "Your hazard report 'Dangerous Deep Pothole Near Primary School' has been successfully registered. Geolocation coordinates pinned under verification ID issue_101.",
        read: false,
        createdAt: "2026-06-21T08:15:00Z"
      },
      {
        id: "not_2",
        userId: "user_citizen_1",
        type: "badge",
        title: "New Badge Unlocked",
        message: "Congratulations! You have earned the 'First Reporter' badge for initiating your first verified municipal audit.",
        read: false,
        createdAt: "2026-06-21T08:15:00Z"
      }
    ];
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INSIGHTS)) {
    localStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(SEEDED_INSIGHTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    const list: AuditLog[] = [
      {
        id: "al_1",
        issueId: "issue_103",
        action: "Assign Department",
        performedBy: "user_admin_1",
        performedByName: "Inspector Rajesh Kumar",
        metadata: { assignedToDepartment: "Electricity Distribution (BESCOM)" },
        createdAt: "2026-06-17T08:30:00Z"
      }
    ];
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(list));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, "user_citizen_1"); // Default user
  }
  if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
    const announcements: Announcement[] = [
      {
        id: "ann_1",
        title: "BESCOM Planned Power & Grid Outage Alert",
        content: "Please note that planned grid modernization and overhead cable-to-underground transition works will be carried out in Bellandur, Sarjapur, and Outer Ring Road blocks. Residents may experience temporary electricity dips.",
        createdAt: "2026-06-22T08:00:00Z",
        category: "warning",
        department: "Electricity Board (BESCOM)",
        authorName: "Admin Rajesh"
      },
      {
        id: "ann_2",
        title: "Monsoon Preparedness Drainage Cleaning Drive",
        content: "The BWSSB sanitary division has initiated high-pressure desilting and clearing of primary storm water drains cross-connecting sector lakes. Citizens can report blocked grates directly on CivicPulse to direct crews.",
        createdAt: "2026-06-21T10:30:00Z",
        category: "info",
        department: "Water & Sewerage (BWSSB)",
        authorName: "Inspector Kamal"
      },
      {
        id: "ann_3",
        title: "Sarjapur Road Resurfacing Task Completed",
        content: "Heavy bitumen milling and road leveling work near the Silk Board highway split has been completed 12 hours ahead of schedule by the PWD engineering cell. Transit delays are projected to return to standard parameters.",
        createdAt: "2026-06-20T17:00:00Z",
        category: "success",
        department: "Public Works Department",
        authorName: "Admin Rajesh"
      }
    ];
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  }
}

initializeStorage();

// Database service accessors
export const dbService = {
  // 1. Issues CRUD
  getIssues(): Issue[] {
    initializeStorage();
    return safeParseJSON<Issue[]>(STORAGE_KEYS.ISSUES, []);
  },

  getIssue(id: string): Issue | undefined {
    return this.getIssues().find(x => x.id === id);
  },

  getUserStreak(userId: string): number {
    const issues = this.getIssues().filter(x => x.createdBy === userId);
    if (issues.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const submissionDates = new Set(
      issues.map(r => {
        const d = new Date(r.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      if (submissionDates.has(checkDate.getTime())) {
        streak++;
      } else if (i > 0) {
        break; // gap found
      }
    }
    return streak;
  },

  saveIssue(issue: Issue): void {
    if (this.isUserBlocked(issue.createdBy)) {
      throw new Error("Action Denied: Your civic reporting privileges have been suspended by city administrators.");
    }
    if (issue.location.isApproximate) {
      issue.location.lat = Math.round(issue.location.lat * 1000) / 1000;
      issue.location.lng = Math.round(issue.location.lng * 1000) / 1000;
    }
    const list = this.getIssues();
    const index = list.findIndex(x => x.id === issue.id);
    const isNew = index < 0;

    let prevStreak = 0;
    if (isNew) {
      prevStreak = this.getUserStreak(issue.createdBy);
    }

    if (index >= 0) {
      list[index] = { ...issue, updatedAt: new Date().toISOString() };
    } else {
      list.unshift(issue);
    }
    localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(list));
    syncToFirestore("issues", issue.id, index >= 0 ? list[index] : issue);

    this.saveAuditLog({
      id: "al_" + Math.random().toString(36).substr(2, 9),
      issueId: issue.id,
      action: index >= 0 ? "Update Issue" : "Submit Issue",
      performedBy: issue.createdBy,
      performedByName: issue.createdByName || "Reporter",
      metadata: { status: issue.status, priorityScore: issue.priorityScore },
      createdAt: new Date().toISOString()
    });
    this.notifyDataChange();
  },

  // 2. Users CRUD & Gamification
  getUsers(): Record<string, User> {
    initializeStorage();
    return safeParseJSON<Record<string, User>>(STORAGE_KEYS.USERS, {});
  },

  saveUser(user: User): void {
    const users = this.getUsers();
    users[user.id] = user;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    syncToFirestore("users", user.id, user);
    this.notifyDataChange();
    window.dispatchEvent(new Event("civiclens_user_changed"));
  },

  getCurrentUser(): User {
    const users = this.getUsers();
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || "user_citizen_1";
    return users[currentId] || users["user_citizen_1"];
  },

  isUserBlocked(userId: string): boolean {
    const users = this.getUsers();
    const user = users[userId];
    return !!(user && (user as any).blocked);
  },

  setCurrentUser(userId: string) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    // Dispatch custom event to notify listeners of user change
    window.dispatchEvent(new Event("civiclens_user_changed"));
  },

  updateUserScore(userId: string, scoreDelta: number, reason: string): User | undefined {
    const users = this.getUsers();
    const user = users[userId];
    if (user) {
      const oldScore = user.civicScore;
      user.civicScore = Math.max(0, user.civicScore + scoreDelta);
      
      // Dynamic badge updates
      const newBadges = [...user.badges];
      
      if (user.civicScore >= 100 && !newBadges.includes("First Reporter")) {
        newBadges.push("First Reporter");
        this.addNotification(userId, "badge", null, "Badge Unlocked: First Reporter", "You earned this badge for your initial contributions toward citizen transparency!");
      }
      if (user.civicScore >= 250 && !newBadges.includes("Community Verifier")) {
        newBadges.push("Community Verifier");
        this.addNotification(userId, "badge", null, "Badge Unlocked: Community Verifier", "With over 250 civic points, you are a certified community audit verifier.");
      }
      if (user.civicScore >= 350 && !newBadges.includes("Neighborhood Guardian")) {
        newBadges.push("Neighborhood Guardian");
        this.addNotification(userId, "badge", null, "Badge Unlocked: Neighborhood Guardian", "Amazing! You are designated as a neighborhood safety guardian.");
      }
      if (user.civicScore >= 450 && !newBadges.includes("Resolution Champion")) {
        newBadges.push("Resolution Champion");
        this.addNotification(userId, "badge", null, "Badge Unlocked: Resolution Champion", "You are a Resolution Champion for actively resolving community blockages.");
      }
      
      const streak = this.getUserStreak(userId);
      if (streak >= 3 && !newBadges.includes("Civic Streak")) {
        newBadges.push("Civic Streak");
        this.addNotification(userId, "badge", null, "Badge Unlocked: Civic Streak", `Unlocked for maintaining a consecutive reporting streak of ${streak} days!`);
      }

      user.badges = newBadges;
      users[userId] = user;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      syncToFirestore("users", userId, user);

      if (scoreDelta > 0) {
        this.addNotification(userId, "verify", null, `Earned +${scoreDelta} Civic Points`, `Reason: ${reason}`);
      } else if (scoreDelta < 0) {
        this.addNotification(userId, "critical", null, `Lost ${Math.abs(scoreDelta)} Civic Points`, `Reason: ${reason}`);
      }
      return user;
    }
  },

  // 3. Verifications Engine (preventing double votes)
  getVerifications(): Verification[] {
    initializeStorage();
    return safeParseJSON<Verification[]>(STORAGE_KEYS.VERIFICATIONS, []);
  },

  getVerificationsForIssue(issueId: string): Verification[] {
    return this.getVerifications().filter(x => x.issueId === issueId);
  },

  hasUserVerified(issueId: string, userId: string): { verified: boolean, type?: "confirm" | "dispute" } {
    const v = this.getVerifications().find(x => x.issueId === issueId && x.userId === userId);
    if (v) {
      return { verified: true, type: v.type };
    }
    return { verified: false };
  },

  verifyIssue(issueId: string, userId: string, type: "confirm" | "dispute", comment?: string): boolean {
    if (this.isUserBlocked(userId)) {
      alert("Action Denied: Your reporting and verification privileges have been suspended by city administrators.");
      return false;
    }
    const hashCheck = this.hasUserVerified(issueId, userId);
    if (hashCheck.verified) {
      return false; // Already verified! Block repeat votes
    }

    const user = this.getCurrentUser();
    const verifications = this.getVerifications();
    const newV: Verification = {
      id: "v_" + Math.random().toString(36).substr(2, 9),
      issueId,
      userId,
      username: user.name,
      type,
      comment,
      createdAt: new Date().toISOString()
    };
    
    verifications.push(newV);
    localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(verifications));
    syncToFirestore("verifications", newV.id, newV);

    // Update issue counts and priority score
    const issues = this.getIssues();
    const issueIndex = issues.findIndex(x => x.id === issueId);
    if (issueIndex >= 0) {
      const issue = issues[issueIndex];
      if (type === "confirm") {
        issue.verificationCount += 1;
        issue.followerCount += 1;
        
        // Auto escalate to verified status if we get 5 confirms
        if (issue.status === IssueStatus.NEW && issue.verificationCount >= 5) {
          issue.status = IssueStatus.VERIFIED;
          this.addStatusUpdate({
            id: "su_" + Math.random().toString(36).substr(2, 9),
            issueId,
            previousStatus: IssueStatus.NEW,
            newStatus: IssueStatus.VERIFIED,
            updatedBy: "system",
            updatedByName: "CivicPulse AI System",
            publicMessage: "Issue automatically escalated to Verified status following continuous community confirmations.",
            createdAt: new Date().toISOString()
          });
        }
      } else {
        issue.inaccurateCount += 1;
        // If dispute count is high, flag for manual admin review
        if (issue.inaccurateCount >= 5 && issue.status !== IssueStatus.REJECTED) {
          this.addNotification("user_admin_1", "critical", issueId, "High Dispute Alert", `The reported issue '${issue.title}' has received multiple disputes from local residents.`);
        }
      }

      // Re-calculate explainable priority score: Add 2 points per community verification
      const basePriority = issue.priorityScore;
      const severityScores = { [IssueSeverity.LOW]: 25, [IssueSeverity.MEDIUM]: 50, [IssueSeverity.HIGH]: 75, [IssueSeverity.CRITICAL]: 90 };
      const currentSeverityScore = severityScores[issue.severity] || 50;
      
      const safetyRiskAdd = issue.possibleRisks ? issue.possibleRisks.length * 2 : 0;
      issue.priorityScore = Math.min(100, currentSeverityScore + safetyRiskAdd + (issue.verificationCount * 1.5) - (issue.inaccurateCount * 3));
      
      issues[issueIndex] = issue;
      localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(issues));
      syncToFirestore("issues", issueId, issue);

      // Verifiers only receive points when the issue gets successfully resolved

      // Notify report creator that someone verified their issue
      if (issue.createdBy !== userId) {
        this.addNotification(
          issue.createdBy,
          "verify",
          issueId,
          "Issue Confirmed",
          `A neighbor verified your reported issue: '${issue.title}'. Verification Count is now ${issue.verificationCount}.`
        );
      }
    }

    this.notifyDataChange();
    return true;
  },

  addComment(issueId: string, userId: string, comment: string): boolean {
    if (this.isUserBlocked(userId)) {
      alert("Action Denied: Your reporting and commentary privileges have been suspended by city administrators.");
      return false;
    }
    if (!comment.trim()) return false;
    const user = this.getCurrentUser();
    const verifications = this.getVerifications();
    const newV: Verification = {
      id: "v_" + Math.random().toString(36).substr(2, 9),
      issueId,
      userId,
      username: user.name,
      type: "confirm",
      comment,
      createdAt: new Date().toISOString()
    };
    verifications.push(newV);
    localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(verifications));
    syncToFirestore("verifications", newV.id, newV);
    return true;
  },

  // 4. Status Updates & Timeline
  getStatusUpdates(): StatusUpdate[] {
    initializeStorage();
    return safeParseJSON<StatusUpdate[]>(STORAGE_KEYS.STATUS_UPDATES, []);
  },

  getStatusUpdatesForIssue(issueId: string): StatusUpdate[] {
    const list = this.getStatusUpdates().filter(x => x.issueId === issueId);
    if (list.length > 0) {
      return list.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    // Dynamic generation if no explicit timeline events exist
    const issue = this.getIssues().find(x => x.id === issueId);
    if (!issue) return [];

    const synth: StatusUpdate[] = [];
    const baseTime = new Date(issue.createdAt || "2026-06-20T10:00:00Z").getTime();

    // 1. Initial NEW Status
    synth.push({
      id: "su_synth_new_" + issueId,
      issueId,
      previousStatus: IssueStatus.NEW,
      newStatus: IssueStatus.NEW,
      updatedBy: issue.createdBy || "system",
      updatedByName: issue.createdByName || "Citizen Reporter",
      publicMessage: "Civic incident reported and filed. Core diagnostic analysis and dispatch queue placement queued.",
      createdAt: new Date(baseTime).toISOString()
    });

    const statusOrder = [
      IssueStatus.NEW,
      IssueStatus.VERIFIED,
      IssueStatus.ASSIGNED,
      IssueStatus.IN_PROGRESS,
      IssueStatus.RESOLVED
    ];

    const currentIdx = statusOrder.indexOf(issue.status);

    if (issue.status === IssueStatus.REJECTED) {
      synth.push({
        id: "su_synth_rej_" + issueId,
        issueId,
        previousStatus: IssueStatus.NEW,
        newStatus: IssueStatus.REJECTED,
        updatedBy: "user_admin_1",
        updatedByName: "Inspector Rajesh Kumar",
        publicMessage: "Administratively overruled. Deemed out of service scope or determined to be a duplication.",
        createdAt: new Date(baseTime + 3600000).toISOString() // +1 hour
      });
    } else if (currentIdx > 0) {
      // 2. Verified Status
      if (currentIdx >= 1) {
        synth.push({
          id: "su_synth_ver_" + issueId,
          issueId,
          previousStatus: IssueStatus.NEW,
          newStatus: IssueStatus.VERIFIED,
          updatedBy: "system",
          updatedByName: "CivicPulse AI",
          publicMessage: "Incident verified. Automated priority weight increased based on nearby citizen confirmations.",
          createdAt: new Date(baseTime + 1800000).toISOString() // +30 mins
        });
      }
      // 3. Assigned Status
      if (currentIdx >= 2) {
        synth.push({
          id: "su_synth_asg_" + issueId,
          issueId,
          previousStatus: IssueStatus.VERIFIED,
          newStatus: IssueStatus.ASSIGNED,
          updatedBy: "user_admin_1",
          updatedByName: "Inspector Rajesh Kumar",
          publicMessage: `Ticket assigned to ${issue.assignedDepartment || "Municipal Department"}. Dispatched technician crew.`,
          createdAt: new Date(baseTime + 5400000).toISOString() // +1.5 hrs
        });
      }
      // 4. In Progress Status
      if (currentIdx >= 3) {
        synth.push({
          id: "su_synth_inp_" + issueId,
          issueId,
          previousStatus: IssueStatus.ASSIGNED,
          newStatus: IssueStatus.IN_PROGRESS,
          updatedBy: "user_admin_1",
          updatedByName: "Inspector Rajesh Kumar",
          publicMessage: "Repair unit mobilized on site with appropriate gear. Diagnostic checks underway.",
          createdAt: new Date(baseTime + 14400000).toISOString() // +4 hours
        });
      }
      // 5. Resolved Status
      if (currentIdx >= 4) {
        synth.push({
          id: "su_synth_res_" + issueId,
          issueId,
          previousStatus: IssueStatus.IN_PROGRESS,
          newStatus: IssueStatus.RESOLVED,
          updatedBy: "user_admin_1",
          updatedByName: "Inspector Rajesh Kumar",
          publicMessage: "Resolution before-and-after evidence verified by Gemini AI. Job successfully completed.",
          createdAt: new Date(baseTime + 28800000).toISOString() // +8 hours
        });
      }
    }

    return synth.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  addStatusUpdate(update: StatusUpdate): void {
    const list = this.getStatusUpdates();
    list.push(update);
    localStorage.setItem(STORAGE_KEYS.STATUS_UPDATES, JSON.stringify(list));
    syncToFirestore("status_updates", update.id, update);
  },

  // 5. Notifications Manager
  getNotifications(userId: string): Notification[] {
    initializeStorage();
    return safeParseJSON<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []).filter((x: any) => x.userId === userId).sort((a: any,b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addNotification(userId: string, type: any, issueId: string | null, title: string, message: string): void {
    initializeStorage();
    const list: Notification[] = safeParseJSON<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const newN: Notification = {
      id: "not_" + Math.random().toString(36).substr(2, 9),
      userId,
      type,
      issueId: issueId || undefined,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString()
    };
    list.unshift(newN);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    syncToFirestore("notifications", newN.id, newN);
  },

  markNotificationsAsRead(userId: string): void {
    initializeStorage();
    const list: Notification[] = safeParseJSON<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const updated = list.map(x => x.userId === userId ? { ...x, read: true } : x);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    syncNotificationsRead(userId);
  },

  // 6. Audit Logs
  getAuditLogs(): AuditLog[] {
    initializeStorage();
    return safeParseJSON<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  },

  getAuditLogsForIssue(issueId: string): AuditLog[] {
    return this.getAuditLogs().filter(x => x.issueId === issueId);
  },

  saveAuditLog(log: AuditLog): void {
    const list = this.getAuditLogs();
    list.unshift(log);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(list));
    syncToFirestore("audit_logs", log.id, log);
  },

  // 7. Departments Service
  getDepartments(): Department[] {
    return SEEDED_DEPARTMENTS;
  },

  // 8. Visual insights
  getInsights(): CommunityInsight[] {
    initializeStorage();
    return safeParseJSON<CommunityInsight[]>(STORAGE_KEYS.INSIGHTS, []);
  },

  saveInsights(insights: CommunityInsight[]): void {
    localStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(insights));
    insights.forEach(insight => syncToFirestore("insights", insight.id, insight));
  },

  // 8.1 Public Announcements
  getAnnouncements(): Announcement[] {
    initializeStorage();
    const list: Announcement[] = safeParseJSON<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    return list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addAnnouncement(ann: Omit<Announcement, "id" | "createdAt">): void {
    initializeStorage();
    const list: Announcement[] = safeParseJSON<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const newAnn: Announcement = {
      ...ann,
      id: "ann_" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    list.unshift(newAnn);
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
    syncToFirestore("announcements", newAnn.id, newAnn);
    window.dispatchEvent(new Event("civiclens_data_changed"));
  },

  deleteAnnouncement(id: string): void {
    initializeStorage();
    const list: Announcement[] = safeParseJSON<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const filtered = list.filter(ann => ann.id !== id);
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(filtered));
    syncToFirestore("announcements", id, null);
    window.dispatchEvent(new Event("civiclens_data_changed"));
  },

  // 9. Admin Operations (Transitioning statuses, bulk items, rejecting)
  adminUpdateIssue(issueId: string, updates: Partial<Issue>, adminMsg: string, internalNote?: string): void {
    const issues = this.getIssues();
    const index = issues.findIndex(x => x.id === issueId);
    if (index >= 0) {
      const oldIssue = issues[index];
      const newStatus = updates.status || oldIssue.status;
      const oldStatus = oldIssue.status;
      const adminUser = this.getCurrentUser();
      
      const updatedIssue = {
        ...oldIssue,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      issues[index] = updatedIssue as Issue;
      localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(issues));
      syncToFirestore("issues", issueId, updatedIssue);

      // Add timeline entry
      this.addStatusUpdate({
        id: "su_" + Math.random().toString(36).substr(2, 9),
        issueId,
        previousStatus: oldStatus,
        newStatus,
        updatedBy: adminUser.id,
        updatedByName: adminUser.name,
        publicMessage: adminMsg,
        internalNote,
        createdAt: new Date().toISOString()
      });

      // Save admin audit log
      this.saveAuditLog({
        id: "al_" + Math.random().toString(36).substr(2, 9),
        issueId,
        action: `Admin Status Change (${oldStatus} -> ${newStatus})`,
        performedBy: adminUser.id,
        performedByName: adminUser.name,
        metadata: { updates, adminMsg, internalNote },
        createdAt: new Date().toISOString()
      });

      // Notify the reporter
      this.addNotification(
        oldIssue.createdBy,
        newStatus === IssueStatus.RESOLVED ? "resolved" : "progress",
        issueId,
        `Issue Status Alert`,
        `Your reported issue '${oldIssue.title}' was updated to '${newStatus}' by municipal moderators. Note: ${adminMsg}`
      );

      // Award base reporting points (+25) and streak bonus when verified by inspector
      if ((newStatus === IssueStatus.VERIFIED || newStatus === IssueStatus.ASSIGNED || newStatus === IssueStatus.IN_PROGRESS || newStatus === IssueStatus.RESOLVED) && 
          (oldStatus === IssueStatus.NEW || oldStatus === IssueStatus.REOPENED)) {
        this.updateUserScore(oldIssue.createdBy, 25, `Your reported issue '${oldIssue.title}' was verified by municipal inspectors!`);
        
        const streak = this.getUserStreak(oldIssue.createdBy);
        if (streak > 0) {
          const streakBonus = streak * 15;
          this.updateUserScore(oldIssue.createdBy, streakBonus, `Streak Bonus: Your verified report extended your streak to ${streak} days!`);
        }
      }

      // Award premium points to reporter upon resolution confirmation (+50 points)
      if (newStatus === IssueStatus.RESOLVED && oldStatus !== IssueStatus.RESOLVED) {
        this.updateUserScore(oldIssue.createdBy, 50, `Your reported issue '${oldIssue.title}' was successfully resolved!`);
        
        // Award points to all verifiers of this issue
        const verifications = this.getVerificationsForIssue(issueId);
        verifications.forEach(ver => {
          this.updateUserScore(ver.userId, 10, `Your verification on '${oldIssue.title}' was confirmed upon issue resolution!`);
        });
      }
      // Reduce points for invalid reports (when status becomes REJECTED)
      if (newStatus === IssueStatus.REJECTED && oldStatus !== IssueStatus.REJECTED) {
        this.updateUserScore(oldIssue.createdBy, -30, `Your reported issue '${oldIssue.title}' was rejected as invalid.`);
      }
      this.notifyDataChange();
    }
  },

  // 10. Authentication Engine
  login(email: string, passwordText: string): { success: boolean; userId?: string; error?: string } {
    initializeStorage();
    const creds = safeParseJSON<Record<string, any>>(STORAGE_KEYS.CREDENTIALS, {});
    const formattedEmail = email.trim().toLowerCase();
    const userCred = creds[formattedEmail];
    if (!userCred) {
      return { success: false, error: "Email does not exist. Please register first." };
    }
    if (userCred.password !== passwordText) {
      return { success: false, error: "Incorrect password. Please try again." };
    }

    // Check moderator approval restrictions
    const users = this.getUsers();
    const userObj = users[userCred.userId];
    if (userObj) {
      if (userObj.role === "admin" || userObj.role === "staff") {
        if (userObj.pendingApproval) {
          return { success: false, error: "Officer user is pending administrator clearance. Standard login blocked." };
        }
        if (userObj.denied) {
          return { success: false, error: "Officer user account application was denied by the administrator." };
        }
      }
    }

    localStorage.setItem("civiclens_is_signed_in", "true");
    this.setCurrentUser(userCred.userId);
    return { success: true, userId: userCred.userId };
  },

  retrievePassword(email: string): string | null {
    initializeStorage();
    const creds = safeParseJSON<Record<string, any>>(STORAGE_KEYS.CREDENTIALS, {});
    const formattedEmail = email.trim().toLowerCase();
    const userCred = creds[formattedEmail];
    return userCred ? userCred.password : null;
  },

  register(name: string, email: string, passwordText: string, role: "citizen" | "admin" | "staff" = "citizen", language: "en" | "hi" = "en"): { success: boolean; userId?: string; pendingApproval?: boolean; error?: string } {
    initializeStorage();
    const formattedEmail = email.trim().toLowerCase();
    const creds = safeParseJSON<Record<string, any>>(STORAGE_KEYS.CREDENTIALS, {});
    if (creds[formattedEmail]) {
      return { success: false, error: "Email is already registered. Try logging in." };
    }

    const userId = "user_" + Math.random().toString(36).substr(2, 9);
    
    // Add credentials record
    creds[formattedEmail] = { password: passwordText, userId };
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(creds));

    // Create user object
    const users = this.getUsers();
    const isPendingAdmin = role === "admin" || role === "staff";
    
    users[userId] = {
      id: userId,
      name: name.trim(),
      email: formattedEmail,
      avatar: role !== "citizen"
        ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"
        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      role,
      language,
      civicScore: role !== "citizen" ? 0 : 50,
      trustScore: 85,
      badges: role !== "citizen" ? ["Municipal Inspector"] : ["First Responder"],
      joinedAt: new Date().toISOString(),
      ...(isPendingAdmin ? { pendingApproval: true } : {})
    };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    syncToFirestore("users", userId, users[userId]);

    if (isPendingAdmin) {
      // Do NOT log them in automatically or set them as current user if admin/moderator
      return { success: true, userId, pendingApproval: true };
    }

    localStorage.setItem("civiclens_is_signed_in", "true");
    this.setCurrentUser(userId);
    return { success: true, userId };
  },

  authenticateGoogleUser(name: string, email: string): { success: boolean; userId: string } {
    initializeStorage();
    const formattedEmail = email.trim().toLowerCase();
    const creds = safeParseJSON<Record<string, any>>(STORAGE_KEYS.CREDENTIALS, {});
    
    let userId;
    if (creds[formattedEmail]) {
      userId = creds[formattedEmail].userId;
    } else {
      userId = "user_google_" + Math.random().toString(36).substr(2, 9);
      creds[formattedEmail] = { password: "GoogleAuthenticatedUserSecretPassword", userId };
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(creds));
      
      const users = this.getUsers();
      users[userId] = {
        id: userId,
        name: name.trim(),
        email: formattedEmail,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
        role: "citizen",
        language: "en",
        civicScore: 50,
        trustScore: 85,
        badges: ["First Responder"],
        joinedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      syncToFirestore("users", userId, users[userId]);
    }
    
    localStorage.setItem("civiclens_is_signed_in", "true");
    this.setCurrentUser(userId);
    return { success: true, userId };
  },

  logout(): void {
    localStorage.removeItem("civiclens_is_signed_in");
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, "user_citizen_1"); // Fallback to Guest / Arjun seed
    window.dispatchEvent(new Event("civiclens_user_changed"));
  },

  approveModerator(userId: string): void {
    const users = this.getUsers();
    if (users[userId]) {
      users[userId].pendingApproval = false;
      users[userId].approved = true;
      users[userId].denied = false;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      syncToFirestore("users", userId, users[userId]);
      
      const adminUser = this.getCurrentUser();
      this.saveAuditLog({
        id: "al_mod_approve_" + Math.random().toString(36).substr(2, 9),
        issueId: "",
        action: `Approved Moderator (${users[userId].email})`,
        performedBy: adminUser.id,
        performedByName: adminUser.name,
        metadata: { moderatorUserId: userId },
        createdAt: new Date().toISOString()
      });
      this.notifyDataChange();
    }
  },

  denyModerator(userId: string): void {
    const users = this.getUsers();
    if (users[userId]) {
      users[userId].pendingApproval = false;
      users[userId].approved = false;
      users[userId].denied = true;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      syncToFirestore("users", userId, users[userId]);
      
      const adminUser = this.getCurrentUser();
      this.saveAuditLog({
        id: "al_mod_deny_" + Math.random().toString(36).substr(2, 9),
        issueId: "",
        action: `Denied Moderator (${users[userId].email})`,
        performedBy: adminUser.id,
        performedByName: adminUser.name,
        metadata: { moderatorUserId: userId },
        createdAt: new Date().toISOString()
      });
      this.notifyDataChange();
    }
  },

  notifyDataChange(): void {
    window.dispatchEvent(new Event("civiclens_data_changed"));
  }
};
