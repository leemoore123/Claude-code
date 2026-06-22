import { Module } from '@nestjs/common';
import { PpmMaterializerService } from './ppm-materializer.service';

@Module({
  providers: [PpmMaterializerService],
  exports: [PpmMaterializerService],
})
export class SchedulingModule {}
