import { ApiProperty } from '@nestjs/swagger';
import { HoldWithProductResponseDto } from './hold-with-product-response.dto';

export class FindHoldsByEmailResponseDto {
  @ApiProperty({ type: HoldWithProductResponseDto, isArray: true })
  holds!: HoldWithProductResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty({ required: false })
  message?: string;
}
