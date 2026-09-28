import { useEffect, useState } from "react";
import { Shield, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth, type Role } from "@/lib/auth";
import { FilterableTable } from "@/components/shared/FilterableTable";
import { StatusPill } from "@/components/shared/StatusPill";
import { prettyDate } from "./AdminShared";

type ApiUser = { id: string; email: string; role: Role; displayName: string; clientId: string | null; clientName: string | null; lastSignInAt: string | null; disabled: boolean };
const roles: Role[] = ["Engineer", "Planner", "QA", "Admin", "Client"];
async function json<T>(response: Response): Promise<T> { const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`); return body as T; }
const fetchUsers = () => fetch("/api/users").then(json<ApiUser[]>);
const patchUser = (id: string, patch: { role?: Role; disabled?: boolean }) => fetch(`/api/users/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }).then(json<{ id: string; role?: Role; disabled?: boolean }>);
export function UsersRolesPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (user?.role !== "Admin") return; let active = true; fetchUsers().then(rows => { if (active) { setUsers(rows); setError(""); } }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [user?.role]);
  if (user && user.role !== "Admin") return <section className="admin-page"><div className="panel admin-access-denied"><Shield size={26} /><h1>Access denied</h1><p>Users & Roles is available to Admin users.</p></div></section>;
  const visible = users.filter(item => `${item.displayName} ${item.email} ${item.clientName ?? ""}`.toLowerCase().includes(query.toLowerCase()) && (role === "all" || item.role === role) && (status === "all" || (item.disabled ? "Disabled" : "Active") === status));
  const update = async (item: ApiUser, patch: { role?: Role; disabled?: boolean }) => { setBusyId(item.id); try { await patchUser(item.id, patch); setUsers(current => current.map(row => row.id === item.id ? { ...row, ...patch } : row)); toast.success(`${item.displayName || item.email} updated.`); } catch (err) { toast.error(err instanceof Error ? err.message : "Unable to update user."); } finally { setBusyId(null); } };
  return <section className="admin-page admin-live-page"><header className="page-heading admin-heading"><div><div className="eyebrow"><Shield size={13} /> ADMIN / WORKSPACE</div><h1>Users & Roles</h1><p>Manage workspace access and role assignments.</p></div></header><div className="panel admin-table"><div className="admin-section-title"><div><UsersRound size={18} /><h2>Team directory</h2></div><span>{visible.length} of {users.length} users</span></div>{error && <p className="admin-api-error" role="alert">{error}</p>}<FilterableTable rows={visible} getRowId={item => item.id} searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search name, email or workspace…" filters={<><select aria-label="Filter by role" value={role} onChange={event => setRole(event.target.value)}><option value="all">All roles</option>{roles.map(item => <option key={item}>{item}</option>)}</select><select aria-label="Filter by status" value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option><option>Active</option><option>Disabled</option></select></>} emptyMessage={loading ? "Loading users…" : "No users match these filters."} columns={[{ key: "name", header: "Name", render: item => <strong className="admin-primary-cell">{item.displayName || "—"}</strong> }, { key: "email", header: "Email", render: item => item.email }, { key: "workspace", header: "Client workspace", render: item => item.clientName || "—" }, { key: "role", header: "Role", render: item => <select aria-label={`Role for ${item.email}`} title={item.id === user?.id ? "You can't change your own account here" : undefined} disabled={item.id === user?.id || busyId === item.id} value={item.role} onChange={event => update(item, { role: event.target.value as Role })}>{roles.map(value => <option key={value}>{value}</option>)}</select> }, { key: "last", header: "Last active", render: item => prettyDate(item.lastSignInAt) }, { key: "status", header: "Status", render: item => <StatusPill status={item.disabled ? "Disabled" : "Active"} tone={item.disabled ? "gray" : undefined} /> }, { key: "action", header: "Access", render: item => <button className="admin-link" title={item.id === user?.id ? "You can't change your own account here" : undefined} disabled={item.id === user?.id || busyId === item.id} onClick={() => update(item, { disabled: !item.disabled })}>{item.disabled ? "Enable" : "Disable"}</button> }]} /></div></section>;
}
