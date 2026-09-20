import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { MascotasPerdidasService } from './mascotas-perdidas.service';
import { CrearMascotaPerdidaDto } from './dto/crear-mascota-perdida.dto';
import { FiltroMascotasPerdidasDto } from './dto/filtro-mascotas-perdidas.dto';
import { ModerarMascotaPerdidaDto } from './dto/moderar-mascota-perdida.dto';
import { RolesGuard } from 'src/autenticacion/guards/roles.guard';
import { AuthOpcionalGuard } from 'src/autenticacion/guards/auth-opcional.guard';
import { Roles } from 'src/autenticacion/decoradores/roles.decorator';
import { AuthenticateRequest } from 'src/common/interfaces/authenticated-request.interface';
import { EstadoPerdida } from '@prisma/client';

@ApiTags('Mascotas Perdidas')
@Controller('mascotas-perdidas')
export class MascotasPerdidasController {
  constructor(private readonly mascotasPerdidasService: MascotasPerdidasService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener listado de mascotas perdidas con filtros y paginación (Público)' })
  @ApiResponse({ status: 200, description: 'Listado de publicaciones de mascotas perdidas.' })
  obtenerTodas(@Query() filtros: FiltroMascotasPerdidasDto) {
    return this.mascotasPerdidasService.obtenerTodas(filtros);
  }

  @UseGuards(AuthGuard(['jwt-local', 'supabase']), RolesGuard)
  @Roles('ADMIN')
  @Get('pendientes')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar publicaciones pendientes de moderación (solo admin)' })
  @ApiResponse({ status: 200, description: 'Listado paginado de publicaciones pendientes.' })
  @ApiResponse({ status: 403, description: 'Requiere rol ADMIN.' })
  obtenerPendientes(@Query() filtros: FiltroMascotasPerdidasDto) {
    return this.mascotasPerdidasService.obtenerPendientes(filtros);
  }

  @UseGuards(AuthGuard(['jwt-local', 'supabase']))
  @Get('mias')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar mis publicaciones con su estado de moderación' })
  @ApiResponse({ status: 200, description: 'Publicaciones del usuario u ONG autenticado.' })
  obtenerMias(@Req() req: AuthenticateRequest) {
    return this.mascotasPerdidasService.obtenerMias(req.user);
  }

  @UseGuards(AuthOpcionalGuard)
  @Get(':id')
  @ApiOperation({
    summary:
      'Obtener detalle de una mascota perdida por ID (Público si está aprobada; autor y admin también ven las no aprobadas)',
  })
  @ApiParam({ name: 'id', required: true, description: 'ID de la publicación' })
  @ApiResponse({ status: 200, description: 'Datos completos de la publicación.' })
  @ApiResponse({ status: 404, description: 'Publicación no encontrada.' })
  obtenerPorId(@Param('id') id: string, @Req() req: AuthenticateRequest) {
    return this.mascotasPerdidasService.obtenerPorId(id, req.user ?? undefined);
  }

  @UseGuards(AuthGuard(['jwt-local', 'supabase']), RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/moderacion')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprobar o rechazar una publicación (solo admin)' })
  @ApiParam({ name: 'id', required: true, description: 'ID de la publicación' })
  @ApiResponse({ status: 200, description: 'Moderación aplicada correctamente.' })
  @ApiResponse({ status: 403, description: 'Requiere rol ADMIN.' })
  @ApiResponse({ status: 404, description: 'Publicación no encontrada.' })
  moderar(@Param('id') id: string, @Body() dto: ModerarMascotaPerdidaDto) {
    return this.mascotasPerdidasService.moderar(id, dto);
  }

  @UseGuards(AuthGuard(['jwt-local', 'supabase']))
  @Post()
  @UseInterceptors(FileInterceptor('imagen'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear publicación de mascota perdida (Usuarios u ONGs autenticados)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', example: 'Milo' },
        tipo: { type: 'string', example: 'Perro' },
        descripcion: { type: 'string', example: 'Se perdió cerca de la plaza.' },
        ubicacion: { type: 'string', example: 'Calle 50 y 12' },
        ciudad: { type: 'string', example: 'La Plata' },
        contacto: { type: 'string', example: '+54 9 221 456-7890' },
        recompensa: { type: 'string', example: '$15.000' },
        estado: { type: 'string', enum: ['PERDIDO', 'ENCONTRADO'], example: 'PERDIDO' },
        fechaPerdido: { type: 'string', example: '2026-09-16' },
        imagen: { type: 'string', format: 'binary' },
      },
      required: ['nombre', 'tipo', 'descripcion', 'ubicacion', 'contacto'],
    },
  })
  @ApiResponse({ status: 201, description: 'Publicación creada exitosamente.' })
  crear(
    @Body() dto: CrearMascotaPerdidaDto,
    @UploadedFile() archivo: Express.Multer.File,
    @Req() req: AuthenticateRequest,
  ) {
    return this.mascotasPerdidasService.crear(dto, archivo, req.user);
  }

  @UseGuards(AuthGuard(['jwt-local', 'supabase']))
  @Patch(':id/estado')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar estado de la publicación (solo el autor o admin)' })
  @ApiParam({ name: 'id', required: true, description: 'ID de la publicación' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        estado: { type: 'string', enum: ['PERDIDO', 'ENCONTRADO', 'REUNIDO'], example: 'REUNIDO' },
      },
      required: ['estado'],
    },
  })
  @ApiResponse({ status: 200, description: 'Estado actualizado correctamente.' })
  @ApiResponse({ status: 403, description: 'No autorizado a modificar esta publicación.' })
  actualizarEstado(
    @Param('id') id: string,
    @Body('estado') estado: EstadoPerdida,
    @Req() req: AuthenticateRequest,
  ) {
    return this.mascotasPerdidasService.actualizarEstado(id, estado, req.user);
  }

  @UseGuards(AuthGuard(['jwt-local', 'supabase']))
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar publicación (solo el autor o admin)' })
  @ApiParam({ name: 'id', required: true, description: 'ID de la publicación' })
  @ApiResponse({ status: 200, description: 'Publicación eliminada correctamente.' })
  @ApiResponse({ status: 403, description: 'No autorizado a eliminar esta publicación.' })
  eliminar(@Param('id') id: string, @Req() req: AuthenticateRequest) {
    return this.mascotasPerdidasService.eliminar(id, req.user);
  }
}
