import { useEffect, useRef, useState } from "react";
import { Box, Compass, Download, Expand, Hand, Maximize2, Minus, MousePointer2, Presentation, Rotate3D, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import * as THREE from "three";
import { aircraft } from "@/data/aircraft";
import { damageFindings, damage3dMeta } from "@/data/mock/damage-3d";
import { StatusPill } from "@/components/shared/StatusPill";
import { Viewer3D, type Viewer3DHotspot, type ViewerMode } from "../InspectionPresentation/Viewer3D";
import type { IngestResult } from "../InspectionPresentation/ImportModelModal";

const cameraViews = ["Fan face", "Cowl", "Left angle", "Right angle", "Underside"];

export function Damage3DPage() {
  const [selectedFindingId, setSelectedFindingId] = useState(damageFindings[0].id);
  const [viewerMode, setViewerMode] = useState<ViewerMode>("3D View");
  const [selectedView, setSelectedView] = useState(0);
  const [model, setModel] = useState<IngestResult | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [panMode, setPanMode] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  const selectedFinding = damageFindings.find(finding => finding.id === selectedFindingId) ?? damageFindings[0];
  const aircraftRecord = aircraft.find(row => row.tail === damage3dMeta.tail);
  const notify = (label: string) => toast.info(`${label} is a presentation preview.`, { description: "This static P1 slice does not save or alter inspection records." });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/models/latest")
      .then(response => (response.ok ? response.json() : null))
      .then((result: IngestResult | null) => {
        if (result && !cancelled) setModel(result);
      })
      .catch(() => {
        /* no persisted model yet, or the fetch failed — the procedural
         * placeholder engine in Viewer3D covers this case, nothing to show. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const toggleFullscreen = () => {
    const el = viewerContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen();
  };

  const viewerTools = [
    { label: autoRotate ? "Stop rotation" : "Rotate model", icon: Rotate3D, action: () => setAutoRotate(v => !v) },
    { label: "Zoom in", icon: ZoomIn, action: () => zoom(0.8) },
    { label: "Zoom out", icon: Minus, action: () => zoom(1.25) },
    { label: "Fullscreen viewer", icon: Maximize2, action: toggleFullscreen },
    { label: panMode ? "Switch to rotate" : "Pan model", icon: Hand, action: () => setPanMode(v => !v) },
  ];

  const explodedDisabled = model != null && !model.isSeparable;

  const hotspots: Viewer3DHotspot[] = damageFindings.map(finding => ({
    id: finding.id,
    partName: finding.partName,
    number: finding.number,
    severity: finding.severity,
    label: finding.title,
  }));

  return (
    <div className="damage3d-page">
      <div className="damage3d-breadcrumb">Inspections <span>/</span> Damage / 3D</div>
      <header className="damage3d-header">
        <div><h1>Damage / 3D</h1><p>{damage3dMeta.tail} <span>·</span> {damage3dMeta.checkType} <span>·</span> {damage3dMeta.date} <span>·</span> Inspector: {damage3dMeta.inspector}</p></div>
        <div className="damage3d-actions">
          <button className="secondary-button" onClick={() => notify("Export PDF")}><Download size={14} /> Export PDF</button>
          <button className="primary-button" onClick={() => notify("Present to Client")}><Presentation size={14} /> Present to Client</button>
          <button className="gesture-mode-button" disabled title="Coming soon — Gesture Mode requires the full 3D presentation module"><Hand size={14} /> Gesture Mode <small>COMING SOON</small></button>
        </div>
      </header>
      <div className="damage3d-layout">
        <section className="presentation-viewer" aria-label="3D damage viewer">
          <div ref={viewerContainerRef} className="viewer-canvas viewer-live">
            <Viewer3D
              modelUrl={model?.url ?? null}
              mode={viewerMode}
              controlsRef={controlsRef}
              activeView={selectedView}
              hotspots={hotspots}
              selectedHotspotId={selectedFindingId}
              onHotspotSelect={setSelectedFindingId}
            />
            <div className="component-identity"><Box size={14} /><span>{damage3dMeta.componentLabel}</span></div>
            <div className="compass-widget" aria-label="Decorative compass"><Compass size={25} /><b>N</b></div>
            <div className="viewer-tools" aria-label="Viewer tools">{viewerTools.map(({ label, icon: Icon, action }) => <button key={label} aria-label={label} title={label} onClick={action}><Icon size={16} /></button>)}</div>
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
            <div className="viewer-caption"><MousePointer2 size={12} /> Numbered markers show finding locations · {panMode ? "pan" : "rotate"} + scroll to zoom</div>
          </div>
          <div className="viewer-filmstrip" aria-label="Camera angles">
            {cameraViews.map((label, index) => (
              <button
                key={label}
                className={selectedView === index ? "selected" : ""}
                onClick={() => setSelectedView(index)}
                aria-label={`View ${label}`}
              >
                <span className="damage3d-camera-label">{label}</span>
              </button>
            ))}
          </div>
        </section>
        <aside className="inspection-report-panel">
          <div className="report-panel-heading">
            <div><span>Damage Findings</span><h2>{damage3dMeta.inspectionId}</h2></div>
            <StatusPill status="In Inspection" />
          </div>
          <dl className="report-metadata">
            <div><dt>Aircraft</dt><dd>{damage3dMeta.tail}<small>{aircraftRecord?.type ?? "Aircraft record"}</small></dd></div>
            <div><dt>Type</dt><dd>{damage3dMeta.checkType}</dd></div>
            <div><dt>Date</dt><dd>{damage3dMeta.date}</dd></div>
            <div><dt>Inspector</dt><dd>{damage3dMeta.inspector}</dd></div>
          </dl>
          <div className="findings-list">
            {damageFindings.map(finding => (
              <button
                key={finding.id}
                className={`finding-row ${selectedFindingId === finding.id ? "selected" : ""}`}
                onClick={() => setSelectedFindingId(finding.id)}
              >
                <span className="finding-number">{String(finding.number).padStart(2, "0")}</span>
                <span className="finding-row-copy"><strong>{finding.title}</strong><small>{finding.location} · {finding.ataSection}</small></span>
                <StatusPill status={finding.severity} />
              </button>
            ))}
          </div>
          <article className="finding-detail">
            <div className="finding-detail-heading">
              <div><span>Selected finding</span><h3>{selectedFinding.id} · {selectedFinding.title}</h3></div>
              <StatusPill status={selectedFinding.status} />
            </div>
            <div className="finding-detail-section"><h4>Description</h4><p>{selectedFinding.description}</p></div>
            <div className="finding-detail-section"><h4>Corrective Action</h4><p>{selectedFinding.correctiveAction}</p></div>
            <div className="finding-detail-meta">
              <div><span>Status</span><StatusPill status={selectedFinding.status} /></div>
              <div><span>Created</span><b>{selectedFinding.createdAt}</b></div>
              <div><span>By</span><b>{selectedFinding.createdBy}</b></div>
            </div>
            <div className="finding-references">
              <h4>Related References</h4>
              {selectedFinding.references.map(reference => (
                <button key={reference.label} onClick={() => notify(reference.label)}>
                  <span>{reference.label}</span><small>{reference.detail}</small><Expand size={13} />
                </button>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}
