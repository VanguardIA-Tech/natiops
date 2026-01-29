import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BodyProductsDto } from './dto/query-products.dto';

type ProductSyncedPayload = Pick<
  Prisma.ProductCreateInput,
  | 'name'
  | 'idProduto'
  | 'idGradeProduto'
  | 'idGradeProdutoEstoque'
  | 'cor'
  | 'tamanho'
  | 'grupo'
  | 'marca'
  | 'colecao'
  | 'quantidade'
  | 'quantidadeReal'
  | 'quantidadeComprometida'
  | 'valor'
  | 'valorCusto'
  | 'stockTotal'
  | 'idArmazenador'
  | 'armazenador'
>;

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async findByExternalId(externalId: string) {
    this.logger.log(`Finding product by externalId: ${externalId}`);
    const product = await this.prisma.product.findUnique({ where: { externalId } });
    if (!product) {
      return null;
    }
    return product;
  }

  async findById(id: string) {
    this.logger.log(`Finding product details by id: ${id}`);
    const product = await this.prisma.product.findUnique({
      where: { externalId: id },
    });
    if (!product) {
      return null;
    }
    return product;
  }

  async getCapacityOverview() {
    const aggregation = await this.prisma.product.aggregate({
      _sum: { stockTotal: true, reservedStock: true },
    });
    const total = aggregation._sum.stockTotal ?? 0;
    const reserved = aggregation._sum.reservedStock ?? 0;
    return {
      stockTotal: total,
      reservedStock: reserved,
      availableStock: total - reserved,
    };
  }

  async syncUpsert(externalId: string, payload: ProductSyncedPayload) {
    const createData: Prisma.ProductCreateInput = { externalId, ...payload };
    const updateData: Prisma.ProductUpdateInput = { ...payload };
    await this.prisma.product.upsert({
      where: { externalId },
      create: createData,
      update: updateData,
    });
  }

  async search(query: string) {
    const products = await this.prisma.product.findMany({
      orderBy: { name: 'asc' },
      select: { externalId: true, name: true },
    });
    this.logger.log(`Products found: ${products.length}`);
    if (!query?.trim()) {
      return products;
    }
    const filteredProducts = this.filterProductsByName(products, query);
    this.logger.log(`Products matching query "${query}": ${filteredProducts.length}`);
    return filteredProducts;
  }

  private normalizeText(text?: string) {
    return (text ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private filterProductsByName(products: { externalId: string; name?: string }[], query: string) {
    const normalizedQuery = this.normalizeText(query);
    const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
    if (!queryWords.length) {
      return [];
    }
    return products.filter(product => {
      const normalizedName = this.normalizeText(product.name);
      return queryWords.every(word => normalizedName.includes(word));
    });
  }
}
