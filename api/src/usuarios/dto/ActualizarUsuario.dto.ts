import {
  IsEmail,
  IsString,
  IsStrongPassword,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEnum
} from "class-validator";
import { Transform } from "class-transformer";
const xss = require('xss');
import { Trim } from "src/autenticacion/decoradores/trim.decorator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Genero, Rol } from "@prisma/client";

export class ActualizarUsuarioDTO {
  @IsOptional()
  @ApiPropertyOptional({
    example: 'usuario123@email.com',
    description: 'Correo electrónico válido.',
    maxLength: 60,
  })
  @IsEmail()
  @Trim()
  @Transform(({ value }) => value.toLowerCase())
  @MaxLength(60)
  email?: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: 'ClaveSegura#2024',
    description: 'Contraseña con al menos 1 mayúscula, 1 minúscula, 1 número y 1 símbolo.',
    minLength: 8,
    maxLength: 40,
  })
  @IsString()
  @Transform(({ value }) => xss(value))
  @MinLength(8)
  @MaxLength(40)
  @IsStrongPassword({
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1
  })
  contrasena?: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: '3001234567',
    description: 'Número de teléfono del usuario.',
    maxLength: 20,
  })
  @IsString()
  @Transform(({ value }) => xss(value))
  @Trim()
  @Transform(({ value }) => value.replace(/\D/g, ''))
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: 'Calle 45 #67-89, Apto 302',
    description: 'Dirección física del usuario.',
    maxLength: 70,
  })
  @IsString()
  @Transform(({ value }) => xss(value))
  @MaxLength(70)
  direccion?: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: 'Bogotá',
    description: 'Ciudad donde reside el usuario.',
    maxLength: 25,
  })
  @IsString()
  @Transform(({ value }) => xss(value))
  @Matches(/^[\p{L}0-9 .,'-]+$/u, {
    message: 'Ciudad: Solo se permiten letras, números y algunos caracteres como . , \' -',
  })
  @MaxLength(25)
  ciudad?: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: 'Colombia',
    description: 'País de residencia.',
    maxLength: 25,
  })
  @IsString()
  @Transform(({ value }) => xss(value))
  @Matches(/^[\p{L}0-9 ]+$/u, {
    message: 'País: Solo se permiten letras, números y espacios',
  })
  @MaxLength(25)
  pais?: string;

  @IsOptional()
  @ApiPropertyOptional({
    enum: Genero,
    example: 'FEMENINO',
    description: 'Género del usuario (MASCULINO o FEMENINO).',
  })
  @IsEnum(Genero)
  genero?: Genero;

  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;
}
