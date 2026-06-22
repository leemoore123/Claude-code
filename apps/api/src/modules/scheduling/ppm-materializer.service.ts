import { Injectable, Logger } from '@nestjs/common';
import { computeNextDue, type PpmFrequency } from '@fsm/shared';
import { PrismaService } from '../../prisma/prisma.service';

export interface MaterializeResult {
  rulesChecked: number;
  jobsCreated: number;
  jobsExisting: number;
  nextDueUpdated: number;
}

/**
 * Turns recurring PPM frequency rules into concrete jobs.
 *
 * For each active rule it (1) keeps `nextDueDate` current and (2) — when the due
 * date falls inside the lead window — materialises a Job. The DB unique
 * constraint on (sourcePpmRuleId, dueCycleDate) makes this idempotent: re-runs
 * never double-create. Runs nightly via cron and on demand via the controller.
 */
@Injectable()
export class PpmMaterializerService {
  private readonly logger = new Logger(PpmMaterializerService.name);
  /** Surface a job this many days before it is due. */
  private readonly leadWindowDays = 60;

  constructor(private readonly prisma: PrismaService) {}

  async run(now = new Date()): Promise<MaterializeResult> {
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + this.leadWindowDays);

    const rules = await this.prisma.ppmFrequencyRule.findMany({
      where: { active: true },
      include: { asset: { include: { site: { include: { client: true } } } } },
    });

    const result: MaterializeResult = {
      rulesChecked: rules.length,
      jobsCreated: 0,
      jobsExisting: 0,
      nextDueUpdated: 0,
    };

    for (const rule of rules) {
      const nextDue = computeNextDue(
        rule.frequency as PpmFrequency,
        rule.anchorDate,
        rule.lastCompletedDate,
        rule.customIntervalDays ?? undefined,
      );

      // Keep the stored next-due fresh.
      if (rule.nextDueDate?.getTime() !== nextDue.getTime()) {
        await this.prisma.ppmFrequencyRule.update({
          where: { id: rule.id },
          data: { nextDueDate: nextDue },
        });
        result.nextDueUpdated++;
      }

      if (nextDue > windowEnd) continue; // not due yet — leave it

      const site = rule.asset.site;
      const dueCycleDate = startOfDay(nextDue);

      const existing = await this.prisma.job.findUnique({
        where: { sourcePpmRuleId_dueCycleDate: { sourcePpmRuleId: rule.id, dueCycleDate } },
        select: { id: true },
      });
      if (existing) {
        result.jobsExisting++;
        continue;
      }

      await this.prisma.job.create({
        data: {
          orgId: site.client.orgId,
          clientId: site.clientId,
          siteId: site.id,
          contractId: site.contractId,
          jobType: 'ppm',
          sourcePpmRuleId: rule.id,
          dueCycleDate,
          status: 'scheduled',
          scheduledStart: dueCycleDate,
          summary: `${labelFor(rule.frequency as PpmFrequency)} PPM — ${rule.asset.tag}`,
        },
      });
      // Link the asset to the job.
      const job = await this.prisma.job.findUnique({
        where: { sourcePpmRuleId_dueCycleDate: { sourcePpmRuleId: rule.id, dueCycleDate } },
        select: { id: true },
      });
      if (job) {
        await this.prisma.jobAsset.create({ data: { jobId: job.id, assetId: rule.assetId } });
      }
      result.jobsCreated++;
    }

    this.logger.log(
      `Materializer: ${result.rulesChecked} rules, +${result.jobsCreated} jobs (${result.jobsExisting} existing), ${result.nextDueUpdated} due-dates updated`,
    );
    return result;
  }
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function labelFor(f: PpmFrequency): string {
  const map: Record<PpmFrequency, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    six_month: '6-Monthly',
    one_year: 'Annual',
    three_year: '3-Yearly',
    custom: 'Scheduled',
  };
  return map[f] ?? 'Scheduled';
}
