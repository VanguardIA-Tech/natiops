"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SyncWorkerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncWorkerService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const dapic_service_1 = require("../dapic/dapic.service");
const products_service_1 = require("../products/products.service");
const catalog_service_1 = require("../catalog/catalog.service");
const sync_service_1 = require("./sync.service");
let SyncWorkerService = SyncWorkerService_1 = class SyncWorkerService {
    constructor(syncService, dapicService, productsService, catalogService) {
        this.syncService = syncService;
        this.dapicService = dapicService;
        this.productsService = productsService;
        this.catalogService = catalogService;
        this.logger = new common_1.Logger(SyncWorkerService_1.name);
        this.running = new Set();
    }
    async processPending(type) {
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
        }
        catch (error) {
            this.logger.error(`Falha no run ${run.id}`, error);
            await this.syncService.failRun(run.id, error);
        }
        finally {
            this.running.delete(type);
        }
    }
    async executeRun(runId, type) {
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
        const remainingPages = [];
        for (let next = startPage + 1; next <= totalPages; next += 1) {
            remainingPages.push(next);
        }
        if (remainingPages.length) {
            await this.processPagesConcurrently(remainingPages, limit, runId, type, recordCheckpoint, concurrency);
        }
    }
    createCheckpointRecorder(type, runId, initialPage) {
        let maxProcessedPage = initialPage;
        return async (page) => {
            if (page <= maxProcessedPage) {
                return;
            }
            maxProcessedPage = page;
            await this.syncService.upsertCheckpoint(type, page, runId);
        };
    }
    async processPagesConcurrently(pages, limit, runId, type, recordCheckpoint, concurrency) {
        let cursor = 0;
        const workers = Array.from({ length: concurrency }, async () => {
            while (cursor < pages.length) {
                const page = pages[cursor++];
                await this.processPage(page, limit, runId, type, recordCheckpoint);
            }
        });
        await Promise.all(workers);
    }
    async processPage(page, limit, runId, type, recordCheckpoint) {
        const response = await this.dapicService.fetchProductPage(page, limit);
        const { items, pagination } = this.extractPage(response);
        if (!items.length) {
            this.logger.log(`Página ${page} não retornou itens`);
            return { pagination, hasMore: false };
        }
        this.logger.log(`Página ${page} retornou ${items.length} itens`);
        let lastExternalId;
        for (const item of items) {
            const externalId = this.extractExternalId(item);
            if (!externalId) {
                continue;
            }
            const hash = this.hashPayload(item);
            const productPayload = this.mapProduct(item);
            await this.productsService.syncUpsert(externalId, productPayload);
            await this.syncService.recordAudit(runId, externalId, 'UPSERT', item, hash);
            await this.syncCatalogItem(externalId);
            lastExternalId = externalId;
        }
        await recordCheckpoint(page);
        await this.syncService.updateRunProgress(runId, page, lastExternalId);
        const totalPages = pagination?.totalPages;
        const hasMore = totalPages ? page < totalPages : items.length === limit;
        return { pagination, hasMore };
    }
    mapProduct(payload) {
        const quantidadeReal = this.extractNumber(payload, ['QuantidadeReal', 'quantidadeReal']);
        const quantidadeComprometida = this.extractNumber(payload, ['QuantidadeComprometida', 'quantidadeComprometida']);
        const fallbackStockTotal = Math.max(this.extractStock(payload), 0);
        const stockTotal = typeof quantidadeReal === 'number'
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
    async syncCatalogItem(externalId) {
        try {
            const detail = await this.dapicService.fetchProductDetails(externalId);
            if (!detail) {
                return;
            }
            const catalogPayload = this.mapCatalogPayload(detail);
            await this.catalogService.upsert(externalId, catalogPayload);
        }
        catch (error) {
            this.logger.warn(`Falha ao sincronizar catálogo ${externalId}`, error);
        }
    }
    mapCatalogPayload(payload) {
        return {
            referencia: this.extractString(payload, ['Referencia']),
            descricaoFabrica: this.extractString(payload, ['DescricaoFabrica']),
            status: this.extractString(payload, ['Status']),
            unidadeMedida: this.extractString(payload, ['UnidadeMedida', 'SiglaUnidadeMedida']),
            fotos: this.extractStringArray(payload, ['Fotos']),
        };
    }
    extractStock(payload) {
        const candidate = payload['estoque_total'] ?? payload['stock'] ?? payload['quantidade'] ?? payload['qtd'];
        if (typeof candidate === 'number') {
            return candidate;
        }
        const parsed = Number(candidate);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    extractString(payload, keys) {
        for (const key of keys) {
            const value = payload[key];
            if (typeof value === 'string' && value.trim().length) {
                return value;
            }
        }
        return null;
    }
    extractStringArray(payload, keys) {
        for (const key of keys) {
            if (!Object.prototype.hasOwnProperty.call(payload, key)) {
                continue;
            }
            const value = payload[key];
            if (Array.isArray(value)) {
                return value.filter((entry) => typeof entry === 'string');
            }
        }
        return undefined;
    }
    extractNumber(payload, keys) {
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
    extractExternalId(payload) {
        const candidate = payload['externalId'] ?? payload['IdProduto'] ?? payload['id'] ?? payload['codigoProduto'];
        if (typeof candidate === 'string' && candidate.trim().length) {
            return candidate;
        }
        if (typeof candidate === 'number') {
            return String(candidate);
        }
        return null;
    }
    hashPayload(payload) {
        const stable = this.stableStringify(payload);
        return (0, crypto_1.createHash)('sha256').update(stable).digest('hex');
    }
    stableStringify(value) {
        if (Array.isArray(value)) {
            return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
        }
        if (value && typeof value === 'object') {
            const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
            return `{${entries.map(([key, val]) => `${key}:${this.stableStringify(val)}`).join(',')}}`;
        }
        return JSON.stringify(value);
    }
    extractPage(response) {
        const data = response?.data ?? response;
        const items = Array.isArray(data?.items) ? data.items : Array.isArray(response?.items) ? response.items : [];
        const pagination = data?.pagination ?? data?.meta ?? null;
        return { items, pagination };
    }
};
exports.SyncWorkerService = SyncWorkerService;
exports.SyncWorkerService = SyncWorkerService = SyncWorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sync_service_1.SyncService,
        dapic_service_1.DapicService,
        products_service_1.ProductsService,
        catalog_service_1.CatalogService])
], SyncWorkerService);
