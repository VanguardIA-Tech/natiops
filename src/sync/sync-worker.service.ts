import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SyncType } from '@prisma/client';
import { DapicService } from '../dapic/dapic.service';
import { ProductsService } from '../products/products.service';
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
    private readonly configService: ConfigService,
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
    const limit =
      this.configService.get<number>('SYNC_PAGE_SIZE') ?? 200;
    const concurrency =
      this.configService.get<number>('SYNC_PAGE_CONCURRENCY') ?? 20;
    const maxRetries =
      this.configService.get<number>('SYNC_MAX_RETRIES') ?? 3;

    const firstPageResult = await this.fetchWithRetry(
      () => this.processPage(1, limit, runId),
      maxRetries,
      'Página 1',
    );
    if (!firstPageResult || !firstPageResult.hasMore) {
      return;
    }

    const totalPages = firstPageResult.pagination?.totalPages;
    if (!totalPages) {
      let nextPage = 2;
      while (true) {
        const pageResult = await this.processPage(nextPage, limit, runId);
        if (!pageResult.hasMore) break;
        nextPage += 1;
      }
      return;
    }

    this.logger.log(`Total de páginas: ${totalPages} (${limit} items/pág, concurrency=${concurrency})`);

    const remainingPages: number[] = [];
    for (let next = 2; next <= totalPages; next += 1) {
      remainingPages.push(next);
    }

    // Fase 1: processar todas as páginas, coletar falhas
    const failedPages: number[] = [];
    let processed = 1;

    if (remainingPages.length) {
      await this.runWithConcurrency(remainingPages, concurrency, async (page) => {
        try {
          await this.processPage(page, limit, runId);
        } catch (error) {
          this.logger.warn(`Página ${page} falhou, será retentada: ${(error as Error).message}`);
          failedPages.push(page);
        }
        processed++;
        if (processed % 100 === 0) {
          this.logger.log(`Progresso: ${processed}/${totalPages} páginas (${failedPages.length} falhas)`);
          await this.syncService.updateRunProgress(runId, page);
        }
      });
    }

    // Fase 2: retry das páginas que falharam (com timeout maior e espera entre tentativas)
    if (failedPages.length > 0) {
      this.logger.log(`Retentando ${failedPages.length} páginas que falharam...`);
      const stillFailed: number[] = [];

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const toRetry = attempt === 1 ? failedPages : stillFailed.splice(0);
        if (toRetry.length === 0) break;

        const delayMs = attempt * 5000; // 5s, 10s, 15s entre tentativas
        this.logger.log(`Retry tentativa ${attempt}/${maxRetries}: ${toRetry.length} páginas (aguardando ${delayMs / 1000}s)`);
        await this.sleep(delayMs);

        const retryConcurrency = Math.min(concurrency, 10); // menos agressivo no retry
        const retryTimeout = 40000; // 40s de timeout no retry

        await this.runWithConcurrency(toRetry, retryConcurrency, async (page) => {
          try {
            await this.processPage(page, limit, runId, retryTimeout);
          } catch (error) {
            this.logger.warn(`Página ${page} falhou no retry ${attempt}: ${(error as Error).message}`);
            stillFailed.push(page);
          }
        });
      }

      if (stillFailed.length > 0) {
        this.logger.error(`${stillFailed.length} páginas falharam após ${maxRetries} tentativas: [${stillFailed.slice(0, 20).join(', ')}${stillFailed.length > 20 ? '...' : ''}]`);
      }
    }

    await this.syncService.updateRunProgress(runId, totalPages);
    const successPages = totalPages - failedPages.length;
    this.logger.log(`Sync concluído: ${successPages}/${totalPages} páginas processadas com sucesso`);
  }

  private async fetchWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    label: string,
  ): Promise<T | null> {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt > maxRetries) {
          this.logger.error(`${label} falhou após ${maxRetries + 1} tentativas: ${(error as Error).message}`);
          throw error;
        }
        const delayMs = attempt * 5000;
        this.logger.warn(`${label} falhou (tentativa ${attempt}), retry em ${delayMs / 1000}s: ${(error as Error).message}`);
        await this.sleep(delayMs);
      }
    }
    return null;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async runWithConcurrency<T>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<void>,
  ) {
    let index = 0;
    const workers = Array.from({ length: concurrency }, async () => {
      while (index < items.length) {
        const i = index++;
        if (i >= items.length) break;
        await fn(items[i]);
      }
    });
    await Promise.all(workers);
  }

  private async processPage(
    page: number,
    limit: number,
    runId: string,
    timeoutMs = 20000,
  ) {
    const response = await this.dapicService.fetchProductPage(page, limit, timeoutMs);
    const { items, pagination } = this.extractPage(response);
    if (!items.length) {
      return { pagination, hasMore: false };
    }

    const productItems: Array<{ externalId: string; payload: ReturnType<SyncWorkerService['mapProduct']> }> = [];
    for (const item of items) {
      const externalId = this.extractExternalId(item);
      if (!externalId) continue;
      productItems.push({ externalId, payload: this.mapProduct(item) });
    }

    if (productItems.length) {
      await this.productsService.bulkUpsert(productItems);
    }

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

  private extractStock(payload: DapicPayload) {
    const candidate = payload['estoque_total'] ?? payload['stock'] ?? payload['quantidade'] ?? payload['qtd'];
    if (typeof candidate === 'number') return candidate;
    const parsed = Number(candidate);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private extractString(payload: DapicPayload, keys: string[]) {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim().length) return value;
    }
    return null;
  }

  private extractNumber(payload: DapicPayload, keys: string[]) {
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(payload, key)) continue;
      const value = payload[key];
      if (value === null) return null;
      if (typeof value === 'number') return value;
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return undefined;
  }

  private extractExternalId(payload: DapicPayload) {
    const candidate = payload['externalId'] ?? payload['IdProduto'] ?? payload['id'] ?? payload['codigoProduto'];
    if (typeof candidate === 'string' && candidate.trim().length) return candidate;
    if (typeof candidate === 'number') return String(candidate);
    return null;
  }

  private extractPage(response: unknown) {
    const data = (response as any)?.data ?? response;
    const items = Array.isArray(data?.items) ? data.items : Array.isArray((response as any)?.items) ? (response as any).items : [];
    const pagination = data?.pagination ?? data?.meta ?? null;
    return { items, pagination };
  }
}
