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

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Cor do produto para filtro',
    example: 'azul',
  })
  cor?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Tamanho do produto para filtro',
    example: 'P',
  })
  tamanho?: string;
}