import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SyncPageError, SyncType } from '@prisma/client';
import { AxiosError } from 'axios';
import { DapicService } from '../dapic/dapic.service';
import { ProductsService } from '../products/products.service';
import { SyncService } from './sync.service';

type DapicPayload = Record<string, unknown>;

/**
 * Rate limiter global: garante um intervalo mínimo (em ms) entre requests
 * usando uma fila de espera.
 */
class RateLimiter {
  private queue: Array<() => void> = [];
  private lastCall = 0;
  private readonly intervalMs: number;

  constructor(intervalMs: number) {
    this.intervalMs = intervalMs;
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      if (this.queue.length === 1) this.processQueue();
    });
  }

  private processQueue() {
    if (this.queue.length === 0) return;
    const now = Date.now();
    const wait = Math.max(0, this.lastCall + this.intervalMs - now);
    setTimeout(() => {
      this.lastCall = Date.now();
      const next = this.queue.shift();
      if (next) next();
      this.processQueue();
    }, wait);
  }
}

@Injectable()
export class SyncWorkerService {
  private readonly logger = new Logger(SyncWorkerService.name);
  private running = new Set<SyncType>();
  private rateLimitPause: Promise<void> | null = null;

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
      this.configService.get<number>('SYNC_PAGE_CONCURRENCY') ?? 2;
    const intervalSeconds =
      this.configService.get<number>('SYNC_REQUEST_INTERVAL_SECONDS') ?? 30;
    const maxRetries =
      this.configService.get<number>('SYNC_MAX_RETRIES') ?? 3;
    const pauseMinutes =
      this.configService.get<number>('SYNC_429_PAUSE_MINUTES') ?? 15;
    const intervalMs = intervalSeconds * 1000;
    const limiter = new RateLimiter(intervalMs);

    this.rateLimitPause = null;

    let dataInicial: string | undefined;
    let dataFinal: string | undefined;
    if (type === SyncType.INCREMENTAL) {
      const lastFinish = await this.syncService.getLastSuccessfulFinishDate();
      if (!lastFinish) {
        throw new Error('Nenhum sync anterior bem-sucedido. Execute um sync FULL primeiro.');
      }
      dataInicial = this.formatDateForDapic(lastFinish);
      const hoje = this.formatDateForDapic(new Date());
      if (dataInicial !== hoje) {
        dataFinal = hoje;
      }
      this.logger.log(`INCREMENTAL: DataInicial=${dataInicial}${dataFinal ? `, DataFinal=${dataFinal}` : ''}`);
    }

