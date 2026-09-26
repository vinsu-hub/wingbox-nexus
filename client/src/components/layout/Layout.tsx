import { type ReactNode, useState } from "react";
import { Redirect, useLocation } from "wouter";
import { Bell, ChevronDown, ChevronLeft, ChevronRight, Cloud, LogOut, Menu, Search } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "./BrandMark";
import { navGroups } from "./navConfig";
import { ROUTES } from "@/routes";
import { initials, useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Layout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  // Every protected page renders inside Layout, so this is the single
  // client-side route guard. The API enforces the same rule server-side.
  if (user === undefined) return <div className="auth-checking">Checking your session…</div>;
  if (user === null) return <Redirect to={ROUTES.login} />;

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand"><BrandMark /></div>
        <nav className="side-nav">
          {navGroups.map(group => (
            <div className="nav-group" key={group.label || "home"}>
              {group.label && <div className="nav-label">{group.label}</div>}
              {group.items.map(item => (
                <button
                  className={`nav-item ${location === item.path ? "active" : ""}`}
                  key={item.label}
                  onClick={() => handleNav(item.path)}
                >
                  <item.icon size={16} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer"><span>v1.0.0</span><span className="secure"><Cloud size={12} /> System secure</span></div>
      </aside>
      <main className="main-shell">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(v => !v)} aria-label="Open navigation"><Menu size={20} /></button>
          <button className="collapse-menu" onClick={() => setCollapsed(v => !v)} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}>
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
          <div className="top-search">
            <Search size={16} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search aircraft, tail number, component, finding, document..." />
            <kbd>⌘ K</kbd>
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notifications" onClick={() => toast("You are all caught up")}><Bell size={18} /><em>3</em></button>
            <DropdownMenu>
              <DropdownMenuTrigger className="user-chip" aria-label="Account menu">
                <div className="avatar">{initials(user.displayName)}</div>
                <div><strong>{user.displayName}</strong><span>{user.role}</span></div>
                <ChevronDown size={15} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="user-menu">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async () => {
                    await logout();
                    navigate(ROUTES.login);
                  }}
                >
                  <LogOut size={14} /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
