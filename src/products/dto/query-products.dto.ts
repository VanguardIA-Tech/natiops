import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BodyProductsDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Nome completo ou parcial do produto para busca',
    example: 'BC601719 - Botao Cristal - Diversos',
  })
  nome?: string;
}