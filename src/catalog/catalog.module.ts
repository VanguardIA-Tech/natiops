import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [PrismaModule],
  providers: [CatalogService],
  exports: [CatalogService],
  controllers: [CatalogController],
})
export class CatalogModule {}
