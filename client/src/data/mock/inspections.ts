import { aircraft } from "@/data/aircraft";

export interface Inspection {
  id: string;
  tail: string;
  checkType: string;
  inspector: string;
  scheduledDate: string;
  status: "Scheduled" | "In Progress" | "Completed" | "Overdue";
  /** Fraction of checklist items completed, from 0 to 1. */
  progress: number;
}

// A stable demo snapshot aligned with the fleet's May 2026 maintenance data.
export const inspectionAsOf = "2026-05-18";
const checks = [
  "A Check",
  "C Check",
  "Landing Gear Check",
  "Engine Inspection",
  "Hydraulic System Check",
  "Avionics Inspection",
  "Fuel Tank Inspection",
  "B Check",
  "APU Inspection",
  "Wheel Assembly Check",
  "Daily Check",
  "Cabin Inspection",
];
const inspectors = [
  "John Dela Cruz",
  "Maria Santos",
  "Alex Lim",
  "Rafael Cruz",
  "Jessa Mariano",
  "Earl Lopez",
];
const statuses: Inspection["status"][] = [
  "Scheduled",
  "In Progress",
  "Completed",
  "Completed",
  "Overdue",
  "Completed",
  "In Progress",
  "Completed",
  "Scheduled",
  "Scheduled",
  "Scheduled",
  "Scheduled",
];
const days = [18, 16, 15, 13, 14, 12, 10, 8, 20, 22, 28, 30];

export const inspections: Inspection[] = aircraft.map((plane, index) => ({
  id: `INS-2026-${String(index + 1).padStart(3, "0")}`,
  tail: plane.tail,
  checkType: checks[index % checks.length],
  inspector: inspectors[index % inspectors.length],
  scheduledDate: `2026-05-${String(days[index % days.length]).padStart(2, "0")}`,
  status: statuses[index % statuses.length],
  progress:
    statuses[index % statuses.length] === "Completed"
      ? 1
      : statuses[index % statuses.length] === "In Progress"
        ? index === 1
          ? 0.4
          : 0.6
        : 0,
}));
