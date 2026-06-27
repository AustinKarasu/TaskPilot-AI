/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CivicRepository } from "./repository";
import { Issue, User, Verification, StatusUpdate, Department, Notification, AuditLog, CommunityInsight, Announcement, IssueStatus, IssueSeverity } from "../types";
import { SEEDED_ISSUES, DEFAULT_USERS, SEEDED_DEPARTMENTS, SEEDED_INSIGHTS } from "../data/seedData";
import { getAuthHeaders } from "../lib/api";

const STORAGE_KEYS = {
  ISSUES: "civiclens_demo_issues",
  USERS: "civiclens_demo_users",
  CREDENTIALS: "civiclens_demo_credentials",
  VERIFICATIONS: "civiclens_demo_verifications",
  STATUS_UPDATES: "civiclens_demo_status_updates",
  NOTIFICATIONS: "civiclens_demo_notifications",
  AUDIT_LOGS: "civiclens_demo_audit_logs",
  INSIGHTS: "civiclens_demo_insights",
  CURRENT_USER_ID: "civiclens_demo_current_user_id",
  ANNOUNCEMENTS: "civiclens_demo_announcements"
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

function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.ISSUES)) {
    localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(SEEDED_ISSUES));
  } else {
    // Migration: Update existing issues in localStorage to point to their corresponding local preset images
    try {
      const issuesStr = localStorage.getItem(STORAGE_KEYS.ISSUES);
      if (issuesStr) {
        const issues = JSON.parse(issuesStr) as Issue[];
        let updated = false;
        const migrated = issues.map(issue => {
          let itemUpdated = false;

          const updateUrl = (url: string): string => {
            if (!url || !url.startsWith("https://images.unsplash.com")) return url;
            if (issue.id === "issue_101" || issue.id === "issue_109") {
              itemUpdated = true;
              return "/assets/demo/pothole_preset.png";
            }
            if (issue.id === "issue_102") {
              itemUpdated = true;
              return "/assets/demo/pipe_leak_preset.png";
            }
            if (issue.id === "issue_103") {
              itemUpdated = true;
              return "/assets/demo/dark_street_preset.png";
            }
            if (issue.id === "issue_104" || issue.id === "issue_112") {
              itemUpdated = true;
              return "/assets/demo/garbage_preset.png";
            }
            if (issue.id === "issue_105" || issue.id === "issue_107") {
              itemUpdated = true;
              return "/assets/demo/manhole_preset.png";
            }
            return url;
          };

          if (issue.evidence && issue.evidence[0]) {
            const oldUrl = issue.evidence[0].url;
            if (issue.id === "issue_103" && oldUrl === "/assets/demo/broken_light_preset.png") {
              issue.evidence[0].url = "/assets/demo/dark_street_preset.png";
              itemUpdated = true;
            } else {
              const newUrl = updateUrl(oldUrl);
              if (oldUrl !== newUrl) {
                issue.evidence[0].url = newUrl;
              }
            }
          }

          if (issue.resolutionDetails) {
            if (issue.resolutionDetails.beforeImageUrl) {
              const oldBefore = issue.resolutionDetails.beforeImageUrl;
              if (issue.id === "issue_103" && oldBefore === "/assets/demo/broken_light_preset.png") {
                issue.resolutionDetails.beforeImageUrl = "/assets/demo/dark_street_preset.png";
                itemUpdated = true;
              } else {
                const newBefore = updateUrl(oldBefore);
                if (oldBefore !== newBefore) {
                  issue.resolutionDetails.beforeImageUrl = newBefore;
                }
              }
            }
            if (issue.resolutionDetails.afterImageUrl) {
              const oldAfter = issue.resolutionDetails.afterImageUrl;
              if (issue.id === "issue_103" && (oldAfter === "https://images.unsplash.com/photo-1513829096960-ef04c7df323d?auto=format&fit=crop&q=80&w=600" || oldAfter.includes("photo-1513829096960"))) {
                issue.resolutionDetails.afterImageUrl = "/assets/demo/lit_street_preset.png";
                itemUpdated = true;
              }
            }
          }

          if (itemUpdated) {
            updated = true;
          }
          return issue;
        });

        if (updated) {
          localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(migrated));
        }
      }
    } catch (e) {
      console.warn("Failed to migrate localStorage issues for preset images:", e);
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

export class LocalDemoRepository implements CivicRepository {
  constructor() {
    const issuesStr = localStorage.getItem("civiclens_demo_issues");
    if (issuesStr === "[]") {
      // Force clean reload of mock databases if the local storage collections are empty
      localStorage.removeItem("civiclens_demo_issues");
      localStorage.removeItem("civiclens_demo_users");
      localStorage.removeItem("civiclens_demo_verifications");
      localStorage.removeItem("civiclens_demo_status_updates");
      localStorage.removeItem("civiclens_demo_notifications");
      localStorage.removeItem("civiclens_demo_audit_logs");
      localStorage.removeItem("civiclens_demo_insights");
      localStorage.removeItem("civiclens_demo_credentials");
      localStorage.removeItem("civiclens_demo_announcements");
    }
    initializeStorage();
  }

  getIssues(): Promise<Issue[]> {
    initializeStorage();
    return Promise.resolve(safeParseJSON<Issue[]>(STORAGE_KEYS.ISSUES, []));
  }

  getIssue(id: string): Promise<Issue | undefined> {
    return this.getIssues().then(list => list.find(x => x.id === id));
  }

  getUserStreak(userId: string): number {
    const issues = safeParseJSON<Issue[]>(STORAGE_KEYS.ISSUES, []).filter(x => x.createdBy === userId);
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
  }

  saveIssue(issue: Issue): Promise<void> {
    return this.isUserBlocked(issue.createdBy).then(blocked => {
      if (blocked) {
        throw new Error("Action Denied: Your civic reporting privileges have been suspended by city administrators.");
      }
      if (issue.location.isApproximate) {
        issue.location.lat = Math.round(issue.location.lat * 1000) / 1000;
        issue.location.lng = Math.round(issue.location.lng * 1000) / 1000;
      }
      const list = safeParseJSON<Issue[]>(STORAGE_KEYS.ISSUES, []);
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

      this.saveAuditLog({
        id: "al_" + Math.random().toString(36).substr(2, 9),
        issueId: issue.id,
        action: index >= 0 ? "Update Issue" : "Submit Issue",
        performedBy: issue.createdBy,
        performedByName: issue.createdByName || "Reporter",
        metadata: { status: issue.status, priorityScore: issue.priorityScore },
        createdAt: new Date().toISOString()
      });
      window.dispatchEvent(new Event("civiclens_data_changed"));
      return Promise.resolve();
    });
  }

  getUsers(): Promise<Record<string, User>> {
    initializeStorage();
    return Promise.resolve(safeParseJSON<Record<string, User>>(STORAGE_KEYS.USERS, {}));
  }

  getUser(userId: string): Promise<User | undefined> {
    return this.getUsers().then(users => users[userId]);
  }

  getCurrentUser(): Promise<User> {
    return this.getUsers().then(users => {
      const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || "user_citizen_1";
      return users[currentId] || users["user_citizen_1"];
    });
  }

  isUserBlocked(userId: string): Promise<boolean> {
    return this.getUsers().then(users => {
      const user = users[userId];
      return !!(user && (user as any).blocked);
    });
  }

  setCurrentUser(userId: string): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    window.dispatchEvent(new Event("civiclens_user_changed"));
    return Promise.resolve();
  }

  updateUserScore(userId: string, scoreDelta: number, reason: string): Promise<User | undefined> {
    return this.getUsers().then(users => {
      const user = users[userId];
      if (user) {
        user.civicScore = Math.max(0, user.civicScore + scoreDelta);
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

        if (scoreDelta > 0) {
          this.addNotification(userId, "verify", null, `Earned +${scoreDelta} Civic Points`, `Reason: ${reason}`);
        } else if (scoreDelta < 0) {
          this.addNotification(userId, "critical", null, `Lost ${Math.abs(scoreDelta)} Civic Points`, `Reason: ${reason}`);
        }
        window.dispatchEvent(new Event("civiclens_data_changed"));
        return user;
      }
      return undefined;
    });
  }

  getVerifications(): Promise<Verification[]> {
    initializeStorage();
    return Promise.resolve(safeParseJSON<Verification[]>(STORAGE_KEYS.VERIFICATIONS, []));
  }

  getVerificationsForIssue(issueId: string): Promise<Verification[]> {
    return this.getVerifications().then(list => list.filter(x => x.issueId === issueId));
  }

  hasUserVerified(issueId: string, userId: string): Promise<{ verified: boolean; type?: "confirm" | "dispute" }> {
    return this.getVerifications().then(list => {
      const v = list.find(x => x.issueId === issueId && x.userId === userId);
      return v ? { verified: true, type: v.type } : { verified: false };
    });
  }

  verifyIssue(issueId: string, userId: string, type: "confirm" | "dispute", comment?: string): Promise<boolean> {
    return this.isUserBlocked(userId).then(blocked => {
      if (blocked) {
        alert("Action Denied: Your reporting and verification privileges have been suspended by city administrators.");
        return false;
      }
      return this.hasUserVerified(issueId, userId).then(hashCheck => {
        if (hashCheck.verified) {
          return false;
        }
        return this.getCurrentUser().then(user => {
          const verifications = safeParseJSON<Verification[]>(STORAGE_KEYS.VERIFICATIONS, []);
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

          return this.getIssues().then(issues => {
            const index = issues.findIndex(x => x.id === issueId);
            if (index >= 0) {
              const issue = issues[index];
              if (type === "confirm") {
                issue.verificationCount += 1;
                issue.followerCount += 1;
                
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
                if (issue.inaccurateCount >= 5 && issue.status !== IssueStatus.REJECTED) {
                  this.addNotification("user_admin_1", "critical", issueId, "High Dispute Alert", `The reported issue '${issue.title}' has received multiple disputes from local residents.`);
                }
              }

              const severityScores = { [IssueSeverity.LOW]: 25, [IssueSeverity.MEDIUM]: 50, [IssueSeverity.HIGH]: 75, [IssueSeverity.CRITICAL]: 90 };
              const currentSeverityScore = severityScores[issue.severity] || 50;
              const safetyRiskAdd = issue.possibleRisks ? issue.possibleRisks.length * 2 : 0;
              issue.priorityScore = Math.min(100, currentSeverityScore + safetyRiskAdd + (issue.verificationCount * 1.5) - (issue.inaccurateCount * 3));
              
              issues[index] = issue;
              localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(issues));

              // Verifiers only receive points when the issue gets successfully resolved

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
            window.dispatchEvent(new Event("civiclens_data_changed"));
            return true;
          });
        });
      });
    });
  }

  addComment(issueId: string, userId: string, comment: string): Promise<boolean> {
    return this.isUserBlocked(userId).then(blocked => {
      if (blocked) {
        alert("Action Denied: Your reporting and commentary privileges have been suspended by city administrators.");
        return false;
      }
      if (!comment.trim()) return false;
      return this.getCurrentUser().then(user => {
        const verifications = safeParseJSON<Verification[]>(STORAGE_KEYS.VERIFICATIONS, []);
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
        window.dispatchEvent(new Event("civiclens_data_changed"));
        return true;
      });
    });
  }

  getStatusUpdates(): Promise<StatusUpdate[]> {
    initializeStorage();
    return Promise.resolve(safeParseJSON<StatusUpdate[]>(STORAGE_KEYS.STATUS_UPDATES, []));
  }

  getStatusUpdatesForIssue(issueId: string): Promise<StatusUpdate[]> {
    return this.getStatusUpdates().then(list => {
      const filtered = list.filter(x => x.issueId === issueId);
      if (filtered.length > 0) {
        return filtered.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      return this.getIssue(issueId).then(issue => {
        if (!issue) return [];
        const synth: StatusUpdate[] = [];
        const baseTime = new Date(issue.createdAt || "2026-06-20T10:00:00Z").getTime();
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
            createdAt: new Date(baseTime + 3600000).toISOString()
          });
        } else if (currentIdx > 0) {
          if (currentIdx >= 1) {
            synth.push({
              id: "su_synth_ver_" + issueId,
              issueId,
              previousStatus: IssueStatus.NEW,
              newStatus: IssueStatus.VERIFIED,
              updatedBy: "system",
              updatedByName: "CivicPulse AI",
              publicMessage: "Incident verified. Automated priority weight increased based on nearby citizen confirmations.",
              createdAt: new Date(baseTime + 1800000).toISOString()
            });
          }
          if (currentIdx >= 2) {
            synth.push({
              id: "su_synth_asg_" + issueId,
              issueId,
              previousStatus: IssueStatus.VERIFIED,
              newStatus: IssueStatus.ASSIGNED,
              updatedBy: "user_admin_1",
              updatedByName: "Inspector Rajesh Kumar",
              publicMessage: `Ticket assigned to ${issue.assignedDepartment || "Municipal Department"}. Dispatched technician crew.`,
              createdAt: new Date(baseTime + 5400000).toISOString()
            });
          }
          if (currentIdx >= 3) {
            synth.push({
              id: "su_synth_inp_" + issueId,
              issueId,
              previousStatus: IssueStatus.ASSIGNED,
              newStatus: IssueStatus.IN_PROGRESS,
              updatedBy: "user_admin_1",
              updatedByName: "Inspector Rajesh Kumar",
              publicMessage: "Repair unit mobilized on site with appropriate gear. Diagnostic checks underway.",
              createdAt: new Date(baseTime + 14400000).toISOString()
            });
          }
          if (currentIdx >= 4) {
            synth.push({
              id: "su_synth_res_" + issueId,
              issueId,
              previousStatus: IssueStatus.IN_PROGRESS,
              newStatus: IssueStatus.RESOLVED,
              updatedBy: "user_admin_1",
              updatedByName: "Inspector Rajesh Kumar",
              publicMessage: "Resolution before-and-after evidence verified by Gemini AI. Job successfully completed.",
              createdAt: new Date(baseTime + 28800000).toISOString()
            });
          }
        }
        return synth.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
    });
  }

  addStatusUpdate(update: StatusUpdate): Promise<void> {
    const list = safeParseJSON<StatusUpdate[]>(STORAGE_KEYS.STATUS_UPDATES, []);
    list.push(update);
    localStorage.setItem(STORAGE_KEYS.STATUS_UPDATES, JSON.stringify(list));
    window.dispatchEvent(new Event("civiclens_data_changed"));
    return Promise.resolve();
  }

  getNotifications(userId: string): Promise<Notification[]> {
    initializeStorage();
    const list = safeParseJSON<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, [])
      .filter((x: any) => x.userId === userId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return Promise.resolve(list);
  }

  addNotification(userId: string, type: any, issueId: string | null, title: string, message: string): Promise<void> {
    initializeStorage();
    const list = safeParseJSON<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
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
    window.dispatchEvent(new Event("civiclens_data_changed"));
    return Promise.resolve();
  }

  markNotificationsAsRead(userId: string): Promise<void> {
    initializeStorage();
    const list = safeParseJSON<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const updated = list.map(x => x.userId === userId ? { ...x, read: true } : x);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    window.dispatchEvent(new Event("civiclens_data_changed"));
    return Promise.resolve();
  }

  getAuditLogs(): Promise<AuditLog[]> {
    initializeStorage();
    return Promise.resolve(safeParseJSON<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []));
  }

  getAuditLogsForIssue(issueId: string): Promise<AuditLog[]> {
    return this.getAuditLogs().then(list => list.filter(x => x.issueId === issueId));
  }

  saveAuditLog(log: AuditLog): Promise<void> {
    const list = safeParseJSON<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    list.unshift(log);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(list));
    window.dispatchEvent(new Event("civiclens_data_changed"));
    return Promise.resolve();
  }

  getDepartments(): Promise<Department[]> {
    return Promise.resolve(SEEDED_DEPARTMENTS);
  }

  getInsights(): Promise<CommunityInsight[]> {
    initializeStorage();
    return Promise.resolve(safeParseJSON<CommunityInsight[]>(STORAGE_KEYS.INSIGHTS, []));
  }

  saveInsights(insights: CommunityInsight[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(insights));
    window.dispatchEvent(new Event("civiclens_data_changed"));
    return Promise.resolve();
  }

  getAnnouncements(): Promise<Announcement[]> {
    return fetch("/api/announcements")
      .then(res => res.json())
      .then(list => list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      .catch(() => {
        initializeStorage();
        const list = safeParseJSON<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });
  }

  async addAnnouncement(ann: Omit<Announcement, "id" | "createdAt">): Promise<void> {
    const authHeaders = await getAuthHeaders();
    return fetch("/api/announcements", {
      method: "POST",
      headers: {
        ...authHeaders
      },
      body: JSON.stringify(ann)
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to post announcement to server.");
        window.dispatchEvent(new Event("civiclens_data_changed"));
      })
      .catch((err) => {
        console.warn("API addAnnouncement failed, saving locally:", err);
        initializeStorage();
        const list = safeParseJSON<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
        const newAnn: Announcement = {
          ...ann,
          id: "ann_" + Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString()
        };
        list.unshift(newAnn);
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
        window.dispatchEvent(new Event("civiclens_data_changed"));
      });
  }

  async deleteAnnouncement(id: string): Promise<void> {
    const authHeaders = await getAuthHeaders();
    return fetch(`/api/announcements/${id}`, {
      method: "DELETE",
      headers: {
        ...authHeaders
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to delete announcement on server.");
        window.dispatchEvent(new Event("civiclens_data_changed"));
      })
      .catch((err) => {
        console.warn("API deleteAnnouncement failed, deleting locally:", err);
        initializeStorage();
        const list = safeParseJSON<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
        const filtered = list.filter(ann => ann.id !== id);
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(filtered));
        window.dispatchEvent(new Event("civiclens_data_changed"));
      });
  }

  adminUpdateIssue(issueId: string, updates: Partial<Issue>, adminMsg: string, internalNote?: string): Promise<void> {
    return this.getIssues().then(issues => {
      const index = issues.findIndex(x => x.id === issueId);
      if (index >= 0) {
        const oldIssue = issues[index];
        const newStatus = updates.status || oldIssue.status;
        const oldStatus = oldIssue.status;
        
        return this.getCurrentUser().then(adminUser => {
          const updatedIssue = {
            ...oldIssue,
            ...updates,
            updatedAt: new Date().toISOString()
          };
          
          issues[index] = updatedIssue as Issue;
          localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(issues));

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

          this.saveAuditLog({
            id: "al_" + Math.random().toString(36).substr(2, 9),
            issueId,
            action: `Admin Status Change (${oldStatus} -> ${newStatus})`,
            performedBy: adminUser.id,
            performedByName: adminUser.name,
            metadata: { updates, adminMsg, internalNote },
            createdAt: new Date().toISOString()
          });

          this.addNotification(
            oldIssue.createdBy,
            newStatus === IssueStatus.RESOLVED ? "resolved" : "progress",
            issueId,
            `Issue Status Alert`,
            `Your reported issue '${oldIssue.title}' was updated to '${newStatus}' by municipal moderators. Note: ${adminMsg}`
          );

          if ((newStatus === IssueStatus.VERIFIED || newStatus === IssueStatus.ASSIGNED || newStatus === IssueStatus.IN_PROGRESS || newStatus === IssueStatus.RESOLVED) && 
              (oldStatus === IssueStatus.NEW || oldStatus === IssueStatus.REOPENED)) {
            this.updateUserScore(oldIssue.createdBy, 25, `Your reported issue '${oldIssue.title}' was verified by municipal inspectors!`);
            
            const streak = this.getUserStreak(oldIssue.createdBy);
            if (streak > 0) {
              const streakBonus = streak * 15;
              this.updateUserScore(oldIssue.createdBy, streakBonus, `Streak Bonus: Your verified report extended your streak to ${streak} days!`);
            }
          }

          if (newStatus === IssueStatus.RESOLVED && oldStatus !== IssueStatus.RESOLVED) {
            this.updateUserScore(oldIssue.createdBy, 50, `Your reported issue '${oldIssue.title}' was successfully resolved!`);
            this.getVerificationsForIssue(issueId).then(verifications => {
              verifications.forEach(ver => {
                this.updateUserScore(ver.userId, 10, `Your verification on '${oldIssue.title}' was confirmed upon issue resolution!`);
              });
            });
          }
          if (newStatus === IssueStatus.REJECTED && oldStatus !== IssueStatus.REJECTED) {
            this.updateUserScore(oldIssue.createdBy, -30, `Your reported issue '${oldIssue.title}' was rejected as invalid.`);
          }
          window.dispatchEvent(new Event("civiclens_data_changed"));
        });
      }
    });
  }

  retrievePassword(email: string): Promise<string | null> {
    initializeStorage();
    const creds = safeParseJSON<Record<string, any>>(STORAGE_KEYS.CREDENTIALS, {});
    const formattedEmail = email.trim().toLowerCase();
    const userCred = creds[formattedEmail];
    return Promise.resolve(userCred ? userCred.password : null);
  }

  resetDemoData(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.ISSUES);
    localStorage.removeItem(STORAGE_KEYS.VERIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.STATUS_UPDATES);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.INSIGHTS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
    localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
    initializeStorage();
    window.dispatchEvent(new Event("civiclens_data_changed"));
    return Promise.resolve();
  }
}
