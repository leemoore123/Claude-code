import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import type { JobStatus } from './job-state-machine';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list(
    @Query('clientId') clientId?: string,
    @Query('siteId') siteId?: string,
    @Query('engineerId') engineerId?: string,
    @Query('status') status?: string,
  ) {
    return this.jobs.list({ clientId, siteId, engineerId, status });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.jobs.get(id);
  }

  @Patch(':id/status')
  changeStatus(@Param('id') id: string, @Body('status') status: JobStatus) {
    return this.jobs.changeStatus(id, status);
  }

  @Post(':id/assign')
  assign(@Param('id') id: string, @Body('engineerId') engineerId: string, @Body('role') role?: string) {
    return this.jobs.assign(id, engineerId, role);
  }

  @Delete(':id/assign/:engineerId')
  unassign(@Param('id') id: string, @Param('engineerId') engineerId: string) {
    return this.jobs.unassign(id, engineerId);
  }
}
