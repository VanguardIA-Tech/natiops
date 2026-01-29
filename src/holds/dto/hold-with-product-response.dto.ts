import { ApiProperty } from '@nestjs/swagger';

export class HoldWithProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  expiresAt!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  product!: Record<string, unknown>;
}
