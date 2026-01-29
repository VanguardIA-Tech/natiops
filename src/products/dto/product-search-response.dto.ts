import { ApiProperty } from '@nestjs/swagger';

export class ProductSearchResponseDto {
  @ApiProperty()
  externalId!: string;

  @ApiProperty()
  nome!: string;
}
