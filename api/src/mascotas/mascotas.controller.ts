import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Req,
  UnauthorizedException
} from '@nestjs/common';
import { MascotasService } from './mascotas.service';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { UpdateEstadoMascotaDto } from './dto/update-estado-mascota.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiBearerAuth
} from '@nestjs/swagger';
import { TipoMascotaDto } from './dto/tipoMascota.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/autenticacion/guards/roles.guard';
import { Roles } from 'src/autenticacion/decoradores/roles.decorator';
import { AuthenticateRequest } from 'src/common/interfaces/authenticated-request.interface';


@ApiTags('Mascotas')
@Controller('mascotas')
export class MascotasController {
  constructor(private readonly mascotasService: MascotasService) {}



  @UseGuards(AuthGuard(['jwt-local', 'supabase']), RolesGuard)
  @Roles('ADMIN')
  @Get()
  @ApiOperation({ summary: 'Obtener todas las mascotas (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de todas las mascotas.' })
  GetMascotas() {
    return this.mascotasService.GetMascotas();
  }


  @UseGuards(AuthGuard('jwt-local'))
  @Get('mascotas-por-ong-adopcion')
  @ApiOperation({ summary: 'Obtener mascotas en adopción de mi ONG autenticada' })
  @ApiResponse({ status: 200, description: 'Lista de mascotas en adopción de la ONG autenticada.' })
  listaDeMascotasEnAdopcionPorOng(@Req() req: AuthenticateRequest) {
    const ongId = req.user.id;
    return this.mascotasService.mascotasEnAdopcionPorOng(ongId);
  }

  @UseGuards(AuthGuard(['jwt-local', 'supabase']), RolesGuard)
  @Roles('ADMIN')
  @Get('total')
  @ApiOperation({ summary: 'Contar el total de mascotas (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Total de mascotas.' })
  async contarTotalMascotas() {
    return await this.mascotasService.contarMascotas();
  }


