import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Logger,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateHoldDto } from './dto/create-hold.dto';
import { FindHoldsByEmailDto } from './dto/find-holds-by-email.dto';
import { FindHoldsByEmailResponseDto } from './dto/find-holds-by-email-response.dto';
import { HoldResponseDto } from './dto/hold-response.dto';
import { RenewHoldDto } from './dto/renew-hold.dto';
import { HoldsService } from './holds.service';

@ApiTags('Reservas')
@Controller('holds')
export class HoldsController {
  private readonly logger = new Logger(HoldsController.name);
  constructor(private readonly holdsService: HoldsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova reserva de produto' })
  @ApiCreatedResponse({
    description: 'Reserva criada com sucesso',
    type: HoldResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Quantidade inválida ou estoque insuficiente',
  })
  @ApiNotFoundResponse({ description: 'Produto não encontrado' })
  @ApiBody({ type: CreateHoldDto })
  create(@Body() dto: CreateHoldDto) {
    this.logger.log(`Chamando método createHold com dto: ${JSON.stringify(dto)}`);
    return this.holdsService.createHold(dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancela uma reserva ativa' })
  @ApiParam({
    name: 'id',
    description: 'Identificador da reserva',
    example: 'c1d2e3f4-5678-90ab-cdef-1234567890ab',
  })
  @ApiOkResponse({ description: 'Reserva cancelada', type: HoldResponseDto })
  @ApiBadRequestResponse({ description: 'Reserva já foi finalizada ou inválida' })
  @ApiNotFoundResponse({ description: 'Reserva não encontrada' })
  cancel(@Param('id') id: string) {
    return this.holdsService.cancelHold(id);
  }

  @Patch(':id/renew')
  @ApiOperation({ summary: 'Renova a data de expiração de uma reserva' })
  @ApiParam({
    name: 'id',
    description: 'Identificador da reserva',
    example: 'c1d2e3f4-5678-90ab-cdef-1234567890ab',
  })
  @ApiOkResponse({ description: 'Reserva renovada', type: HoldResponseDto })
  @ApiBadRequestResponse({ description: 'Reserva não está ativa' })
  @ApiNotFoundResponse({ description: 'Reserva não encontrada' })
  @ApiBody({ type: RenewHoldDto })
  renew(@Param('id') id: string, @Body() dto: RenewHoldDto) {
    return this.holdsService.renewHold(id, dto.expiresAt);
  }

  @Post('/search')
  @ApiOperation({ summary: 'Lista reservas ativas por email' })
  @ApiBody({ type: FindHoldsByEmailDto })
  @ApiBadRequestResponse({ description: 'Email inválido ou ausente' })
  @ApiOkResponse({ description: 'Reservas encontradas', type: FindHoldsByEmailResponseDto })
  findByEmail(@Body() payload: FindHoldsByEmailDto) {
    return this.holdsService.findByEmail(payload.email);
  }
}
