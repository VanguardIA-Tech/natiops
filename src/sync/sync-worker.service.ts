import { Injectable, Logger } from '@nestjs/common';
import { Prisma, SyncType } from '@prisma/client';
import { createHash } from 'crypto';
import { DapicService } from '../dapic/dapic.service';
import { ProductsService } from '../products/products.service';
import { CatalogService } from '../catalog/catalog.service';
import { SyncService } from './sync.service';

type DapicPayload = Record<string, unknown>;

@Injectable()
export class SyncWorkerService {
  private readonly logger = new Logger(SyncWorkerService.name);
  private running = new Set<SyncType>();

  constructor(
    private readonly syncService: SyncService,
    private readonly dapicService: DapicService,
    private readonly productsService: ProductsService,
    private readonly catalogService: CatalogService,
  ) {}

  async processPending(type: SyncType) {
    if (this.running.has(type)) {
      return;
    }
    const run = await this.syncService.acquirePendingRun(type);
    if (!run) {
      return;
    }
    this.running.add(type);
    try {
      await this.executeRun(run.id, type);
      await this.syncService.completeRun(run.id);
    } catch (error) {
      this.logger.error(`Falha no run ${run.id}`, error as Error);
      await this.syncService.failRun(run.id, error);
    } finally {
      this.running.delete(type);
    }
  }

  private async executeRun(runId: string, type: SyncType) {
    this.logger.log(`Iniciando run ${runId} (${type})`);
    const checkpoint = await this.syncService.getCheckpoint(type);
    const limit = 100;
    const concurrency = 5;
    const startPage = checkpoint?.page ? checkpoint.page + 1 : 1;
    const recordCheckpoint = this.createCheckpointRecorder(type, runId, checkpoint?.page ?? 0);
    const firstPageResult = await this.processPage(startPage, limit, runId, type, recordCheckpoint);
    if (!firstPageResult.hasMore) {
      return;
    }
    const totalPages = firstPageResult.pagination?.totalPages;
    if (!totalPages) {
      let nextPage = startPage + 1;
      while (true) {
        const pageResult = await this.processPage(nextPage, limit, runId, type, recordCheckpoint);
        if (!pageResult.hasMore) {
          break;
        }
        nextPage += 1;
      }
      return;
    }
    const remainingPages: number[] = [];
    for (let next = startPage + 1; next <= totalPages; next += 1) {
      remainingPages.push(next);
    }
    if (remainingPages.length) {
      await this.processPagesConcurrently(
        remainingPages,
        limit,
        runId,
        type,
        recordCheckpoint,
        concurrency,
      );
    }
  }

  private createCheckpointRecorder(
    type: SyncType,
    runId: string,
    initialPage: number,
  ) {
    let maxProcessedPage = initialPage;
    return async (page: number) => {
      if (page <= maxProcessedPage) {
        return;
      }
      maxProcessedPage = page;
      await this.syncService.upsertCheckpoint(type, page, runId);
    };
  }

  private async processPagesConcurrently(
    pages: number[],
    limit: number,
    runId: string,
    type: SyncType,
    recordCheckpoint: (page: number) => Promise<void>,
    concurrency: number,
  ) {
    let cursor = 0;
    const workers = Array.from({ length: concurrency }, async () => {
      while (cursor < pages.length) {
        const page = pages[cursor++];
        await this.processPage(page, limit, runId, type, recordCheckpoint);
      }
    });
    await Promise.all(workers);
  }

  private async processPage(
    page: number,
    limit: number,
    runId: string,
    type: SyncType,
    recordCheckpoint: (page: number) => Promise<void>,
  ) {
    const response = await this.dapicService.fetchProductPage(page, limit);
    const { items, pagination } = this.extractPage(response);
    if (!items.length) {
      this.logger.log(`Página ${page} não retornou itens`);
      return { pagination, hasMore: false };
    }
    this.logger.log(`Página ${page} retornou ${items.length} itens`);
    let lastExternalId: string | undefined;
    for (const item of items) {
      const externalId = this.extractExternalId(item);
      if (!externalId) {
        continue;
      }
      const hash = this.hashPayload(item);
      const productPayload = this.mapProduct(item);
      await this.productsService.syncUpsert(externalId, productPayload);
      await this.syncService.recordAudit(runId, externalId, 'UPSERT', item as Prisma.InputJsonValue, hash);
      await this.syncCatalogItem(externalId);
      lastExternalId = externalId;
    }
    await recordCheckpoint(page);
    await this.syncService.updateRunProgress(runId, page, lastExternalId);
    const totalPages = pagination?.totalPages;
    const hasMore = totalPages ? page < totalPages : items.length === limit;
    return { pagination, hasMore };
  }

