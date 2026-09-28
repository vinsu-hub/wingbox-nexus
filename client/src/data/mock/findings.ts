import type { DamageFinding } from "./damage-3d";

/** Fleet-wide demonstration records, separate from the 3D hotspot findings. */
export interface FleetFinding extends DamageFinding {
  tail: string;
  inspectionId: string;
  checkType: string;
  ataChapter: string;
}

export const findings: FleetFinding[] = [
  {
    "id": "F-2026-0001",
    "number": 1,
    "tail": "RP-C9923",
    "inspectionId": "INS-2026-00410",
    "checkType": "C-Check",
    "partName": "Brake assembly",
    "title": "Brake wear indicator near limit",
    "location": "Left main landing gear",
    "ataSection": "ATA 32-41-00",
    "ataChapter": "32",
    "severity": "High",
    "status": "Open",
    "description": "Wear indicator approaches the maintenance threshold on the outboard brake.",
    "correctiveAction": "Measure brake wear and replace the assembly if outside approved limits.",
    "createdAt": "May 18, 2026 \u00b7 09:15",
    "createdBy": "Elena Santos, QA Inspector",
    "references": [
      {
        "label": "AMM 32-41-00",
        "detail": "Brake assembly inspection and maintenance procedures"
      }
    ]
  },
  {
    "id": "F-2026-0002",
    "number": 2,
    "tail": "RP-C9912",
    "inspectionId": "INS-2026-00411",
    "checkType": "Line inspection",
    "partName": "Flap track",
    "title": "Flap track lubricant contamination",
    "location": "Right wing, flap track 2",
    "ataSection": "ATA 27-50-00",
    "ataChapter": "27",
    "severity": "Medium",
    "status": "Open",
    "description": "Contaminated grease and accumulated debris found around the track roller.",
    "correctiveAction": "Clean and lubricate the track; verify roller movement during operational check.",
    "createdAt": "May 19, 2026 \u00b7 10:15",
    "createdBy": "Miguel Reyes, Maintenance Inspector",
    "references": [
      {
        "label": "AMM 27-50-00",
        "detail": "Flap track inspection and maintenance procedures"
      }
    ]
  },
  {
    "id": "F-2026-0003",
    "number": 3,
    "tail": "RP-C8841",
    "inspectionId": "INS-2026-00412",
    "checkType": "Delivery inspection",
    "partName": "Compressor",
    "title": "Compressor blade surface pitting",
    "location": "Engine No. 1, compressor section",
    "ataSection": "ATA 72-30-00",
    "ataChapter": "72",
    "severity": "High",
    "status": "Open",
    "description": "Borescope inspection identified localized surface pitting on two compressor blades.",
    "correctiveAction": "Record dimensions and obtain engineering disposition before return to service.",
    "createdAt": "May 20, 2026 \u00b7 11:15",
    "createdBy": "Anna Cruz, Technical Inspector",
    "references": [
      {
        "label": "AMM 72-30-00",
        "detail": "Compressor inspection and maintenance procedures"
      }
    ]
  },
  {
    "id": "F-2026-0004",
    "number": 4,
    "tail": "RP-C7712",
    "inspectionId": "INS-2026-00413",
    "checkType": "C-Check",
    "partName": "Cabin seat",
    "title": "Seat armrest trim loose",
    "location": "Cabin row 14, seat C",
    "ataSection": "ATA 25-20-00",
    "ataChapter": "25",
    "severity": "Low",
    "status": "Closed",
    "description": "Armrest trim was loose with one retaining clip displaced.",
    "correctiveAction": "Retaining clip replaced and trim security verified.",
    "createdAt": "May 21, 2026 \u00b7 12:15",
    "createdBy": "Elena Santos, QA Inspector",
    "references": [
      {
        "label": "AMM 25-20-00",
        "detail": "Cabin seat inspection and maintenance procedures"
      }
    ]
  },
  {
    "id": "F-2026-0005",
    "number": 5,
    "tail": "RP-C6631",
    "inspectionId": "INS-2026-00414",
    "checkType": "Line inspection",
    "partName": "Hydraulic line",
    "title": "Hydraulic line seepage",
    "location": "Main gear bay, pressure manifold",
    "ataSection": "ATA 29-10-00",
    "ataChapter": "29",
    "severity": "High",
    "status": "Open",
    "description": "Fluid residue and fresh seepage observed at a pressure-line union.",
    "correctiveAction": "Inspect seal and union, rectify leakage and perform pressure test.",
    "createdAt": "May 22, 2026 \u00b7 13:15",
    "createdBy": "Miguel Reyes, Maintenance Inspector",
    "references": [
      {
        "label": "AMM 29-10-00",
        "detail": "Hydraulic line inspection and maintenance procedures"
      }
    ]
  },
  {
    "id": "F-2026-0006",
    "number": 6,
    "tail": "RP-C5517",
    "inspectionId": "INS-2026-00415",
    "checkType": "Delivery inspection",
    "partName": "Fuselage skin",
    "title": "Paint blistering at skin joint",
    "location": "Lower fuselage, frame 42",
    "ataSection": "ATA 53-30-00",
    "ataChapter": "53",
    "severity": "Medium",
    "status": "Open",
    "description": "Localized paint blistering noted adjacent to a longitudinal skin joint.",
    "correctiveAction": "Remove affected coating, inspect for corrosion and restore protection.",
    "createdAt": "May 23, 2026 \u00b7 14:15",
    "createdBy": "Anna Cruz, Technical Inspector",
    "references": [
      {
        "label": "AMM 53-30-00",
        "detail": "Fuselage skin inspection and maintenance procedures"
      }
    ]
  },
  {
    "id": "F-2026-0007",
    "number": 7,
    "tail": "RP-C4489",
    "inspectionId": "INS-2026-00416",
    "checkType": "C-Check",
    "partName": "Generator connector",
    "title": "Connector locking tab damaged",
    "location": "Engine No. 2, generator harness",
    "ataSection": "ATA 24-20-00",
    "ataChapter": "24",
    "severity": "Medium",
    "status": "Closed",
    "description": "Generator connector locking tab was damaged; connector remained seated.",
    "correctiveAction": "Connector housing replaced and electrical continuity verified.",
    "createdAt": "May 24, 2026 \u00b7 15:15",
    "createdBy": "Elena Santos, QA Inspector",
    "references": [
      {
        "label": "AMM 24-20-00",
        "detail": "Generator connector inspection and maintenance procedures"
      }
    ]
  },
  {
    "id": "F-2026-0008",
    "number": 8,
    "tail": "RP-C3375",
    "inspectionId": "INS-2026-00417",
    "checkType": "Line inspection",
    "partName": "Deicing boot",
    "title": "Deicing boot edge separation",
    "location": "Left wing leading edge",
    "ataSection": "ATA 30-10-00",
    "ataChapter": "30",
    "severity": "High",
    "status": "Open",
    "description": "A short section of boot edge has separated from the wing surface.",
    "correctiveAction": "Assess separation extent and repair per approved maintenance data.",
    "createdAt": "May 25, 2026 \u00b7 09:15",
    "createdBy": "Miguel Reyes, Maintenance Inspector",
    "references": [
      {
        "label": "AMM 30-10-00",
        "detail": "Deicing boot inspection and maintenance procedures"
      }
    ]
  },
  {
    "id": "F-2026-0009",
    "number": 9,
    "tail": "RP-C2290",
    "inspectionId": "INS-2026-00418",
    "checkType": "Delivery inspection",
    "partName": "Door seal",
    "title": "Entry door seal abrasion",
    "location": "Forward passenger door",
    "ataSection": "ATA 52-10-00",
    "ataChapter": "52",
    "severity": "Medium",
    "status": "Open",
    "description": "Seal abrasion noted along the lower door sill with no visible tearing.",
    "correctiveAction": "Inspect sealing surfaces and replace seal if beyond wear limits.",
    "createdAt": "May 26, 2026 \u00b7 10:15",
    "createdBy": "Anna Cruz, Technical Inspector",
    "references": [
      {
        "label": "AMM 52-10-00",
        "detail": "Door seal inspection and maintenance procedures"
      }
    ]
  },
  {
    "id": "F-2026-0010",
    "number": 10,
    "tail": "RP-C1187",
    "inspectionId": "INS-2026-00419",
    "checkType": "C-Check",
    "partName": "Navigation light",
    "title": "Navigation light lens clouding",
    "location": "Right wingtip",
    "ataSection": "ATA 33-40-00",
    "ataChapter": "33",
    "severity": "Low",
    "status": "Closed",
    "description": "Clouding of the navigation light lens reduced clarity.",
    "correctiveAction": "Lens replaced and navigation light function verified.",
    "createdAt": "May 27, 2026 \u00b7 11:15",
    "createdBy": "Elena Santos, QA Inspector",
    "references": [
      {
        "label": "AMM 33-40-00",
        "detail": "Navigation light inspection and maintenance procedures"
      }
    ]
  },
  {
    "id": "F-2026-0011",
    "number": 11,
    "tail": "RP-C0065",
    "inspectionId": "INS-2026-00420",
    "checkType": "Line inspection",
    "partName": "Bleed duct",
    "title": "Bleed duct insulation damage",
    "location": "Engine No. 1, pylon duct",
    "ataSection": "ATA 36-10-00",
    "ataChapter": "36",
    "severity": "High",
    "status": "Open",
    "description": "Insulation blanket shows fraying and a small exposed duct section.",
    "correctiveAction": "Replace insulation blanket and inspect adjacent hardware for heat damage.",
    "createdAt": "May 18, 2026 \u00b7 12:15",
    "createdBy": "Miguel Reyes, Maintenance Inspector",
    "references": [
      {
        "label": "AMM 36-10-00",
        "detail": "Bleed duct inspection and maintenance procedures"
      }
    ]
  },
  {
    "id": "F-2026-0012",
    "number": 12,
    "tail": "RP-C0001",
    "inspectionId": "INS-2026-00421",
    "checkType": "Delivery inspection",
    "partName": "Water line",
    "title": "Potable water coupling leak",
    "location": "Aft galley service compartment",
    "ataSection": "ATA 38-10-00",
    "ataChapter": "38",
    "severity": "Medium",
    "status": "Closed",
    "description": "Moisture was observed around the potable water coupling during servicing.",
    "correctiveAction": "Coupling seal replaced and leak check completed.",
    "createdAt": "May 19, 2026 \u00b7 13:15",
    "createdBy": "Anna Cruz, Technical Inspector",
    "references": [
      {
        "label": "AMM 38-10-00",
        "detail": "Water line inspection and maintenance procedures"
      }
    ]
  },
  {
    "id": "F-2026-0013",
    "number": 13,
    "tail": "RP-C9923",
    "inspectionId": "INS-2026-00410",
    "checkType": "C-Check",
    "partName": "Fan cowl",
    "title": "Cowl latch alignment offset",
    "location": "Engine No. 2, lower fan cowl",
    "ataSection": "ATA 71-11-00",
    "ataChapter": "71",
    "severity": "Medium",
    "status": "Open",
    "description": "Latch alignment is offset and requires increased force to close.",
    "correctiveAction": "Adjust latch rigging and verify closure and security.",
    "createdAt": "May 20, 2026 \u00b7 14:15",
    "createdBy": "Elena Santos, QA Inspector",
    "references": [
      {
        "label": "AMM 71-11-00",
        "detail": "Fan cowl inspection and maintenance procedures"
      }
    ]
  },
  {
    "id": "F-2026-0014",
    "number": 14,
    "tail": "RP-C8841",
    "inspectionId": "INS-2026-00411",
    "checkType": "Line inspection",
    "partName": "Wing panel",
    "title": "Access panel surface scratch",
    "location": "Right wing upper surface",
    "ataSection": "ATA 57-20-00",
    "ataChapter": "57",
    "severity": "Low",
    "status": "Closed",
    "description": "Superficial scratch found on the access panel coating.",
    "correctiveAction": "Surface inspected, protective coating restored and condition documented.",
    "createdAt": "May 21, 2026 \u00b7 15:15",
    "createdBy": "Miguel Reyes, Maintenance Inspector",
    "references": [
      {
        "label": "AMM 57-20-00",
        "detail": "Wing panel inspection and maintenance procedures"
      }
    ]
  },
  {
    "id": "F-2026-0015",
    "number": 15,
    "tail": "RP-C6631",
    "inspectionId": "INS-2026-00412",
    "checkType": "Delivery inspection",
    "partName": "Fuel pump",
    "title": "Fuel pump pressure fluctuation",
    "location": "Left wing tank",
    "ataSection": "ATA 28-20-00",
    "ataChapter": "28",
    "severity": "High",
    "status": "Open",
    "description": "Intermittent pressure fluctuations recorded during the pump operational check.",
    "correctiveAction": "Troubleshoot pump and electrical supply; repeat operational test.",
    "createdAt": "May 22, 2026 \u00b7 09:15",
    "createdBy": "Anna Cruz, Technical Inspector",
    "references": [
      {
        "label": "AMM 28-20-00",
        "detail": "Fuel pump inspection and maintenance procedures"
      }
    ]
  },
  {
    "id": "F-2026-0016",
    "number": 16,
    "tail": "RP-C5517",
    "inspectionId": "INS-2026-00413",
    "checkType": "C-Check",
    "partName": "Air conditioning duct",
    "title": "Duct clamp fretting",
    "location": "Forward equipment bay",
    "ataSection": "ATA 21-50-00",
    "ataChapter": "21",
    "severity": "Medium",
    "status": "Open",
    "description": "Fretting marks found at an air conditioning duct support clamp.",
    "correctiveAction": "Inspect duct for wear and renew clamp cushioning.",
    "createdAt": "May 23, 2026 \u00b7 10:15",
    "createdBy": "Elena Santos, QA Inspector",
    "references": [
      {
        "label": "AMM 21-50-00",
        "detail": "Air conditioning duct inspection and maintenance procedures"
      }
    ]
  },
  {
    "id": "F-2026-0017",
    "number": 17,
    "tail": "RP-C2290",
    "inspectionId": "INS-2026-00414",
    "checkType": "Line inspection",
    "partName": "Pitot probe",
    "title": "Pitot cover placard fading",
    "location": "Forward fuselage, left side",
    "ataSection": "ATA 34-10-00",
    "ataChapter": "34",
    "severity": "Low",
    "status": "Open",
    "description": "Protective cover identification placard is faded but legible.",
    "correctiveAction": "Replace placard during planned servicing.",
    "createdAt": "May 24, 2026 \u00b7 11:15",
    "createdBy": "Miguel Reyes, Maintenance Inspector",
    "references": [
      {
        "label": "AMM 34-10-00",
        "detail": "Pitot probe inspection and maintenance procedures"
      }
    ]
  },
  {
    "id": "F-2026-0018",
    "number": 18,
    "tail": "RP-C7712",
    "inspectionId": "INS-2026-00415",
    "checkType": "Delivery inspection",
    "partName": "APU access panel",
    "title": "APU panel fastener missing",
    "location": "Tail cone, lower access panel",
    "ataSection": "ATA 49-10-00",
    "ataChapter": "49",
    "severity": "Medium",
    "status": "Closed",
    "description": "One captive fastener was missing during the external inspection.",
    "correctiveAction": "Approved fastener installed and panel security checked.",
    "createdAt": "May 25, 2026 \u00b7 12:15",
    "createdBy": "Anna Cruz, Technical Inspector",
    "references": [
      {
        "label": "AMM 49-10-00",
        "detail": "APU access panel inspection and maintenance procedures"
      }
    ]
  }
];
