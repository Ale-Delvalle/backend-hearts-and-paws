import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { TipoInsignia } from '@prisma/client';

export class OtorgarInsigniaDto {
  @ApiProperty({ description: 'ID del usuario que recibe la insignia', example: '3f2b8c1e-6a4d-4c39-9d5e-0a1b2c3d4e5f' })
  @IsUUID()
  usuarioId: string;

  @ApiProperty({ description: 'Tipo de insignia', enum: TipoInsignia, example: 'TRANSITO' })
  @IsEnum(TipoInsignia)
  tipo: TipoInsignia;
}
