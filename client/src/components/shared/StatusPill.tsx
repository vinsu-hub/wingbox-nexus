export type StatusTone = "green" | "amber" | "red" | "blue" | "gray";

const STATUS_TONE_MAP: Record<string, StatusTone> = {
  active: "green", compliant: "green", completed: "green", healthy: "green", closed: "green",
  fulfilled: "green", approved: "green", "awaiting qa": "green",
  "in inspection": "amber", "due soon": "amber", scheduled: "amber", pending: "amber",
  "in progress": "amber", planned: "amber", quoted: "amber", medium: "amber",
  attention: "red", overdue: "red", open: "red", high: "red", critical: "red",
  low: "blue", requested: "blue",
};

export function StatusPill({ status, tone }: { status: string; tone?: StatusTone }) {
  const resolvedTone = tone ?? STATUS_TONE_MAP[status.toLowerCase()] ?? "gray";
  return <span className={`status-pill ${resolvedTone}`}><i />{status}</span>;
}
