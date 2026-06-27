/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Issue, IssueSeverity, IssueStatus, User, Department, CommunityInsight } from "../types";

export const DEFAULT_USERS: Record<string, User> = {
  "user_citizen_1": {
    id: "user_citizen_1",
    name: "Arjun Mehta",
    email: "arjun.mehta@gmail.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    role: "citizen",
    language: "en",
    civicScore: 360,
    trustScore: 92,
    badges: ["First Reporter", "Neighborhood Guardian", "Trusted Contributor"],
    joinedAt: "2026-01-15T08:30:00Z"
  },
  "user_citizen_2": {
    id: "user_citizen_2",
    name: "Priya Sharma",
    email: "priya.sharma2@gmail.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    role: "citizen",
    language: "hi",
    civicScore: 180,
    trustScore: 88,
    badges: ["Community Verifier", "Civic Streak"],
    joinedAt: "2026-03-10T12:00:00Z"
  },
  "user_citizen_3": {
    id: "user_citizen_3",
    name: "Vikram Malhotra",
    email: "vikram.m@gmail.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    role: "citizen",
    language: "en",
    civicScore: 450,
    trustScore: 98,
    badges: ["Resolution Champion", "Neighborhood Guardian", "Civic Streak", "Trusted Contributor"],
    joinedAt: "2025-11-20T10:15:00Z"
  },
  "user_admin_1": {
    id: "user_admin_1",
    name: "Inspector Rajesh Kumar",
    email: "admin.rajesh@civiclens.gov",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
    role: "admin",
    language: "en",
    civicScore: 0,
    trustScore: 100,
    badges: [],
    joinedAt: "2025-06-01T09:00:00Z"
  }
};

export const SEEDED_DEPARTMENTS: Department[] = [
  { id: "dept_pwh", name: "Public Works & Highways (PWD)", contact: "pwd-roads-support@civiclens.org", activeIssues: 12, resolvedIssues: 145, averageResolutionTime: "36 hours" },
  { id: "dept_ws", name: "Water Supply & Sewerage Board (BWSSB)", contact: "bwssb-leaks-helpline@civiclens.org", activeIssues: 8, resolvedIssues: 198, averageResolutionTime: "18 hours" },
  { id: "dept_wm", name: "Municipal Solid Waste (SWM)", contact: "swm-waste-cleanup@civiclens.org", activeIssues: 5, resolvedIssues: 320, averageResolutionTime: "12 hours" },
  { id: "dept_elec", name: "Electricity Distribution (BESCOM)", contact: "bescom-power-ops@civiclens.org", activeIssues: 3, resolvedIssues: 167, averageResolutionTime: "8 hours" },
  { id: "dept_hort", name: "Horticulture & Parks Department", contact: "parks-safety@civiclens.org", activeIssues: 2, resolvedIssues: 84, averageResolutionTime: "24 hours" }
];

