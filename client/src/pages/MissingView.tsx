import { ArrowRight, Database, FileText, Gauge, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

const viewDescriptions: Record<string, { eyebrow: string; title: string; description: string; actions: string[] }> = {
  components: { eyebrow: "AIRCRAFT / COMPONENTS", title: "Components", description: "Track serialized components, part history, and installation status across the fleet.", actions: ["Add component", "Import component log"] },
  "maintenance-history": { eyebrow: "AIRCRAFT / HISTORY", title: "Maintenance History", description: "Review the fleet-wide maintenance timeline with aircraft, inspector, and event filters.", actions: ["Filter history", "Export timeline"] },
  compliance: { eyebrow: "AIRCRAFT / COMPLIANCE", title: "Compliance", description: "Monitor AD/SB directives, due dates, and affected aircraft status in one place.", actions: ["Review directives", "Export matrix"] },
  "life-tracking": { eyebrow: "AIRCRAFT / LIFE TRACKING", title: "Life Tracking", description: "Follow component hours, cycles, remaining life, and upcoming limits before they become alerts.", actions: ["Add component limit", "View at-risk items"] },
  documents: { eyebrow: "AIRCRAFT / DOCUMENTS", title: "Documents", description: "Organize maintenance manuals, compliance records, and airworthiness documents with revision control.", actions: ["Upload document", "Browse categories"] },
  inspections: { eyebrow: "INSPECTIONS / SCHEDULE", title: "Inspections", description: "Schedule, assign, and follow inspection progress across the active fleet.", actions: ["Schedule inspection", "Open calendar"] },
  findings: { eyebrow: "INSPECTIONS / FINDINGS", title: "Findings", description: "Manage severity-tagged findings linked to inspections, components, and ATA references.", actions: ["Create finding", "Review open items"] },
  "damage-3d": { eyebrow: "INSPECTIONS / DAMAGE", title: "Damage / 3D", description: "Explore component damage findings with model hotspots, photos, and corrective actions.", actions: ["Open 3D viewer", "Present to client"] },
  "ai-assistant": { eyebrow: "TECHNICAL / AI", title: "AI Assistant", description: "Ask cited technical, compliance, and troubleshooting questions against your knowledge base.", actions: ["Ask a question", "Browse prompts"] },
  "technical-library": { eyebrow: "TECHNICAL / LIBRARY", title: "Technical Library", description: "Find aircraft manuals, component manuals, procedures, bulletins, and regulatory references.", actions: ["Upload reference", "Request document"] },
  "knowledge-base": { eyebrow: "TECHNICAL / KNOWLEDGE", title: "Knowledge Base", description: "Keep the team aligned with shared operating guidance, templates, and help content.", actions: ["Search knowledge", "Create article"] },
  reports: { eyebrow: "REPORTS / OPERATIONS", title: "Reports", description: "Generate maintenance, compliance, fleet operations, and custom reports for review.", actions: ["Generate report", "Request custom report"] },
  presentations: { eyebrow: "REPORTS / PRESENTATIONS", title: "Presentations", description: "Create client-ready inspection readouts and share approved technical presentations.", actions: ["Create presentation", "Browse templates"] },
  "parts-requests": { eyebrow: "PROCUREMENT / PARTS", title: "Parts Requests", description: "Move requests from requested through quote, QA/QC, fulfillment, and closeout.", actions: ["New parts request", "Browse catalog"] },
  "qa-qc": { eyebrow: "PROCUREMENT / QUALITY", title: "QA / QC", description: "Complete procurement and inspection quality checklists with named approvals.", actions: ["Open checklist", "Review approvals"] },
  "client-access": { eyebrow: "CLIENT PORTAL / ACCESS", title: "Client Access", description: "Manage scoped client access to reports, requests, and aircraft records.", actions: ["Invite client", "Review permissions"] },
  "client-reports": { eyebrow: "CLIENT PORTAL / REPORTS", title: "Client Reports", description: "Distribute approved maintenance and compliance reports to airline clients.", actions: ["Share report", "Review activity"] },
  "users-roles": { eyebrow: "ADMIN / ACCESS", title: "Users & Roles", description: "Manage engineers, QA inspectors, administrators, and client portal access.", actions: ["Invite user", "Review roles"] },
  templates: { eyebrow: "ADMIN / TEMPLATES", title: "Templates", description: "Standardize inspection, report, and presentation formatting across the organization.", actions: ["Create template", "Browse library"] },
  "audit-log": { eyebrow: "ADMIN / GOVERNANCE", title: "Audit Log", description: "Review named activity, approval events, and changes across WingBox Aviation operations.", actions: ["Filter activity", "Export audit log"] },
  "system-settings": { eyebrow: "ADMIN / SETTINGS", title: "System Settings", description: "Configure organization preferences, notifications, integrations, and workspace defaults.", actions: ["Manage preferences", "Review notifications"] },
};

export function MissingView({ slug }: { slug?: string }) {
  const view = viewDescriptions[slug || ""] || { eyebrow: "WORKSPACE", title: "Workspace View", description: "This operational view is ready for the next implementation pass.", actions: ["Open workspace", "View plan"] };
  return (
    <div className="module-view">
      <div className="module-view-head">
        <div><div className="eyebrow"><Gauge size={16} /> {view.eyebrow}</div><h1>{view.title}</h1><p>{view.description}</p></div>
        <span className="module-status"><Zap size={13} /> V1 module</span>
      </div>
      <div className="module-empty panel">
        <div className="module-empty-icon"><Sparkles size={22} /></div>
        <h2>{view.title} workspace</h2>
        <p>This view is included in the WingBox Aviation information architecture and is ready to connect to live records, approvals, and role-based workflows.</p>
        <div className="module-actions">
          {view.actions.map(action => (
            <button key={action} className="primary-button" onClick={() => toast(`${action} is ready for implementation`)}>{action}<ArrowRight size={15} /></button>
          ))}
        </div>
      </div>
      <div className="module-cards">
        <div className="panel mini-module-card"><FileText size={18} /><strong>Specification mapped</strong><span>Labels and workflow entry points are aligned to the platform plan.</span></div>
        <div className="panel mini-module-card"><ShieldCheck size={18} /><strong>Role-aware by design</strong><span>Ready for Engineer, QA, Admin, and Client access rules.</span></div>
        <div className="panel mini-module-card"><Database size={18} /><strong>Data-ready surface</strong><span>Designed to connect to Supabase records in the next pass.</span></div>
      </div>
    </div>
  );
}
