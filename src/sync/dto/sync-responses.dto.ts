import { ApiProperty } from '@nestjs/swagger';
import { SyncStatus, SyncType } from '@prisma/client';

export class SyncAuditEntryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  externalId!: string;

  @ApiProperty()
  action!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Payload capturado para auditoria',
  })
  payload!: Record<string, unknown>;

  @ApiProperty()
  hash!: string;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;
}

export class SyncCheckpointDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: SyncType })
  type!: SyncType;

  @ApiProperty()
  page!: number;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt!: Date;
}

export class SyncRunResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: SyncType })
  type!: SyncType;

  @ApiProperty({ enum: SyncStatus })
  status!: SyncStatus;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: 'string', format: 'date-time', required: false })
  startedAt?: Date;

  @ApiProperty({ type: 'string', format: 'date-time', required: false })
  finishedAt?: Date;

  @ApiProperty()
  currentPage!: number;

  @ApiProperty({ required: false })
  currentItemId?: string;

  @ApiProperty({ required: false })
  errorMessage?: string;

  @ApiProperty({
    type: () => SyncAuditEntryDto,
    isArray: true,
    required: false,
  })
  auditEntries?: SyncAuditEntryDto[];

  @ApiProperty({
    type: () => SyncCheckpointDto,
    isArray: true,
    required: false,
  })
  checkpoints?: SyncCheckpointDto[];
}

export class SyncProcessResponseDto {
  @ApiProperty({
    description: 'Status simples indicando que o processamento foi disparado',
    example: 'processed',
  })
  status!: string;
}
