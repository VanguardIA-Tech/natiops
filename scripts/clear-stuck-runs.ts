import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const result = await prisma.syncRun.updateMany({
    where: { status: { in: ['PENDING', 'RUNNING'] } },
    data: { status: 'FAILED', finishedAt: new Date(), errorMessage: 'Cancelado manualmente' },
  });
  console.log(`Runs limpos: ${result.count}`);
  await app.close();
}

void main();