  private mapProduct(payload: DapicPayload) {
    const quantidadeReal = this.extractNumber(payload, ['QuantidadeReal', 'quantidadeReal']);
    const quantidadeComprometida = this.extractNumber(payload, ['QuantidadeComprometida', 'quantidadeComprometida']);
    const fallbackStockTotal = Math.max(this.extractStock(payload), 0);
    const stockTotal =
      typeof quantidadeReal === 'number'
        ? Math.max(quantidadeReal - (quantidadeComprometida ?? 0), 0)
        : fallbackStockTotal;
    return {
      name: this.extractString(payload, ['Produto', 'nome', 'name']) ?? 'Produto',
      idProduto: this.extractNumber(payload, ['IdProduto', 'idProduto', 'Idproduto']),
      idGradeProduto: this.extractNumber(payload, ['IdGradeProduto', 'idGradeProduto']),
      idGradeProdutoEstoque: this.extractNumber(payload, ['IdGradeProdutoEstoque', 'idGradeProdutoEstoque']),
      cor: this.extractString(payload, ['Cor', 'cor']),
      tamanho: this.extractString(payload, ['Tamanho', 'tamanho']),
      grupo: this.extractString(payload, ['Grupo']),
      marca: this.extractString(payload, ['Marca']),
      colecao: this.extractString(payload, ['Colecao']),
      quantidade: this.extractNumber(payload, ['Quantidade', 'quantidade']),
      quantidadeReal,
      quantidadeComprometida,
      valor: this.extractNumber(payload, ['Valor']),
      valorCusto: this.extractNumber(payload, ['ValorCusto']),
      stockTotal,
      idArmazenador: this.extractNumber(payload, ['IdArmazenador', 'idArmazenador']),
      armazenador: this.extractString(payload, ['Armazenador']),
    };
  }

  private async syncCatalogItem(externalId: string) {
    try {
      const detail = await this.dapicService.fetchProductDetails(externalId);
      if (!detail) {
        return;
      }
      const catalogPayload = this.mapCatalogPayload(detail);
      await this.catalogService.upsert(externalId, catalogPayload);
    } catch (error) {
      this.logger.warn(`Falha ao sincronizar catálogo ${externalId}`, error as Error);
    }
  }

  private mapCatalogPayload(payload: DapicPayload) {
    return {
      referencia: this.extractString(payload, ['Referencia']),
      descricaoFabrica: this.extractString(payload, ['DescricaoFabrica']),
      status: this.extractString(payload, ['Status']),
      unidadeMedida: this.extractString(payload, ['UnidadeMedida', 'SiglaUnidadeMedida']),
      fotos: this.extractStringArray(payload, ['Fotos']),
    };
  }

  private extractStock(payload: DapicPayload) {
    const candidate = payload['estoque_total'] ?? payload['stock'] ?? payload['quantidade'] ?? payload['qtd'];
    if (typeof candidate === 'number') {
      return candidate;
    }
    const parsed = Number(candidate);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private extractString(payload: DapicPayload, keys: string[]) {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim().length) {
        return value;
      }
    }
    return null;
  }

  private extractStringArray(payload: DapicPayload, keys: string[]) {
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(payload, key)) {
        continue;
      }
      const value = payload[key];
      if (Array.isArray(value)) {
        return value.filter((entry): entry is string => typeof entry === 'string');
      }
    }
    return undefined;
  }

  private extractNumber(payload: DapicPayload, keys: string[]) {
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(payload, key)) {
        continue;
      }
      const value = payload[key];
      if (value === null) {
        return null;
      }
      if (typeof value === 'number') {
        return value;
      }
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return undefined;
  }

  private extractExternalId(payload: DapicPayload) {
    const candidate = payload['externalId'] ?? payload['IdProduto'] ?? payload['id'] ?? payload['codigoProduto'];
    if (typeof candidate === 'string' && candidate.trim().length) {
      return candidate;
    }
    if (typeof candidate === 'number') {
      return String(candidate);
    }
    return null;
  }

  private hashPayload(payload: DapicPayload) {
    const stable = this.stableStringify(payload);
    return createHash('sha256').update(stable).digest('hex');
  }

  private stableStringify(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
      return `{${entries.map(([key, val]) => `${key}:${this.stableStringify(val)}`).join(',')}}`;
    }
    return JSON.stringify(value);
  }

  private extractPage(response: unknown) {
    const data = (response as any)?.data ?? response;
    const items = Array.isArray(data?.items) ? data.items : Array.isArray((response as any)?.items) ? (response as any).items : [];
    const pagination = data?.pagination ?? data?.meta ?? null;
    return { items, pagination };
  }
}
