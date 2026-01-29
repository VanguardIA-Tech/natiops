import { ApiProperty } from '@nestjs/swagger';

export class ProductDetailsResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  externalId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false })
  idProduto?: number;

  @ApiProperty({ required: false })
  idGradeProduto?: number;

  @ApiProperty({ required: false })
  idGradeProdutoEstoque?: number;

  @ApiProperty({ required: false })
  cor?: string;

  @ApiProperty({ required: false })
  tamanho?: string;

  @ApiProperty({ required: false })
  grupo?: string;

  @ApiProperty({ required: false })
  marca?: string;

  @ApiProperty({ required: false })
  colecao?: string;

  @ApiProperty({ required: false })
  quantidade?: number;

  @ApiProperty({ required: false })
  quantidadeReal?: number;

  @ApiProperty({ required: false })
  quantidadeComprometida?: number;

  @ApiProperty({ required: false })
  valor?: number;

  @ApiProperty({ required: false })
  valorCusto?: number;

  @ApiProperty()
  stockTotal!: number;

  @ApiProperty()
  reservedStock!: number;

  @ApiProperty({ required: false })
  idArmazenador?: number;

  @ApiProperty({ required: false })
  armazenador?: string;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt!: Date;
}
