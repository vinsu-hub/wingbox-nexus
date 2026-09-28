import { useEffect, useState } from "react";
import { Bell, Building2, Gauge, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

type Setting = { key: string; value: number; updatedBy: string | null; updatedAt: string | null };
const fields = [
  { key: "life_tracking.approaching_threshold_pct", label: "Approaching limit", detail: "Warn when remaining life falls to this percentage or less.", max: 100, defaultValue: 10 },
  { key: "life_tracking.due_soon_used_pct", label: "Due soon", detail: "Mark a limit Due Soon when used life reaches this percentage.", max: 100, defaultValue: 80 },
  { key: "life_tracking.overdue_used_pct", label: "Overdue", detail: "Mark a limit Overdue when used life reaches this percentage.", max: 200, defaultValue: 100 },
] as const;
async function json<T>(response: Response): Promise<T> { const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`); return body as T; }
const fetchSettings = () => fetch("/api/settings").then(json<Setting[]>);
const patchSetting = (key: string, value: number) => fetch(`/api/settings/${encodeURIComponent(key)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }) }).then(json<Setting>);
export function SystemSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { if (!user) return; let active = true; fetchSettings().then(rows => { if (active) { setSettings(rows); setDraft(Object.fromEntries(rows.map(row => [row.key, String(row.value)]))); setError(""); } }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [user]);
  const save = async (key: string, max: number) => { const value = Number(draft[key]); if (draft[key]?.trim() === "" || !Number.isFinite(value) || value < 0 || value > max) { toast.error(`Enter a percentage from 0 to ${max}.`); return; } setBusy(key); try { const updated = await patchSetting(key, value); setSettings(current => [...current.filter(row => row.key !== key), updated]); setDraft(current => ({ ...current, [key]: String(updated.value) })); toast.success(`${updated.value}% saved.`, { description: `Updated by ${updated.updatedBy ?? "Admin"} at ${updated.updatedAt ? new Date(updated.updatedAt).toLocaleString() : "just now"}.` }); } catch (err) { toast.error(err instanceof Error ? err.message : "Unable to save setting."); } finally { setBusy(null); } };
  return <section className="admin-page admin-live-page"><header className="page-heading admin-heading"><div><div className="eyebrow"><Shield size={13} /> ADMIN / WORKSPACE</div><h1>System Settings</h1><p>Life Tracking thresholds currently used by the workspace.</p></div></header>{error && <p className="admin-api-error" role="alert">{error}</p>}
    <div className="admin-settings-grid"><div className="panel admin-setting-card admin-threshold-card"><div className="admin-setting-head"><Gauge size={18} /><div><h2>Life Tracking Thresholds</h2><p>Changes affect live Healthy, Due Soon and Overdue statuses.</p></div></div>{loading ? <p className="admin-setting-help">Loading settings…</p> : fields.map(field => { const row = settings.find(item => item.key === field.key); const value = draft[field.key] ?? String(row?.value ?? field.defaultValue); return <div className="admin-live-setting" key={field.key}><div><strong>{field.label}</strong><p>{field.detail}</p><small>{row?.updatedAt ? `Saved ${new Date(row.updatedAt).toLocaleString()} by ${row.updatedBy ?? "unknown"}` : "Using default value"}</small></div><div className="admin-live-setting-control"><label><span className="sr-only">{field.label} percentage</span><input aria-label={`${field.label} percentage`} type="number" min="0" max={field.max} value={value} disabled={user?.role !== "Admin" || busy === field.key} onChange={event => setDraft(current => ({ ...current, [field.key]: event.target.value }))} /></label><span>%</span>{user?.role === "Admin" && <button className="secondary-button" disabled={busy === field.key || value === String(row?.value ?? field.defaultValue)} onClick={() => save(field.key, field.max)}>{busy === field.key ? "Saving…" : "Save"}</button>}</div></div>; })}{user?.role !== "Admin" && <p className="admin-setting-help">Only Admin users can change thresholds.</p>}</div>
      <div className="admin-settings-placeholders"><div className="panel admin-setting-card"><div className="admin-setting-head"><Building2 size={18} /><div><h2>Organization</h2><p>Company profile and contact details.</p></div></div><p className="admin-placeholder-label">Not connected yet</p><p className="admin-setting-help">Organization details will be editable when workspace profile settings are available.</p></div><div className="panel admin-setting-card"><div className="admin-setting-head"><Bell size={18} /><div><h2>Notifications</h2><p>Alert and digest preferences.</p></div></div><p className="admin-placeholder-label">Not connected yet</p><p className="admin-setting-help">Notification preferences will appear when delivery settings are available.</p></div></div></div>
  </section>;
}
