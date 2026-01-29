import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class FindHoldsByEmailDto {
  @IsEmail()
  @ApiProperty({
    description: 'Email usado para buscar reservas ativas',
    example: 'cliente@nativa.com.br',
  })
  email!: string;
}
