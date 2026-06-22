import { Module } from '@nestjs/common';
import { PpmMaterializerService } from './ppm-materializer.service';
import { SchedulingController } from './scheduling.controller';
import { SchedulingCron } from './scheduling.cron';

@Module({
  controllers: [SchedulingController],
  providers: [PpmMaterializerService, SchedulingCron],
  exports: [PpmMaterializerService],
})
export class SchedulingModule {}
