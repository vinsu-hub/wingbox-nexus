import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  foot?: string;
  tone?: "blue" | "green" | "amber" | "red" | "violet";
  trend?: string;
}

export function StatCard({ icon: Icon, label, value, foot, tone = "blue", trend }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
      <div className="stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small className={trend?.startsWith("↓") ? "down" : ""}>{trend || foot}</small>
      </div>
    </div>
  );
}
