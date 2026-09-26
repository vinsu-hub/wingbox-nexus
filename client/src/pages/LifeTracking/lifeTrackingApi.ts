export type LimitType = "hours" | "cycles" | "calendar_months";
export type LimitStatus = "Healthy" | "Due Soon" | "Overdue";

export interface ApiLimit {
  id: string;
  limitType: LimitType;
  limitValue: number;
  usedValue: number;
  remaining: number;
  usedPct: number;
  remainingPct: number;
  status: LimitStatus;
  projectedDueDate: string | null;
  editable: boolean;
  approachingThreshold: boolean;
  binding: boolean;
  lastUpdated: string;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
}

export interface ApiComponent {
  id: string;
  tail: string;
  partNumber: string;
  serialNumber: string;
  description: string;
  ataChapter: string | null;
  installDate: string;
  limits: ApiLimit[];
  bindingLimitId: string | null;
  bindingRemainingPct: number | null;
  bindingStatus: LimitStatus | null;
}

export interface LifeSummary {
  total: number;
  threshold: number;
  approaching: number;
  overdue: number;
}

/** One table row per (component, limit) — the page's Hours / Cycles / Days
 * toggle filters by limit type, same as before this was backed by real data. */
export interface LifeComponent {
  id: string;
  componentId: string;
  limitType: LimitType;
  tail: string;
  component: string;
  partNumber: string;
  serial: string;
  priority: "High" | "Med" | "Low";
  lifeUsedPct: number;
  remaining: string;
  status: LimitStatus;
  /** Null for hours/cycles: projecting a date needs utilization data that doesn't exist yet. */
  nextDue: string | null;
  /** This limit is the component's binding (soonest-reached) constraint. */
  binding: boolean;
  multiLimit: boolean;
  editable: boolean;
  currentValue: number;
  limitValue: number;
}

export const LIMIT_SUFFIX: Record<LimitType, string> = { hours: "FH", cycles: "FC", calendar_months: "days" };
export const LIMIT_LABEL: Record<LimitType, string> = { hours: "Flight hours", cycles: "Flight cycles", calendar_months: "Calendar" };

async function json<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body as T;
}

export const fetchComponents = (tail?: string) =>
  fetch(`/api/life-tracking/components${tail ? `?tail=${encodeURIComponent(tail)}` : ""}`).then(json<ApiComponent[]>);

export const fetchSummary = () => fetch("/api/life-tracking/summary").then(json<LifeSummary>);

export const updateReading = (limitId: string, currentValue: number, actor: string) =>
  fetch(`/api/life-tracking/limits/${limitId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentValue, actor }),
  }).then(json<ApiLimit>);

export const acknowledgeLimit = (limitId: string, actor: string) =>
  fetch(`/api/life-tracking/limits/${limitId}/acknowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor }),
  }).then(json<ApiLimit>);

export function toLifeRows(components: ApiComponent[]): LifeComponent[] {
  return components.flatMap(component =>
    component.limits.map(limit => {
      const lifeUsedPct = Math.round(limit.usedPct);
      return {
        id: limit.id,
        componentId: component.id,
        limitType: limit.limitType,
        tail: component.tail,
        component: component.description,
        partNumber: component.partNumber,
        serial: component.serialNumber,
        priority: lifeUsedPct >= 90 ? "High" : lifeUsedPct >= 65 ? "Med" : "Low",
        lifeUsedPct,
        remaining: `${Math.round(limit.remaining).toLocaleString("en-US")} ${LIMIT_SUFFIX[limit.limitType]}`,
        status: limit.status,
        nextDue: limit.projectedDueDate,
        binding: limit.binding,
        multiLimit: component.limits.length > 1,
        editable: limit.editable,
        currentValue: limit.usedValue,
        limitValue: limit.limitValue,
      };
    }),
  );
}
