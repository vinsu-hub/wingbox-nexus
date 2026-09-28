import { useState } from "react";
import { Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { demoUsers, type DemoRole, type DemoUser } from "@/data/mock/users-roles";
import { FilterableTable } from "@/components/shared/FilterableTable";
import { StatusPill } from "@/components/shared/StatusPill";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AdminCount, AdminHeading, prettyDate } from "./AdminShared";

const roles: DemoRole[] = ["Engineer", "Planner", "QA", "Admin", "Client"];
export function UsersRolesPage() {
  const [users, setUsers] = useState(demoUsers);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<DemoUser | null>(null);
  const visible = users.filter(user => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase()) && (role === "all" || user.role === role) && (status === "all" || user.status === status));
  const changeRole = (user: DemoUser, next: DemoRole) => {
    setUsers(current => current.map(item => item.id === user.id ? { ...item, role: next } : item));
    setSelected({ ...user, role: next });
    toast.info(`${user.name} shown as ${next} for this session only.`, { description: "Role changes are not saved to the server." });
  };
  return <section className="admin-page"><AdminHeading title="Users & Roles" description="Review workspace access and role assignments across your team." action={<button className="primary-button" onClick={() => toast.info("Invitations are not connected yet.", { description: "No invitation was sent." })}><Plus size={15} /> Invite User</button>} />
    <div className="admin-counts"><AdminCount value={users.length} label="Directory" detail="sample members" /><AdminCount value={users.filter(user => user.status === "Active").length} label="Active" detail="currently enabled" /><AdminCount value={users.filter(user => user.status === "Invited").length} label="Invited" detail="awaiting access" /></div>
    <div className="panel admin-table"><div className="admin-section-title"><div><UsersRound size={18} /><h2>Team directory</h2></div><span>{visible.length} of {users.length} users</span></div><FilterableTable rows={visible} getRowId={user => user.id} searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search name or email…" filters={<><select aria-label="Filter by role" value={role} onChange={event => setRole(event.target.value)}><option value="all">All roles</option>{roles.map(item => <option key={item}>{item}</option>)}</select><select aria-label="Filter by status" value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option>{["Active", "Invited", "Disabled"].map(item => <option key={item}>{item}</option>)}</select></>} columns={[{ key: "name", header: "Name", render: user => <strong className="admin-primary-cell">{user.name}</strong> }, { key: "email", header: "Email", render: user => user.email }, { key: "role", header: "Role", render: user => <span className="admin-role">{user.role}</span> }, { key: "status", header: "Status", render: user => <StatusPill status={user.status} tone={user.status === "Disabled" ? "gray" : undefined} /> }, { key: "last", header: "Last active", render: user => prettyDate(user.lastActive) }, { key: "action", header: "", render: user => <button className="admin-link" onClick={() => setSelected(user)}>Manage</button> }]} /></div>
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="admin-dialog"><DialogTitle>{selected?.name}</DialogTitle><DialogDescription>{selected?.email} · Demo account</DialogDescription><div className="admin-detail-grid"><span>Status</span><strong>{selected?.status}</strong><span>Last active</span><strong>{prettyDate(selected?.lastActive ?? null)}</strong></div><label className="admin-field">Workspace role<select value={selected?.role ?? "Engineer"} onChange={event => selected && changeRole(selected, event.target.value as DemoRole)}>{roles.map(item => <option key={item}>{item}</option>)}</select></label><p className="admin-session-copy">Role selection is a preview. Changes reset when this page reloads.</p></DialogContent></Dialog>
  </section>;
}
