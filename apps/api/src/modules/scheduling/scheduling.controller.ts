import { Controller, Post } from '@nestjs/common';
import { PpmMaterializerService } from './ppm-materializer.service';

@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly materializer: PpmMaterializerService) {}

  /** Manually run the PPM materializer (also runs nightly via cron). */
  @Post('materialize')
  async materialize() {
    return this.materializer.run();
  }
}
