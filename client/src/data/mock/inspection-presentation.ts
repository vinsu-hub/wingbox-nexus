export interface Finding {
  id: string;
  title: string;
  location: string;
  ataSection: string;
  severity: "Low" | "Medium" | "High";
  description: string;
  correctiveAction: string;
  status: "Open" | "Closed";
  createdAt: string;
  createdBy: string;
  references: { label: string; detail: string }[];
}

export const inspectionMeta = {
  inspectionId: "INS-2026-00421",
  tail: "RP-C8841",
  checkType: "C-Check / Engine Borescope",
  date: "May 18, 2026",
  inspector: "Elena Santos",
  componentLabel: "PW127M · Engine No. 2",
};

export const findings: Finding[] = [
  { id: "F-01", title: "Minor nacelle fastener corrosion", location: "Engine No. 2 · Fan cowl lower seam", ataSection: "ATA 71-11-00", severity: "High", description: "Surface corrosion is present on two lower fan-cowl fasteners. The surrounding structure remains free from corrosion.", correctiveAction: "Replace affected fasteners before return to service and apply corrosion-inhibiting compound.", status: "Open", createdAt: "May 18, 2026 · 09:18", createdBy: "Elena Santos, QA Inspector", references: [{ label: "AMM 71-11-00", detail: "Fan cowl fastener replacement" }, { label: "SRM 51-70-01", detail: "Corrosion treatment limits" }] },
  { id: "F-02", title: "Leading edge erosion", location: "Engine No. 2 · Inlet guide vane", ataSection: "ATA 72-00-00", severity: "Medium", description: "Localized coating erosion is visible along the lower leading edge of the inlet guide vane. No cracking or material loss is observed in the inspected area.", correctiveAction: "Blend within allowable limits and restore protective coating at the next planned maintenance input.", status: "Open", createdAt: "May 18, 2026 · 10:42", createdBy: "Elena Santos, QA Inspector", references: [{ label: "AMM 72-00-00", detail: "Engine inspection limits" }, { label: "SB PW127-72-184", detail: "IGV coating restoration" }, { label: "AD 2024-08-11", detail: "Recurring borescope review" }] },
  { id: "F-03", title: "Drain mast seal condition", location: "Engine No. 2 · Nacelle drain mast", ataSection: "ATA 71-13-00", severity: "Low", description: "Drain mast seal is intact with slight weathering consistent with service exposure. No leakage was found during the inspection.", correctiveAction: "Monitor at the next scheduled inspection; replacement is not currently required.", status: "Closed", createdAt: "May 18, 2026 · 11:06", createdBy: "Elena Santos, QA Inspector", references: [{ label: "AMM 71-13-00", detail: "Drain mast visual inspection" }, { label: "MPD 71-13-01", detail: "Scheduled condition check" }] },
];
