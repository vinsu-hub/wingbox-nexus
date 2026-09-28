import {
  Activity,
  Inbox,
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
  PlaneLanding,
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
      item("Components", Box, ROUTES.components),
      item("Maintenance History", History, ROUTES.maintenanceHistory),
      item("Compliance", ShieldCheck, ROUTES.compliance),
      item("Life Tracking", Activity, ROUTES.lifeTracking),
      item("Actions", ListChecks, ROUTES.actionsTracker),
      item("Delivery & Re-Delivery", PlaneLanding, ROUTES.delivery),
      item("Documents", FileText, ROUTES.documents),
    ],
  },
  {
    label: "INSPECTIONS",
    items: [
      item("Inspections", ClipboardCheck, ROUTES.inspections),
      item("Findings", AlertTriangle, ROUTES.findings),
      item("Damage / 3D", Box, ROUTES.damage3d),
    ],
  },
  {
    label: "TECHNICAL",
    items: [
      item("AI Assistant", Sparkles, ROUTES.aiAssistant),
      item("Technical Library", BookOpen, ROUTES.technicalLibrary),
      item("Knowledge Base", HelpCircle, ROUTES.knowledgeBase),
      item("Review Inbox", Inbox, ROUTES.reviewInbox),
    ],
  },
  {
    label: "REPORTS",
    items: [
      item("Reports", FileBarChart, ROUTES.reports),
      item("Presentations", FileCheck2, ROUTES.presentations),
    ],
  },
  {
    label: "PROCUREMENT",
    items: [
      item("Parts Requests", Wrench, ROUTES.partsRequests),
      item("QA/QC", ListChecks, ROUTES.qaQc),
    ],
  },
  {
    label: "CLIENT PORTAL",
    items: [
      item("Client Access", UsersRound, ROUTES.clientAccess),
      item("Client Reports", FileText, ROUTES.clientReports),
    ],
  },
  {
    label: "ADMIN",
    items: [
      item("Users & Roles", UsersRound, ROUTES.usersRoles),
      item("Templates", FileText, ROUTES.templates),
      item("Audit Log", History, ROUTES.auditLog),
      item("System Settings", Settings, ROUTES.systemSettings),
    ],
  },
];
