export interface Presentation {
  id: string;
  title: string;
  subtitle: string;
  type: "Maintenance" | "Compliance" | "Operational" | "Findings" | "Finance";
  tail: string | "All Aircraft";
  createdBy: string;
  lastModifiedAt: string;
  views: number;
  linksToInspectionPresentation?: boolean;
}

export const presentations: Presentation[] = [
  { id: "PRE-024", title: "A320 - 6 Month Inspection Summary", subtitle: "Inspection findings and maintenance outlook", type: "Maintenance", tail: "RP-C9923", createdBy: "Maria Santos", lastModifiedAt: "2026-05-30T14:20:00Z", views: 30, linksToInspectionPresentation: true },
  { id: "PRE-023", title: "Fleet Compliance Review", subtitle: "May 2026 regulatory compliance status", type: "Compliance", tail: "All Aircraft", createdBy: "James Rivera", lastModifiedAt: "2026-05-29T10:10:00Z", views: 21 },
  { id: "PRE-022", title: "ATR 72 Reliability Briefing", subtitle: "Q2 operational performance update", type: "Operational", tail: "RP-C8841", createdBy: "Angela Cruz", lastModifiedAt: "2026-05-27T08:45:00Z", views: 17 },
  { id: "PRE-021", title: "B737 Findings Review", subtitle: "Recurring cabin and structural findings", type: "Findings", tail: "RP-C5517", createdBy: "Maria Santos", lastModifiedAt: "2026-05-25T16:30:00Z", views: 12 },
  { id: "PRE-020", title: "Maintenance Cost Outlook", subtitle: "June forecast and budget allocation", type: "Finance", tail: "All Aircraft", createdBy: "Daniel Lim", lastModifiedAt: "2026-05-22T12:00:00Z", views: 16 },
  { id: "PRE-019", title: "A321 Engine Health Update", subtitle: "Powerplant trend monitoring", type: "Maintenance", tail: "RP-C7712", createdBy: "James Rivera", lastModifiedAt: "2026-05-19T09:35:00Z", views: 13 },
  { id: "PRE-018", title: "April Operations Brief", subtitle: "Fleet utilization and dispatch reliability", type: "Operational", tail: "All Aircraft", createdBy: "Angela Cruz", lastModifiedAt: "2026-05-15T11:15:00Z", views: 15 },
  { id: "PRE-017", title: "A320 Findings Closeout", subtitle: "Corrective action progress review", type: "Findings", tail: "RP-C6631", createdBy: "Maria Santos", lastModifiedAt: "2026-05-08T15:40:00Z", views: 11 },
  { id: "PRE-016", title: "Maintenance Review Template", subtitle: "Standard six-month maintenance narrative", type: "Maintenance", tail: "RP-C4489", createdBy: "Daniel Lim", lastModifiedAt: "2026-04-28T08:00:00Z", views: 5 },
  { id: "PRE-015", title: "Compliance Update Template", subtitle: "Regulatory status presentation starter", type: "Compliance", tail: "All Aircraft", createdBy: "James Rivera", lastModifiedAt: "2026-04-24T13:20:00Z", views: 5 },
  { id: "PRE-014", title: "Operations Brief Template", subtitle: "Fleet utilization executive overview", type: "Operational", tail: "RP-C3375", createdBy: "Angela Cruz", lastModifiedAt: "2026-04-18T09:10:00Z", views: 4 },
  { id: "PRE-013", title: "Findings Review Template", subtitle: "Open finding and risk-summary format", type: "Findings", tail: "RP-C2290", createdBy: "Maria Santos", lastModifiedAt: "2026-04-12T10:25:00Z", views: 4 },
  { id: "PRE-012", title: "Finance Review Template", subtitle: "Maintenance spend and forecast format", type: "Finance", tail: "All Aircraft", createdBy: "Daniel Lim", lastModifiedAt: "2026-04-05T14:00:00Z", views: 4 },
  { id: "PRE-011", title: "A321 Maintenance Template", subtitle: "Scheduled maintenance planning deck", type: "Maintenance", tail: "RP-C1187", createdBy: "James Rivera", lastModifiedAt: "2026-03-29T12:10:00Z", views: 4 },
  { id: "PRE-010", title: "Compliance Audit Template", subtitle: "Internal audit presentation starter", type: "Compliance", tail: "All Aircraft", createdBy: "Angela Cruz", lastModifiedAt: "2026-03-21T08:40:00Z", views: 3 },
  { id: "PRE-009", title: "Flight Operations Template", subtitle: "Monthly operational review format", type: "Operational", tail: "RP-C0065", createdBy: "Maria Santos", lastModifiedAt: "2026-03-14T16:50:00Z", views: 3 },
  { id: "PRE-008", title: "Finding Closeout Template", subtitle: "Corrective-action decision deck", type: "Findings", tail: "RP-C0001", createdBy: "Daniel Lim", lastModifiedAt: "2026-03-08T11:30:00Z", views: 3 },
  { id: "PRE-007", title: "Cost Forecast Template", subtitle: "Quarterly maintenance finance format", type: "Finance", tail: "All Aircraft", createdBy: "James Rivera", lastModifiedAt: "2026-02-26T13:00:00Z", views: 3 },
  { id: "PRE-006", title: "A320 Check Planning Template", subtitle: "Scheduled work package overview", type: "Maintenance", tail: "RP-C9912", createdBy: "Angela Cruz", lastModifiedAt: "2026-02-17T10:30:00Z", views: 3 },
  { id: "PRE-005", title: "Fleet Compliance Baseline Template", subtitle: "Annual regulatory readiness review", type: "Compliance", tail: "All Aircraft", createdBy: "Maria Santos", lastModifiedAt: "2026-02-08T15:05:00Z", views: 2 },
  { id: "PRE-004", title: "ATR Dispatch Reliability", subtitle: "Reliability improvement opportunities", type: "Operational", tail: "RP-C8841", createdBy: "Daniel Lim", lastModifiedAt: "2026-01-30T09:00:00Z", views: 2 },
  { id: "PRE-003", title: "Cabin Findings Summary", subtitle: "Cabin condition and corrective actions", type: "Findings", tail: "RP-C5517", createdBy: "James Rivera", lastModifiedAt: "2026-01-20T14:25:00Z", views: 2 },
  { id: "PRE-002", title: "Year-End Maintenance Spend", subtitle: "2025 spend review and variance analysis", type: "Finance", tail: "All Aircraft", createdBy: "Angela Cruz", lastModifiedAt: "2026-01-12T11:10:00Z", views: 2 },
  { id: "PRE-001", title: "Fleet Readiness Overview", subtitle: "Executive fleet availability summary", type: "Operational", tail: "All Aircraft", createdBy: "Maria Santos", lastModifiedAt: "2025-12-22T08:30:00Z", views: 2 },
];
