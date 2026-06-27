/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalDemoRepository } from "../services/LocalDemoRepository";
import { IssueStatus, IssueSeverity } from "../types";

// Mock localStorage for Node.js environment
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => localStorageStore[key] || null,
  setItem: (key: string, value: string) => { localStorageStore[key] = value.toString(); },
  clear: () => { for (const key in localStorageStore) delete localStorageStore[key]; },
  removeItem: (key: string) => { delete localStorageStore[key]; }
};
Object.defineProperty(global, "localStorage", { value: localStorageMock, writable: true });
Object.defineProperty(global, "window", { value: { dispatchEvent: () => {} }, writable: true });

describe("LocalDemoRepository Operations Contract", () => {
  let repo: LocalDemoRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalDemoRepository();
  });

  it("initializes seed data correctly", async () => {
    const issues = await repo.getIssues();
    expect(issues.length).toBeGreaterThan(0);
    
    const users = await repo.getUsers();
    expect(users["demo_citizen_user"]).toBeDefined();
    expect(users["demo_citizen_user"].email).toBe("citizen@civiclens.demo");
  });

  it("retrieves and saves issues", async () => {
    const newIssue = {
      id: "issue_test_1",
      createdBy: "demo_citizen_user",
      createdByName: "Citizen Arjun",
      title: "Test Pothole on Church Street",
      originalDescription: "Large puddle formation and asphalt decay near metro gate.",
      aiSummary: "Pothole at Church Street",
      category: "pothole",
      subcategory: "asphalt_decay",
      severity: IssueSeverity.HIGH,
      priorityScore: 75,
      aiConfidence: 0.9,
      location: {
        lat: 12.9716,
        lng: 77.5946,
        isApproximate: false
      },
      address: "Church Street, Ashok Nagar, Bengaluru",
      landmark: "Metro Station Exit A",
      evidence: [
        {
          url: "/assets/demo/pothole_preset.png",
          type: "image" as const
        }
      ],
      status: "New" as IssueStatus,
      assignedDepartment: "Municipal PWD",
      verificationCount: 0,
      inaccurateCount: 0,
      followerCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await repo.saveIssue(newIssue);
    const fetched = await repo.getIssue("issue_test_1");
    expect(fetched).toBeDefined();
    expect(fetched?.title).toBe("Test Pothole on Church Street");
  });
});
