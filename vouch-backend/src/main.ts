import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Raw body buffer required for HMAC-SHA256 signature verification on the Nomba webhook route.
  // All other routes continue to receive parsed JSON via the default NestJS body parser.
  app.use(
    '/escrow/webhooks/nomba',
    express.raw({ type: 'application/json' }),
  );

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
