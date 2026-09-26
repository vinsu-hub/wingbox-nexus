export const ROUTES = {
  login: "/login",
  root: "/",
  dashboard: "/dashboard",
  fleet: "/fleet",
  aircraftRecord: (tail: string) => `/fleet/${tail}`,
  inspections: "/inspections",
  compliance: "/compliance",
  lifeTracking: "/life-tracking",
  reports: "/reports",
  partsRequests: "/parts-requests",
  maintenanceHistory: "/maintenance-history",
  documents: "/documents",
  technicalLibrary: "/technical-library",
  presentations: "/presentations",
  aiAssistant: "/ai-assistant",
  inspectionPresentation: (id?: string) => `/inspection-presentation${id ? `/${id}` : ""}`,
  damage3d: "/damage-3d",
  qaQc: "/qa-qc",
  view: (slug: string) => `/view/${slug}`,
} as const;

export function slugify(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
