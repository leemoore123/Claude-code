import { Module } from '@nestjs/common';
import { ZohoClient } from './zoho.client';

@Module({
  providers: [ZohoClient],
  exports: [ZohoClient],
})
export class ZohoModule {}
