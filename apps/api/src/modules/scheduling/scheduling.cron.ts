import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PpmMaterializerService } from './ppm-materializer.service';

/**
 * Nightly PPM materialization. In-process scheduler is fine here; the heavier,
 * retry-prone work (Zoho sync, PDF render) moves to BullMQ + Redis in Phase 4/5.
 */
@Injectable()
export class SchedulingCron {
  private readonly logger = new Logger(SchedulingCron.name);
  constructor(private readonly materializer: PpmMaterializerService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async nightly() {
    this.logger.log('Nightly PPM materialization starting…');
    await this.materializer.run();
  }
}
