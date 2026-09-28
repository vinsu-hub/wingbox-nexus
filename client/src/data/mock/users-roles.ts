export type DemoRole = "Engineer" | "Planner" | "QA" | "Admin" | "Client";
export type DemoUser = { id: string; name: string; email: string; role: DemoRole; status: "Active" | "Invited" | "Disabled"; lastActive: string | null };

const names: [string, DemoRole, DemoUser["status"], string | null][] = [
  ["Alex Admin", "Admin", "Active", "2026-09-28"], ["John Dela Cruz", "Engineer", "Active", "2026-09-28"],
  ["Paula Reyes", "Planner", "Active", "2026-09-27"], ["Elena Santos", "QA", "Active", "2026-09-27"],
  ["Skyline Air Operations", "Client", "Active", "2026-09-26"], ["Marco Villanueva", "Engineer", "Active", "2026-09-25"],
  ["Nina Bautista", "Engineer", "Active", "2026-09-24"], ["Theo Mendoza", "Planner", "Active", "2026-09-24"],
  ["Iris Lim", "QA", "Active", "2026-09-23"], ["Gavin Ong", "Engineer", "Active", "2026-09-22"],
  ["Celeste Navarro", "Client", "Active", "2026-09-21"], ["Andre Flores", "Admin", "Active", "2026-09-20"],
  ["Mika Tan", "Engineer", "Invited", null], ["Daniel Cruz", "Client", "Invited", null],
  ["Rafael Garcia", "QA", "Invited", null], ["Lara Valdez", "Planner", "Disabled", "2026-07-18"],
  ["Sophia Ramos", "Engineer", "Active", "2026-09-19"], ["Ethan Chua", "Client", "Disabled", "2026-06-04"],
];

export const demoUsers: DemoUser[] = names.map(([name, role, status, lastActive], index) => ({
  id: `USR-${String(index + 1).padStart(3, "0")}`, name,
  email: index === 0 ? "admin@wingbox.aero" : index === 1 ? "engineer@wingbox.aero" : `${name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\.$/, "")}@${role === "Client" ? "operator.example" : "wingbox.aero"}`,
  role, status, lastActive,
}));
