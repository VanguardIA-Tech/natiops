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
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CatalogService = class CatalogService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async upsert(externalId, payload) {
        const normalized = this.normalizePayload(payload);
        const createData = { externalId, ...normalized };
        const updateData = { ...normalized };
        await this.prisma.catalogItem.upsert({
            where: { externalId },
            create: createData,
            update: updateData,
        });
    }
    normalizePayload(payload) {
        return {
            referencia: payload.referencia ?? undefined,
            descricaoFabrica: payload.descricaoFabrica ?? undefined,
            status: payload.status ?? undefined,
            unidadeMedida: payload.unidadeMedida ?? undefined,
            fotos: payload.fotos ?? undefined,
        };
    }
    async findByReferencia(referencia) {
        return this.prisma.catalogItem.findUnique({
            where: { referencia },
        });
    }
    async getImagesByReferencia(referencia) {
        const item = await this.findByReferencia(referencia);
        if (!item) {
            return null;
        }
        const fotos = item.fotos;
        if (!Array.isArray(fotos)) {
            return [];
        }
        return fotos.filter((value) => typeof value === 'string');
    }
    async getDetailsByReferencia(referencia) {
        const item = await this.findByReferencia(referencia);
        if (!item) {
            return null;
        }
        return {
            externalId: item.externalId,
            referencia: item.referencia,
            descricaoFabrica: item.descricaoFabrica,
            status: item.status,
            unidadeDeMedida: item.unidadeMedida,
        };
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CatalogService);
