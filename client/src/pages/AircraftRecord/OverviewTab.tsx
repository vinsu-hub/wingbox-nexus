import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Clock3, FileText, Repeat2, ShieldCheck, TrendingUp } from "lucide-react";
import type { Aircraft } from "@/data/aircraft";
import { getAircraftRecordDetails } from "@/data/mock/aircraft-record";
import { StatusPill } from "@/components/shared/StatusPill";
import { SidePanel, EventRow, type RailEvent } from "@/components/shared/SideRail";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function AnimatedProgress({ value, label }: { value: number; label: string }) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return <Progress className="aircraft-record-progress" aria-label={label} aria-valuenow={Math.min(100, Math.max(0, value))} aria-valuemin={0} aria-valuemax={100} value={mounted || reduceMotion ? Math.min(100, Math.max(0, value)) : 0} />;
}

export function OverviewTab({ record, onSelectTab }: { record: Aircraft; onSelectTab: (tab: string) => void }) {
  const details = getAircraftRecordDetails(record.tail);
  const reduceMotion = useReducedMotion();
  const hours = Number(record.hours.replaceAll(",", ""));
  const cycles = Number(record.cycles.replaceAll(",", ""));
  const complianceStatus = record.compliance >= 97 ? "Healthy" : record.compliance >= 94 ? "Due Soon" : "Attention";
  const nextDate = new Date(record.date);
  const events: RailEvent[] = [
    { date: nextDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase(), day: String(nextDate.getDate()).padStart(2, "0"), title: details.nextCheck, meta: `${record.tail} · ${record.next} remaining`, tag: "Scheduled", tone: "blue" },
    { date: "JUN", day: "10", title: "Compliance review", meta: `${record.tail} · AD / SB review`, tag: "Due Soon", tone: "amber" },
    { date: "JUL", day: "05", title: "Engine inspection", meta: `${record.tail} · Powerplant`, tag: "Planned", tone: "violet" },
  ];

  return (
    <div className="overview-tab">
      <div className="aircraft-record-main">
        <section className="aircraft-record-metrics" aria-label="Aircraft summary">
          {[{ title: "Flight Hours", total: record.hours, limit: details.hoursLimit, value: hours, trend: details.hoursTrend, Icon: Clock3 }, { title: "Cycles", total: record.cycles, limit: details.cyclesLimit, value: cycles, trend: details.cyclesTrend, Icon: Repeat2 }].map(metric => (
            <Card className="aircraft-record-metric" key={metric.title}>
              <div className="aircraft-record-metric-title"><metric.Icon size={22} /><h2>{metric.title}</h2></div>
              <p><strong>{metric.total}</strong><small> / {metric.limit.toLocaleString("en-US")}</small></p>
              <AnimatedProgress value={metric.value / metric.limit * 100} label={`${metric.title} used against limit`} />
              <span className="aircraft-record-trend"><TrendingUp size={12} /> +{metric.trend}% <small>vs. last 6 months</small></span>
            </Card>
          ))}
          <Card className="aircraft-record-metric">
            <div className="aircraft-record-metric-title"><CalendarDays size={22} /><h2>Next Due Check</h2></div>
            <strong className="aircraft-record-date">{record.date}</strong>
            <small>{details.nextCheck} · {record.next} remaining</small>
            <StatusPill status="Due Soon" />
          </Card>
          <Card className="aircraft-record-metric">
            <div className="aircraft-record-metric-title"><ShieldCheck size={22} /><h2>Compliance Status</h2></div>
            <StatusPill status={complianceStatus} />
            <small>{record.compliance}% overall compliance</small>
          </Card>
        </section>

        <section className="aircraft-record-information">
          <Card className="aircraft-record-key-info">
            <h2>Key Information</h2>
            <dl>
              {[["Tail Number", record.tail], ["Aircraft Type", record.type], ["Client", record.client], ["Delivery Date", details.deliveryDate], ["Total Flight Hours", record.hours], ["Total Cycles", record.cycles]].map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </Card>
          <Card className="aircraft-record-current">
            <h2>Current Status</h2>
            <StatusPill status={record.status === "Active" ? "In Service" : record.status} tone={record.dot} />
            <div><small>Last Inspected</small><strong>{details.lastInspection}</strong><span>{details.lastCheck}</span><StatusPill status="Completed" /></div>
            <div><small>Next Inspection</small><strong>{record.date}</strong><span>{details.nextCheck} · {record.next} remaining</span></div>
          </Card>
        </section>

        <Card className="aircraft-record-components">
          <div className="aircraft-record-section-heading"><h2>Component Life <small>Life remaining</small></h2><button onClick={() => onSelectTab("Life Tracking")}>View life tracking →</button></div>
          <div className="aircraft-record-component-grid">
            {details.components.map(component => (
              <motion.div key={component.name} className="component-life-tile" whileHover={reduceMotion ? undefined : { y: -4 }} transition={{ duration: 0.18 }}>
                <h3>{component.name}</h3><small>{component.detail}</small>
                <div><AnimatedProgress value={component.remaining} label={`${component.name} life remaining`} /><strong>{component.remaining}%</strong></div>
              </motion.div>
            ))}
          </div>
        </Card>
        <p className="aircraft-record-demo-note">Demonstration data · limits, trends, component life and document dates are illustrative.</p>
      </div>
      <aside className="aircraft-record-rail" aria-label="Aircraft events and documents">
        <SidePanel title="Upcoming Events">
          {events.map(event => <EventRow key={event.title} event={event} />)}
        </SidePanel>
        <SidePanel title="Documents" onViewAll={() => onSelectTab("Documents")}>
          {details.documents.map(document => (
            <div className="aircraft-record-document" key={document.name}>
              <FileText size={19} />
              <div><strong>{document.name}</strong><small>Expires {document.expires}</small><StatusPill status={document.status} tone={document.status === "Valid" ? "green" : "amber"} /></div>
            </div>
          ))}
        </SidePanel>
      </aside>
    </div>
  );
}
