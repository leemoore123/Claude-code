import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './modules/health/health.controller';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { ZohoModule } from './modules/integrations/zoho/zoho.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SchedulingModule,
    ZohoModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
