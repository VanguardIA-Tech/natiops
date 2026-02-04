import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CapacityItemDto } from './dto/capacity-response.dto';
import { CapacityQueryDto } from './dto/capacity-query.dto';

@ApiTags('Produtos')
@Controller('capacity')
export class CapacityController {
  private readonly logger = new Logger(ProductsService.name);
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista itens por nome (similar), ordenados por quantidade disponível decrescente',
  })
  @ApiQuery({
    name: 'nome',
    required: false,
    description: 'Nome do item para filtrar (busca similar)',
  })
  @ApiOkResponse({
    description: 'Lista com nome e quantidade disponível (da tabela Product)',
    type: CapacityItemDto,
    isArray: true,
  })
  async getCapacity(@Query() query: CapacityQueryDto) {
    this.logger.log(`Getting capacity by item name: ${query.nome}`);
    return this.productsService.getCapacityByItemName(query.nome);
  }
}
