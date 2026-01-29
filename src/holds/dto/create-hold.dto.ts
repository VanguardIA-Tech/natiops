import { IsEmail, IsInt, IsPositive, IsISO8601, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHoldDto {
  @IsString()
  @ApiProperty({
    description: 'Identificador externo do produto a ser reservado',
    example: 'PROD-123',
  })
  externalId!: string;

  @IsEmail()
  @ApiProperty({
    description: 'Email do cliente que está solicitando a reserva',
    example: 'cliente@nativa.com.br',
  })
  email!: string;

  @IsInt()
  @IsPositive()
  @ApiProperty({
    description: 'Quantidade de itens que devem ser reservados',
    example: 2,
  })
  quantity!: number;

  @IsISO8601()
  @ApiProperty({
    description: 'Data de expiração da reserva em ISO 8601',
    example: '2026-02-05T23:59:59Z',
  })
  expiresAt!: string;
}
