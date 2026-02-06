import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
    return this.prisma.product.findUnique({ where: { externalId } });
  }

  async findById(id: string) {
    return this.prisma.product.findUnique({ where: { externalId: id } });
  }

  async getCapacityByItemName(nome?: string): Promise<
    { nome: string; quantidadeDisponivel: number }[]
  > {
    const products = await this.prisma.product.findMany({
      select: { externalId: true, name: true, quantidadeReal: true },
    });

    const filtered =
      nome?.trim() ?
        this.filterProductsByName(
          products.map(p => ({ externalId: p.externalId, name: p.name })),
          nome,
        ).map(f => f.externalId)
      : products.map(p => p.externalId);

    return products
      .filter(p => filtered.includes(p.externalId))
      .sort((a, b) => (b.quantidadeReal ?? 0) - (a.quantidadeReal ?? 0))
      .map(p => ({
        nome: p.name,
        quantidadeDisponivel: p.quantidadeReal ?? 0,
      }));
  }

  async bulkUpsert(items: Array<{ externalId: string; payload: ProductSyncedPayload }>) {
    if (items.length === 0) return;
    const BATCH_SIZE = 1000;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const chunk = items.slice(i, i + BATCH_SIZE);
      await this.executeBulkUpsert(chunk);
    }
  }

  private async executeBulkUpsert(items: Array<{ externalId: string; payload: ProductSyncedPayload }>) {
    const FIELDS_PER_ROW = 18;
    const values: unknown[] = [];
    const valuesClauses: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const offset = i * FIELDS_PER_ROW;
      const { externalId, payload } = items[i];

      valuesClauses.push(
        `(gen_random_uuid(), $${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}, $${offset + 17}, $${offset + 18}, NOW(), NOW())`,
      );

      values.push(
        externalId,
        payload.name,
        payload.idProduto ?? null,
        payload.idGradeProduto ?? null,
        payload.idGradeProdutoEstoque ?? null,
        payload.cor ?? null,
        payload.tamanho ?? null,
        payload.grupo ?? null,
        payload.marca ?? null,
        payload.colecao ?? null,
        payload.quantidade ?? null,
        payload.quantidadeReal ?? null,
        payload.quantidadeComprometida ?? null,
        payload.valor ?? null,
        payload.valorCusto ?? null,
        payload.stockTotal,
        payload.idArmazenador ?? null,
        payload.armazenador ?? null,
      );
    }

    const sql = `
      INSERT INTO "Product" (
        "id", "externalId", "Produto", "IdProduto", "IdGradeProduto", "IdGradeProdutoEstoque",
        "Cor", "Tamanho", "Grupo", "Marca", "Colecao", "Quantidade",
        "QuantidadeReal", "QuantidadeComprometida", "Valor", "ValorCusto",
        "stockTotal", "IdArmazenador", "Armazenador", "createdAt", "updatedAt"
      ) VALUES ${valuesClauses.join(', ')}
      ON CONFLICT ("externalId") DO UPDATE SET
        "Produto" = EXCLUDED."Produto",
        "IdProduto" = EXCLUDED."IdProduto",
        "IdGradeProduto" = EXCLUDED."IdGradeProduto",
        "IdGradeProdutoEstoque" = EXCLUDED."IdGradeProdutoEstoque",
        "Cor" = EXCLUDED."Cor",
        "Tamanho" = EXCLUDED."Tamanho",
        "Grupo" = EXCLUDED."Grupo",
        "Marca" = EXCLUDED."Marca",
        "Colecao" = EXCLUDED."Colecao",
        "Quantidade" = EXCLUDED."Quantidade",
        "QuantidadeReal" = EXCLUDED."QuantidadeReal",
        "QuantidadeComprometida" = EXCLUDED."QuantidadeComprometida",
        "Valor" = EXCLUDED."Valor",
        "ValorCusto" = EXCLUDED."ValorCusto",
        "stockTotal" = EXCLUDED."stockTotal",
        "IdArmazenador" = EXCLUDED."IdArmazenador",
        "Armazenador" = EXCLUDED."Armazenador",
        "updatedAt" = NOW()
    `;

    await this.prisma.$executeRawUnsafe(sql, ...values);
  }

  async syncUpsert(externalId: string, payload: ProductSyncedPayload) {
    await this.prisma.product.upsert({
      where: { externalId },
      create: { externalId, ...payload },
      update: { ...payload },
    });
  }

  async search(query: string) {
    const products = await this.prisma.product.findMany({
      orderBy: { name: 'asc' },
      select: { externalId: true, name: true },
    });
    if (!query?.trim()) {
      return products;
    }
    return this.filterProductsByName(products, query);
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
