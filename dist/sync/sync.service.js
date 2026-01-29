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
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let SyncService = class SyncService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPendingRun(type) {
        const running = await this.prisma.syncRun.findFirst({
            where: { type, status: { in: [client_1.SyncStatus.PENDING, client_1.SyncStatus.RUNNING] } },
        });
        if (running) {
            throw new common_1.ConflictException('Já existe sincronização em andamento');
        }
        return this.prisma.syncRun.create({
            data: { type, status: client_1.SyncStatus.PENDING },
        });
    }
    async acquirePendingRun(type) {
        return this.prisma.$transaction(async (tx) => {
            const pending = await tx.syncRun.findFirst({
                where: { type, status: client_1.SyncStatus.PENDING },
                orderBy: { createdAt: 'asc' },
            });
            if (!pending) {
                return null;
            }
            return tx.syncRun.update({
                where: { id: pending.id },
                data: {
                    status: client_1.SyncStatus.RUNNING,
                    startedAt: new Date(),
                    errorMessage: null,
                },
            });
        });
    }
    async updateRunProgress(id, page, currentItemId) {
        await this.prisma.syncRun.update({
            where: { id },
            data: {
                currentPage: page,
                currentItemId,
            },
        });
    }
    async completeRun(id) {
        await this.prisma.syncRun.update({
            where: { id },
            data: {
                status: client_1.SyncStatus.SUCCESS,
                finishedAt: new Date(),
            },
        });
    }
    async failRun(id, error) {
        await this.prisma.syncRun.update({
            where: { id },
            data: {
                status: client_1.SyncStatus.FAILED,
                errorMessage: error instanceof Error ? error.message : String(error),
                finishedAt: new Date(),
            },
        });
    }
    async upsertCheckpoint(type, page, runId) {
        await this.prisma.syncCheckpoint.upsert({
            where: { type },
            create: {
                type,
                page,
                syncRunId: runId,
            },
            update: {
                page,
                syncRunId: runId,
            },
        });
    }
    async recordAudit(runId, externalId, action, payload, hash) {
        await this.prisma.syncAudit.create({
            data: {
                syncRunId: runId,
                externalId,
                action,
                payload,
                hash,
            },
        });
    }
    async getCheckpoint(type) {
        return this.prisma.syncCheckpoint.findUnique({
            where: { type },
        });
    }
    async listRuns(limit = 20, offset = 0) {
        return this.prisma.syncRun.findMany({
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findRunById(id) {
        return this.prisma.syncRun.findUnique({
            where: { id },
            include: { auditEntries: true, checkpoints: true },
        });
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SyncService);
