import { BadRequestException } from '@nestjs/common';

export type JobStatus =
  | 'scheduled'
  | 'dispatched'
  | 'en_route'
  | 'on_site'
  | 'in_progress'
  | 'completed'
  | 'signed_off'
  | 'invoiced'
  | 'cancelled'
  | 'on_hold';

// Allowed forward transitions for the dispatch pipeline. cancelled/on_hold are
// reachable from any active state; on_hold can resume to where it makes sense.
const TRANSITIONS: Record<JobStatus, JobStatus[]> = {
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

export function assertTransition(from: JobStatus, to: JobStatus): void {
  if (from === to) return;
  if (!TRANSITIONS[from]?.includes(to)) {
    throw new BadRequestException(
      `Illegal job status transition: ${from} → ${to}. Allowed: ${TRANSITIONS[from]?.join(', ') || 'none'}`,
    );
  }
}

export function nextStates(from: JobStatus): JobStatus[] {
  return TRANSITIONS[from] ?? [];
}