    const firstPageResult = await this.fetchWithRetry(
      () => this.processPage(1, limit, runId, 20000, dataInicial, dataFinal),
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
        const pageResult = await this.processPage(nextPage, limit, runId, 20000, dataInicial, dataFinal);
        if (!pageResult.hasMore) break;
        nextPage += 1;
      }
      return;
    }

    this.logger.log(`Total de páginas: ${totalPages} (${limit} items/pág, concurrency=${concurrency}, intervalo=${intervalSeconds}s)`);

    const remainingPages: number[] = [];
    for (let next = 2; next <= totalPages; next += 1) {
      remainingPages.push(next);
    }

    // Fase 1: processar todas as páginas, persistir falhas no banco
    let processed = 1;
    let failCount = 0;

    if (remainingPages.length) {
      await this.runWithConcurrency(remainingPages, concurrency, async (page) => {
        if (this.rateLimitPause) await this.rateLimitPause;
        await limiter.acquire();
        try {
          await this.processPage(page, limit, runId, 20000, dataInicial, dataFinal);
        } catch (error) {
          const httpStatus = this.extractHttpStatus(error);
          const message = error instanceof Error ? error.message : String(error);
          await this.syncService.recordPageError(runId, page, httpStatus, message);
          failCount++;

          if (httpStatus === 429) {
            this.logger.warn(`Página ${page}: 429 rate limit — pausando todos os workers por ${pauseMinutes} min`);
            await this.handleRateLimitPause(pauseMinutes);
            // Retry imediato desta página após pausa
            try {
              await this.processPage(page, limit, runId, 20000, dataInicial, dataFinal);
              await this.resolvePageErrorByRunAndPage(runId, page);
              failCount--;
            } catch (retryErr) {
              const retryStatus = this.extractHttpStatus(retryErr);
              const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
              await this.syncService.recordPageError(runId, page, retryStatus, retryMsg);
              this.logger.warn(`Página ${page} falhou novamente após pausa 429: ${retryMsg}`);
            }
          } else {
            this.logger.warn(`Página ${page} falhou, será retentada: ${message}`);
          }
        }
        processed++;
        if (processed % 100 === 0) {
          this.logger.log(`Progresso: ${processed}/${totalPages} páginas (${failCount} falhas)`);
          await this.syncService.updateRunProgress(runId, page);
        }
      });
    }

    // Fase 2: retry das páginas que falharam (do banco)
    const pendingPages = await this.syncService.getPendingRetryPages(runId);
    if (pendingPages.length > 0) {
      this.logger.log(`Retentando ${pendingPages.length} páginas que falharam (do banco)...`);

      const retryConcurrency = Math.min(concurrency, 2);
      const retryIntervalMs = intervalMs * 2;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const toRetry = await this.syncService.getPendingRetryPages(runId);
        if (toRetry.length === 0) break;

        const delayMs = attempt * 5000;
        this.logger.log(`Retry tentativa ${attempt}/${maxRetries}: ${toRetry.length} páginas (aguardando ${delayMs / 1000}s)`);
        await this.sleep(delayMs);

        const retryTimeout = 40000;
        const retryLimiter = new RateLimiter(retryIntervalMs);

        await this.runWithConcurrency(toRetry, retryConcurrency, async (pageError: SyncPageError) => {
          if (this.rateLimitPause) await this.rateLimitPause;
          await retryLimiter.acquire();
          try {
            await this.processPage(pageError.page, limit, runId, retryTimeout, dataInicial, dataFinal);
            await this.syncService.resolvePageError(pageError.id);
          } catch (error) {
            const httpStatus = this.extractHttpStatus(error);
            const message = error instanceof Error ? error.message : String(error);
            await this.syncService.recordPageError(runId, pageError.page, httpStatus, message);

            if (httpStatus === 429) {
              this.logger.warn(`Página ${pageError.page}: 429 no retry — pausando ${pauseMinutes} min`);
              await this.handleRateLimitPause(pauseMinutes);
              // Retry imediato após pausa
              try {
                await this.processPage(pageError.page, limit, runId, retryTimeout, dataInicial, dataFinal);
                await this.syncService.resolvePageError(pageError.id);
              } catch (retryErr) {
                const retryStatus = this.extractHttpStatus(retryErr);
                const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
                await this.syncService.recordPageError(runId, pageError.page, retryStatus, retryMsg);
                this.logger.warn(`Página ${pageError.page} falhou novamente após pausa 429: ${retryMsg}`);
              }
            } else {
              this.logger.warn(`Página ${pageError.page} falhou no retry ${attempt}: ${message}`);
            }
          }
        });
      }

      // Marcar restantes como PERMANENT_FAILURE
      const remaining = await this.syncService.getPendingRetryPages(runId);
      for (const pageError of remaining) {
        await this.syncService.markPagePermanentFailure(pageError.id);
      }
      if (remaining.length > 0) {
        this.logger.error(`${remaining.length} páginas marcadas como PERMANENT_FAILURE: [${remaining.slice(0, 20).map((p: SyncPageError) => p.page).join(', ')}${remaining.length > 20 ? '...' : ''}]`);
      }
    }

    // Log final com contagens do banco
    const counts = await this.syncService.countPageErrors(runId);
    await this.syncService.updateRunProgress(runId, totalPages);
    const resolved = counts['RESOLVED'] ?? 0;
    const permanent = counts['PERMANENT_FAILURE'] ?? 0;
    this.logger.log(`Sync concluído: ${totalPages - permanent}/${totalPages} páginas OK (${resolved} recuperadas em retry, ${permanent} falhas permanentes)`);
  }

  private extractHttpStatus(error: unknown): number | null {
    if (error instanceof AxiosError) {
      return error.response?.status ?? null;
    }
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as any).status;
      return typeof status === 'number' ? status : null;
    }
    return null;
  }

  private handleRateLimitPause(pauseMinutes: number): Promise<void> {
    if (this.rateLimitPause) {
      return this.rateLimitPause;
    }
    const ms = pauseMinutes * 60 * 1000;
    this.logger.warn(`Pausa global de ${pauseMinutes} min iniciada (rate limit 429)`);
    this.rateLimitPause = this.sleep(ms).then(() => {
      this.rateLimitPause = null;
      this.logger.log(`Pausa global de ${pauseMinutes} min encerrada`);
    });
    return this.rateLimitPause;
  }

  private async resolvePageErrorByRunAndPage(syncRunId: string, page: number) {
    const errors = await this.syncService.getPendingRetryPages(syncRunId);
    const match = errors.find((e: SyncPageError) => e.page === page);
    if (match) {
      await this.syncService.resolvePageError(match.id);
    }
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

  private formatDateForDapic(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T00:00:00`;
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
    dataInicial?: string,
    dataFinal?: string,
  ) {
    const response = await this.dapicService.fetchProductPage(page, limit, timeoutMs, dataInicial, dataFinal);
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
