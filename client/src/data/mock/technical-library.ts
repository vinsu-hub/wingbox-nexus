import { aircraft } from "@/data/aircraft";

export const documentCategories = [
  "Aircraft Manuals",
  "Component Manuals",
  "Maintenance Procedures",
  "Service Bulletins",
  "Regulatory & Compliance",
] as const;

export type DocumentCategory = (typeof documentCategories)[number];
export type TechnicalDocumentType =
  | "Manual"
  | "Procedure"
  | "SB"
  | "Drawing"
  | "Guide";

export interface TechnicalDocument {
  id: string;
  title: string;
  subtitle: string;
  type: TechnicalDocumentType;
  category: DocumentCategory;
  tail: string;
  aircraftType: string;
  documentNumber: string;
  revision: string;
  updatedAt: string;
}

type DocumentTemplate = Omit<
  TechnicalDocument,
  "id" | "tail" | "aircraftType" | "documentNumber" | "revision" | "updatedAt"
> & {
  code: string;
};

const templates: DocumentTemplate[] = [
  {
    title: "Flight Crew Operating Manual",
    subtitle: "Flight operations and limitations",
    type: "Manual",
    category: "Aircraft Manuals",
    code: "FCOM",
  },
  {
    title: "Aircraft Maintenance Manual",
    subtitle: "Scheduled maintenance reference",
    type: "Manual",
    category: "Aircraft Manuals",
    code: "AMM",
  },
  {
    title: "Engine Maintenance Manual",
    subtitle: "Engine maintenance and troubleshooting",
    type: "Manual",
    category: "Component Manuals",
    code: "EMM",
  },
  {
    title: "Landing Gear Overhaul Procedure",
    subtitle: "Landing gear inspection and overhaul",
    type: "Procedure",
    category: "Maintenance Procedures",
    code: "LG-OVH",
  },
  {
    title: "Fuel Pump Service Bulletin",
    subtitle: "Fuel pump inspection and replacement",
    type: "SB",
    category: "Service Bulletins",
    code: "SB-FP",
  },
  {
    title: "Hydraulic System Schematic",
    subtitle: "Hydraulic circuit and component layout",
    type: "Drawing",
    category: "Component Manuals",
    code: "HYD",
  },
  {
    title: "Avionics Troubleshooting Guide",
    subtitle: "Fault isolation for avionics systems",
    type: "Guide",
    category: "Maintenance Procedures",
    code: "AVI",
  },
  {
    title: "Airworthiness Directive Compliance Guide",
    subtitle: "Directive applicability and compliance",
    type: "Guide",
    category: "Regulatory & Compliance",
    code: "AD",
  },
];

// A fixed demo snapshot: eight reference families for each of the twelve real fleet tails.
export const technicalDocuments: TechnicalDocument[] = aircraft.flatMap(
  (plane, planeIndex) =>
    templates.map((template, templateIndex) => {
      const sequence = planeIndex * templates.length + templateIndex;
      const date = new Date(Date.UTC(2026, 4, 18) - sequence * 3 * 86_400_000);
      return {
        id: `technical-${String(sequence + 1).padStart(3, "0")}`,
        title: `${plane.type.split("-")[0]} ${template.title}`,
        subtitle: template.subtitle,
        type: template.type,
        category: template.category,
        tail: plane.tail,
        aircraftType: plane.type,
        documentNumber: `${template.code}-${plane.type.replace(/[^A-Z0-9]/gi, "")}-${String(planeIndex + 1).padStart(2, "0")}`,
        revision: `Rev. ${String(2 + (sequence % 11)).padStart(2, "0")}`,
        updatedAt: date.toISOString().slice(0, 10),
      };
    })
);

export const featuredTechnicalDocument = technicalDocuments[2];
