// STUB — Codex task builds the full Documents view per spec 3.7 and
// "documents tab.jpg". This file is owned exclusively by that task.
// Dual-use: standalone at /documents AND embedded as the Aircraft Record
// "Documents" tab via the optional tailNumber prop.
export function DocumentsView({ tailNumber }: { tailNumber?: string }) {
  return (
    <div className="module-view">
      <h1>Documents{tailNumber ? ` — ${tailNumber}` : ""}</h1>
      <p>Documents workspace is under construction.</p>
    </div>
  );
}
