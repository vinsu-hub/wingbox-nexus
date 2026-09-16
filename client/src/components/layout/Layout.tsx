import { type ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { Bell, ChevronDown, ChevronLeft, ChevronRight, Cloud, Menu, Search } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "./BrandMark";
import { navGroups } from "./navConfig";

export function Layout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

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
            <div className="user-chip">
              <div className="avatar">JD</div>
              <div><strong>John Dela Cruz</strong><span>Engineer</span></div>
              <ChevronDown size={15} />
            </div>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
