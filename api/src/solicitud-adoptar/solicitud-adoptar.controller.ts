import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  UnauthorizedException
} from '@nestjs/common';
import { SolicitudAdoptarService } from './solicitud-adoptar.service';
import { SolicitudParaAdoptarDto } from './dtos/solicitud-adoptar.dto';
import { CambiarEstadoDto } from './dtos/cambiar-estado.dto';
import { filtroViviendaQdeMascotasDto } from './dtos/filtroViviendaQdeMascotas.dto';
import { EstadoAdopcion } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/autenticacion/guards/roles.guard';
import { Roles } from 'src/autenticacion/decoradores/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { User } from '@supabase/supabase-js';
import { AuthenticateRequest } from 'src/common/interfaces/authenticated-request.interface';

@ApiTags('Solicitudes de Adopción')
@UseGuards(AuthGuard(['jwt-local', 'supabase']))
@Controller('solicitud-adoptar')
export class SolicitudAdoptarController {
  constructor(private readonly solicitudAdoptarService: SolicitudAdoptarService) {}

  @Post()
  @UseGuards(AuthGuard(['jwt-local', 'supabase']))
  @ApiOperation({ summary: 'Crear una nueva solicitud de adopción' })
  @ApiBody({
    type: SolicitudParaAdoptarDto,
    examples: {
      ejemplo: {
        value: {
          usuarioId: 'b2222e9c-22f4-47e1-8fa7-9eabc12def01',
          casoAdopcionId: 'd3333e9c-11e2-4e5f-baf2-8b1234cde567',
          tipoVivienda: 'Apartamento',
          integrantesFlia: 3,
          hijos: 1,
          hayOtrasMascotas: 1,
          descripcionOtrasMascotas: 'Un perro mestizo',
          cubrirGastos: 'Sí',
          darAlimentoCuidados: 'Sí, compro alimento premium',
          darAmorTiempoEj: 'Salimos al parque todos los días',
          devolucionDeMascota: 'Solo si hay una emergencia',
          siNoPodesCuidarla: 'Buscaría ayuda con un familiar',
          declaracionFinal: 'Estoy seguro de mi decisión'
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Solicitud creada correctamente' })
  create(
    @Body() createSolicitudAdoptarDto: SolicitudParaAdoptarDto,
    @Req() req: ExpressRequest & { user: User }
  ) {
    const usuarioId = req.user.id;
    return this.solicitudAdoptarService.crearSolicitud(usuarioId, createSolicitudAdoptarDto);
  }

  @UseGuards(AuthGuard(['jwt-local', 'supabase']), RolesGuard)
  @Roles('ADMIN')
  @Get()
  @ApiOperation({ summary: 'Ver todas las solicitudes, opcionalmente filtradas por estado' })
  @ApiQuery({
    name: 'estado',
    enum: EstadoAdopcion,
    required: false,
    description: 'Filtrar por estado de adopción'
  })
  @ApiResponse({ status: 200, description: 'Lista de solicitudes de adopción' })
  async verTodasLasSolicitudes(@Query('estado') estado: EstadoAdopcion) {
    return this.solicitudAdoptarService.verCasosAdopcionPorEstado(estado);
  }

  @UseGuards(AuthGuard(['jwt-local', 'supabase']), RolesGuard)
  @Roles('ADMIN')
  @Get('aceptadas/total')
  @ApiOperation({ summary: 'Contar el total de solicitudes aceptadas' })
  @ApiResponse({ status: 200, description: 'Cantidad de adopciones aceptadas', schema: { example: { total: 8 } } })
  async contarAceptadas() {
    return await this.solicitudAdoptarService.contarAdopcionesAceptadas();
  }

  @UseGuards(AuthGuard('jwt-local'))
  @Get('/solicitudesDeCadaAdopcion')
  @ApiOperation({ summary: 'Ver solicitudes para un caso de adopción (ONG autenticada)' })
  @ApiResponse({ status: 200, description: 'Solicitudes asociadas a la ONG autenticada' })
  verSolicitudesPorCaso(@Req() req: AuthenticateRequest) {
    const ongId = req.user.id;
    return this.solicitudAdoptarService.verSolicitudesPorCasoDeAdopcion(ongId);
  }

  @Get('filtro')
  @ApiOperation({ summary: 'Filtrar solicitudes por vivienda y tipo de mascota' })
  @ApiQuery({ name: 'casoAdopcionId', type: 'string', required: true })
  @ApiQuery({ name: 'tipoVivienda', type: 'string', required: false })
  @ApiResponse({ status: 200, description: 'Lista filtrada de solicitudes' })
  filtrarSolicitudes(@Query() filtro: filtroViviendaQdeMascotasDto) {
    const { casoAdopcionId, tipoVivienda } = filtro;
    return this.solicitudAdoptarService.filtroViviendaQdeMascotas(casoAdopcionId, tipoVivienda);
  }

  @UseGuards(AuthGuard('jwt-local'))
  @Patch()
  @ApiOperation({ summary: 'Aceptar o cambiar el estado de una solicitud de adopción (solo ONG autenticada)' })
  @ApiBody({
    type: CambiarEstadoDto,
    examples: {
      ejemplo: {
        value: {
          idDelCasoAdopcion: 'd3333e9c-11e2-4e5f-baf2-8b1234cde567',
          idDeSolicitudAceptada: 'a2222e9c-22f4-47e1-8fa7-9eabc12def01',
          estadoNuevo: 'ACEPTADA'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Solicitud actualizada correctamente' })
  async aceptarSolicitud(
    @Req() req: AuthenticateRequest,
    @Body() datos: CambiarEstadoDto
  ) {
    const { idDelCasoAdopcion, idDeSolicitudAceptada, estadoNuevo } = datos;
    if (req.user.tipo !== 'ONG') {
      throw new UnauthorizedException('Solo una organización puede realizar esta acción');
    }
    return this.solicitudAdoptarService.aceptarSolicitud(
      idDelCasoAdopcion,
      idDeSolicitudAceptada,
      estadoNuevo,
      req.user.id,
    );
  }
  

  @Delete(':id')
  @ApiOperation({ summary: 'Borrar una solicitud de adopción' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID de la solicitud' })
  @ApiResponse({ status: 200, description: 'Solicitud eliminada correctamente' })
  borrarSolicitud(@Param('id') id: string) {
    return this.solicitudAdoptarService.borrarSolicitud(id);
  }

  @Get('mis-solicitudes/ids')
  @ApiOperation({ summary: 'Resumen liviano de mis solicitudes (mascota, caso y estado)' })
  @ApiResponse({ status: 200, description: 'Lista de solicitudes del usuario autenticado' })
  async obtenerResumenMisSolicitudes(@Req() req: AuthenticateRequest) {
    return this.solicitudAdoptarService.obtenerResumenMisSolicitudes(req.user.id);
  }

  @Get('yaExisteLaSolicitud/:idCasoAdopcion')
  async verifica(
  @Req() req: ExpressRequest & { user: User },
  @Param('idCasoAdopcion') idCasoAdopcion: string
) {
  const userId = req.user.id
  console.log(userId)
  return this.solicitudAdoptarService.existenciaDeSolicitud(userId, idCasoAdopcion);
}
}
