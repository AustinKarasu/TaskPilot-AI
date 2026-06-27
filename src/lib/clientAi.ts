import { GeminiAnalysisSchema, GeminiVerificationSchema } from "./validations";

const GEMINI_MODEL = "gemini-2.5-flash";

function getGeminiApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || key.startsWith("YOUR_") || key.startsWith("MY_")) {
    throw new Error("VITE_GEMINI_API_KEY is required for hosted AI features.");
  }
  return key;
}

async function imageToInlineData(image: string): Promise<{ mimeType: string; data: string }> {
  if (image.startsWith("data:image/")) {
    const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid base64 image data.");
    return { mimeType: match[1], data: match[2] };
  }

  const response = await fetch(image);
  if (!response.ok) {
    throw new Error(`Failed to load image evidence (${response.status}).`);
  }
  const contentType = response.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) {
    throw new Error("Evidence file must be an image.");
  }
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return { mimeType: contentType, data: btoa(binary) };
}

async function generateJson<T>(parts: any[], schema: any, signal?: AbortSignal): Promise<T> {
  const apiKey = getGeminiApiKey();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2
      }
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = getGeminiErrorMessage(response.status, payload);
    throw new Error(message);
  }

  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  return JSON.parse(text) as T;
}

async function generateText(parts: any[], signal?: AbortSignal): Promise<string> {
  const apiKey = getGeminiApiKey();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 650
      }
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = getGeminiErrorMessage(response.status, payload);
    throw new Error(message);
  }

  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  return text.trim();
}

function getGeminiErrorMessage(status: number, payload: any): string {
  const rawMessage = payload?.error?.message;
  if (status === 401 || payload?.error?.status === "UNAUTHENTICATED") {
    return "Gemini API authentication failed. Replace VITE_GEMINI_API_KEY with a valid Gemini API key from Google AI Studio.";
  }
  if (status === 403) {
    return rawMessage || "Gemini API access is forbidden. Check that the Gemini API is enabled for this Google project and that the key is allowed to call it.";
  }
  return rawMessage || `Gemini request failed with status ${status}.`;
}

const issueAnalysisResponseSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    category: { type: "STRING" },
    description: { type: "STRING" },
    severity: { type: "INTEGER" },
    publicRisk: { type: "INTEGER" },
    urgency: { type: "STRING", enum: ["low", "medium", "high", "critical"] },
    confidence: { type: "NUMBER" },
    suggestedDepartment: { type: "STRING" },
    visibleEvidence: { type: "ARRAY", items: { type: "STRING" } },
    safetyAdvice: { type: "STRING" },
    missingInformation: { type: "ARRAY", items: { type: "STRING" } },
    clarifyingQuestion: { type: "STRING", nullable: true },
    possibleDuplicateKeywords: { type: "ARRAY", items: { type: "STRING" } },
    recommendedActions: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: ["title", "category", "description", "severity", "publicRisk", "urgency", "confidence", "suggestedDepartment", "visibleEvidence", "safetyAdvice", "missingInformation", "clarifyingQuestion", "possibleDuplicateKeywords", "recommendedActions"]
};

const verificationResponseSchema = {
  type: "OBJECT",
  properties: {
    confidence: { type: "INTEGER" },
    notes: { type: "STRING" },
    resolved: { type: "BOOLEAN" }
  },
  required: ["confidence", "notes", "resolved"]
};

export async function analyzeIssueEvidence(image: string, originalDescription: string, signal?: AbortSignal) {
  const imageData = await imageToInlineData(image);
  const raw = await generateJson<any>([
    {
      text: `Analyze this citizen-reported civic issue photo for CivicPulse AI.

Citizen description: ${originalDescription || "No description provided"}

Return structured JSON. Use severity and publicRisk from 1 to 10. Category should be one of Roads & Traffic, Water & Sanitation, Public Utilities, Solid Waste Management, Environment & Safety, or Other.`
    },
    { inlineData: imageData }
  ], issueAnalysisResponseSchema, signal);

  const validated = GeminiAnalysisSchema.parse(raw);
  const severityMap = validated.urgency === "critical" ? "critical" : validated.urgency === "high" ? "high" : validated.urgency === "low" ? "low" : "medium";
  return {
    ...validated,
    summary: validated.description,
    subcategory: validated.category,
    severity: severityMap,
    citizenSafetyAdvice: validated.safetyAdvice,
    possibleRisks: validated.recommendedActions,
    duplicateSearchTerms: validated.possibleDuplicateKeywords,
    requiresManualReview: validated.confidence < 0.65
  };
}

export async function improveIssueDescription(originalDescription: string, preferredLanguage: string, signal?: AbortSignal) {
  return generateText([
    {
      text: `Rewrite this civic issue report into clear administrative English while preserving the facts. Preferred language context: ${preferredLanguage}.

Original report:
${originalDescription}

Return only the improved report text.`
    }
  ], signal);
}

export async function verifyResolutionEvidence(beforeImage: string, afterImage: string, adminNotes: string, signal?: AbortSignal) {
  const beforeData = await imageToInlineData(beforeImage);
  const afterData = await imageToInlineData(afterImage);
  const raw = await generateJson<any>([
    {
      text: `Compare before and after civic issue evidence for CivicPulse AI.

Admin notes: ${adminNotes || "No notes provided"}

Determine whether the public infrastructure issue appears resolved. Return confidence from 0 to 100, concise notes, and resolved boolean.`
    },
    { inlineData: beforeData },
    { inlineData: afterData }
  ], verificationResponseSchema, signal);
  return GeminiVerificationSchema.parse(raw);
}

export async function askCivicPulseChatbot(message: string, history: Array<{ role: string; text: string }>, signal?: AbortSignal) {
  const historyText = history.map((entry) => `${entry.role}: ${entry.text}`).join("\n").slice(-2500);
  return generateText([
    {
      text: `You are the CivicPulse AI assistant.

Rules:
- Only answer questions about CivicPulse AI, its features, reporting flow, Gemini analysis, Google technologies, maps, verification, rewards, privacy, deployment, and developer details.
- If the user asks unrelated questions, politely refuse and steer back to CivicPulse AI.
- Keep answers concise and useful.

Project facts:
CivicPulse AI is an AI-powered civic reporting and accountability platform. Citizens report potholes, broken streetlights, water leaks, open manholes, garbage dumping, drainage issues, and safety hazards with evidence and location. Gemini analyzes evidence, estimates severity, suggests department routing, and can verify before/after resolution proof. The platform uses Firebase Authentication, Firestore, Storage, Firebase Hosting, Google Maps, Gemini API, React, TypeScript, Vite, Tailwind, Node, and Express.
Developer: Aayan Parmar / Aayan Karasu. Portfolio: aayankarasu.fun. Email: aayankarasu@gmail.com.

Conversation history:
${historyText || "No previous messages."}

User question:
${message}`
    }
  ], signal);
}
