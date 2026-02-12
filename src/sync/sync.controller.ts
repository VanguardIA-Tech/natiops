import {
  Controller,
  DefaultValuePipe,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SyncType } from '@prisma/client';
import { SyncWorkerService } from './sync-worker.service';
import { SyncService } from './sync.service';
import {
  SyncProcessResponseDto,
  SyncRunResponseDto,
} from './dto/sync-responses.dto';

@ApiTags('Sincronização')
@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly worker: SyncWorkerService,
  ) {}

  @Get('runs')
  @ApiOperation({ summary: 'Lista execuções de sincronização' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Quantidade máxima de runs retornados',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Deslocamento para paginação',
  })
  @ApiOkResponse({
    description: 'Execuções ordenadas pela data de criação',
    type: SyncRunResponseDto,
    isArray: true,
  })
  listRuns(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.syncService.listRuns(limit, offset);
  }

  @Get('runs/:id')
  @ApiOperation({ summary: 'Retorna uma execução pelo ID' })
  @ApiParam({
    name: 'id',
    description: 'Identificador da execução de sincronização',
    example: '74f3b6d5-1234-4cde-8b12-1a2b3c4d5e6f',
  })
  @ApiOkResponse({
    description: 'Detalhes de uma sincronização',
    type: SyncRunResponseDto,
  })
  async getRun(@Param('id') id: string) {
    const run = await this.syncService.findRunById(id);
    if (!run) {
      throw new NotFoundException('Execução de sincronização não encontrada');
    }
    return run;
  }

  @Post('runs/full')
  @ApiOperation({ summary: 'Cria uma execução FULL em estado pendente' })
  @ApiOkResponse({
    description: 'Execução criada ou já existente pendente',
    type: SyncRunResponseDto,
  })
  @ApiConflictResponse({ description: 'Já existe sincronização em andamento' })
  scheduleFullRun() {
    return this.syncService.createPendingRun(SyncType.FULL);
  }

  @Post('runs/full/process')
  @ApiOperation({ summary: 'Despacha o worker para processar a fila FULL' })
  @ApiOkResponse({
    description: 'Processamento iniciado',
    type: SyncProcessResponseDto,
  })
  async processFullRun() {
    await this.worker.processPending(SyncType.FULL);
    return { status: 'processed' };
  }

  @Post('runs/incremental')
  @ApiOperation({ summary: 'Cria uma execução INCREMENTAL em estado pendente' })
  @ApiOkResponse({
    description: 'Execução criada ou já existente pendente',
    type: SyncRunResponseDto,
  })
  @ApiConflictResponse({ description: 'Já existe sincronização em andamento' })
  scheduleIncrementalRun() {
    return this.syncService.createPendingRun(SyncType.INCREMENTAL);
  }

  @Post('runs/incremental/process')
  @ApiOperation({ summary: 'Despacha o worker para processar a fila INCREMENTAL' })
  @ApiOkResponse({
    description: 'Processamento iniciado',
    type: SyncProcessResponseDto,
  })
  async processIncrementalRun() {
    await this.worker.processPending(SyncType.INCREMENTAL);
    return { status: 'processed' };
  }
}
