import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/autenticacion/decoradores/trim.decorator';
const xss = require('xss');

export class RevocarReconocimientoDto {
  @ApiPropertyOptional({
    description: 'Motivo opcional de la revocación. No se muestra públicamente, solo se almacena.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Trim()
  @Transform(({ value }) => (typeof value === 'string' ? xss(value) : value))
  @MaxLength(500)
  motivo?: string;
}
