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
var HoldsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoldsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let HoldsService = HoldsService_1 = class HoldsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(HoldsService_1.name);
    }
    async createHold(dto) {
        this.logger.log(`Chamando método createHold com dto: ${JSON.stringify(dto)}`);
        const hold = await this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { externalId: dto.externalId },
                select: { id: true, stockTotal: true, reservedStock: true },
            });
            if (!product) {
                throw new common_1.NotFoundException('Produto não encontrado');
            }
            const available = product.stockTotal - product.reservedStock;
            if (available < dto.quantity) {
                throw new common_1.BadRequestException('Estoque insuficiente para reserva');
            }
            const createdHold = await tx.hold.create({
                data: {
                    productId: product.id,
                    email: dto.email,
                    quantity: dto.quantity,
                    expiresAt: new Date(dto.expiresAt),
                },
            });
            await tx.product.update({
                where: { id: product.id },
                data: { reservedStock: product.reservedStock + dto.quantity },
            });
            return createdHold;
        });
        return hold;
    }
    async cancelHold(id) {
        this.logger.log(`Chamando método cancelHold com id: ${id}`);
        const hold = await this.prisma.hold.findUnique({ where: { id } });
        if (!hold) {
            throw new common_1.NotFoundException('Reserva não encontrada');
        }
        if (hold.status !== client_1.HoldStatus.ACTIVE) {
            throw new common_1.BadRequestException('Reserva não está ativa');
        }
        const holdCancelled = await this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: hold.productId },
                select: { reservedStock: true },
            });
            const updatedHold = await tx.hold.update({
                where: { id },
                data: { status: client_1.HoldStatus.CANCELLED },
            });
            const reserved = Math.max((product?.reservedStock ?? 0) - hold.quantity, 0);
            await tx.product.update({
                where: { id: hold.productId },
                data: { reservedStock: reserved },
            });
            return updatedHold;
        });
        return holdCancelled;
    }
    async renewHold(id, expiresAt) {
        const hold = await this.prisma.hold.findUnique({ where: { id } });
        if (!hold) {
            throw new common_1.NotFoundException('Reserva não encontrada');
        }
        if (hold.status !== client_1.HoldStatus.ACTIVE) {
            throw new common_1.BadRequestException('Reserva não está ativa');
        }
        return this.prisma.hold.update({
            where: { id },
            data: { expiresAt: new Date(expiresAt) },
        });
    }
    async findByEmail(email) {
        const holds = await this.prisma.hold.findMany({
            where: { email, status: client_1.HoldStatus.ACTIVE },
            orderBy: { createdAt: 'desc' },
            include: { product: true },
        });
        return {
            holds,
            total: holds.length,
            ...(holds.length === 0 && {
                message: 'Nenhuma reserva ativa encontrada para este email.',
            }),
        };
    }
};
exports.HoldsService = HoldsService;
exports.HoldsService = HoldsService = HoldsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HoldsService);
