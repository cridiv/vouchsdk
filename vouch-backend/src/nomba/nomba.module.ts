import { Module } from '@nestjs/common';
import { NombaService } from './nomba.service';
import { NombaWebhookController } from './nomba-webhook.controller';

@Module({
  // PrismaService is globally available via @Global() PrismaModule
  // EventEmitter2 is globally available via EventEmitterModule.forRoot()
  controllers: [NombaWebhookController],
  providers: [NombaService],
  exports: [NombaService],
})
export class NombaModule {}
