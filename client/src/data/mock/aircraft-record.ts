export interface AircraftRecordDetails {
  deliveryDate: string;
  hoursLimit: number;
  cyclesLimit: number;
  hoursTrend: number;
  cyclesTrend: number;
  lastInspection: string;
  lastCheck: string;
  nextCheck: string;
  components: { name: string; remaining: number; detail: string }[];
  documents: { name: string; expires: string; status: "Valid" | "Expiring Soon" }[];
}

// Demonstration values, separate from the shared fleet totals.
const defaultDetails: AircraftRecordDetails = {
  deliveryDate: "Mar 15, 2018",
  hoursLimit: 36000,
  cyclesLimit: 30000,
  hoursTrend: 12,
  cyclesTrend: 8,
  lastInspection: "May 10, 2026",
  lastCheck: "C-Check",
  nextCheck: "A-Check",
  components: [
    { name: "Engine", remaining: 63, detail: "1,240 FH remaining" },
    { name: "Landing Gear", remaining: 42, detail: "320 cycles remaining" },
    { name: "APU", remaining: 39, detail: "580 FH remaining" },
    { name: "Fuel Pump", remaining: 56, detail: "400 FH remaining" },
  ],
  documents: [
    { name: "Airworthiness Certificate", expires: "Mar 15, 2028", status: "Valid" },
    { name: "Insurance Certificate", expires: "Dec 12, 2026", status: "Valid" },
    { name: "Maintenance Records", expires: "Nov 20, 2026", status: "Expiring Soon" },
    { name: "Registration Certificate", expires: "Mar 15, 2028", status: "Valid" },
  ],
};

export const aircraftRecordDetails: Record<string, AircraftRecordDetails> = {
  "RP-C9923": defaultDetails,
  "RP-C8841": {
    ...defaultDetails,
    deliveryDate: "Aug 22, 2019",
    hoursLimit: 24000,
    cyclesLimit: 20000,
    hoursTrend: 9,
    cyclesTrend: 11,
    lastInspection: "May 16, 2026",
    components: defaultDetails.components.map(component => ({
      ...component,
      remaining: component.remaining - 12,
    })),
  },
};

export function getAircraftRecordDetails(tail: string): AircraftRecordDetails {
  return aircraftRecordDetails[tail] ?? defaultDetails;
}
