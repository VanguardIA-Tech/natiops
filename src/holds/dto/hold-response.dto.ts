import { ApiProperty } from '@nestjs/swagger';
import { HoldStatus } from '@prisma/client';

export class HoldResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty({ type: 'string', format: 'date-time' })
  expiresAt!: Date;

  @ApiProperty({ enum: HoldStatus })
  status!: HoldStatus;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt!: Date;
}