  @Get('tipo')
  @ApiOperation({ summary: 'Obtener todos los tipos de mascotas' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de mascotas.' })
  GetTiposMascotas() {
    return this.mascotasService.GetTipo();
  }


  @UseGuards(AuthGuard('jwt-local'))
  @Get('ong')
  @ApiOperation({ summary: 'Obtener mascotas de mi ONG autenticada' })
  @ApiResponse({ status: 200, description: 'Mascotas asociadas a la ONG autenticada.' })
  GetMascotasByOngId(@Req() req: AuthenticateRequest) {
    const ongId = req.user.id;
    return this.mascotasService.GetMascotasByOngId(ongId);
  }

  @Get(':id/perfil')
  @ApiOperation({ summary: 'Obtener el perfil público completo de una mascota: imágenes, tipo, ONG dueña y su historial de casos' })
  @ApiParam({ name: 'id', required: true, description: 'ID de la mascota', example: 'b6985ee8-9802-497c-97b4-1a43843a3c1f' })
  @ApiResponse({ status: 200, description: 'Perfil completo de la mascota.' })
  @ApiResponse({ status: 404, description: 'Mascota no encontrada.' })
  obtenerPerfil(@Param('id') id: string) {
    return this.mascotasService.obtenerPerfil(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una mascota por ID' })
  @ApiParam({ name: 'id', required: true, description: 'ID de la mascota', example: 'b6985ee8-9802-497c-97b4-1a43843a3c1f' })
  @ApiResponse({ status: 200, description: 'Datos de la mascota encontrada.' })
  GetMascotaById(@Param('id') id: string) {
    return this.mascotasService.GetMascotaById(id);
  }

  @UseGuards(AuthGuard(['jwt-local', 'supabase']), RolesGuard)
  @Roles('ADMIN')
  @Post('crearTipo')
  @ApiOperation({ summary: 'Crear un tipo de mascota (ADMIN)' })
  @ApiBody({
    type: TipoMascotaDto,
    examples: {
      ejemplo: {
        value: { nombre: 'Perro' }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Tipo de mascota creado correctamente.' })
  @UseGuards(AuthGuard(['jwt-local', 'supabase']), RolesGuard)
  @Post("crearTipo")
  CreateTipoMascota(@Body() createTipoMascotaDto: TipoMascotaDto) {
    return this.mascotasService.CreateTipoMascota(createTipoMascotaDto);
  }

  @UseGuards(AuthGuard('jwt-local'))
  @Post()
  @ApiOperation({ summary: 'Crear una nueva mascota (ONG autenticada)' })
  @ApiBody({
    type: CreateMascotaDto,
    examples: {
      ejemplo: {
        value: {
          nombre: 'Rocky',
          edad: 2,
          descripcion: 'Perro enérgico y sociable',
          organizacionId: '7f83a2d5-9f14-40ae-a8b6-fde39cfb0032',
          tipoId: 'b6385ee8-1111-2222-3333-1a43843a3c1f'
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Mascota creada correctamente.' })
  CreateMascota(
    @Req() req: AuthenticateRequest,
    @Body() createMascotaDto: CreateMascotaDto
  ) {
    const ongId = req.user.id;
    return this.mascotasService.CreateMascota(createMascotaDto, ongId);
  }

  @UseGuards(AuthGuard('jwt-local'))
  @Post('tipo')
  @ApiOperation({ summary: 'Crear un tipo de mascota (ONG autenticada)' })
  @ApiBody({
    type: TipoMascotaDto,
    examples: {
      ejemplo: {
        value: { nombre: 'Gato' }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Tipo de mascota creado correctamente.' })
  crearTipoDeMascota(
    @Body() datos: TipoMascotaDto,
    @Req() req: AuthenticateRequest
  ) {
    const { nombre } = datos;
    return this.mascotasService.crearTipoDeMascota(nombre);
  }

  @UseGuards(AuthGuard('jwt-local'))
  @Patch(':id/estado')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar el estado de una mascota (solo la ONG dueña)' })
  @ApiParam({ name: 'id', required: true, description: 'ID de la mascota' })
  @ApiBody({ type: UpdateEstadoMascotaDto })
  @ApiResponse({ status: 200, description: 'Estado actualizado correctamente.' })
  @ApiResponse({ status: 403, description: 'No autorizado a modificar esta mascota.' })
  @ApiResponse({ status: 404, description: 'Mascota no encontrada.' })
  async actualizarEstado(
    @Param('id') id: string,
    @Body() dto: UpdateEstadoMascotaDto,
    @Req() req: AuthenticateRequest,
  ) {
    if (req.user.tipo !== 'ONG') {
      throw new UnauthorizedException('Solo una organización puede modificar el estado de una mascota.');
    }
    return this.mascotasService.actualizarEstado(id, dto.estado, req.user.id);
  }

  // ONG autenticada: Subir imágenes
  @UseGuards(AuthGuard('jwt-local'))
  @Post(':id/imagenes')
  @UseInterceptors(FilesInterceptor('imagenes'))
  @ApiOperation({ summary: 'Subir imágenes para una mascota (ONG autenticada)' })
  @ApiParam({ name: 'id', required: true, description: 'ID de la mascota', example: 'b6985ee8-9802-497c-97b4-1a43843a3c1f' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        imagenes: {
          type: 'array',
          items: { type: 'string', format: 'binary' }
        }
      }
    },
    examples: {
      ejemplo: {
        value: {
          imagenes: ['(binary file)', '(binary file)']
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Imágenes subidas correctamente.' })
  async subirImagenes(
    @Param('id') mascotaId: string,
    @UploadedFiles() archivos: Express.Multer.File[],
    @Req() req: AuthenticateRequest
  ) {
    const ongId = req.user.id;
    return this.mascotasService.SubirImagenes(mascotaId, archivos, ongId);
  }
}
