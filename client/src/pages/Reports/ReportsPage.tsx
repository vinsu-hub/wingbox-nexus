import { useEffect, useState } from "react";
import { animate, motion, useAnimate, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Plane,
  Search,
  ShieldCheck,
  Wrench,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { aircraft } from "@/data/aircraft";
import { reports, reportsSnapshot, type Report } from "@/data/mock/reports";
import { SummaryCardRow } from "@/components/shared/SummaryCardRow";
import {
  FilterableTable,
  type TableColumn,
} from "@/components/shared/FilterableTable";
import { StatusPill } from "@/components/shared/StatusPill";
import { SidePanel } from "@/components/shared/SideRail";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const types: Report["type"][] = [
  "Maintenance",
  "Compliance",
  "Fleet",
  "Findings",
  "Life Tracking",
  "Damage/3D",
];
const tabs = [
  "All Reports",
  "Maintenance",
  "Compliance",
  "Flight Operations",
  "Custom",
];
const icons = {
  Maintenance: Wrench,
  Compliance: ShieldCheck,
  Fleet: Plane,
  Findings: FileText,
  "Life Tracking": BookOpen,
  "Damage/3D": ShieldCheck,
};
const typeClass = (type: Report["type"]) =>
  type.toLowerCase().replace(/[^a-z]+/g, "-");
const timestamp = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
const thisMonth = reports.filter(r => r.generatedAt.startsWith("2026-05"));
const lastMonth = reports.filter(r => r.generatedAt.startsWith("2026-04"));
const priorReports = reports.filter(r => r.generatedAt < "2026-05-01");
const sumDownloads = (rows: Report[]) =>
  rows.reduce((sum, row) => sum + row.downloads, 0);
const totals = [
  reports.length,
  thisMonth.length,
  reports.filter(r => r.status === "In Progress").length,
  sumDownloads(reports),
];
const previous = [
  priorReports.length,
  lastMonth.length,
  priorReports.filter(r => r.status === "In Progress").length,
  sumDownloads(priorReports),
];
const delta = (value: number, before: number) =>
  `${value >= before ? "↑" : "↓"} ${Math.abs(value - before)} vs. last month`;
const recent = [...reports]
  .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
  .slice(0, 4);
const requestReport = (type: string) =>
  toast.info(`${type} report generation is coming soon.`, {
    description: "This demo does not generate or save reports.",
  });

export function ReportsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All Types");
  const [tail, setTail] = useState("All Aircraft");
  const [range, setRange] = useState("6");
  const [status, setStatus] = useState("All Statuses");
  const [author, setAuthor] = useState("All Authors");
  const [tab, setTab] = useState("All Reports");
  const [page, setPage] = useState(1);
  const [progress, setProgress] = useState(0);
  const reduced = useReducedMotion();
  const [scope, animateRows] = useAnimate();
  useEffect(() => {
    if (reduced) {
      setProgress(1);
      return;
    }
    const animation = animate(0, 1, {
      duration: 0.85,
      ease: "easeOut",
      onUpdate: setProgress,
    });
    return () => animation.stop();
  }, [reduced]);
  useEffect(() => {
    if (!reduced)
      animateRows(".table-wrap", { opacity: [0.25, 1] }, { duration: 0.25 });
  }, [tab, reduced, animateRows]);
  const change = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };
  const cutoff = new Date(
    Date.UTC(
      reportsSnapshot.getUTCFullYear(),
      reportsSnapshot.getUTCMonth() - Number(range) + 1,
      1
    )
  );
  const filtered = reports.filter(report => {
    const plane = aircraft.find(a => a.tail === report.tail);
    const query = search.trim().toLowerCase();
    const matchesTab =
      tab === "All Reports" ||
      (tab === "Flight Operations"
        ? report.type === "Fleet"
        : tab === "Custom"
          ? ["Findings", "Life Tracking", "Damage/3D"].includes(report.type)
          : report.type === tab);
    return (
      matchesTab &&
      (type === "All Types" || report.type === type) &&
      (tail === "All Aircraft" || report.tail === tail) &&
      (status === "All Statuses" || report.status === status) &&
      (author === "All Authors" || report.generatedBy === author) &&
      (range === "all" || new Date(report.generatedAt) >= cutoff) &&
      `${report.name} ${report.subtitle} ${report.type} ${report.tail} ${plane?.type ?? ""} ${report.generatedBy}`
        .toLowerCase()
        .includes(query)
    );
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * 8, currentPage * 8);
  const columns: TableColumn<Report>[] = [
    {
      key: "name",
      header: "Report Name",
      render: report => {
        const Icon = icons[report.type];
        return (
          <div className="report-name">
            <Icon size={21} />
            <div>
              <strong>{report.name}</strong>
              <small>{report.subtitle}</small>
            </div>
          </div>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      render: report => (
        <Badge
          className={`report-type-tag report-type-${typeClass(report.type)}`}
        >
          {report.type}
        </Badge>
      ),
    },
    {
      key: "tail",
      header: "Aircraft / Tail Number",
      render: report => (
        <span>
          {report.tail === "All Aircraft" ? (
            report.tail
          ) : (
            <>
              {aircraft.find(a => a.tail === report.tail)?.type}
              <small>{report.tail}</small>
            </>
          )}
        </span>
      ),
    },
    {
      key: "range",
      header: "Date Range",
      render: report => report.dateRangeLabel,
    },
    {
      key: "status",
      header: "Status",
      render: report => <StatusPill status={report.status} />,
    },
    {
      key: "author",
      header: "Generated By",
      render: report => (
        <>
          <span>{report.generatedBy}</span>
          <small>{timestamp(report.generatedAt)} UTC</small>
        </>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: report => (
        <button
          className="report-download"
          aria-label={`Download ${report.name}`}
          disabled={report.status !== "Completed"}
          onClick={() =>
            toast.info(`Download preview: ${report.name}`, {
              description:
                "Report downloads will be available when generation is connected.",
            })
          }
        >
          <Download size={15} />
        </button>
      ),
    },
  ];
  return (
    <div className="reports-page">
      <div className="reports-layout">
        <main className="reports-main">
          <div className="reports-breadcrumb">
            Reports <span>/</span> Report
          </div>
          <div className="page-heading">
            <div>
              <h1>Reports</h1>
              <p>
                View, generate, and manage reports for your fleet, maintenance,
                and compliance operations.
              </p>
            </div>
          </div>
          <SummaryCardRow
            cards={[
              {
                icon: FileText,
                label: "Total Reports",
                value: String(Math.round(totals[0] * progress)),
                trend: delta(totals[0], previous[0]),
              },
              {
                icon: CalendarDays,
                label: "Generated This Month",
                value: String(Math.round(totals[1] * progress)),
                trend: delta(totals[1], previous[1]),
              },
              {
                icon: Clock3,
                label: "Pending Generation",
                value: String(Math.round(totals[2] * progress)),
                tone: "amber",
                trend: delta(totals[2], previous[2]),
              },
              {
                icon: Download,
                label: "Total Downloads",
                value: String(Math.round(totals[3] * progress)),
                trend: delta(totals[3], previous[3]),
              },
            ]}
          />
          <p className="reports-snapshot">
            Demo snapshot · May 31, 2026 · Dates shown in UTC
          </p>
          <Tabs
            value={tab}
            onValueChange={change(setTab)}
            className="reports-table panel"
          >
            <div
              ref={scope}
              onMouseOver={event => {
                const row = (event.target as HTMLElement).closest("tbody tr");
                if (row && !reduced)
                  animateRows(row, { y: -2 }, { duration: 0.15 });
              }}
              onMouseOut={event => {
                const row = (event.target as HTMLElement).closest("tbody tr");
                if (
                  row &&
                  !row.contains(event.relatedTarget as Node) &&
                  !reduced
                )
                  animateRows(row, { y: 0 }, { duration: 0.15 });
              }}
            >
              <FilterableTable
                columns={columns}
                rows={rows}
                getRowId={report => report.id}
                filters={
                  <>
                    <div className="reports-filter-controls">
                      <label className="table-search">
                        <Search size={16} />
                        <input
                          aria-label="Search reports"
                          placeholder="Search reports by name, type, aircraft or tail number…"
                          value={search}
                          onChange={event =>
                            change(setSearch)(event.target.value)
                          }
                        />
                      </label>
                      <label>
                        Report Type
                        <select
                          value={type}
                          onChange={event =>
                            change(setType)(event.target.value)
                          }
                        >
                          <option>All Types</option>
                          {types.map(value => (
                            <option key={value}>{value}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Aircraft
                        <select
                          value={tail}
                          onChange={event =>
                            change(setTail)(event.target.value)
                          }
                        >
                          <option>All Aircraft</option>
                          {aircraft.map(plane => (
                            <option key={plane.tail}>{plane.tail}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Date Range
                        <select
                          value={range}
                          onChange={event =>
                            change(setRange)(event.target.value)
                          }
                        >
                          <option value="6">Last 6 Months</option>
                          <option value="1">This Month</option>
                          <option value="3">Last 3 Months</option>
                          <option value="all">All Dates</option>
                        </select>
                      </label>
                      <button
                        className="primary-button"
                        onClick={() =>
                          requestReport(type === "All Types" ? "Fleet" : type)
                        }
                      >
                        <FileText size={15} />
                        Generate Report
                      </button>
                    </div>
                    <details className="reports-extra-filters">
                      <summary>
                        More filters · Status &amp; Generated By
                      </summary>
                      <div>
                        <label>
                          Status
                          <select
                            value={status}
                            onChange={event =>
                              change(setStatus)(event.target.value)
                            }
                          >
                            <option>All Statuses</option>
                            <option>Completed</option>
                            <option>In Progress</option>
                          </select>
                        </label>
                        <label>
                          Generated By
                          <select
                            value={author}
                            onChange={event =>
                              change(setAuthor)(event.target.value)
                            }
                          >
                            <option>All Authors</option>
                            {Array.from(
                              new Set(reports.map(r => r.generatedBy))
                            ).map(name => (
                              <option key={name}>{name}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </details>
                    <TabsList
                      aria-label="Report categories"
                      className="reports-tabs"
                    >
                      {tabs.map(value => (
                        <TabsTrigger key={value} value={value}>
                          {value}
                          {tab === value && (
                            <motion.span
                              className="reports-tab-underline"
                              layoutId="reports-tab-underline"
                              transition={{ duration: reduced ? 0 : 0.2 }}
                            />
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {tab === "Custom" && (
                      <p className="reports-custom-note">
                        Specialist reports: Findings, Life Tracking and
                        Damage/3D.
                      </p>
                    )}
                  </>
                }
                emptyMessage="No reports match these filters. Try another category or date range."
                footer={
                  <div className="table-footer">
                    <span role="status">
                      Showing {filtered.length ? (currentPage - 1) * 8 + 1 : 0}–
                      {Math.min(currentPage * 8, filtered.length)} of{" "}
                      {filtered.length} reports
                    </span>
                    <div className="pagination">
                      <button
                        aria-label="Previous page"
                        disabled={currentPage === 1}
                        onClick={() => setPage(currentPage - 1)}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      {Array.from({ length: pageCount }, (_, index) => (
                        <button
                          key={index}
                          aria-label={`Page ${index + 1}`}
                          aria-current={
                            currentPage === index + 1 ? "page" : undefined
                          }
                          className={currentPage === index + 1 ? "current" : ""}
                          onClick={() => setPage(index + 1)}
                        >
                          {index + 1}
                        </button>
                      ))}
                      <button
                        aria-label="Next page"
                        disabled={currentPage === pageCount}
                        onClick={() => setPage(currentPage + 1)}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                }
              />
            </div>
          </Tabs>
        </main>
        <aside className="reports-rail">
          <SidePanel title="Quick Actions" className="report-quick-actions">
            {[
              "Maintenance",
              "Compliance",
              "Fleet Utilization",
              "Findings",
              "Custom",
            ].map((name, index) => {
              const Icon = [Wrench, ShieldCheck, Plane, FileText, Zap][index];
              return (
                <motion.button
                  key={name}
                  whileHover={reduced ? undefined : { x: 4 }}
                  onClick={() => requestReport(name)}
                >
                  <Icon size={16} />
                  <span>Generate {name} Report</span>
                  <ChevronRight size={14} />
                </motion.button>
              );
            })}
          </SidePanel>
          <SidePanel title="Report Types" className="report-types-panel">
            {types.map(type => {
              const Icon = icons[type];
              return (
                <div key={type}>
                  <Icon size={17} />
                  <span>{type === "Damage/3D" ? "Damage / 3D" : type}</span>
                  <strong>
                    {reports.filter(report => report.type === type).length}
                  </strong>
                </div>
              );
            })}
          </SidePanel>
          <SidePanel title="Recent Activity" className="report-activity-panel">
            {recent.map(report => (
              <div key={report.id}>
                <i />
                <div>
                  <strong>{report.name}</strong>
                  <span>{timestamp(report.generatedAt)} UTC</span>
                </div>
              </div>
            ))}
          </SidePanel>
          <div className="report-custom-card">
            <FileText size={25} />
            <div>
              <h3>Need a custom report?</h3>
              <p>
                Create a tailored report with specific filters and parameters.
              </p>
              <button
                onClick={() =>
                  toast.info("Custom report requests are coming soon.", {
                    description: "This demo does not submit a request.",
                  })
                }
              >
                Request Custom Report
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
