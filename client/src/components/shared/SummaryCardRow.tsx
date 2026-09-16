import { StatCard, type StatCardProps } from "./StatCard";

export function SummaryCardRow({ cards, className = "" }: { cards: StatCardProps[]; className?: string }) {
  return (
    <div className={`stats-grid ${className}`.trim()}>
      {cards.map(card => <StatCard key={card.label} {...card} />)}
    </div>
  );
}
