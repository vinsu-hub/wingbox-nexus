// STUB — Wave 1 Codex task builds the full Compliance view per spec 3.5 and
// "compliance tab.jpg". This file is owned exclusively by that task. It must
// stay dual-use: rendered standalone at /compliance (fleet-wide) AND embedded
// as the Aircraft Record "Compliance" tab via an optional `tailNumber` prop
// that pre-filters the AD/SB matrix to one aircraft.
export function ComplianceView({ tailNumber }: { tailNumber?: string }) {
  return (
    <div className="module-view">
      <h1>Compliance{tailNumber ? ` — ${tailNumber}` : ""}</h1>
      <p>Compliance workspace is under construction.</p>
    </div>
  );
}
