export interface Aircraft {
  tail: string;
  type: string;
  client: string;
  hours: string;
  cycles: string;
  next: string;
  date: string;
  compliance: number;
  status: "Active" | "In Inspection" | "Attention";
  dot: "green" | "amber" | "red";
}

export const aircraft: Aircraft[] = [
  { tail: "RP-C9923", type: "A320-214", client: "Skyline Air", hours: "12,482.6", cycles: "8,921", next: "42 FH", date: "May 28, 2026", compliance: 98.7, status: "Active", dot: "green" },
  { tail: "RP-C9912", type: "A320-214", client: "Skyline Air", hours: "11,230.4", cycles: "7,842", next: "87 FH", date: "Jun 14, 2026", compliance: 97.9, status: "Active", dot: "green" },
  { tail: "RP-C8841", type: "ATR 72-600", client: "Island Wings", hours: "8,214.7", cycles: "6,102", next: "12 FH", date: "May 22, 2026", compliance: 94.2, status: "In Inspection", dot: "amber" },
  { tail: "RP-C7712", type: "A321-231", client: "Skyline Air", hours: "13,502.9", cycles: "9,421", next: "76 FH", date: "Jun 02, 2026", compliance: 96.8, status: "Active", dot: "green" },
  { tail: "RP-C6631", type: "A320-214", client: "Pacific Horizon", hours: "14,221.3", cycles: "10,832", next: "5 FH", date: "May 20, 2026", compliance: 91.6, status: "Attention", dot: "red" },
  { tail: "RP-C5517", type: "B737-800", client: "Island Wings", hours: "9,842.1", cycles: "7,441", next: "63 FH", date: "Jun 10, 2026", compliance: 98.9, status: "Active", dot: "green" },
  { tail: "RP-C4489", type: "A320-200", client: "Skyline Air", hours: "10,556.8", cycles: "8,120", next: "54 FH", date: "Jun 21, 2026", compliance: 97.3, status: "Active", dot: "green" },
  { tail: "RP-C3375", type: "ATR 72-600", client: "Island Wings", hours: "7,221.4", cycles: "5,842", next: "41 FH", date: "May 30, 2026", compliance: 95.7, status: "Active", dot: "green" },
  { tail: "RP-C2290", type: "B737-900", client: "Pacific Horizon", hours: "15,332.7", cycles: "11,984", next: "28 FH", date: "May 27, 2026", compliance: 92.8, status: "In Inspection", dot: "amber" },
  { tail: "RP-C1187", type: "A321-231", client: "Skyline Air", hours: "6,883.2", cycles: "5,210", next: "72 FH", date: "Jun 18, 2026", compliance: 98.1, status: "Active", dot: "green" },
  { tail: "RP-C0065", type: "A320-214", client: "New Horizons", hours: "12,114.9", cycles: "9,002", next: "38 FH", date: "May 24, 2026", compliance: 96.4, status: "Active", dot: "green" },
  { tail: "RP-C0001", type: "A330-300", client: "Skyline Air", hours: "16,742.6", cycles: "12,883", next: "96 FH", date: "Jun 19, 2026", compliance: 94.7, status: "Active", dot: "green" },
];

export function getAircraftByTail(tail: string | undefined): Aircraft | undefined {
  return aircraft.find(a => a.tail === tail);
}

export const fleetSummary = {
  total: aircraft.length,
  active: aircraft.filter(a => a.status === "Active").length,
  inInspection: aircraft.filter(a => a.status === "In Inspection").length,
  attention: aircraft.filter(a => a.status === "Attention").length,
};
