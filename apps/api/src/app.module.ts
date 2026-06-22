import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { HealthController } from './modules/health/health.controller';
import { CatalogModule } from './modules/catalog/catalog.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { FormsModule } from './modules/forms/forms.module';
import { ZohoModule } from './modules/integrations/zoho/zoho.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    StorageModule,
    CatalogModule,
    JobsModule,
    SchedulingModule,
    FormsModule,
    ZohoModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
