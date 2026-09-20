import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';

export class ModerarMascotaPerdidaDto {
  @ApiProperty({ description: 'Decisión de moderación', enum: ['APROBADA', 'RECHAZADA'], example: 'APROBADA' })
  @IsNotEmpty()
  @IsIn(['APROBADA', 'RECHAZADA'])
  moderacion: 'APROBADA' | 'RECHAZADA';
}
