import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { SyncModule } from './sync/sync.module';
import { ProductsModule } from './products/products.module';
import { HoldsModule } from './holds/holds.module';
import { CatalogModule } from './catalog/catalog.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: ['.env', '.env.local'],
    }),
    PrismaModule,
    SyncModule,
    ProductsModule,
    CatalogModule,
    HoldsModule,
  ],
})
export class AppModule {}
