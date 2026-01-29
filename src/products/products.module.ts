import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { CapacityController } from './capacity.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [],
  controllers: [ProductsController, CapacityController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
