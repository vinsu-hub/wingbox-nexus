import { useMemo, useState } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import {
  Activity,
  AlertTriangle,
  ArrowDownUp,
  ArrowRight,
  Bell,
  BookOpen,
  Box,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Cloud,
  Database,
  Download,
  FileBarChart,
  FileCheck2,
  FileText,
  Filter,
  Gauge,
  HelpCircle,
  History,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  Plane,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { Toaster, toast } from "sonner";

const aircraftImage = "/manus-storage/wingbox-aircraft-hero_f855b674.jpg";

const navGroups = [
  { label: "", items: [{ label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" }] },
  {
    label: "AIRCRAFT",
    items: [
      { label: "Fleet", icon: Plane, path: "/fleet" },
      { label: "Components", icon: Box },
      { label: "Maintenance History", icon: History },
      { label: "Compliance", icon: ShieldCheck },
      { label: "Life Tracking", icon: Activity },
      { label: "Documents", icon: FileText },
    ],
  },
  {
    label: "INSPECTIONS",
    items: [
      { label: "Inspections", icon: ClipboardCheck },
      { label: "Findings", icon: AlertTriangle },
      { label: "Damage / 3D", icon: Box },
    ],
  },
  {
    label: "TECHNICAL",
    items: [
      { label: "AI Assistant", icon: Sparkles },
      { label: "Technical Library", icon: BookOpen },
      { label: "Knowledge Base", icon: HelpCircle },
    ],
  },
  {
    label: "REPORTS",
    items: [
      { label: "Reports", icon: FileBarChart },
      { label: "Presentations", icon: FileCheck2 },
    ],
  },
  {
    label: "PROCUREMENT",
    items: [
      { label: "Parts Requests", icon: Wrench },
      { label: "QA/QC", icon: ListChecks },
    ],
  },
  {
    label: "CLIENT PORTAL",
    items: [
      { label: "Client Access", icon: UsersRound },
      { label: "Client Reports", icon: FileText },
    ],
  },
  {
    label: "ADMIN",
    items: [
      { label: "Users & Roles", icon: UsersRound },
      { label: "Templates", icon: FileText },
      { label: "Audit Log", icon: History },
      { label: "System Settings", icon: Settings },
    ],
  },
];

const aircraft = [
  { tail: "RP-C9923", type: "A320-214", client: "Skyline Air", hours: "12,482.6", cycles: "8,921", next: "42 FH", date: "May 28, 2026", compliance: 98.7, status: "Active", dot: "green" },
  { tail: "RP-C9912", type: "A320-214", client: "Skyline Air", hours: "11,230.4", cycles: "7,842", next: "87 FH", date: "Jun 14, 2026", compliance: 97.9, status: "Active", dot: "green" },
  { tail: "RP-C8841", type: "ATR 72-600", client: "Island Wings", hours: "8,214.7", cycles: "6,102", next: "12 FH", date: "May 22, 2026", compliance: 94.2, status: "In Inspection", dot: "amber" },
  { tail: "RP-C7712", type: "A321-231", client: "Skyline Air", hours: "13,502.9", cycles: "9,421", next: "76 FH", date: "Jun 02, 2026", compliance: 96.8, status: "Active", dot: "green" },
  { tail: "RP-C6631", type: "A320-214", client: "Pacific Horizon", hours: "14,221.3", cycles: "10,832", next: "5 FH", date: "May 20, 2026", compliance: 91.6, status: "Attention", dot: "red" },
  { tail: "RP-C5517", type: "B737-800", client: "Island Wings", hours: "9,842.1", cycles: "7,441", next: "63 FH", date: "Jun 10, 2026", compliance: 98.9, status: "Active", dot: "green" },
  { tail: "RP-C4489", type: "A320-200", client: "Skyline Air", hours: "10,556.8", cycles: "8,120", next: "54 FH", date: "Jun 21, 2026", compliance: 97.3, status: "Active", dot: "green" },
  { tail: "RP-C3375", type: "ATR 72-600", client: "Island Wings", hours: "7,221.4", cycles: "5,842", next: "41 FH", date: "May 30, 2026", compliance: 95.7, status: "Active", dot: "green" },
  { tail: "RP-C2290", type: "B737-900", client: "Pacific Horizon", hours: "15,332.7", cycles: "11,984", next: "28 FH", date: "May 27, 2026", compliance: 92.8, status: "In Inspection", dot: "amber" },
  { tail: "RP-C1187", type: "A321-231", client: "Skyline Air", hours: "6,883.2", cycles: "5,210", next: "72 FH", date: "Jun 18, 2026", compliance: 98.1, status: "Active", dot: "green" },
  { tail: "RP-C0065", type: "A320-214", client: "New Horizons", hours: "12,114.9", cycles: "9,002", next: "38 FH", date: "May 24, 2026", compliance: 96.4, status: "Active", dot: "green" },
  { tail: "RP-C0001", type: "A330-300", client: "Skyline Air", hours: "16,742.6", cycles: "12,883", next: "96 FH", date: "Jun 19, 2026", compliance: 94.7, status: "Active", dot: "green" },
];

function BrandMark() {
  return <div className="brand-mark"><div className="brand-square"><span /></div><div><strong>WINGBOX</strong><small>AVIATION INC.</small></div><i /> <b>NEXUS</b></div>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleNav = (label: string, path?: string) => {
    if (path) navigate(path);
    else toast(`${label} workspace is coming soon`);
    setMobileOpen(false);
  };
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-brand"><BrandMark /></div>
      <nav className="side-nav">
        {navGroups.map(group => <div className="nav-group" key={group.label || "home"}>
          {group.label && <div className="nav-label">{group.label}</div>}
          {group.items.map(item => <button className={`nav-item ${location === item.path || (!item.path && false) ? "active" : ""}`} key={item.label} onClick={() => handleNav(item.label, item.path)}><item.icon size={16} strokeWidth={1.8}/><span>{item.label}</span></button>)}
        </div>)}
      </nav>
      <div className="sidebar-footer"><span>v1.0.0</span><span className="secure"><Cloud size={12}/> System secure</span></div>
    </aside>
    <main className="main-shell">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobileOpen(v => !v)}><Menu size={20}/></button>
        <div className="top-search"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search aircraft, tail number, component, finding, document..."/><kbd>⌘ K</kbd></div>
        <div className="top-actions"><button className="icon-button" onClick={() => toast("You are all caught up") }><Bell size={18}/><em>3</em></button><div className="user-chip"><div className="avatar">JD</div><div><strong>John Dela Cruz</strong><span>Engineer</span></div><ChevronDown size={15}/></div></div>
      </header>
      <div className="page-content">{children}</div>
    </main>
  </div>;
}

function StatCard({ icon: Icon, label, value, foot, tone = "blue", trend }: any) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={20}/></div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small className={trend?.startsWith("↓") ? "down" : ""}>{trend || foot}</small></div></div>;
}

function StatusPill({ status }: { status: string }) { const cls = status === "Active" ? "active" : status === "Attention" ? "attention" : "inspection"; return <span className={`status-pill ${cls}`}><i />{status}</span>; }

function FleetPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All Status");
  const [type, setType] = useState("All Types");
  const [selected, setSelected] = useState(aircraft[0]);
  const [showModal, setShowModal] = useState(false);
  const filtered = useMemo(() => aircraft.filter(a => (a.tail + a.type + a.client).toLowerCase().includes(query.toLowerCase()) && (status === "All Status" || a.status === status) && (type === "All Types" || a.type === type)), [query, status, type]);
  return <>
    <div className="page-heading"><div><div className="eyebrow"><Plane size={16}/> AIRCRAFT / FLEET</div><h1>Aircraft Fleet</h1><p>Manage and monitor all aircraft under your fleet.</p></div><button className="primary-button" onClick={() => setShowModal(true)}><Plus size={16}/> Add Aircraft</button></div>
    <div className="stats-grid fleet-stats"><StatCard icon={Plane} label="Total Aircraft" value="24" foot="↑ 2 new this month" tone="blue"/><StatCard icon={Check} label="Active" value="18" foot="75% of fleet" tone="green"/><StatCard icon={Clock3} label="In Inspection" value="4" foot="↑ 17% of fleet" tone="amber"/><StatCard icon={AlertTriangle} label="Attention" value="2" foot="8% of fleet" tone="red"/><StatCard icon={FileText} label="Next Check Due" value="5" foot="within 7 days" tone="violet"/></div>
    <div className="fleet-layout">
      <section className="fleet-main panel">
        <div className="filter-row"><div className="table-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by tail number, model, or client..."/></div><select value={type} onChange={e => setType(e.target.value)}><option>All Types</option><option>A320-214</option><option>ATR 72-600</option><option>A321-231</option><option>B737-800</option></select><select><option>All Clients</option><option>Skyline Air</option><option>Island Wings</option></select><select value={status} onChange={e => setStatus(e.target.value)}><option>All Status</option><option>Active</option><option>In Inspection</option><option>Attention</option></select><button className="filter-button" onClick={() => toast("Advanced filters are ready for your next review")}><Filter size={15}/> Filters</button><button className="export-button" onClick={() => toast.success("Fleet export prepared")}><Download size={15}/> Export</button></div>
        <div className="table-wrap"><table><thead><tr><th className="check-cell"><input type="checkbox"/></th><th>Tail Number <ArrowDownUp size={12}/></th><th>Aircraft Type</th><th>Client</th><th>Flight Hours</th><th>Cycles</th><th>Next Check</th><th>Compliance</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map(row => <tr key={row.tail} className={selected.tail === row.tail ? "selected-row" : ""} onClick={() => setSelected(row)}><td className="check-cell"><input type="checkbox" onClick={e => e.stopPropagation()}/></td><td><div className="tail-cell"><span className={`aircraft-dot ${row.dot}`} /> <strong>{row.tail}</strong></div></td><td>{row.type}</td><td>{row.client}</td><td>{row.hours}</td><td>{row.cycles}</td><td><b className={row.next === "5 FH" ? "critical" : ""}>{row.next}</b><small>{row.date}</small></td><td><div className="compliance"><span>{row.compliance}%</span><div><i style={{width: `${row.compliance}%`}} /></div></div></td><td><StatusPill status={row.status}/></td><td><button className="more-button" onClick={e => { e.stopPropagation(); toast(`${row.tail} actions`); }}><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table></div>
        <div className="table-footer"><span>Showing <b>1–{filtered.length}</b> of 24 aircraft</span><div className="pagination"><button><ChevronLeft size={15}/></button><button className="current">1</button><button>2</button><button><ChevronRight size={15}/></button></div><label>Rows per page <select><option>12</option><option>24</option></select></label></div>
      </section>
      <aside className="fleet-side">
        <div className="featured-card"><img src={aircraftImage} alt="Aircraft in flight"/><div className="featured-overlay"><div><strong>{selected.tail}</strong><span>{selected.type}</span></div><StatusPill status={selected.status}/></div></div>
        <div className="metric-strip"><div><span>Flight Hours</span><b>{selected.hours}</b></div><div><span>Cycles</span><b>{selected.cycles}</b></div><div><span>Next Check</span><b>{selected.next}</b><small>{selected.date}</small></div><div><span>Compliance</span><b className="green-text">{selected.compliance}%</b></div></div>
        <button className="record-button" onClick={() => toast(`${selected.tail} record opened`)}>View Aircraft Record <ArrowRight size={16}/></button>
        <div className="side-panel"><div className="panel-title"><h3>Upcoming Events</h3><button onClick={() => toast("Showing all events")}>View All <ArrowRight size={13}/></button></div>{[{date:"MAY",day:"28",title:"A-Check",meta:`${selected.tail} • 42 FH`,tag:"Inspection",tone:"blue"},{date:"JUN",day:"02",title:"Compliance Check",meta:"RP-C7712 • AD 2024-13-05",tag:"Compliance",tone:"amber"},{date:"JUN",day:"10",title:"Engine Inspection",meta:"RP-C5517 • 1200 FH",tag:"Inspection",tone:"violet"},{date:"JUN",day:"14",title:"B-Check",meta:"RP-C9912 • 1800 FH",tag:"Inspection",tone:"blue"},{date:"JUN",day:"18",title:"Component Replacement",meta:"RP-C0001 • Engine",tag:"Maintenance",tone:"green"}].map(e => <div className="event-row" key={e.title}><div className="event-date"><span>{e.date}</span><b>{e.day}</b></div><div className="event-copy"><strong>{e.title}</strong><span>{e.meta}</span></div><em className={`tag ${e.tone}`}>{e.tag}</em></div>)}</div>
        <div className="side-panel health-panel"><div className="panel-title"><h3>Fleet Health</h3><button onClick={() => toast("Health view opened")}>Details <ArrowRight size={13}/></button></div><div className="health-content"><div className="donut"><div><strong>24</strong><span>Total Aircraft</span></div></div><div className="health-legend"><p><i className="green"/>Healthy <b>18</b><small>75%</small></p><p><i className="amber"/>In Inspection <b>4</b><small>17%</small></p><p><i className="red"/>Attention <b>2</b><small>8%</small></p></div></div></div>
      </aside>
    </div>
    {showModal && <div className="modal-backdrop" onClick={() => setShowModal(false)}><div className="modal-card" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowModal(false)}><X size={17}/></button><div className="modal-icon"><Plane size={22}/></div><h2>Add aircraft to fleet</h2><p>Register a new aircraft record for inspections, compliance, and life tracking.</p><label>Tail number<input placeholder="e.g. RP-C7788"/></label><label>Aircraft type<select><option>A320-214</option><option>A321-231</option><option>B737-800</option></select></label><div className="modal-actions"><button className="secondary-button" onClick={() => setShowModal(false)}>Cancel</button><button className="primary-button" onClick={() => { setShowModal(false); toast.success("Aircraft draft saved"); }}>Save aircraft</button></div></div></div>}
  </>;
}

function DashboardPage() {
  return <><div className="page-heading"><div><div className="eyebrow"><LayoutDashboard size={16}/> OPERATIONS / OVERVIEW</div><h1>Good morning, John</h1><p>Here's what's happening with your fleet today.</p></div><div className="date-meta">May 21, 2026 · 10:42 AM<br/><span><i/> System Online</span></div></div><div className="stats-grid"><StatCard icon={Plane} label="Active Inspections" value="12" foot="↑ 2 from last week" tone="blue"/><StatCard icon={AlertTriangle} label="Open Findings" value="8" foot="↑ 1 from last week" tone="red"/><StatCard icon={ShieldCheck} label="Compliance Alerts" value="3" foot="↓ 2 from last week" tone="blue" trend="↓ 2 from last week"/><StatCard icon={FileBarChart} label="Reports Ready" value="16" foot="↑ 5 from last week" tone="violet"/><StatCard icon={Box} label="Parts Requests" value="6" foot="↑ 1 from last week" tone="amber"/></div><div className="dashboard-grid"><div className="overview-hero"><img src={aircraftImage} alt="Aircraft over clouds"/><div className="hero-tint"/><div className="hero-copy"><span>FLEET OVERVIEW</span><strong>12</strong><b>Total Aircraft</b><div className="hero-states"><span><i className="green-dot"/>10 <small>Active</small></span><span><i className="amber-dot"/>1 <small>Inspection</small></span><span><i className="red-dot"/>1 <small>Maintenance</small></span></div><Link href="/fleet" className="hero-link">View Fleet <ArrowRight size={15}/></Link></div></div><div className="quick-panel panel"><h3>Quick Actions</h3>{["Start New Inspection","Create Parts Request","Generate Report","Ask Technical Assistant","Upload Document"].map((x,i) => <button key={x} onClick={() => toast(`${x} is ready to configure`)}><span>{[ClipboardCheck, Box, FileText, Sparkles, Download][i] && (() => { const I = [ClipboardCheck, Box, FileText, Sparkles, Download][i]; return <I size={16}/> })()}</span>{x}<ArrowRight size={14}/></button>)}</div><div className="activity-panel panel"><div className="panel-title"><h3>Recent Activity</h3><button>View All →</button></div>{["Inspection Completed","New Finding Created","Report Approved","Parts Request Updated","Document Indexed"].map((x,i) => <div className="activity-row" key={x}><span className={`activity-icon a${i}`}><Check size={14}/></span><div><strong>{x}</strong><small>{["A-Check • RP-C9923","Finding #03 • RP-C8841","RP-C7712 • C-Check","Hydraulic Pump • PR-1042","AMM 72-21-00"][i]}</small></div><time>{["2h ago","3h ago","4h ago","5h ago","6h ago"][i]}</time></div>)}</div></div><div className="lower-grid"><div className="chart-card panel"><h3>Inspection Status</h3><div className="donut large"><div><strong>12</strong><span>Active</span></div></div><div className="chart-legend"><p><i className="blue"/>In Progress <b>5</b></p><p><i className="violet"/>Scheduled <b>4</b></p><p><i className="green"/>Awaiting QA <b>2</b></p><p><i className="gray"/>Completed <b>31</b></p></div></div><div className="chart-card panel"><h3>Compliance Overview</h3><div className="donut compliance-donut"><div><strong>98.4%</strong><span>Overall</span></div></div><div className="chart-legend"><p><i className="green"/>Compliant <b>39</b></p><p><i className="amber"/>Due Soon <b>2</b></p><p><i className="red"/>Overdue <b>1</b></p><small>Total AD/SB <b>42</b></small></div></div><div className="upcoming panel"><div className="panel-title"><h3>Upcoming Inspections</h3><button>View All →</button></div>{["RP-C9923","RP-C7712","RP-C8841","RP-C9912"].map((x,i) => <div className="upcoming-row" key={x}><Plane size={16}/><div><strong>{x}</strong><span>{["A-Check","Engine Inspection","B-Check","Landing Gear"][i]}</span></div><time>{["May 28, 2026","May 28, 2026","Jun 02, 2026","Jun 10, 2026"][i]}</time><em>{i < 2 ? "Scheduled" : "Planned"}</em></div>)}</div></div></>;
}

function LoginPage() {
  const [, navigate] = useLocation(); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  return <div className="login-page"><div className="login-photo"/><div className="login-stripes"/><div className="login-card"><BrandMark/><div className="login-rule"/><h1><span>WingBox</span> <b>Nexus</b></h1><p>Moving Toward Excellence — Digitally.</p><label>Email address<div className="input-icon"><UserRound size={16}/><input value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your work email"/></div></label><label>Password<div className="input-icon"><LockKeyhole size={16}/><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"/></div></label><button className="forgot" onClick={() => toast("Password reset link requested")}>Forgot password?</button><button className="primary-button login-button" onClick={() => navigate("/dashboard")}>Sign in <ArrowRight size={16}/></button><div className="or"><span/>or<span/></div><button className="role-login" onClick={() => navigate("/dashboard")}><UserRound size={17}/> Engineer / Client / Admin login</button></div></div>;
}

function App() { return <><Toaster position="bottom-right"/><Switch><Route path="/login" component={LoginPage}/><Route path="/" component={() => <Layout><FleetPage/></Layout>}/><Route path="/fleet" component={() => <Layout><FleetPage/></Layout>}/><Route path="/dashboard" component={() => <Layout><DashboardPage/></Layout>}/><Route component={() => <Layout><FleetPage/></Layout>}/></Switch></>; }
export default App;
