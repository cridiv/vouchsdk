import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { NombaModule } from './nomba/nomba.module';
import { EscrowModule } from './escrow/escrow.module';
import { FraudModule } from './fraud/fraud.module';
import { IdentityModule } from './identity/identity.module';
import { DeveloperModule } from './developer/developer.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Loads env variables and provides ConfigService globally
    EventEmitterModule.forRoot(), // global EventEmitter2 — required by EscrowService @OnEvent
    PrismaModule, // global PrismaService
    CommonModule, // DeveloperLogService etc.
    DeveloperModule, // ApiKeyGuard, PlatformUser resolution
    NombaModule, // NombaService + NombaWebhookController
    EscrowModule, // agreements, milestones, confirm, assess
    FraudModule, // fraud scoring
    IdentityModule, // identity verification
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
