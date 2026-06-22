// Shared domain enums/labels mirrored across web + api (kept in step with the
// Prisma enums). Used for badges, filters, and status pipelines in the UI.

export const JOB_STATUS_FLOW = [
  'scheduled',
  'dispatched',
  'en_route',
  'on_site',
  'in_progress',
  'completed',
  'signed_off',
  'invoiced',
] as const;
export type JobStatus =
  | (typeof JOB_STATUS_FLOW)[number]
  | 'cancelled'
  | 'on_hold';

export const PPM_FREQUENCIES = [
  'monthly',
  'quarterly',
  'six_month',
  'one_year',
  'three_year',
  'custom',
] as const;
export type PpmFrequency = (typeof PPM_FREQUENCIES)[number];

export const PPM_FREQUENCY_DAYS: Record<Exclude<PpmFrequency, 'custom'>, number> = {
  monthly: 30,
  quarterly: 91,
  six_month: 182,
  one_year: 365,
  three_year: 1095,
};

export const PPM_FREQUENCY_LABELS: Record<PpmFrequency, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  six_month: '6 Monthly',
  one_year: 'Annual',
  three_year: '3 Yearly',
  custom: 'Custom',
};

export type AssetType = 'chiller' | 'crac' | 'fan_wall' | 'ahu' | 'pump' | 'other';
export type SiteType = 'data_centre' | 'vessel';
export type UserRole = 'super_admin' | 'ops_manager' | 'dispatcher' | 'engineer' | 'client_rep';

/**
 * Compute the next PPM due date from an anchor / last-completed date.
 * next = max(anchor, lastCompleted + interval).
 */
export function computeNextDue(
  frequency: PpmFrequency,
  anchorDate: Date,
  lastCompletedDate: Date | null,
  customIntervalDays?: number,
): Date {
  const days =
    frequency === 'custom'
      ? customIntervalDays ?? 365
      : PPM_FREQUENCY_DAYS[frequency];
  if (!lastCompletedDate) return anchorDate;
  const fromLast = new Date(lastCompletedDate);
  fromLast.setDate(fromLast.getDate() + days);
  return fromLast > anchorDate ? fromLast : anchorDate;
}
