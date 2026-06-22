import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { assertTransition, type JobStatus } from './job-state-machine';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  list(params: { clientId?: string; siteId?: string; engineerId?: string; status?: string }) {
    return this.prisma.job.findMany({
      where: {
        clientId: params.clientId,
        siteId: params.siteId,
        status: params.status as any,
        assignments: params.engineerId ? { some: { engineerId: params.engineerId } } : undefined,
      },
      orderBy: { scheduledStart: 'asc' },
      include: {
        site: { select: { name: true, code: true } },
        client: { select: { name: true } },
        assignments: { include: { engineer: { select: { id: true, fullName: true } } } },
        jobAssets: { include: { asset: { select: { tag: true, assetType: true } } } },
      },
    });
  }

  async get(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        site: true,
        client: true,
        assignments: { include: { engineer: true } },
        jobAssets: { include: { asset: true } },
        submissions: true,
      },
    });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  async changeStatus(id: string, to: JobStatus) {
    const job = await this.prisma.job.findUnique({ where: { id }, select: { status: true } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    assertTransition(job.status as JobStatus, to);

    // Completing/sign-off of a PPM advances its source rule's last-completed so
    // the next cycle materialises.
    const updated = await this.prisma.job.update({ where: { id }, data: { status: to as any } });
    if ((to === 'completed' || to === 'signed_off') && updated.sourcePpmRuleId) {
      await this.prisma.ppmFrequencyRule.update({
        where: { id: updated.sourcePpmRuleId },
        data: { lastCompletedDate: new Date() },
      });
    }
    return updated;
  }

  async assign(id: string, engineerId: string, roleOnJob = 'lead') {
    await this.get(id); // 404 if missing
    return this.prisma.jobAssignment.upsert({
      where: { jobId_engineerId: { jobId: id, engineerId } },
      create: { jobId: id, engineerId, roleOnJob },
      update: { roleOnJob },
    });
  }

  async unassign(id: string, engineerId: string) {
    await this.prisma.jobAssignment
      .delete({ where: { jobId_engineerId: { jobId: id, engineerId } } })
      .catch(() => undefined);
    return { ok: true };
  }
}
