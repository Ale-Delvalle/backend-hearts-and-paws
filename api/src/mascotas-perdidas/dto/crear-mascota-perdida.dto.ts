import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearMascotaPerdidaDto {
  @ApiProperty({ description: 'Nombre de la mascota o referencia', example: 'Milo' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Tipo o especie del animal', example: 'Perro' })
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({
    description: 'Descripción detallada de la mascota y señas particulares',
    example: 'Tiene collar rojo, manchas blancas en el pecho y responde a su nombre.',
  })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'Lugar o barrio donde se perdió o fue visto', example: 'Plaza Belgrano, La Plata' })
  @IsString()
  @IsNotEmpty()
  ubicacion: string;

  @ApiPropertyOptional({ description: 'Ciudad o localidad', example: 'La Plata' })
  @IsString()
  @IsOptional()
  ciudad?: string;

  @ApiProperty({ description: 'Teléfono o WhatsApp de contacto', example: '+54 9 11 1234-5678' })
  @IsString()
  @IsNotEmpty()
  contacto: string;

  @ApiPropertyOptional({ description: 'Recompensa ofrecida si aplica', example: '$20.000' })
  @IsString()
  @IsOptional()
  recompensa?: string;

  @ApiPropertyOptional({
    description: 'Estado inicial del caso: PERDIDO o ENCONTRADO',
    example: 'PERDIDO',
    enum: ['PERDIDO', 'ENCONTRADO', 'REUNIDO'],
  })
  @IsString()
  @IsOptional()
  estado?: 'PERDIDO' | 'ENCONTRADO' | 'REUNIDO';

  @ApiPropertyOptional({ description: 'Fecha en que se extravió o fue visto', example: '2026-09-15' })
  @IsString()
  @IsOptional()
  fechaPerdido?: string;
}
