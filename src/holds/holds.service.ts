import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { HoldStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HoldsService {
  private readonly logger = new Logger(HoldsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async createHold(dto: {
    externalId: string;
    email: string;
    quantity: number;
    expiresAt: string;
  }) {
    this.logger.log(`Chamando método createHold com dto: ${JSON.stringify(dto)}`);
    const hold = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { externalId: dto.externalId },
        select: { id: true, stockTotal: true, reservedStock: true },
      });
      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }
      const available = product.stockTotal - product.reservedStock;
      if (available < dto.quantity) {
        throw new BadRequestException('Estoque insuficiente para reserva');
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

  async cancelHold(id: string) {
    this.logger.log(`Chamando método cancelHold com id: ${id}`);
    const hold = await this.prisma.hold.findUnique({ where: { id } });
    if (!hold) {
      throw new NotFoundException('Reserva não encontrada');
    }
    if (hold.status !== HoldStatus.ACTIVE) {
      throw new BadRequestException('Reserva não está ativa');
    }
    const holdCancelled = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: hold.productId },
        select: { reservedStock: true },
      });
      const updatedHold = await tx.hold.update({
        where: { id },
        data: { status: HoldStatus.CANCELLED },
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

  async renewHold(id: string, expiresAt: string) {
    const hold = await this.prisma.hold.findUnique({ where: { id } });
    if (!hold) {
      throw new NotFoundException('Reserva não encontrada');
    }
    if (hold.status !== HoldStatus.ACTIVE) {
      throw new BadRequestException('Reserva não está ativa');
    }
    return this.prisma.hold.update({
      where: { id },
      data: { expiresAt: new Date(expiresAt) },
    });
  }

  async findByEmail(email: string) {
    const holds = await this.prisma.hold.findMany({
      where: { email, status: HoldStatus.ACTIVE },
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
}
