import type { ReactNode } from "react";

export type DonutColor = "green" | "amber" | "red" | "blue" | "violet" | "gray";

export interface DonutSegment {
  label: string;
  value: number;
  color: DonutColor;
  displayValue?: ReactNode;
}

const COLOR_HEX: Record<DonutColor, string> = {
  green: "#19a87d",
  amber: "#efb226",
  red: "#e34a50",
  blue: "#1873cf",
  violet: "#7157c6",
  gray: "#cfd7df",
};

/**
 * Renders a conic-gradient donut whose arc widths are computed from `segments`,
 * so the visual proportions always match the values passed to <DonutLegend>
 * rendered alongside it — segments must be the single source of truth for both.
 */
export function DonutChart({ segments, centerValue, centerLabel, large = false }: {
  segments: DonutSegment[];
  centerValue: ReactNode;
  centerLabel: string;
  large?: boolean;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  let cursor = 0;
  const stops = segments
    .filter(s => s.value > 0)
    .map(s => {
      const start = (cursor / total) * 100;
      cursor += s.value;
      const end = (cursor / total) * 100;
      return `${COLOR_HEX[s.color]} ${start}% ${end}%`;
    })
    .join(", ");
  return (
    <div className={`donut${large ? " large" : ""}`} style={{ background: `conic-gradient(${stops})` }}>
      <div><strong>{centerValue}</strong><span>{centerLabel}</span></div>
    </div>
  );
}

export function DonutLegend({ segments, footer }: { segments: DonutSegment[]; footer?: ReactNode }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  return (
    <div className="health-legend">
      {segments.map(s => (
        <p key={s.label}>
          <i className={s.color} />
          {s.label} <b>{s.displayValue ?? s.value}</b>
          <small>{Math.round((s.value / total) * 100)}%</small>
        </p>
      ))}
      {footer}
    </div>
  );
}
