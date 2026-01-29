import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SyncType } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { SyncService } from '../src/sync/sync.service';
import { SyncWorkerService } from '../src/sync/sync-worker.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const syncService = app.get(SyncService);
  const worker = app.get(SyncWorkerService);
  await syncService.createPendingRun(SyncType.FULL);
  await worker.processPending(SyncType.FULL);
  await app.close();
}

void main();
