import { Controller, Post, Param, UseInterceptors, UploadedFile, Body, Get, Patch, UseGuards, Req, ParseUUIDPipe, Res, Query } from '@nestjs/common';
import { OrganizacionesService } from './organizaciones.service';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { filtroArchivoImagen, limits } from 'src/cloudinary/file.interceptor';
import { UpdateOrganizacioneDto } from './dto/update-organizacione.dto';
import { EstadoOrganizacion } from '@prisma/client';
import { RolesGuard } from 'src/autenticacion/guards/roles.guard';
import { Roles } from 'src/autenticacion/decoradores/roles.decorator';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { JwtAutCookiesGuardia } from 'src/autenticacion/guards/jwtAut.guardia';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@ApiTags('Organizaciones')
@Controller('organizaciones')
export class OrganizacionesController {
  constructor(
    private readonly organizacionesService: OrganizacionesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(AuthGuard('jwt-local'), RolesGuard)
  @Roles('ADMIN')
  @Get()
  @ApiOperation({ summary: 'Obtener todas las organizaciones' })
  @ApiResponse({ status: 200, description: 'Lista de organizaciones' })
  async obtenerTodas(@Query() query: any) {
    return this.organizacionesService.listarTodas(query);
  }

  @UseGuards(AuthGuard('jwt-local'), RolesGuard)
  @Roles('ADMIN')
  @Get('aprobadas')
  @ApiOperation({ summary: 'Obtener organizaciones aprobadas' })
  @ApiResponse({ status: 200, description: 'Lista de organizaciones aprobadas' })
  async obtenerAprobadas(@Query() query: any){
    return await this.organizacionesService.listarAprobadas(query);
  }

  @UseGuards(AuthGuard('jwt-local'), RolesGuard)
  @Roles('ADMIN')
  @Get('rechazadas')
  @ApiOperation({ summary: 'Obtener organizaciones rechazadas' })
  @ApiResponse({ status: 200, description: 'Lista de organizaciones rechazadas' })
  async obtenerRechazadas(@Query() query: any){
    return await this.organizacionesService.listarRechazadas(query);
  }

  @UseGuards(AuthGuard('jwt-local'), RolesGuard)
  @Roles('ADMIN')
  @Get('aprobadas/total')
  @ApiOperation({ summary: 'Contar el total de organizaciones aprobadas' })
  @ApiResponse({
    status: 200,
    description: 'Total de organizaciones con estado APROBADA',
    schema: {
      example: { total: 10 }
    }
  })
  async contarOngsAprobadas() {
    return await this.organizacionesService.contarAprobadas();
  }

  @Get('verificar-email/:email')
  @ApiOperation({ summary: 'Verificar si el email ya está registrado por una ONG'})
  async verificarEmailONG(
    @Param('email') email: string
  ){
    const ong = await this.organizacionesService.buscarPorEmail(email);
    return {
      disponible: !ong,
      mensaje: ong ? 'El email ya está registrado por una ONG' : 'El email está disponible',
    };
  }

  
  @Get(':id/perfil')
  @ApiOperation({ summary: 'Obtener perfil público de una organización (nombre, foto, descripción y contadores)' })
  @ApiParam({ name: 'id', type: 'string', description: 'UUID de la organización' })
  @ApiResponse({ status: 200, description: 'Perfil público de la organización' })
  async obtenerPerfilPublico(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizacionesService.obtenerPerfilPublico(id);
  }

  @UseGuards(JwtAutCookiesGuardia)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener organización autenticada' })
  @ApiResponse({ status: 200, description: 'Datos de la organización actual' })
  async getOrganizacionActual(@Req() req){
    return await this.organizacionesService.buscarPorId(req.user.id)
  }

  @UseGuards(AuthGuard('jwt-local'), RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener organización por ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'UUID de la organización' })
  @ApiResponse({ status: 200, description: 'Organización encontrada' })
  async obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizacionesService.buscarPorId(id);
  }

  @UseGuards(JwtAutCookiesGuardia)
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de una organización' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID de la organización a actualizar' })
  @ApiResponse({
    status: 200,
    description: 'Organización actualizada'
  })
  async actualizar(
    @Param('id') id: string,
    @Body() data: UpdateOrganizacioneDto,
    @Req() req,
  ) {
    if (req.user.id !== id) {
      return { error: 'No autorizado'};
    }
    return this.organizacionesService.actualizarDatosOng(id, data);
  }

  @Patch(':id/estado')
  @UseInterceptors(AnyFilesInterceptor())
  @UseGuards(AuthGuard(['jwt-local', 'supabase']), RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar estado de una organización (solo ADMIN)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  async cambiarEstado(
    @Param('id') id: string,
    @Body('estado') estado: EstadoOrganizacion
  ){
    return this.organizacionesService.actualizarEstado(id, estado);
  }

  @UseGuards(JwtAutCookiesGuardia)
  @Post(':id/foto')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: filtroArchivoImagen,
    limits: limits
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir foto de perfil de la organización' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Foto de perfil actualizada' })
  async subirFotoPerfil(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ){
    if (req.user.id !== id) {
      return { error: 'No autorizado'};
    }
    const subirImagen = await this.cloudinaryService.subirIamgen(file);
    return this.organizacionesService.actualizarFotoPerfil(id, subirImagen.secure_url);
  }

  @UseGuards(AuthGuard(['jwt-local', 'supabase']), RolesGuard)
  @Roles('ADMIN')
  @Get(':id/archivo-verificacion')
  @ApiOperation({ summary: 'Obtener el archivo PDF de verificación de la organización (solo ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID de la organización' })
  @ApiResponse({
    status: 200,
    description: 'Archivo PDF de verificación de la organización (se devuelve como stream)',
    schema: {
      type: 'string',
      format: 'binary',
      example: 'application/pdf'
    }
  })
  async obtenerArchivoPdf(@Param('id') id: string, @Res() res: Response) {
    return this.organizacionesService.servirArchivoVerificacion(id, res);
  }
}
