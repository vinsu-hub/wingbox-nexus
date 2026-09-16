import {
  Activity,
  AlertTriangle,
  Box,
  BookOpen,
  ClipboardCheck,
  FileBarChart,
  FileCheck2,
  FileText,
  HelpCircle,
  History,
  LayoutDashboard,
  ListChecks,
  Plane,
  Settings,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { ROUTES, slugify } from "@/routes";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

function item(label: string, icon: LucideIcon, path?: string): NavItem {
  return { label, icon, path: path || ROUTES.view(slugify(label)) };
}

export const navGroups: NavGroup[] = [
  { label: "", items: [item("Dashboard", LayoutDashboard, ROUTES.dashboard)] },
  {
    label: "AIRCRAFT",
    items: [
      item("Fleet", Plane, ROUTES.fleet),
      item("Components", Box),
      item("Maintenance History", History),
      item("Compliance", ShieldCheck, ROUTES.compliance),
      item("Life Tracking", Activity, ROUTES.lifeTracking),
      item("Documents", FileText),
    ],
  },
  {
    label: "INSPECTIONS",
    items: [
      item("Inspections", ClipboardCheck, ROUTES.inspections),
      item("Findings", AlertTriangle),
      item("Damage / 3D", Box),
    ],
  },
  {
    label: "TECHNICAL",
    items: [
      item("AI Assistant", Sparkles),
      item("Technical Library", BookOpen),
      item("Knowledge Base", HelpCircle),
    ],
  },
  {
    label: "REPORTS",
    items: [
      item("Reports", FileBarChart, ROUTES.reports),
      item("Presentations", FileCheck2),
    ],
  },
  {
    label: "PROCUREMENT",
    items: [
      item("Parts Requests", Wrench, ROUTES.partsRequests),
      item("QA/QC", ListChecks),
    ],
  },
  {
    label: "CLIENT PORTAL",
    items: [
      item("Client Access", UsersRound),
      item("Client Reports", FileText),
    ],
  },
  {
    label: "ADMIN",
    items: [
      item("Users & Roles", UsersRound),
      item("Templates", FileText),
      item("Audit Log", History),
      item("System Settings", Settings),
    ],
  },
];
