import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoMascota } from '@prisma/client';

export class UpdateEstadoMascotaDto {
  @ApiProperty({
    description: 'Nuevo estado de la mascota',
    enum: EstadoMascota,
    example: EstadoMascota.ADOPTADO,
  })
  @IsEnum(EstadoMascota)
  @IsNotEmpty()
  estado: EstadoMascota;
}
