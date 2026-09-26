import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
} from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  PlayCircle,
  Plus,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { SummaryCardRow } from "@/components/shared/SummaryCardRow";
import {
  FilterableTable,
  type TableColumn,
} from "@/components/shared/FilterableTable";
import {
  EventRow,
  FeaturedCard,
  SidePanel,
} from "@/components/shared/SideRail";
import { Progress } from "@/components/ui/progress";
import { QcChecklistBadge } from "@/pages/QaQc/QcChecklistBadge";
import { aircraft } from "@/data/aircraft";
import {
  inspectionAsOf,
  inspections,
  type Inspection,
} from "@/data/mock/inspections";

const statuses: Inspection["status"][] = [
  "Scheduled",
  "In Progress",
  "Completed",
  "Overdue",
];
const tones = {
  Scheduled: "blue",
  "In Progress": "amber",
  Completed: "green",
  Overdue: "red",
} as const;
const dateOf = (date: string) => new Date(`${date}T12:00:00`);
const formatDate = (date: string) =>
  dateOf(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const monthKey = inspectionAsOf.slice(0, 7);

export function InspectionsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const [range, setRange] = useState("all");
  const [selected, setSelected] = useState(inspections[0].id);
  const [month, setMonth] = useState(new Date(`${monthKey}-01T12:00:00`));
  const [direction, setDirection] = useState(1);
  const [scope, animate] = useAnimate();
  const reducedMotion = useReducedMotion();
  const rows = inspections.filter(row => {
    const query = search.trim().toLowerCase();
    const matchesSearch = `${row.tail} ${row.checkType} ${row.inspector}`
      .toLowerCase()
      .includes(query);
    const dayDifference =
      (dateOf(row.scheduledDate).getTime() - dateOf(inspectionAsOf).getTime()) /
      86400000;
    return (
      matchesSearch &&
      (status === "All Statuses" || row.status === status) &&
      (range === "all" ||
        (range === "month" && row.scheduledDate.startsWith(monthKey)) ||
        (range === "week" && dayDifference >= 0 && dayDifference < 7))
    );
  });
  const selectedInspection =
    inspections.find(row => row.id === selected) ?? inspections[0];
  const featured = aircraft.find(
    plane => plane.tail === selectedInspection.tail
  )!;
  const upcoming = inspections
    .filter(
      row => row.status === "Scheduled" && row.scheduledDate >= inspectionAsOf
    )
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 4);
  const filterKey = `${search}|${status}|${range}`;

  // Animate the shared table's actual rows without changing its public API.
  useEffect(() => {
    const tableRows = scope.current?.querySelectorAll("tbody tr") as
      | NodeListOf<HTMLTableRowElement>
      | undefined;
    const cleanups: (() => void)[] = [];
    tableRows?.forEach(row => {
      const enter = () => {
        void animate(
          row,
          { y: reducedMotion ? 0 : -2, backgroundColor: "var(--sky)" },
          { duration: 0.15, ease: "easeOut" }
        );
      };
      const leave = () => {
        void animate(
          row,
          {
            y: 0,
            backgroundColor: row.classList.contains("selected-row")
              ? "var(--sky)"
              : "var(--card)",
          },
          { duration: 0.15, ease: "easeOut" }
        );
      };
      row.addEventListener("mouseenter", enter);
      row.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        row.removeEventListener("mouseenter", enter);
        row.removeEventListener("mouseleave", leave);
      });
    });
    return () => cleanups.forEach(cleanup => cleanup());
  }, [filterKey, selected, animate, reducedMotion, scope]);

  const columns: TableColumn<Inspection>[] = [
    {
      key: "aircraft",
      header: "Aircraft",
      render: row => (
        <button
          className="inspection-aircraft"
          onClick={() => setSelected(row.id)}
          aria-label={`Feature ${row.tail}`}
        >
          <strong>{row.tail}</strong>
          <small>{aircraft.find(plane => plane.tail === row.tail)?.type}</small>
        </button>
      ),
    },
    { key: "check", header: "Check Type", render: row => row.checkType },
    {
      key: "inspector",
      header: "Assigned Inspector",
      render: row => (
        <div className="inspection-inspector">
          <span className="inspection-avatar">
            {row.inspector
              .split(" ")
              .map(name => name[0])
              .slice(0, 2)
              .join("")}
          </span>
          {row.inspector}
        </div>
      ),
    },
    {
      key: "date",
      header: "Scheduled Date",
      render: row => (
        <time dateTime={row.scheduledDate}>
          {formatDate(row.scheduledDate)}
        </time>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: row => (
        <motion.span
          key={`${row.id}-${filterKey}`}
          className={`inspection-status inspection-${tones[row.status]}`}
          initial={{ opacity: 0.35, color: "var(--muted)" }}
          animate={{ opacity: 1, color: `var(--${tones[row.status]})` }}
          transition={{ duration: reducedMotion ? 0 : 0.15 }}
        >
          {row.status}
        </motion.span>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      render: row => (
        <div className={`inspection-progress inspection-${tones[row.status]}`}>
          <Progress
            value={row.progress * 100}
            aria-label={`${row.tail} inspection progress`}
          />
          <span>{Math.round(row.progress * 100)} / 100</span>
        </div>
      ),
    },
  ];
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const monthId = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const moveMonth = (step: number) => {
    setDirection(step);
    setMonth(
      current => new Date(current.getFullYear(), current.getMonth() + step, 1)
    );
  };

  return (
    <div className="inspections-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <ClipboardCheck size={14} /> INSPECTIONS
          </div>
          <h1>Inspections</h1>
          <p>Manage, monitor, and track all inspections across your fleet.</p>
        </div>
        <button
          className="primary-button"
          onClick={() =>
            toast.info(
              "Inspection scheduling is coming soon. No inspection has been created."
            )
          }
        >
          <Plus size={15} /> Schedule Inspection
        </button>
      </div>
      <p className="inspection-snapshot">
        Demo schedule · As of {formatDate(inspectionAsOf)}
      </p>
      <div className="inspections-layout">
        <div className="inspections-main">
          <SummaryCardRow
            cards={[
              {
                icon: CalendarDays,
                label: "Scheduled",
                value: String(
                  inspections.filter(row => row.status === "Scheduled").length
                ),
                foot: "Awaiting inspection",
                tone: "blue",
              },
              {
                icon: PlayCircle,
                label: "In Progress",
                value: String(
                  inspections.filter(row => row.status === "In Progress").length
                ),
                foot: "Currently underway",
                tone: "amber",
              },
              {
                icon: CheckCircle2,
                label: "Completed This Month",
                value: String(
                  inspections.filter(
                    row =>
                      row.status === "Completed" &&
                      row.scheduledDate.startsWith(monthKey)
                  ).length
                ),
                foot: "May 2026",
                tone: "green",
              },
              {
                icon: AlertTriangle,
                label: "Overdue",
                value: String(
                  inspections.filter(row => row.status === "Overdue").length
                ),
                foot: "Requires attention",
                tone: "red",
              },
            ]}
          />
          <div className="panel inspections-table" ref={scope}>
            <FilterableTable
              columns={columns}
              rows={rows}
              getRowId={row => row.id}
              selectedId={selected}
              onRowClick={row => setSelected(row.id)}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search aircraft, check type, inspector…"
              filters={
                <>
                  <select
                    aria-label="Inspection status"
                    value={status}
                    onChange={event => setStatus(event.target.value)}
                  >
                    <option>All Statuses</option>
                    {statuses.map(value => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Inspection date range"
                    value={range}
                    onChange={event => setRange(event.target.value)}
                  >
                    <option value="all">All Dates</option>
                    <option value="month">May 2026</option>
                    <option value="week">Next 7 Days</option>
                  </select>
                </>
              }
              emptyMessage="No inspections match your filters."
              footer={
                <div className="inspection-table-footer">
                  Showing {rows.length} of {inspections.length} inspections{" "}
                  <button
                    onClick={() => {
                      setSearch("");
                      setStatus("All Statuses");
                      setRange("all");
                    }}
                  >
                    Reset filters
                  </button>
                </div>
              }
            />
          </div>
        </div>
        <aside className="inspections-rail">
          <SidePanel title="Featured Aircraft">
            <FeaturedCard
              image="/assets/wingbox-aircraft-hero.jpg"
              alt="Aircraft on the apron"
              title={featured.tail}
              subtitle={`${featured.type} · ${featured.client}`}
            />
            <Link
              className="inspection-record-link"
              href={`/fleet/${featured.tail}`}
            >
              View Aircraft Record <ArrowRight size={13} />
            </Link>
            <QcChecklistBadge linkedEntityType="inspection" linkedEntityId={selectedInspection.id} />
          </SidePanel>
          <SidePanel
            title="Upcoming Inspections"
            onViewAll={() => {
              setSearch("");
              setStatus("Scheduled");
              setRange("all");
            }}
          >
            {upcoming.map(row => (
              <EventRow
                key={row.id}
                event={{
                  date: dateOf(row.scheduledDate)
                    .toLocaleDateString("en-US", { month: "short" })
                    .toUpperCase(),
                  day: String(dateOf(row.scheduledDate).getDate()),
                  title: row.checkType,
                  meta: `${row.tail} · ${aircraft.find(plane => plane.tail === row.tail)?.type}`,
                  tag: row.status,
                  tone: tones[row.status],
                }}
              />
            ))}
          </SidePanel>
          <SidePanel
            title="Inspection Calendar"
            className="inspection-calendar"
          >
            <div className="inspection-calendar-heading">
              <strong aria-live="polite">
                {month.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </strong>
              <div>
                <button
                  aria-label="Previous month"
                  onClick={() => moveMonth(-1)}
                >
                  <ChevronLeft size={15} />
                </button>
                <button aria-label="Next month" onClick={() => moveMonth(1)}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
            <div className="inspection-weekdays">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={monthId}
                className="inspection-calendar-grid"
                initial={{ opacity: 0, x: reducedMotion ? 0 : direction * 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: reducedMotion ? 0 : direction * -18 }}
                transition={{ duration: 0.15 }}
              >
                {Array.from(
                  { length: Math.ceil((firstDay + days) / 7) * 7 },
                  (_, index) => {
                    const day = index - firstDay + 1;
                    if (day < 1 || day > days)
                      return <span key={`blank-${index}`} />;
                    const date = `${monthId}-${String(day).padStart(2, "0")}`;
                    const events = inspections.filter(
                      row => row.scheduledDate === date
                    );
                    return (
                      <div
                        key={date}
                        className={`calendar-day ${date === inspectionAsOf ? "calendar-today" : ""}`}
                        title={events
                          .map(
                            row =>
                              `${row.tail}: ${row.checkType} (${row.status})`
                          )
                          .join("\n")}
                        aria-label={`${formatDate(date)}${events.length ? `: ${events.map(row => `${row.tail} ${row.status}`).join(", ")}` : ": No inspections"}`}
                      >
                        <span>{day}</span>
                        <div className="calendar-markers">
                          {Array.from(
                            new Set(events.map(row => row.status))
                          ).map(value => (
                            <i
                              key={value}
                              className={`inspection-${tones[value]}`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </motion.div>
            </AnimatePresence>
            <div className="inspection-calendar-legend">
              {statuses.map(value => (
                <span key={value}>
                  <i className={`inspection-${tones[value]}`} />
                  {value}
                </span>
              ))}
            </div>
          </SidePanel>
        </aside>
      </div>
    </div>
  );
}
