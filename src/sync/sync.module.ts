import { Module } from '@nestjs/common';
import { DapicModule } from '../dapic/dapic.module';
import { ProductsModule } from '../products/products.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncWorkerService } from './sync-worker.service';

@Module({
  imports: [DapicModule, ProductsModule],
  controllers: [SyncController],
  providers: [SyncService, SyncWorkerService],
  exports: [SyncService, SyncWorkerService],
})
export class SyncModule {}
