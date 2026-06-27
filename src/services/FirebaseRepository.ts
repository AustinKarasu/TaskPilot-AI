/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CivicRepository } from "./repository";
import { Issue, User, Verification, StatusUpdate, Department, Notification, AuditLog, CommunityInsight, Announcement, IssueStatus, IssueSeverity } from "../types";
import { initializeApp, getApps, getApp } from "firebase/app";
import { SEEDED_DEPARTMENTS } from "../data/seedData";
import { getFirestore, Firestore, collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, query, where, orderBy, writeBatch, deleteDoc } from "firebase/firestore";
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

let firestoreInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let initPromise: Promise<void> | null = null;

export function ensureFirebaseInitialized(): Promise<void> {
  if (initPromise) return initPromise;
  
  initPromise = fetch("/api/config")
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const text = await res.text();
      if (!text) {
        throw new Error("Configuration response body is empty.");
      }
      return JSON.parse(text);
    })
    .then(data => {
      if (data && data.hasFirebase && data.firebaseConfig) {
        const app = !getApps().length ? initializeApp(data.firebaseConfig) : getApp();
        firestoreInstance = getFirestore(app);
        storageInstance = getStorage(app);
      } else {
        throw new Error("Firebase is not configured on the server.");
      }
    })
    .catch(err => {
      initPromise = null; // Clear cached rejected promise to allow retry
      throw err;
    });
  return initPromise;
}

export class FirebaseRepository implements CivicRepository {
  constructor() {
    ensureFirebaseInitialized().catch(e => console.warn("Firebase lazy init deferred:", e.message));
  }

