import { ApiProperty } from '@nestjs/swagger';

export class CapacityItemDto {
  @ApiProperty()
  nome!: string;

  @ApiProperty({ description: 'Quantidade disponível (quantidadeReal)' })
  quantidadeDisponivel!: number;
}
