import { motion, useReducedMotion } from "framer-motion";

type DemoDataBadgeProps = {
  variant: "page" | "inline";
  isDemo?: boolean;
  note?: string;
};

export function DemoDataBadge({
  variant,
  isDemo = true,
  note = "Sample records for demonstration — not real client data.",
}: DemoDataBadgeProps) {
  const reduceMotion = useReducedMotion();

  if (!isDemo) return null;

  if (variant === "inline") {
    return <span className="demo-data-badge demo-data-badge-inline" role="note" aria-label="Demo data">Demo data</span>;
  }

  return (
    <motion.div
      className="demo-data-badge demo-data-badge-page"
      role="note"
      initial={reduceMotion ? false : { opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <strong>Demo data</strong>
      <span>{note}</span>
    </motion.div>
  );
}
