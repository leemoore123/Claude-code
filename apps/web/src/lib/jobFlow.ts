// UI mirror of the API dispatch state machine — used only to offer valid
// "advance to" affordances. The API remains the authority and rejects anything
// illegal.
export const JOB_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['dispatched', 'cancelled', 'on_hold'],
  dispatched: ['en_route', 'on_site', 'cancelled', 'on_hold'],
  en_route: ['on_site', 'cancelled', 'on_hold'],
  on_site: ['in_progress', 'cancelled', 'on_hold'],
  in_progress: ['completed', 'on_hold', 'cancelled'],
  completed: ['signed_off', 'in_progress'],
  signed_off: ['invoiced'],
  invoiced: [],
  cancelled: ['scheduled'],
  on_hold: ['scheduled', 'dispatched', 'en_route', 'on_site', 'in_progress'],
};

export function nextStates(from: string): string[] {
  return JOB_TRANSITIONS[from] ?? [];
}
