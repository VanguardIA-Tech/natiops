import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { CatalogItemDetailsResponseDto } from './dto/catalog-item-details-response.dto';

@ApiTags('Catálogo')
@Controller('catalogo')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get(':referencia/images')
  @ApiOperation({ summary: 'Retorna as URLs das imagens de um item de catálogo' })
  @ApiParam({
    name: 'referencia',
    description: 'Referência única do item no catálogo',
    example: 'REF-123',
  })
  @ApiOkResponse({
    description: 'Lista de URLs de imagens',
    type: String,
    isArray: true,
  })
  @ApiNotFoundResponse({ description: 'Item de catálogo não encontrado' })
  async getImages(@Param('referencia') referencia: string) {
    const images = await this.catalogService.getImagesByReferencia(referencia);
    if (!images) {
      throw new NotFoundException('Item de catálogo não encontrado');
    }
    return images;
  }

  @Get(':referencia/details')
  @ApiOperation({ summary: 'Retorna os detalhes de um item de catálogo' })
  @ApiParam({
    name: 'referencia',
    description: 'Referência única do item no catálogo',
    example: 'REF-123',
  })
  @ApiOkResponse({
    description: 'Detalhes principais do item de catálogo',
    type: CatalogItemDetailsResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Item de catálogo não encontrado' })
  async getDetails(@Param('referencia') referencia: string) {
    const details = await this.catalogService.getDetailsByReferencia(referencia);
    if (!details) {
      throw new NotFoundException('Item de catálogo não encontrado');
    }
    return details;
  }
}
