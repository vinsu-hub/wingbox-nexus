import { useEffect, useMemo, useState } from "react";
import { animate, motion, useAnimate, useReducedMotion } from "framer-motion";
import { BarChart3, ChevronRight, Eye, FileText, LayoutTemplate, Plus, Presentation as PresentationIcon, Share2, Users } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { aircraft } from "@/data/aircraft";
import { presentations, type Presentation } from "@/data/mock/presentations";
import { ROUTES } from "@/routes";
import { SummaryCardRow } from "@/components/shared/SummaryCardRow";
import { FilterableTable, type TableColumn } from "@/components/shared/FilterableTable";
import { SidePanel } from "@/components/shared/SideRail";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = ["All Presentations", "My Presentations", "Shared With Me", "Templates"] as const;
const typeIcon = { Maintenance: FileText, Compliance: BarChart3, Operational: PresentationIcon, Findings: FileText, Finance: BarChart3 };
const typeClass = (type: Presentation["type"]) => type.toLowerCase();
const dateLabel = (date: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(date));

export function PresentationsPage() {
  const [, navigate] = useLocation();
  const reduced = useReducedMotion();
  const [search, setSearch] = useState("");
  const [aircraftFilter, setAircraftFilter] = useState("All Aircraft");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [authorFilter, setAuthorFilter] = useState("All Creators");
  const [tab, setTab] = useState<(typeof tabs)[number]>(tabs[0]);
  const [countProgress, setCountProgress] = useState(0);
  const [tableScope, animateRows] = useAnimate();
  useEffect(() => {
    if (reduced) return setCountProgress(1);
    const controls = animate(0, 1, { duration: .7, ease: "easeOut", onUpdate: setCountProgress });
    return () => controls.stop();
  }, [reduced]);
  const featured = presentations.find(presentation => presentation.linksToInspectionPresentation)!;
  const templateCount = presentations.filter(presentation => presentation.title.includes("Template")).length;
  const sharedThisMonth = presentations.filter(presentation => presentation.lastModifiedAt.startsWith("2026-05")).length;
  const totalViewers = presentations.reduce((total, presentation) => total + presentation.views, 0);
  const openPresentation = (presentation: Presentation) => {
    if (presentation.linksToInspectionPresentation) navigate(ROUTES.inspectionPresentation());
    else toast.info(`Presentation preview: ${presentation.title}`, { description: "Additional presentation detail views are coming soon." });
  };
  const filtered = useMemo(() => presentations.filter(presentation => {
    const query = search.trim().toLowerCase();
    const matchesTab = tab === "All Presentations" || (tab === "My Presentations" && presentation.createdBy === "Maria Santos") || (tab === "Shared With Me" && presentation.lastModifiedAt.startsWith("2026-05")) || (tab === "Templates" && presentation.title.includes("Template"));
    return matchesTab && (aircraftFilter === "All Aircraft" || presentation.tail === aircraftFilter) && (typeFilter === "All Types" || presentation.type === typeFilter) && (authorFilter === "All Creators" || presentation.createdBy === authorFilter) && `${presentation.title} ${presentation.subtitle} ${presentation.type} ${presentation.tail} ${presentation.createdBy}`.toLowerCase().includes(query);
  }), [aircraftFilter, authorFilter, search, tab, typeFilter]);
  const columns: TableColumn<Presentation>[] = [
    { key: "title", header: "Title", render: presentation => { const Icon = typeIcon[presentation.type]; return <div className="presentation-title"><span className="presentation-thumbnail"><Icon size={18} /></span><div><strong>{presentation.title}</strong><small>{presentation.subtitle}</small></div></div>; } },
    { key: "type", header: "Type", render: presentation => <Badge className={`presentation-type presentation-type-${typeClass(presentation.type)}`}>{presentation.type}</Badge> },
    { key: "aircraft", header: "Aircraft / Tail Number", render: presentation => presentation.tail === "All Aircraft" ? <span>All Aircraft</span> : <><span>{aircraft.find(plane => plane.tail === presentation.tail)?.type}</span><small>{presentation.tail}</small></> },
    { key: "createdBy", header: "Created By", render: presentation => presentation.createdBy },
    { key: "modified", header: "Last Modified", render: presentation => dateLabel(presentation.lastModifiedAt) },
    { key: "views", header: "Views", render: presentation => <span className="presentation-views"><Eye size={13} />{presentation.views}</span> },
    { key: "actions", header: "Actions", render: presentation => <button className="presentation-view-button" aria-label={`View ${presentation.title}`} onClick={event => { event.stopPropagation(); openPresentation(presentation); }}>View</button> },
  ];
  return (
    <div className="presentations-page">
      <div className="presentations-layout">
        <main className="presentations-main">
          <div className="presentations-breadcrumb">Reports <span>/</span> Presentations</div>
          <div className="page-heading"><div><h1>Presentations</h1><p>Create, manage, and share professional presentations for maintenance, compliance, and operations.</p></div></div>
          <SummaryCardRow cards={[
            { icon: PresentationIcon, label: "Total Presentations", value: String(Math.round(presentations.length * countProgress)), trend: "↑ 12%" },
            { icon: Share2, label: "Shared This Month", value: String(Math.round(sharedThisMonth * countProgress)), tone: "green", trend: "↑ 33%" },
            { icon: LayoutTemplate, label: "Templates Available", value: String(Math.round(templateCount * countProgress)), tone: "violet", trend: "No change" },
            { icon: Users, label: "Total Viewers", value: String(Math.round(totalViewers * countProgress)), tone: "amber", trend: "↑ 24%" },
          ]} />
          <Tabs value={tab} onValueChange={value => setTab(value as (typeof tabs)[number])} className="presentations-table panel">
            <motion.div ref={tableScope} key={tab} initial={reduced ? false : { opacity: .35 }} animate={{ opacity: 1 }} transition={{ duration: .2 }} onMouseOver={event => { const row = (event.target as HTMLElement).closest("tbody tr"); if (row && !reduced) animateRows(row, { y: -2 }, { duration: .15 }); }} onMouseOut={event => { const row = (event.target as HTMLElement).closest("tbody tr"); if (row && !row.contains(event.relatedTarget as Node) && !reduced) animateRows(row, { y: 0 }, { duration: .15 }); }}>
              <FilterableTable columns={columns} rows={filtered} getRowId={presentation => presentation.id} onRowClick={openPresentation} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search presentations..." filters={<>
                <select aria-label="Filter by aircraft" value={aircraftFilter} onChange={event => setAircraftFilter(event.target.value)}><option>All Aircraft</option>{aircraft.map(plane => <option key={plane.tail}>{plane.tail}</option>)}</select>
                <select aria-label="Filter by type" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option>All Types</option>{Object.keys(typeIcon).map(type => <option key={type}>{type}</option>)}</select>
                <select aria-label="Filter by creator" value={authorFilter} onChange={event => setAuthorFilter(event.target.value)}><option>All Creators</option>{Array.from(new Set(presentations.map(presentation => presentation.createdBy))).map(author => <option key={author}>{author}</option>)}</select>
                <button className="primary-button presentation-create" onClick={() => toast.info("Create presentation", { description: "Presentation authoring will be available soon." })}><Plus size={15} /> Create Presentation</button>
                <TabsList aria-label="Presentation categories" className="presentations-tabs">{tabs.map(value => <TabsTrigger key={value} value={value}>{value}</TabsTrigger>)}</TabsList>
              </>} emptyMessage="No presentations match these filters." />
            </motion.div>
          </Tabs>
        </main>
        <aside className="presentations-rail">
          <section className="featured-presentation-card"><img src="/assets/wingbox-aircraft-hero.jpg" alt="Aircraft in flight" /><div className="featured-presentation-copy"><span>FEATURED PRESENTATION</span><h2>{featured.title}</h2><p>{featured.type} · {featured.tail}</p><p className="featured-description">{featured.subtitle}</p><button className="primary-button" onClick={() => openPresentation(featured)}>View Presentation <ChevronRight size={14} /></button></div></section>
          <SidePanel title="Quick Actions" className="presentation-quick-actions">{[[Plus, "Create New Presentation"], [LayoutTemplate, "Browse Templates"], [Share2, "Share Presentation"], [PresentationIcon, "View All Presentations"]].map(([Icon, label]) => { const ActionIcon = Icon as typeof Plus; return <button key={label as string} onClick={() => toast.info(`${label} is ready to configure`)}><ActionIcon size={16} /><span>{label as string}</span><ChevronRight size={14} /></button>; })}</SidePanel>
          <SidePanel title="Recent Activity" className="presentation-activity-panel">{[["MS", "Maria Santos shared", "A320 - 6 Month Inspection Summary", "10 min ago"], ["JR", "James Rivera updated", "Fleet Compliance Review", "1h ago"], ["AC", "Angela Cruz created", "ATR 72 Reliability Briefing", "3h ago"], ["DL", "Daniel Lim viewed", "Maintenance Cost Outlook", "Yesterday"]].map(([initials, action, target, time], index) => <div className="activity-row" key={target}><span className={`activity-icon a${index}`}>{initials}</span><div><strong>{action} <b>{target}</b></strong><small>Presentation activity</small></div><time>{time}</time></div>)}</SidePanel>
        </aside>
      </div>
    </div>
  );
}
