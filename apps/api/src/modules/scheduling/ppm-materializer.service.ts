import { Injectable, Logger } from '@nestjs/common';
import { computeNextDue, type PpmFrequency } from '@fsm/shared';

interface PpmRule {
  id: string;
  assetId: string;
  frequency: PpmFrequency;
  anchorDate: Date;
  lastCompletedDate: Date | null;
  customIntervalDays?: number;
  active: boolean;
}

/**
 * Nightly job (wired to BullMQ cron in Phase 2). For each active PPM rule it
 * ensures next_due_date is current and, when the due date falls within the lead
 * window, materialises a real Job. Idempotent: the DB unique constraint on
 * (sourcePpmRuleId, dueCycleDate) prevents duplicates on re-run.
 */
@Injectable()
export class PpmMaterializerService {
  private readonly logger = new Logger(PpmMaterializerService.name);

  /** Default: surface a job 60 days before it is due. */
  constructor(private readonly leadWindowDays = 60) {}

  /** Returns the cycle dates that should be materialised into jobs `now`. */
  dueWithinWindow(rule: PpmRule, now = new Date()): Date | null {
    if (!rule.active) return null;
    const next = computeNextDue(
      rule.frequency,
      rule.anchorDate,
      rule.lastCompletedDate,
      rule.customIntervalDays,
    );
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + this.leadWindowDays);
    return next <= windowEnd ? next : null;
  }

  // Phase 2: inject PrismaClient, iterate active rules, upsert jobs on
  // (sourcePpmRuleId, dueCycleDate), and recompute next_due on completion.
  async run(): Promise<void> {
    this.logger.log('PPM materializer run — DB wiring lands in Phase 2');
  }
}
