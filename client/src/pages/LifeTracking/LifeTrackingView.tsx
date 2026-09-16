// STUB — Wave 1 Codex task builds the full Life Tracking view per spec 3.6
// and "life tracking.jpg". This file is owned exclusively by that task. It
// must stay dual-use: rendered standalone at /life-tracking (fleet-wide) AND
// embedded as the Aircraft Record "Life Tracking" tab via an optional
// `tailNumber` prop that pre-filters the component table to one aircraft.
export function LifeTrackingView({ tailNumber }: { tailNumber?: string }) {
  return (
    <div className="module-view">
      <h1>Life Tracking{tailNumber ? ` — ${tailNumber}` : ""}</h1>
      <p>Life tracking workspace is under construction.</p>
    </div>
  );
}
