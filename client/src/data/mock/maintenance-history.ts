import { aircraft } from "@/data/aircraft";

export type MaintenanceEventType = "Inspection" | "Repair" | "Compliance" | "Maintenance";
export type MaintenanceEventStatus = "Completed" | "Open";

export interface MaintenanceEvent {
  id: string;
  date: string;
  type: MaintenanceEventType;
  title: string;
  tail: string;
  aircraftType: string;
  checkType: string;
  inspector: string;
  status: MaintenanceEventStatus;
  timestamp: string;
}

export interface UpcomingMaintenanceEvent {
  id: string;
  date: string;
  title: string;
  type: MaintenanceEventType;
  tail: string;
  aircraftType: string;
  checkType: string;
  inspector: string;
}

const inspectors = ["John Dela Cruz", "Maria Santos", "Allan Reyes", "Jessica Lim", "Daniel Garcia", "Rafael Garcia", "Nina Mendoza", "Paolo Rivera"];
const eventTemplates: { type: MaintenanceEventType; title: string; checkType: string }[] = [
  { type: "Inspection", title: "Routine A-Check", checkType: "A-Check" },
  { type: "Inspection", title: "Engine Inspection", checkType: "C-Check" },
  { type: "Repair", title: "Hydraulic Pump Replacement", checkType: "B-Check" },
  { type: "Compliance", title: "AD Compliance Check", checkType: "AD Review" },
  { type: "Inspection", title: "Landing Gear Inspection", checkType: "C-Check" },
  { type: "Maintenance", title: "Avionics Software Update", checkType: "Line Maintenance" },
  { type: "Inspection", title: "Fuel System Check", checkType: "A-Check" },
  { type: "Maintenance", title: "APU Maintenance", checkType: "Scheduled Service" },
  { type: "Compliance", title: "SB Compliance Update", checkType: "SB Review" },
  { type: "Repair", title: "Brake Assembly Repair", checkType: "A-Check" },
  { type: "Maintenance", title: "Cabin Systems Service", checkType: "Line Maintenance" },
  { type: "Inspection", title: "Airframe Walkaround", checkType: "B-Check" },
];

// Fixed demo dates keep filtering and exports reproducible across sessions.
export const maintenanceHistory: MaintenanceEvent[] = Array.from({ length: 248 }, (_, index) => {
  const plane = aircraft[(index * 7 + Math.floor(index / 12)) % aircraft.length];
  const template = eventTemplates[index % eventTemplates.length];
  const time = new Date(Date.UTC(2026, 8, 28 - Math.floor(index / 3), 14 - (index % 9), (index * 17) % 60));
  const timestamp = time.toISOString();
  return {
    id: `MH-${String(index + 1).padStart(4, "0")}`,
    date: timestamp.slice(0, 10),
    type: template.type,
    title: template.title,
    tail: plane.tail,
    aircraftType: plane.type,
    checkType: template.checkType,
    inspector: inspectors[(index * 3 + Math.floor(index / 8)) % inspectors.length],
    status: (index % 13 === 3 || index % 17 === 5 ? "Open" : "Completed") as MaintenanceEventStatus,
    timestamp,
  };
}).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

export const upcomingMaintenanceEvents: UpcomingMaintenanceEvent[] = [
  { id: "UP-001", date: "2026-10-02", title: "A-Check", type: "Inspection", tail: "RP-C9923", aircraftType: "A320-214", checkType: "A-Check", inspector: "John Dela Cruz" },
  { id: "UP-002", date: "2026-10-06", title: "Compliance Check", type: "Compliance", tail: "RP-C7712", aircraftType: "A321-231", checkType: "AD Review", inspector: "Jessica Lim" },
  { id: "UP-003", date: "2026-10-10", title: "Engine Inspection", type: "Inspection", tail: "RP-C5517", aircraftType: "B737-800", checkType: "C-Check", inspector: "Maria Santos" },
  { id: "UP-004", date: "2026-10-18", title: "B-Check", type: "Inspection", tail: "RP-C0001", aircraftType: "A330-300", checkType: "B-Check", inspector: "Daniel Garcia" },
  { id: "UP-005", date: "2026-10-24", title: "APU Service", type: "Maintenance", tail: "RP-C8841", aircraftType: "ATR 72-600", checkType: "Scheduled Service", inspector: "Nina Mendoza" },
];
