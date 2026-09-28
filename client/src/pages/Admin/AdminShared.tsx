import type { ReactNode } from "react";
import { Shield } from "lucide-react";

export function AdminHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <><header className="page-heading admin-heading"><div><div className="eyebrow"><Shield size={13} /> ADMIN / WORKSPACE</div><h1>{title}</h1><p>{description}</p></div>{action}</header><p className="admin-demo-note">Demo workspace · Changes on this page are local to this browser session and are not saved to the server.</p></>;
}
export function AdminCount({ value, label, detail }: { value: string | number; label: string; detail: string }) {
  return <div className="panel admin-count"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}
export function prettyDate(value: string | null) { return value ? new Date(value.includes("T") ? value : `${value}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"; }
