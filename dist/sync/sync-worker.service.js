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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncWorkerService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const dapic_service_1 = require("../dapic/dapic.service");
const products_service_1 = require("../products/products.service");
const sync_service_1 = require("./sync.service");
let SyncWorkerService = class SyncWorkerService {
    constructor(syncService, dapicService, productsService) {
        this.syncService = syncService;
        this.dapicService = dapicService;
        this.productsService = productsService;
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
            await this.syncService.failRun(run.id, error);
        }
        finally {
            this.running.delete(type);
        }
    }
    async executeRun(runId, type) {
        const checkpoint = await this.syncService.getCheckpoint(type);
        let page = checkpoint?.page ? checkpoint.page + 1 : 1;
        const limit = 100;
        let hasMore = true;
        while (hasMore) {
            const response = await this.dapicService.fetchProductPage(page, limit);
            const { items, pagination } = this.extractPage(response);
            if (!items.length) {
                break;
            }
            for (const item of items) {
                const externalId = this.extractExternalId(item);
                const hash = this.hashPayload(item);
                const productPayload = this.mapProduct(item, hash);
                if (!externalId) {
                    continue;
                }
                await this.productsService.syncUpsert(externalId, productPayload);
                await this.syncService.recordAudit(runId, externalId, 'UPSERT', item, hash);
                await this.syncService.updateRunProgress(runId, page, externalId);
            }
            await this.syncService.upsertCheckpoint(type, page, runId);
            const totalPages = pagination?.totalPages;
            hasMore = totalPages ? page < totalPages : items.length === limit;
            page += 1;
        }
    }
    mapProduct(payload, hash) {
        const stockTotal = this.extractStock(payload);
        return {
            name: this.extractString(payload, ['nome', 'name', 'produto', 'descricao']) ?? 'Produto',
            description: this.extractString(payload, ['descricao', 'description']) ?? undefined,
            sku: this.extractString(payload, ['sku', 'codigo', 'codigoProduto']) ?? undefined,
            stockTotal,
            hash,
        };
    }
    extractStock(payload) {
        const candidate = payload['estoque_total'] ?? payload['stock'] ?? payload['quantidade'] ?? payload['qtd'];
        return typeof candidate === 'number' ? candidate : Number(candidate) || 0;
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
exports.SyncWorkerService = SyncWorkerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sync_service_1.SyncService,
        dapic_service_1.DapicService,
        products_service_1.ProductsService])
], SyncWorkerService);
