import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './modules/health/health.controller';
import { CatalogModule } from './modules/catalog/catalog.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { ZohoModule } from './modules/integrations/zoho/zoho.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CatalogModule,
    JobsModule,
    SchedulingModule,
    ZohoModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
