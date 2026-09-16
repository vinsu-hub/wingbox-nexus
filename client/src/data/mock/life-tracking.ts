import { aircraft } from "@/data/aircraft";

export interface LifeComponent {
  id: string;
  tail: string;
  component: string;
  partNumber: string;
  serial: string;
  priority: "High" | "Med" | "Low";
  lifeUsedPct: number;
  remaining: string;
  status: "Healthy" | "Due Soon" | "Overdue";
  nextDue: string;
}

// Relative dates keep this demo's next-30-days window useful on every visit.
function dueDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const used = [92, 56, 96, 72, 102, 34, 61, 88, 99, 48, 67, 27];
export const lifeComponents: LifeComponent[] = aircraft.flatMap(
  (plane, index) =>
    ["Hours", "Cycles", "Days"].map((unit, unitIndex) => {
      const lifeUsedPct = used[(index + unitIndex * 3) % used.length];
      const limit = unit === "Hours" ? 5000 : unit === "Cycles" ? 12000 : 730;
      const balance = Math.round(limit * (1 - lifeUsedPct / 100));
      const days =
        lifeUsedPct >= 100
          ? -5
          : lifeUsedPct >= 90
            ? 5 + index
            : lifeUsedPct >= 80
              ? 22
              : 45 + index * 12;
      return {
        id: `life-${index + 1}-${unit.toLowerCase()}`,
        tail: plane.tail,
        component:
          unit === "Hours"
            ? ["Engine", "APU", "Hydraulic Pump", "Avionics"][index % 4]
            : unit === "Cycles"
              ? ["Landing Gear", "Wheel Assembly", "Brake System"][index % 3]
              : ["Emergency Battery", "Oxygen Cylinder", "Fire Extinguisher"][
                  index % 3
                ],
        partNumber: `${["ENG", "LG", "CAL"][unitIndex]}-${12000 + index * 137}-${unitIndex + 1}`,
        serial: `WB${26000 + index * 31 + unitIndex}`,
        priority:
          lifeUsedPct >= 90 ? "High" : lifeUsedPct >= 65 ? "Med" : "Low",
        lifeUsedPct,
        remaining: `${balance.toLocaleString("en-US")} ${unit === "Hours" ? "FH" : unit === "Cycles" ? "FC" : "days"}`,
        status:
          lifeUsedPct >= 100
            ? "Overdue"
            : lifeUsedPct >= 80
              ? "Due Soon"
              : "Healthy",
        nextDue: dueDate(days),
      };
    })
);
