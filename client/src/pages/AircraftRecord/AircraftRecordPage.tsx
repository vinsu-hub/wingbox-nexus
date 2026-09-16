import { useState } from "react";
import { Link, useParams } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { getAircraftByTail } from "@/data/aircraft";
import { StatusPill } from "@/components/shared/StatusPill";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./OverviewTab";

const tabs = ["Overview", "Maintenance History", "Compliance", "Life Tracking", "Documents"];

export function AircraftRecordPage() {
  const { tail } = useParams<{ tail: string }>();
  const record = getAircraftByTail(tail);
  const [tab, setTab] = useState("Overview");
  const reduceMotion = useReducedMotion();
  const backLink = <Link className="aircraft-record-back" href="/fleet"><ArrowLeft size={14} />Back to Fleet</Link>;

  if (!record) {
    return <div className="aircraft-record-page aircraft-record-empty"><h1>Aircraft not found</h1>{backLink}</div>;
  }

  return (
    <div className="aircraft-record-page">
      <p className="aircraft-record-breadcrumb">Aircraft / Fleet / Aircraft Record</p>
      <header className="aircraft-record-header">
        <img src="/assets/wingbox-aircraft-hero.jpg" alt="Aircraft on the apron" />
        <div className="aircraft-record-identity">
          <div><h1>{record.tail}</h1><StatusPill status={record.status} /></div>
          <p>{record.type}<span>·</span>{record.client}</p>
        </div>
        {backLink}
      </header>
      <Tabs value={tab} onValueChange={setTab} className="aircraft-record-tabs">
        <TabsList aria-label="Aircraft record sections">
          {tabs.map(name => <TabsTrigger key={name} value={name}>{name}</TabsTrigger>)}
        </TabsList>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab + record.tail} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.15 }}>
            <TabsContent value={tab}>
              {tab === "Overview" ? <OverviewTab record={record} onSelectTab={setTab} /> : (
                <div className="aircraft-record-placeholder">
                  <h2>{tab}</h2>
                  <p>{tab} is being finalized in a separate workstream.</p>
                </div>
              )}
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