export const SEEDED_ISSUES: Issue[] = [
  {
    id: "issue_101",
    createdBy: "user_citizen_1",
    createdByName: "Arjun Mehta",
    createdByAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    title: "Dangerous Deep Pothole Near Primary School",
    originalDescription: "There is an extremely large and deep pothole right in front of the gate of Green Glen Primary School. School buses and parents keep swerving into oncoming traffic to avoid it. It is very risky during pickup/dropoff hours and filled with rainwater so kids can’t see how deep it is.",
    aiSummary: "Multiple indicators confirm a hazardous road rupture (diameter ~1.2m, depth ~15cm) directly obstructing the school vehicle drop-off zone. Deep structural wear aggravated by monsoon runoff creating immediate traffic hazard and pediatric safety risks.",
    category: "Roads & Traffic",
    subcategory: "Potholes",
    severity: IssueSeverity.CRITICAL,
    priorityScore: 94,
    aiConfidence: 0.95,
    location: { lat: 12.9272, lng: 77.6848, isApproximate: false },
    address: "Outside Block 3A, Green Glen Layout, Bellandur",
    landmark: "Directly opposite Green Glen Primary School Entrance",
    evidence: [
      {
        url: "/assets/demo/pothole_preset.png",
        type: "image"
      }
    ],
    status: IssueStatus.NEW,
    assignedDepartment: "Public Works & Highways (PWD)",
    verificationCount: 14,
    inaccurateCount: 0,
    followerCount: 28,
    createdAt: "2026-06-21T08:15:00Z",
    updatedAt: "2026-06-21T08:15:00Z",
    safetyAdvice: "Vehicles should slow to under 10 km/h. High-risk zone for low-slung sedans and two-wheelers. Avoid crossing on foot when dark.",
    possibleRisks: ["Two-wheeler skidding", "Pedestrian ankle injury", "Child safety during school dismissal", "Severe wheel alignment damage"]
  },
  {
    id: "issue_102",
    createdBy: "user_citizen_2",
    createdByName: "Priya Sharma",
    createdByAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    title: "Major Water Pipeline Leakage Flooding Road",
    originalDescription: "A drinking water main pipe seems to have burst under the sidewalk. Water is gushing out like a fountain and has flooded almost half of 100 Feet Road. Thousands of liters of pure water are getting wasted and creating massive mud and traffic jams.",
    aiSummary: "Subsurface high-pressure drinking water pipeline rupture under the pavement sidewalk. Water release is continuous, causing significant flooding (~7cm standing water) across two carriage lanes, leading to soil erosion and severe gridlocks.",
    category: "Water & Sanitation",
    subcategory: "Water Pipeline Leakage",
    severity: IssueSeverity.HIGH,
    priorityScore: 82,
    aiConfidence: 0.92,
    location: { lat: 12.9719, lng: 77.6412, isApproximate: false },
    address: "Near Metro Pillar 124, 100 Feet Road, Indiranagar",
    landmark: "Oppose To Corner Starbucks Café",
    evidence: [
      {
        url: "/assets/demo/pipe_leak_preset.png",
        type: "image"
      }
    ],
    status: IssueStatus.VERIFIED,
    assignedDepartment: "Water Supply & Sewerage Board (BWSSB)",
    verificationCount: 22,
    inaccurateCount: 1,
    followerCount: 45,
    createdAt: "2026-06-20T11:30:00Z",
    updatedAt: "2026-06-21T10:00:00Z",
    safetyAdvice: "Expect significant traffic lag. Pedestrians should use the opposite sidewalk as tiles near the leak may collapse due to underground hollows.",
    possibleRisks: ["Pavement destabilization", "Severe clean water wastage", "Local water pressure drop", "Electrical short circuit in streetlight poles"]
  },
  {
    id: "issue_103",
    createdBy: "user_citizen_3",
    createdByName: "Vikram Malhotra",
    createdByAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    title: "Broken Streetlight on Dark Cyber Junction Curve",
    originalDescription: "Three consecutive streetlights are completely dead at the sharp S-curve near the Tech Park gate. At night, it becomes pitch black and the curve is blind. Already two motorcyclists hit the curb last week because of low visibility.",
    aiSummary: "Intermittent power or lamp burnouts across three consecutive lampposts on a high-density, high-speed S-curve. Luminance at ground level is under 2 lux, falling short of safety standards for municipal blind curves.",
    category: "Public Utilities",
    subcategory: "Broken Streetlight",
    severity: IssueSeverity.HIGH,
    priorityScore: 78,
    aiConfidence: 0.89,
    location: { lat: 12.9562, lng: 77.7011, isApproximate: false },
    address: "Outer Ring Road, Near Gate 2 Prestige Tech Park, Kadubeesanahalli",
    landmark: "50 meters after the footover bridge",
    evidence: [
      {
        url: "/assets/demo/dark_street_preset.png",
        type: "image"
      }
    ],
    status: IssueStatus.RESOLVED,
    assignedDepartment: "Electricity Distribution (BESCOM)",
    verificationCount: 19,
    inaccurateCount: 0,
    followerCount: 31,
    createdAt: "2026-06-15T22:00:00Z",
    updatedAt: "2026-06-18T14:30:00Z",
    resolvedAt: "2026-06-18T14:30:00Z",
    safetyAdvice: "Streetlight fully repaired and upgraded to premium white LED. Blind curve curve-guidance reflectors installed.",
    possibleRisks: ["Criminal activity in secluded darkness", "Severe head-on vehicular crashes on curves", "Pedestrian run-overs due to glare/blindness"],
    resolutionDetails: {
      beforeImageUrl: "/assets/demo/dark_street_preset.png",
      afterImageUrl: "/assets/demo/lit_street_preset.png",
      adminNotes: "BESCOM Crew dispatched. Replaced three burnt-out 250W sodium lamps with new power-saving 120W LED fixtures. Verified stable voltage flow in connection box.",
      resolvedAt: "2026-06-18T14:30:00Z",
      communityConfirmed: true,
      geminiAnalysis: "A direct comparative analysis confirms the complete restoration of visual illumination. Before image demonstrates 0% emission on standard streetlight columns. After image displays clean, operating high-intensity discharge LED light covering the intersection, resolving dark-spot visual safety and structural hazards with high-performance luminophores."
    }
  },
  {
    id: "issue_104",
    createdBy: "user_citizen_1",
    createdByName: "Arjun Mehta",
    createdByAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    title: "Unmanaged Solid Waste Dumping in Residential Lane",
    originalDescription: "Trash is piled up sky high near the corner empty plot on Lane 4. It hasn't been collected for 10 days. Stray cattle are pulling plastic bags everywhere, and the smell is unbearable. It is blocking almost half the lane and breeding mosquitoes.",
    aiSummary: "Substantial uncontrolled deposit of residential and wet organic waste (~1.8 tons) overflowing onto public utility lines. Decaying materials indicate continuous non-removal, presenting high community hygiene, vector, and odor containment failure.",
    category: "Solid Waste Management",
    subcategory: "Waste accumulation",
    severity: IssueSeverity.MEDIUM,
    priorityScore: 62,
    aiConfidence: 0.91,
    location: { lat: 12.9144, lng: 77.6782, isApproximate: false },
    address: "Corner Of 12th Cross & Lane 4, Haralur Road",
    landmark: "Directly adjacent to the vacant plot opposite Park Plaza Apartments",
    evidence: [
      {
        url: "/assets/demo/garbage_preset.png",
        type: "image"
      }
    ],
    status: IssueStatus.IN_PROGRESS,
    assignedDepartment: "Municipal Solid Waste (SWM)",
    verificationCount: 9,
    inaccurateCount: 0,
    followerCount: 16,
    createdAt: "2026-06-18T09:40:00Z",
    updatedAt: "2026-06-22T11:00:00Z",
    safetyAdvice: "Keep windows closed. Do not let children play in proximity due to stray dogs and potential glass shards.",
    possibleRisks: ["Dengue / Malaria vector breeding", "Stray dog pack aggregation", "Stench permeating adjacent homes", "Rainwater runoff contamination"]
  },
  {
    id: "issue_105",
    createdBy: "user_citizen_3",
    createdByName: "Vikram Malhotra",
    createdByAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    title: "Completely Blocked Drainage Causing Sewage Overflow",
    originalDescription: "The storm drain on Sarjapur road is completely choked with solid garbage and construction plastics. Now with the light rains, dirty black sewer water is backing up onto the sidewalks and building entrances. People have to walk through dirty water.",
    aiSummary: "Sanitary sewer backup triggered by extreme density of non-biodegradable plastic blockage inside the main concrete drainage grate. Blackwater overflow is spilling onto pathways (~5cm deep), causing public health hazards and severe concrete moisture degradation.",
    category: "Water & Sanitation",
    subcategory: "Blocked drainage",
    severity: IssueSeverity.HIGH,
    priorityScore: 85,
    aiConfidence: 0.94,
    location: { lat: 12.9234, lng: 77.6698, isApproximate: false },
    address: "Opposite Kaveri Diagnostic Center, Sarjapur Main Road",
    landmark: "In front of diagnostic parking lot",
    evidence: [
      {
        url: "/assets/demo/manhole_preset.png",
        type: "image"
      }
    ],
    status: IssueStatus.ASSIGNED,
    assignedDepartment: "Water Supply & Sewerage Board (BWSSB)",
    verificationCount: 11,
    inaccurateCount: 0,
    followerCount: 22,
    createdAt: "2026-06-22T07:10:00Z",
    updatedAt: "2026-06-23T08:30:00Z",
    safetyAdvice: "Wear thick waterproof boots. Avoid letting open wounds contact flooded puddles. Expect vehicle velocity constraints.",
    possibleRisks: ["Epidemic disease transmission", "Asphalt strip degradation", "Basement wall leakage and mold", "Pedestrian falls in invisible potholes"]
  },
  {
    id: "issue_106",
    createdBy: "user_citizen_2",
    createdByName: "Priya Sharma",
    createdByAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    title: "Large Fallen Tree Branch Blocking Two lanes",
    originalDescription: "A massive Gulmohar branch broke off during yesterday's monsoon gale and fell across the main commercial road. It is completely blocking the left and middle lanes, leaving only a single narrow lane. Drivers are getting caught by surprise on the blind curve.",
    aiSummary: "Substantive tree bough segment (~7m length, ~35cm trunk diameter) resting directly on active road lanes. Canopy density completely occludes road safety markers, representing an acute risk of high-velocity impact on a blind bend.",
    category: "Environment & Safety",
    subcategory: "Fallen tree branch",
    severity: IssueSeverity.CRITICAL,
    priorityScore: 88,
    aiConfidence: 0.93,
    location: { lat: 12.9622, lng: 77.6488, isApproximate: false },
    address: "Outside Block C, 80 Feet Road, HAL Stage 2",
    landmark: "Directly under the large overhead banyan tree near corner bank",
    evidence: [
      {
        url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=600",
        type: "image"
      }
    ],
    status: IssueStatus.RESOLVED,
    assignedDepartment: "Horticulture & Parks Department",
    verificationCount: 18,
    inaccurateCount: 0,
    followerCount: 30,
    createdAt: "2026-06-12T17:45:00Z",
    updatedAt: "2026-06-13T10:15:00Z",
    resolvedAt: "2026-06-13T10:15:00Z",
    safetyAdvice: "The obstruction has been fully cleared. Road was power-swept to remove wet leaf mulch and wood shards.",
    possibleRisks: ["Severe night-collision hazards for cyclists", "Two-way gridlock on arterial lanes", "Utility fiber cable severing under falling load"],
    resolutionDetails: {
      beforeImageUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=600",
      afterImageUrl: "https://images.unsplash.com/photo-1596130089408-f44f6f8f5370?auto=format&fit=crop&q=80&w=600",
      adminNotes: "Emergency response team dispatched with chainsaws. Chopped branch into manageable logs, swept wet organic debris, cleared sewer inlets. Fire service assisted with transport.",
      resolvedAt: "2026-06-13T10:15:00Z",
      communityConfirmed: true,
      geminiAnalysis: "Direct sequential analysis confirms 100% removal of tree trunk blocking active asphalt infrastructure. Before picture shows horizontal block of double carriage lanes. After photo confirms pristine, clear asphalt with standard double white lines fully accessible to civic vehicular and transit systems."
    }
  },
  {
    id: "issue_107",
    createdBy: "user_citizen_1",
    createdByName: "Arjun Mehta",
    createdByAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    title: "Dangerous Uncovered Open Manhole on Walkway",
    originalDescription: "An old concrete cover on the main commercial sidewalk is shattered and gone. There is an active open hole (~3.5-foot drop down) directly into the running sewage pipeline. It is incredibly dangerous for children, blind pedestrians, or anyone in rainy darkness.",
    aiSummary: "Completely exposed vertical storm/sewer portal directly in center of pedestrian traffic pavement. Frame diameter is ~60cm, representing a critical fall risk and lethal toxic sewer gas release environment.",
    category: "Water & Sanitation",
    subcategory: "Open manhole",
    severity: IssueSeverity.CRITICAL,
    priorityScore: 97,
    aiConfidence: 0.98,
    location: { lat: 12.9815, lng: 77.5922, isApproximate: false },
    address: "In front of MG Road Commercial Market, Block B",
    landmark: "MG Road near Bata Showroom Gate",
    evidence: [
      {
        url: "/assets/demo/manhole_preset.png",
        type: "image"
      }
    ],
    status: IssueStatus.REOPENED,
    assignedDepartment: "Water Supply & Sewerage Board (BWSSB)",
    verificationCount: 29,
    inaccurateCount: 0,
    followerCount: 52,
    createdAt: "2026-06-19T06:20:00Z",
    updatedAt: "2026-06-22T15:30:00Z",
    safetyAdvice: "EMERGENCY: Walk around. Active hazard marker placed. Keep distance as cave-ins are possible.",
    possibleRisks: ["Lethal deep falls", "Asphyxiation from methane accumulation", "Rodent/mosquito vectors spreading", "Accidental loss of critical belongings"],
    resolutionDetails: {
      beforeImageUrl: "/assets/demo/manhole_preset.png",
      adminNotes: "Contractor set a plastic sheet cover, which immediately collapsed under rain weight. Reopened the issue immediately following community rejection of temporary cover.",
      communityConfirmed: false,
      geminiAnalysis: "The remediation fails engineering stability compliance. Before image displayed deep dark pit. The proposed resolution (flimsy plastic sheeting with soil ballast) presents a false sense of safety and remains highly vulnerable to direct pedestrian loading and drainage suction."
    }
  },
  {
    id: "issue_108",
    createdBy: "user_citizen_2",
    createdByName: "Priya Sharma",
    createdByAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    title: "Broken Bench and Damaged Swings in Children's Public Park",
    originalDescription: "The concrete seating benches have cracked with sharp rusted iron rods exposed. Also the chain links on the swing set are snapped, hanging loose. Several small kids have scratched themselves. The park feels desolate and dangerous.",
    aiSummary: "Structural mechanical failures in children's recreational park. Concrete seats show deep compression cracks leaving reinforcing steel mesh exposed. Swing chain links exhibit massive tensile stress failures and oxidation.",
    category: "Public Spaces",
    subcategory: "Damaged public bench",
    severity: IssueSeverity.MEDIUM,
    priorityScore: 48,
    aiConfidence: 0.86,
    location: { lat: 12.9355, lng: 77.6244, isApproximate: false },
    address: "Koramangala 3rd Block Neighborhood Park, 5th Cross",
    landmark: "Near the children play gate",
    evidence: [
      {
        url: "https://images.unsplash.com/photo-1510440847485-c54d5c667f41?auto=format&fit=crop&q=80&w=600",
        type: "image"
      }
    ],
    status: IssueStatus.ASSIGNED,
    assignedDepartment: "Horticulture & Parks Department",
    verificationCount: 4,
    inaccurateCount: 0,
    followerCount: 9,
    createdAt: "2026-06-20T14:15:00Z",
    updatedAt: "2026-06-22T09:00:00Z",
    safetyAdvice: "Warn children away from standard swings. Block access to concrete bench with yellow tape if available.",
    possibleRisks: ["Tetanus infections from oxidized iron bars", "Pediatric falls from height", "Youth loitering near decayed facilities"]
  },
  {
    // DUPLICATE CLUSTER 1: Child of issue_101 (Duplicate)
    id: "issue_109",
    createdBy: "user_citizen_2",
    createdByName: "Priya Sharma",
    createdByAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    title: "Huge crater near Green Glen school boarding point",
    originalDescription: "There is a massive road hole opposite Green Glen school gate. It is very dangerous because motorbikes can easily crash into it when dropping of children. Please repair immediately as it accumulates dark muddy water.",
    aiSummary: "Subsurface road decay directly overlapping the school access point. Identified as 100% duplicate of existing report 'Dangerous Deep Pothole Near Primary School' (issue_101) due to identical location vectors and descriptive markers.",
    category: "Roads & Traffic",
    subcategory: "Potholes",
    severity: IssueSeverity.CRITICAL,
    priorityScore: 94,
    aiConfidence: 0.99,
    location: { lat: 12.9273, lng: 77.6847, isApproximate: false },
    address: "In front of Green Glen school boarding door",
    landmark: "Directly opposite Green Glen Primary School",
    evidence: [
      {
        url: "/assets/demo/pothole_preset.png",
        type: "image"
      }
    ],
    status: IssueStatus.VERIFIED,
    assignedDepartment: "Public Works & Highways (PWD)",
    verificationCount: 3,
    inaccurateCount: 0,
    followerCount: 5,
    duplicateOf: "issue_101",
    createdAt: "2026-06-21T09:10:00Z",
    updatedAt: "2026-06-21T11:45:00Z",
    safetyAdvice: "This is a confirmed duplicate of issue_101. Votes and verifications have been merged to increase priority.",
    possibleRisks: ["Same as issue_101"]
  },
  {
    // REJECTED REPORT
    id: "issue_110",
    createdBy: "user_citizen_1",
    createdByName: "Arjun Mehta",
    createdByAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    title: "Complaint: neighbor's laundry is hanging on balcony",
    originalDescription: "My neighbor on flat 302 hanging dirty underwear on their balcony railing, which completely ruins the premium aesthetic of our high-rise luxury towers. It makes us look middle class. Collect it and fine them.",
    aiSummary: "Substantive municipal scope infringement. Complaint references private aesthetic dispute within a housing cooperative, falling completely outside public infrastructure, safety, or public-utility mandates.",
    category: "Environment & Safety",
    subcategory: "Urban Nuisance",
    severity: IssueSeverity.LOW,
    priorityScore: 5,
    aiConfidence: 0.97,
    location: { lat: 12.9102, lng: 77.6341, isApproximate: true },
    address: "Block B, Prestige Royal Vista Towers, Bellandur",
    landmark: "Near the tennis court view",
    evidence: [
      {
        url: "https://images.unsplash.com/photo-1520690214124-2405c861702f?auto=format&fit=crop&q=80&w=600",
        type: "image"
      }
    ],
    status: IssueStatus.REJECTED,
    assignedDepartment: "Regulatory & General Administration",
    verificationCount: 0,
    inaccurateCount: 16,
    followerCount: 1,
    createdAt: "2026-06-14T11:20:00Z",
    updatedAt: "2026-06-15T09:00:00Z",
    safetyAdvice: "Rejected by municipal moderators. Not a public civil infrastructure or safety issue.",
    possibleRisks: []
  },
  {
    // AWAITING COMMUNITY VERIFICATION (Only 1 confirmation, needs more to move out of NEW/UNCONFIRMED)
    id: "issue_111",
    createdBy: "user_citizen_3",
    createdByName: "Vikram Malhotra",
    createdByAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    title: "Damaged Pedestrian Crossing Markings Awaiting Paint",
    originalDescription: "The white zebra crossing stripes near the main medical diagnostics are completely faded. Cars drive right through without stopping. Pedestrians, especially the elderly going to the clinic, cannot cross safely.",
    aiSummary: "Visual signal failure on designated pedestrian corridor. White thermoplastic paint has lost ~88% contrast due to heavy vehicle friction, prompting driver lane-yielding failures and high pedestrian strike probabilities on arterial lines.",
    category: "Roads & Traffic",
    subcategory: "Damaged pedestrian crossing",
    severity: IssueSeverity.MEDIUM,
    priorityScore: 55,
    aiConfidence: 0.90,
    location: { lat: 12.9788, lng: 77.6401, isApproximate: false },
    address: "HAL 2nd Stage, near Prime Diagnostics Intersection",
    landmark: "Directly opposite City Pharmacy",
    evidence: [
      {
        url: "https://images.unsplash.com/photo-1505305976870-c0be1cd39939?auto=format&fit=crop&q=80&w=600",
        type: "image"
      }
    ],
    status: IssueStatus.NEW,
    assignedDepartment: "Public Works & Highways (PWD)",
    verificationCount: 1, // Only 1 verification, needs more to be 'Verified'!
    inaccurateCount: 0,
    followerCount: 3,
    createdAt: "2026-06-22T19:40:00Z",
    updatedAt: "2026-06-22T19:40:00Z",
    safetyAdvice: "Exercise caution. Do not assume vehicles will stop at faded zebra markings. Make eye contact with drivers prior to crossing.",
    possibleRisks: ["Vulnerable pedestrian impacts", "Rear-end vehicle shunts from unexpected stopping", "Confusing zebra transit zones for incoming drivers"]
  },
  {
    id: "issue_112",
    createdBy: "user_citizen_2",
    createdByName: "Priya Sharma",
    createdByAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    title: "Debris Stray Accumulation From Unregulated Construction",
    originalDescription: "A builder dumped three trucks of brick chunks, cement bags, and wet plaster right on the walking path. It has been sitting there for over a week forcing pedestrians to walk onto the busy traffic lane.",
    aiSummary: "Commercial illegal walkway occlusion. Builder plaster waste and stone rubble segment (~3 tons) blocking 100% of standard concrete pedestrian walkway width, violating road clearance safety bylaws.",
    category: "Roads & Traffic",
    subcategory: "Stray debris on road",
    severity: IssueSeverity.MEDIUM,
    priorityScore: 51,
    aiConfidence: 0.88,
    location: { lat: 12.9301, lng: 77.6188, isApproximate: false },
    address: "Block 4, Koramangala, Opposite Gilly's Pub Lane",
    landmark: "Adjacent to under construction building No. 402",
    evidence: [
      {
        url: "/assets/demo/garbage_preset.png",
        type: "image"
      }
    ],
    status: IssueStatus.VERIFIED,
    assignedDepartment: "Public Works & Highways (PWD)",
    verificationCount: 6,
    inaccurateCount: 0,
    followerCount: 11,
    createdAt: "2026-06-19T10:00:00Z",
    updatedAt: "2026-06-21T18:20:00Z",
    safetyAdvice: "Use opposite lanes. Be cautious of sharp plaster fragments which can shear tires.",
    possibleRisks: ["Forced pedestrian roadway encroachment", "Bicycle sliding on loose gravel", "Drainage intake blockage during rains"]
  }
];

