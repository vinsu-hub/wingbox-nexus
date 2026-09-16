import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Plane,
  RotateCw,
} from "lucide-react";
import { Link } from "wouter";
import { aircraft } from "@/data/aircraft";
import { lifeComponents, type LifeComponent } from "@/data/mock/life-tracking";
import {
  FilterableTable,
  type TableColumn,
} from "@/components/shared/FilterableTable";
import {
  DonutChart,
  DonutLegend,
  type DonutSegment,
} from "@/components/shared/DonutChart";
import { SidePanel } from "@/components/shared/SideRail";
import { StatusPill } from "@/components/shared/StatusPill";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type Unit = "Hours" | "Cycles" | "Days";
const units: Unit[] = ["Hours", "Cycles", "Days"];
const unitSuffix: Record<Unit, string> = {
  Hours: "FH",
  Cycles: "FC",
  Days: "days",
};
const dateLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function LifeProgress({ row }: { row: LifeComponent }) {
  const [value, setValue] = useState(0);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const animation = animate(0, Math.min(row.lifeUsedPct, 100), {
      duration: reducedMotion ? 0 : 0.65,
      onUpdate: setValue,
    });
    return () => animation.stop();
  }, [row.lifeUsedPct, reducedMotion]);
  return (
    <div
      className={`life-progress life-${row.status.toLowerCase().replace(" ", "-")}`}
    >
      <Progress
        value={value}
        aria-label={`${row.component} life used`}
        aria-valuenow={Math.min(row.lifeUsedPct, 100)}
        aria-valuetext={`${row.lifeUsedPct}% used`}
      />
      <span>{row.lifeUsedPct}%</span>
    </div>
  );
}

