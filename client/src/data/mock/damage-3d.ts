export interface DamageFinding {
  id: string;
  /** Real GLTF node name from the ingested engine kit — anchors the 3D hotspot. */
  partName: string;
  number: number;
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

export const damage3dMeta = {
  inspectionId: "INS-2026-00421",
  tail: "RP-C8841",
  checkType: "C-Check / Engine Borescope",
  date: "May 18, 2026",
  inspector: "Elena Santos",
  componentLabel: "PW127M · Engine No. 2",
};

export const damageFindings: DamageFinding[] = [
  {
    id: "D-01",
    partName: "MainFan",
    number: 1,
    title: "Fan blade leading-edge nick",
    location: "Engine No. 2 · Main fan, blade root",
    ataSection: "ATA 72-30-00",
    severity: "High",
    description: "A small leading-edge nick is present on one main fan blade, within the intake-facing zone visible on borescope.",
    correctiveAction: "Blend per SRM limits; re-inspect at next scheduled borescope to confirm no propagation.",
    status: "Open",
    createdAt: "May 18, 2026 · 09:52",
    createdBy: "Elena Santos, QA Inspector",
    references: [
      { label: "AMM 72-30-00", detail: "Fan blade inspection limits" },
      { label: "SRM 51-70-02", detail: "Blade blend repair procedure" },
    ],
  },
  {
    id: "D-02",
    partName: "BigCover1",
    number: 2,
    title: "Cowl panel coating erosion",
    location: "Engine No. 2 · Fan cowl, upper panel",
    ataSection: "ATA 71-11-00",
    severity: "Medium",
    description: "Localized protective-coating erosion on the upper fan cowl panel, consistent with normal service exposure.",
    correctiveAction: "Restore protective coating at next planned maintenance input.",
    status: "Open",
    createdAt: "May 18, 2026 · 10:07",
    createdBy: "Elena Santos, QA Inspector",
    references: [{ label: "AMM 71-11-00", detail: "Fan cowl coating restoration" }],
  },
  {
    id: "D-03",
    partName: "Cover2",
    number: 3,
    title: "Access panel fastener wear",
    location: "Engine No. 2 · Lower access panel",
    ataSection: "ATA 71-13-00",
    severity: "Low",
    description: "Minor thread wear noted on two access-panel fasteners. No looseness or missing hardware observed.",
    correctiveAction: "Monitor at next scheduled inspection; replacement not currently required.",
    status: "Closed",
    createdAt: "May 18, 2026 · 10:21",
    createdBy: "Elena Santos, QA Inspector",
    references: [{ label: "MPD 71-13-01", detail: "Scheduled condition check" }],
  },
  {
    id: "D-04",
    partName: "BackCover",
    number: 4,
    title: "Exhaust-facing heat discoloration",
    location: "Engine No. 2 · Aft cover",
    ataSection: "ATA 78-00-00",
    severity: "Medium",
    description: "Heat discoloration visible on the aft cover near the exhaust-facing surface. No distortion or cracking observed.",
    correctiveAction: "Compare against baseline photos at next inspection to confirm the discoloration is not progressing.",
    status: "Open",
    createdAt: "May 18, 2026 · 10:35",
    createdBy: "Elena Santos, QA Inspector",
    references: [{ label: "AMM 78-00-00", detail: "Exhaust area visual inspection" }],
  },
];
