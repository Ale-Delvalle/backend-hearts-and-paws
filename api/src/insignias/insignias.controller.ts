import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InsigniasService } from './insignias.service';
import { OtorgarInsigniaDto } from './dto/otorgar-insignia.dto';
import { AuthenticateRequest } from 'src/common/interfaces/authenticated-request.interface';

function exigirOng(req: AuthenticateRequest): string {
  if (req.user.tipo !== 'ONG') {
    throw new ForbiddenException('Solo las organizaciones pueden gestionar insignias.');
  }
  return req.user.id;
}

@ApiTags('Insignias')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt-local'))
@Controller('insignias')
export class InsigniasController {
  constructor(private readonly insigniasService: InsigniasService) {}

  @Get('usuarios')
  @ApiOperation({ summary: 'Buscar usuarios por nombre o email para otorgarles una insignia (solo ONG)' })
  @ApiQuery({ name: 'q', required: true, description: 'Texto a buscar (mínimo 3 caracteres)' })
  @ApiResponse({ status: 200, description: 'Hasta 10 usuarios coincidentes.' })
  @ApiResponse({ status: 400, description: 'Búsqueda demasiado corta.' })
  @ApiResponse({ status: 403, description: 'Solo ONG.' })
  buscarUsuarios(@Query('q') q: string, @Req() req: AuthenticateRequest) {
    exigirOng(req);
    return this.insigniasService.buscarUsuarios(q);
  }

  @Get()
  @ApiOperation({ summary: 'Listar las insignias otorgadas por mi organización (solo ONG)' })
  @ApiResponse({ status: 200, description: 'Insignias otorgadas, con datos del usuario.' })
  listar(@Req() req: AuthenticateRequest) {
    return this.insigniasService.listarDeOng(exigirOng(req));
  }

  @Post()
  @ApiOperation({ summary: 'Otorgar una insignia a un usuario (solo ONG)' })
  @ApiResponse({ status: 201, description: 'Insignia otorgada (idempotente si ya la tenía).' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  otorgar(@Body() dto: OtorgarInsigniaDto, @Req() req: AuthenticateRequest) {
    return this.insigniasService.otorgar(exigirOng(req), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revocar una insignia otorgada por mi organización (solo ONG)' })
  @ApiParam({ name: 'id', required: true, description: 'ID de la insignia' })
  @ApiResponse({ status: 200, description: 'Insignia revocada.' })
  @ApiResponse({ status: 403, description: 'La insignia pertenece a otra organización.' })
  @ApiResponse({ status: 404, description: 'Insignia no encontrada.' })
  revocar(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticateRequest) {
    return this.insigniasService.revocar(exigirOng(req), id);
  }
}
