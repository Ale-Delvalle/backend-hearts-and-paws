import { IsString, IsOptional, IsUUID, IsEnum, IsInt, IsNumber, MaxLength } from 'class-validator'
import { Transform } from 'class-transformer';
import { EstadoAdopcion } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from 'src/autenticacion/decoradores/trim.decorator';
const xss = require('xss');

const sanitizarTexto = () =>
  Transform(({ value }) => (typeof value === 'string' ? xss(value) : value));

export class SolicitudParaAdoptarDto {

  @ApiProperty({
    description: 'ID del caso de adopción al que se aplica',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  casoAdopcionId: string;

  @ApiProperty({
    description: 'Estado actual de la solicitud de adopción',
    enum: EstadoAdopcion,
    required: false,
    example: EstadoAdopcion.PENDIENTE
  })
  @IsEnum(EstadoAdopcion)
  @IsOptional()
  estado?: EstadoAdopcion;

  @ApiProperty({
    description: 'Tipo de vivienda donde reside el solicitante (casa, apartamento, etc.)',
    example: 'casa'
  })
  @IsString()
  @Trim()
  @sanitizarTexto()
  @MaxLength(500)
  tipoVivienda: string;

  @ApiProperty({
    description: 'Cantidad total de integrantes en la familia',
    example: 4
  })
  @IsInt()
  integrantesFlia: number;

  @ApiProperty({
    description: 'Cantidad de hijos en la familia',
    example: 2,
    required: false
  })
  @IsInt()
  @IsOptional()
  hijos: number;

  @ApiProperty({
    description: 'Cantidad de otras mascotas presentes en el hogar',
    example: 1
  })
  @IsNumber()
  hayOtrasMascotas: number;

  @ApiProperty({
    description: 'Descripción breve de otras mascotas (si existen)',
    example: 'Un perro y un gato',
    required: false
  })
  @IsString()
  @IsOptional()
  @Trim()
  @sanitizarTexto()
  @MaxLength(500)
  descripcionOtrasMascotas?: string;

  @ApiProperty({
    description: '¿El solicitante puede cubrir los gastos de la mascota?',
    example: 'Sí'
  })
  @IsString()
  @Trim()
  @sanitizarTexto()
  @MaxLength(500)
  cubrirGastos: string;

  @ApiProperty({
    description: 'Frecuencia y tipo de alimentación y cuidados que proporcionará',
    example: 'Comida dos veces al día y paseos diarios'
  })
  @IsString()
  @Trim()
  @sanitizarTexto()
  @MaxLength(500)
  darAlimentoCuidados: string;

  @ApiProperty({
    description: 'Cantidad de tiempo y dedicación que dará a la mascota para amor y ejercicio',
    example: '2 horas al día de juego y paseo'
  })
  @IsString()
  @Trim()
  @sanitizarTexto()
  @MaxLength(500)
  darAmorTiempoEj: string;

  @ApiProperty({
    description: '¿Qué haría en caso de tener que devolver la mascota?',
    example: 'Buscaría una nueva familia responsable'
  })
  @IsString()
  @Trim()
  @sanitizarTexto()
  @MaxLength(500)
  devolucionDeMascota: string;

  @ApiProperty({
    description: 'Acción que tomaría si no puede cuidar más de la mascota',
    example: 'Contactaría a la organización para ayuda'
  })
  @IsString()
  @Trim()
  @sanitizarTexto()
  @MaxLength(1000)
  siNoPodesCuidarla: string;

  @ApiProperty({
    description: 'Declaración final de compromiso por parte del solicitante',
    example: 'Me comprometo totalmente a cuidar de la mascota'
  })
  @IsString()
  @Trim()
  @sanitizarTexto()
  @MaxLength(1000)
  declaracionFinal: string;
}
