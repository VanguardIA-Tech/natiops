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
var ProductsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductsService = ProductsService_1 = class ProductsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ProductsService_1.name);
    }
    async findByExternalId(externalId) {
        this.logger.log(`Finding product by externalId: ${externalId}`);
        const product = await this.prisma.product.findUnique({ where: { externalId } });
        if (!product) {
            return null;
        }
        return product;
    }
    async findById(id) {
        this.logger.log(`Finding product details by id: ${id}`);
        const product = await this.prisma.product.findUnique({
            where: { externalId: id },
        });
        if (!product) {
            return null;
        }
        return product;
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
        const createData = { externalId, ...payload };
        const updateData = { ...payload };
        await this.prisma.product.upsert({
            where: { externalId },
            create: createData,
            update: updateData,
        });
    }
    async search(query) {
        const products = await this.prisma.product.findMany({
            orderBy: { name: 'asc' },
            select: { externalId: true, name: true },
        });
        this.logger.log(`Products found: ${products.length}`);
        if (!query?.trim()) {
            return products;
        }
        const filteredProducts = this.filterProductsByName(products, query);
        this.logger.log(`Products matching query "${query}": ${filteredProducts.length}`);
        return filteredProducts;
    }
    normalizeText(text) {
        return (text ?? '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }
    filterProductsByName(products, query) {
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
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = ProductsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
