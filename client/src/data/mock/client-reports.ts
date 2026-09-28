export interface ClientReport {
  id: string;
  name: string;
  client: string;
  tail: string;
  type: "Maintenance" | "Compliance" | "Fleet Operations" | "Inspection";
  sharedAt: string;
  status: "Viewed" | "Not Viewed";
  summary: string;
  sharedBy: string;
}

export const clientReports: ClientReport[] = [
  { id: "CR-1042", name: "May Fleet Health Summary", client: "Skyline Air", tail: "RP-C9923", type: "Fleet Operations", sharedAt: "May 24, 2026", status: "Viewed", summary: "Monthly utilization, open items, and fleet readiness for RP-C9923.", sharedBy: "Maya Reyes" },
  { id: "CR-1041", name: "A320 Compliance Digest", client: "Skyline Air", tail: "RP-C9912", type: "Compliance", sharedAt: "May 23, 2026", status: "Not Viewed", summary: "Applicability and due status of tracked compliance items for RP-C9912.", sharedBy: "Daniel Cruz" },
  { id: "CR-1039", name: "Scheduled Maintenance Review", client: "Skyline Air", tail: "RP-C7712", type: "Maintenance", sharedAt: "May 21, 2026", status: "Viewed", summary: "Completed and upcoming maintenance events for RP-C7712.", sharedBy: "Maya Reyes" },
  { id: "CR-1038", name: "Aircraft Inspection Readout", client: "Island Wings", tail: "RP-C8841", type: "Inspection", sharedAt: "May 20, 2026", status: "Not Viewed", summary: "Inspection overview and finding disposition for RP-C8841.", sharedBy: "Ana Garcia" },
  { id: "CR-1036", name: "Life Limited Components", client: "Pacific Horizon", tail: "RP-C6631", type: "Maintenance", sharedAt: "May 18, 2026", status: "Viewed", summary: "Current component life positions and near-term planning items for RP-C6631.", sharedBy: "Daniel Cruz" },
  { id: "CR-1034", name: "April Operations Summary", client: "Skyline Air", tail: "RP-C4489", type: "Fleet Operations", sharedAt: "May 16, 2026", status: "Viewed", summary: "April utilization and operational highlights for RP-C4489.", sharedBy: "Maya Reyes" },
  { id: "CR-1032", name: "B737 Compliance Snapshot", client: "Island Wings", tail: "RP-C5517", type: "Compliance", sharedAt: "May 14, 2026", status: "Viewed", summary: "Open and completed compliance items for RP-C5517.", sharedBy: "Daniel Cruz" },
  { id: "CR-1029", name: "A321 Maintenance Summary", client: "Skyline Air", tail: "RP-C1187", type: "Maintenance", sharedAt: "May 12, 2026", status: "Not Viewed", summary: "Recent maintenance activity and the upcoming work outlook for RP-C1187.", sharedBy: "Ana Garcia" },
  { id: "CR-1027", name: "Fleet Readiness Brief", client: "Pacific Horizon", tail: "RP-C2290", type: "Fleet Operations", sharedAt: "May 09, 2026", status: "Viewed", summary: "Readiness indicators and inspection status for RP-C2290.", sharedBy: "Maya Reyes" },
];
