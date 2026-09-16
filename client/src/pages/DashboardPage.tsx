import {
  AlertTriangle,
  ArrowRight,
  Box,
  Check,
  ClipboardCheck,
  Download,
  FileBarChart,
  FileText,
  LayoutDashboard,
  Plane,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { SummaryCardRow } from "@/components/shared/SummaryCardRow";

const aircraftImage = "/assets/wingbox-aircraft-hero.jpg";

export function DashboardPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow"><LayoutDashboard size={16} /> OPERATIONS / OVERVIEW</div>
          <h1>Good morning, John</h1>
          <p>Here's what's happening with your fleet today.</p>
        </div>
        <div className="date-meta">May 21, 2026 · 10:42 AM<br /><span><i /> System Online</span></div>
      </div>
      <SummaryCardRow
        cards={[
          { icon: Plane, label: "Active Inspections", value: "12", foot: "↑ 2 from last week", tone: "blue" },
          { icon: AlertTriangle, label: "Open Findings", value: "8", foot: "↑ 1 from last week", tone: "red" },
          { icon: ShieldCheck, label: "Compliance Alerts", value: "3", foot: "↓ 2 from last week", tone: "blue", trend: "↓ 2 from last week" },
          { icon: FileBarChart, label: "Reports Ready", value: "16", foot: "↑ 5 from last week", tone: "violet" },
          { icon: Box, label: "Parts Requests", value: "6", foot: "↑ 1 from last week", tone: "amber" },
        ]}
      />
      <div className="dashboard-grid">
        <div className="overview-hero">
          <img src={aircraftImage} alt="Aircraft over clouds" />
          <div className="hero-tint" />
          <div className="hero-copy">
            <span>FLEET OVERVIEW</span>
            <strong>12</strong>
            <b>Total Aircraft</b>
            <div className="hero-states">
              <span><i className="green-dot" />10 <small>Active</small></span>
              <span><i className="amber-dot" />1 <small>Inspection</small></span>
              <span><i className="red-dot" />1 <small>Maintenance</small></span>
            </div>
            <Link href="/fleet" className="hero-link">View Fleet <ArrowRight size={15} /></Link>
          </div>
        </div>
        <div className="quick-panel panel">
          <h3>Quick Actions</h3>
          {["Start New Inspection", "Create Parts Request", "Generate Report", "Ask Technical Assistant", "Upload Document"].map((x, i) => {
            const Icon = [ClipboardCheck, Box, FileText, Sparkles, Download][i];
            return (
              <button key={x} onClick={() => toast(`${x} is ready to configure`)}>
                <span><Icon size={16} /></span>{x}<ArrowRight size={14} />
              </button>
            );
          })}
        </div>
        <div className="activity-panel panel">
          <div className="panel-title"><h3>Recent Activity</h3><button>View All →</button></div>
          {["Inspection Completed", "New Finding Created", "Report Approved", "Parts Request Updated", "Document Indexed"].map((x, i) => (
            <div className="activity-row" key={x}>
              <span className={`activity-icon a${i}`}><Check size={14} /></span>
              <div>
                <strong>{x}</strong>
                <small>{["A-Check • RP-C9923", "Finding #03 • RP-C8841", "RP-C7712 • C-Check", "Hydraulic Pump • PR-1042", "AMM 72-21-00"][i]}</small>
              </div>
              <time>{["2h ago", "3h ago", "4h ago", "5h ago", "6h ago"][i]}</time>
            </div>
          ))}
        </div>
      </div>
      <div className="lower-grid">
        <div className="chart-card panel">
          <h3>Inspection Status</h3>
          <div className="donut large"><div><strong>12</strong><span>Active</span></div></div>
          <div className="chart-legend">
            <p><i className="blue" />In Progress <b>5</b></p>
            <p><i className="violet" />Scheduled <b>4</b></p>
            <p><i className="green" />Awaiting QA <b>2</b></p>
            <p><i className="gray" />Completed <b>31</b></p>
          </div>
        </div>
        <div className="chart-card panel">
          <h3>Compliance Overview</h3>
          <div className="donut compliance-donut"><div><strong>98.4%</strong><span>Overall</span></div></div>
          <div className="chart-legend">
            <p><i className="green" />Compliant <b>39</b></p>
            <p><i className="amber" />Due Soon <b>2</b></p>
            <p><i className="red" />Overdue <b>1</b></p>
            <small>Total AD/SB <b>42</b></small>
          </div>
        </div>
        <div className="upcoming panel">
          <div className="panel-title"><h3>Upcoming Inspections</h3><button>View All →</button></div>
          {["RP-C9923", "RP-C7712", "RP-C8841", "RP-C9912"].map((x, i) => (
            <div className="upcoming-row" key={x}>
              <Plane size={16} />
              <div><strong>{x}</strong><span>{["A-Check", "Engine Inspection", "B-Check", "Landing Gear"][i]}</span></div>
              <time>{["May 28, 2026", "May 28, 2026", "Jun 02, 2026", "Jun 10, 2026"][i]}</time>
              <em>{i < 2 ? "Scheduled" : "Planned"}</em>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
