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
  view: (slug: string) => `/view/${slug}`,
} as const;

export function slugify(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
