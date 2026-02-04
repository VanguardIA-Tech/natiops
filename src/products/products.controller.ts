import { Controller, Get, NotFoundException, Param, Logger, Body, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductSearchResponseDto } from './dto/product-search-response.dto';
import { BodyProductsDto } from './dto/query-products.dto';
import { ProductDetailsResponseDto } from './dto/product-details-response.dto';

@ApiTags('Produtos')
@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({
    summary: 'Retorna o produto cujo nome é informado no corpo da requisição',
  })
  @ApiBody({
    description: 'Payload com o nome do produto que deve ser buscado',
    type: BodyProductsDto,
  })
  @ApiOkResponse({
    description: 'Array com no máximo um produto correspondente ao nome informado',
    type: ProductSearchResponseDto,
    isArray: true,
  })
  async list(@Body() payload: BodyProductsDto) {
    const query = payload.nome ?? '';
    this.logger.log(`Query: ${query}`);
    this.logger.log(`Chamando método search com payload: ${JSON.stringify(query)}`);
    return this.productsService.search(query);
  }

  @Get(':externalId')
  @ApiOperation({ summary: 'Retorna os dados completos do produto pelo externalId' })
  @ApiParam({
    name: 'externalId',
    description: 'Identificador externo único do produto',
    example: 'PROD-123',
  })
  @ApiOkResponse({
    description: 'Informações de estoque e dados básicos do produto',
    type: ProductDetailsResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Produto não encontrado' })
  async getStock(@Param('externalId') externalId: string) {
    this.logger.log(`Getting stock by externalId: ${externalId}`);
    const product = await this.productsService.findByExternalId(externalId);
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }
    return product;
  }

  @Get('details/:id')
  @ApiOperation({ summary: 'Retorna detalhes completos do produto a partir do id' })
  @ApiParam({
    name: 'id',
    description: 'Id interno do produto',
    example: 'b7f1c4f8-1234-4a00-8eee-123456789abc',
  })
  @ApiOkResponse({
    description: 'Detalhes completos do produto',
    type: ProductDetailsResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Produto não encontrado' })
  async getDetails(@Param('id') id: string) {
    this.logger.log(`Getting details by id: ${id}`);
    const product = await this.productsService.findById(id);
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }
    return product;
  }
}
