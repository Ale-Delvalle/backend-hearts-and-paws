import { IsEmail, IsEnum, IsString, IsStrongPassword, IsNotEmpty, MinLength, MaxLength, Matches } from "class-validator";
import { Transform } from "class-transformer";
const xss = require('xss');
import { Trim } from "src/autenticacion/decoradores/trim.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { Genero } from "@prisma/client";

export class NuevoUsuarioDto {

    @ApiProperty({
    example: 'Carlos Pérez',
    description: 'Nombre completo del usuario. Solo puede contener letras y espacios.',
    maxLength: 50,
    })
    @IsNotEmpty()
    @IsString()
    @Matches(/^[A-Za-zÀ-ÿ\s]+$/, { message: 'El nombre solo puede contener letras y espacios' })
    @Transform(({ value }) => xss(value))
    @MaxLength(50)
    nombre: string;


    @ApiProperty({
    example: 'usuario123@email.com',
    description: 'Correo electrónico válido. Solo se permite un "@" y letras, números, ".", "_" o "-".',
    maxLength: 60,
    })
    @IsNotEmpty()
    @IsEmail()
    @Matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$/, {
    message: 'Email: solo se permite un "@" y letras, números, ".", "_" o "-"',})
    @Trim()
    @Transform(({ value }) => value.toLowerCase())
    @MaxLength(60)
    email: string;


    @ApiProperty({
    example: 'ClaveSegura#2024',
    description:
    'Contraseña segura que debe tener al menos 1 letra mayúscula, 1 minúscula, 1 número y 1 símbolo.',
    minLength: 8,
    maxLength: 40,
    })
    @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => xss(value))
    @MinLength(8)
    @MaxLength(40)
        @IsStrongPassword({
        minUppercase:1,
        minLowercase:1,
        minNumbers:1,
        minSymbols:1
    })
    contrasena: string;


    @ApiProperty({
    example: '3001234567',
    description: 'Número de teléfono del usuario. Solo debe contener dígitos.',
    maxLength: 20,
    })
    @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => xss(value))
    @Trim()
    @Transform(({ value }) => value.replace(/\D/g, ''))
    @MaxLength(20)
    telefono: string;


    @ApiProperty({
    example: 'Calle 45 #67-89, Apto 302',
    description:
    'Dirección física del usuario. Solo se permiten letras, números, espacios, puntos, comas, guiones y guiones bajos.',
    maxLength: 70,
    })
    @IsNotEmpty()
    @IsString()
    @Matches(/^[a-zA-Z0-9.,_\-\s]+$/, {
    message: 'Dirección: solo se permiten letras, números, espacios, puntos, comas, guiones medios, guiones bajos.',
})

    @MaxLength(70)
    direccion: string;


    @ApiProperty({
    example: 'Medellín',
    description: 'Ciudad donde reside el usuario. Solo se permiten letras, números y espacios.',
    maxLength: 25,
    })
    @IsNotEmpty()
    @IsString()
    @Matches(/^[A-Za-z0-9 ]+$/, {
    message: 'Ciudad:Solo se permiten letras, números y espacios',
})
    @MaxLength(25)
    ciudad: string;


    @ApiProperty({
    example: 'Colombia',
    description: 'País de residencia. Solo letras y números, sin espacios.',
    maxLength: 25,
    })
    @IsNotEmpty()
    @MaxLength(25)
    @IsString()
    @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'Pais: solo se permiten letras y números',
})
    pais: string;


    @ApiProperty({
    example: 'FEMENINO',
    description: 'Sexo del usuario.',
    enum: Genero,
    })
    @IsNotEmpty()
    @IsEnum(Genero, { message: 'Sexo: debe ser FEMENINO o MASCULINO' })
    genero: Genero;
}