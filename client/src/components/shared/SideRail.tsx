import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

export function SidePanel({ title, onViewAll, viewAllLabel = "View All", className = "", children }: {
  title: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`side-panel ${className}`.trim()}>
      <div className="panel-title">
        <h3>{title}</h3>
        {onViewAll && <button onClick={onViewAll}>{viewAllLabel} <ArrowRight size={13} /></button>}
      </div>
      {children}
    </div>
  );
}

export interface RailEvent {
  date: string;
  day: string;
  title: string;
  meta: string;
  tag: string;
  tone: "blue" | "amber" | "violet" | "green" | "red";
}

export function EventRow({ event }: { event: RailEvent }) {
  return (
    <div className="event-row">
      <div className="event-date"><span>{event.date}</span><b>{event.day}</b></div>
      <div className="event-copy"><strong>{event.title}</strong><span>{event.meta}</span></div>
      <em className={`tag ${event.tone}`}>{event.tag}</em>
    </div>
  );
}

export function FeaturedCard({ image, alt, title, subtitle, badge }: {
  image: string;
  alt: string;
  title: string;
  subtitle: string;
  badge?: ReactNode;
}) {
  return (
    <div className="featured-card">
      <img src={image} alt={alt} />
      <div className="featured-overlay">
        <div><strong>{title}</strong><span>{subtitle}</span></div>
        {badge}
      </div>
    </div>
  );
}
