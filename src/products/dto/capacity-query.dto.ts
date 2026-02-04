import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CapacityQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Nome do item para busca (itens com nome similar)',
    example: 'BC601719',
  })
  nome?: string;
}
