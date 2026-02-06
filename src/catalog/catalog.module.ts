import { Module } from '@nestjs/common';
import { DapicModule } from '../dapic/dapic.module';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [DapicModule],
  providers: [CatalogService],
  exports: [CatalogService],
  controllers: [CatalogController],
})
export class CatalogModule {}
