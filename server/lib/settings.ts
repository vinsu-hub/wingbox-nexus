import { supabase } from "./supabase.js";

export const SETTINGS_TABLE = "settings";

export const SETTINGS_KEYS = {
  approachingThresholdPct: "life_tracking.approaching_threshold_pct",
  dueSoonUsedPct: "life_tracking.due_soon_used_pct",
  overdueUsedPct: "life_tracking.overdue_used_pct",
} as const;

const DEFAULTS: Record<string, number> = {
  [SETTINGS_KEYS.approachingThresholdPct]: 10,
  [SETTINGS_KEYS.dueSoonUsedPct]: 80,
  [SETTINGS_KEYS.overdueUsedPct]: 100,
};

/** Fetches every life-tracking threshold in one round trip, falling back to
 * documented defaults for any key not yet in the table (fresh environment
 * before the seed migration's default rows, or a key added later). Never
 * throws — a settings read failure degrades to defaults rather than
 * breaking Life Tracking. */
export async function getLifeTrackingThresholds(): Promise<{
  approachingThresholdPct: number;
  dueSoonUsedPct: number;
  overdueUsedPct: number;
}> {
  const keys = Object.values(SETTINGS_KEYS);
  const { data } = await supabase.from(SETTINGS_TABLE).select("key, value").in("key", keys);
  const byKey = new Map((data ?? []).map(row => [row.key, row.value as number]));
  return {
    approachingThresholdPct: byKey.get(SETTINGS_KEYS.approachingThresholdPct) ?? DEFAULTS[SETTINGS_KEYS.approachingThresholdPct],
    dueSoonUsedPct: byKey.get(SETTINGS_KEYS.dueSoonUsedPct) ?? DEFAULTS[SETTINGS_KEYS.dueSoonUsedPct],
    overdueUsedPct: byKey.get(SETTINGS_KEYS.overdueUsedPct) ?? DEFAULTS[SETTINGS_KEYS.overdueUsedPct],
  };
}
