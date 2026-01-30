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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const sync_worker_service_1 = require("./sync-worker.service");
const sync_service_1 = require("./sync.service");
const sync_responses_dto_1 = require("./dto/sync-responses.dto");
let SyncController = class SyncController {
    constructor(syncService, worker) {
        this.syncService = syncService;
        this.worker = worker;
    }
    listRuns(limit, offset) {
        return this.syncService.listRuns(limit, offset);
    }
    async getRun(id) {
        const run = await this.syncService.findRunById(id);
        if (!run) {
            throw new common_1.NotFoundException('Execução de sincronização não encontrada');
        }
        return run;
    }
    scheduleFullRun() {
        return this.syncService.createPendingRun(client_1.SyncType.FULL);
    }
    async processFullRun() {
        await this.worker.processPending(client_1.SyncType.FULL);
        return { status: 'processed' };
    }
};
exports.SyncController = SyncController;
__decorate([
    (0, common_1.Get)('runs'),
    (0, swagger_1.ApiOperation)({ summary: 'Lista execuções de sincronização' }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Quantidade máxima de runs retornados',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'offset',
        required: false,
        type: Number,
        description: 'Deslocamento para paginação',
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Execuções ordenadas pela data de criação',
        type: sync_responses_dto_1.SyncRunResponseDto,
        isArray: true,
    }),
    __param(0, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('offset', new common_1.DefaultValuePipe(0), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], SyncController.prototype, "listRuns", null);
__decorate([
    (0, common_1.Get)('runs/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Retorna uma execução pelo ID' }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Identificador da execução de sincronização',
        example: '74f3b6d5-1234-4cde-8b12-1a2b3c4d5e6f',
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Detalhes de uma sincronização',
        type: sync_responses_dto_1.SyncRunResponseDto,
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getRun", null);
__decorate([
    (0, common_1.Post)('runs/full'),
    (0, swagger_1.ApiOperation)({ summary: 'Cria uma execução FULL em estado pendente' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Execução criada ou já existente pendente',
        type: sync_responses_dto_1.SyncRunResponseDto,
    }),
    (0, swagger_1.ApiConflictResponse)({ description: 'Já existe sincronização em andamento' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SyncController.prototype, "scheduleFullRun", null);
__decorate([
    (0, common_1.Post)('runs/full/process'),
    (0, swagger_1.ApiOperation)({ summary: 'Despacha o worker para processar a fila FULL' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Processamento iniciado',
        type: sync_responses_dto_1.SyncProcessResponseDto,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "processFullRun", null);
exports.SyncController = SyncController = __decorate([
    (0, swagger_1.ApiTags)('Sincronização'),
    (0, common_1.Controller)('sync'),
    __metadata("design:paramtypes", [sync_service_1.SyncService,
        sync_worker_service_1.SyncWorkerService])
], SyncController);
