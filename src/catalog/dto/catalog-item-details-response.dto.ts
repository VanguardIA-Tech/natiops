import { ApiProperty } from '@nestjs/swagger';

export class CatalogItemDetailsResponseDto {
  @ApiProperty()
  externalId!: string;

  @ApiProperty({ required: false })
  referencia?: string;

  @ApiProperty({ required: false })
  descricaoFabrica?: string;

  @ApiProperty({ required: false })
  status?: string;

  @ApiProperty({ required: false })
  unidadeDeMedida?: string;
}
