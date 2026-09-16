import { aircraft } from "@/data/aircraft";

export interface Report {
  id: string;
  name: string;
  subtitle: string;
  type:
    | "Maintenance"
    | "Compliance"
    | "Fleet"
    | "Findings"
    | "Life Tracking"
    | "Damage/3D";
  tail: string | "All Aircraft";
  dateRangeLabel: string;
  status: "Completed" | "In Progress";
  generatedBy: string;
  generatedAt: string;
  downloads: number;
}

// Fixed demo snapshot, consistent with the fleet's May 2026 maintenance dates.
export const reportsSnapshot = new Date("2026-05-31T23:59:59Z");
const seeds: [
  string,
  string,
  Report["type"],
  number | null,
  string,
  string,
  number,
  boolean?,
][] = [
  [
    "Maintenance Summary Report",
    "Service bulletins and inspections",
    "Maintenance",
    0,
    "John Dela Cruz",
    "2026-05-31T10:24:00Z",
    24,
  ],
  [
    "Compliance Report",
    "ADs, SBs and regulatory status",
    "Compliance",
    5,
    "Maria Santos",
    "2026-05-29T15:15:00Z",
    18,
  ],
  [
    "Fleet Utilization Report",
    "Aircraft hours and cycles",
    "Fleet",
    null,
    "James Tan",
    "2026-05-27T11:42:00Z",
    21,
  ],
  [
    "Findings Report",
    "Open and closed findings",
    "Findings",
    0,
    "Sarah Lim",
    "2026-05-25T16:20:00Z",
    12,
  ],
  [
    "Component Life Tracking",
    "Remaining life and due dates",
    "Life Tracking",
    2,
    "Carlos Reyes",
    "2026-05-23T14:17:00Z",
    9,
  ],
  [
    "Damage Assessment Report",
    "3D models and damage logs",
    "Damage/3D",
    5,
    "Ana Garcia",
    "2026-05-20T09:33:00Z",
    8,
  ],
  [
    "Quarterly Fleet Performance",
    "Reliability and dispatch rate",
    "Fleet",
    null,
    "David Kim",
    "2026-05-18T13:12:00Z",
    16,
  ],
  [
    "Overdue Items Report",
    "Past due inspections and actions",
    "Compliance",
    null,
    "Lisa Torres",
    "2026-05-16T10:05:00Z",
    0,
    true,
  ],
  [
    "Inspection Workpack Summary",
    "Scheduled maintenance completion",
    "Maintenance",
    3,
    "John Dela Cruz",
    "2026-05-12T08:30:00Z",
    0,
    true,
  ],
  [
    "Monthly Maintenance Review",
    "Work orders and release to service",
    "Maintenance",
    1,
    "Carlos Reyes",
    "2026-04-30T09:20:00Z",
    17,
  ],
  [
    "Airworthiness Review",
    "Mandatory directive compliance",
    "Compliance",
    4,
    "Maria Santos",
    "2026-04-28T14:30:00Z",
    15,
  ],
  [
    "Fleet Hours Summary",
    "Monthly flight hours and cycles",
    "Fleet",
    null,
    "James Tan",
    "2026-04-25T10:00:00Z",
    19,
  ],
  [
    "Structural Findings Review",
    "Inspection observations and closure",
    "Findings",
    8,
    "Sarah Lim",
    "2026-04-21T11:15:00Z",
    7,
  ],
  [
    "Life Limited Parts Review",
    "Component life and replacement planning",
    "Life Tracking",
    11,
    "Carlos Reyes",
    "2026-04-15T13:45:00Z",
    6,
  ],
  [
    "Airframe Damage Register",
    "Recorded damage and repair references",
    "Damage/3D",
    6,
    "Ana Garcia",
    "2026-03-28T09:00:00Z",
    10,
  ],
  [
    "Maintenance Planning Report",
    "Upcoming scheduled inspections",
    "Maintenance",
    7,
    "John Dela Cruz",
    "2026-03-20T08:00:00Z",
    11,
  ],
];
export const reports: Report[] = seeds.map(
  (
    [
      name,
      subtitle,
      type,
      aircraftIndex,
      generatedBy,
      generatedAt,
      downloads,
      pending,
    ],
    index
  ) => {
    const date = new Date(generatedAt);
    const month = date.toLocaleDateString("en-US", {
      month: "short",
      timeZone: "UTC",
    });
    const lastDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
    ).getUTCDate();
    return {
      id: `RPT-${String(index + 1).padStart(3, "0")}`,
      name,
      subtitle,
      type,
      tail:
        aircraftIndex === null ? "All Aircraft" : aircraft[aircraftIndex].tail,
      dateRangeLabel: `${month} 1 – ${lastDay}, 2026`,
      status: pending ? "In Progress" : "Completed",
      generatedBy,
      generatedAt,
      downloads,
    };
  }
);
