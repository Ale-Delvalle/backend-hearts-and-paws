import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FiltroMascotasPerdidasDto {
  @ApiPropertyOptional({ description: 'Filtrar por estado', enum: ['PERDIDO', 'ENCONTRADO', 'REUNIDO'] })
  @IsString()
  @IsOptional()
  estado?: 'PERDIDO' | 'ENCONTRADO' | 'REUNIDO';

  @ApiPropertyOptional({ description: 'Filtrar por especie / tipo', example: 'Perro' })
  @IsString()
  @IsOptional()
  tipo?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ciudad', example: 'La Plata' })
  @IsString()
  @IsOptional()
  ciudad?: string;

  @ApiPropertyOptional({ description: 'Término de búsqueda libre', example: 'collar rojo' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Número de página', example: 1 })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ description: 'Cantidad de elementos por página', example: 12 })
  @IsOptional()
  limit?: string;
}
