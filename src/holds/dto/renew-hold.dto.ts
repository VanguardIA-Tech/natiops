import { IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RenewHoldDto {
  @IsISO8601()
  @ApiProperty({
    description: 'Nova data de expiração da reserva em ISO 8601',
    example: '2026-02-10T23:59:59Z',
  })
  expiresAt!: string;
}