  private uploadBase64ToStorage(base64Data: string, path: string): Promise<string> {
    const storage = storageInstance!;
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let mimeType = "image/jpeg";
    let base64String = base64Data;
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64String = matches[2];
    }
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const storageRef = ref(storage, path);
    return uploadBytes(storageRef, blob).then(() => getDownloadURL(storageRef));
  }

  getIssues(): Promise<Issue[]> {
    const cached = localStorage.getItem("civiclens_issues");
    if (cached) {
      try {
        return Promise.resolve(JSON.parse(cached));
      } catch (e) {}
    }
    return ensureFirebaseInitialized().then(() => {
      return getDocs(collection(firestoreInstance!, "issues")).then(snapshot => {
        const list: Issue[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as Issue);
        });
        localStorage.setItem("civiclens_issues", JSON.stringify(list));
        return list;
      });
    });
  }

  getIssue(id: string): Promise<Issue | undefined> {
    return ensureFirebaseInitialized().then(() => {
      return getDoc(doc(firestoreInstance!, "issues", id)).then(snap => {
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() } as Issue;
        }
        return undefined;
      });
    });
  }

  saveIssue(issue: Issue): Promise<void> {
    return ensureFirebaseInitialized().then(() => {
      const uploadPromises = issue.evidence.map((item, idx) => {
        if (item.url.startsWith("data:")) {
          const path = `issues/${issue.id}/evidence_${idx}`;
          return this.uploadBase64ToStorage(item.url, path).then(downloadUrl => {
            item.url = downloadUrl;
          });
        }
        return Promise.resolve();
      });

      if (issue.resolutionDetails && issue.resolutionDetails.afterImageUrl && issue.resolutionDetails.afterImageUrl.startsWith("data:")) {
        const path = `issues/${issue.id}/resolution_after`;
        const uploadResPromise = this.uploadBase64ToStorage(issue.resolutionDetails.afterImageUrl, path).then(downloadUrl => {
          issue.resolutionDetails!.afterImageUrl = downloadUrl;
        });
        uploadPromises.push(uploadResPromise);
      }

      return Promise.all(uploadPromises).then(() => {
        return setDoc(doc(firestoreInstance!, "issues", issue.id), issue).then(() => {
          return this.saveAuditLog({
            id: "al_" + Math.random().toString(36).substr(2, 9),
            issueId: issue.id,
            action: "Submit Issue (Firebase)",
            performedBy: issue.createdBy,
            performedByName: issue.createdByName || "Reporter",
            metadata: { status: issue.status, priorityScore: issue.priorityScore },
            createdAt: new Date().toISOString()
          });
        });
      });
    });
  }

  getUsers(): Promise<Record<string, User>> {
    return ensureFirebaseInitialized().then(() => {
      return getDocs(collection(firestoreInstance!, "users")).then(snapshot => {
        const users: Record<string, User> = {};
        snapshot.forEach(doc => {
          users[doc.id] = { id: doc.id, ...doc.data() } as User;
        });
        return users;
      });
    });
  }

  getUser(userId: string): Promise<User | undefined> {
    return ensureFirebaseInitialized().then(() => {
      return getDoc(doc(firestoreInstance!, "users", userId)).then(snap => {
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() } as User;
        }
        return undefined;
      });
    });
  }

  getUserStreak(userId: string): Promise<number> {
    return this.getIssues().then(issues => {
      const userIssues = issues.filter(x => x.createdBy === userId);
      if (userIssues.length === 0) return 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const submissionDates = new Set(
        userIssues.map(r => {
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
    });
  }

  getCurrentUser(): Promise<User> {
    return ensureFirebaseInitialized().then(() => {
      const currentId = localStorage.getItem("civiclens_current_user_id") || "user_citizen_1";
      return getDoc(doc(firestoreInstance!, "users", currentId)).then(snap => {
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() } as User;
        }
        throw new Error("Current user profile does not exist in Firebase.");
      });
    });
  }

  isUserBlocked(userId: string): Promise<boolean> {
    return ensureFirebaseInitialized().then(() => {
      return getDoc(doc(firestoreInstance!, "users", userId)).then(snap => {
        if (snap.exists()) {
          const u = snap.data();
          return !!(u && u.blocked);
        }
        return false;
      });
    });
  }

  setCurrentUser(userId: string): Promise<void> {
    localStorage.setItem("civiclens_current_user_id", userId);
    window.dispatchEvent(new Event("civiclens_user_changed"));
    return Promise.resolve();
  }

  updateUserScore(userId: string, scoreDelta: number, reason: string): Promise<User | undefined> {
    return ensureFirebaseInitialized().then(() => {
      const userRef = doc(firestoreInstance!, "users", userId);
      return getDoc(userRef).then(snap => {
        if (snap.exists()) {
          const user = { id: snap.id, ...snap.data() } as User;
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

          return this.getUserStreak(userId).then(streak => {
            if (streak >= 3 && !newBadges.includes("Civic Streak")) {
              newBadges.push("Civic Streak");
              this.addNotification(userId, "badge", null, "Badge Unlocked: Civic Streak", `Unlocked for maintaining a consecutive reporting streak of ${streak} days!`);
            }

            user.badges = newBadges;
            return setDoc(userRef, user).then(() => {
              if (scoreDelta > 0) {
                this.addNotification(userId, "verify", null, `Earned +${scoreDelta} Civic Points`, `Reason: ${reason}`);
              } else if (scoreDelta < 0) {
                this.addNotification(userId, "critical", null, `Lost ${Math.abs(scoreDelta)} Civic Points`, `Reason: ${reason}`);
              }
              return user;
            });
          });
        }
        return undefined;
      });
    });
  }

  getVerifications(): Promise<Verification[]> {
    return ensureFirebaseInitialized().then(() => {
      return getDocs(collection(firestoreInstance!, "verifications")).then(snapshot => {
        const list: Verification[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as Verification);
        });
        return list;
      });
    });
  }

  getVerificationsForIssue(issueId: string): Promise<Verification[]> {
    return ensureFirebaseInitialized().then(() => {
      const q = query(collection(firestoreInstance!, "verifications"), where("issueId", "==", issueId));
      return getDocs(q).then(snapshot => {
        const list: Verification[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as Verification);
        });
        return list;
      });
    });
  }

  hasUserVerified(issueId: string, userId: string): Promise<{ verified: boolean; type?: "confirm" | "dispute" }> {
    return ensureFirebaseInitialized().then(() => {
      const docId = `${issueId}_${userId}`;
      return getDoc(doc(firestoreInstance!, "verifications", docId)).then(snap => {
        if (snap.exists()) {
          const v = snap.data() as Verification;
          return { verified: true, type: v.type };
        }
        return { verified: false };
      });
    });
  }

  verifyIssue(issueId: string, userId: string, type: "confirm" | "dispute", comment?: string): Promise<boolean> {
    return ensureFirebaseInitialized().then(() => {
      return this.isUserBlocked(userId).then(blocked => {
        if (blocked) {
          alert("Action Denied: Your reporting and verification privileges have been suspended.");
          return false;
        }
        return this.hasUserVerified(issueId, userId).then(statusCheck => {
          if (statusCheck.verified) return false;

          return this.getCurrentUser().then(user => {
            const docId = `${issueId}_${userId}`;
            const newV: Verification = {
              id: docId,
              issueId,
              userId,
              username: user.name,
              type,
              comment,
              createdAt: new Date().toISOString()
            };

            return setDoc(doc(firestoreInstance!, "verifications", docId), newV).then(() => {
              return this.getIssue(issueId).then(issue => {
                if (issue) {
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

                  return setDoc(doc(firestoreInstance!, "issues", issueId), issue).then(() => {
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
                    return true;
                  });
                }
                return false;
              });
            });
          });
        });
      });
    });
  }

  addComment(issueId: string, userId: string, comment: string): Promise<boolean> {
    return ensureFirebaseInitialized().then(() => {
      return this.isUserBlocked(userId).then(blocked => {
        if (blocked) {
          alert("Action Denied: Your reporting and commentary privileges have been suspended.");
          return false;
        }
        if (!comment.trim()) return false;
        return this.getCurrentUser().then(user => {
          const docId = `comment_${issueId}_${userId}_${Date.now()}`;
          const newV: Verification = {
            id: docId,
            issueId,
            userId,
            username: user.name,
            type: "confirm",
            comment,
            createdAt: new Date().toISOString()
          };
          return setDoc(doc(firestoreInstance!, "verifications", docId), newV).then(() => true);
        });
      });
    });
  }

  getStatusUpdates(): Promise<StatusUpdate[]> {
    return ensureFirebaseInitialized().then(() => {
      return getDocs(collection(firestoreInstance!, "status_updates")).then(snapshot => {
        const list: StatusUpdate[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as StatusUpdate);
        });
        return list;
      });
    });
  }

  getStatusUpdatesForIssue(issueId: string): Promise<StatusUpdate[]> {
    return ensureFirebaseInitialized().then(() => {
      const q = query(collection(firestoreInstance!, "status_updates"), where("issueId", "==", issueId));
      return getDocs(q).then(snapshot => {
        const list: StatusUpdate[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as StatusUpdate);
        });
        return list.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
    });
  }

  addStatusUpdate(update: StatusUpdate): Promise<void> {
    return ensureFirebaseInitialized().then(() => {
      return setDoc(doc(firestoreInstance!, "status_updates", update.id), update);
    });
  }

  getNotifications(userId: string): Promise<Notification[]> {
    return ensureFirebaseInitialized().then(() => {
      const q = query(collection(firestoreInstance!, "notifications"), where("userId", "==", userId));
      return getDocs(q).then(snapshot => {
        const list: Notification[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as Notification);
        });
        return list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });
    });
  }

  addNotification(userId: string, type: any, issueId: string | null, title: string, message: string): Promise<void> {
    return ensureFirebaseInitialized().then(() => {
      const notificationId = "not_" + Math.random().toString(36).substr(2, 9);
      const newN: Notification = {
        id: notificationId,
        userId,
        type,
        issueId: issueId || undefined,
        title,
        message,
        read: false,
        createdAt: new Date().toISOString()
      };
      return setDoc(doc(firestoreInstance!, "notifications", notificationId), newN);
    });
  }

  markNotificationsAsRead(userId: string): Promise<void> {
    return ensureFirebaseInitialized().then(() => {
      const q = query(collection(firestoreInstance!, "notifications"), where("userId", "==", userId));
      return getDocs(q).then(snapshot => {
        const batch = writeBatch(firestoreInstance!);
        snapshot.forEach(docSnap => {
          batch.update(docSnap.ref, { read: true });
        });
        return batch.commit();
      });
    });
  }

  getAuditLogs(): Promise<AuditLog[]> {
    return ensureFirebaseInitialized().then(() => {
      return getDocs(collection(firestoreInstance!, "audit_logs")).then(snapshot => {
        const list: AuditLog[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as AuditLog);
        });
        return list;
      });
    });
  }

  getAuditLogsForIssue(issueId: string): Promise<AuditLog[]> {
    return ensureFirebaseInitialized().then(() => {
      const q = query(collection(firestoreInstance!, "audit_logs"), where("issueId", "==", issueId));
      return getDocs(q).then(snapshot => {
        const list: AuditLog[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as AuditLog);
        });
        return list;
      });
    });
  }

  saveAuditLog(log: AuditLog): Promise<void> {
    return ensureFirebaseInitialized().then(() => {
      return setDoc(doc(firestoreInstance!, "audit_logs", log.id), log);
    });
  }

  getDepartments(): Promise<Department[]> {
    return Promise.resolve(SEEDED_DEPARTMENTS);
  }

  getInsights(): Promise<CommunityInsight[]> {
    return ensureFirebaseInitialized().then(() => {
      return getDocs(collection(firestoreInstance!, "insights")).then(snapshot => {
        const list: CommunityInsight[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as CommunityInsight);
        });
        return list;
      });
    });
  }

  saveInsights(insights: CommunityInsight[]): Promise<void> {
    return ensureFirebaseInitialized().then(() => {
      const batch = writeBatch(firestoreInstance!);
      insights.forEach(insight => {
        const docRef = doc(firestoreInstance!, "insights", insight.id);
        batch.set(docRef, insight);
      });
      return batch.commit();
    });
  }

  getAnnouncements(): Promise<Announcement[]> {
    const cached = localStorage.getItem("civiclens_announcements");
    if (cached) {
      try {
        return Promise.resolve(JSON.parse(cached));
      } catch (e) {}
    }
    return ensureFirebaseInitialized().then(() => {
      return getDocs(collection(firestoreInstance!, "announcements")).then(snapshot => {
        const list: Announcement[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as Announcement);
        });
        const sorted = list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        localStorage.setItem("civiclens_announcements", JSON.stringify(sorted));
        return sorted;
      });
    });
  }

  addAnnouncement(ann: Omit<Announcement, "id" | "createdAt">): Promise<void> {
    return ensureFirebaseInitialized().then(() => {
      const id = "ann_" + Math.random().toString(36).substr(2, 9);
      const newAnn: Announcement = {
        ...ann,
        id,
        createdAt: new Date().toISOString()
      };
      return setDoc(doc(firestoreInstance!, "announcements", id), newAnn);
    });
  }

  deleteAnnouncement(id: string): Promise<void> {
    return ensureFirebaseInitialized().then(() => {
      return deleteDoc(doc(firestoreInstance!, "announcements", id));
    });
  }

  adminUpdateIssue(issueId: string, updates: Partial<Issue>, adminMsg: string, internalNote?: string): Promise<void> {
    return ensureFirebaseInitialized().then(() => {
      return this.getIssue(issueId).then(oldIssue => {
        if (oldIssue) {
          const newStatus = updates.status || oldIssue.status;
          const oldStatus = oldIssue.status;

          return this.getCurrentUser().then(adminUser => {
            const updatedIssue = {
              ...oldIssue,
              ...updates,
              updatedAt: new Date().toISOString()
            };

            return setDoc(doc(firestoreInstance!, "issues", issueId), updatedIssue).then(() => {
              const statusId = "su_" + Math.random().toString(36).substr(2, 9);
              return this.addStatusUpdate({
                id: statusId,
                issueId,
                previousStatus: oldStatus,
                newStatus,
                updatedBy: adminUser.id,
                updatedByName: adminUser.name,
                publicMessage: adminMsg,
                internalNote,
                createdAt: new Date().toISOString()
              }).then(() => {
                const auditId = "al_" + Math.random().toString(36).substr(2, 9);
                return this.saveAuditLog({
                  id: auditId,
                  issueId,
                  action: `Admin Status Change (${oldStatus} -> ${newStatus})`,
                  performedBy: adminUser.id,
                  performedByName: adminUser.name,
                  metadata: { updates, adminMsg, internalNote },
                  createdAt: new Date().toISOString()
                }).then(() => {
                  return this.addNotification(
                    oldIssue.createdBy,
                    newStatus === IssueStatus.RESOLVED ? "resolved" : "progress",
                    issueId,
                    `Issue Status Alert`,
                    `Your reported issue '${oldIssue.title}' was updated to '${newStatus}' by municipal moderators. Note: ${adminMsg}`
                  ).then(() => {
                    const isVerificationTransition = 
                      (newStatus === IssueStatus.VERIFIED || newStatus === IssueStatus.ASSIGNED || newStatus === IssueStatus.IN_PROGRESS || newStatus === IssueStatus.RESOLVED) && 
                      (oldStatus === IssueStatus.NEW || oldStatus === IssueStatus.REOPENED);

                    const pointsPromise = isVerificationTransition
                      ? this.updateUserScore(oldIssue.createdBy, 25, `Your reported issue '${oldIssue.title}' was verified by municipal inspectors!`).then(() => {
                          return this.getUserStreak(oldIssue.createdBy).then(streak => {
                            if (streak > 0) {
                              const streakBonus = streak * 15;
                              return this.updateUserScore(oldIssue.createdBy, streakBonus, `Streak Bonus: Your verified report extended your streak to ${streak} days!`);
                            }
                          });
                        })
                      : Promise.resolve();

                    return pointsPromise.then(() => {
                      if (newStatus === IssueStatus.RESOLVED && oldStatus !== IssueStatus.RESOLVED) {
                        return this.updateUserScore(oldIssue.createdBy, 50, `Your reported issue '${oldIssue.title}' was successfully resolved!`).then(() => {
                          return this.getVerificationsForIssue(issueId).then(verifications => {
                            const promises = verifications.map(ver => 
                              this.updateUserScore(ver.userId, 10, `Your verification on '${oldIssue.title}' was confirmed upon issue resolution!`)
                            );
                            return Promise.all(promises).then(() => {});
                          });
                        });
                      }
                      if (newStatus === IssueStatus.REJECTED && oldStatus !== IssueStatus.REJECTED) {
                        return this.updateUserScore(oldIssue.createdBy, -30, `Your reported issue '${oldIssue.title}' was rejected as invalid.`).then(() => {});
                      }
                    });
                  });
                });
              });
            });
          });
        }
      });
    });
  }

  retrievePassword(email: string): Promise<string | null> {
    return Promise.resolve(null); // Firebase Auth handles secure credentials; passwords are not retrievable.
  }

  resetDemoData(): Promise<void> {
    return Promise.resolve(); // Firebase production collections are not reset from client-side actions.
  }
}

export function getFirestoreInstance(): Firestore | null {
  return firestoreInstance;
}
