import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Box, Compass, Download, Expand, FileText, Hand, Maximize2, Minus, MousePointer2, Presentation, Rotate3D, Upload, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import * as THREE from "three";
import { aircraft } from "@/data/aircraft";
import { findings, inspectionMeta } from "@/data/mock/inspection-presentation";
import { StatusPill } from "@/components/shared/StatusPill";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Viewer3D, type ViewerMode } from "./Viewer3D";
import { ImportModelModal, type IngestResult } from "./ImportModelModal";

const hotspotPositions: Record<string, { left: string; top: string }> = { "F-01": { left: "59%", top: "46%" }, "F-02": { left: "53%", top: "54%" }, "F-03": { left: "66%", top: "65%" } };
const thumbnails = ["Inspection detail", "Engine inlet", "Left angle", "Right angle", "Lower cowl"];
const tabs = ["Findings", "Photos", "3D Model", "Documents", "Details"];

export function InspectionPresentationPage() {
  const [selectedId, setSelectedId] = useState("F-02");
  const [viewerMode, setViewerMode] = useState<ViewerMode>("3D View");
  const [selectedThumbnail, setSelectedThumbnail] = useState(0);
  const [activeTab, setActiveTab] = useState("Findings");
  const [importOpen, setImportOpen] = useState(false);
  const [model, setModel] = useState<IngestResult | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const controlsRef = useRef<any>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  const selectedFinding = findings.find(finding => finding.id === selectedId) ?? findings[0];
  const aircraftRecord = aircraft.find(row => row.tail === inspectionMeta.tail);
  const notify = (label: string) => toast.info(`${label} is a presentation preview.`, { description: "This static P1 slice does not save or alter inspection records." });

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = autoRotate;
  }, [autoRotate, model]);

  useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.mouseButtons = panMode
      ? { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }
      : { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  }, [panMode, model]);

  const zoom = (factor: number) => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.object.position.sub(controls.target).multiplyScalar(factor).add(controls.target);
    controls.update();
  };

  const resetView = () => {
    controlsRef.current?.reset();
    setAutoRotate(false);
    setPanMode(false);
  };

  const toggleFullscreen = () => {
    const el = viewerContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen();
  };

  const viewerTools = model
    ? [
        { label: autoRotate ? "Stop rotation" : "Rotate model", icon: Rotate3D, action: () => setAutoRotate(v => !v) },
        { label: "Zoom in", icon: ZoomIn, action: () => zoom(0.8) },
        { label: "Zoom out", icon: Minus, action: () => zoom(1.25) },
        { label: "Fullscreen viewer", icon: Maximize2, action: toggleFullscreen },
        { label: panMode ? "Switch to rotate" : "Pan model", icon: Hand, action: () => setPanMode(v => !v) },
      ]
    : [
        { label: "Rotate model", icon: Rotate3D, action: () => notify("Rotate model") },
        { label: "Zoom in", icon: ZoomIn, action: () => notify("Zoom in") },
        { label: "Zoom out", icon: Minus, action: () => notify("Zoom out") },
        { label: "Fullscreen viewer", icon: Maximize2, action: toggleFullscreen },
        { label: "Pan model", icon: Hand, action: () => notify("Pan model") },
      ];

  const explodedDisabled = model != null && !model.isSeparable;

  const handleImported = (result: IngestResult) => {
    setModel(result);
    setImportOpen(false);
    setViewerMode("3D View");
    toast.success(
      result.isSeparable
        ? `Model loaded — separable parts detected, Exploded View available.`
        : `Model loaded — single fused mesh; Exploded View unavailable for this model.`,
      { description: `${result.nodeCount} nodes · ${result.triangleCount} triangles` },
    );
  };

  return (
    <div className="inspection-presentation-page">
      <div className="inspection-presentation-breadcrumb">Reports <span>/</span> Presentations <span>/</span> {inspectionMeta.inspectionId}</div>
      <header className="inspection-presentation-header">
        <div><h1>Inspection Presentation</h1><p>{inspectionMeta.tail} <span>·</span> {inspectionMeta.checkType} <span>·</span> {inspectionMeta.date} <span>·</span> Inspector: {inspectionMeta.inspector}</p></div>
        <div className="inspection-presentation-actions">
          <button className="secondary-button" onClick={() => setImportOpen(true)}><Upload size={14} /> Import</button>
          <button className="secondary-button" onClick={() => notify("Export PDF")}><Download size={14} /> Export PDF</button>
          <button className="primary-button" onClick={() => notify("Present to Client")}><Presentation size={14} /> Present to Client</button>
          <button className="gesture-mode-button" disabled title="Coming soon — Gesture Mode requires the full 3D presentation module"><Hand size={14} /> Gesture Mode <small>COMING SOON</small></button>
        </div>
      </header>
      <div className="inspection-presentation-layout">
        <section className="presentation-viewer" aria-label={model ? "3D model viewer" : "Static engine finding viewer"}>
          <div ref={viewerContainerRef} className={`viewer-canvas ${model ? "viewer-live" : `viewer-mode-${viewerMode.toLowerCase().replaceAll(" ", "-")}`}`}>
            {model ? (
              <Viewer3D modelUrl={model.url} mode={viewerMode} controlsRef={controlsRef} />
            ) : (
              <img src="/assets/wingbox-aircraft-hero.jpg" alt="Aircraft engine inspection view" />
            )}
            {!model && <div className="viewer-shade" />}
            <div className="component-identity"><Box size={14} /><span>{inspectionMeta.componentLabel}</span></div>
            <div className="compass-widget" aria-label="Decorative compass"><Compass size={25} /><b>N</b></div>
            <div className="viewer-tools" aria-label="Viewer tools">{viewerTools.map(({ label, icon: Icon, action }) => <button key={label} aria-label={label} title={label} onClick={action}><Icon size={16} /></button>)}</div>
            {!model && (
              <motion.button className={`finding-hotspot hotspot-${selectedFinding.severity.toLowerCase()}`} aria-label={`Finding ${selectedFinding.id}: ${selectedFinding.title}`} animate={hotspotPositions[selectedFinding.id]} transition={{ type: "spring", stiffness: 230, damping: 25 }} onClick={() => notify(`Finding ${selectedFinding.id}`)}><b>{selectedFinding.id.replace("F-", "#")}</b><span>{selectedFinding.title}</span></motion.button>
            )}
            <div className="viewer-mode-toggle" aria-label="Viewer mode">
              {(["3D View", "Exploded View", "Wireframe"] as ViewerMode[]).map(mode => (
                <button
                  key={mode}
                  className={viewerMode === mode ? "active" : ""}
                  disabled={mode === "Exploded View" && explodedDisabled}
                  title={mode === "Exploded View" && explodedDisabled ? "This model has no separable named parts" : undefined}
                  onClick={() => setViewerMode(mode)}
                >{mode}</button>
              ))}
            </div>
            <div className="viewer-caption"><MousePointer2 size={12} /> {model ? `Live 3D viewer · ${panMode ? "pan" : "rotate"} + scroll to zoom` : "Static presentation preview — Import a model for the live viewer"}</div>
          </div>
          <div className="viewer-filmstrip" aria-label="Inspection media thumbnails">{thumbnails.map((label, index) => <motion.button key={label} className={selectedThumbnail === index ? "selected" : ""} onClick={() => setSelectedThumbnail(index)} aria-label={`View ${label}`} whileHover={{ y: -2 }}><img src="/assets/wingbox-aircraft-hero.jpg" alt="" style={{ objectPosition: `${35 + index * 12}% center` }} /><span>{index === 0 ? <FileText size={13} /> : `${index + 1}`}</span></motion.button>)}</div>
        </section>
        <aside className="inspection-report-panel"><div className="report-panel-heading"><div><span>Inspection Report</span><h2>{inspectionMeta.inspectionId}</h2></div><StatusPill status="In Inspection" /></div><dl className="report-metadata"><div><dt>Aircraft</dt><dd>{inspectionMeta.tail}<small>{aircraftRecord?.type ?? "Aircraft record"}</small></dd></div><div><dt>Type</dt><dd>{inspectionMeta.checkType}</dd></div><div><dt>Date</dt><dd>{inspectionMeta.date}</dd></div><div><dt>Inspector</dt><dd>{inspectionMeta.inspector}</dd></div></dl><Tabs value={activeTab} onValueChange={setActiveTab} className="report-tabs"><TabsList aria-label="Inspection report sections">{tabs.map(tab => <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>)}</TabsList><TabsContent value="Findings" forceMount className={activeTab === "Findings" ? "report-tab-content active" : "report-tab-content"}><motion.div initial={false} animate={{ opacity: activeTab === "Findings" ? 1 : 0 }} transition={{ duration: .18 }}><div className="findings-list">{findings.map((finding, index) => <motion.button key={finding.id} className={`finding-row ${selectedId === finding.id ? "selected" : ""}`} onClick={() => { setSelectedId(finding.id); setSelectedThumbnail(0); }} whileHover={{ x: 2 }}><span className="finding-number">{String(index + 1).padStart(2, "0")}</span><span className="finding-thumbnail"><img src="/assets/wingbox-aircraft-hero.jpg" alt="" /></span><span className="finding-row-copy"><strong>{finding.title}</strong><small>{finding.location} · {finding.ataSection}</small></span><StatusPill status={finding.severity} /></motion.button>)}</div><article className="finding-detail"><div className="finding-detail-heading"><div><span>Selected finding</span><h3>{selectedFinding.id} · {selectedFinding.title}</h3></div><StatusPill status={selectedFinding.status} /></div><div className="finding-detail-section"><h4>Description</h4><p>{selectedFinding.description}</p></div><div className="finding-detail-section"><h4>Corrective Action</h4><p>{selectedFinding.correctiveAction}</p></div><div className="finding-detail-meta"><div><span>Status</span><StatusPill status={selectedFinding.status} /></div><div><span>Created</span><b>{selectedFinding.createdAt}</b></div><div><span>By</span><b>{selectedFinding.createdBy}</b></div></div><div className="finding-references"><h4>Related References</h4>{selectedFinding.references.map(reference => <button key={reference.label} onClick={() => notify(reference.label)}><span>{reference.label}</span><small>{reference.detail}</small><Expand size={13} /></button>)}</div></article></motion.div></TabsContent>{tabs.filter(tab => tab !== "Findings").map(tab => <TabsContent key={tab} value={tab} forceMount className={activeTab === tab ? "report-tab-content active" : "report-tab-content"}><motion.div initial={false} animate={{ opacity: activeTab === tab ? 1 : 0 }} className="report-tab-placeholder"><Box size={22} /><p><b>{tab}</b> is being finalized in a separate workstream.</p></motion.div></TabsContent>)}</Tabs></aside>
      </div>
      {importOpen && <ImportModelModal onClose={() => setImportOpen(false)} onImported={handleImported} />}
    </div>
  );
}
