/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAppMode } from "../services/appMode";

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  const mode = getAppMode();
  if (mode === "firebase") {
    try {
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("Failed to retrieve Firebase Auth ID token for request:", e);
    }
  } else {
    const demoToken = localStorage.getItem("civiclens_demo_current_user_id")
      || localStorage.getItem("civiclens_current_user_id");
    if (demoToken) {
      headers["Authorization"] = `Bearer ${demoToken}`;
    }
  }

  return headers;
}
