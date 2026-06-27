/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { CHATBOT_QA } from "../data/chatbotQA";

describe("Chatbot Q&A Database & Matching Contract", () => {
  it("contains more than 100 question-and-answer pairs", () => {
    expect(CHATBOT_QA.length).toBeGreaterThan(100);
  });

  it("handles developer queries with details matching Aayan Parmar", () => {
    // Find the developer Q&A entry (typically ID 1)
    const devEntry = CHATBOT_QA.find(entry => entry.keywords.includes("who made") || entry.keywords.includes("maker"));
    
    expect(devEntry).toBeDefined();
    if (devEntry) {
      // Check developers details are in the response
      expect(devEntry.answer).toContain("Aayan Parmar");
      expect(devEntry.answer).toContain("aayankarasu.fun");
      expect(devEntry.answer).toContain("8091726602");
      expect(devEntry.answer).toContain("aayankarasu@gmail.com");
    }
  });

  it("matches developer keywords accurately using the matching logic", () => {
    const testQueries = [
      "who made this website",
      "who built this website",
      "maker of this website",
      "website creator",
      "developer portfolio",
      "aayan karasu contact email"
    ];

    testQueries.forEach((query) => {
      const msgLower = query.toLowerCase();
      let bestMatch: typeof CHATBOT_QA[0] | null = null;
      let maxMatchCount = 0;

      CHATBOT_QA.forEach((entry) => {
        let matchCount = 0;
        entry.keywords.forEach((keyword) => {
          if (msgLower.includes(keyword)) {
            matchCount += keyword.split(" ").length;
          }
        });

        if (matchCount > maxMatchCount) {
          maxMatchCount = matchCount;
          bestMatch = entry;
        }
      });

      expect(bestMatch).toBeDefined();
      expect(bestMatch!.id).toBe(1); // Entry 1 is the developer details entry
      expect(bestMatch!.answer).toContain("Aayan Parmar");
      expect(bestMatch!.answer).toContain("aayankarasu.fun");
      expect(bestMatch!.answer).toContain("8091726602");
      expect(bestMatch!.answer).toContain("aayankarasu@gmail.com");
    });
  });
});