export function LifeTrackingView({ tailNumber }: { tailNumber?: string }) {
  const [unit, setUnit] = useState<Unit>("Hours");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [client, setClient] = useState("");
  const [status, setStatus] = useState("");
  const [scheduling, setScheduling] = useState<LifeComponent | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduled, setScheduled] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const scoped = lifeComponents.filter(
    row => !tailNumber || row.tail === tailNumber
  );
  const risks = [...scoped]
    .filter(row => row.lifeUsedPct >= 90 || row.status === "Overdue")
    .sort((a, b) => b.lifeUsedPct - a.lifeUsedPct);
  const ranking = [...scoped]
    .sort((a, b) => b.lifeUsedPct - a.lifeUsedPct)
    .slice(0, 5);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 30);
  const upcoming = scoped
    .filter(row => {
      const due = new Date(`${row.nextDue}T00:00:00`);
      return due >= today && due <= horizon;
    })
    .sort((a, b) => a.nextDue.localeCompare(b.nextDue));
  const segments: DonutSegment[] = (
    ["Healthy", "Due Soon", "Overdue"] as const
  ).map((label, index) => ({
    label,
    value: scoped.filter(row => row.status === label).length,
    color: (["green", "amber", "red"] as const)[index],
  }));
  const rows = scoped.filter(row => {
    const plane = aircraft.find(item => item.tail === row.tail)!;
    return (
      row.remaining.endsWith(unitSuffix[unit]) &&
      (!type || plane.type === type) &&
      (!client || plane.client === client) &&
      (!status || row.status === status) &&
      `${row.tail} ${row.component} ${row.partNumber} ${row.serial}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });
  // Animate the shared table's native rows without changing its component API.
  useEffect(() => {
    const root = tableRef.current;
    if (!root || reducedMotion) return;
    const over = (event: MouseEvent) => {
      const row = (event.target as Element).closest("tbody tr");
      if (row) animate(row, { y: -2 }, { duration: 0.16 });
    };
    const out = (event: MouseEvent) => {
      const row = (event.target as Element).closest("tbody tr");
      if (
        row &&
        !(
          event.relatedTarget instanceof Node &&
          row.contains(event.relatedTarget)
        )
      )
        animate(row, { y: 0 }, { duration: 0.16 });
    };
    root.addEventListener("mouseover", over);
    root.addEventListener("mouseout", out);
    return () => {
      root.removeEventListener("mouseover", over);
      root.removeEventListener("mouseout", out);
    };
  }, [reducedMotion]);
  const columns: TableColumn<LifeComponent>[] = [
    {
      key: "priority",
      header: "Priority",
      render: row => (
        <span
          className={`life-priority priority-${row.priority.toLowerCase()}`}
        >
          {row.priority}
        </span>
      ),
    },
    {
      key: "aircraft",
      header: "Aircraft",
      render: row => (
        <Link href={`/fleet/${row.tail}`} className="life-aircraft">
          <Plane size={19} />
          <span>
            <strong>{row.tail}</strong>
            <small>{aircraft.find(item => item.tail === row.tail)?.type}</small>
          </span>
        </Link>
      ),
    },
    {
      key: "component",
      header: "Component",
      render: row => <strong>{row.component}</strong>,
    },
    {
      key: "part",
      header: "Part Number / Serial",
      render: row => (
        <>
          <span>P/N: {row.partNumber}</span>
          <small>S/N: {row.serial}</small>
        </>
      ),
    },
    {
      key: "used",
      header: "Life Used %",
      render: row => <LifeProgress row={row} />,
    },
    {
      key: "remaining",
      header: `Remaining (${unitSuffix[unit]})`,
      render: row => (
        <span className={row.status === "Overdue" ? "life-over-limit" : ""}>
          {row.remaining}
          {row.status === "Overdue" && <small>Beyond life limit</small>}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: row => <StatusPill status={row.status} />,
    },
    {
      key: "due",
      header: "Next Due",
      render: row => (
        <time dateTime={row.nextDue}>{dateLabel(row.nextDue)}</time>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: row => (
        <button
          className="life-schedule"
          onClick={() => {
            setScheduling(row);
            setScheduleDate(scheduled[row.id] ?? "");
          }}
        >
          {scheduled[row.id] ? "Edit draft" : "Schedule"}
        </button>
      ),
    },
  ];
  return (
    <section className="life-tracking-view">
      <div className="page-heading">
        <div>
          <div className="eyebrow">AIRCRAFT / LIFE TRACKING</div>
          <h1>Life Tracking{tailNumber ? ` — ${tailNumber}` : ""}</h1>
          <p>
            Monitor component life limits across{" "}
            {tailNumber ? "this aircraft" : "your entire fleet"}.
          </p>
        </div>
      </div>
      {risks.length > 0 && (
        <motion.div
          className="alert-banner"
          role="status"
          initial={{ opacity: 0, y: reducedMotion ? 0 : -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertTriangle size={20} />
          <div>
            <strong>
              {risks.length} components nearing or beyond their life limit
            </strong>
            <p>
              {risks[0].tail} · {risks[0].component} · {risks[0].lifeUsedPct}%
              life used — review and schedule maintenance.
            </p>
          </div>
          <Link href={`/fleet/${risks[0].tail}`} className="life-schedule">
            View Aircraft
          </Link>
        </motion.div>
      )}
      <p className="life-notice" role="status">
        {notice}
      </p>
      <div className="fleet-layout">
        <div className="panel fleet-main">
          <div className="life-toolbar">
            <div
              className="life-unit-toggle"
              role="group"
              aria-label="Life tracking unit"
            >
              {units.map((item, index) => {
                const Icon = [Clock3, RotateCw, CalendarDays][index];
                return (
                  <button
                    key={item}
                    aria-pressed={unit === item}
                    className={unit === item ? "is-active" : ""}
                    onClick={() => setUnit(item)}
                  >
                    <Icon size={14} />
                    {item}
                  </button>
                );
              })}
            </div>
            <span>{scoped.length} tracked components</span>
          </div>
          <div ref={tableRef}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={unit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.12 }}
              >
                <FilterableTable
                  columns={columns}
                  rows={rows}
                  getRowId={row => row.id}
                  searchValue={search}
                  onSearchChange={setSearch}
                  searchPlaceholder="Search aircraft, component, serial…"
                  filters={
                    <>
                      <select
                        aria-label="Aircraft type"
                        value={type}
                        onChange={event => setType(event.target.value)}
                      >
                        <option value="">All Types</option>
                        {Array.from(new Set(aircraft.map(row => row.type))).map(
                          value => (
                            <option key={value}>{value}</option>
                          )
                        )}
                      </select>
                      <select
                        aria-label="Client"
                        value={client}
                        onChange={event => setClient(event.target.value)}
                      >
                        <option value="">All Clients</option>
                        {Array.from(
                          new Set(aircraft.map(row => row.client))
                        ).map(value => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                      <select
                        aria-label="Component status"
                        value={status}
                        onChange={event => setStatus(event.target.value)}
                      >
                        <option value="">All Statuses</option>
                        {segments.map(segment => (
                          <option key={segment.label}>{segment.label}</option>
                        ))}
                      </select>
                    </>
                  }
                  footer={
                    <div className="table-footer">
                      Showing {rows.length} of{" "}
                      {
                        scoped.filter(row =>
                          row.remaining.endsWith(unitSuffix[unit])
                        ).length
                      }{" "}
                      {unit.toLowerCase()}-tracked components
                    </div>
                  }
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <aside className="fleet-side">
          <SidePanel
            title={
              tailNumber ? "Aircraft Life Overview" : "Fleet Life Overview"
            }
          >
            <div className="health-content">
              {scoped.length ? (
                <DonutChart
                  segments={segments}
                  centerValue={scoped.length}
                  centerLabel="Components"
                />
              ) : (
                <p>No components</p>
              )}
              <DonutLegend segments={segments} />
            </div>
            <p className="life-panel-note">
              All life units · {tailNumber ?? "Entire fleet"}
            </p>
          </SidePanel>
          <SidePanel title="Most At-Risk Components">
            <ol className="risk-ranking">
              {ranking.map((row, index) => (
                <li key={row.id}>
                  <span className="life-rank">{index + 1}</span>
                  <div>
                    <strong>{row.component}</strong>
                    <small>
                      {row.tail} · {row.remaining}
                    </small>
                  </div>
                  <b className={row.lifeUsedPct >= 90 ? "life-over-limit" : ""}>
                    {row.lifeUsedPct}%
                  </b>
                </li>
              ))}
            </ol>
            {!ranking.length && (
              <p className="life-panel-note">
                No components for this aircraft.
              </p>
            )}
          </SidePanel>
          <SidePanel title="Upcoming Due (Next 30 Days)">
            <div className="life-upcoming">
              {upcoming.map(row => (
                <div className="event-row" key={row.id}>
                  <div className="event-date">
                    <span>
                      {new Date(`${row.nextDue}T12:00:00`).toLocaleDateString(
                        "en-US",
                        { month: "short" }
                      )}
                    </span>
                    <b>{Number(row.nextDue.slice(-2))}</b>
                  </div>
                  <div className="event-copy">
                    <strong>{row.tail}</strong>
                    <span>{row.component}</span>
                  </div>
                  <StatusPill status={row.status} />
                </div>
              ))}
            </div>
            {!upcoming.length && (
              <p className="life-panel-note">
                No components due in the next 30 days.
              </p>
            )}
          </SidePanel>
        </aside>
      </div>
      <Dialog
        open={!!scheduling}
        onOpenChange={open => {
          if (!open) setScheduling(null);
        }}
      >
        <DialogContent className="life-schedule-dialog">
          <DialogTitle>Schedule component maintenance</DialogTitle>
          <DialogDescription>
            {scheduling?.tail} · {scheduling?.component}. Save a local planning
            draft for this session.
          </DialogDescription>
          <form
            onSubmit={event => {
              event.preventDefault();
              if (!scheduling) return;
              setScheduled(previous => ({
                ...previous,
                [scheduling.id]: scheduleDate,
              }));
              setNotice(
                `Maintenance draft saved for ${scheduling.tail} · ${scheduling.component} on ${dateLabel(scheduleDate)}.`
              );
              setScheduling(null);
            }}
          >
            <label>
              Planned date
              <input
                type="date"
                required
                value={scheduleDate}
                onChange={event => setScheduleDate(event.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setScheduling(null)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                Save draft
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
