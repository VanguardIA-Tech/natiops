import { Injectable, Logger } from '@nestjs/common';
import { DapicService } from '../dapic/dapic.service';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(private readonly dapicService: DapicService) {}

  async getImagesByExternalId(externalId: string): Promise<string[] | null> {
    try {
      const detail = await this.dapicService.fetchProductDetails(externalId);
      if (!detail) return null;
      const fotos = (detail as Record<string, unknown>)['Fotos'];
      if (!Array.isArray(fotos)) return [];
      return fotos.filter((entry): entry is string => typeof entry === 'string');
    } catch (error) {
      this.logger.warn(`Falha ao buscar fotos do produto ${externalId}`, error as Error);
      return null;
    }
  }
}
