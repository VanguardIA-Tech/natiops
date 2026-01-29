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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductsService = class ProductsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByExternalId(externalId) {
        const product = await this.prisma.product.findUnique({
            where: { externalId },
        });
        if (!product) {
            return null;
        }
        return {
            externalId: product.externalId,
            name: product.name,
            description: product.description,
            sku: product.sku,
            stockTotal: product.stockTotal,
            reservedStock: product.reservedStock,
            availableStock: product.stockTotal - product.reservedStock,
        };
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
    async syncUpsert(externalId, payload) {
        await this.prisma.product.upsert({
            where: { externalId },
            create: {
                externalId,
                name: payload.name,
                description: payload.description,
                sku: payload.sku,
                stockTotal: payload.stockTotal,
                hash: payload.hash,
            },
            update: {
                name: payload.name,
                description: payload.description,
                sku: payload.sku,
                stockTotal: payload.stockTotal,
                hash: payload.hash,
            },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
