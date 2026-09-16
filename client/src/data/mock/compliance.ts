import { aircraft } from "@/data/aircraft";

export interface Directive {
  id: string;
  adSbNumber: string;
  authority: string;
  issueDate: string;
  deadline: string;
  description: string;
  ammSection: string;
  affected: { tail: string; status: "Compliant" | "Due Soon" | "Overdue" | "N/A" }[];
}

// Demonstration records, not an authoritative regulatory or maintenance source.
const records = [
  ["AD 2021-12-05", "EASA", "2021-12-05", "2026-05-18", "Engine fuel pump inspection", "73-21-00", "A32", "Overdue"],
  ["AD 2022-07-14", "EASA", "2022-07-14", "2026-06-14", "Landing gear actuator inspection", "32-31-00", "A32", "Due Soon"],
  ["AD 2023-03-22", "FAA", "2023-03-22", "2026-08-22", "Oxygen generator replacement", "35-21-00", "", "Compliant"],
  ["SB A320-27-1234", "Airbus", "2024-02-12", "2026-05-12", "Cabin pressure system inspection", "21-31-00", "A320", "Overdue"],
  ["AD 2024-11-10", "EASA", "2024-11-10", "2026-09-10", "Hydraulic pump inspection", "29-11-00", "", "Compliant"],
  ["SB A321-48-5678", "Airbus", "2025-01-08", "2026-05-16", "Avionics software update", "31-31-00", "A321", "Overdue"],
  ["AD 2025-02-18", "FAA", "2025-02-18", "2026-06-18", "Wing structure inspection", "57-10-00", "B737", "Due Soon"],
  ["AD 2025-08-30", "EASA", "2025-08-30", "2026-05-15", "Fuel tank safety inspection", "28-11-00", "", "Overdue"],
  ["SB A320-56-7890", "Airbus", "2025-10-03", "2026-06-03", "Flight deck window inspection", "56-11-00", "A320", "Due Soon"],
  ["AD 2026-01-15", "EASA", "2026-01-15", "2026-08-15", "Navigation system verification", "34-10-00", "", "Compliant"],
  ["SB ATR-27-3344", "ATR", "2026-02-10", "2026-06-10", "Flight control inspection", "27-10-00", "ATR", "Due Soon"],
  ["AD 2026-04-12", "EASA", "2026-04-12", "2026-10-12", "Emergency exit inspection", "52-21-00", "", "Compliant"],
] as const;

export const directives: Directive[] = records.map((record, index) => {
  const [adSbNumber, authority, issueDate, deadline, title, ammSection, family, priority] = record;
  const applicable = aircraft.filter(item => item.type.startsWith(family));
  return {
    id: `directive-${index + 1}`,
    adSbNumber, authority, issueDate, deadline, ammSection,
    description: `${title}. Inspect the applicable assembly for wear, damage, and correct operation. Record findings and refer to AMM ${ammSection} for the inspection procedure.`,
    affected: aircraft.map(item => ({
      tail: item.tail,
      status: !item.type.startsWith(family) ? "N/A" : item.tail === applicable[index % applicable.length]?.tail ? priority : "Compliant",
    })),
  };
});
