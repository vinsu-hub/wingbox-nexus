import { useState } from "react";
import { Box, Link2, Loader2, Upload, X } from "lucide-react";

export interface IngestResult {
  id: string;
  url: string;
  nodeCount: number;
  triangleCount: number;
  isSeparable: boolean;
}

export function ImportModelModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: (result: IngestResult) => void;
}) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [licenseNote, setLicenseNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (mode === "upload" && !file) {
      setError("Choose a .glb or .gltf file first.");
      return;
    }
    if (mode === "url" && !url.trim()) {
      setError("Enter a direct model download URL.");
      return;
    }
    setBusy(true);
    try {
      let response: Response;
      if (mode === "upload") {
        const body = new FormData();
        body.append("file", file as File);
        if (licenseNote.trim()) body.append("licenseNote", licenseNote.trim());
        response = await fetch("/api/models/ingest", { method: "POST", body });
      } else {
        response = await fetch("/api/models/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim(), licenseNote: licenseNote.trim() }),
        });
      }
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Import failed.");
        setBusy(false);
        return;
      }
      onImported(data as IngestResult);
    } catch {
      setError("Could not reach the ingestion service.");
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card import-model-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Close" onClick={onClose}><X size={17} /></button>
        <div className="modal-icon"><Box size={22} /></div>
        <h2>Import 3D model</h2>
        <p>Upload a .glb/.gltf file, or paste a direct download link. Only glTF-binary formats are supported in this pass.</p>
        <div className="import-model-tabs">
          <button className={mode === "upload" ? "active" : ""} onClick={() => setMode("upload")}><Upload size={13} /> Upload a file</button>
          <button className={mode === "url" ? "active" : ""} onClick={() => setMode("url")}><Link2 size={13} /> Paste a model URL</button>
        </div>
        {mode === "upload" ? (
          <label>
            Model file (.glb / .gltf)
            <input
              type="file"
              accept=".glb,.gltf"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        ) : (
          <label>
            Model URL
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/model.glb"
            />
          </label>
        )}
        <label>
          License note {mode === "url" && <em>(required for external URLs)</em>}
          <input
            value={licenseNote}
            onChange={e => setLicenseNote(e.target.value)}
            placeholder="e.g. CC0, source, attribution"
          />
        </label>
        {error && <p className="import-model-error">{error}</p>}
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="primary-button" onClick={submit} disabled={busy}>
            {busy ? <><Loader2 size={14} className="spin" /> Importing…</> : "Import model"}
          </button>
        </div>
      </div>
    </div>
  );
}