export const SEEDED_INSIGHTS: CommunityInsight[] = [
  {
    id: "insight_1",
    title: "Subsurface Sewer Blockages in Zone 4",
    insight: "During the last 72 hours, there has been a 400% surge in 'Blocked drainage' and 'Open manhole' sewer overflows in the Haralur Road corridor. This correlates directly with unauthorized silt dumping by upstream private real-estate builders.",
    category: "Water & Sanitation",
    location: "Haralur Road Zone",
    confidence: 0.94,
    suggestedAction: "Initiate immediate BBMP visual inspect patrols and fine private developers within 1km. Deploy sludge-sucking vehicles to Lane 4 intersection pre-emptively.",
    timestamp: "2026-06-22T23:00:00Z"
  },
  {
    id: "insight_2",
    title: "Systemic Cable Conduit Failures on Outer Ring Road",
    insight: "Recurrent lamp blackouts reported between Metro Pillar 120 and 150. Historical ticket correlations indicate sub-standard armoring on high-voltage underground cables, which triggers short circuits immediately during rainfall oversaturation.",
    category: "Public Utilities",
    location: "Outer Ring Road (ORR)",
    confidence: 0.89,
    suggestedAction: "Conduct physical ground cable sleeve audits in dry season instead of superficial lamp replacements. Upgrade conduit sealing points.",
    timestamp: "2026-06-21T14:30:00Z"
  }
];
