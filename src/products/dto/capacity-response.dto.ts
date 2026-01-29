import { ApiProperty } from '@nestjs/swagger';

export class CapacityResponseDto {
  @ApiProperty()
  stockTotal!: number;

  @ApiProperty()
  reservedStock!: number;

  @ApiProperty()
  availableStock!: number;
}
