/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function getAppMode(): "demo" | "firebase" {
  const envMode = typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_APP_MODE
    : undefined;

  if (envMode === "demo") {
    if (typeof window !== "undefined") {
      localStorage.setItem("civiclens_demo_mode", "true");
    }
    return "demo";
  }

  if (typeof window !== "undefined") {
    const searchParams = new URLSearchParams(window.location.search);
    const demoParam = searchParams.get("demo");
    if (demoParam !== null) {
      const isDemo = demoParam === "true";
      localStorage.setItem("civiclens_demo_mode", isDemo ? "true" : "false");
      return isDemo ? "demo" : "firebase";
    }

    if (envMode !== "firebase") {
      const stored = localStorage.getItem("civiclens_demo_mode");
      if (stored !== null) {
        return stored === "true" ? "demo" : "firebase";
      }
    } else if (localStorage.getItem("civiclens_demo_mode") === "true") {
      localStorage.setItem("civiclens_demo_mode", "false");
    }
  }

  if (envMode === "firebase") {
    return envMode;
  }
  return "firebase";
}
