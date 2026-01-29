import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CatalogPayload = {
  referencia?: string | null;
  descricaoFabrica?: string | null;
  status?: string | null;
  unidadeMedida?: string | null;
  fotos?: string[] | null;
};

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(externalId: string, payload: CatalogPayload) {
    const normalized = this.normalizePayload(payload);
    const createData: Prisma.CatalogItemCreateInput = { externalId, ...normalized };
    const updateData: Prisma.CatalogItemUpdateInput = { ...normalized };
    await this.prisma.catalogItem.upsert({
      where: { externalId },
      create: createData,
      update: updateData,
    });
  }

  private normalizePayload(payload: CatalogPayload) {
    return {
      referencia: payload.referencia ?? undefined,
      descricaoFabrica: payload.descricaoFabrica ?? undefined,
      status: payload.status ?? undefined,
      unidadeMedida: payload.unidadeMedida ?? undefined,
      fotos: payload.fotos ?? undefined,
    };
  }

  async findByReferencia(referencia: string) {
    return this.prisma.catalogItem.findUnique({
      where: { referencia },
    });
  }

  async getImagesByReferencia(referencia: string) {
    const item = await this.findByReferencia(referencia);
    if (!item) {
      return null;
    }
    const fotos = item.fotos;
    if (!Array.isArray(fotos)) {
      return [];
    }
    return fotos.filter((value): value is string => typeof value === 'string');
  }

  async getDetailsByReferencia(referencia: string) {
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
}
