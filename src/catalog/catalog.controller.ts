import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CatalogService } from './catalog.service';

@ApiTags('Catálogo')
@Controller('catalogo')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get(':externalId/images')
  @ApiOperation({ summary: 'Retorna as URLs das imagens de um produto via DAPIC' })
  @ApiParam({
    name: 'externalId',
    description: 'ID externo do produto',
    example: '70',
  })
  @ApiOkResponse({
    description: 'Lista de URLs de imagens',
    type: String,
    isArray: true,
  })
  @ApiNotFoundResponse({ description: 'Produto não encontrado' })
  async getImages(@Param('externalId') externalId: string) {
    const images = await this.catalogService.getImagesByExternalId(externalId);
    if (!images) {
      throw new NotFoundException('Produto não encontrado');
    }
    return images;
  }
}
