export type LimitType = "hours" | "cycles" | "calendar_months";
export type LimitStatus = "Healthy" | "Due Soon" | "Overdue";

/** Defaults, used when a caller doesn't supply live settings (existing
 * tests, or a settings-table read failure — see server/lib/settings.ts).
 * The live values now come from the `settings` table (Foundations phase:
 * "life-tracking Due Soon percentage (default 80), approaching threshold
 * (default 10)") — server/routes/lifeTracking.ts fetches them once per
 * request and threads them through evaluateComponent/evaluateLimit below,
 * so this file stays a pure, synchronous, easily-unit-tested function. */
export const APPROACHING_THRESHOLD = 0.1;
const DUE_SOON_USED_PCT = 80;

/** Calendar limits are stored in months; one average Gregorian month is used
 * so month arithmetic is consistent between seeding and evaluation. */
export const DAYS_PER_MONTH = 30.4375;
const MS_PER_DAY = 86_400_000;

export interface LimitRow {
  id: string;
  limit_type: LimitType;
  limit_value: number | string;
  current_value: number | string;
  last_updated: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
}

export interface EvaluatedLimit {
  id: string;
  limitType: LimitType;
  limitValue: number;
  /** Consumed life in the limit's own unit (hours, cycles, or months). */
  usedValue: number;
  /** Remaining life in the unit the UI displays: FH, FC, or days. */
  remaining: number;
  usedPct: number;
  remainingPct: number;
  status: LimitStatus;
  /** Only knowable for calendar limits until utilization data exists. */
  projectedDueDate: string | null;
  editable: boolean;
  approachingThreshold: boolean;
  binding: boolean;
  lastUpdated: string;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
}

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Evaluates one limit. Normalization across hours / cycles / calendar uses
 * remaining-margin percentage — the brief's documented fallback. The
 * preferred normalization (time-to-threshold at the current utilization
 * rate) needs a rate, which needs a history of readings or a flight-ops
 * feed; neither exists yet, so `utilizationRatePerDay` is accepted but only
 * used to project a due date for hours/cycles when a caller supplies one.
 */
export interface Thresholds {
  /** Fraction (0-1) of remaining life at or below which a limit counts as
   * "approaching threshold". Settings table stores this as a percentage
   * (e.g. 10); callers divide by 100 before passing it in here. */
  approachingThreshold: number;
  dueSoonUsedPct: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = { approachingThreshold: APPROACHING_THRESHOLD, dueSoonUsedPct: DUE_SOON_USED_PCT };

export function evaluateLimit(
  row: LimitRow,
  installDate: string,
  now: Date = new Date(),
  utilizationRatePerDay?: number,
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): Omit<EvaluatedLimit, "binding"> {
  const limitValue = Number(row.limit_value);
  let usedValue: number;
  let remaining: number;
  let projectedDueDate: string | null = null;

  if (row.limit_type === "calendar_months") {
    const install = new Date(`${installDate}T00:00:00Z`);
    const due = new Date(install.getTime() + limitValue * DAYS_PER_MONTH * MS_PER_DAY);
    usedValue = (now.getTime() - install.getTime()) / MS_PER_DAY / DAYS_PER_MONTH;
    remaining = Math.round((due.getTime() - now.getTime()) / MS_PER_DAY);
    projectedDueDate = toIsoDate(due);
  } else {
    usedValue = Number(row.current_value);
    remaining = limitValue - usedValue;
    if (utilizationRatePerDay && utilizationRatePerDay > 0) {
      projectedDueDate = toIsoDate(new Date(now.getTime() + (remaining / utilizationRatePerDay) * MS_PER_DAY));
    }
  }

  const usedPct = (usedValue / limitValue) * 100;
  const remainingPct = 1 - usedValue / limitValue;
  const status: LimitStatus = usedPct >= 100 ? "Overdue" : usedPct >= thresholds.dueSoonUsedPct ? "Due Soon" : "Healthy";

  return {
    id: row.id,
    limitType: row.limit_type,
    limitValue,
    usedValue,
    remaining,
    usedPct,
    remainingPct,
    status,
    projectedDueDate,
    editable: row.limit_type !== "calendar_months",
    approachingThreshold: remainingPct <= thresholds.approachingThreshold,
    lastUpdated: row.last_updated,
    acknowledgedBy: row.acknowledged_by,
    acknowledgedAt: row.acknowledged_at,
  };
}

/** Evaluates every limit on a component and flags the binding one: whichever
 * has the lowest remaining margin reaches its limit first. */
export function evaluateComponent(limits: LimitRow[], installDate: string, now: Date = new Date(), thresholds: Thresholds = DEFAULT_THRESHOLDS) {
  const evaluated = limits.map(limit => evaluateLimit(limit, installDate, now, undefined, thresholds));
  const binding = evaluated.reduce<(typeof evaluated)[number] | undefined>(
    (lowest, limit) => (!lowest || limit.remainingPct < lowest.remainingPct ? limit : lowest),
    undefined,
  );
  return {
    limits: evaluated.map(limit => ({ ...limit, binding: limit.id === binding?.id })) as EvaluatedLimit[],
    bindingLimitId: binding?.id ?? null,
    bindingRemainingPct: binding?.remainingPct ?? null,
    bindingStatus: binding?.status ?? null,
  };
}
