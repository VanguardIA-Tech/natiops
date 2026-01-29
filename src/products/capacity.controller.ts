import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CapacityResponseDto } from './dto/capacity-response.dto';

@ApiTags('Produtos')
@Controller('capacity')
export class CapacityController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Resume os totais de estoque e reservas' })
  @ApiOkResponse({
    description: 'Visão geral dos estoques totais, reservados e disponíveis',
    type: CapacityResponseDto,
  })
  async getCapacity() {
    return this.productsService.getCapacityOverview();
  }
}
