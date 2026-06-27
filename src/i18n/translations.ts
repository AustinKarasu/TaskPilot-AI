/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TranslationSchema {
  tagline: string;
  reportBtn: string;
  exploreBtn: string;
  dashboard: string;
  adminPanel: string;
  impactLink: string;
  howItWorks: string;
  leaderboardLink: string;
  lanSelect: string;
  activeReports: string;
  verifiedReports: string;
  resolvedThisMonth: string;
  responseAvg: string;
  searchPlaceholder: string;
  filterAll: string;
  filterNew: string;
  filterVerified: string;
  filterInProg: string;
  filterResolved: string;
  filterRejected: string;
  potholeTitle: string;
  waterTitle: string;
  lightTitle: string;
  wasteTitle: string;
  drainTitle: string;
  treeTitle: string;
  manholeTitle: string;
  reopen: string;
  verifyConfirm: string;
  verifyDispute: string;
  evidenceStep: string;
  locationStep: string;
  descriptionStep: string;
  aiVerifyStep: string;
  submitSuccess: string;
  civicScore: string;
  streak: string;
  badgeLevel: string;
  notification: string;
  adminQueue: string;
  kanbanView: string;
  listView: string;
  beforeAfter: string;
  aiAnalysis: string;
  disclaimer: string;
}

export const TRANSLATIONS: Record<"en" | "hi", TranslationSchema> = {
  en: {
    tagline: "See it. Verify it. Solve it.",
    reportBtn: "Report an Issue",
    exploreBtn: "Explore Live Map",
    dashboard: "My Dashboard",
    adminPanel: "Admin Center",
    impactLink: "Community Impact",
    howItWorks: "How It Works",
    leaderboardLink: "Civic Leaderboard",
    lanSelect: "Language",
    activeReports: "Active Reports",
    verifiedReports: "Verified Reports",
    resolvedThisMonth: "Resolved This Month",
    responseAvg: "Avg Response Time",
    searchPlaceholder: "Search issues by title, locality or landmark...",
    filterAll: "All Issues",
    filterNew: "New / Unverified",
    filterVerified: "Community Verified",
    filterInProg: "In Progress / Assigned",
    filterResolved: "Resolved Cases",
    filterRejected: "System Rejected",
    potholeTitle: "Roads & Traffic",
    waterTitle: "Water & Sanitation",
    lightTitle: "Public Utilities",
    wasteTitle: "Solid Waste Management",
    drainTitle: "Blocked Drainage",
    treeTitle: "Environment & Safety",
    manholeTitle: "Open Sewer/Manhole",
    reopen: "Reopen Case",
    verifyConfirm: "Confirm Active Issue",
    verifyDispute: "Mark As Inaccurate",
    evidenceStep: "Upload Photo Evidence",
    locationStep: "Settle Location Coordinates",
    descriptionStep: "Enter Details (Hindi/English)",
    aiVerifyStep: "AI Extracted Validation",
    submitSuccess: "Issue Dispatched Successfully!",
    civicScore: "Your Civic Score",
    streak: "Weekly Reporting Streak",
    badgeLevel: "Unlocks Next Badge",
    notification: "Notifications",
    adminQueue: "Municipal Control Desk",
    kanbanView: "Kanban Pipelines",
    listView: "Audit Queue Grid",
    beforeAfter: "Sequential Image Comparative Restoration Analysis",
    aiAnalysis: "Gemini AI Forensic Model Verdict",
    disclaimer: "Disclaimer: AI summaries are advisory forecasts. Real-life emergencies require direct official emergency dispatch channels."
  },
  hi: {
    tagline: "देखें। सत्यापित करें। हल करें।",
    reportBtn: "समस्या की रिपोर्ट करें",
    exploreBtn: "नक्शा देखें",
    dashboard: "मेरा डैशबोर्ड",
    adminPanel: "प्रशासन केंद्र",
    impactLink: "सामुदायिक प्रभाव",
    howItWorks: "यह कैसे काम करता है",
    leaderboardLink: "नागरिक लीडरबोर्ड",
    lanSelect: "भाषा बदलें",
    activeReports: "सक्रिय रिपोर्ट",
    verifiedReports: "सत्यापित रिपोर्ट",
    resolvedThisMonth: "इस महीने हल किए गए",
    responseAvg: "औसत समाधान समय",
    searchPlaceholder: "शीर्षक, स्थान या लैंडमार्क द्वारा खोजें...",
    filterAll: "सभी मुद्दे",
    filterNew: "नया / असंतुलित",
    filterVerified: "सामुदायिक सत्यापित",
    filterInProg: "प्रगति में /assigned",
    filterResolved: "सुलझाए गए मामले",
    filterRejected: "प्रणाली द्वारा खारिज",
    potholeTitle: "सड़क और यातायात",
    waterTitle: "जल और स्वच्छता",
    lightTitle: "सार्वजनिक सुविधाएं",
    wasteTitle: "ठोस कचरा प्रबंधन",
    drainTitle: "अवरुद्ध जल निकासी",
    treeTitle: "पर्यावरण और सुरक्षा",
    manholeTitle: "खुला सीवर/मैनहोल",
    reopen: "मामला फिर से खोलें",
    verifyConfirm: "अस्तित्व की पुष्टि करें",
    verifyDispute: "गलत चिन्हित करें",
    evidenceStep: "फ़ोटो प्रमाण अपलोड करें",
    locationStep: "सटीक स्थान निर्धारित करें",
    descriptionStep: "विवरण दर्ज करें (हिंदी/अंग्रेजी)",
    aiVerifyStep: "एआई निष्कर्षण सत्यापन",
    submitSuccess: "मुद्दा सफलतापूर्वक भेजा गया!",
    civicScore: "आपका नागरिक स्कोर",
    streak: "साप्ताहिक रिपोर्टिंग स्ट्रीक",
    badgeLevel: "अगला बिल्ला अनलॉक",
    notification: "सूचनाएं",
    adminQueue: "नगर नियंत्रण डेस्क",
    kanbanView: "कानबान पाइपलाइन",
    listView: "ऑडिट कतार ग्रिड",
    beforeAfter: "समाधान से पूर्व और पश्चात् का तुलनात्मक फोटो विश्लेषण",
    aiAnalysis: "जेमिनी एआई फोरेंसिक मॉडल निर्णय",
    disclaimer: "अस्वीकरण: एआई सारांश सलाहकार अनुमान हैं। आपातकालीन स्थितियों में सीधे आधिकारिक आपातकालीन चैनलों से संपर्क करें।"
  }
};
